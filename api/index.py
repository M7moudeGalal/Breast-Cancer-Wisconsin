"""
FastAPI Backend for Wisconsin Breast Cancer Clinical Diagnostic Platform.
Serves live inference across all 5 scikit-learn pipelines (ANN, Random Forest,
SVM, KNN, Decision Tree), model evaluation metrics, and patient test records.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional, Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

FEATURE_COLS = [
    "clump_thickness",
    "uniformity_of_cell_size",
    "uniformity_of_cell_shape",
    "marginal_adhesion",
    "single_epithelial_cell_size",
    "bare_nuclei",
    "bland_chromatin",
    "normal_nucleoli",
    "mitoses",
]

FEATURE_LABELS = {
    "clump_thickness": "Clump Thickness",
    "uniformity_of_cell_size": "Uniformity of Cell Size",
    "uniformity_of_cell_shape": "Uniformity of Cell Shape",
    "marginal_adhesion": "Marginal Adhesion",
    "single_epithelial_cell_size": "Single Epithelial Cell Size",
    "bare_nuclei": "Bare Nuclei",
    "bland_chromatin": "Bland Chromatin",
    "normal_nucleoli": "Normal Nucleoli",
    "mitoses": "Mitoses",
}

MODEL_REGISTRY = {
    "ANN (MLP)": {
        "file": "ann_mlp_pipeline.joblib",
        "primary": True,
        "badge": "Best Recall & F1 (Primary)",
        "architecture": "MLPClassifier(hidden_layer_sizes=(50,), alpha=0.001)",
    },
    "Random Forest": {
        "file": "random_forest_pipeline.joblib",
        "primary": False,
        "badge": "Best ROC-AUC (0.9963)",
        "architecture": "RandomForestClassifier(n_estimators=200, max_depth=5)",
    },
    "SVM": {
        "file": "svm_pipeline.joblib",
        "primary": False,
        "badge": "RBF Kernel Margin",
        "architecture": "SVC(C=1.0, kernel='rbf', gamma=0.01)",
    },
    "KNN": {
        "file": "knn_pipeline.joblib",
        "primary": False,
        "badge": "Distance-Weighted k=9",
        "architecture": "KNeighborsClassifier(n_neighbors=9, p=2, weights='distance')",
    },
    "Decision Tree": {
        "file": "decision_tree_pipeline.joblib",
        "primary": False,
        "badge": "Interpretable Rule Tree",
        "architecture": "DecisionTreeClassifier(criterion='entropy', max_depth=5)",
    },
}

app = FastAPI(
    title="WBC Clinical AI Diagnostic API",
    description="FastAPI Backend for Wisconsin Breast Cancer Multi-Model Diagnostic System",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_PIPELINES: Dict[str, Any] = {}


def get_pipelines() -> Dict[str, Any]:
    if not _PIPELINES:
        for name, meta in MODEL_REGISTRY.items():
            model_path = MODELS_DIR / meta["file"]
            if model_path.exists():
                _PIPELINES[name] = joblib.load(model_path)
    return _PIPELINES


class CytologyInput(BaseModel):
    clump_thickness: float = Field(4.0, ge=1.0, le=10.0)
    uniformity_of_cell_size: float = Field(1.0, ge=1.0, le=10.0)
    uniformity_of_cell_shape: float = Field(1.0, ge=1.0, le=10.0)
    marginal_adhesion: float = Field(1.0, ge=1.0, le=10.0)
    single_epithelial_cell_size: float = Field(2.0, ge=1.0, le=10.0)
    bare_nuclei: Optional[float] = Field(1.0, ge=1.0, le=10.0)
    bland_chromatin: float = Field(2.0, ge=1.0, le=10.0)
    normal_nucleoli: float = Field(1.0, ge=1.0, le=10.0)
    mitoses: float = Field(1.0, ge=1.0, le=10.0)
    selected_model: str = Field("ANN (MLP)")


@app.get("/api/health")
def health_check():
    pipelines = get_pipelines()
    return {
        "status": "online",
        "engine": "FastAPI + scikit-learn",
        "sklearn_version": sklearn.__version__,
        "loaded_models": list(pipelines.keys()),
        "models_count": len(pipelines),
    }


@app.post("/api/predict")
def predict_cytology(payload: CytologyInput):
    pipelines = get_pipelines()
    if not pipelines:
        raise HTTPException(status_code=500, detail="Model pipelines not found on disk.")

    raw_dict = {
        "clump_thickness": payload.clump_thickness,
        "uniformity_of_cell_size": payload.uniformity_of_cell_size,
        "uniformity_of_cell_shape": payload.uniformity_of_cell_shape,
        "marginal_adhesion": payload.marginal_adhesion,
        "single_epithelial_cell_size": payload.single_epithelial_cell_size,
        "bare_nuclei": np.nan if payload.bare_nuclei is None else payload.bare_nuclei,
        "bland_chromatin": payload.bland_chromatin,
        "normal_nucleoli": payload.normal_nucleoli,
        "mitoses": payload.mitoses,
    }
    X_df = pd.DataFrame([raw_dict])[FEATURE_COLS]

    primary_pipe = pipelines["ANN (MLP)"]
    X_imputed = primary_pipe.named_steps["imputer"].transform(X_df)
    X_scaled = primary_pipe.named_steps["scaler"].transform(X_imputed)

    preprocessing_breakdown = []
    for idx, col in enumerate(FEATURE_COLS):
        preprocessing_breakdown.append({
            "feature": col,
            "label": FEATURE_LABELS[col],
            "raw": None if payload.bare_nuclei is None and col == "bare_nuclei" else float(raw_dict[col]),
            "imputed": round(float(X_imputed[0, idx]), 4),
            "z_score": round(float(X_scaled[0, idx]), 4),
            "was_imputed": bool(payload.bare_nuclei is None and col == "bare_nuclei"),
        })

    model_outputs = {}
    malignant_votes = 0

    for name, pipe in pipelines.items():
        pred = int(pipe.predict(X_df)[0])
        if pred == 1:
            malignant_votes += 1

        prob_malignant = None
        decision_margin = None
        clf = pipe.named_steps.get("model") or pipe.named_steps.get("clf")
        if hasattr(pipe, "predict_proba"):
            try:
                probs = pipe.predict_proba(X_df)[0]
                prob_malignant = round(float(probs[1]), 6)
            except Exception:
                pass
        if hasattr(pipe, "decision_function"):
            try:
                margin = pipe.decision_function(X_df)[0]
                decision_margin = round(float(margin), 6)
                if prob_malignant is None:
                    prob_malignant = round(float(1.0 / (1.0 + np.exp(-margin))), 6)
            except Exception:
                pass

        model_outputs[name] = {
            "model": name,
            "prediction": pred,
            "diagnosis": "Malignant" if pred == 1 else "Benign",
            "probability": prob_malignant,
            "decision_margin": decision_margin,
            "badge": MODEL_REGISTRY[name]["badge"],
            "architecture": MODEL_REGISTRY[name]["architecture"],
        }

    chosen_name = payload.selected_model if payload.selected_model in model_outputs else "ANN (MLP)"
    chosen_result = model_outputs[chosen_name]

    return {
        "engine": "FastAPI Live Pipeline",
        "selected_model": chosen_name,
        "primary_result": chosen_result,
        "consensus": {
            "malignant_votes": malignant_votes,
            "benign_votes": len(pipelines) - malignant_votes,
            "total_models": len(pipelines),
            "consensus_diagnosis": "Malignant" if malignant_votes >= 3 else "Benign",
            "agreement_ratio": round(max(malignant_votes, len(pipelines) - malignant_votes) / len(pipelines), 2),
        },
        "models": model_outputs,
        "preprocessing": preprocessing_breakdown,
    }


@app.get("/api/metrics")
def get_metrics():
    cv_path = MODELS_DIR / "cv_results_summary.csv"
    test_path = MODELS_DIR / "test_results_summary.csv"
    cv_records = pd.read_csv(cv_path).to_dict(orient="records") if cv_path.exists() else []
    test_records = pd.read_csv(test_path).to_dict(orient="records") if test_path.exists() else []
    return {
        "cv_results": cv_records,
        "test_results": test_records,
    }


@app.get("/api/patients")
def get_test_patients(limit: int = 139):
    split_path = DATA_DIR / "train_test_split.csv"
    if not split_path.exists():
        return {"patients": []}
    df = pd.read_csv(split_path)
    test_df = df[df["split"] == "test"].head(limit).copy().reset_index(drop=True)
    records = []
    for idx, row in test_df.iterrows():
        features = {}
        for col in FEATURE_COLS:
            val = row[col]
            features[col] = None if pd.isna(val) else float(val)
        records.append({
            "case_id": f"WBC-{int(row['sample_code_number'])}",
            "sample_code_number": int(row["sample_code_number"]),
            "row_index": int(idx),
            "target": int(row["class"]),
            "actual_diagnosis": "Malignant" if int(row["class"]) == 1 else "Benign",
            "features": features,
        })
    return {"patients": records}
