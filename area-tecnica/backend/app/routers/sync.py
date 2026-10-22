from fastapi import APIRouter

from database import SessionLocal
from schemas.sync import SyncVersionResponse
from services.sync_service import get_sync_data


router = APIRouter(
    prefix="/api/sync",
    tags=["sincronizacao"],
)


@router.get(
    "/version",
    response_model=SyncVersionResponse,
)
def get_sync_version():
    with SessionLocal() as session:
        return get_sync_data(session)