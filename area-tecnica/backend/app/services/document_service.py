from datetime import datetime
import json

from sqlalchemy import (
    select,
    update,
)

from models.entities import (
    Documento,
    Equipamento,
    Historico,
)


ALLOWED_DOCUMENT_TYPES = {
    "Foto",
    "Diagrama",
    "Manual",
    "GMUD",
    "Inventario",
    "Outro",
}


class DocumentNotFoundError(Exception):
    pass


class DocumentEquipmentNotFoundError(Exception):
    pass


class DocumentValidationError(Exception):
    pass


class DocumentConflictError(Exception):
    pass


def document_to_dict(document):
    return {
        "id": document.id,
        "nome_documento": (
            document.nome_documento
        ),
        "equipamento_key": (
            document.equipamento_key
        ),
        "rack_key": document.rack_key,
        "tipo_documento": (
            document.tipo_documento
        ),
        "caminho_arquivo": (
            document.caminho_arquivo
        ),
        "descricao": document.descricao,
        "visivel": document.visivel,
        "criado_em": (
            document.criado_em.isoformat()
            if document.criado_em
            else None
        ),
        "atualizado_em": (
            document.atualizado_em.isoformat()
            if document.atualizado_em
            else None
        ),
    }


def register_document_history(
    session,
    entity_key,
    action,
    user,
    old_data=None,
    new_data=None,
):
    history = Historico(
        tipo_entidade="documento",
        entidade_key=str(entity_key),
        acao=action,
        dados_anteriores=(
            json.dumps(
                old_data,
                ensure_ascii=False,
                sort_keys=True,
            )
            if old_data is not None
            else None
        ),
        dados_novos=(
            json.dumps(
                new_data,
                ensure_ascii=False,
                sort_keys=True,
            )
            if new_data is not None
            else None
        ),
        usuario=user,
        data_operacao=datetime.now(),
    )

    session.add(history)


def get_visible_equipment_by_id(
    session,
    equipment_id,
):
    equipment = session.scalar(
        select(Equipamento).where(
            Equipamento.id == equipment_id,
            Equipamento.visivel.is_(True),
        )
    )

    if equipment is None:
        raise DocumentEquipmentNotFoundError(
            "Equipamento com ID "
            + str(equipment_id)
            + " nao encontrado ou nao visivel."
        )

    return equipment


def get_document_by_id(
    session,
    document_id,
):
    document = session.scalar(
        select(Documento).where(
            Documento.id == document_id
        )
    )

    if document is None:
        raise DocumentNotFoundError(
            "Documento com ID "
            + str(document_id)
            + " nao encontrado."
        )

    return document


def get_visible_document_by_id(
    session,
    document_id,
):
    document = session.scalar(
        select(Documento).where(
            Documento.id == document_id,
            Documento.visivel.is_(True),
        )
    )

    if document is None:
        raise DocumentNotFoundError(
            "Documento com ID "
            + str(document_id)
            + " nao encontrado ou nao visivel."
        )

    return document


def list_visible_documents_for_equipment(
    session,
    equipment_id,
):
    equipment = get_visible_equipment_by_id(
        session,
        equipment_id,
    )

    statement = (
        select(Documento)
        .where(
            Documento.equipamento_key
            == equipment.equipamento_key,
            Documento.visivel.is_(True),
        )
        .order_by(
            Documento.criado_em.desc(),
            Documento.id.desc(),
        )
    )

    return list(
        session.scalars(
            statement
        ).all()
    )


def validate_document_type(
    document_type,
):
    if document_type not in ALLOWED_DOCUMENT_TYPES:
        allowed_types = ", ".join(
            sorted(
                ALLOWED_DOCUMENT_TYPES
            )
        )

        raise DocumentValidationError(
            "Tipo de documento invalido. "
            + "Valores permitidos: "
            + allowed_types
            + "."
        )


def validate_document_name(
    document_name,
):
    normalized_name = str(
        document_name or ""
    ).strip()

    if not normalized_name:
        raise DocumentValidationError(
            "Informe o nome do documento."
        )

    if len(normalized_name) > 255:
        raise DocumentValidationError(
            "O nome do documento deve possuir "
            "no maximo 255 caracteres."
        )

    if (
        "/" in normalized_name
        or "\\" in normalized_name
        or "\x00" in normalized_name
    ):
        raise DocumentValidationError(
            "O nome do documento contem "
            "caracteres de caminho invalidos."
        )

    return normalized_name


def validate_relative_file_path(
    relative_file_path,
):
    normalized_path = str(
        relative_file_path or ""
    ).strip()

    if not normalized_path:
        raise DocumentValidationError(
            "O caminho do arquivo nao foi informado."
        )

    if "\x00" in normalized_path:
        raise DocumentValidationError(
            "O caminho do arquivo contem "
            "caractere invalido."
        )

    if normalized_path.startswith(
        (
            "/",
            "\\",
        )
    ):
        raise DocumentValidationError(
            "O caminho do arquivo deve ser relativo."
        )

    path_parts = normalized_path.replace(
        "\\",
        "/",
    ).split("/")

    if ".." in path_parts:
        raise DocumentValidationError(
            "O caminho do arquivo nao pode "
            "conter navegacao para pasta superior."
        )

    return normalized_path


def create_document_record(
    session,
    equipment_id,
    document_name,
    document_type,
    relative_file_path,
    description,
    user,
):
    equipment = get_visible_equipment_by_id(
        session,
        equipment_id,
    )

    normalized_name = validate_document_name(
        document_name
    )

    normalized_type = str(
        document_type or ""
    ).strip()

    validate_document_type(
        normalized_type
    )

    normalized_path = (
        validate_relative_file_path(
            relative_file_path
        )
    )

    normalized_description = (
        str(description).strip()
        if description is not None
        and str(description).strip()
        else None
    )

    document = Documento(
        nome_documento=normalized_name,
        equipamento_key=(
            equipment.equipamento_key
        ),
        rack_key=None,
        tipo_documento=normalized_type,
        caminho_arquivo=normalized_path,
        descricao=normalized_description,
        visivel=True,
        criado_em=datetime.now(),
        atualizado_em=datetime.now(),
    )

    session.add(document)
    session.flush()
    session.refresh(document)

    register_document_history(
        session=session,
        entity_key=document.id,
        action="criacao",
        user=user,
        old_data=None,
        new_data=document_to_dict(
            document
        ),
    )

    return document


def soft_delete_document(
    session,
    document_id,
    user,
):
    current_document = (
        get_visible_document_by_id(
            session,
            document_id,
        )
    )

    old_data = document_to_dict(
        current_document
    )

    statement = (
        update(Documento)
        .where(
            Documento.id == document_id,
            Documento.visivel.is_(True),
        )
        .values(
            visivel=False,
            atualizado_em=datetime.now(),
        )
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        latest_document = (
            get_document_by_id(
                session,
                document_id,
            )
        )

        if not latest_document.visivel:
            raise DocumentConflictError(
                "O documento ja foi removido "
                "por outra sessao."
            )

        raise DocumentConflictError(
            "O documento foi alterado "
            "por outra sessao."
        )

    session.flush()
    session.expire_all()

    deleted_document = (
        get_document_by_id(
            session,
            document_id,
        )
    )

    register_document_history(
        session=session,
        entity_key=deleted_document.id,
        action="remocao_logica",
        user=user,
        old_data=old_data,
        new_data=document_to_dict(
            deleted_document
        ),
    )

    return deleted_document