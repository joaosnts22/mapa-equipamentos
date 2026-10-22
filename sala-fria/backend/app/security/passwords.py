import base64
import hashlib
import hmac
import secrets


ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 600000
SALT_SIZE = 16
HASH_SIZE = 32
MINIMUM_PASSWORD_LENGTH = 4


def encode_bytes(value):
    return base64.urlsafe_b64encode(
        value
    ).decode("ascii")


def decode_bytes(value):
    return base64.urlsafe_b64decode(
        value.encode("ascii")
    )


def validate_password_strength(password):
    if not isinstance(password, str):
        raise ValueError(
            "A senha deve ser um texto."
        )

    if len(password) < MINIMUM_PASSWORD_LENGTH:
        raise ValueError(
            "A senha deve possuir pelo menos "
            f"{MINIMUM_PASSWORD_LENGTH} caracteres."
        )


def hash_password(password):
    validate_password_strength(
        password
    )

    salt = secrets.token_bytes(
        SALT_SIZE
    )

    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        ITERATIONS,
        dklen=HASH_SIZE,
    )

    return "$".join(
        [
            ALGORITHM,
            str(ITERATIONS),
            encode_bytes(salt),
            encode_bytes(derived_key),
        ]
    )


def verify_password(
    password,
    stored_hash,
):
    try:
        algorithm, iterations_text, salt_text, hash_text = (
            stored_hash.split("$", 3)
        )

        if algorithm != ALGORITHM:
            return False

        iterations = int(
            iterations_text
        )

        salt = decode_bytes(
            salt_text
        )

        expected_hash = decode_bytes(
            hash_text
        )

        received_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            iterations,
            dklen=len(expected_hash),
        )

        return hmac.compare_digest(
            received_hash,
            expected_hash,
        )

    except (
        AttributeError,
        TypeError,
        ValueError,
    ):
        return False