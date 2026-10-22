from datetime import datetime
import json

from sqlalchemy import (
    delete,
    select,
    update,
)
from sqlalchemy.exc import IntegrityError

from models.entities import (
    Equipamento,
    Historico,
    PatchPosition,
)


class PatchEquipmentNotFoundError(
    Exception
):
    pass


class PatchEquipmentRequiredError(
    Exception
):
    pass


class PatchPositionConflictError(
    Exception
):
    pass


class PatchPositionValidationError(
    Exception
):
    pass


def clean_patch_text(
    value,
):
    if value is None:
        return None

    cleaned = str(value).strip()

    if not cleaned:
        return None

    return cleaned


def validate_position_number(
    position_number,
):
    if not isinstance(
        position_number,
        int,
    ):
        raise PatchPositionValidationError(
            "O numero da posicao "
            "deve ser inteiro."
        )

    if (
        position_number < 1
        or position_number > 32
    ):
        raise PatchPositionValidationError(
            "A posicao deve estar "
            "entre 1 e 32."
        )


def get_visible_equipment(
    session,
    equipment_id,
):
    equipment = session.scalar(
        select(Equipamento).where(
            Equipamento.id
            == equipment_id,
            Equipamento.visivel.is_(
                True
            ),
        )
    )

    if equipment is None:
        raise PatchEquipmentNotFoundError(
            "Equipamento com ID "
            + str(equipment_id)
            + " nao encontrado "
            + "ou nao esta visivel."
        )

    return equipment


def require_patch_equipment(
    session,
    equipment_id,
):
    equipment = get_visible_equipment(
        session,
        equipment_id,
    )

    if not equipment.is_patch:
        raise PatchEquipmentRequiredError(
            "O equipamento "
            + equipment.nome
            + " nao esta classificado "
            + "como patch."
        )

    return equipment


def get_stored_position(
    session,
    equipment_key,
    position_number,
):
    return session.scalar(
        select(PatchPosition).where(
            PatchPosition.equipamento_key
            == equipment_key,
            PatchPosition.numero_posicao
            == position_number,
        )
    )


def position_to_dict(
    position,
):
    return {
        "id": position.id,
        "equipamento_key": (
            position.equipamento_key
        ),
        "numero_posicao": (
            position.numero_posicao
        ),
        "nome_entrada": (
            position.nome_entrada
        ),
        "nome_saida": (
            position.nome_saida
        ),
        "descricao_conexao_entrada": (
            position
            .descricao_conexao_entrada
        ),
        "descricao_conexao_saida": (
            position
            .descricao_conexao_saida
        ),
        "versao_dados": (
            position.versao_dados
        ),
        "criado_em": (
            position.criado_em
        ),
        "atualizado_em": (
            position.atualizado_em
        ),
    }


def empty_position_dict(
    equipment_key,
    position_number,
):
    return {
        "id": None,
        "equipamento_key": (
            equipment_key
        ),
        "numero_posicao": (
            position_number
        ),
        "nome_entrada": None,
        "nome_saida": None,
        "descricao_conexao_entrada": None,
        "descricao_conexao_saida": None,
        "versao_dados": 1,
        "criado_em": None,
        "atualizado_em": None,
    }


def list_patch_positions(
    session,
    equipment_id,
):
    equipment = require_patch_equipment(
        session,
        equipment_id,
    )

    statement = (
        select(PatchPosition)
        .where(
            PatchPosition.equipamento_key
            == equipment.equipamento_key
        )
        .order_by(
            PatchPosition.numero_posicao
        )
    )

    stored_positions = list(
        session.scalars(
            statement
        ).all()
    )

    stored_by_number = {
        position.numero_posicao:
            position
        for position in stored_positions
    }

    positions = []

    for position_number in range(
        1,
        33,
    ):
        stored_position = (
            stored_by_number.get(
                position_number
            )
        )

        if stored_position is None:
            positions.append(
                empty_position_dict(
                    equipment.equipamento_key,
                    position_number,
                )
            )
        else:
            positions.append(
                position_to_dict(
                    stored_position
                )
            )

    return {
        "equipamento_id": equipment.id,
        "equipamento_key": (
            equipment.equipamento_key
        ),
        "equipamento_nome": (
            equipment.nome
        ),
        "is_patch": (
            equipment.is_patch
        ),
        "posicoes": positions,
    }


def register_patch_history(
    session,
    equipment_key,
    position_number,
    user,
    old_data,
    new_data,
):
    history = Historico(
        tipo_entidade=(
            "posicao_patch"
        ),
        entidade_key=(
            equipment_key
            + ":"
            + str(position_number)
        ),
        acao=(
            "atualizacao_posicao_patch"
        ),
        dados_anteriores=(
            json.dumps(
                old_data,
                ensure_ascii=False,
                sort_keys=True,
                default=str,
            )
            if old_data is not None
            else None
        ),
        dados_novos=(
            json.dumps(
                new_data,
                ensure_ascii=False,
                sort_keys=True,
                default=str,
            )
            if new_data is not None
            else None
        ),
        usuario=user,
        data_operacao=datetime.now(),
    )

    session.add(history)


