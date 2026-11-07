"""
FastAPI Backend for Wisconsin Breast Cancer Clinical Diagnostic Platform.
Matches exact parameters and test-set metrics from models/*.joblib.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

MODEL_FILES = {
    "ANN (MLP)": "ann_mlp_pipeline.joblib",
    "Random Forest": "random_forest_pipeline.joblib",
    "SVM": "svm_pipeline.joblib",
    "KNN": "knn_pipeline.joblib",
    "Decision Tree": "decision_tree_pipeline.joblib",
}

app = FastAPI(
    title="Wisconsin Breast Cancer Cytology API",
    version="3.0.0",
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
        for name, fname in MODEL_FILES.items():
            p = MODELS_DIR / fname
            if p.exists():
                _PIPELINES[name] = joblib.load(p)
    return _PIPELINES


class CytologyInput(BaseModel):
    clump_thickness: float = Field(1.0, ge=1.0, le=10.0)
    uniformity_of_cell_size: float = Field(1.0, ge=1.0, le=10.0)
    uniformity_of_cell_shape: float = Field(1.0, ge=1.0, le=10.0)
    marginal_adhesion: float = Field(1.0, ge=1.0, le=10.0)
    single_epithelial_cell_size: float = Field(1.0, ge=1.0, le=10.0)
    bare_nuclei: Optional[float] = Field(1.0, ge=1.0, le=10.0)
    bland_chromatin: float = Field(1.0, ge=1.0, le=10.0)
    normal_nucleoli: float = Field(1.0, ge=1.0, le=10.0)
    mitoses: float = Field(1.0, ge=1.0, le=10.0)


@app.get("/api/health")
def health_check():
    pipes = get_pipelines()
    return {
        "status": "online",
        "sklearn_version": sklearn.__version__,
        "models": {k: str(v.named_steps["model"]) for k, v in pipes.items()},
    }


@app.post("/api/predict")
def predict_cytology(payload: CytologyInput):
    pipes = get_pipelines()
    if not pipes:
        raise HTTPException(status_code=500, detail="Pipelines not found")

    raw = {
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
    X_df = pd.DataFrame([raw])[FEATURE_COLS]

    results = {}
    votes = 0
    for name, pipe in pipes.items():
        pred = int(pipe.predict(X_df)[0])
        votes += pred
        score = None
        if hasattr(pipe, "predict_proba"):
            try:
                score = float(pipe.predict_proba(X_df)[0][1])
            except Exception:
                pass
        if score is None and hasattr(pipe, "decision_function"):
            m = float(pipe.decision_function(X_df)[0])
            score = float(1.0 / (1.0 + np.exp(-2.0 * m)))
        results[name] = {"pred": pred, "score": round(score or 0.0, 6)}

    return {
        "primary": results["ANN (MLP)"],
        "votes": votes,
        "models": results,
    }


@app.get("/api/metrics")
def get_metrics():
    return {
        "test": pd.read_csv(MODELS_DIR / "test_results_summary.csv").to_dict(orient="records"),
        "cv": pd.read_csv(MODELS_DIR / "cv_results_summary.csv").to_dict(orient="records"),
    }
