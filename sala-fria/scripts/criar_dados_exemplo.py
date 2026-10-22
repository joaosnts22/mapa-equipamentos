"""Popula o banco com fileiras e equipamentos FICTICIOS de exemplo.

Uso (na pasta sala-fria):

    python scripts/criar_dados_exemplo.py

So funciona com o banco vazio (nao mexe em dados existentes).
"""
from pathlib import Path
import sys

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR / "backend" / "app"))

from sqlalchemy import select  # noqa: E402

from database import SessionLocal, create_database_tables  # noqa: E402
from models.entities import Rack  # noqa: E402
from schemas.equipamento import EquipamentoCreate  # noqa: E402
from schemas.rack import RackCreate  # noqa: E402
from services.equipment_service import create_equipment  # noqa: E402
from services.rack_service import create_rack  # noqa: E402


USUARIO = "dados-exemplo"

# Tamanho de referencia (fileira de 8 racks), em % da sala
VERTICAL = (1.625, 57.4679)
HORIZONTAL = (8.5313, 7.7064)

# (sala, nome, layout, x %, y %, quantidade de racks)
FILEIRAS = [
    ("sala_fria", "A", "vertical", 4.0, 13.8, 8),
    ("sala_fria", "B", "vertical", 6.4, 13.8, 8),
    ("sala_fria", "C", "vertical", 8.8, 13.8, 6),
    ("sala_fria", "D", "vertical", 11.2, 13.8, 8),
    ("sala_fria", "E", "vertical", 13.6, 13.8, 10),
    ("sala_fria", "F", "vertical", 16.0, 13.8, 8),
    ("sala_fria", "G", "vertical", 53.0, 13.8, 8),
    ("sala_fria", "H", "vertical", 55.4, 13.8, 4),
    ("sala_fria", "I", "vertical", 57.8, 13.8, 8),
    ("sala_fria", "J", "vertical", 60.2, 13.8, 8),
    ("sala_fria", "K", "vertical", 62.6, 13.8, 6),
    ("sala_fria", "BACKBONE", "horizontal", 72.0, 55.0, 10),
    ("sala_fria", "TELECOM", "horizontal", 72.0, 80.0, 6),
    # anexo (acima da sala principal, por isso y negativo)
    ("sala_fria", "LAB 1", "horizontal", 52.0, -130.0, 6),
    ("sala_fria", "LAB 2", "horizontal", 52.0, -105.0, 6),
    ("sala_fria", "LAB 3", "horizontal", 52.0, -80.0, 4),
    ("sala_hpa", "EDICAO 1", "horizontal", 10.0, 18.0, 8),
    ("sala_hpa", "EDICAO 2", "horizontal", 10.0, 42.0, 6),
    ("sala_hpa", "EDICAO 3", "horizontal", 10.0, 66.0, 8),
]

# (fileira, rack, U inicial, altura em U, nome, fabricante, modelo, funcao)
EQUIPAMENTOS = [
    ("A", 1, 40, 2, "Switch Core 01", "Acme Networks", "CX-4800", "Distribuicao principal"),
    ("A", 1, 36, 1, "Patch Panel 24p", "Acme Networks", "PP-24", "Terminacao de cabos"),
    ("A", 2, 30, 4, "Servidor de Arquivos", "Contoso", "FS-200", "Armazenamento de projetos"),
    ("A", 3, 20, 2, "Firewall de Borda", "Fabrikam", "FW-1200", "Seguranca de perimetro"),
    ("B", 1, 38, 2, "Encoder IP 01", "Northwind", "ENC-4K", "Codificacao de video"),
    ("B", 1, 34, 2, "Encoder IP 02", "Northwind", "ENC-4K", "Codificacao de video"),
    ("B", 4, 10, 6, "Storage NAS", "Contoso", "NAS-60", "Backup diario"),
    ("C", 2, 1, 3, "UPS 3kVA", "Volt Power", "UPS-3K", "Energia ininterrupta"),
    ("E", 5, 25, 2, "Servidor de Monitoramento", "Contoso", "MON-10", "Coleta de metricas"),
    ("G", 1, 41, 1, "KVM 8 portas", "Fabrikam", "KVM-8", "Console local"),
    ("BACKBONE", 3, 30, 2, "Roteador de Borda", "Acme Networks", "RT-900", "Saida para a rede externa"),
    ("TELECOM", 2, 20, 4, "Central Telefonica", "Northwind", "PBX-50", "Ramais internos"),
    ("LAB 1", 1, 38, 2, "Servidor de Testes", "Contoso", "LAB-1", "Ambiente de homologacao"),
    ("EDICAO 1", 2, 30, 4, "Ilha de Edicao 01", "Fabrikam", "ED-PRO", "Edicao de video"),
]


def tamanho(layout, racks):
    proporcao = racks / 8
    if layout == "vertical":
        return VERTICAL[0], round(VERTICAL[1] * proporcao, 4), "right"
    return round(HORIZONTAL[0] * proporcao, 4), HORIZONTAL[1], "bottom"


def main():
    create_database_tables()

    with SessionLocal() as session:
        if session.scalar(select(Rack.id).limit(1)) is not None:
            print("O banco ja tem fileiras; nada foi feito.")
            return

        for ordem, (sala, nome, layout, x, y, racks) in enumerate(FILEIRAS, 1):
            largura, altura, frente = tamanho(layout, racks)
            create_rack(
                session,
                RackCreate(
                    rack_key="DEMO-" + nome.replace(" ", "-"),
                    display_name=nome,
                    layout=layout,
                    posicao_x=x,
                    posicao_y=y,
                    largura=largura,
                    altura=altura,
                    frente=frente,
                    area_responsavel="",
                    visivel=True,
                    ordem=ordem,
                    sala_key=sala,
                    quantidade_modulos=racks,
                    quantidade_ru=44,
                ),
                USUARIO,
            )

        for numero, (fileira, rack, ru, altura, nome, fabricante, modelo, funcao) in enumerate(EQUIPAMENTOS, 1):
            create_equipment(
                session,
                EquipamentoCreate(
                    equipamento_key=f"EQ-DEMO-{numero:03d}",
                    rack_key="DEMO-" + fileira.replace(" ", "-"),
                    modulo_rack=rack,
                    ru_inicial=ru,
                    altura_ru=altura,
                    nome=nome,
                    fabricante=fabricante,
                    modelo=modelo,
                    numero_serie=f"SN-DEMO-{numero:04d}",
                    patrimonio=f"PAT-{numero:05d}",
                    funcao=funcao,
                    observacoes="Equipamento ficticio de exemplo.",
                ),
                USUARIO,
            )

        session.commit()

    print(f"{len(FILEIRAS)} fileiras e {len(EQUIPAMENTOS)} equipamentos de exemplo criados.")


if __name__ == "__main__":
    main()
