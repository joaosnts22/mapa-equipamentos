from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import select

from database import SessionLocal
from models.entities import Administrador
from schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
)
from security.dependencies import (
    require_authenticated_user,
)
from security.passwords import (
    verify_password,
)
from security.sessions import (
    SESSION_COOKIE_NAME,
    create_session,
    delete_session,
    get_session_duration_seconds,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["autenticacao"],
)


def public_user_data(administrator):
    return AuthUserResponse(
        usuario=administrator.usuario,
        nome_exibicao=administrator.nome_exibicao,
        perfil=administrator.perfil,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    response: Response,
):
    normalized_username = (
        payload.usuario.strip().lower()
    )

    with SessionLocal() as session:
        administrator = session.scalar(
            select(Administrador).where(
                Administrador.usuario
                == normalized_username
            )
        )

        credentials_valid = (
            administrator is not None
            and administrator.ativo
            and verify_password(
                payload.senha,
                administrator.senha_hash,
            )
        )

        if not credentials_valid:
            raise HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail=(
                    "Usuario ou senha invalidos."
                ),
            )

        token, session_data = create_session(
            usuario=administrator.usuario,
            nome_exibicao=(
                administrator.nome_exibicao
            ),
            perfil=administrator.perfil,
        )

        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            max_age=get_session_duration_seconds(),
            httponly=True,
            secure=False,
            samesite="strict",
            path="/",
        )

        return LoginResponse(
            autenticado=True,
            usuario=public_user_data(
                administrator
            ),
        )


@router.post(
    "/logout",
    response_model=LogoutResponse,
)
def logout(
    response: Response,
    session_token: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
):
    delete_session(
        session_token
    )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=False,
        samesite="strict",
    )

    return LogoutResponse(
        autenticado=False
    )


@router.get(
    "/me",
    response_model=AuthUserResponse,
)
def get_current_user(
    session_data=Depends(
        require_authenticated_user
    ),
):
    return AuthUserResponse(
        usuario=session_data.usuario,
        nome_exibicao=session_data.nome_exibicao,
        perfil=session_data.perfil,
    )