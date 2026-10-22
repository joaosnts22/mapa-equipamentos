from datetime import datetime

from pydantic import BaseModel


class SyncVersionResponse(BaseModel):
    versao: str

    ultima_alteracao: datetime | None

    total_racks: int

    total_equipamentos: int

    total_documentos: int