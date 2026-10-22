from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.entities import (
    Equipamento,
    PatchPosition,
    Rack,
)
from services.sync_service import get_sync_data


def text_or_empty(value):
    return value or ""


def build_frontend_data(session: Session):
    rack_statement = (
        select(Rack)
        .where(
            Rack.visivel.is_(True)
        )
        .order_by(
            Rack.ordem,
            Rack.id,
        )
    )

    equipment_statement = (
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

    rack_records = list(
        session.scalars(
            rack_statement
        ).all()
    )

    equipment_records = list(
        session.scalars(
            equipment_statement
        ).all()
    )

    patch_position_records = list(
        session.scalars(
            select(PatchPosition).order_by(
                PatchPosition.equipamento_key,
                PatchPosition.numero_posicao,
            )
        ).all()
    )

    patch_search_terms = defaultdict(
        list
    )

    for position in patch_position_records:
        for value in (
            position.nome_entrada,
            position.nome_saida,
        ):
            normalized_value = (
                str(value).strip()
                if value is not None
                else ""
            )

            if (
                normalized_value
                and normalized_value
                not in patch_search_terms[
                    position.equipamento_key
                ]
            ):
                patch_search_terms[
                    position.equipamento_key
                ].append(
                    normalized_value
                )

    equipments_by_rack = defaultdict(
        list
    )

    for equipment in equipment_records:
        equipments_by_rack[
            equipment.rack_key
        ].append(
            {
                "databaseId": equipment.id,
                "id": equipment.equipamento_key,
                "equipmentKey": (
                    equipment.equipamento_key
                ),
                "rackKey": equipment.rack_key,
                "moduloRack": (
                    equipment.modulo_rack
                ),
                "start": equipment.ru_inicial,
                "units": equipment.altura_ru,
                "name": equipment.nome,
                "manufacturer": text_or_empty(
                    equipment.fabricante
                ),
                "model": text_or_empty(
                    equipment.modelo
                ),
                "serial": text_or_empty(
                    equipment.numero_serie
                ),
                "asset": text_or_empty(
                    equipment.patrimonio
                ),
                "function": text_or_empty(
                    equipment.funcao
                ),
                "notes": text_or_empty(
                    equipment.observacoes
                ),
                "docs": [],
                "searchTerms": list(
                    patch_search_terms.get(
                        equipment.equipamento_key,
                        [],
                    )
                ),
                "isPatch": bool(
                    equipment.is_patch
                ),
                "version": (
                    equipment.versao_dados
                ),
            }
        )

    frontend_racks = []

    for rack in rack_records:
        frontend_racks.append(
            {
                "databaseId": rack.id,
                "id": (
                    rack.display_name
                    if rack.display_name
                    else rack.rack_key
                ),
                "rackKey": rack.rack_key,
        "salaKey": rack.sala_key,
                "displayName": (
                    rack.display_name
                ),
                "layout": rack.layout,
                "x": rack.posicao_x,
                "y": rack.posicao_y,
                "w": rack.largura,
                "h": rack.altura,
                "front": rack.frente,
                "owner": text_or_empty(
                    rack.area_responsavel
                ),
                "items": (
                    equipments_by_rack.get(
                        rack.rack_key,
                        [],
                    )
                ),
                "quantidadeModulos": (
                    rack.quantidade_modulos
                ),
                "quantidadeRU": (
                    rack.quantidade_ru
                ),
                "version": rack.versao_dados,
            }
        )

    sync_data = get_sync_data(
        session
    )

    return {
        "racks": frontend_racks,
        "sync": {
            "version": sync_data["versao"],
            "lastChange": (
                sync_data["ultima_alteracao"]
            ),
            "totalRacks": (
                sync_data["total_racks"]
            ),
            "totalEquipments": (
                sync_data[
                    "total_equipamentos"
                ]
            ),
        },
    }