import os
import secrets
import base64

os.makedirs("/secrets", exist_ok=True)

secrets_file = "/secrets/.env"
if not os.path.exists(secrets_file):
    with open(secrets_file, "w") as f:
        f.write(f"API_KEY={secrets.token_hex(16)}\n")
        f.write(f"JWT_SECRET={secrets.token_urlsafe(32)}\n")
        f.write(f"REFRESH_TOKEN_SECRET={secrets.token_urlsafe(32)}\n")
        files_master_key = base64.b64encode(secrets.token_bytes(32)).decode("utf-8")
        f.write(f"FILES_MASTER_KEY={files_master_key}\n")
else:
    print(f"Secrets already exist at {secrets_file}, skipping generation")
