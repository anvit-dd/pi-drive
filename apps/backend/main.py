import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS, APP_TITLE, APP_VERSION, APP_DESCRIPTION
from middleware import AuthMiddleware

from routes.users import router as users_router
from routes.directories import router as directories_router
from routes.files import router as files_router
from routes.operations import router as operations_router
from routes.media import router as media_router
from routes.shares import router as shared_router


app = FastAPI(title=APP_TITLE, version=APP_VERSION, description=APP_DESCRIPTION)

app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "PUT"],
    allow_headers=["authorization", "x-api-key", "range", "content-type", "accept"],
)

app.include_router(users_router)
app.include_router(directories_router)
app.include_router(files_router)
app.include_router(operations_router)
app.include_router(media_router)
app.include_router(shared_router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
