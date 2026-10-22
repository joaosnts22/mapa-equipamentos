import json

from sqlalchemy import (
    func,
    select,
)

from models.entities import Historico


ALLOWED_HISTORY_ENTITY_TYPES = {
    "rack",
    "equipamento",
    "documento",
}


class HistoryValidationError(Exception):
    pass


def sanitize_history_value(
    value,
):
    if isinstance(
        value,
        dict,
    ):
        sanitized = {}

        for key, nested_value in value.items():
            if key == "caminho_arquivo":
                continue

            sanitized[key] = (
                sanitize_history_value(
                    nested_value
                )
            )

        return sanitized

    if isinstance(
        value,
        list,
    ):
        return [
            sanitize_history_value(
                item
            )
            for item in value
        ]

    return value


def parse_history_json(
    raw_value,
):
    if raw_value is None:
        return None

    normalized_value = str(
        raw_value
    ).strip()

    if not normalized_value:
        return None

    try:
        parsed_value = json.loads(
            normalized_value
        )
    except json.JSONDecodeError:
        return {
            "valor_nao_estruturado":
                normalized_value
        }

    return sanitize_history_value(
        parsed_value
    )


def history_to_response(
    history,
):
    return {
        "id": history.id,
        "tipo_entidade":
            history.tipo_entidade,
        "entidade_key":
            history.entidade_key,
        "acao": history.acao,
        "usuario": history.usuario,
        "data_operacao":
            history.data_operacao,
        "dados_anteriores":
            parse_history_json(
                history.dados_anteriores
            ),
        "dados_novos":
            parse_history_json(
                history.dados_novos
            ),
    }


def validate_history_filters(
    entity_type,
    limit,
    offset,
):
    if (
        entity_type is not None
        and entity_type
        not in ALLOWED_HISTORY_ENTITY_TYPES
    ):
        allowed_types = ", ".join(
            sorted(
                ALLOWED_HISTORY_ENTITY_TYPES
            )
        )

        raise HistoryValidationError(
            "Tipo de entidade invalido. "
            + "Valores permitidos: "
            + allowed_types
            + "."
        )

    if limit < 1 or limit > 100:
        raise HistoryValidationError(
            "O limite deve estar "
            "entre 1 e 100."
        )

    if offset < 0:
        raise HistoryValidationError(
            "O deslocamento nao pode "
            "ser negativo."
        )


def build_history_filters(
    entity_type=None,
    entity_key=None,
    action=None,
    user=None,
):
    filters = []

    if entity_type:
        filters.append(
            Historico.tipo_entidade
            == entity_type
        )

    if entity_key:
        filters.append(
            Historico.entidade_key
            == entity_key
        )

    if action:
        filters.append(
            Historico.acao
            == action
        )

    if user:
        filters.append(
            Historico.usuario
            == user
        )

    return filters


def list_history(
    session,
    limit=50,
    offset=0,
    entity_type=None,
    entity_key=None,
    action=None,
    user=None,
):
    normalized_entity_type = (
        str(entity_type).strip().lower()
        if entity_type is not None
        and str(entity_type).strip()
        else None
    )

    normalized_entity_key = (
        str(entity_key).strip()
        if entity_key is not None
        and str(entity_key).strip()
        else None
    )

    normalized_action = (
        str(action).strip()
        if action is not None
        and str(action).strip()
        else None
    )

    normalized_user = (
        str(user).strip()
        if user is not None
        and str(user).strip()
        else None
    )

    validate_history_filters(
        entity_type=(
            normalized_entity_type
        ),
        limit=limit,
        offset=offset,
    )

    filters = build_history_filters(
        entity_type=(
            normalized_entity_type
        ),
        entity_key=(
            normalized_entity_key
        ),
        action=normalized_action,
        user=normalized_user,
    )

    count_statement = select(
        func.count(
            Historico.id
        )
    )

    if filters:
        count_statement = (
            count_statement.where(
                *filters
            )
        )

    total = session.scalar(
        count_statement
    )

    statement = (
        select(Historico)
        .order_by(
            Historico.data_operacao.desc(),
            Historico.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    if filters:
        statement = statement.where(
            *filters
        )

    records = list(
        session.scalars(
            statement
        ).all()
    )

    return {
        "itens": [
            history_to_response(
                record
            )
            for record in records
        ],
        "total": int(
            total or 0
        ),
        "limite": limit,
        "deslocamento": offset,
    }