from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


PatchConnectorType = Literal[
    "entrada",
    "saida",
]


class PatchConnectionEndpointInput(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid"
    )

    equipamento_id: int = Field(
        ge=1,
    )

    numero_posicao: int = Field(
        ge=1,
        le=32,
    )

    conector: PatchConnectorType


class PatchConnectionCreate(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid"
    )

    ponta_atual: (
        PatchConnectionEndpointInput
    )

    ponta_destino: (
        PatchConnectionEndpointInput
    )

    substituir_existentes: bool = False

    @model_validator(
        mode="after"
    )
    def validate_distinct_endpoints(
        self,
    ):
        current_endpoint = (
            self.ponta_atual
        )

        destination_endpoint = (
            self.ponta_destino
        )

        same_endpoint = (
            current_endpoint.equipamento_id
            == destination_endpoint
            .equipamento_id
            and
            current_endpoint.numero_posicao
            == destination_endpoint
            .numero_posicao
            and
            current_endpoint.conector
            == destination_endpoint
            .conector
        )

        if same_endpoint:
            raise ValueError(
                "Uma ponta nao pode ser "
                "conectada nela mesma."
            )

        return self


class PatchConnectionEndpointResponse(
    BaseModel
):
    equipamento_id: int
    equipamento_key: str
    equipamento_nome: str

    rack_key: str
    rack_nome: str

    numero_posicao: int
    conector: PatchConnectorType

    nome_conector: str | None = None


class PatchConnectionResponse(
    BaseModel
):
    id: int
    versao_dados: int

    ponta_atual: (
        PatchConnectionEndpointResponse
    )

    ponta_remota: (
        PatchConnectionEndpointResponse
    )

    criado_em: datetime
    atualizado_em: datetime


class PatchEndpointConnectionResponse(
    BaseModel
):
    conectado: bool

    conexao: (
        PatchConnectionResponse
        | None
    ) = None


class PatchConnectionDeleteRequest(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid"
    )

    versao_dados: int = Field(
        ge=1,
    )


class PatchConnectionDeleteResponse(
    BaseModel
):
    removida: bool
    conexao_id: int
    mensagem: str


class PatchEquipmentSearchResult(
    BaseModel
):
    equipamento_id: int
    equipamento_key: str
    equipamento_nome: str

    rack_key: str
    rack_nome: str

    quantidade_posicoes: int = 32


class PatchEquipmentSearchResponse(
    BaseModel
):
    resultados: list[
        PatchEquipmentSearchResult
    ]


class PatchPositionConnectionInfo(
    BaseModel
):
    entrada: (
        PatchEndpointConnectionResponse
    )

    saida: (
        PatchEndpointConnectionResponse
    )


class PatchEndpointSearchResult(
    BaseModel
):
    equipamento_id: int
    equipamento_key: str
    equipamento_nome: str

    rack_key: str
    rack_nome: str

    numero_posicao: int
    conector: PatchConnectorType
    nome_conector: str


class PatchEndpointSearchResponse(
    BaseModel
):
    conector_pesquisado: (
        PatchConnectorType
    )

    resultados: list[
        PatchEndpointSearchResult
    ]

