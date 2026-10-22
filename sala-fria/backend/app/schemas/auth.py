from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid"
    )

    usuario: str = Field(
        min_length=1,
        max_length=150,
    )

    senha: str = Field(
        min_length=1,
        max_length=500,
    )


class AuthUserResponse(BaseModel):
    usuario: str
    nome_exibicao: str | None
    perfil: str


class LoginResponse(BaseModel):
    autenticado: bool
    usuario: AuthUserResponse


class LogoutResponse(BaseModel):
    autenticado: bool
