from datetime import datetime
import json

from sqlalchemy import (
    delete,
    select,
    update,
)

from models.entities import (
    Equipamento,
    Historico,
    PatchPosition,
)


class PatchConversionNotFoundError(
    Exception
):
    pass


class PatchConversionConflictError(
    Exception
):
    pass


class PatchConversionConfirmationError(
    Exception
):
    pass


def get_conversion_equipment(
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
        raise PatchConversionNotFoundError(
            "Equipamento com ID "
            + str(equipment_id)
            + " nao encontrado "
            + "ou nao esta visivel."
        )

    return equipment


def count_patch_positions(
    session,
    equipment_key,
):
    positions = list(
        session.scalars(
            select(
                PatchPosition.id
            ).where(
                PatchPosition.equipamento_key
                == equipment_key
            )
        ).all()
    )

    return len(
        positions
    )


def register_conversion_history(
    session,
    equipment,
    old_is_patch,
    new_is_patch,
    removed_positions,
    user,
):
    old_data = {
        "is_patch": old_is_patch,
    }

    new_data = {
        "is_patch": new_is_patch,
        "posicoes_removidas": (
            removed_positions
        ),
    }

    history = Historico(
        tipo_entidade="equipamento",
        entidade_key=(
            equipment.equipamento_key
        ),
        acao=(
            "conversao_para_patch"
            if new_is_patch
            else "conversao_para_equipamento_normal"
        ),
        dados_anteriores=json.dumps(
            old_data,
            ensure_ascii=False,
            sort_keys=True,
        ),
        dados_novos=json.dumps(
            new_data,
            ensure_ascii=False,
            sort_keys=True,
        ),
        usuario=user,
        data_operacao=datetime.now(),
    )

    session.add(
        history
    )


def build_conversion_response(
    equipment,
    removed_positions,
    message,
):
    return {
        "equipamento_id": (
            equipment.id
        ),
        "equipamento_key": (
            equipment.equipamento_key
        ),
        "equipamento_nome": (
            equipment.nome
        ),
        "is_patch": (
            equipment.is_patch
        ),
        "versao_dados": (
            equipment.versao_dados
        ),
        "posicoes_removidas": (
            removed_positions
        ),
        "confirmacao_necessaria": (
            False
        ),
        "mensagem": message,
    }


def convert_equipment_patch_mode(
    session,
    equipment_id,
    payload,
    user,
):
    equipment = get_conversion_equipment(
        session,
        equipment_id,
    )

    expected_version = int(
        payload.versao_dados
    )

    if (
        equipment.versao_dados
        != expected_version
    ):
        raise PatchConversionConflictError(
            "O equipamento foi alterado "
            "por outra sessao. "
            "Versao recebida: "
            + str(expected_version)
            + ". Versao atual: "
            + str(
                equipment.versao_dados
            )
            + "."
        )

    target_is_patch = bool(
        payload.is_patch
    )

    current_is_patch = bool(
        equipment.is_patch
    )

    if (
        target_is_patch
        == current_is_patch
    ):
        message = (
            "O equipamento ja esta "
            + (
                "classificado como patch."
                if target_is_patch
                else "classificado como normal."
            )
        )

        return build_conversion_response(
            equipment=equipment,
            removed_positions=0,
            message=message,
        )

    existing_positions = (
        count_patch_positions(
            session,
            equipment.equipamento_key,
        )
    )

    if (
        current_is_patch
        and not target_is_patch
        and existing_positions > 0
        and not payload.confirmar_limpeza
    ):
        raise PatchConversionConfirmationError(
            "Este patch possui "
            + str(existing_positions)
            + " posicao(oes) preenchida(s). "
            + "Confirme a limpeza para "
            + "converter o equipamento."
        )

    removed_positions = 0

    if (
        current_is_patch
        and not target_is_patch
        and existing_positions > 0
    ):
        delete_result = session.execute(
            delete(PatchPosition).where(
                PatchPosition.equipamento_key
                == equipment.equipamento_key
            )
        )

        removed_positions = int(
            delete_result.rowcount
            or 0
        )

    current_time = datetime.now()

    statement = (
        update(Equipamento)
        .where(
            Equipamento.id
            == equipment.id,
            Equipamento.versao_dados
            == expected_version,
        )
        .values(
            is_patch=target_is_patch,
            versao_dados=(
                expected_version + 1
            ),
            atualizado_em=current_time,
        )
    )

    result = session.execute(
        statement
    )

    if result.rowcount != 1:
        session.expire_all()

        raise PatchConversionConflictError(
            "O equipamento foi alterado "
            "durante a conversao."
        )

    session.flush()
    session.expire_all()

    converted_equipment = (
        get_conversion_equipment(
            session,
            equipment_id,
        )
    )

    register_conversion_history(
        session=session,
        equipment=converted_equipment,
        old_is_patch=current_is_patch,
        new_is_patch=target_is_patch,
        removed_positions=(
            removed_positions
        ),
        user=user,
    )

    if target_is_patch:
        message = (
            "Equipamento convertido "
            "para patch."
        )
    else:
        message = (
            "Patch convertido para "
            "equipamento normal."
        )

    return build_conversion_response(
        equipment=converted_equipment,
        removed_positions=(
            removed_positions
        ),
        message=message,
    )