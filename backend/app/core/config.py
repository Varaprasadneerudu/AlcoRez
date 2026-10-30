from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AlcoRez"
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
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://alco-rez.vercel.app",
        "https://alcorez.onrender.com",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        env = self.ENVIRONMENT.lower().strip()
        if env in ["production", "prod"]:
            # 1. Enforce debug mode disabled in production
            if self.DEBUG:
                raise ValueError("Security violation: DEBUG mode must be False in production.")

            # 2. Enforce secure production JWT secret
            dev_patterns = [
                "insecure_dev_key",
                "insecure_dev",
                "change_this",
                "default_key",
                "telangana_alcomarket_secret"
            ]
            key_lower = self.JWT_SECRET_KEY.lower()
            if len(self.JWT_SECRET_KEY) < 32 or any(pat in key_lower for pat in dev_patterns):
                raise ValueError(
                    "Security violation: Production requires a secure, high-entropy JWT_SECRET_KEY "
                    "with at least 32 characters."
                )

            # 3. Disallow wildcards in production CORS
            if any(origin in ["*", "http://*", "https://*"] for origin in self.CORS_ORIGINS):
                raise ValueError("Security violation: Wildcard CORS origin (*) is forbidden in production.")

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
