from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from database import SessionLocal
from schemas.patch_position import (
    PatchConversionRequest,
    PatchConversionResponse,
    PatchPositionResponse,
    PatchPositionsResponse,
    PatchPositionUpdate,
)
from security.dependencies import (
    require_administrator,
)
from services.patch_conversion_service import (
    PatchConversionConfirmationError,
    PatchConversionConflictError,
    PatchConversionNotFoundError,
    convert_equipment_patch_mode,
)
from services.patch_position_service import (
    PatchEquipmentNotFoundError,
    PatchEquipmentRequiredError,
    PatchPositionConflictError,
    PatchPositionValidationError,
    list_patch_positions,
    save_patch_position,
)


router = APIRouter(
    prefix="/api/equipamentos",
    tags=[
        "posicoes-de-patch",
    ],
)


def raise_patch_error(
    error,
):
    if isinstance(
        error,
        (
            PatchEquipmentNotFoundError,
            PatchConversionNotFoundError,
        ),
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        )

    if isinstance(
        error,
        PatchConversionConfirmationError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail={
                "mensagem": str(error),
                "confirmacao_necessaria": (
                    True
                ),
            },
        )

    if isinstance(
        error,
        (
            PatchEquipmentRequiredError,
            PatchPositionConflictError,
            PatchConversionConflictError,
        ),
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(error),
        )

    if isinstance(
        error,
        PatchPositionValidationError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        )

    raise error


@router.get(
    "/{equipment_id}/patch",
    response_model=(
        PatchPositionsResponse
    ),
)
def get_equipment_patch_positions(
    equipment_id: int,
):
    with SessionLocal() as session:
        try:
            return list_patch_positions(
                session=session,
                equipment_id=equipment_id,
            )

        except (
            PatchEquipmentNotFoundError,
            PatchEquipmentRequiredError,
            PatchPositionConflictError,
            PatchPositionValidationError,
        ) as error:
            raise_patch_error(
                error
            )


@router.put(
    "/{equipment_id}/patch/{position_number}",
    response_model=(
        PatchPositionResponse
    ),
)
def update_equipment_patch_position(
    equipment_id: int,
    position_number: int,
    payload: PatchPositionUpdate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            position = save_patch_position(
                session=session,
                equipment_id=equipment_id,
                position_number=(
                    position_number
                ),
                payload=payload,
                user=(
                    authenticated_user.usuario
                ),
            )

            session.commit()

            return position

        except (
            PatchEquipmentNotFoundError,
            PatchEquipmentRequiredError,
            PatchPositionConflictError,
            PatchPositionValidationError,
        ) as error:
            session.rollback()

            raise_patch_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.put(
    "/{equipment_id}/patch-mode",
    response_model=(
        PatchConversionResponse
    ),
)
def update_equipment_patch_mode(
    equipment_id: int,
    payload: PatchConversionRequest,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            result = (
                convert_equipment_patch_mode(
                    session=session,
                    equipment_id=equipment_id,
                    payload=payload,
                    user=(
                        authenticated_user.usuario
                    ),
                )
            )

            session.commit()

            return result

        except (
            PatchConversionNotFoundError,
            PatchConversionConflictError,
            PatchConversionConfirmationError,
        ) as error:
            session.rollback()

            raise_patch_error(
                error
            )

        except Exception:
            session.rollback()
            raise