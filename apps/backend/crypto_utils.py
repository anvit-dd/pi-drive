from __future__ import annotations
from base64 import b64decode
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Optional

import os
import io

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

MAGIC = b"PDRV1"
SALT_LEN = 16
IV_LEN = 12
SIZE_LEN = 8
TAG_LEN = 16
HEADER_LEN = len(MAGIC) + SALT_LEN + IV_LEN + SIZE_LEN


class CryptoConfigError(Exception):
    pass


def _load_master_key() -> bytes:
    key_b64 = os.getenv("FILES_MASTER_KEY")
    if not key_b64:
        raise CryptoConfigError("Missing FILES_MASTER_KEY env var (base64 32 bytes)")
    try:
        key = b64decode(key_b64)
    except Exception as e:
        raise CryptoConfigError(f"Invalid base64 for FILES_MASTER_KEY: {e}. Value length: {len(key_b64) if key_b64 else 0}")
    if len(key) != 32:
        raise CryptoConfigError(f"FILES_MASTER_KEY must decode to 32 bytes (AES-256), got {len(key)} bytes")
    return key


def _derive_key(master: bytes, salt: bytes) -> bytes:
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=b"pidrive-self:file:v1",
    )
    return hkdf.derive(master)


@dataclass
class EncHeader:
    salt: bytes
    iv: bytes
    plain_size: int
    file_size: int


def is_encrypted_file(path: Path) -> bool:
    try:
        with path.open("rb") as f:
            magic = f.read(len(MAGIC))
            return magic == MAGIC
    except Exception:
        return False


def read_header(path: Path) -> EncHeader:
    with path.open("rb") as f:
        header = f.read(HEADER_LEN)
        if len(header) != HEADER_LEN or header[: len(MAGIC)] != MAGIC:
            raise ValueError("Not an encrypted PiDrive file")
        salt = header[len(MAGIC) : len(MAGIC) + SALT_LEN]
        iv = header[len(MAGIC) + SALT_LEN : len(MAGIC) + SALT_LEN + IV_LEN]
        size_bytes = header[-SIZE_LEN:]
        plain_size = int.from_bytes(size_bytes, "big", signed=False)
    file_size = path.stat().st_size
    return EncHeader(salt=salt, iv=iv, plain_size=plain_size, file_size=file_size)


async def encrypt_upload_to_file(upload_file, out_path: Path, chunk_size: int = 4 * 1024 * 1024) -> int:
    from os import urandom

    master = _load_master_key()
    salt = urandom(SALT_LEN)
    iv = urandom(IV_LEN)
    key = _derive_key(master, salt)

    with out_path.open("xb") as out:
        out.write(MAGIC)
        out.write(salt)
        out.write(iv)
        out.write((0).to_bytes(SIZE_LEN, "big"))

        cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
        encryptor = cipher.encryptor()

        plain_size = 0
        while True:
            chunk = await upload_file.read(chunk_size)
            if not chunk:
                break
            plain_size += len(chunk)
            ct = encryptor.update(chunk)
            if ct:
                out.write(ct)

        encryptor.finalize()
        tag = encryptor.tag
        out.write(tag)

    with out_path.open("r+b") as out:
        out.seek(len(MAGIC) + SALT_LEN + IV_LEN)
        out.write(plain_size.to_bytes(SIZE_LEN, "big"))

    return plain_size


def decrypt_stream(path: Path, chunk_size: int = 1024 * 1024) -> Iterator[bytes]:
    hdr = read_header(path)
    master = _load_master_key()
    key = _derive_key(master, hdr.salt)

    ct_start = HEADER_LEN
    ct_end_exclusive = hdr.file_size - TAG_LEN

    with path.open("rb") as f:
        f.seek(ct_end_exclusive)
        tag = f.read(TAG_LEN)
        if len(tag) != TAG_LEN:
            raise ValueError("Invalid encrypted file (missing tag)")

        f.seek(ct_start)
        cipher = Cipher(algorithms.AES(key), modes.GCM(hdr.iv, tag))
        decryptor = cipher.decryptor()

        remaining = ct_end_exclusive - ct_start
        while remaining > 0:
            to_read = min(chunk_size, remaining)
            data = f.read(to_read)
            if not data:
                break
            remaining -= len(data)
            pt = decryptor.update(data)
            if pt:
                yield pt
        decryptor.finalize()


def decrypt_stream_range(path: Path, start: int, end: int, chunk_size: int = 1024 * 1024) -> Iterator[bytes]:
    if start < 0 or end < start:
        raise ValueError("Invalid range")
    hdr = read_header(path)
    if end >= hdr.plain_size:
        raise ValueError("Requested range not satisfiable")

    produced = 0
    emitted = 0

    for pt in decrypt_stream(path, chunk_size=chunk_size):
        pt_len = len(pt)
        next_produced = produced + pt_len
        if next_produced <= start:
            produced = next_produced
            continue
        s = max(0, start - produced)
        e = min(pt_len, (end - produced) + 1)
        if s < e:
            yield pt[s:e]
            emitted += (e - s)
        produced = next_produced
        if produced > end and emitted >= (end - start + 1):
            break


def decrypt_to_bytes(path: Path, max_bytes: Optional[int] = None) -> bytes:
    buf = io.BytesIO()
    for chunk in decrypt_stream(path):
        buf.write(chunk)
        if max_bytes is not None and buf.tell() > max_bytes:
            raise ValueError("Decrypted content exceeds max_bytes limit")
    return buf.getvalue()


def ensure_encrypted_empty_file(path: Path) -> None:
    if path.exists():
        return
    from os import urandom
    master = _load_master_key()
    salt = urandom(SALT_LEN)
    iv = urandom(IV_LEN)
    key = _derive_key(master, salt)
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    encryptor.finalize()
    tag = encryptor.tag
    with path.open("xb") as out:
        out.write(MAGIC)
        out.write(salt)
        out.write(iv)
        out.write((0).to_bytes(SIZE_LEN, "big"))
        out.write(tag)


def get_plaintext_size(path: Path) -> int:
    if is_encrypted_file(path):
        return read_header(path).plain_size
    return path.stat().st_size
