from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class EquipamentoCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    equipamento_key: str = Field(
        min_length=1,
        max_length=100,
    )

    rack_key: str = Field(
        min_length=1,
        max_length=100,
    )

    modulo_rack: int = Field(
        ge=1,
    )

    ru_inicial: int = Field(
        ge=1,
    )

    altura_ru: int = Field(
        ge=1,
    )

    nome: str = Field(
        min_length=1,
        max_length=200,
    )

    fabricante: str | None = Field(
        default=None,
        max_length=200,
    )

    modelo: str | None = Field(
        default=None,
        max_length=200,
    )

    numero_serie: str | None = Field(
        default=None,
        max_length=200,
    )

    patrimonio: str | None = Field(
        default=None,
        max_length=200,
    )

    funcao: str | None = Field(
        default=None,
        max_length=500,
    )

    observacoes: str | None = None

    is_patch: bool = False

    visivel: bool = True


class EquipamentoUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int = Field(
        ge=1,
    )

    rack_key: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    modulo_rack: int | None = Field(
        default=None,
        ge=1,
    )

    ru_inicial: int | None = Field(
        default=None,
        ge=1,
    )

    altura_ru: int | None = Field(
        default=None,
        ge=1,
    )

    nome: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    fabricante: str | None = Field(
        default=None,
        max_length=200,
    )

    modelo: str | None = Field(
        default=None,
        max_length=200,
    )

    numero_serie: str | None = Field(
        default=None,
        max_length=200,
    )

    patrimonio: str | None = Field(
        default=None,
        max_length=200,
    )

    funcao: str | None = Field(
        default=None,
        max_length=500,
    )

    observacoes: str | None = None

    is_patch: bool | None = None

    visivel: bool | None = None


class EquipamentoDelete(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int = Field(
        ge=1,
    )


class EquipamentoResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    equipamento_key: str
    rack_key: str
    modulo_rack: int
    ru_inicial: int
    altura_ru: int
    nome: str
    fabricante: str | None
    modelo: str | None
    numero_serie: str | None
    patrimonio: str | None
    funcao: str | None
    observacoes: str | None
    is_patch: bool
    visivel: bool
    versao_dados: int
    criado_em: datetime
    atualizado_em: datetime