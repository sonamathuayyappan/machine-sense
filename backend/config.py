import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Machine Sense"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Storage
    DB_PATH: Path = BASE_DIR / "machine_sense.db"
    
    # Model artifacts
    MODEL_PATH: Path = BASE_DIR / "model.pkl"
    PREPROCESSOR_PATH: Path = BASE_DIR / "preprocessor.pkl"
    
    # Configurable risk thresholds
    LOW_RISK_THRESHOLD: float = 0.30
    HIGH_RISK_THRESHOLD: float = 0.70

    # Sensor operational limits for validation
    AIR_TEMP_MIN: float = 280.0
    AIR_TEMP_MAX: float = 320.0
    
    PROCESS_TEMP_MIN: float = 290.0
    PROCESS_TEMP_MAX: float = 330.0
    
    ROTATIONAL_SPEED_MIN: int = 500
    ROTATIONAL_SPEED_MAX: int = 4000
    
    TORQUE_MIN: float = 0.0
    TORQUE_MAX: float = 120.0
    
    TOOL_WEAR_MIN: int = 0
    TOOL_WEAR_MAX: int = 350

settings = Settings()
