import asyncio
import os
import mimetypes
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, HTTPException, Request
from fastapi.background import BackgroundTasks
from starlette.responses import FileResponse, StreamingResponse
from PIL import Image
import fitz

from config import BASE_PATH, VIDEO_FORMATS
from utils import verify_incoming_path
from crypto_utils import (
    is_encrypted_file,
    decrypt_stream,
    decrypt_stream_range,
    get_plaintext_size
)

router = APIRouter(prefix="/media")


@router.get("/stream")
async def stream_media(path: str, req: Request):
    try:
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(path))
        if not is_verified:
            raise PermissionError("User operation denied!")

        full_file_path = BASE_PATH / req.state.user_id / path

        if not full_file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        file_size = (
            get_plaintext_size(full_file_path)
            if is_encrypted_file(full_file_path)
            else os.path.getsize(full_file_path)
        )
        range_header = req.headers.get("Range")

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

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error streaming file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("/thumbnails")
async def get_thumbnail(path: str, req: Request, background_tasks: BackgroundTasks):
    try:
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(path))
        if not is_verified:
            raise PermissionError("User operation denied!")

        full_image_path = BASE_PATH / req.state.user_id / path

        if not await asyncio.to_thread(full_image_path.exists):
            raise HTTPException(status_code=404, detail="Image not found")
        if not await asyncio.to_thread(full_image_path.is_file):
            raise HTTPException(status_code=400, detail="Path is not a file")

        src_for_thumb = full_image_path
        tmp_to_cleanup: list[Path] = []
        
        if is_encrypted_file(full_image_path):
            with NamedTemporaryFile(suffix=full_image_path.suffix, delete=False) as tmp:
                tmp_path = Path(tmp.name)
                for chunk in decrypt_stream(full_image_path):
                    tmp.write(chunk)
            src_for_thumb = tmp_path
            tmp_to_cleanup.append(tmp_path)

        if src_for_thumb.suffix.lower() in VIDEO_FORMATS:
            with NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_thumb:
                thumb_path = tmp_thumb.name

            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", str(src_for_thumb),
                "-ss", "00:00:00.000",
                "-vframes", "1",
                "-vf", "scale=320:-1",
                thumb_path
            ]
            proc = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE
            )
            _, _ = await proc.communicate()
            if proc.returncode != 0 or not os.path.exists(thumb_path):
                raise HTTPException(status_code=500, detail="Failed to generate thumbnail")

            for p in tmp_to_cleanup:
                background_tasks.add_task(
                    lambda path=p: os.remove(path) if os.path.exists(path) else None
                )
            background_tasks.add_task(
                lambda: os.remove(thumb_path) if os.path.exists(thumb_path) else None
            )

            return FileResponse(
                path=thumb_path,
                media_type="image/jpeg",
                headers={"Cache-Control": "public, max-age=3600"},
                background=background_tasks
            )

        elif src_for_thumb.suffix.lower() == ".pdf":
            if not src_for_thumb.exists():
                raise HTTPException(status_code=404, detail="PDF not found")

            with NamedTemporaryFile(suffix=".png", delete=False) as tmp_thumb:
                thumb_path = tmp_thumb.name

            def generate_pdf_thumbnail():
                pdf = fitz.open(src_for_thumb)
                page = pdf[0]
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img.thumbnail((512, 512))
                img.save(thumb_path, "PNG")

            await asyncio.to_thread(generate_pdf_thumbnail)
            for p in tmp_to_cleanup:
                background_tasks.add_task(
                    lambda path=p: os.remove(path) if os.path.exists(path) else None
                )
            background_tasks.add_task(
                lambda: os.remove(thumb_path) if os.path.exists(thumb_path) else None
            )

            return FileResponse(
                path=thumb_path,
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"},
                background=background_tasks
            )

        if tmp_to_cleanup:
            tmp_path = tmp_to_cleanup[0]
            background_tasks.add_task(
                lambda path=tmp_path: os.remove(path) if os.path.exists(path) else None
            )
            return FileResponse(
                path=str(tmp_path),
                media_type="image/jpeg",
                headers={"Cache-Control": "public, max-age=3600"},
                background=background_tasks
            )

        return FileResponse(
            path=str(full_image_path),
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")
