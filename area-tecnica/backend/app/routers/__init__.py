from routers.auth import router as auth_router
from routers.dados import router as dados_router
from routers.equipamentos import (
    router as equipamentos_router,
)
from routers.rack_positions import (
    router as rack_positions_router,
)
from routers.racks import router as racks_router
from routers.sync import router as sync_router

__all__ = [
    "auth_router",
    "rack_positions_router",
    "racks_router",
    "equipamentos_router",
    "sync_router",
    "dados_router",
]