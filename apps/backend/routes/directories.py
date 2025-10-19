import asyncio
import os
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import JSONResponse
from pathlib import Path

from config import BASE_PATH
from utils import (
    verify_incoming_path,
    list_number_of_items,
    sort_dir_items,
    item_metadata
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
        
        def list_dir():
            with os.scandir(folder_path) as entries:
                return [
                    {
                        "id": str(Path(entry.path).relative_to(str(relative_path))),
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
        
        original_path = folder_path
        c = 1
        while folder_path.exists():
            folder_path = original_path.with_name(f"{original_path.name}-{c}")
            c += 1
        
        await asyncio.to_thread(folder_path.mkdir, parents=True, exist_ok=False)
        
        return JSONResponse(
            content={"message": "Directory created successfully."},
            status_code=201
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
        folder_path = relative_path / "Home"
        search_lower = query.lower()
        
        matching_files = await asyncio.to_thread(
            lambda: [
                item_metadata(file_path, idx, relative_path)
                for idx, file_path in enumerate(
                    [f for f in folder_path.rglob("*") if search_lower in f.name.lower()]
                )
            ]
        )
        
        return matching_files if len(matching_files) < 500 else matching_files[:500]
           
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))
