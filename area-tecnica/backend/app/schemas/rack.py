from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RackCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    rack_key: str = Field(
        min_length=1,
        max_length=100,
    )
    display_name: str = Field(
        max_length=100,
    )
    layout: str = Field(
        min_length=1,
        max_length=30,
    )
    posicao_x: float
    posicao_y: float
    largura: float = Field(
        gt=0,
    )
    altura: float = Field(
        gt=0,
    )
    frente: str = Field(
        min_length=1,
        max_length=30,
    )
    area_responsavel: str = Field(
        default="",
        max_length=200,
    )
    visivel: bool = True
    ordem: int = Field(
        default=0,
        ge=0,
    )
    sala_key: str = Field(
        default="sala_a",
        pattern="^(sala_a|sala_b)$",
    )
    quantidade_modulos: int = Field(
        default=8,
        ge=1,
        le=100,
    )
    quantidade_ru: int = Field(
        default=44,
        ge=1,
        le=100,
    )


class RackUpdate(BaseModel):
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
    display_name: str | None = Field(
        default=None,
        max_length=100,
    )
    layout: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    posicao_x: float | None = None
    posicao_y: float | None = None
    largura: float | None = Field(
        default=None,
        gt=0,
    )
    altura: float | None = Field(
        default=None,
        gt=0,
    )
    frente: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    area_responsavel: str | None = Field(
        default=None,
        max_length=200,
    )
    visivel: bool | None = None
    ordem: int | None = Field(
        default=None,
        ge=0,
    )
    sala_key: str | None = Field(
        default=None,
        pattern="^(sala_a|sala_b)$",
    )
    quantidade_modulos: int | None = Field(
        default=None,
        ge=1,
        le=100,
    )
    quantidade_ru: int | None = Field(
        default=None,
        ge=1,
        le=100,
    )


class RackDelete(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int = Field(
        ge=1,
    )


class RackResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    rack_key: str
    display_name: str
    layout: str
    posicao_x: float
    posicao_y: float
    largura: float
    altura: float
    frente: str
    area_responsavel: str | None
    visivel: bool
    ordem: int
    sala_key: str
    quantidade_modulos: int
    quantidade_ru: int
    versao_dados: int
    criado_em: datetime
    atualizado_em: datetime