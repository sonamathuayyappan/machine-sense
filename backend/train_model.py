"""
Training and serialization pipeline for AD5305 Machine Learning:
Dataset: UCI AI4I 2020 Predictive Maintenance (10,000 rows, 14 columns)
Model: GradientBoostingClassifier
Exports: model.pkl, preprocessor.pkl, ai4i2020.csv
"""

import urllib.request
import zipfile
import io
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, 
    precision_score, 
    recall_score, 
    f1_score, 
    roc_auc_score, 
    confusion_matrix, 
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "ai4i2020.csv"
MODEL_PATH = BASE_DIR / "model.pkl"
PREPROCESSOR_PATH = BASE_DIR / "preprocessor.pkl"

def fetch_dataset() -> pd.DataFrame:
    if DATASET_PATH.exists():
        print(f"Loading local dataset from {DATASET_PATH}")
        return pd.read_csv(DATASET_PATH)
    
    print("Downloading AI4I 2020 dataset from UCI repository...")
    url = "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        z = zipfile.ZipFile(io.BytesIO(resp.read()))
        with z.open("ai4i2020.csv") as f:
            df = pd.read_csv(f)
            df.to_csv(DATASET_PATH, index=False)
            print(f"Saved dataset to {DATASET_PATH}")
            return df

def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    data = df.copy()
    # Compute 3 domain-engineered features
    data["Power"] = data["Rotational speed [rpm]"] * data["Torque [Nm]"]
    data["Temp_diff"] = data["Process temperature [K]"] - data["Air temperature [K]"]
    data["Tool_torque_product"] = data["Tool wear [min]"] * data["Torque [Nm]"]
    return data

def train_and_export():
    df = fetch_dataset()
    df = feature_engineering(df)
    
    feature_cols = [
        "Type",
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Tool wear [min]",
        "Power",
        "Temp_diff",
        "Tool_torque_product"
    ]
    target_col = "Machine failure"
    
    X = df[feature_cols]
    y = df[target_col]
    
    print(f"Dataset shape: {df.shape}")
    print(f"Failure count: {y.sum()} / {len(y)} ({y.mean()*100:.2f}%)")
    
    # Stratified 80/20 train/test split (8000 train, 2000 test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    categorical_features = ["Type"]
    numerical_features = [c for c in feature_cols if c != "Type"]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop="first", sparse_output=False), categorical_features),
            ("num", "passthrough", numerical_features)
        ],
        remainder="drop"
    )
    
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    
    # Train Gradient Boosting Classifier
    print("Training GradientBoostingClassifier...")
    gb_model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=4,
        subsample=0.85,
        random_state=42
    )
    gb_model.fit(X_train_trans, y_train)
    
    # Evaluate
    y_pred = gb_model.predict(X_test_trans)
    y_prob = gb_model.predict_proba(X_test_trans)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Gradient Boosting Evaluation Results ---")
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1 Score:  {f1*100:.2f}%")
    print(f"ROC-AUC:   {roc_auc*100:.2f}%")
    print(f"Confusion Matrix (TN, FP / FN, TP):\n{cm}")
    
    # Feature Importances
    # Extract feature names after OneHotEncoding
    ohe = preprocessor.named_transformers_["cat"]
    cat_names = [f"Type_{cat}" for cat in ohe.categories_[0][1:]]
    all_feature_names = cat_names + numerical_features
    importances = gb_model.feature_importances_
    
    feat_imp = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    print("\nFeature Importances:")
    for name, imp in feat_imp:
        print(f"  - {name}: {imp:.4f}")
        
    # Serialize artifacts
    joblib.dump(gb_model, MODEL_PATH)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    print(f"\nExported artifacts:")
    print(f"  -> {MODEL_PATH}")
    print(f"  -> {PREPROCESSOR_PATH}")

if __name__ == "__main__":
    train_and_export()
