from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from database import SessionLocal
from schemas.patch_connection import (
    PatchConnectionCreate,
    PatchConnectionDeleteRequest,
    PatchConnectionDeleteResponse,
    PatchConnectionResponse,
    PatchEndpointConnectionResponse,
    PatchEquipmentSearchResponse,
    PatchEndpointSearchResponse,
)
from security.dependencies import (
    require_administrator,
)
from services.patch_connection_service import (
    PatchConnectionConflictError,
    PatchConnectionEquipmentError,
    PatchConnectionNotFoundError,
    PatchConnectionValidationError,
    create_patch_connection,
    delete_patch_connection,
    get_endpoint_connection,
    search_patch_equipments,
    search_patch_endpoints,
)


router = APIRouter(
    prefix="/api/patch-connections",
    tags=[
        "conexoes-de-patch",
    ],
)


def raise_patch_connection_error(
    error,
):
    if isinstance(
        error,
        PatchConnectionNotFoundError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        )

    if isinstance(
        error,
        (
            PatchConnectionConflictError,
            PatchConnectionEquipmentError,
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
        PatchConnectionValidationError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        )

    raise error


@router.get(
    "/search",
    response_model=(
        PatchEquipmentSearchResponse
    ),
)
def search_patch_connection_targets(
    query: str = Query(
        default="",
        max_length=200,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
):
    with SessionLocal() as session:
        return search_patch_equipments(
            session=session,
            query=query,
            limit=limit,
        )


@router.get(
    "/search-endpoints",
    response_model=(
        PatchEndpointSearchResponse
    ),
)
def search_patch_connection_endpoints(
    query: str = Query(
        default="",
        max_length=200,
    ),
    current_connector: str = Query(
        min_length=1,
        max_length=20,
    ),
    current_equipment_id: int | None = Query(
        default=None,
        ge=1,
    ),
    current_position_number: int | None = Query(
        default=None,
        ge=1,
        le=32,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
):
    with SessionLocal() as session:
        try:
            return search_patch_endpoints(
                session=session,
                query=query,
                current_connector=(
                    current_connector
                ),
                current_equipment_id=(
                    current_equipment_id
                ),
                current_position_number=(
                    current_position_number
                ),
                limit=limit,
            )

        except (
            PatchConnectionValidationError,
            PatchConnectionEquipmentError,
        ) as error:
            raise_patch_connection_error(
                error
            )


@router.get(
    "/endpoint",
    response_model=(
        PatchEndpointConnectionResponse
    ),
)
def get_patch_endpoint_connection(
    equipment_id: int = Query(
        ge=1,
    ),
    position_number: int = Query(
        ge=1,
        le=32,
    ),
    connector: str = Query(
        min_length=1,
        max_length=20,
    ),
):
    with SessionLocal() as session:
        try:
            return get_endpoint_connection(
                session=session,
                equipment_id=equipment_id,
                position_number=(
                    position_number
                ),
                connector=connector,
            )

        except (
            PatchConnectionNotFoundError,
            PatchConnectionConflictError,
            PatchConnectionValidationError,
            PatchConnectionEquipmentError,
        ) as error:
            raise_patch_connection_error(
                error
            )


@router.post(
    "",
    response_model=(
        PatchConnectionResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_connection_between_patches(
    payload: PatchConnectionCreate,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            result = create_patch_connection(
                session=session,
                payload=payload,
                user=(
                    authenticated_user.usuario
                ),
            )

            session.commit()

            return result

        except (
            PatchConnectionNotFoundError,
            PatchConnectionConflictError,
            PatchConnectionValidationError,
            PatchConnectionEquipmentError,
        ) as error:
            session.rollback()

            raise_patch_connection_error(
                error
            )

        except Exception:
            session.rollback()
            raise


@router.delete(
    "/{connection_id}",
    response_model=(
        PatchConnectionDeleteResponse
    ),
)
def disconnect_patches(
    connection_id: int,
    payload: PatchConnectionDeleteRequest,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            result = delete_patch_connection(
                session=session,
                connection_id=connection_id,
                expected_version=(
                    payload.versao_dados
                ),
                user=(
                    authenticated_user.usuario
                ),
            )

            session.commit()

            return result

        except (
            PatchConnectionNotFoundError,
            PatchConnectionConflictError,
            PatchConnectionValidationError,
            PatchConnectionEquipmentError,
        ) as error:
            session.rollback()

            raise_patch_connection_error(
                error
            )

        except Exception:
            session.rollback()
            raise