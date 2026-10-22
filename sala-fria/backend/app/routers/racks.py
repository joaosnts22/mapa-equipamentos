from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select

from database import SessionLocal
from models.entities import Rack
from schemas.rack import (
    RackCreate,
    RackDelete,
    RackResponse,
    RackUpdate,
)
from security.dependencies import (
    require_administrator,
)
from services.rack_service import (
    RackConflictError,
    RackDuplicateKeyError,
    RackNotFoundError,
    create_rack,
    soft_delete_rack,
    update_rack,
)


router = APIRouter(
    prefix="/api/racks",
    tags=["racks"],
)


def raise_service_error(error):
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


@router.get(
    "",
    response_model=list[RackResponse],
)
def list_racks():
    with SessionLocal() as session:
        statement = (
            select(Rack)
            .where(
                Rack.visivel.is_(True)
            )
            .order_by(
                Rack.ordem,
                Rack.id,
            )
        )

        return list(
            session.scalars(
                statement
            ).all()
        )


@router.post(
    "",
    response_model=RackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_rack_endpoint(
    payload: RackCreate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            rack = create_rack(
                session=session,
                payload=payload,
                user=authenticated_user.usuario,
            )

            session.commit()
            session.refresh(
                rack
            )

            return rack

        except (
            RackNotFoundError,
            RackConflictError,
            RackDuplicateKeyError,
        ) as error:
            session.rollback()
            raise_service_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.put(
    "/{rack_id}",
    response_model=RackResponse,
)
def update_rack_endpoint(
    rack_id: int,
    payload: RackUpdate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            rack = update_rack(
                session=session,
                rack_id=rack_id,
                payload=payload,
                user=authenticated_user.usuario,
            )

            session.commit()
            session.refresh(
                rack
            )

            return rack

        except (
            RackNotFoundError,
            RackConflictError,
            RackDuplicateKeyError,
        ) as error:
            session.rollback()
            raise_service_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.delete(
    "/{rack_id}",
    response_model=RackResponse,
)
def delete_rack_endpoint(
    rack_id: int,
    payload: RackDelete,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            rack = soft_delete_rack(
                session=session,
                rack_id=rack_id,
                expected_version=payload.versao_dados,
                user=authenticated_user.usuario,
            )

            session.commit()
            session.refresh(
                rack
            )

            return rack

        except (
            RackNotFoundError,
            RackConflictError,
            RackDuplicateKeyError,
        ) as error:
            session.rollback()
            raise_service_error(
                error
            )

        except Exception:
            session.rollback()
            raise