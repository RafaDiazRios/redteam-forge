import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    # General
    APP_NAME: str = "RedTeam Forge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Anthropic / Claude
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = "claude-opus-4-5"
    CLAUDE_CODE_CMD: str = os.getenv("CLAUDE_CODE_CMD", "claude")

    # Paths
    KNOWLEDGE_BASE_DIR: Path = BASE_DIR / "knowledge_base" / "raw_text"
    FAISS_INDEX_DIR: Path = BASE_DIR / "knowledge_base" / "faiss_index"
    ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    DB_PATH: str = str(BASE_DIR / "redteam_forge.db")

    # GitHub
    GITHUB_REPO: str = os.getenv("GITHUB_REPO", "RafaDiazRios/redteam-forge")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "redteam-forge-secret-key-change-in-production")

    def __init__(self):
        # Ensure directories exist
        self.FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
        self.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        self.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
