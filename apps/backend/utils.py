import os
import asyncio
import io
import zipfile
from pathlib import Path
from config import HOME
from typing import Optional
import pypdfium2 as pdfium
from crypto_utils import (
    get_plaintext_size,
    is_encrypted_file,
    decrypt_stream,
)


def verify_incoming_path(base_path: Path, incoming_path: Path) -> bool:
    try:
        resolved_path = (base_path / incoming_path).resolve()
        return str(resolved_path).startswith(str((base_path / HOME).resolve()))
    except Exception:
        return False


def compute_folder_size(folder_path: Path) -> int:
    total_size = 0
    try:
        for root, _, files in os.walk(folder_path):
            for name in files:
                try:
                    file_path = os.path.join(root, name)
                    try:
                        if is_encrypted_file(Path(file_path)):
                            total_size += get_plaintext_size(Path(file_path))
                        else:
                            total_size += os.path.getsize(file_path)
                    except Exception:
                        total_size += os.path.getsize(file_path)
                except (OSError, FileNotFoundError):
                    continue
    except Exception as e:
        raise RuntimeError(f"Failed to compute folder size: {e}")
    return total_size


def list_number_of_items(entry) -> Optional[int]:
    try:
        return len(list(os.scandir(entry))) if entry.is_dir() else None
    except (FileNotFoundError, OSError):
        return -1


def sort_dir_items(items: list[dict]) -> list[dict]:
    try:
        folders = sorted(
            (i for i in items if i.get("is_dir")),
            key=lambda x: x.get("name", "").lower(),
        )
        files = sorted(
            (i for i in items if not i.get("is_dir")),
            key=lambda x: x.get("name", "").lower(),
        )
        sorted_items = folders + files
        for idx, itm in enumerate(sorted_items):
            itm["order_no"] = idx
        return sorted_items
    except Exception:
        return items


def item_metadata(entry, index: int, relative_path: Path) -> dict:
    return {
        "id": str(Path(entry).relative_to(str(relative_path))),
        "order_no": index,
        "name": entry.name,
        "is_dir": entry.is_dir(),
        "extension": Path(entry.name).suffix,
        "created_at": entry.stat().st_ctime,
        "accessed_at": entry.stat().st_atime,
        "size": (
            get_plaintext_size(Path(entry))
            if Path(entry).is_file()
            else entry.stat().st_size
        ),
        "no_items": list_number_of_items(entry) if entry.is_dir() else -1,
    }


async def ensure_unique_path(original_path: Path) -> Path:
    result_path = original_path
    counter = 1

    while await asyncio.to_thread(result_path.exists):
        if original_path.suffix:
            result_path = original_path.with_name(
                f"{original_path.stem}-{counter}{original_path.suffix}"
            )
        else:
            result_path = original_path.with_name(f"{original_path.name}-{counter}")
        counter += 1

    return result_path


def generate_pdf_thumbnail(src_thumb: str, thumb_path: str):
    pdf = pdfium.PdfDocument(src_thumb)
    first_page = pdf[0]
    bitmap = first_page.render(scale=2)
    pil_image = bitmap.to_pil()
    pil_image.thumbnail((512, 512))
    pil_image.save(thumb_path, "PNG")


async def create_zip_buffer(item_paths, parent_path):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for to_download_item in item_paths:
            download_item_path = parent_path / Path(to_download_item["id"])

            if not download_item_path.exists():
                raise FileNotFoundError(f"Path not found: {to_download_item['id']}")

            prefix = to_download_item["name"] if len(item_paths) > 1 else None

            if to_download_item["is_dir"]:
                for path in download_item_path.rglob("*"):
                    if path.is_file():
                        relative_arc = path.relative_to(download_item_path)
                        if prefix:
                            arc = str(Path(prefix) / relative_arc)
                        else:
                            arc = str(relative_arc)
                        if is_encrypted_file(path):
                            with zipf.open(arc, "w") as dest:
                                for chunk in decrypt_stream(path):
                                    dest.write(chunk)
                        else:
                            zipf.write(path, arcname=arc)
            else:
                if prefix:
                    arc = str(prefix)
                else:
                    arc = str(to_download_item["name"])
                if is_encrypted_file(download_item_path):
                    with zipf.open(arc, "w") as dest:
                        for chunk in decrypt_stream(download_item_path):
                            dest.write(chunk)
                else:
                    zipf.write(
                        download_item_path,
                        arcname=arc,
                    )
    zip_buffer.seek(0)
    content_length = len(zip_buffer.getvalue())
    return zip_buffer, content_length


def get_directory_contents(folder_path: Path, relative_path: Path):
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
                "no_items": (list_number_of_items(entry) if entry.is_dir() else -1),
            }
            for i, entry in enumerate(entries)
        ]


def verify_items(items, parent_path):
    for item_path in items:
        is_valid = verify_incoming_path(parent_path, Path(item_path))
        if not is_valid:
            raise PermissionError("User operation denied!")
