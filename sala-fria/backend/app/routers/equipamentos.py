from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select

from database import SessionLocal
from models.entities import Equipamento
from schemas.equipamento import (
    EquipamentoCreate,
    EquipamentoDelete,
    EquipamentoResponse,
    EquipamentoUpdate,
)
from security.dependencies import (
    require_administrator,
)
from services.equipment_service import (
    EquipmentConflictError,
    EquipmentDuplicateKeyError,
    EquipmentNotFoundError,
    EquipmentOverlapError,
    EquipmentValidationError,
    create_equipment,
    soft_delete_equipment,
    update_equipment,
)


router = APIRouter(
    prefix="/api/equipamentos",
    tags=["equipamentos"],
)


def raise_equipment_error(error):
    if isinstance(
        error,
        EquipmentNotFoundError,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    if isinstance(
        error,
        (
            EquipmentConflictError,
            EquipmentDuplicateKeyError,
            EquipmentOverlapError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

    if isinstance(
        error,
        EquipmentValidationError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        )

    raise error


@router.get(
    "",
    response_model=(
        list[EquipamentoResponse]
    ),
)
def list_equipamentos():
    with SessionLocal() as session:
        statement = (
            select(Equipamento)
            .where(
                Equipamento.visivel.is_(True)
            )
            .order_by(
                Equipamento.rack_key,
                Equipamento.modulo_rack,
                Equipamento.ru_inicial.desc(),
                Equipamento.id,
            )
        )

        return list(
            session.scalars(
                statement
            ).all()
        )


@router.post(
    "",
    response_model=EquipamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_equipment_endpoint(
    payload: EquipamentoCreate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            equipment = create_equipment(
                session=session,
                payload=payload,
                user=authenticated_user.usuario,
            )

            session.commit()
            session.refresh(
                equipment
            )

            return equipment

        except (
            EquipmentNotFoundError,
            EquipmentConflictError,
            EquipmentDuplicateKeyError,
            EquipmentValidationError,
            EquipmentOverlapError,
        ) as error:
            session.rollback()
            raise_equipment_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.put(
    "/{equipment_id}",
    response_model=EquipamentoResponse,
)
def update_equipment_endpoint(
    equipment_id: int,
    payload: EquipamentoUpdate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            equipment = update_equipment(
                session=session,
                equipment_id=equipment_id,
                payload=payload,
                user=authenticated_user.usuario,
            )

            session.commit()
            session.refresh(
                equipment
            )

            return equipment

        except (
            EquipmentNotFoundError,
            EquipmentConflictError,
            EquipmentDuplicateKeyError,
            EquipmentValidationError,
            EquipmentOverlapError,
        ) as error:
            session.rollback()
            raise_equipment_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.delete(
    "/{equipment_id}",
    response_model=EquipamentoResponse,
)
def delete_equipment_endpoint(
    equipment_id: int,
    payload: EquipamentoDelete,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            equipment = (
                soft_delete_equipment(
                    session=session,
                    equipment_id=equipment_id,
                    expected_version=(
                        payload.versao_dados
                    ),
                    user=(
                        authenticated_user.usuario
                    ),
                )
            )

            session.commit()
            session.refresh(
                equipment
            )

            return equipment

        except (
            EquipmentNotFoundError,
            EquipmentConflictError,
            EquipmentDuplicateKeyError,
            EquipmentValidationError,
            EquipmentOverlapError,
        ) as error:
            session.rollback()
            raise_equipment_error(
                error
            )

        except Exception:
            session.rollback()
            raise