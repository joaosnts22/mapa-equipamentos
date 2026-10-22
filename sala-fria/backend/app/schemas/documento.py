from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class DocumentoResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    nome_documento: str

    equipamento_key: str | None

    rack_key: str | None

    tipo_documento: str

    descricao: str | None

    visivel: bool

    criado_em: datetime

    atualizado_em: datetime


class DocumentoUploadMetadata(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    nome_documento: str = Field(
        min_length=1,
        max_length=255,
    )

    tipo_documento: str = Field(
        min_length=1,
        max_length=50,
    )

    descricao: str | None = None