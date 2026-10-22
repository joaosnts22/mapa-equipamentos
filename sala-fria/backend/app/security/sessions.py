from dataclasses import dataclass
from datetime import datetime, timedelta
import secrets
import threading


SESSION_COOKIE_NAME = "sala_fria_session"
SESSION_DURATION_HOURS = 8


@dataclass
class SessionData:
    usuario: str
    nome_exibicao: str | None
    perfil: str
    criado_em: datetime
    expira_em: datetime


_sessions = {}
_sessions_lock = threading.Lock()


def create_session(
    usuario,
    nome_exibicao,
    perfil,
):
    current_time = datetime.now()

    token = secrets.token_urlsafe(
        48
    )

    session_data = SessionData(
        usuario=usuario,
        nome_exibicao=nome_exibicao,
        perfil=perfil,
        criado_em=current_time,
        expira_em=(
            current_time
            + timedelta(
                hours=SESSION_DURATION_HOURS
            )
        ),
    )

    with _sessions_lock:
        remove_expired_sessions_locked()
        _sessions[token] = session_data

    return token, session_data


def get_session(token):
    if not token:
        return None

    with _sessions_lock:
        remove_expired_sessions_locked()

        session_data = _sessions.get(
            token
        )

        if session_data is None:
            return None

        return session_data


def delete_session(token):
    if not token:
        return False

    with _sessions_lock:
        return (
            _sessions.pop(
                token,
                None,
            )
            is not None
        )


def remove_expired_sessions_locked():
    current_time = datetime.now()

    expired_tokens = [
        token
        for token, session_data in _sessions.items()
        if session_data.expira_em <= current_time
    ]

    for token in expired_tokens:
        _sessions.pop(
            token,
            None,
        )


def get_session_duration_seconds():
    return int(
        timedelta(
            hours=SESSION_DURATION_HOURS
        ).total_seconds()
    )