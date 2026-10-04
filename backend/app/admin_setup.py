from getpass import getpass
from pathlib import Path
import secrets
import sys

from app.admin_security import hash_password


def main() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    existing = env_path.read_text() if env_path.exists() else ""
    username = input("Admin username (for example, laura): ").strip()
    if not username or any(char.isspace() for char in username):
        sys.exit("Use a non-empty username without spaces.")
    password = getpass("Admin password (at least 12 characters): ")
    if len(password) < 12:
        sys.exit("Password must be at least 12 characters.")
    if password != getpass("Confirm admin password: "):
        sys.exit("Passwords did not match.")

    values = {
        "ADMIN_USERNAME": username,
        "ADMIN_PASSWORD_HASH": hash_password(password),
        "ADMIN_SESSION_SECRET": secrets.token_urlsafe(48),
        "ADMIN_COOKIE_SECURE": "false",
    }
    lines = [line for line in existing.splitlines() if not any(line.startswith(key + "=") for key in values)]
    lines.extend(f"{key}={value}" for key, value in values.items())
    env_path.write_text("\n".join(lines) + "\n")
    env_path.chmod(0o600)
    print(f"Admin credentials configured in {env_path}. The password is stored as a hash.")


if __name__ == "__main__":
    main()
