"""Popula o banco com fileiras e equipamentos FICTICIOS de exemplo,
posicionados na planta de exemplo de frontend/mapa-planta.js.

Uso (na pasta area-tecnica):

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

# Mesmos valores de frontend/mapa-planta.js (unidades da planta)
RACK_LARGURA = 157.3
RACK_PROFUNDIDADE = 195.6

AREAS = {
    "sala_a": (-60, 40, 3020, 1920),
    "sala_b": (-60, 40, 2220, 1520),
}

# (sala, nome, x do canto esquerdo, y do topo, quantidade de racks)
FILEIRAS = [
    ("sala_a", "A0", 200, 150, 12),
    ("sala_a", "A1", 200, 480, 8),
    ("sala_a", "A2", 1560, 480, 7),
    ("sala_a", "A3", 200, 1000, 8),
    ("sala_a", "A4", 1560, 1000, 6),
    ("sala_a", "A5", 200, 1500, 10),
    ("sala_b", "Consoles", 300, 200, 9),
    ("sala_b", "B1", 250, 700, 11),
    ("sala_b", "B2", 400, 1100, 8),
]

# (fileira, rack, U inicial, altura em U, nome, fabricante, modelo, funcao)
EQUIPAMENTOS = [
    ("A1", 1, 40, 2, "Switch Core 01", "Acme Networks", "CX-4800", "Distribuicao principal"),
    ("A1", 2, 30, 4, "Servidor de Arquivos", "Contoso", "FS-200", "Armazenamento de projetos"),
    ("A2", 3, 20, 2, "Firewall de Borda", "Fabrikam", "FW-1200", "Seguranca de perimetro"),
    ("A3", 1, 38, 2, "Encoder IP 01", "Northwind", "ENC-4K", "Codificacao de video"),
    ("A4", 2, 10, 6, "Storage NAS", "Contoso", "NAS-60", "Backup diario"),
    ("A5", 4, 1, 3, "UPS 3kVA", "Volt Power", "UPS-3K", "Energia ininterrupta"),
    ("Consoles", 5, 30, 2, "Mesa de Monitoramento", "Fabrikam", "MON-DESK", "Operacao"),
    ("B1", 6, 25, 2, "Servidor de Monitoramento", "Contoso", "MON-10", "Coleta de metricas"),
    ("B2", 1, 41, 1, "KVM 8 portas", "Fabrikam", "KVM-8", "Console local"),
]


def geometria(sala, x0, y0, racks):
    area_x, area_y, area_w, area_h = AREAS[sala]
    return {
        "layout": "horizontal",
        "frente": "bottom",
        "posicao_x": round((x0 - area_x) / area_w * 100, 4),
        "posicao_y": round((y0 - area_y) / area_h * 100, 4),
        "largura": round(racks * RACK_LARGURA / area_w * 100, 4),
        "altura": round(RACK_PROFUNDIDADE / area_h * 100, 4),
        "quantidade_modulos": racks,
    }


def main():
    create_database_tables()

    with SessionLocal() as session:
        if session.scalar(select(Rack.id).limit(1)) is not None:
            print("O banco ja tem fileiras; nada foi feito.")
            return

        for ordem, (sala, nome, x0, y0, racks) in enumerate(FILEIRAS, 1):
            create_rack(
                session,
                RackCreate(
                    rack_key="DEMO-" + nome,
                    display_name=nome,
                    area_responsavel="",
                    visivel=True,
                    ordem=ordem,
                    sala_key=sala,
                    quantidade_ru=44,
                    **geometria(sala, x0, y0, racks),
                ),
                USUARIO,
            )

        for numero, (fileira, rack, ru, altura, nome, fabricante, modelo, funcao) in enumerate(EQUIPAMENTOS, 1):
            create_equipment(
                session,
                EquipamentoCreate(
                    equipamento_key=f"EQ-DEMO-{numero:03d}",
                    rack_key="DEMO-" + fileira,
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
