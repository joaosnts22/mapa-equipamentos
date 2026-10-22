from pydantic import BaseModel, ConfigDict, Field

from schemas.rack import RackResponse


class RackPositionItem(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    database_id: int = Field(
        gt=0
    )

    versao_dados: int = Field(
        ge=1
    )

    posicao_x: float
    posicao_y: float

    largura: float = Field(
        gt=0
    )

    altura: float = Field(
        gt=0
    )


class RackPositionsBatchRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    racks: list[RackPositionItem] = Field(
        min_length=1,
        max_length=200,
    )


class RackPositionsBatchResponse(BaseModel):
    atualizados: list[RackResponse]
    quantidade: int