from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PatchPositionUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int | None = Field(
        default=None,
        ge=1,
    )

    nome_entrada: str | None = Field(
        default=None,
        max_length=200,
    )

    nome_saida: str | None = Field(
        default=None,
        max_length=200,
    )

    descricao_conexao_entrada: str | None = Field(
        default=None,
        max_length=500,
    )

    descricao_conexao_saida: str | None = Field(
        default=None,
        max_length=500,
    )


class PatchPositionBatchItem(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    numero_posicao: int = Field(
        ge=1,
        le=32,
    )

    versao_dados: int | None = Field(
        default=None,
        ge=1,
    )

    nome_entrada: str | None = Field(
        default=None,
        max_length=200,
    )

    nome_saida: str | None = Field(
        default=None,
        max_length=200,
    )

    descricao_conexao_entrada: str | None = Field(
        default=None,
        max_length=500,
    )

    descricao_conexao_saida: str | None = Field(
        default=None,
        max_length=500,
    )


class PatchPositionsBatchUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    posicoes: list[
        PatchPositionBatchItem
    ] = Field(
        min_length=1,
        max_length=32,
    )


class PatchConversionRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int = Field(
        ge=1,
    )

    is_patch: bool

    confirmar_limpeza: bool = False


class PatchConversionResponse(BaseModel):
    equipamento_id: int
    equipamento_key: str
    equipamento_nome: str
    is_patch: bool
    versao_dados: int

    posicoes_removidas: int = 0

    confirmacao_necessaria: bool = False

    mensagem: str


class PatchPositionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int | None = None
    equipamento_key: str
    numero_posicao: int
    nome_entrada: str | None = None
    nome_saida: str | None = None
    descricao_conexao_entrada: str | None = None
    descricao_conexao_saida: str | None = None
    versao_dados: int = 1
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None


class PatchPositionsResponse(BaseModel):
    equipamento_id: int
    equipamento_key: str
    equipamento_nome: str
    is_patch: bool

    posicoes: list[
        PatchPositionResponse
    ]