def touch_patch_equipment(
    session,
    equipment,
):
    current_version = int(
        equipment.versao_dados
        or 1
    )

    current_time = datetime.now()

    statement = (
        update(Equipamento)
        .where(
            Equipamento.id
            == equipment.id,
            Equipamento.versao_dados
            == current_version,
        )
        .values(
            versao_dados=(
                current_version + 1
            ),
            atualizado_em=current_time,
        )
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        raise PatchPositionConflictError(
            "O equipamento patch foi "
            "alterado por outra sessao. "
            "Atualize os dados antes "
            "de tentar novamente."
        )

    session.flush()
    session.expire_all()

    return get_visible_equipment(
        session,
        equipment.id,
    )


def save_patch_position(
    session,
    equipment_id,
    position_number,
    payload,
    user,
):
    validate_position_number(
        position_number
    )

    equipment = require_patch_equipment(
        session,
        equipment_id,
    )

    input_name = clean_patch_text(
        payload.nome_entrada
    )

    output_name = clean_patch_text(
        payload.nome_saida
    )

    input_connection_description = (
        clean_patch_text(
            payload
            .descricao_conexao_entrada
        )
    )

    output_connection_description = (
        clean_patch_text(
            payload
            .descricao_conexao_saida
        )
    )

    existing = get_stored_position(
        session,
        equipment.equipamento_key,
        position_number,
    )

    old_data = (
        position_to_dict(
            existing
        )
        if existing is not None
        else None
    )

    position_is_empty = (
        input_name is None
        and output_name is None
        and input_connection_description
        is None
        and output_connection_description
        is None
    )

    if (
        existing is None
        and position_is_empty
    ):
        return empty_position_dict(
            equipment.equipamento_key,
            position_number,
        )

    if existing is not None:
        expected_version = (
            payload.versao_dados
        )

        if (
            expected_version is not None
            and expected_version
            != existing.versao_dados
        ):
            raise PatchPositionConflictError(
                "A posicao "
                + str(position_number)
                + " foi alterada "
                + "por outra sessao. "
                + "Versao recebida: "
                + str(expected_version)
                + ". Versao atual: "
                + str(
                    existing.versao_dados
                )
                + "."
            )

    if position_is_empty:
        session.execute(
            delete(PatchPosition).where(
                PatchPosition.id
                == existing.id
            )
        )

        register_patch_history(
            session=session,
            equipment_key=(
                equipment.equipamento_key
            ),
            position_number=(
                position_number
            ),
            user=user,
            old_data=old_data,
            new_data=None,
        )

        touch_patch_equipment(
            session,
            equipment,
        )

        return empty_position_dict(
            equipment.equipamento_key,
            position_number,
        )

    current_time = datetime.now()

    if existing is None:
        position = PatchPosition(
            equipamento_key=(
                equipment.equipamento_key
            ),
            numero_posicao=(
                position_number
            ),
            nome_entrada=input_name,
            nome_saida=output_name,
            descricao_conexao_entrada=(
                input_connection_description
            ),
            descricao_conexao_saida=(
                output_connection_description
            ),
            versao_dados=1,
            criado_em=current_time,
            atualizado_em=current_time,
        )

        session.add(position)

        try:
            session.flush()
        except IntegrityError as error:
            raise PatchPositionConflictError(
                "A posicao "
                + str(position_number)
                + " foi criada por "
                + "outra sessao."
            ) from error

    else:
        next_version = (
            existing.versao_dados
            + 1
        )

        statement = (
            update(PatchPosition)
            .where(
                PatchPosition.id
                == existing.id,
                PatchPosition.versao_dados
                == existing.versao_dados,
            )
            .values(
                nome_entrada=input_name,
                nome_saida=output_name,
                descricao_conexao_entrada=(
                    input_connection_description
                ),
                descricao_conexao_saida=(
                    output_connection_description
                ),
                versao_dados=next_version,
                atualizado_em=current_time,
            )
        )

        result = session.execute(
            statement
        )

        if result.rowcount != 1:
            session.expire_all()

            raise PatchPositionConflictError(
                "A posicao "
                + str(position_number)
                + " foi alterada "
                + "por outra sessao."
            )

        session.flush()
        session.expire_all()

        position = get_stored_position(
            session,
            equipment.equipamento_key,
            position_number,
        )

    new_data = position_to_dict(
        position
    )

    register_patch_history(
        session=session,
        equipment_key=(
            equipment.equipamento_key
        ),
        position_number=position_number,
        user=user,
        old_data=old_data,
        new_data=new_data,
    )

    touch_patch_equipment(
        session,
        equipment,
    )

    return new_data


def patch_has_content(
    session,
    equipment_key,
):
    stored_position = session.scalar(
        select(PatchPosition.id)
        .where(
            PatchPosition.equipamento_key
            == equipment_key
        )
        .limit(1)
    )

    return stored_position is not None


def clear_patch_positions(
    session,
    equipment_key,
):
    result = session.execute(
        delete(PatchPosition).where(
            PatchPosition.equipamento_key
            == equipment_key
        )
    )

    return int(
        result.rowcount
        or 0
    )