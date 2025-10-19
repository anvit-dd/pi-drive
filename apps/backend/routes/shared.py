import asyncio
from base64 import b64decode
import io
import json
import os
import zipfile
import mimetypes
from tempfile import NamedTemporaryFile
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Response
from starlette.responses import JSONResponse, StreamingResponse, FileResponse
from pathlib import Path
from PIL import Image
import fitz

from config import BASE_PATH, VIDEO_FORMATS
from utils import (
    list_number_of_items,
    sort_dir_items,
    verify_incoming_path,
)
from crypto_utils import (
    decrypt_stream,
    get_plaintext_size,
    decrypt_to_bytes,
    is_encrypted_file,
    decrypt_stream_range,
)

router = APIRouter(prefix="/share")


@router.get("/contents")
async def get_shared_directory_contents(user_id: str, item_path: str, req: Request):
    try:
        user_folder = BASE_PATH / user_id

        if not verify_incoming_path(user_folder, Path(item_path)):
            raise HTTPException(status_code=403, detail="Access denied!")

        folder_path = user_folder / item_path
        
        if not folder_path.exists():
            raise HTTPException(status_code=404, detail="Shared item not found")
        
        if folder_path.is_file():
            return [{
                "id": str(folder_path.relative_to(str(user_folder))),
                "order_no": 0,
                "name": folder_path.name,
                "is_dir": False,
                "extension": folder_path.suffix,
                "created_at": folder_path.stat().st_ctime,
                "accessed_at": folder_path.stat().st_atime,
                "size": get_plaintext_size(folder_path),
                "no_items": -1
            }]
        
        if not folder_path.is_dir():
            raise HTTPException(status_code=404, detail="Shared directory not found")
        
        def list_dir():
            with os.scandir(folder_path) as entries:
                return [
                    {
                        "id": str(Path(entry.path).relative_to(str(user_folder))),
                        "order_no": i,
                        "name": entry.name,
                        "is_dir": entry.is_dir(),
                        "extension": Path(entry.name).suffix,
                        "created_at": entry.stat().st_ctime,
                        "accessed_at": entry.stat().st_atime,
                        "size": (
                            get_plaintext_size(Path(entry.path))
                            if entry.is_file()
                            else entry.stat().st_size
                        ),
                        "no_items": list_number_of_items(entry) if entry.is_dir() else -1
                    }
                    for i, entry in enumerate(entries)
                ]

        contents = await asyncio.to_thread(list_dir)
        contents = sort_dir_items(contents)
        
        return contents

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching shared directory contents: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/download")
async def download_shared_items(user_id: str, id: str, req: Request):
    try:
        if not id:
            raise HTTPException(status_code=400, detail="Invalid id provided!")

        parent_path = BASE_PATH / user_id

        try:
            decoded = b64decode(id).decode("utf-8")
            item_paths = json.loads(decoded)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode download ID.")

        if not item_paths:
            raise HTTPException(status_code=400, detail="No items specified!")

        for itm in item_paths:
            is_valid = verify_incoming_path(parent_path, Path(itm["id"]))
            if not is_valid:
                raise HTTPException(status_code=403, detail="Access denied!")

        if len(item_paths) == 1:
            to_download_item = item_paths[0]
            download_item_path = parent_path / Path(to_download_item["id"])

            if not download_item_path.exists():
                raise HTTPException(status_code=404, detail="Path not found.")

            if bool(to_download_item["is_dir"]):
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
                    for path in download_item_path.rglob("*"):
                        if path.is_file():
                            arc = str(path.relative_to(download_item_path))
                            if is_encrypted_file(path):
                                with zipf.open(arc, "w") as dest:
                                    for chunk in decrypt_stream(path):
                                        dest.write(chunk)
                            else:
                                zipf.write(path, arcname=arc)
                zip_buffer.seek(0)
                content_length = len(zip_buffer.getvalue())
                return StreamingResponse(
                    zip_buffer,
                    media_type="application/zip",
                    headers={
                        "Content-Disposition": f'attachment; filename="{to_download_item["name"]}.zip"',
                        "X-Total-Size": str(content_length),
                        "Content-Length": str(content_length),
                    },
                )
                
            else:
                logical_size = get_plaintext_size(download_item_path)

                def iter_decrypted():
                    for chunk in decrypt_stream(download_item_path):
                        yield chunk

                return StreamingResponse(
                    iter_decrypted(),
                    media_type="application/octet-stream",
                    headers={
                        "Content-Disposition": f'attachment; filename="{to_download_item["name"]}"',
                        "Content-Length": str(logical_size),
                        "X-Total-Size": str(logical_size),
                    }
                )

        else:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
                for to_download_item in item_paths:
                    download_item_path = parent_path / Path(to_download_item["id"])

                    if not download_item_path.exists():
                        raise HTTPException(status_code=404, detail=f"Path not found: {to_download_item['id']}")

                    if to_download_item["is_dir"]:
                        for path in download_item_path.rglob("*"):
                            if path.is_file():
                                arc = str(Path(to_download_item["name"]) / path.relative_to(download_item_path))
                                if is_encrypted_file(path):
                                    with zipf.open(arc, "w") as dest:
                                        for chunk in decrypt_stream(path):
                                            dest.write(chunk)
                                else:
                                    zipf.write(path, arcname=arc)
                    else:
                        if is_encrypted_file(download_item_path):
                            with zipf.open(str(to_download_item["name"]), "w") as dest:
                                for chunk in decrypt_stream(download_item_path):
                                    dest.write(chunk)
                        else:
                            zipf.write(download_item_path, arcname=str(to_download_item["name"]))
            zip_buffer.seek(0)
            content_length = len(zip_buffer.getvalue())
            return StreamingResponse(
                zip_buffer,
                media_type="application/zip",
                headers={
                    "Content-Disposition": f'attachment; filename="{item_paths[0]["name"]}.zip"',
                    "Content-Length": str(content_length),
                    "X-Total-Size": str(content_length),
                },
            )

    except HTTPException:   
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.head("/download")
async def download_shared_items_head(user_id: str, id: str, req: Request):
    try:
        if not id:
            raise HTTPException(status_code=400, detail="Invalid id provided!")

        parent_path = BASE_PATH / user_id

        try:
            decoded = b64decode(id).decode("utf-8")
            item_paths = json.loads(decoded)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode download ID.")

        if not item_paths:
            raise HTTPException(status_code=400, detail="No items specified!")

        for itm in item_paths:
            is_valid = verify_incoming_path(parent_path, Path(itm["id"]))
            if not is_valid:
                raise HTTPException(status_code=403, detail="Access denied!")

        if len(item_paths) == 1:
            to_download_item = item_paths[0]
            download_item_path = parent_path / Path(to_download_item["id"])

            if not download_item_path.exists():
                raise HTTPException(status_code=404, detail="Path not found.")

            if bool(to_download_item["is_dir"]):
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
                    for path in download_item_path.rglob("*"):
                        if path.is_file():
                            arc = str(path.relative_to(download_item_path))
                            if is_encrypted_file(path):
                                with zipf.open(arc, "w") as dest:
                                    for chunk in decrypt_stream(path):
                                        dest.write(chunk)
                            else:
                                zipf.write(path, arcname=arc)
                zip_buffer.seek(0, io.SEEK_END)
                content_length = zip_buffer.tell()
                headers = {
                    "Content-Disposition": f'attachment; filename="{to_download_item["name"]}.zip"',
                    "X-Total-Size": str(content_length),
                    "Content-Length": str(content_length),
                }
                zip_buffer.close()
                return Response(status_code=200, headers=headers)

            logical_size = get_plaintext_size(download_item_path)
            headers = {
                "Content-Disposition": f'attachment; filename="{to_download_item["name"]}"',
                "Content-Length": str(logical_size),
                "X-Total-Size": str(logical_size),
            }
            return Response(status_code=200, headers=headers)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
            for to_download_item in item_paths:
                download_item_path = parent_path / Path(to_download_item["id"])

                if not download_item_path.exists():
                    raise HTTPException(status_code=404, detail=f"Path not found: {to_download_item['id']}")

                if to_download_item["is_dir"]:
                    for path in download_item_path.rglob("*"):
                        if path.is_file():
                            arc = str(Path(to_download_item["name"]) / path.relative_to(download_item_path))
                            if is_encrypted_file(path):
                                with zipf.open(arc, "w") as dest:
                                    for chunk in decrypt_stream(path):
                                        dest.write(chunk)
                            else:
                                zipf.write(path, arcname=arc)
                else:
                    if is_encrypted_file(download_item_path):
                        with zipf.open(str(to_download_item["name"]), "w") as dest:
                            for chunk in decrypt_stream(download_item_path):
                                dest.write(chunk)
                    else:
                        zipf.write(download_item_path, arcname=str(to_download_item["name"]))
        zip_buffer.seek(0, io.SEEK_END)
        content_length = zip_buffer.tell()
        headers = {
            "Content-Disposition": f'attachment; filename="{item_paths[0]["name"]}.zip"',
            "Content-Length": str(content_length),
            "X-Total-Size": str(content_length),
        }
        zip_buffer.close()
        return Response(status_code=200, headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stream")
async def stream_shared_media(path: str, user_id: str, req: Request = None):
    try:
        parent_path = BASE_PATH / user_id
        full_file_path = parent_path / path

        if not full_file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        is_verified = verify_incoming_path(parent_path, Path(path))
        if not is_verified:
            raise HTTPException(status_code=403, detail="Access denied!")

        file_size = (
            get_plaintext_size(full_file_path)
            if is_encrypted_file(full_file_path)
            else os.path.getsize(full_file_path)
        )
        range_header = req.headers.get("Range") if req else None

        content_type, _ = mimetypes.guess_type(str(full_file_path))
        if content_type is None:
            content_type = "application/octet-stream"

        if range_header:
            range_value = range_header.strip().lower().replace("bytes=", "")
            range_start, range_end = range_value.split("-")
            range_start = int(range_start)
            range_end = int(range_end) if range_end else file_size - 1
        else:
            range_start = 0
            range_end = file_size - 1

        if range_start >= file_size:
            raise HTTPException(status_code=416, detail="Requested range not satisfiable")

        def iter_file(start, end):
            if is_encrypted_file(full_file_path):
                for chunk in decrypt_stream_range(full_file_path, start, end):
                    yield chunk
            else:
                with open(full_file_path, "rb") as f:
                    f.seek(start)
                    bytes_to_read = end - start + 1
                    while bytes_to_read > 0:
                        chunk_size = min(1024 * 1024, bytes_to_read)
                        data = f.read(chunk_size)
                        if not data:
                            break
                        bytes_to_read -= len(data)
                        yield data

        headers = {
            "Content-Range": f"bytes {range_start}-{range_end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(range_end - range_start + 1),
            "Content-Type": content_type,
        }

        return StreamingResponse(iter_file(range_start, range_end), status_code=206, headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error streaming shared file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("/thumbnails")
async def get_shared_thumbnail(path: str, user_id: str, linkId: str, password: str = None, req: Request = None, background_tasks: BackgroundTasks = None):
    try:
        parent_path = BASE_PATH / user_id
        full_file_path = parent_path / path

        is_verified = verify_incoming_path(parent_path, Path(path))
        if not is_verified:
            raise HTTPException(status_code=403, detail="Access denied!")

        if not full_file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        file_extension = full_file_path.suffix.lower()

        if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
            if is_encrypted_file(full_file_path):
                decrypted_data = decrypt_to_bytes(full_file_path)
                img = Image.open(io.BytesIO(decrypted_data))
            else:
                img = Image.open(full_file_path)

            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            img_byte_arr = io.BytesIO()
            img_format = 'JPEG' if file_extension in ['.jpg', '.jpeg'] else 'PNG'
            img.save(img_byte_arr, format=img_format, quality=85)
            img_byte_arr.seek(0)

            return StreamingResponse(
                img_byte_arr,
                media_type=f'image/{img_format.lower()}',
                headers={"Cache-Control": "public, max-age=3600"}
            )

        elif file_extension == '.pdf':
            temp_file = NamedTemporaryFile(delete=False, suffix='.png')
            temp_path = temp_file.name
            temp_file.close()

            try:
                if is_encrypted_file(full_file_path):
                    decrypted_data = decrypt_to_bytes(full_file_path)
                    pdf_doc = fitz.open(stream=decrypted_data, filetype="pdf")
                else:
                    pdf_doc = fitz.open(full_file_path)

                page = pdf_doc[0]
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                pix.save(temp_path)
                pdf_doc.close()

                img = Image.open(temp_path)
                img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='PNG', quality=85)
                img_byte_arr.seek(0)

                if background_tasks:
                    background_tasks.add_task(os.unlink, temp_path)

                return StreamingResponse(
                    img_byte_arr,
                    media_type='image/png',
                    headers={"Cache-Control": "public, max-age=3600"}
                )
            except Exception as e:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                raise e

        elif file_extension in VIDEO_FORMATS:
            raise HTTPException(status_code=404, detail="Video thumbnails not yet supported for shared files")

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type for thumbnail generation")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating shared thumbnail: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")
