"""Create the first administrator without seeding public demo credentials.

Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in the process environment,
then run this script once after applying database migrations.
"""

import os

import app.models  # noqa: F401 - register relationships before querying users
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def main() -> None:
    email = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "")
    full_name = os.getenv("ADMIN_BOOTSTRAP_FULL_NAME", "Platform Administrator").strip()
    if not email or "@" not in email or len(password) < 12 or not full_name:
        raise SystemExit("Set a valid ADMIN_BOOTSTRAP_EMAIL, a password of at least 12 characters, and an admin name.")

    with SessionLocal() as db:
        existing = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing:
            raise SystemExit("An administrator already exists. Use the admin portal to manage accounts.")
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("That email is already registered.")
        db.add(User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        ))
        db.commit()
    print("Administrator created. Remove the bootstrap password from the process environment.")


if __name__ == "__main__":
    main()
