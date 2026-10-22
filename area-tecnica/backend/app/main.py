from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from database import (
    create_database_tables,
    get_database_status,
)
from routers.auth import router as auth_router
from routers.dados import router as dados_router
from routers.documentos import (
    router as documentos_router,
)
from routers.equipamentos import (
    router as equipamentos_router,
)
from routers.historico import (
    router as historico_router,
)
from routers.rack_positions import (
    router as rack_positions_router,
)
from routers.racks import router as racks_router
from routers.patch_connections import (
    router as patch_connections_router,
)
from routers.patch_positions import (
    router as patch_positions_router,
)
from routers.sync import router as sync_router
from services.initial_data import (
    load_initial_racks,
)


APP_DIR = Path(__file__).resolve().parent
PROJECT_DIR = APP_DIR.parent.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"


if not FRONTEND_DIR.exists():
    raise RuntimeError(
        "Pasta do frontend nao encontrada: "
        f"{FRONTEND_DIR}"
    )


if not (
    FRONTEND_DIR / "index.html"
).exists():
    raise RuntimeError(
        "Arquivo index.html nao encontrado em: "
        f"{FRONTEND_DIR}"
    )


@asynccontextmanager
async def lifespan(
    application: FastAPI,
):
    create_database_tables()
    load_initial_racks()
    yield


app = FastAPI(
    title="Mapa da Area Tecnica area tecnica",
    version="0.2.4",
    lifespan=lifespan,
)


app.include_router(
    auth_router
)

app.include_router(
    rack_positions_router
)

app.include_router(
    racks_router
)

app.include_router(
    equipamentos_router
)

app.include_router(
    patch_positions_router
)

app.include_router(
    patch_connections_router
)

app.include_router(
    documentos_router
)

app.include_router(
    historico_router
)

app.include_router(
    sync_router
)

app.include_router(
    dados_router
)


@app.middleware("http")
async def revalidate_frontend_files(
    request,
    call_next,
):
    """
    Sem este cabecalho o navegador reaproveita por conta propria uma
    copia antiga do index.html (e dos scripts), e o usuario continua
    vendo a versao anterior depois de uma atualizacao. Com "no-cache"
    o navegador sempre confere com o servidor antes de usar a copia
    salva (se nada mudou, a resposta e um 304 rapido).
    """
    response = await call_next(request)

    if not request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache"

    return response


@app.get("/api/health")
def health():
    database_status = (
        get_database_status()
    )

    return {
        "status": "ok",
        "aplicacao": "Mapa da Sala Fria",
        "versao": "0.2.4",
        "frontend_encontrado": True,
        "banco": database_status,
    }


app.mount(
    "/",
    StaticFiles(
        directory=str(FRONTEND_DIR),
        html=True,
    ),
    name="frontend",
)