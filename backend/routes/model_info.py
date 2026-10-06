from fastapi import APIRouter
from schemas import (
    HealthResponse, 
    ModelInfoResponse, 
    MetricRow, 
    ConfusionMatrixData, 
    FeatureImportanceItem
)
from model_service import model_manager, FEATURE_IMPORTANCE_MAP
from config import settings

router = APIRouter(tags=["Model Metadata"])

STATIC_METRICS_COMPARISON = [
    MetricRow(
        model_name="Gradient Boosting Classifier",
        accuracy=99.2,
        precision=96.4,
        recall=79.4,
        f1_score=87.1,
        roc_auc=97.2,
        is_best=True
    ),
    MetricRow(
        model_name="Random Forest Classifier",
        accuracy=99.05,
        precision=92.98,
        recall=77.94,
        f1_score=84.80,
        roc_auc=98.21,
        is_best=False
    ),
    MetricRow(
        model_name="Logistic Regression (Baseline)",
        accuracy=85.95,
        precision=17.82,
        recall=86.76,
        f1_score=29.57,
        roc_auc=93.74,
        is_best=False
    )
]

CONFUSION_MATRIX_SPEC = ConfusionMatrixData(
    true_negative=1930,
    false_positive=2,
    false_negative=14,
    true_positive=54,
    total_test_samples=2000
)

FAILURE_MODES_META = [
    {
        "code": "TWF",
        "name": "Tool Wear Failure",
        "physical_condition": "Tool contact time reaches 200 - 240+ minutes, causing irreversible micro-chipping or cutting edge dulling."
    },
    {
        "code": "HDF",
        "name": "Heat Dissipation Failure",
        "physical_condition": "Process temp - Air temp < 8.6 K and Rotational speed < 1380 rpm. Low convective airflow causes thermal accumulation."
    },
    {
        "code": "PWF",
        "name": "Power Failure",
        "physical_condition": "Mechanical power proxy (Rotational Speed × Torque) drops below 3,500 W (stalling) or surges past 9,000 W (overload)."
    },
    {
        "code": "OSF",
        "name": "Overstrain Failure",
        "physical_condition": "Cumulative load (Tool wear × Torque) exceeds machine material tolerance (11k for L, 12k for M, 13k for H)."
    },
    {
        "code": "RNF",
        "name": "Random Failure",
        "physical_condition": "Uncorrelated stochastic hardware defects occurring at ~0.1% background frequency regardless of sensor levels."
    }
]

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Liveness and model status check returning runtime metadata and baseline metrics.
    """
    return HealthResponse(
        status="healthy",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        model_loaded=model_manager.is_loaded,
        model_source=model_manager.model_source,
        metadata={
            "algorithm": "Gradient Boosting Classifier",
            "accuracy": 99.2,
            "precision": 96.4,
            "recall": 79.4,
            "f1_score": 87.1,
            "roc_auc": 97.2,
            "course": "AD5305 Machine Learning",
            "dataset": "UCI AI4I 2020 Predictive Maintenance Dataset"
        }
    )

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """
    Returns complete model card info: algorithm specs, dataset details,
    model comparison table, confusion matrix, feature importance hierarchy,
    and class imbalance analysis.
    """
    feature_items = [
        FeatureImportanceItem(
            ranking=item["ranking"],
            feature=item["feature"],
            display_name=item["display_name"],
            importance_weight=item["importance_weight"],
            category=item["category"],
            description=item["description"]
        ) for item in FEATURE_IMPORTANCE_MAP
    ]
    
    return ModelInfoResponse(
        algorithm="Gradient Boosting Classifier (sklearn.ensemble.GradientBoostingClassifier)",
        dataset={
            "name": "AI4I 2020 Predictive Maintenance Dataset",
            "source": "UCI Machine Learning Repository",
            "total_records": 10000,
            "total_columns": 14,
            "failure_rate_pct": 3.39,
            "healthy_records": 9661,
            "failed_records": 339,
            "split_ratio": "80% Training (8,000 samples) / 20% Evaluation (2,000 samples)"
        },
        metrics_comparison=STATIC_METRICS_COMPARISON,
        confusion_matrix=CONFUSION_MATRIX_SPEC,
        feature_importance=feature_items,
        class_imbalance_analysis={
            "imbalance_ratio": "28.5 to 1 (96.61% non-failure vs 3.39% failure)",
            "accuracy_paradox": "A naive baseline classifier guessing 'No Failure' 100% of the time achieves 96.61% accuracy while failing 100% of broken machines. Raw accuracy is therefore completely misleading in predictive maintenance.",
            "precision_importance": "With 96.4% precision (only 2 false positives out of 2,000 test cases), maintenance engineers are protected against costly unnecessary factory shutdowns.",
            "recall_importance": "79.4% recall captures impending breakdowns early, drastically reducing catastrophic downtime costs.",
            "f1_score": "87.1% harmonic balance provides the primary single-number optimization criterion for model selection."
        },
        failure_modes_definition=FAILURE_MODES_META,
        why_this_matters="Because only 3.39% of the dataset represents real machine failures, a model that always guesses 'no failure' would already achieve over 96% accuracy while being completely useless — so precision (ensuring a flagged failure is real to avoid costly false alarms) and recall (catching as many real failures as possible) matter far more than raw accuracy here."
    )
