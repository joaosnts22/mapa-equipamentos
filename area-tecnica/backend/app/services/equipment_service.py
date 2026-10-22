from datetime import datetime
import json

from sqlalchemy import (
    select,
    update,
)
from sqlalchemy.exc import IntegrityError

from models.entities import (
    Equipamento,
    Historico,
    Rack,
)


class EquipmentNotFoundError(Exception):
    pass


class EquipmentConflictError(Exception):
    pass


class EquipmentDuplicateKeyError(Exception):
    pass


class EquipmentValidationError(Exception):
    pass


class EquipmentOverlapError(Exception):
    pass


def equipment_to_dict(equipment):
    return {
        "id": equipment.id,
        "equipamento_key": (
            equipment.equipamento_key
        ),
        "rack_key": equipment.rack_key,
        "modulo_rack": (
            equipment.modulo_rack
        ),
        "ru_inicial": equipment.ru_inicial,
        "altura_ru": equipment.altura_ru,
        "nome": equipment.nome,
        "fabricante": equipment.fabricante,
        "modelo": equipment.modelo,
        "numero_serie": (
            equipment.numero_serie
        ),
        "patrimonio": equipment.patrimonio,
        "funcao": equipment.funcao,
        "observacoes": equipment.observacoes,
        "visivel": equipment.visivel,
        "versao_dados": (
            equipment.versao_dados
        ),
        "criado_em": (
            equipment.criado_em.isoformat()
            if equipment.criado_em
            else None
        ),
        "atualizado_em": (
            equipment.atualizado_em.isoformat()
            if equipment.atualizado_em
            else None
        ),
    }


