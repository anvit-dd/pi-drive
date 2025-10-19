from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import os
from jose import jwt, JWTError
from dotenv import load_dotenv


load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            if request.url.path.startswith("/shared/") or request.url.path.startswith("/share/"):
                response = await call_next(request)
                return response
            
            auth_header = request.headers.get("authorization")
            if not auth_header:
                return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})
            
            api_key = request.headers.get("x-api-key")
            if not api_key:
                return JSONResponse(status_code=403, content={"detail": "Invalid or missing API Key"})
            
            incoming_token = auth_header.split(" ")[1] if " " in auth_header else None
            
            if not incoming_token:
                return JSONResponse(status_code=401, content={"detail": "Invalid token format"})
            if api_key != os.environ.get("API_KEY"):
                return JSONResponse(status_code=403, content={"detail": "Invalid or missing API Key"})
            
            payload = verify_jwt_token(incoming_token)
            if not payload:
                return JSONResponse(status_code=401, content={"detail": "Invalid token"})
            request.state.user_id = payload.get("sub")
            response = await call_next(request)
            return response
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": f"Authentication error: {str(e)}"})


def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        return payload
    except JWTError as e:
        return None
