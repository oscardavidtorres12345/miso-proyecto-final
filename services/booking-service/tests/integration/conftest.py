import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Point to real PostgreSQL before importing src modules
os.environ["DATABASE_URL"] = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://booking_user:booking_pass@booking-db:5432/booking_db",
)

# Patch init_db so the app can import without crashing if tables are absent;
# tables are assumed to exist from seed scripts / migrations.
with patch("src.infrastructure.database.connection.init_db", return_value=None):
    from src.infrastructure.database.connection import Base, get_db
    from src.main import app

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure tables exist (idempotent — safe if seed scripts already ran)
Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="function")
def db_session():
    session = SessionLocal()
    yield session
    # Rollback any uncommitted changes
    session.rollback()
    session.close()


@pytest.fixture()
def client(db_session):
    # Override get_db so the endpoint uses our integration session
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