def register_equipment_history(
    session,
    entity_key,
    action,
    user,
    old_data=None,
    new_data=None,
):
    history = Historico(
        tipo_entidade="equipamento",
        entidade_key=entity_key,
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


def get_equipment_by_id(
    session,
    equipment_id,
):
    equipment = session.scalar(
        select(Equipamento).where(
            Equipamento.id == equipment_id
        )
    )

    if equipment is None:
        raise EquipmentNotFoundError(
            "Equipamento com ID "
            + str(equipment_id)
            + " nao encontrado."
        )

    return equipment


def get_visible_rack(
    session,
    rack_key,
):
    rack = session.scalar(
        select(Rack).where(
            Rack.rack_key == rack_key,
            Rack.visivel.is_(True),
        )
    )

    if rack is None:
        raise EquipmentValidationError(
            "A fileira informada nao existe "
            "ou nao esta visivel."
        )

    return rack


def validate_physical_position(
    session,
    rack_key,
    modulo_rack,
    ru_inicial,
    altura_ru,
    ignored_equipment_id=None,
):
    rack = get_visible_rack(
        session,
        rack_key,
    )

    if modulo_rack > rack.quantidade_modulos:
        raise EquipmentValidationError(
            "O rack deve estar entre 1 e "
            + str(rack.quantidade_modulos)
            + "."
        )

    if ru_inicial > rack.quantidade_ru:
        raise EquipmentValidationError(
            "A RU inicial deve estar entre 1 e "
            + str(rack.quantidade_ru)
            + "."
        )

    final_ru = (
        ru_inicial
        + altura_ru
        - 1
    )

    if final_ru > rack.quantidade_ru:
        raise EquipmentValidationError(
            "O equipamento ultrapassa o limite de "
            + str(rack.quantidade_ru)
            + "U do rack."
        )

    statement = select(
        Equipamento
    ).where(
        Equipamento.rack_key == rack_key,
        Equipamento.modulo_rack == modulo_rack,
        Equipamento.visivel.is_(True),
        Equipamento.ru_inicial <= final_ru,
        (
            Equipamento.ru_inicial
            + Equipamento.altura_ru
            - 1
        ) >= ru_inicial,
    )

    if ignored_equipment_id is not None:
        statement = statement.where(
            Equipamento.id
            != ignored_equipment_id
        )

    overlapping_equipment = session.scalar(
        statement.limit(1)
    )

    if overlapping_equipment is not None:
        occupied_start = (
            overlapping_equipment.ru_inicial
        )

        occupied_end = (
            overlapping_equipment.ru_inicial
            + overlapping_equipment.altura_ru
            - 1
        )

        raise EquipmentOverlapError(
            "Conflito com o equipamento "
            + overlapping_equipment.nome
            + ", que ocupa o rack "
            + str(
                overlapping_equipment.modulo_rack
            )
            + " entre U"
            + str(occupied_start)
            + " e U"
            + str(occupied_end)
            + "."
        )

    return rack


def create_equipment(
    session,
    payload,
    user,
):
    existing = session.scalar(
        select(Equipamento).where(
            Equipamento.equipamento_key
            == payload.equipamento_key
        )
    )

    if existing is not None:
        raise EquipmentDuplicateKeyError(
            "Ja existe um equipamento "
            "com essa equipamento_key."
        )

    validate_physical_position(
        session=session,
        rack_key=payload.rack_key,
        modulo_rack=payload.modulo_rack,
        ru_inicial=payload.ru_inicial,
        altura_ru=payload.altura_ru,
    )

    current_time = datetime.now()

    equipment = Equipamento(
        **payload.model_dump(),
        versao_dados=1,
        criado_em=current_time,
        atualizado_em=current_time,
    )

    session.add(equipment)

    try:
        session.flush()
    except IntegrityError as error:
        raise EquipmentDuplicateKeyError(
            "Ja existe um equipamento "
            "com essa equipamento_key."
        ) from error

    register_equipment_history(
        session=session,
        entity_key=(
            equipment.equipamento_key
        ),
        action="criacao",
        user=user,
        old_data=None,
        new_data=equipment_to_dict(
            equipment
        ),
    )

    return equipment


def update_equipment(
    session,
    equipment_id,
    payload,
    user,
):
    current_equipment = (
        get_equipment_by_id(
            session,
            equipment_id,
        )
    )

    old_data = equipment_to_dict(
        current_equipment
    )

    expected_version = (
        payload.versao_dados
    )

    changes = payload.model_dump(
        exclude={
            "versao_dados",
        },
        exclude_unset=True,
    )

    effective_changes = {}

    for field_name, new_value in changes.items():
        current_value = getattr(
            current_equipment,
            field_name,
        )

        if current_value != new_value:
            effective_changes[
                field_name
            ] = new_value

    changes = effective_changes

    if not changes:
        return current_equipment

    target_rack_key = changes.get(
        "rack_key",
        current_equipment.rack_key,
    )

    target_module = changes.get(
        "modulo_rack",
        current_equipment.modulo_rack,
    )

    target_start = changes.get(
        "ru_inicial",
        current_equipment.ru_inicial,
    )

    target_height = changes.get(
        "altura_ru",
        current_equipment.altura_ru,
    )

    validate_physical_position(
        session=session,
        rack_key=target_rack_key,
        modulo_rack=target_module,
        ru_inicial=target_start,
        altura_ru=target_height,
        ignored_equipment_id=equipment_id,
    )

    position_fields = {
        "rack_key",
        "modulo_rack",
        "ru_inicial",
        "altura_ru",
    }

    changed_fields = set(
        changes.keys()
    )

    if changed_fields.issubset(
        position_fields
    ):
        action = (
            "alteracao_posicao_equipamento"
        )
    else:
        action = "atualizacao"

    changes["versao_dados"] = (
        expected_version + 1
    )

    changes["atualizado_em"] = (
        datetime.now()
    )

    statement = (
        update(Equipamento)
        .where(
            Equipamento.id == equipment_id,
            Equipamento.versao_dados
            == expected_version,
        )
        .values(**changes)
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        latest_equipment = (
            get_equipment_by_id(
                session,
                equipment_id,
            )
        )

        raise EquipmentConflictError(
            "O equipamento foi alterado "
            "por outra sessao. "
            "Versao recebida: "
            + str(expected_version)
            + ". Versao atual: "
            + str(
                latest_equipment.versao_dados
            )
            + "."
        )

    session.flush()
    session.expire_all()

    updated_equipment = (
        get_equipment_by_id(
            session,
            equipment_id,
        )
    )

    register_equipment_history(
        session=session,
        entity_key=(
            updated_equipment.equipamento_key
        ),
        action=action,
        user=user,
        old_data=old_data,
        new_data=equipment_to_dict(
            updated_equipment
        ),
    )

    return updated_equipment


def soft_delete_equipment(
    session,
    equipment_id,
    expected_version,
    user,
):
    current_equipment = (
        get_equipment_by_id(
            session,
            equipment_id,
        )
    )

    old_data = equipment_to_dict(
        current_equipment
    )

    statement = (
        update(Equipamento)
        .where(
            Equipamento.id == equipment_id,
            Equipamento.versao_dados
            == expected_version,
        )
        .values(
            visivel=False,
            versao_dados=(
                expected_version + 1
            ),
            atualizado_em=datetime.now(),
        )
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        latest_equipment = (
            get_equipment_by_id(
                session,
                equipment_id,
            )
        )

        raise EquipmentConflictError(
            "O equipamento foi alterado "
            "por outra sessao. "
            "Versao recebida: "
            + str(expected_version)
            + ". Versao atual: "
            + str(
                latest_equipment.versao_dados
            )
            + "."
        )

    session.flush()
    session.expire_all()

    deleted_equipment = (
        get_equipment_by_id(
            session,
            equipment_id,
        )
    )

    register_equipment_history(
        session=session,
        entity_key=(
            deleted_equipment.equipamento_key
        ),
        action="remocao_logica",
        user=user,
        old_data=old_data,
        new_data=equipment_to_dict(
            deleted_equipment
        ),
    )

    return deleted_equipment