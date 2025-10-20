import os
import secrets

os.makedirs('/secrets', exist_ok=True)
with open('/secrets/.env', 'w') as f:
    f.write(f'API_KEY={secrets.token_hex(16)}\n')
    f.write(f'JWT_SECRET={secrets.token_urlsafe(32)}\n')
    f.write(f'REFRESH_TOKEN_SECRET={secrets.token_urlsafe(32)}\n')
    f.write(f'FILES_MASTER_KEY={secrets.token_urlsafe(32)}\n')