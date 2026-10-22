from datetime import datetime
from pathlib import Path
import logging
import sqlite3


APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent

DATABASE_FILE = BACKEND_DIR / "data" / "sala_fria.db"
BACKUP_DIR = BACKEND_DIR / "backups"

DEFAULT_RETENTION = 15

logger = logging.getLogger(__name__)


def validate_database_file():
    if not DATABASE_FILE.exists():
        raise FileNotFoundError(
            f"Banco de dados nao encontrado: {DATABASE_FILE}"
        )

    if not DATABASE_FILE.is_file():
        raise RuntimeError(
            f"O caminho do banco nao e um arquivo: {DATABASE_FILE}"
        )


def apply_retention(retention=DEFAULT_RETENTION):
    backup_files = sorted(
        BACKUP_DIR.glob("sala_fria_backup_*.db"),
        key=lambda file: file.stat().st_mtime,
        reverse=True,
    )

    files_to_remove = backup_files[retention:]
    removed_files = []

    for file in files_to_remove:
        file.unlink()
        removed_files.append(str(file))

    return removed_files


def create_backup(retention=DEFAULT_RETENTION):
    if retention < 1:
        raise ValueError(
            "A retencao deve ser igual ou maior que 1."
        )

    validate_database_file()

    BACKUP_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    backup_file = BACKUP_DIR / (
        f"sala_fria_backup_{timestamp}.db"
    )

    source_connection = None
    destination_connection = None

    try:
        source_connection = sqlite3.connect(
            str(DATABASE_FILE),
            timeout=30,
        )

        destination_connection = sqlite3.connect(
            str(backup_file),
            timeout=30,
        )

        source_connection.execute(
            "PRAGMA busy_timeout = 30000"
        )

        destination_connection.execute(
            "PRAGMA busy_timeout = 30000"
        )

        source_connection.backup(
            destination_connection
        )

        integrity_result = destination_connection.execute(
            "PRAGMA integrity_check"
        ).fetchone()

        if integrity_result:
            integrity_status = integrity_result[0]
        else:
            integrity_status = None

        if integrity_status != "ok":
            raise RuntimeError(
                "O backup nao passou na verificacao "
                f"de integridade: {integrity_status}"
            )

        destination_connection.close()
        destination_connection = None

        source_connection.close()
        source_connection = None

        removed_files = apply_retention(
            retention
        )

        result = {
            "sucesso": True,
            "arquivo": str(backup_file),
            "tamanho_bytes": backup_file.stat().st_size,
            "integridade": "ok",
            "retencao": retention,
            "arquivos_removidos": removed_files,
            "criado_em": datetime.now().isoformat(
                timespec="seconds"
            ),
        }

        logger.info(
            "Backup do SQLite concluido: %s",
            backup_file,
        )

        return result

    except Exception:
        logger.exception(
            "Falha ao criar backup do SQLite."
        )

        if destination_connection is not None:
            destination_connection.close()

        if source_connection is not None:
            source_connection.close()

        if backup_file.exists():
            backup_file.unlink()

        raise