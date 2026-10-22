from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class HistoricoResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    id: int

    tipo_entidade: str

    entidade_key: str

    acao: str

    usuario: str

    data_operacao: datetime

    dados_anteriores: dict[
        str,
        Any,
    ] | None

    dados_novos: dict[
        str,
        Any,
    ] | None


class HistoricoListResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    itens: list[
        HistoricoResponse
    ]

    total: int = Field(
        ge=0,
    )

    limite: int = Field(
        ge=1,
        le=100,
    )

    deslocamento: int = Field(
        ge=0,
    )