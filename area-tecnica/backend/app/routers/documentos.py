from pathlib import Path
import mimetypes
from urllib.parse import unquote

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Request,
    status,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError

from database import SessionLocal
from schemas.documento import (
    DocumentoResponse,
    DocumentoUploadMetadata,
)
from security.dependencies import (
    require_administrator,
)
from services.document_service import (
    DocumentConflictError,
    DocumentEquipmentNotFoundError,
    DocumentNotFoundError,
    DocumentValidationError,
    create_document_record,
    get_visible_document_by_id,
    list_visible_documents_for_equipment,
    soft_delete_document,
)
from services.document_storage import (
    DocumentExtensionError,
    DocumentPathError,
    DocumentSizeError,
    DocumentStorageError,
    build_relative_document_path,
    delete_document_content,
    resolve_document_path,
    save_document_content,
)


router = APIRouter(
    prefix="/api/documentos",
    tags=["documentos"],
)


def decode_header_value(
    value,
):
    if value is None:
        return None

    try:
        return unquote(
            str(value)
        )
    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Nao foi possivel interpretar "
                "os metadados do documento."
            ),
        ) from error


def raise_document_error(
    error,
):
    if isinstance(
        error,
        (
            DocumentNotFoundError,
            DocumentEquipmentNotFoundError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    if isinstance(
        error,
        DocumentConflictError,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

    if isinstance(
        error,
        (
            DocumentValidationError,
            DocumentExtensionError,
            DocumentPathError,
            DocumentSizeError,
        ),
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(error),
        )

    if isinstance(
        error,
        DocumentStorageError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        )

    raise error


@router.get(
    "/equipamentos/{equipment_id}",
    response_model=list[DocumentoResponse],
)
def list_equipment_documents(
    equipment_id: int,
):
    with SessionLocal() as session:
        try:
            return (
                list_visible_documents_for_equipment(
                    session=session,
                    equipment_id=equipment_id,
                )
            )

        except (
            DocumentNotFoundError,
            DocumentEquipmentNotFoundError,
            DocumentValidationError,
        ) as error:
            raise_document_error(
                error
            )


@router.post(
    "/equipamentos/{equipment_id}",
    response_model=DocumentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_equipment_document(
    equipment_id: int,
    request: Request,
    document_name_header: str | None = Header(
        default=None,
        alias="X-Document-Name",
    ),
    document_type_header: str | None = Header(
        default=None,
        alias="X-Document-Type",
    ),
    document_description_header: str | None = Header(
        default=None,
        alias="X-Document-Description",
    ),
    original_filename_header: str | None = Header(
        default=None,
        alias="X-Original-Filename",
    ),
    authenticated_user=Depends(
        require_administrator
    ),
):
    saved_relative_path = None

    document_name = decode_header_value(
        document_name_header
    )

    document_type = decode_header_value(
        document_type_header
    )

    document_description = decode_header_value(
        document_description_header
    )

    original_filename = decode_header_value(
        original_filename_header
    )

    try:
        metadata = DocumentoUploadMetadata(
            nome_documento=(
                document_name or ""
            ),
            tipo_documento=(
                document_type or ""
            ),
            descricao=document_description,
        )
    except ValidationError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=error.errors(),
        ) from error

    content_length_header = (
        request.headers.get(
            "content-length"
        )
    )

    if content_length_header:
        try:
            content_length = int(
                content_length_header
            )
        except ValueError as error:
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "O tamanho informado do arquivo "
                    "nao e valido."
                ),
            ) from error

        if content_length > (
            50
            * 1024
            * 1024
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                ),
                detail=(
                    "O arquivo ultrapassa "
                    "o limite de 50 MiB."
                ),
            )

    content = await request.body()

    with SessionLocal() as session:
        try:
            equipment = (
                list_visible_documents_for_equipment(
                    session=session,
                    equipment_id=equipment_id,
                )
            )

            del equipment

            from services.document_service import (
                get_visible_equipment_by_id,
            )

            visible_equipment = (
                get_visible_equipment_by_id(
                    session=session,
                    equipment_id=equipment_id,
                )
            )

            saved_relative_path = (
                build_relative_document_path(
                    equipment_key=(
                        visible_equipment.equipamento_key
                    ),
                    original_filename=(
                        original_filename
                        or metadata.nome_documento
                    ),
                )
            )

            save_document_content(
                relative_file_path=(
                    saved_relative_path
                ),
                content=content,
            )

            document = create_document_record(
                session=session,
                equipment_id=equipment_id,
                document_name=(
                    metadata.nome_documento
                ),
                document_type=(
                    metadata.tipo_documento
                ),
                relative_file_path=(
                    saved_relative_path
                ),
                description=(
                    metadata.descricao
                ),
                user=(
                    authenticated_user.usuario
                ),
            )

            session.commit()
            session.refresh(
                document
            )

            return document

        except (
            DocumentNotFoundError,
            DocumentEquipmentNotFoundError,
            DocumentValidationError,
            DocumentConflictError,
            DocumentExtensionError,
            DocumentPathError,
            DocumentSizeError,
            DocumentStorageError,
        ) as error:
            session.rollback()

            if saved_relative_path:
                try:
                    delete_document_content(
                        saved_relative_path
                    )
                except Exception:
                    pass

            raise_document_error(
                error
            )

        except Exception:
            session.rollback()

            if saved_relative_path:
                try:
                    delete_document_content(
                        saved_relative_path
                    )
                except Exception:
                    pass

            raise


@router.get(
    "/{document_id}/arquivo",
)
def download_document_file(
    document_id: int,
):
    with SessionLocal() as session:
        try:
            document = (
                get_visible_document_by_id(
                    session=session,
                    document_id=document_id,
                )
            )

            file_path = resolve_document_path(
                document.caminho_arquivo
            )

            if not file_path.is_file():
                raise DocumentNotFoundError(
                    "O arquivo fisico do documento "
                    "nao foi encontrado."
                )

            media_type = (
                mimetypes.guess_type(
                    document.nome_documento
                )[0]
                or "application/octet-stream"
            )

            return FileResponse(
                path=str(file_path),
                media_type=media_type,
                filename=(
                    document.nome_documento
                ),
            )

        except (
            DocumentNotFoundError,
            DocumentPathError,
            DocumentStorageError,
        ) as error:
            raise_document_error(
                error
            )


@router.delete(
    "/{document_id}",
    response_model=DocumentoResponse,
)
def delete_document_endpoint(
    document_id: int,
    authenticated_user=Depends(
        require_administrator
    ),
):
    with SessionLocal() as session:
        try:
            document = soft_delete_document(
                session=session,
                document_id=document_id,
                user=(
                    authenticated_user.usuario
                ),
            )

            session.commit()
            session.refresh(
                document
            )

            return document

        except (
            DocumentNotFoundError,
            DocumentConflictError,
            DocumentValidationError,
        ) as error:
            session.rollback()

            raise_document_error(
                error
            )

        except Exception:
            session.rollback()
            raise
