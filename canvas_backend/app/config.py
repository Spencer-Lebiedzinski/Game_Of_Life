from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

print("DEBUG ENV FILE =", ENV_FILE, flush=True)
print("DEBUG ENV EXISTS =", ENV_FILE.exists(), flush=True)

class Settings(BaseSettings):
    app_name: str = "Canvas Planner Backend"

    canvas_base_url: str = "https://your-school.instructure.com"
    canvas_token: str | None = None

    canvas_client_id: str | None = None
    canvas_client_secret: str | None = None
    canvas_redirect_uri: str | None = None
    frontend_redirect_url: str | None = None
    oauth_state_secret: str = "replace-this"

    app_env: str = "development"
    app_debug: bool = True

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()

print("DEBUG canvas_base_url =", repr(settings.canvas_base_url), flush=True)
print("DEBUG canvas_token_set =", bool(settings.canvas_token), flush=True)