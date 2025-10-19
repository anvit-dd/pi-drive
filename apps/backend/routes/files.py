import asyncio
import io
import json
import shutil
from base64 import b64decode
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Response
from starlette.responses import JSONResponse, StreamingResponse
import zipfile

from config import BASE_PATH
from models import DeleteItemsRequest, RenameRequest
from utils import verify_incoming_path, ensure_unique_path
from crypto_utils import (
    encrypt_upload_to_file,
    decrypt_stream,
    is_encrypted_file,
    ensure_encrypted_empty_file,
    get_plaintext_size,
)

router = APIRouter(prefix="/files")


@router.post("")
async def create_file(path: str, req: Request):
    try:
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(path))
        
        if not is_verified:
            raise PermissionError("User operation denied!")
        
        folder_path = BASE_PATH / req.state.user_id / path
        folder_path = await ensure_unique_path(folder_path)
        
        await asyncio.to_thread(ensure_encrypted_empty_file, folder_path)
        
        return JSONResponse(
            content={"message": "File created successfully."},
            status_code=201
        )
        
    except FileExistsError:
        return JSONResponse(
            content={"message": "File already exists."},
            status_code=200
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e) or "Invalid file name.")


@router.post("/upload")
async def upload_file(path: str, req: Request, file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(path))
        if not is_verified:
            raise PermissionError(status_code=403, detail="User operation denied!")
        
        user_dir = BASE_PATH / req.state.user_id / path
        user_dir.mkdir(parents=True, exist_ok=True)

        original_filename = Path(file.filename)
        file_path = user_dir / original_filename.name
        file_path = await ensure_unique_path(file_path)

        plain_size = await encrypt_upload_to_file(file, file_path)

        return {
            "filename": file.filename,
            "saved_as": file_path.name,
            "size": plain_size,
        }

    except HTTPException:
        raise
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"File system error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.head("/download")
async def download_files_head(req: Request, id: str):
    try:
        if not id:
            raise HTTPException(status_code=400, detail="Invalid id provided!")

        parent_path = BASE_PATH / req.state.user_id

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
                raise PermissionError(status_code=403, detail="User operation is denied!")

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
                
            else:
                logical_size = get_plaintext_size(download_item_path)

                headers = {
                    "Content-Disposition": f'attachment; filename="{to_download_item["name"]}"',
                    "Content-Length": str(logical_size),
                    "X-Total-Size": str(logical_size),
                }
                return Response(status_code=200, headers=headers)

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
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"File system error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.get("/download")
async def download_files(req: Request, id: str):
    try:
        if not id:
            raise HTTPException(status_code=400, detail="Invalid id provided!")

        parent_path = BASE_PATH / req.state.user_id

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
                raise PermissionError(status_code=403, detail="User operation is denied!")

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
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"File system error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.delete("")
async def delete_files(item_paths: DeleteItemsRequest, req: Request):
    try:
        raw_items = item_paths.items
        if isinstance(raw_items, list):
            items_to_delete = raw_items
        elif isinstance(raw_items, dict):
            items_to_delete = raw_items.get("items", [])
        else:
            items_to_delete = []

        if len(items_to_delete) == 0:
            raise Exception("No items to delete")
        
        for item_path in items_to_delete:
            is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(item_path))
            if not is_verified:
                raise PermissionError("User operation denied!")
            full_path = BASE_PATH / req.state.user_id / item_path
            if await asyncio.to_thread(full_path.is_file):
                print(full_path)
                await asyncio.to_thread(full_path.unlink)
            elif await asyncio.to_thread(full_path.is_dir):
                print(full_path)
                await asyncio.to_thread(shutil.rmtree, full_path)
        
        return JSONResponse(
            content={"message": "Deleted contents successfully."},
            status_code=200
        )
        
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e) or "Invalid file name.")


@router.patch("/rename")
async def rename_file(req: Request, payload: RenameRequest):
    try:
        file_path = payload.file_path
        new_name = payload.new_name
            
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(file_path))
        if not is_verified:
            raise PermissionError("User operation denied!")

        if not new_name.strip():
            raise HTTPException(status_code=400, detail="New name must not be empty")
        if "/" in new_name or "\\" in new_name:
            raise HTTPException(status_code=400, detail="New name must not contain path separators")
        if len(new_name) > 255:
            raise HTTPException(status_code=400, detail="New name is too long")

        old_full_path = BASE_PATH / req.state.user_id / file_path

        if not await asyncio.to_thread(old_full_path.exists):
            raise HTTPException(status_code=404, detail="Path not found")

        parent_dir = old_full_path.parent
        new_full_path = parent_dir / new_name

        if old_full_path.name == new_name:
            return JSONResponse(
                content={
                    "message": "No change",
                    "id": str(Path(file_path)),
                    "name": new_name,
                },
                status_code=200,
            )

        if await asyncio.to_thread(new_full_path.exists):
            raise HTTPException(status_code=409, detail="A file or directory with the new name already exists")

        await asyncio.to_thread(shutil.move, str(old_full_path), str(new_full_path))

        return JSONResponse(
            content={
                "message": "Renamed successfully.",
            },
            status_code=200,
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error renaming file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")
