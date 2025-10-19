PiDrive Backend — Server-side encryption

What changed
- Uploads are encrypted at rest using AES-256-GCM with per-file salt (HKDF) and random IV.
- Downloads and video streams are transparently decrypted on the server.
- Thumbnails for encrypted files are generated from a temporary decrypted copy.
- Directory listings and storage totals report logical plaintext sizes.

Environment
- Add a 32-byte base64 master key as FILES_MASTER_KEY.
- BASE_PATH must point to the root storage directory.

Example .env
BASE_PATH=/data/pidrive
FILES_MASTER_KEY=<32-byte-random-base64>
ALLOWED_ORIGINS=http://localhost:3000
API_KEY=your_api_key
JWT_SECRET=your_jwt_secret

Generate a key (one-time)
openssl rand -base64 32

Run (Docker)
docker build -t pidrive-backend:latest .
docker run --env-file .env -p 4000:4000 -v /host/data:/data pidrive-backend:latest

Notes
- Encrypted container format: [MAGIC(5)='PDRV1'][SALT(16)][IV(12)][PLAIN_SIZE(8)][CIPHERTEXT...][TAG(16)].
- Renames, moves, and deletes do not re-encrypt; contents remain encrypted.
- Zip downloads contain decrypted plaintext for convenience.
