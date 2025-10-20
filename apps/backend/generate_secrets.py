import os
import secrets
import base64

os.makedirs('/secrets', exist_ok=True)
with open('/secrets/.env', 'w') as f:
    f.write(f'API_KEY={secrets.token_hex(16)}\n')
    f.write(f'JWT_SECRET={secrets.token_urlsafe(32)}\n')
    f.write(f'REFRESH_TOKEN_SECRET={secrets.token_urlsafe(32)}\n')
    # Generate 32 random bytes and encode as base64
    files_master_key = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
    f.write(f'FILES_MASTER_KEY={files_master_key}\n')