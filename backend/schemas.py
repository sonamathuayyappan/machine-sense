from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator

class PredictRequest(BaseModel):
    type: Literal["L", "M", "H"] = Field(
        ..., 
        description="Machine product type: L (Low, 50%), M (Medium, 30%), H (High, 20%)"
    )
    air_temperature: float = Field(
        ..., 
        ge=280.0, 
        le=320.0, 
        description="Air temperature in Kelvin [K] (typical ~295-305 K)"
    )
    process_temperature: float = Field(
        ..., 
        ge=290.0, 
        le=330.0, 
        description="Process temperature in Kelvin [K] (typical ~305-314 K)"
    )
    rotational_speed: int = Field(
        ..., 
        ge=500, 
        le=4000, 
        description="Rotational speed in RPM (typical ~1150-2900 rpm)"
    )
    torque: float = Field(
        ..., 
        ge=0.0, 
        le=120.0, 
        description="Torque in Newton-meters [Nm] (typical ~3-77 Nm)"
    )
    tool_wear: int = Field(
        ..., 
        ge=0, 
        le=350, 
        description="Tool wear time in minutes [min] (typical ~0-253 min)"
    )

    @field_validator("process_temperature")
    @classmethod
    def validate_temp_relation(cls, v, info):
        air_temp = info.data.get("air_temperature")
        if air_temp is not None and v < (air_temp - 5.0):
            raise ValueError("Process temperature cannot be significantly lower than air temperature")
        return v

class EngineeredFeatures(BaseModel):
    power: float = Field(..., description="Power proxy = Rotational speed [rpm] * Torque [Nm]")
    temp_diff: float = Field(..., description="Process temp [K] - Air temp [K]")
    tool_torque_product: float = Field(..., description="Tool wear [min] * Torque [Nm]")

class FeatureContribution(BaseModel):
    feature: str
    importance: float
    value: Any
    description: str

class FailureModeInfo(BaseModel):
    code: str
    name: str
    triggered: bool
    explanation: str

# Rule-based explainability layer schema (approximating feature attribution stand-in for SHAP)
class DriverExplanation(BaseModel):
    feature: str
    plain_label: str
    severity: Literal["high", "medium", "low"]
    detail: str
    value: Optional[Any] = None
    threshold_info: Optional[str] = None

class ExplanationObject(BaseModel):
    primary_drivers: List[DriverExplanation]
    summary_sentence: str
    recommended_actions: List[str]

class PredictResponse(BaseModel):
    failure_probability: float
    risk_level: Literal["low", "medium", "high"]
    predicted_failure: int
    top_contributing_features: List[FeatureContribution]
    recommendation: str
    failure_modes: List[FailureModeInfo]
    engineered_features: EngineeredFeatures
    model_source: str
    prediction_id: Optional[int] = None
    timestamp: Optional[str] = None
    explanation: ExplanationObject

class HistoryItem(BaseModel):
    id: int
    timestamp: str
    type: str
    air_temperature: float
    process_temperature: float
    rotational_speed: int
    torque: float
    tool_wear: int
    power: float
    temp_diff: float
    tool_torque_product: float
    failure_probability: float
    risk_level: str
    predicted_failure: int
    recommendation: str
    model_source: str
    active_failure_modes: Optional[str] = None
    summary_sentence: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    explanation: Optional[ExplanationObject] = None

class HistorySummary(BaseModel):
    total_predictions: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    failures_detected: int
    average_failure_probability: float

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    limit: int
    offset: int
    summary: HistorySummary

class HealthResponse(BaseModel):
    status: str
    project_name: str
    version: str
    model_loaded: bool
    model_source: str
    metadata: Dict[str, Any]

class MetricRow(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    is_best: bool = False

class ConfusionMatrixData(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int
    total_test_samples: int

class FeatureImportanceItem(BaseModel):
    ranking: int
    feature: str
    display_name: str
    importance_weight: float
    category: str
    description: str

class ModelInfoResponse(BaseModel):
    algorithm: str
    dataset: Dict[str, Any]
    metrics_comparison: List[MetricRow]
    confusion_matrix: ConfusionMatrixData
    feature_importance: List[FeatureImportanceItem]
    class_imbalance_analysis: Dict[str, Any]
    failure_modes_definition: List[Dict[str, str]]
    why_this_matters: str
