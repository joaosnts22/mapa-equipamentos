from datetime import datetime

from pydantic import BaseModel


class FrontendEquipmentResponse(BaseModel):
    databaseId: int
    id: str
    equipmentKey: str
    rackKey: str
    moduloRack: int
    start: int
    units: int
    name: str
    manufacturer: str
    model: str
    serial: str
    asset: str
    function: str
    notes: str
    docs: list[str]
    searchTerms: list[str]
    isPatch: bool
    version: int


class FrontendRackResponse(BaseModel):
    databaseId: int
    id: str
    rackKey: str
    displayName: str
    salaKey: str
    layout: str
    x: float
    y: float
    w: float
    h: float
    front: str
    owner: str
    items: list[FrontendEquipmentResponse]
    quantidadeModulos: int
    quantidadeRU: int
    version: int


class FrontendSyncResponse(BaseModel):
    version: str
    lastChange: datetime | None
    totalRacks: int
    totalEquipments: int


class FrontendDataResponse(BaseModel):
    racks: list[FrontendRackResponse]
    sync: FrontendSyncResponse