from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from database import SessionLocal
from schemas.rack import RackUpdate
from schemas.rack_position import (
    RackPositionsBatchRequest,
    RackPositionsBatchResponse,
)
from security.dependencies import (
    require_administrator,
)
from services.rack_service import (
    RackConflictError,
    RackDuplicateKeyError,
    RackNotFoundError,
    update_rack,
)


router = APIRouter(
    prefix="/api/racks/positions",
    tags=["posicoes-dos-racks"],
)


def raise_position_error(error):
    if isinstance(
        error,
        RackNotFoundError,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    if isinstance(
        error,
        (
            RackConflictError,
            RackDuplicateKeyError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

    raise error


@router.put(
    "/batch",
    response_model=RackPositionsBatchResponse,
)
def update_rack_positions_batch(
    payload: RackPositionsBatchRequest,
    authenticated_user=Depends(
        require_administrator
    ),
):
    received_ids = [
        item.database_id
        for item in payload.racks
    ]

    if len(received_ids) != len(
        set(received_ids)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "O lote possui database_id duplicado."
            ),
        )

    with SessionLocal() as session:
        try:
            updated_racks = []

            for item in payload.racks:
                update_payload = RackUpdate(
                    versao_dados=item.versao_dados,
                    posicao_x=item.posicao_x,
                    posicao_y=item.posicao_y,
                    largura=item.largura,
                    altura=item.altura,
                )

                updated_rack = update_rack(
                    session=session,
                    rack_id=item.database_id,
                    payload=update_payload,
                    user=authenticated_user.usuario,
                )

                updated_racks.append(
                    updated_rack
                )

            session.commit()

            for rack in updated_racks:
                session.refresh(
                    rack
                )

            return {
                "atualizados": updated_racks,
                "quantidade": len(
                    updated_racks
                ),
            }

        except (
            RackNotFoundError,
            RackConflictError,
            RackDuplicateKeyError,
        ) as error:
            session.rollback()

            raise_position_error(
                error
            )

        except Exception:
            session.rollback()
            raise