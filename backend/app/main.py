import socketio
from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request

from api.api_v1.routers.game import *
from app.api.api_v1.routers.auth import auth_router
from app.api.api_v1.routers.users import users_router
from app.core import config
from app.core.auth import get_current_active_user
from app.core.celery_app import celery_app
from app.db.session import SessionLocal

# from db.session import Session
# if config.SENTRY_DSN:
#     sentry_sdk.init(config.SENTRY_DSN)


fastapi = FastAPI(
    title=config.PROJECT_NAME, docs_url="/api/docs", openapi_url="/api"
)

fastapi.include_router(
    users_router,
    prefix="/api/v1",
    tags=["users"],
    dependencies=[Depends(get_current_active_user)],
)
fastapi.include_router(auth_router, prefix="/api", tags=["auth"])


@fastapi.middleware("http")
async def db_session_middleware(request: Request, call_next):
    request.state.db = SessionLocal()
    response = await call_next(request)
    request.state.db.close()
    return response


# CORS
origins = []

# Set all CORS enabled origins
if config.BACKEND_CORS_ORIGINS:
    origins_raw = config.BACKEND_CORS_ORIGINS.split(",")
    for origin in origins_raw:
        use_origin = origin.strip()
        origins.append(use_origin)
    fastapi.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),

app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=fastapi,
    socketio_path='/socket.io/'
)


@fastapi.get("/api/v1")
async def root():
    return {"message": "Hello World"}


@fastapi.get("/api/v1/task")
async def example_task():
    celery_app.send_task("app.tasks.example_task", args=["Hello World"])

    return {"message": "success"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
