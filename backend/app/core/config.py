import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Alco Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Critical Legal Compliance Gate:
    # Under Telangana Excise Act, alcohol retail and delivery are strictly regulated.
    # Production alcohol transactions MUST default to False (fail-closed principle).
    ALCOHOL_TRANSACTIONS_ENABLED: bool = False
    DEMO_MODE: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./alcodelivery.db"

    # Security & JWT
    JWT_SECRET_KEY: str = "insecure_dev_key_telangana_alcomarket_secret_min_32_characters"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Adapters (Simulated / Demo defaults)
    STORAGE_PROVIDER: str = "local"
    PAYMENT_GATEWAY_PROVIDER: str = "simulated"
    GOOGLE_MAPS_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
