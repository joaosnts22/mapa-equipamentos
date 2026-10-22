from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def agora():
    return datetime.now()


class Rack(Base):
    __tablename__ = "racks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    rack_key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )
    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    layout: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    posicao_x: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    posicao_y: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    largura: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    altura: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    frente: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    area_responsavel: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    visivel: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    ordem: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    sala_key: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="sala_fria",
        server_default="sala_fria",
    )
    quantidade_modulos: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=8,
    )
    quantidade_ru: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=44,
    )
    versao_dados: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            "quantidade_modulos >= 1",
            name="ck_racks_quantidade_modulos",
        ),
        CheckConstraint(
            "quantidade_ru >= 1",
            name="ck_racks_quantidade_ru",
        ),
        CheckConstraint(
            "versao_dados >= 1",
            name="ck_racks_versao_dados",
        ),
    )


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    equipamento_key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )
    rack_key: Mapped[str] = mapped_column(
        String(100),
        ForeignKey(
            "racks.rack_key",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )
    modulo_rack: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    ru_inicial: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    altura_ru: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    fabricante: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    modelo: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    numero_serie: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    patrimonio: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    funcao: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    observacoes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    is_patch: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0",
    )
    visivel: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    versao_dados: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            "modulo_rack >= 1",
            name="ck_equipamentos_modulo_rack",
        ),
        CheckConstraint(
            "ru_inicial >= 1",
            name="ck_equipamentos_ru_inicial",
        ),
        CheckConstraint(
            "altura_ru >= 1",
            name="ck_equipamentos_altura_ru",
        ),
        CheckConstraint(
            "ru_inicial + altura_ru - 1 <= 44",
            name="ck_equipamentos_limite_44u",
        ),
        CheckConstraint(
            "versao_dados >= 1",
            name="ck_equipamentos_versao_dados",
        ),
    )


class PatchPosition(Base):
    __tablename__ = "patch_positions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    equipamento_key: Mapped[str] = mapped_column(
        String(100),
        ForeignKey(
            "equipamentos.equipamento_key",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    numero_posicao: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    nome_entrada: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    nome_saida: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    descricao_conexao_entrada: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    descricao_conexao_saida: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    versao_dados: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            "numero_posicao BETWEEN 1 AND 32",
            name="ck_patch_positions_numero",
        ),
        CheckConstraint(
            "versao_dados >= 1",
            name="ck_patch_positions_versao",
        ),
    )


class PatchConnection(Base):
    __tablename__ = "patch_connections"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    versao_dados: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            "versao_dados >= 1",
            name=(
                "ck_patch_connections_"
                "versao"
            ),
        ),
    )


class PatchConnectionEndpoint(Base):
    __tablename__ = (
        "patch_connection_endpoints"
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    conexao_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "patch_connections.id",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    ordem_ponta: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    equipamento_key: Mapped[str] = mapped_column(
        String(100),
        ForeignKey(
            "equipamentos.equipamento_key",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    numero_posicao: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    conector: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    descricao_manual: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "ordem_ponta IN (1, 2)",
            name=(
                "ck_patch_connection_"
                "endpoint_ordem"
            ),
        ),
        CheckConstraint(
            (
                "numero_posicao "
                "BETWEEN 1 AND 32"
            ),
            name=(
                "ck_patch_connection_"
                "endpoint_posicao"
            ),
        ),
        CheckConstraint(
            (
                "conector IN "
                "('entrada', 'saida')"
            ),
            name=(
                "ck_patch_connection_"
                "endpoint_conector"
            ),
        ),
        UniqueConstraint(
            "conexao_id",
            "ordem_ponta",
            name=(
                "uq_patch_connection_"
                "endpoint_ordem"
            ),
        ),
        UniqueConstraint(
            "equipamento_key",
            "numero_posicao",
            "conector",
            name=(
                "uq_patch_connection_"
                "endpoint_fisico"
            ),
        ),
    )


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    nome_documento: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    equipamento_key: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey(
            "equipamentos.equipamento_key",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    rack_key: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey(
            "racks.rack_key",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    tipo_documento: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    caminho_arquivo: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )
    descricao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    visivel: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            """
            tipo_documento IN (
                'Foto',
                'Diagrama',
                'Manual',
                'GMUD',
                'Inventario',
                'Outro'
            )
            """,
            name="ck_documentos_tipo_documento",
        ),
    )


class Administrador(Base):
    __tablename__ = "administradores"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    usuario: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )
    nome_exibicao: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    senha_hash: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    perfil: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Consulta",
    )
    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        onupdate=agora,
    )

    __table_args__ = (
        CheckConstraint(
            "perfil IN ('Administrador', 'Consulta')",
            name="ck_administradores_perfil",
        ),
    )


class Historico(Base):
    __tablename__ = "historico"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    tipo_entidade: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    entidade_key: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )
    acao: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    dados_anteriores: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    dados_novos: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    usuario: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    data_operacao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora,
        index=True,
    )