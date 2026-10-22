from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from database import SessionLocal
from schemas.historico import (
    HistoricoListResponse,
)
from security.dependencies import (
    require_administrator,
)
from services.history_service import (
    HistoryValidationError,
    list_history,
)


router = APIRouter(
    prefix="/api/historico",
    tags=["historico"],
)


@router.get(
    "",
    response_model=HistoricoListResponse,
)
def list_history_endpoint(
    tipo_entidade: str | None = Query(
        default=None,
        max_length=100,
    ),
    entidade_key: str | None = Query(
        default=None,
        max_length=150,
    ),
    acao: str | None = Query(
        default=None,
        max_length=100,
    ),
    usuario: str | None = Query(
        default=None,
        max_length=150,
    ),
    limite: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    deslocamento: int = Query(
        default=0,
        ge=0,
    ),
    authenticated_user=Depends(
        require_administrator
    ),
):
    del authenticated_user

    with SessionLocal() as session:
        try:
            return list_history(
                session=session,
                limit=limite,
                offset=deslocamento,
                entity_type=tipo_entidade,
                entity_key=entidade_key,
                action=acao,
                user=usuario,
            )

        except HistoryValidationError as error:
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=str(error),
            ) from error