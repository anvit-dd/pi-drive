import asyncio
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import JSONResponse

from config import BASE_PATH
from models import MoveItemsRequest, CopyItemsRequest
from utils import verify_incoming_path, ensure_unique_path, verify_items

router = APIRouter(prefix="/files")


@router.patch("/move")
async def move_files(req: Request, payload: MoveItemsRequest):
    try:
        items_list = payload.items
        destination = payload.destination
        if len(items_list) == 0 or not destination:
            raise Exception("Invalid request payload")

        parent_path = BASE_PATH / req.state.user_id
        dest_path = parent_path / destination
        is_verified = verify_incoming_path(parent_path, Path(destination))
        if not is_verified:
            raise PermissionError("User operation denied!")
        if not await asyncio.to_thread(dest_path.exists):
            raise HTTPException(status_code=404, detail="Destination path not found")
        if not await asyncio.to_thread(dest_path.is_dir):
            raise HTTPException(
                status_code=400, detail="Destination is not a directory"
            )

        dest_resolved = dest_path.resolve()

        verify_items(items_list, parent_path)

        for item_path in items_list:
            src_full_path = parent_path / item_path
            if not await asyncio.to_thread(src_full_path.exists):
                raise HTTPException(
                    status_code=404, detail=f"Source path not found: {item_path}"
                )

            src_resolved = src_full_path.resolve()

            if src_resolved.parent == dest_resolved:
                continue

            if src_resolved == dest_resolved or str(dest_resolved).startswith(
                str(src_resolved) + os.sep
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot move '{src_full_path.name}' into itself or its subdirectory",
                )

            new_location = dest_path / src_full_path.name
            new_location = await ensure_unique_path(new_location)

            await asyncio.to_thread(shutil.move, str(src_full_path), str(new_location))

        return JSONResponse(
            content={"message": "Moved contents successfully."}, status_code=200
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error moving items: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e) or "Invalid file name.")


@router.patch("/copy")
async def copy_files(req: Request, payload: CopyItemsRequest):
    try:
        print("Copy payload:", payload)
        raw_items = payload.items
        if isinstance(raw_items, list):
            items_list = raw_items
        elif isinstance(raw_items, dict):
            items_list = raw_items.get("items", [])
        else:
            items_list = []

        destination = payload.destination
        print(destination)
        if len(items_list) == 0 or not destination:
            raise Exception("Invalid request payload")

        parent_path = BASE_PATH / req.state.user_id
        dest_path = parent_path / destination

        is_verified = verify_incoming_path(parent_path, Path(destination))
        if not is_verified:
            raise PermissionError("User operation denied!")

        if not await asyncio.to_thread(dest_path.exists):
            raise HTTPException(status_code=404, detail="Destination path not found")
        if not await asyncio.to_thread(dest_path.is_dir):
            raise HTTPException(
                status_code=400, detail="Destination is not a directory"
            )

        dest_resolved = dest_path.resolve()

        verify_items(items_list, parent_path)

        for item_path in items_list:
            src_full_path = parent_path / item_path
            if not await asyncio.to_thread(src_full_path.exists):
                raise HTTPException(
                    status_code=404, detail=f"Source path not found: {item_path}"
                )

            src_resolved = src_full_path.resolve()

            if str(dest_resolved).startswith(str(src_resolved) + os.sep):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot copy '{src_full_path.name}' into itself or its subdirectory",
                )

            new_location = dest_path / src_full_path.name
            new_location = await ensure_unique_path(new_location)

            if await asyncio.to_thread(src_full_path.is_dir):
                await asyncio.to_thread(
                    shutil.copytree, str(src_full_path), str(new_location)
                )
            else:
                await asyncio.to_thread(
                    shutil.copy2, str(src_full_path), str(new_location)
                )

        return JSONResponse(
            content={"message": "Copied contents successfully."}, status_code=200
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e) or "Permission denied.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error copying items: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e) or "Failed to copy items.")
