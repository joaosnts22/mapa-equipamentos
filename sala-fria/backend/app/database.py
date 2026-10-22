from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
DATA_DIR = BACKEND_DIR / "data"
DATABASE_FILE = DATA_DIR / "sala_fria.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
    pool_pre_ping=True,
)


@event.listens_for(engine, "connect")
def configure_sqlite_connection(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()

    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("PRAGMA journal_mode = WAL")
    cursor.execute("PRAGMA synchronous = NORMAL")
    cursor.execute("PRAGMA busy_timeout = 30000")

    cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def create_database_tables():
    from models import entities

    Base.metadata.create_all(bind=engine)


def get_database_status():
    with engine.connect() as connection:
        journal_mode = connection.exec_driver_sql(
            "PRAGMA journal_mode"
        ).scalar_one()

        foreign_keys = connection.exec_driver_sql(
            "PRAGMA foreign_keys"
        ).scalar_one()

        busy_timeout = connection.exec_driver_sql(
            "PRAGMA busy_timeout"
        ).scalar_one()

    return {
        "arquivo": str(DATABASE_FILE),
        "existe": DATABASE_FILE.exists(),
        "journal_mode": journal_mode,
        "foreign_keys": bool(foreign_keys),
        "busy_timeout_ms": busy_timeout,
    }