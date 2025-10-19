import os
import asyncio
from pathlib import Path
from typing import Optional
from crypto_utils import get_plaintext_size, is_encrypted_file


def verify_incoming_path(base_path: Path, incoming_path: Path) -> bool:
    try:
        resolved_path = (base_path / incoming_path).resolve()
        return str(resolved_path).startswith(str((base_path / "Home").resolve()))
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
            key=lambda x: x.get("name", "").lower()
        )
        files = sorted(
            (i for i in items if not i.get("is_dir")),
            key=lambda x: x.get("name", "").lower()
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
            get_plaintext_size(Path(entry)) if Path(entry).is_file()
            else entry.stat().st_size
        ),
        "no_items": list_number_of_items(entry) if entry.is_dir() else -1
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
            result_path = original_path.with_name(
                f"{original_path.name}-{counter}"
            )
        counter += 1
    
    return result_path
