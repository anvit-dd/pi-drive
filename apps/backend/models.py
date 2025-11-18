from typing import Optional
from pydantic import BaseModel, Field


class DeleteItemsRequest(BaseModel):
    items: list[str] | dict = Field(
        ..., description="List of item paths or dict with items"
    )


class RenameRequest(BaseModel):
    file_path: str = Field(..., description="Current path of the item")
    new_name: str = Field(..., description="New name for the item")


class MoveItemsRequest(BaseModel):
    items: list[str] | dict = Field(
        ..., description="List of item paths or dict with items"
    )
    destination: str = Field(..., description="Destination directory path")


class CopyItemsRequest(BaseModel):
    items: list[str] | dict = Field(
        ..., description="List of item paths or dict with items"
    )
    destination: str = Field(..., description="Destination directory path")


class MessageResponse(BaseModel):
    message: str


class StorageResponse(BaseModel):
    message: str
    storage: int


class FileMetadataResponse(BaseModel):
    id: str
    order_no: int
    name: str
    is_dir: bool
    extension: str
    created_at: float
    accessed_at: float
    size: int
    no_items: Optional[int] = None


class UploadResponse(BaseModel):
    filename: str
    saved_as: str
    size: int


class DownloadItem(BaseModel):
    id: str
    name: str
    is_dir: bool
