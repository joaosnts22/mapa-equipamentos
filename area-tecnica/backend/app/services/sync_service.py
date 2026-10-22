import hashlib
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.entities import (
    Documento,
    Equipamento,
    Rack,
)


def latest_datetime(
    rack_datetime: datetime | None,
    equipment_datetime: datetime | None,
    document_datetime: datetime | None,
) -> datetime | None:
    available_dates = [
        value
        for value in (
            rack_datetime,
            equipment_datetime,
            document_datetime,
        )
        if value is not None
    ]

    if not available_dates:
        return None

    return max(
        available_dates
    )


def build_version_token(
    latest_change: datetime | None,
    total_racks: int,
    total_equipments: int,
    total_documents: int,
) -> str:
    raw_value = "|".join(
        [
            (
                latest_change.isoformat()
                if latest_change is not None
                else "sem-alteracoes"
            ),
            str(total_racks),
            str(total_equipments),
            str(total_documents),
        ]
    )

    return hashlib.sha256(
        raw_value.encode(
            "utf-8"
        )
    ).hexdigest()[:16]


def get_sync_data(
    session: Session,
) -> dict:
    latest_rack_change = session.scalar(
        select(
            func.max(
                Rack.atualizado_em
            )
        )
    )

    latest_equipment_change = session.scalar(
        select(
            func.max(
                Equipamento.atualizado_em
            )
        )
    )

    latest_document_change = session.scalar(
        select(
            func.max(
                Documento.atualizado_em
            )
        )
    )

    total_racks = session.scalar(
        select(
            func.count(
                Rack.id
            )
        ).where(
            Rack.visivel.is_(True)
        )
    )

    total_equipments = session.scalar(
        select(
            func.count(
                Equipamento.id
            )
        ).where(
            Equipamento.visivel.is_(True)
        )
    )

    total_documents = session.scalar(
        select(
            func.count(
                Documento.id
            )
        ).where(
            Documento.visivel.is_(True)
        )
    )

    total_racks = int(
        total_racks or 0
    )

    total_equipments = int(
        total_equipments or 0
    )

    total_documents = int(
        total_documents or 0
    )

    latest_change = latest_datetime(
        latest_rack_change,
        latest_equipment_change,
        latest_document_change,
    )

    version = build_version_token(
        latest_change,
        total_racks,
        total_equipments,
        total_documents,
    )

    return {
        "versao": version,
        "ultima_alteracao": latest_change,
        "total_racks": total_racks,
        "total_equipamentos": (
            total_equipments
        ),
        "total_documentos": (
            total_documents
        ),
    }