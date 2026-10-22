from datetime import datetime
from getpass import getpass
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
APP_DIR = PROJECT_DIR / "backend" / "app"

sys.path.insert(
    0,
    str(APP_DIR),
)


from sqlalchemy import select

from database import SessionLocal
from models.entities import Administrador
from security.passwords import hash_password


def read_required_value(message):
    while True:
        value = input(
            message
        ).strip()

        if value:
            return value

        print(
            "O valor nao pode ficar vazio."
        )


def read_password():
    while True:
        password = getpass(
            "Senha: "
        )

        confirmation = getpass(
            "Confirme a senha: "
        )

        if password != confirmation:
            print(
                "As senhas digitadas nao sao iguais."
            )
            continue

        try:
            password_hash = hash_password(
                password
            )
            return password_hash

        except ValueError as error:
            print(
                str(error)
            )


def main():
    print()
    print(
        "CRIAR OU ATUALIZAR ADMINISTRADOR"
    )
    print()

    username = read_required_value(
        "Usuario: "
    ).lower()

    display_name = input(
        "Nome de exibicao: "
    ).strip()

    print()
    print(
        "A senha deve possuir pelo menos:"
    )
    print(
        "- 12 caracteres"
    )
    print(
        "- uma letra maiuscula"
    )
    print(
        "- uma letra minuscula"
    )
    print(
        "- um numero"
    )
    print(
        "- um caractere especial"
    )
    print()

    password_hash = read_password()

    with SessionLocal() as session:
        administrator = session.scalar(
            select(Administrador).where(
                Administrador.usuario == username
            )
        )

        current_time = datetime.now()

        if administrator is None:
            administrator = Administrador(
                usuario=username,
                nome_exibicao=(
                    display_name or None
                ),
                senha_hash=password_hash,
                perfil="Administrador",
                ativo=True,
                criado_em=current_time,
                atualizado_em=current_time,
            )

            session.add(
                administrator
            )

            operation = "criado"

        else:
            administrator.nome_exibicao = (
                display_name
                or administrator.nome_exibicao
            )
            administrator.senha_hash = (
                password_hash
            )
            administrator.perfil = (
                "Administrador"
            )
            administrator.ativo = True
            administrator.atualizado_em = (
                current_time
            )

            operation = "atualizado"

        session.commit()

        print()
        print(
            f"Administrador {operation} com sucesso."
        )
        print(
            f"Usuario: {administrator.usuario}"
        )
        print(
            f"Perfil: {administrator.perfil}"
        )
        print(
            f"Ativo: {administrator.ativo}"
        )
        print()
        print(
            "A senha nao foi armazenada em texto puro."
        )
        print()


if __name__ == "__main__":
    try:
        main()

    except KeyboardInterrupt:
        print()
        print(
            "Operacao cancelada."
        )
        raise SystemExit(1)

    except Exception as error:
        print()
        print(
            "ERRO AO CRIAR ADMINISTRADOR"
        )
        print(
            str(error)
        )
        print()
        raise SystemExit(1)