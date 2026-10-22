from fastapi import APIRouter
from sqlalchemy import select

from database import SessionLocal
from models.entities import Equipamento, Rack
from schemas.dados import DadosIniciaisResponse
from schemas.frontend import FrontendDataResponse
from services.frontend_adapter import build_frontend_data
from services.sync_service import get_sync_data


router = APIRouter(
    prefix="/api/dados",
    tags=["dados"],
)


@router.get(
    "",
    response_model=DadosIniciaisResponse,
)
def get_initial_data():
    with SessionLocal() as session:
        rack_statement = (
            select(Rack)
            .where(Rack.visivel.is_(True))
            .order_by(
                Rack.ordem,
                Rack.id,
            )
        )

        equipment_statement = (
            select(Equipamento)
            .where(Equipamento.visivel.is_(True))
            .order_by(
                Equipamento.rack_key,
                Equipamento.modulo_rack,
                Equipamento.ru_inicial.desc(),
                Equipamento.id,
            )
        )

        racks = list(
            session.scalars(rack_statement).all()
        )

        equipamentos = list(
            session.scalars(equipment_statement).all()
        )

        sincronizacao = get_sync_data(session)

        return {
            "racks": racks,
            "equipamentos": equipamentos,
            "sincronizacao": sincronizacao,
        }


@router.get(
    "/frontend",
    response_model=FrontendDataResponse,
)
def get_frontend_data():
    with SessionLocal() as session:
        return build_frontend_data(session)