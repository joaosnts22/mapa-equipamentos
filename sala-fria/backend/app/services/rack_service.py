from datetime import datetime
import json

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.entities import Equipamento, Historico, Rack
from schemas.rack import RackCreate, RackUpdate


class RackNotFoundError(Exception):
    pass


class RackConflictError(Exception):
    pass


class RackDuplicateKeyError(Exception):
    pass


def rack_to_dict(rack):
    return {
        "id": rack.id,
        "rack_key": rack.rack_key,
        "display_name": rack.display_name,
        "layout": rack.layout,
        "posicao_x": rack.posicao_x,
        "posicao_y": rack.posicao_y,
        "largura": rack.largura,
        "altura": rack.altura,
        "frente": rack.frente,
        "area_responsavel": rack.area_responsavel,
        "visivel": rack.visivel,
        "ordem": rack.ordem,
        "sala_key": rack.sala_key,
        "quantidade_modulos": rack.quantidade_modulos,
        "quantidade_ru": rack.quantidade_ru,
        "versao_dados": rack.versao_dados,
        "criado_em": (
            rack.criado_em.isoformat()
            if rack.criado_em
            else None
        ),
        "atualizado_em": (
            rack.atualizado_em.isoformat()
            if rack.atualizado_em
            else None
        ),
    }


def register_history(
    session,
    entity_key,
    action,
    user,
    old_data=None,
    new_data=None,
):
    record = Historico(
        tipo_entidade="rack",
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

    session.add(record)


def get_rack_by_id(
    session,
    rack_id,
):
    rack = session.scalar(
        select(Rack).where(
            Rack.id == rack_id
        )
    )

    if rack is None:
        raise RackNotFoundError(
            f"Fileira com ID {rack_id} nao encontrada."
        )

    return rack


def create_rack(
    session,
    payload,
    user,
):
    existing = session.scalar(
        select(Rack).where(
            Rack.rack_key == payload.rack_key
        )
    )

    if existing is not None:
        raise RackDuplicateKeyError(
            "Ja existe uma fileira com essa rack_key."
        )

    rack = Rack(
        **payload.model_dump(),
        versao_dados=1,
        criado_em=datetime.now(),
        atualizado_em=datetime.now(),
    )

    session.add(rack)

    try:
        session.flush()
    except IntegrityError as error:
        raise RackDuplicateKeyError(
            "Ja existe uma fileira com essa rack_key."
        ) from error

    new_data = rack_to_dict(rack)

    register_history(
        session=session,
        entity_key=rack.rack_key,
        action="criacao",
        user=user,
        old_data=None,
        new_data=new_data,
    )

    return rack


def update_rack(
    session,
    rack_id,
    payload,
    user,
):
    current_rack = get_rack_by_id(
        session,
        rack_id,
    )

    old_data = rack_to_dict(
        current_rack
    )

    expected_version = payload.versao_dados

    changes = payload.model_dump(
        exclude={
            "versao_dados",
        },
        exclude_unset=True,
    )

    if not changes:
        return current_rack

    if "rack_key" in changes:
        existing = session.scalar(
            select(Rack).where(
                Rack.rack_key == changes["rack_key"],
                Rack.id != rack_id,
            )
        )

        if existing is not None:
            raise RackDuplicateKeyError(
                "Ja existe outra fileira com essa rack_key."
            )

    if "quantidade_modulos" in changes:
        new_module_count = int(
            changes["quantidade_modulos"]
        )

        if (
            new_module_count
            < current_rack.quantidade_modulos
        ):
            incompatible_equipment = list(
                session.scalars(
                    select(Equipamento)
                    .where(
                        Equipamento.rack_key
                        == current_rack.rack_key,
                        Equipamento.visivel.is_(
                            True
                        ),
                        Equipamento.modulo_rack
                        > new_module_count,
                    )
                    .order_by(
                        Equipamento.modulo_rack,
                        Equipamento.nome,
                    )
                ).all()
            )

            if incompatible_equipment:
                equipment_details = ", ".join(
                    (
                        equipment.nome
                        + " (rack "
                        + str(
                            equipment.modulo_rack
                        )
                        + ")"
                    )
                    for equipment
                    in incompatible_equipment
                )

                raise RackConflictError(
                    "Nao e possivel reduzir a fileira "
                    + "para "
                    + str(new_module_count)
                    + " rack(s). "
                    + "Existem equipamentos visiveis "
                    + "em racks que deixariam de "
                    + "existir: "
                    + equipment_details
                    + ". Mova esses equipamentos antes "
                    + "de reduzir a quantidade de "
                    + "racks."
                )

    position_fields = {
        "posicao_x",
        "posicao_y",
        "largura",
        "altura",
    }

    changed_fields = set(changes.keys())

    if changed_fields.issubset(position_fields):
        action = "alteracao_posicao_rack"
    else:
        action = "atualizacao"

    new_version = expected_version + 1
    update_time = datetime.now()

    changes["versao_dados"] = new_version
    changes["atualizado_em"] = update_time

    statement = (
        update(Rack)
        .where(
            Rack.id == rack_id,
            Rack.versao_dados == expected_version,
        )
        .values(**changes)
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        latest_rack = get_rack_by_id(
            session,
            rack_id,
        )

        raise RackConflictError(
            "A fileira foi alterada por outra sessao. "
            f"Versao recebida: {expected_version}. "
            f"Versao atual: {latest_rack.versao_dados}."
        )

    session.flush()
    session.expire_all()

    updated_rack = get_rack_by_id(
        session,
        rack_id,
    )

    new_data = rack_to_dict(
        updated_rack
    )

    register_history(
        session=session,
        entity_key=updated_rack.rack_key,
        action=action,
        user=user,
        old_data=old_data,
        new_data=new_data,
    )

    return updated_rack


def soft_delete_rack(
    session,
    rack_id,
    expected_version,
    user,
):
    current_rack = get_rack_by_id(
        session,
        rack_id,
    )

    visible_equipment_id = session.scalar(
        select(Equipamento.id)
        .where(
            Equipamento.rack_key
            == current_rack.rack_key,
            Equipamento.visivel.is_(True),
        )
        .limit(1)
    )

    if visible_equipment_id is not None:
        raise RackConflictError(
            "Nao e possivel excluir a fileira "
            "enquanto existirem equipamentos "
            "visiveis vinculados a ele."
        )

    old_data = rack_to_dict(
        current_rack
    )

    new_version = expected_version + 1
    update_time = datetime.now()

    statement = (
        update(Rack)
        .where(
            Rack.id == rack_id,
            Rack.versao_dados == expected_version,
        )
        .values(
            visivel=False,
            versao_dados=new_version,
            atualizado_em=update_time,
        )
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        latest_rack = get_rack_by_id(
            session,
            rack_id,
        )

        raise RackConflictError(
            "A fileira foi alterada por outra sessao. "
            f"Versao recebida: {expected_version}. "
            f"Versao atual: {latest_rack.versao_dados}."
        )

    session.flush()
    session.expire_all()

    deleted_rack = get_rack_by_id(
        session,
        rack_id,
    )

    new_data = rack_to_dict(
        deleted_rack
    )

    register_history(
        session=session,
        entity_key=deleted_rack.rack_key,
        action="remocao_logica",
        user=user,
        old_data=old_data,
        new_data=new_data,
    )

    return deleted_rack