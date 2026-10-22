from pydantic import BaseModel

from schemas.equipamento import EquipamentoResponse
from schemas.rack import RackResponse
from schemas.sync import SyncVersionResponse


class DadosIniciaisResponse(BaseModel):
    racks: list[RackResponse]
    equipamentos: list[EquipamentoResponse]
    sincronizacao: SyncVersionResponse