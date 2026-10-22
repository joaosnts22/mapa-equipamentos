from pathlib import Path
import os
import re
import uuid


APP_DIRECTORY = Path(
    __file__
).resolve().parent.parent

PROJECT_DIRECTORY = (
    APP_DIRECTORY.parent.parent
)

DOCUMENTS_DIRECTORY = (
    PROJECT_DIRECTORY
    / "backend"
    / "documentos"
)

MAX_DOCUMENT_SIZE_BYTES = (
    50
    * 1024
    * 1024
)

ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".zip",
}


class DocumentStorageError(Exception):
    pass


class DocumentExtensionError(
    DocumentStorageError
):
    pass


class DocumentSizeError(
    DocumentStorageError
):
    pass


class DocumentPathError(
    DocumentStorageError
):
    pass


def ensure_documents_directory():
    DOCUMENTS_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not DOCUMENTS_DIRECTORY.is_dir():
        raise DocumentStorageError(
            "A pasta de documentos "
            "nao esta disponivel."
        )

    return DOCUMENTS_DIRECTORY


def normalize_original_filename(
    original_filename,
):
    filename = str(
        original_filename or ""
    ).strip()

    if not filename:
        raise DocumentPathError(
            "O nome original do arquivo "
            "nao foi informado."
        )

    if "\x00" in filename:
        raise DocumentPathError(
            "O nome do arquivo contem "
            "caractere invalido."
        )

    filename = filename.replace(
        "\\",
        "/",
    ).split("/")[-1].strip()

    if not filename:
        raise DocumentPathError(
            "O nome original do arquivo "
            "nao e valido."
        )

    if len(filename) > 255:
        raise DocumentPathError(
            "O nome original do arquivo "
            "deve possuir no maximo "
            "255 caracteres."
        )

    return filename


def get_allowed_extension(
    original_filename,
):
    filename = normalize_original_filename(
        original_filename
    )

    extension = Path(
        filename
    ).suffix.lower()

    if (
        not extension
        or extension
        not in ALLOWED_DOCUMENT_EXTENSIONS
    ):
        allowed_text = ", ".join(
            sorted(
                ALLOWED_DOCUMENT_EXTENSIONS
            )
        )

        raise DocumentExtensionError(
            "Extensao de arquivo nao permitida. "
            "Extensoes aceitas: "
            + allowed_text
            + "."
        )

    return extension


def sanitize_name_fragment(value):
    fragment = str(
        value or ""
    ).strip()

    fragment = re.sub(
        r"[^A-Za-z0-9_-]+",
        "_",
        fragment,
    )

    fragment = fragment.strip(
        "_"
    )

    if not fragment:
        return "documento"

    return fragment[:80]


def build_relative_document_path(
    equipment_key,
    original_filename,
):
    extension = get_allowed_extension(
        original_filename
    )

    equipment_fragment = (
        sanitize_name_fragment(
            equipment_key
        )
    )

    random_fragment = (
        uuid.uuid4().hex
    )

    physical_filename = (
        equipment_fragment
        + "_"
        + random_fragment
        + extension
    )

    return physical_filename


def resolve_document_path(
    relative_file_path,
):
    base_directory = (
        ensure_documents_directory()
        .resolve()
    )

    normalized_relative = str(
        relative_file_path or ""
    ).strip()

    if not normalized_relative:
        raise DocumentPathError(
            "O caminho relativo do documento "
            "nao foi informado."
        )

    if "\x00" in normalized_relative:
        raise DocumentPathError(
            "O caminho do documento contem "
            "caractere invalido."
        )

    relative_path = Path(
        normalized_relative
    )

    if relative_path.is_absolute():
        raise DocumentPathError(
            "O caminho do documento "
            "deve ser relativo."
        )

    if ".." in relative_path.parts:
        raise DocumentPathError(
            "O caminho do documento nao pode "
            "acessar a pasta superior."
        )

    final_path = (
        base_directory
        / relative_path
    ).resolve()

    try:
        final_path.relative_to(
            base_directory
        )
    except ValueError as error:
        raise DocumentPathError(
            "O caminho do documento esta "
            "fora da pasta permitida."
        ) from error

    return final_path


def validate_document_content(
    content,
):
    if not isinstance(
        content,
        bytes,
    ):
        raise DocumentStorageError(
            "O conteudo do documento "
            "deve ser binario."
        )

    content_size = len(
        content
    )

    if content_size < 1:
        raise DocumentSizeError(
            "O arquivo enviado esta vazio."
        )

    if (
        content_size
        > MAX_DOCUMENT_SIZE_BYTES
    ):
        raise DocumentSizeError(
            "O arquivo ultrapassa o limite "
            "de 50 MiB."
        )

    return content_size


def save_document_content(
    relative_file_path,
    content,
):
    validate_document_content(
        content
    )

    final_path = resolve_document_path(
        relative_file_path
    )

    if final_path.exists():
        raise DocumentStorageError(
            "Ja existe um arquivo fisico "
            "com o caminho gerado."
        )

    temporary_path = final_path.with_name(
        final_path.name
        + ".uploading"
    )

    try:
        with temporary_path.open(
            "xb"
        ) as file_handle:
            file_handle.write(
                content
            )

            file_handle.flush()

            os.fsync(
                file_handle.fileno()
            )

        os.replace(
            temporary_path,
            final_path,
        )
    except Exception:
        if temporary_path.exists():
            try:
                temporary_path.unlink()
            except OSError:
                pass

        raise

    if not final_path.is_file():
        raise DocumentStorageError(
            "O arquivo nao foi gravado "
            "corretamente."
        )

    return final_path


def delete_document_content(
    relative_file_path,
):
    final_path = resolve_document_path(
        relative_file_path
    )

    if not final_path.exists():
        return False

    if not final_path.is_file():
        raise DocumentStorageError(
            "O caminho do documento nao "
            "representa um arquivo."
        )

    final_path.unlink()

    return True