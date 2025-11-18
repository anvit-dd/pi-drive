import asyncio
import os
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import JSONResponse
from pathlib import Path

from config import BASE_PATH, HOME
from utils import (
    verify_incoming_path,
    list_number_of_items,
    sort_dir_items,
    item_metadata,
    get_directory_contents,
    ensure_unique_path,
)
from crypto_utils import get_plaintext_size

router = APIRouter(prefix="/directories")


@router.get("")
async def list_directory_contents(path: str, req: Request):
    try:
        relative_path = BASE_PATH / req.state.user_id
        is_verified = verify_incoming_path(relative_path, Path(path))
        if not is_verified:
            raise PermissionError("User operation denied!")

        folder_path = relative_path / path

        contents = await asyncio.to_thread(
            get_directory_contents, folder_path, relative_path
        )
        contents = sort_dir_items(contents)
        return contents

    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("")
async def create_directory(path: str, req: Request):
    try:
        is_verified = verify_incoming_path(BASE_PATH / req.state.user_id, Path(path))
        if not is_verified:
            raise PermissionError("User operation denied!")

        folder_path = BASE_PATH / req.state.user_id / path
        folder_path = await ensure_unique_path(folder_path)

        await asyncio.to_thread(folder_path.mkdir, parents=True, exist_ok=False)

        return JSONResponse(
            content={"message": "Directory created successfully."}, status_code=201
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except Exception as e:
        print(f"Error creating directory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error.")


@router.get("/search")
async def search_directory_contents(query: str, req: Request):
    try:
        relative_path = BASE_PATH / req.state.user_id
        folder_path = relative_path / HOME
        search_lower = query.lower()

        matching_files = await asyncio.to_thread(
            lambda: [
                item_metadata(file_path, idx, relative_path)
                for idx, file_path in enumerate(
                    [
                        f
                        for f in folder_path.rglob("*")
                        if search_lower in f.name.lower()
                    ]
                )
            ]
        )

        return matching_files if len(matching_files) < 500 else matching_files[:500]

    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))
