import asyncio
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import JSONResponse
from pathlib import Path

from config import BASE_PATH
from utils import compute_folder_size

router = APIRouter(prefix="/users")


@router.get("")
async def initialize_user(req: Request):
    user_folder = BASE_PATH / req.state.user_id / "Home"
    try:
        await asyncio.to_thread(user_folder.mkdir, parents=True, exist_ok=False)
        size = await asyncio.to_thread(compute_folder_size, user_folder)
        return JSONResponse(
            content={"message": "Directory created successfully.", "storage": size},
            status_code=201
        )
    except FileExistsError:
        size = await asyncio.to_thread(compute_folder_size, user_folder)
        return JSONResponse(
            content={"message": "Directory already exists.", "storage": size},
            status_code=200
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied.")
    except Exception as e:
        print(f"Error creating directory for user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("/storage")
async def get_user_storage(req: Request):
    user_folder = BASE_PATH / req.state.user_id / "Home"
    try:
        size = await asyncio.to_thread(compute_folder_size, user_folder)
        return JSONResponse(
            content={"message": "Successfully fetched user storage.", "storage": size},
            status_code=200
        )
    except Exception as e:
        print(f"Error fetching storage: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")
