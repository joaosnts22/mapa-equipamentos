from fastapi import (
    Cookie,
    Depends,
    HTTPException,
    status,
)

from security.sessions import (
    SESSION_COOKIE_NAME,
    get_session,
)


def require_authenticated_user(
    session_token: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
):
    session_data = get_session(
        session_token
    )

    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao ausente, invalida ou expirada.",
        )

    return session_data


def require_administrator(
    session_data=Depends(
        require_authenticated_user
    ),
):
    if session_data.perfil != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Esta operacao exige o perfil "
                "Administrador."
            ),
        )

    return session_data