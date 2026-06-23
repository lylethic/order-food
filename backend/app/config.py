from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ordering_food"
    JWT_SECRET: str = "your-secret-key"
    ACCESS_TOKEN_EXPIRY: int = 60
    REFRESHTOKEN_EXPIRYTIME: int = 7
    PORT: int = 3001
    API_PUBLIC_URL: str = "http://localhost:3001"
    FRONTEND_URL: str = "http://localhost:5173"
    QR_SECRET: str = "your-qr-secret"
    NODE_ENV: str = "development"

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
