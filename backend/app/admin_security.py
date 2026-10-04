import base64
import hashlib
import hmac
import secrets
import time


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return "scrypt$16384$" + base64.urlsafe_b64encode(salt).decode().rstrip("=") + "$" + base64.urlsafe_b64encode(digest).decode().rstrip("=")


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, cost, salt_text, digest_text = encoded.split("$", 3)
        if algorithm != "scrypt" or cost != "16384":
            return False
        salt = base64.urlsafe_b64decode(salt_text + "=" * (-len(salt_text) % 4))
        expected = base64.urlsafe_b64decode(digest_text + "=" * (-len(digest_text) % 4))
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=len(expected))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_session(username: str, secret: str, lifetime_seconds: int = 12 * 60 * 60) -> str:
    expires = int(time.time()) + lifetime_seconds
    payload = f"{username}\n{expires}".encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded}.{signed}"


def verify_session(token: str | None, secret: str, expected_username: str) -> bool:
    if not token or "." not in token or not secret:
        return False
    encoded, supplied_signature = token.rsplit(".", 1)
    expected_signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    expected_text = base64.urlsafe_b64encode(expected_signature).decode().rstrip("=")
    if not hmac.compare_digest(supplied_signature, expected_text):
        return False
    try:
        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)).decode("utf-8")
        username, expires_text = payload.split("\n", 1)
        return username == expected_username and int(expires_text) > int(time.time())
    except (ValueError, UnicodeDecodeError):
        return False
