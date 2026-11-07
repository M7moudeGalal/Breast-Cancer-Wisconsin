import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import streamlit as st

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
FIGURES_DIR = os.path.join(BASE_DIR, "figures")

st.set_page_config(
    page_title="Wisconsin Breast Cancer — Clinical ML Decision Support",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for clean clinical cards and badges
st.markdown(
    """
    <style>
    .hero-card {
        padding: 1.4rem 1.6rem;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95));
        margin-bottom: 1.2rem;
    }
    .diag-benign {
        padding: 1.25rem 1.5rem;
        border-radius: 14px;
        border: 2px solid #2ecc71;
        background: rgba(46, 204, 113, 0.12);
        margin-bottom: 1rem;
    }
    .diag-malignant {
        padding: 1.25rem 1.5rem;
        border-radius: 14px;
        border: 2px solid #e74c3c;
        background: rgba(231, 76, 60, 0.14);
        margin-bottom: 1rem;
    }
    .kpi-mini {
        padding: 0.9rem 1.1rem;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(30, 41, 59, 0.7);
        text-align: center;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

FEATURE_INFO = {
    "clump_thickness": ("Clump Thickness", "Mono- vs. multi-layered cell grouping (1 = monolayer, 10 = thick multilayer clumps)"),
    "uniformity_of_cell_size": ("Uniformity of Cell Size", "Variation in cell size across the aspirate (1 = uniform normal size, 10 = extreme pleomorphism)"),
    "uniformity_of_cell_shape": ("Uniformity of Cell Shape", "Regularity of cell outlines (1 = regular round/oval, 10 = highly irregular shapes)"),
    "marginal_adhesion": ("Marginal Adhesion", "Degree to which cells stick together at margins (1 = cohesive, 10 = loss of adhesion)"),
    "single_epithelial_cell_size": ("Single Epithelial Cell Size", "Size of largest isolated epithelial cells (1 = normal small, 10 = greatly enlarged)"),
    "bare_nuclei": ("Bare Nuclei", "Nuclei stripped of surrounding cytoplasm (1 = absent, 10 = abundant bare nuclei)"),
    "bland_chromatin": ("Bland Chromatin", "Texture of nuclear chromatin (1 = fine uniform chromatin, 10 = coarse clumped chromatin)"),
    "normal_nucleoli": ("Normal Nucleoli", "Size and number of nucleoli inside nuclei (1 = indistinct/micronucleoli, 10 = prominent multiple)"),
    "mitoses": ("Mitoses", "Frequency of mitotic cell division figures (1 = absent/rare, 10 = frequent/atypical mitoses)"),
}
FEATURE_COLS = list(FEATURE_INFO.keys())

MODEL_FILES = {
    "ANN (MLP) — Best Overall": ("ANN (MLP)", "ann_mlp_pipeline.joblib"),
    "Random Forest": ("Random Forest", "random_forest_pipeline.joblib"),
    "SVM (RBF Kernel)": ("SVM", "svm_pipeline.joblib"),
    "K-Nearest Neighbors (KNN)": ("KNN", "knn_pipeline.joblib"),
    "Decision Tree": ("Decision Tree", "decision_tree_pipeline.joblib"),
}


@st.cache_resource
def load_pipelines():
    loaded = {}
    for label, (short_name, fname) in MODEL_FILES.items():
        path = os.path.join(MODELS_DIR, fname)
        loaded[short_name] = joblib.load(path)
    return loaded


@st.cache_data
def load_data_artifacts():
    split_df = pd.read_csv(os.path.join(DATA_DIR, "train_test_split.csv"))
    cv_df = pd.read_csv(os.path.join(MODELS_DIR, "cv_results_summary.csv"))
    test_df = pd.read_csv(os.path.join(MODELS_DIR, "test_results_summary.csv"))
    return split_df, cv_df, test_df


pipelines = load_pipelines()
split_df, cv_summary_df, test_summary_df = load_data_artifacts()
train_part = split_df[split_df["split"] == "train"].reset_index(drop=True)
test_part = split_df[split_df["split"] == "test"].reset_index(drop=True)

# Pre-defined clinical presets from the held-out test set
PRESETS = {
    "Manual Custom Input": {
        "values": {c: 1 for c in FEATURE_COLS},
        "bare_na": False,
        "desc": "Adjust the 9 cytological sliders manually on the 1–10 ordinal scale.",
    },
    "Typical Benign Case (Test Sample #1033078, True = Benign)": {
        "values": {
            "clump_thickness": 2, "uniformity_of_cell_size": 1, "uniformity_of_cell_shape": 1,
            "marginal_adhesion": 1, "single_epithelial_cell_size": 2, "bare_nuclei": 1,
            "bland_chromatin": 1, "normal_nucleoli": 1, "mitoses": 1,
        },
        "bare_na": False,
        "desc": "Low-grade uniform cytological profile from the held-out test partition (True Class: Benign).",
    },
    "Typical Malignant Case (Test Sample #1017122, True = Malignant)": {
        "values": {
            "clump_thickness": 8, "uniformity_of_cell_size": 10, "uniformity_of_cell_shape": 10,
            "marginal_adhesion": 8, "single_epithelial_cell_size": 7, "bare_nuclei": 10,
            "bland_chromatin": 9, "normal_nucleoli": 7, "mitoses": 1,
        },
        "bare_na": False,
        "desc": "High-grade anaplastic profile with marked pleomorphism and bare nuclei (True Class: Malignant).",
    },
    "Borderline / atypical Case (Test Sample #1198641, True = Malignant)": {
        "values": {
            "clump_thickness": 10, "uniformity_of_cell_size": 5, "uniformity_of_cell_shape": 5,
            "marginal_adhesion": 3, "single_epithelial_cell_size": 6, "bare_nuclei": 7,
            "bland_chromatin": 7, "normal_nucleoli": 10, "mitoses": 1,
        },
        "bare_na": False,
        "desc": "Intermediate cell size/shape uniformity with elevated clump thickness and nucleoli (True Class: Malignant).",
    },
    "Missing bare_nuclei Case (Test Sample #1057013, True = Malignant)": {
        "values": {
            "clump_thickness": 8, "uniformity_of_cell_size": 4, "uniformity_of_cell_shape": 5,
            "marginal_adhesion": 1, "single_epithelial_cell_size": 2, "bare_nuclei": 1,
            "bland_chromatin": 7, "normal_nucleoli": 3, "mitoses": 1,
        },
        "bare_na": True,
        "desc": "Held-out test case where bare_nuclei is missing (NaN) — demonstrates automatic in-pipeline median imputation.",
    },
}

# ==================== SIDEBAR ====================
with st.sidebar:
    st.markdown("## 🩺 Clinical Input Panel")
    selected_model_label = st.selectbox(
        "Primary Diagnostic Model",
        options=list(MODEL_FILES.keys()),
        index=0,
        help="Select the primary pipeline for the top diagnostic banner. All 5 models are also compared side-by-side.",
    )
    primary_model_name = MODEL_FILES[selected_model_label][0]

    preset_choice = st.selectbox(
        "Clinical Case Preset",
        options=list(PRESETS.keys()),
        index=0,
    )
    preset_data = PRESETS[preset_choice]
    st.caption(preset_data["desc"])

    st.markdown("---")
    st.markdown("### Cytological Attributes (Scale 1–10)")

    input_values = {}
    bare_is_nan = st.checkbox(
        "Simulate missing `bare_nuclei` (`?` / `NaN`)",
        value=preset_data["bare_na"],
        help="When checked, bare_nuclei is passed as NaN and automatically imputed by each pipeline's fitted SimpleImputer(strategy='median').",
    )

    for col in FEATURE_COLS:
        title, tooltip = FEATURE_INFO[col]
        if col == "bare_nuclei" and bare_is_nan:
            st.info("`bare_nuclei` set to `NaN` (imputed in-pipeline as training median = 1.0)")
            input_values[col] = np.nan
        else:
            input_values[col] = float(
                st.slider(
                    label=f"{title} (`{col}`)",
                    min_value=1,
                    max_value=10,
                    value=int(preset_data["values"][col]),
                    step=1,
                    help=tooltip,
                )
            )

# Build 1-row DataFrame for inference
X_input = pd.DataFrame([input_values], columns=FEATURE_COLS)


def compute_model_inference(pipe, X_row):
    pred_class = int(pipe.predict(X_row)[0])
    if hasattr(pipe, "predict_proba"):
        prob_mal = float(pipe.predict_proba(X_row)[0, 1])
        score_label = f"{prob_mal * 100:.2f}%"
    else:
        margin = float(pipe.decision_function(X_row)[0])
        # Logistic sigmoid mapping of SVM decision margin for intuitive display alongside raw margin
        prob_mal = float(1.0 / (1.0 + np.exp(-margin)))
        score_label = f"{prob_mal * 100:.2f}% (margin: {margin:+.2f})"
    return pred_class, prob_mal, score_label


# ==================== HEADER ====================
st.markdown(
    """
    <div class="hero-card">
        <h2 style="margin:0; font-weight:800;">🩺 Wisconsin Breast Cancer — Clinical Decision Support & Model Benchmark</h2>
        <p style="margin:0.4rem 0 0 0; opacity:0.85; font-size:0.95rem;">
            End-to-End Leakage-Free Machine Learning Pipeline (Tasks 1 → 5) • 691 Unique Biopsies • Group-Aware Stratified Split (552 Train / 139 Test) • 5 Tuned Scikit-Learn Pipelines
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

tab_diag, tab_eval, tab_cv, tab_eda = st.tabs([
    "🩺 1. Live Clinical Diagnosis & 5-Model Consensus",
    "📊 2. Held-Out Test Evaluation (Task 5)",
    "⚙️ 3. Hyperparameter Tuning & CV (Task 4)",
    "🔍 4. Dataset Exploration & EDA (Tasks 1–3)",
])

# ==================== TAB 1: LIVE DIAGNOSIS ====================
with tab_diag:
    consensus_rows = []
    for label, (m_name, _) in MODEL_FILES.items():
        pred_c, prob_m, score_str = compute_model_inference(pipelines[m_name], X_input)
        test_row = test_summary_df[test_summary_df["Model"] == m_name].iloc[0]
        consensus_rows.append({
            "Model": m_name,
            "Prediction": "Malignant (1)" if pred_c == 1 else "Benign (0)",
            "Pred_Int": pred_c,
            "Malignancy Score": score_str,
            "Prob_Float": prob_m,
            "Test Recall": f"{test_row['Recall']:.4f}",
            "Test F1-score": f"{test_row['F1-score']:.4f}",
            "Test ROC-AUC": f"{test_row['ROC-AUC']:.4f}",
        })
    consensus_df = pd.DataFrame(consensus_rows)

    primary_row = consensus_df[consensus_df["Model"] == primary_model_name].iloc[0]
    mal_votes = int((consensus_df["Pred_Int"] == 1).sum())
    ben_votes = 5 - mal_votes

    col_banner, col_consensus = st.columns([1.15, 1.35])

    with col_banner:
        if primary_row["Pred_Int"] == 1:
            st.markdown(
                f"""
                <div class="diag-malignant">
                    <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.06em; opacity:0.9;">
                        Primary Model: <strong>{primary_model_name}</strong>
                    </div>
                    <h2 style="margin:0.3rem 0; color:#ff6b6b; font-weight:800;">
                        ⚠️ MALIGNANT (Positive Class = 1)
                    </h2>
                    <p style="margin:0.2rem 0; font-size:1.05rem;">
                        Malignancy Probability / Confidence: <strong>{primary_row['Malignancy Score']}</strong>
                    </p>
                    <p style="margin:0.5rem 0 0 0; font-size:0.9rem; opacity:0.9;">
                        <strong>Clinical Action:</strong> Immediate histopathological biopsy confirmation and oncology referral recommended.
                        Ensemble Consensus: <strong>{mal_votes} / 5 models</strong> classify this sample as Malignant.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                f"""
                <div class="diag-benign">
                    <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.06em; opacity:0.9;">
                        Primary Model: <strong>{primary_model_name}</strong>
                    </div>
                    <h2 style="margin:0.3rem 0; color:#2ecc71; font-weight:800;">
                        ✅ BENIGN (Negative Class = 0)
                    </h2>
                    <p style="margin:0.2rem 0; font-size:1.05rem;">
                        Malignancy Probability / Risk Score: <strong>{primary_row['Malignancy Score']}</strong>
                    </p>
                    <p style="margin:0.5rem 0 0 0; font-size:0.9rem; opacity:0.9;">
                        <strong>Clinical Action:</strong> Cytological features align with benign morphology. Routine clinical follow-up advised.
                        Ensemble Consensus: <strong>{ben_votes} / 5 models</strong> classify this sample as Benign.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("#### Multi-Model Consensus Table (All 5 Tuned Pipelines)")
        st.dataframe(
            consensus_df[["Model", "Prediction", "Malignancy Score", "Test Recall", "Test F1-score", "Test ROC-AUC"]],
            use_container_width=True,
            hide_index=True,
        )

    with col_consensus:
        st.markdown("#### Patient Cytological Profile vs. Clinical Class Medians")
        benign_medians = train_part[train_part["class"] == 0][FEATURE_COLS].median()
        malignant_medians = train_part[train_part["class"] == 1][FEATURE_COLS].median()
        patient_vals = X_input.iloc[0].fillna(1.0)

        fig, ax = plt.subplots(figsize=(8.5, 4.8))
        y_pos = np.arange(len(FEATURE_COLS))
        labels_clean = [FEATURE_INFO[c][0] for c in FEATURE_COLS]

        ax.barh(y_pos - 0.22, benign_medians.values, height=0.22, color="#2b7bba", alpha=0.75, label="Benign Train Median")
        ax.barh(y_pos, malignant_medians.values, height=0.22, color="#d9534f", alpha=0.75, label="Malignant Train Median")
        ax.barh(y_pos + 0.22, patient_vals.values, height=0.24, color="#f1c40f", edgecolor="#2c3e50", label="Current Patient Sample")

        ax.set_yticks(y_pos, labels_clean, fontsize=9.5)
        ax.set_xlim(0, 10.8)
        ax.set_xticks(range(1, 11))
        ax.set_xlabel("Cytological Score (1 = Normal, 10 = Most Abnormal)")
        ax.set_title("Patient Feature Profile Compared to Benign & Malignant Reference Medians", fontweight="bold", fontsize=11)
        ax.legend(loc="lower right", frameon=True, fontsize=8.5)
        ax.grid(axis="x", linestyle="--", alpha=0.5)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

# ==================== TAB 2: TASK 5 EVALUATION ====================
with tab_eval:
    st.markdown("### Held-Out Test Set Evaluation (`n = 139`: `48` Malignant, `91` Benign, `0` Shared Patient IDs)")
    c1, c2, c3, c4 = st.columns(4)
    c1.markdown('<div class="kpi-mini"><div style="font-size:0.8rem;opacity:0.75;">Best Overall Model</div><div style="font-size:1.3rem;font-weight:800;color:#c084fc;">ANN (MLP)</div><div style="font-size:0.78rem;color:#34d399;">Rank #1 (Recall → F1 → AUC)</div></div>', unsafe_allow_html=True)
    c2.markdown('<div class="kpi-mini"><div style="font-size:0.8rem;opacity:0.75;">Test Sensitivity (Recall)</div><div style="font-size:1.3rem;font-weight:800;color:#34d399;">100.00% (48/48)</div><div style="font-size:0.78rem;">0 Missed Cancers (FN = 0)</div></div>', unsafe_allow_html=True)
    c3.markdown('<div class="kpi-mini"><div style="font-size:0.8rem;opacity:0.75;">ANN Test F1-Score</div><div style="font-size:1.3rem;font-weight:800;color:#60a5fa;">0.9796</div><div style="font-size:0.78rem;">Precision = 96.00% (FP = 2)</div></div>', unsafe_allow_html=True)
    c4.markdown('<div class="kpi-mini"><div style="font-size:0.8rem;opacity:0.75;">ANN & SVM ROC-AUC</div><div style="font-size:1.3rem;font-weight:800;color:#fbbf24;">0.9998</div><div style="font-size:0.78rem;">Accuracy = 98.56% (137/139)</div></div>', unsafe_allow_html=True)

    st.markdown("#### Unified Test-Set Comparison Table (`models/test_results_summary.csv`)")
    ranked_test = test_summary_df.sort_values(["Recall", "F1-score", "ROC-AUC"], ascending=False).reset_index(drop=True)
    ranked_test.insert(0, "Rank", range(1, len(ranked_test) + 1))
    st.dataframe(ranked_test, use_container_width=True, hide_index=True)

    st.markdown("#### Confusion Matrices Across All Five Models (Figure 5.1)")
    fig51_path = os.path.join(FIGURES_DIR, "fig_5_1_confusion_matrices.png")
    if os.path.exists(fig51_path):
        st.image(fig51_path, use_container_width=True)

    st.markdown("#### ROC Curves & Multi-Metric Bar Comparison (Figure 5.2)")
    fig52_path = os.path.join(FIGURES_DIR, "fig_5_2_roc_and_metrics.png")
    if os.path.exists(fig52_path):
        st.image(fig52_path, use_container_width=True)

# ==================== TAB 3: TASK 4 CV & TUNING ====================
with tab_cv:
    st.markdown("### 5-Fold StratifiedGroupKFold Cross-Validation Summary (`n = 552` Training Set)")
    st.dataframe(cv_summary_df.round(4), use_container_width=True, hide_index=True)

    col_f46, col_f43 = st.columns([1.3, 1.0])
    with col_f46:
        st.markdown("#### Cross-Validated Performance Comparison (Figure 4.6)")
        p46 = os.path.join(FIGURES_DIR, "fig_4_6_cv_comparison.png")
        if os.path.exists(p46):
            st.image(p46, use_container_width=True)
    with col_f43:
        st.markdown("#### Random Forest Feature Importance (Figure 4.3)")
        p43 = os.path.join(FIGURES_DIR, "fig_4_3_rf_feature_importance.png")
        if os.path.exists(p43):
            st.image(p43, use_container_width=True)

    st.markdown("#### Inspect Individual Model Hyperparameter Tuning Curves")
    tuning_figs = {
        "KNN Tuning (Figure 4.1)": "fig_4_1_knn_tuning.png",
        "Decision Tree Tuning (Figure 4.2)": "fig_4_2_dt_tuning.png",
        "ANN (MLP) Tuning & Loss Curve (Figure 4.4)": "fig_4_4_ann_tuning.png",
        "SVM Kernel & C × gamma Tuning (Figure 4.5)": "fig_4_5_svm_tuning.png",
    }
    sel_tune_fig = st.selectbox("Select Model Tuning Visualization", list(tuning_figs.keys()))
    tune_path = os.path.join(FIGURES_DIR, tuning_figs[sel_tune_fig])
    if os.path.exists(tune_path):
        st.image(tune_path, use_container_width=True)

# ==================== TAB 4: TASKS 1-3 EDA ====================
with tab_eda:
    st.markdown("### Exploratory Data Analysis & Preprocessing Verification (Tasks 1–3)")
    eda_figs = {
        "Figure 3.2: Target Class Distribution (Raw n=699 vs. Cleaned n=691)": "fig_3_2_class_distribution.png",
        "Figure 3.5: Pearson Correlation Heatmap (n=691)": "fig_3_5_correlation_heatmap.png",
        "Figure 3.3: Stratified Feature Histograms (Scale 1–10)": "fig_3_3_feature_histograms.png",
        "Figure 3.4: Comparative Boxplots & Tukey IQR Outliers": "fig_3_4_feature_boxplots.png",
        "Figure 3.6: Before vs. After StandardScaler (Train n=552)": "fig_3_6_standardization_comparison.png",
        "Figure 3.1: Missing Value Analysis in Raw Dataset": "fig_3_1_missing_values.png",
    }
    sel_eda_fig = st.selectbox("Select EDA Visualization", list(eda_figs.keys()))
    eda_path = os.path.join(FIGURES_DIR, eda_figs[sel_eda_fig])
    if os.path.exists(eda_path):
        st.image(eda_path, use_container_width=True)

    st.markdown("#### Browse Partitioned Dataset (`data/train_test_split.csv`, `n = 691`)")
    part_filter = st.radio("Filter Partition", ["All (691)", "Train Only (552)", "Test Only (139)"], horizontal=True)
    if part_filter == "Train Only (552)":
        st.dataframe(train_part, use_container_width=True, height=300)
    elif part_filter == "Test Only (139)":
        st.dataframe(test_part, use_container_width=True, height=300)
    else:
        st.dataframe(split_df, use_container_width=True, height=300)
