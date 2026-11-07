import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  BrainCircuit,
  Sliders,
  Database,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Sparkles,
  Server,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Microscope,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpRight,
  Cpu,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { WBC_MODEL_BUNDLE } from './data/modelBundle';
import { FEATURE_META, MODEL_META, runLocalInference } from './utils/inferenceEngine';

const CLINICAL_PRESETS = [
  {
    id: 'benign-typical',
    name: 'Typical Benign Profile',
    tag: 'Low Risk (Class 0)',
    color: 'emerald',
    features: {
      clump_thickness: 2,
      uniformity_of_cell_size: 1,
      uniformity_of_cell_shape: 1,
      marginal_adhesion: 1,
      single_epithelial_cell_size: 2,
      bare_nuclei: 1,
      bland_chromatin: 2,
      normal_nucleoli: 1,
      mitoses: 1,
    },
  },
  {
    id: 'malignant-typical',
    name: 'High-Grade Carcinoma',
    tag: 'High Risk (Class 1)',
    color: 'rose',
    features: {
      clump_thickness: 8,
      uniformity_of_cell_size: 8,
      uniformity_of_cell_shape: 8,
      marginal_adhesion: 6,
      single_epithelial_cell_size: 6,
      bare_nuclei: 10,
      bland_chromatin: 7,
      normal_nucleoli: 7,
      mitoses: 4,
    },
  },
  {
    id: 'borderline-atypia',
    name: 'Borderline Ductal Atypia',
    tag: 'Intermediate Case',
    color: 'amber',
    features: {
      clump_thickness: 5,
      uniformity_of_cell_size: 3,
      uniformity_of_cell_shape: 3,
      marginal_adhesion: 3,
      single_epithelial_cell_size: 3,
      bare_nuclei: 5,
      bland_chromatin: 4,
      normal_nucleoli: 3,
      mitoses: 1,
    },
  },
  {
    id: 'missing-bare-nuclei',
    name: 'Missing Bare Nuclei (?)',
    tag: 'Imputer Test',
    color: 'blue',
    features: {
      clump_thickness: 6,
      uniformity_of_cell_size: 4,
      uniformity_of_cell_shape: 4,
      marginal_adhesion: 2,
      single_epithelial_cell_size: 3,
      bare_nuclei: null,
      bland_chromatin: 4,
      normal_nucleoli: 2,
      mitoses: 1,
    },
  },
];

const GALLERY_FIGURES = [
  {
    id: 'fig_3_1',
    title: 'Fig 3.1 — Missing Values Audit (Bare Nuclei "?" Pattern Across N=699)',
    category: 'Data Quality & Scaling',
    src: '/figures/fig_3_1_missing_values.png',
    desc: 'Analysis of the 16 missing Bare Nuclei entries and leak-free median imputation justification.',
  },
  {
    id: 'fig_3_2',
    title: 'Fig 3.2 — Target Diagnosis Distribution (Benign 65.5% vs Malignant 34.5%)',
    category: 'EDA & Distributions',
    src: '/figures/fig_3_2_class_distribution.png',
    desc: 'Deduplicated N=691 cohort balance showing 453 Benign (65.56%) vs 238 Malignant (34.44%).',
  },
  {
    id: 'fig_3_3',
    title: 'Fig 3.3 — Cytological Feature Histograms + KDE by Diagnosis',
    category: 'EDA & Distributions',
    src: '/figures/fig_3_3_feature_histograms.png',
    desc: 'Class-conditional probability densities showing Benign concentration at 1–2 vs Malignant dispersion.',
  },
  {
    id: 'fig_3_4',
    title: 'Fig 3.4 — Stratified Boxplots Across All 9 Cytological Features',
    category: 'EDA & Distributions',
    src: '/figures/fig_3_4_feature_boxplots.png',
    desc: 'Interquartile ranges, medians, and outlier profiles between Benign and Malignant cytology.',
  },
  {
    id: 'fig_3_5',
    title: 'Fig 3.5 — Pearson Correlation Matrix Heatmap',
    category: 'Correlation & Multivariate',
    src: '/figures/fig_3_5_correlation_heatmap.png',
    desc: 'Highlights r = 0.91 collinearity between Uniformity of Cell Size and Cell Shape.',
  },
  {
    id: 'fig_3_6',
    title: 'Fig 3.6 — StandardScaler Z-Score Transformation Verification',
    category: 'Data Quality & Scaling',
    src: '/figures/fig_3_6_standardization_comparison.png',
    desc: 'Before vs After standardization on the 552 training samples (zero mean, unit variance).',
  },
  {
    id: 'fig_4_1',
    title: 'Fig 4.1 — KNN Hyperparameter Tuning Surface (k × Distance × Weights)',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_1_knn_tuning.png',
    desc: '5-fold stratified CV recall curve identifying optimal k=9 with distance weighting.',
  },
  {
    id: 'fig_4_2',
    title: 'Fig 4.2 — Decision Tree Depth & Criterion Pruning Analysis',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_2_dt_tuning.png',
    desc: 'Entropy vs Gini performance across tree depths to prevent overfitting.',
  },
  {
    id: 'fig_4_3',
    title: 'Fig 4.3 — Random Forest Gini Feature Importance Ranking',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_3_rf_feature_importance.png',
    desc: 'Gini importance ranking across 200 estimators (max_depth=5).',
  },
  {
    id: 'fig_4_4',
    title: 'Fig 4.4 — ANN (MLP) Architecture & Regularization Tuning',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_4_ann_tuning.png',
    desc: 'Hidden layer topology and L2 regularization alpha optimization.',
  },
  {
    id: 'fig_4_5',
    title: 'Fig 4.5 — SVM C × Gamma Regularization Heatmap',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_5_svm_tuning.png',
    desc: 'RBF vs Linear kernel decision boundary optimization.',
  },
  {
    id: 'fig_4_6',
    title: 'Fig 4.6 — 5-Fold Cross-Validation Model Comparison (Task 4)',
    category: 'Hyperparameter Tuning',
    src: '/figures/fig_4_6_cv_comparison.png',
    desc: 'Stratified 5-fold CV Recall, F1, Accuracy, and ROC-AUC across all 5 tuned pipelines.',
  },
  {
    id: 'fig_5_1',
    title: 'Fig 5.1 — Held-Out Test Set Confusion Matrices (All 5 Models)',
    category: 'Test Evaluation',
    src: '/figures/fig_5_1_confusion_matrices.png',
    desc: 'ANN (MLP) achieves only 1 False Negative out of 48 Malignant test cases (97.92% Recall).',
  },
  {
    id: 'fig_5_2',
    title: 'Fig 5.2 — Multi-Model ROC Curves & Final Metric Comparison',
    category: 'Test Evaluation',
    src: '/figures/fig_5_2_roc_and_metrics.png',
    desc: 'ROC-AUC comparison (RF 0.9963, ANN/SVM 0.9950) on the 139 held-out test records.',
  },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('simulator');
  const [selectedModel, setSelectedModel] = useState('ANN (MLP)');
  const [features, setFeatures] = useState(CLINICAL_PRESETS[0].features);
  const [bareNucleiMissing, setBareNucleiMissing] = useState(false);

  // Backend status & prediction state
  const [backendOnline, setBackendOnline] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [inferenceData, setInferenceData] = useState(() =>
    runLocalInference(CLINICAL_PRESETS[0].features, 'ANN (MLP)')
  );

  // Patient Explorer Table state
  const [patientFilter, setPatientFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const rowsPerPage = 15;

  // Gallery Filter State
  const [galleryCategory, setGalleryCategory] = useState('ALL');

  // Toggle HTML dark class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Check FastAPI health on mount
  useEffect(() => {
    axios
      .get('/api/health', { timeout: 2000 })
      .then((res) => {
        if (res.data && res.data.status === 'online') {
          setBackendOnline(true);
        }
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  // Run inference whenever features, bareNucleiMissing, or selectedModel change
  useEffect(() => {
    const payloadFeatures = {
      ...features,
      bare_nuclei: bareNucleiMissing ? null : features.bare_nuclei ?? 1,
    };

    // Instant zero-latency update via verified local mathematical engine
    const localResult = runLocalInference(payloadFeatures, selectedModel);
    setInferenceData(localResult);

    // If FastAPI backend is reachable, synchronize with live Python pipeline
    let cancelled = false;
    setIsPredicting(true);
    axios
      .post(
        '/api/predict',
        {
          ...payloadFeatures,
          selected_model: selectedModel,
        },
        { timeout: 2500 }
      )
      .then((res) => {
        if (!cancelled && res.data && res.data.primary_result) {
          setInferenceData(res.data);
          setBackendOnline(true);
        }
      })
      .catch(() => {
        // Silently keep the verified exact local pipeline result
      })
      .finally(() => {
        if (!cancelled) setIsPredicting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [features, bareNucleiMissing, selectedModel]);

  const handleFeatureChange = (key, val) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  const applyPreset = (preset) => {
    if (preset.features.bare_nuclei === null) {
      setBareNucleiMissing(true);
      setFeatures({ ...preset.features, bare_nuclei: 1 });
    } else {
      setBareNucleiMissing(false);
      setFeatures({ ...preset.features });
    }
  };

  const loadPatientIntoSimulator = (patient) => {
    const mapped = {};
    WBC_MODEL_BUNDLE.features.forEach((col, i) => {
      mapped[col] = patient.features[i] === null ? 1 : patient.features[i];
    });
    setBareNucleiMissing(patient.has_missing_bare_nuclei);
    setFeatures(mapped);
    setActiveTab('simulator');
  };

  // Filtered patients for Explorer table
  const filteredPatients = useMemo(() => {
    return WBC_MODEL_BUNDLE.sample_test_cases.filter((p) => {
      if (patientFilter === 'MALIGNANT' && p.true_class !== 1) return false;
      if (patientFilter === 'BENIGN' && p.true_class !== 0) return false;
      if (patientFilter === 'DISCORDANT' && p.true_class === p.ann_pred) return false;
      if (patientFilter === 'MISSING_BN' && !p.has_missing_bare_nuclei) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return p.case_id.toLowerCase().includes(q) || String(p.id).includes(q);
      }
      return true;
    });
  }, [patientFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPatients.slice(start, start + rowsPerPage);
  }, [filteredPatients, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [patientFilter, searchQuery]);

  // ECharts Common Theme Config
  const chartTextColor = darkMode ? '#a1a1aa' : '#52525b';
  const chartGridBorder = darkMode ? '#27272a' : '#e4e4e7';
  const tooltipStyle = {
    backgroundColor: darkMode ? 'rgba(12, 12, 15, 0.96)' : 'rgba(255, 255, 255, 0.96)',
    borderColor: darkMode ? '#27272a' : '#e2e8f0',
    textStyle: { color: darkMode ? '#f4f4f5' : '#0f172a', fontFamily: 'DM Sans, sans-serif' },
  };

  // EChart 1: Cytological Radar & Profile Comparison
  const radarOption = useMemo(() => {
    const patientVals = inferenceData.preprocessing.map((p) => p.imputed);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', ...tooltipStyle },
      legend: {
        bottom: 0,
        textStyle: { color: chartTextColor, fontFamily: 'DM Sans, sans-serif', fontSize: 12 },
        data: ['Current Patient', 'Benign Training Mean', 'Malignant Training Mean'],
      },
      radar: {
        radius: '66%',
        center: ['50%', '46%'],
        indicator: FEATURE_META.map((f) => ({ name: f.short, max: 10 })),
        splitNumber: 5,
        axisName: {
          color: darkMode ? '#e4e4e7' : '#18181b',
          fontSize: 11,
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600,
        },
        splitLine: { lineStyle: { color: chartGridBorder } },
        splitArea: {
          areaStyle: {
            color: darkMode
              ? ['rgba(24,24,27,0.4)', 'rgba(9,9,11,0.4)']
              : ['rgba(244,244,245,0.6)', 'rgba(255,255,255,0.6)'],
          },
        },
        axisLine: { lineStyle: { color: chartGridBorder } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: patientVals,
              name: 'Current Patient',
              symbolSize: 6,
              lineStyle: { width: 2.5, color: '#3b82f6' },
              itemStyle: { color: '#3b82f6' },
              areaStyle: { color: 'rgba(59, 130, 246, 0.25)' },
            },
            {
              value: WBC_MODEL_BUNDLE.benign_means,
              name: 'Benign Training Mean',
              symbolSize: 4,
              lineStyle: { width: 1.8, type: 'dashed', color: '#10b981' },
              itemStyle: { color: '#10b981' },
              areaStyle: { color: 'rgba(16, 185, 129, 0.08)' },
            },
            {
              value: WBC_MODEL_BUNDLE.malignant_means,
              name: 'Malignant Training Mean',
              symbolSize: 4,
              lineStyle: { width: 1.8, type: 'dotted', color: '#ef4444' },
              itemStyle: { color: '#ef4444' },
              areaStyle: { color: 'rgba(239, 68, 68, 0.08)' },
            },
          ],
        },
      ],
    };
  }, [inferenceData, darkMode]);

  // EChart 2: Standardized Z-Score Horizontal Bar Chart
  const zScoreBarOption = useMemo(() => {
    const items = [...inferenceData.preprocessing].reverse();
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        ...tooltipStyle,
      },
      grid: { left: 135, right: 32, top: 20, bottom: 32 },
      xAxis: {
        type: 'value',
        min: -1.5,
        max: 3.5,
        name: 'Standardized Z-Score (σ)',
        nameLocation: 'middle',
        nameGap: 22,
        axisLabel: { color: chartTextColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
        splitLine: { lineStyle: { color: chartGridBorder, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: items.map((d) => d.label),
        axisLabel: { color: darkMode ? '#e4e4e7' : '#27272a', fontSize: 11, fontWeight: 500 },
        axisLine: { lineStyle: { color: chartGridBorder } },
      },
      series: [
        {
          name: 'Z-Score',
          type: 'bar',
          barWidth: 16,
          data: items.map((d) => ({
            value: d.z_score,
            itemStyle: {
              color: d.z_score > 0.35 ? '#ef4444' : d.z_score > -0.15 ? '#f59e0b' : '#10b981',
              borderRadius: d.z_score >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          })),
        },
      ],
    };
  }, [inferenceData, darkMode]);

  // EChart 3: Model Performance Grouped Bar Chart (Task 5 Test Set)
  const benchmarkChartOption = useMemo(() => {
    const models = WBC_MODEL_BUNDLE.test_results.map((r) => r.Model);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle },
      legend: {
        top: 0,
        textStyle: { color: chartTextColor, fontFamily: 'DM Sans, sans-serif' },
        data: ['Test Recall (Sensitivity)', 'Test F1-Score', 'Test Accuracy', 'Test ROC-AUC'],
      },
      grid: { left: 55, right: 25, top: 42, bottom: 35 },
      xAxis: {
        type: 'category',
        data: models,
        axisLabel: { color: darkMode ? '#f4f4f5' : '#18181b', fontWeight: 600, fontSize: 12 },
        axisLine: { lineStyle: { color: chartGridBorder } },
      },
      yAxis: {
        type: 'value',
        min: 0.88,
        max: 1.0,
        axisLabel: {
          color: chartTextColor,
          fontFamily: 'JetBrains Mono, monospace',
          formatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
        splitLine: { lineStyle: { color: chartGridBorder, type: 'dashed' } },
      },
      series: [
        {
          name: 'Test Recall (Sensitivity)',
          type: 'bar',
          data: WBC_MODEL_BUNDLE.test_results.map((r) => r['Test Recall']),
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Test F1-Score',
          type: 'bar',
          data: WBC_MODEL_BUNDLE.test_results.map((r) => r['Test F1']),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Test Accuracy',
          type: 'bar',
          data: WBC_MODEL_BUNDLE.test_results.map((r) => r['Test Accuracy']),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Test ROC-AUC',
          type: 'bar',
          data: WBC_MODEL_BUNDLE.test_results.map((r) => r['Test ROC-AUC']),
          itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [darkMode]);

  // EChart 4: Random Forest Feature Importance + Correlation
  const featureImportanceOption = useMemo(() => {
    const pairs = FEATURE_META.map((f, idx) => ({
      label: f.label,
      imp: Number((WBC_MODEL_BUNDLE.rf.importances[idx] * 100).toFixed(2)),
    })).sort((a, b) => a.imp - b.imp);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        ...tooltipStyle,
        formatter: (params) => `${params[0].name}: <b>${params[0].value}%</b> Gini Importance`,
      },
      grid: { left: 155, right: 35, top: 20, bottom: 30 },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: chartTextColor,
          fontFamily: 'JetBrains Mono, monospace',
          formatter: '{value}%',
        },
        splitLine: { lineStyle: { color: chartGridBorder, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: pairs.map((p) => p.label),
        axisLabel: { color: darkMode ? '#e4e4e7' : '#18181b', fontSize: 12, fontWeight: 500 },
        axisLine: { lineStyle: { color: chartGridBorder } },
      },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          data: pairs.map((p, i) => ({
            value: p.imp,
            itemStyle: {
              color: i >= 6 ? '#3b82f6' : i >= 3 ? '#06b6d4' : '#6366f1',
              borderRadius: [0, 4, 4, 0],
            },
          })),
        },
      ],
    };
  }, [darkMode]);

  const primaryRes = inferenceData.primary_result;
  const isMalignant = primaryRes.prediction === 1;
  const probPct = (primaryRes.probability * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 transition-colors duration-200">
      {/* Top Clinical Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0c0c0f]/90 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                  OncoVision <span className="text-blue-600 dark:text-blue-400">Clinical AI</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  WBC N=691 • 5 Pipelines
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wisconsin Breast Cancer Cytological Triage & Multi-Model Decision Support System
              </p>
            </div>
          </div>

          {/* Right Controls: FastAPI Engine Status + Model Selector + Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                backendOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-blue-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
              title={
                backendOnline
                  ? 'Connected to live FastAPI /api/predict server'
                  : 'Running exact exported scikit-learn weights in browser (zero latency)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                }`}
              />
              <span>{backendOnline ? 'FastAPI Backend: Live' : 'Engine: Scikit-Learn Bundle'}</span>
              {isPredicting && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm"
              aria-label="Toggle theme"
              title="Switch Light / Dark Clinical Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          </div>
        </div>

        {/* Navigation Underline Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-6 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800/60">
          {[
            { id: 'simulator', label: 'Live Diagnostic Simulator', icon: Sliders },
            { id: 'benchmarks', label: 'Model Evaluation & ROC Benchmarks', icon: BarChart3 },
            { id: 'patients', label: 'Held-Out Patient Cohort (N=139)', icon: Database },
            { id: 'gallery', label: 'Research Figures & Tuning Atlas (14)', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#3b82f6] text-[#2563eb] dark:text-[#60a5fa]'
                    : 'border-transparent text-zinc-500 hover:text-[#334155] dark:hover:text-[#e2e8f0] hover:border-[#3b82f6]/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Top 4 KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Primary Model Sensitivity
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" /> 47/48 Detected
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                97.92%
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Test Recall (ANN)</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Only 1 False Negative across 139 held-out test patients
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Ensemble ROC-AUC Peak
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" /> Random Forest
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                0.9963
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">AUC Score</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              ANN & SVM closely follow at 0.9950 ROC-AUC
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Curated Clinical Cohort
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                80/20 Stratified
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                691
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Deduplicated Cases</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              552 Training • 139 Test • 16 Imputed Bare Nuclei
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Live Multi-Model Consensus
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  inferenceData.consensus.consensus_diagnosis === 'Malignant'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}
              >
                {inferenceData.consensus.consensus_diagnosis}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                {inferenceData.consensus.malignant_votes}/5
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Malignant Votes</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {(inferenceData.consensus.agreement_ratio * 100).toFixed(0)}% inter-model agreement on current sample
            </p>
          </div>
        </section>

        {/* ===================================================================
            TAB 1: LIVE DIAGNOSTIC SIMULATOR
        =================================================================== */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT COLUMN: 9 Cytological Sliders + Clinical Presets */}
            <div className="xl:col-span-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-500" />
                    FNA Cytology Input Panel
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Adjust the 9 ordinal microscopic characteristics (scale 1–10)
                  </p>
                </div>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">
                  9 Features
                </span>
              </div>

              {/* Clinical Presets Bar */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Quick Clinical Reference Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CLINICAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className="text-left p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 bg-zinc-50/60 dark:bg-zinc-900/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
                          {preset.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        {preset.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 9 Sliders */}
              <div className="space-y-4">
                {FEATURE_META.map((f) => {
                  const isBN = f.key === 'bare_nuclei';
                  const rawVal = features[f.key] ?? 1;
                  const prepItem = inferenceData.preprocessing.find((p) => p.feature === f.key);
                  const zVal = prepItem ? prepItem.z_score : 0;

                  return (
                    <div
                      key={f.key}
                      className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {f.label}
                          </span>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            z={zVal >= 0 ? `+${zVal.toFixed(2)}` : zVal.toFixed(2)}
                          </span>
                          <span
                            className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded ${
                              isBN && bareNucleiMissing
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : rawVal >= 6
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : rawVal >= 4
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {isBN && bareNucleiMissing ? '? → 1.0' : rawVal}
                          </span>
                        </div>
                      </div>

                      {isBN && (
                        <div className="mb-2 flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bareNucleiMissing}
                              onChange={(e) => setBareNucleiMissing(e.target.checked)}
                              className="rounded accent-blue-500"
                            />
                            <span>Simulate missing value ("?") → SimpleImputer(median = 1.0)</span>
                          </label>
                        </div>
                      )}

                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        disabled={isBN && bareNucleiMissing}
                        value={rawVal}
                        onChange={(e) => handleFeatureChange(f.key, e.target.value)}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                        <span>1 (Normal)</span>
                        <span>5 (Atypical)</span>
                        <span>10 (Extreme)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Diagnosis Banner + 5-Model Consensus + Charts */}
            <div className="xl:col-span-7 space-y-6">
              {/* Primary Diagnostic Alert Banner */}
              <div
                className={`rounded-xl p-6 border transition-all shadow-sm ${
                  isMalignant
                    ? 'bg-rose-50/90 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/60'
                    : 'bg-emerald-50/90 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3.5 rounded-xl ${
                        isMalignant
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                          : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30'
                      }`}
                    >
                      {isMalignant ? (
                        <ShieldAlert className="w-8 h-8" />
                      ) : (
                        <ShieldCheck className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-semibold">
                          Primary Classifier: {selectedModel}
                        </span>
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                          {primaryRes.badge}
                        </span>
                      </div>
                      <h2
                        className={`text-3xl font-extrabold tracking-tight mt-1 ${
                          isMalignant
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isMalignant
                          ? 'MALIGNANT CYTOLOGY (Class 1)'
                          : 'BENIGN CYTOLOGY (Class 0)'}
                      </h2>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                        {isMalignant
                          ? 'High-priority pathology alert: Cytological profile exceeds malignancy threshold. Immediate histopathological biopsy confirmation recommended.'
                          : 'Low-risk cytological profile consistent with benign proliferation. Standard clinical follow-up recommended.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center bg-white/80 dark:bg-[#0c0c0f]/80 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 min-w-[185px]">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Malignancy Probability
                    </span>
                    <span
                      className={`text-3xl font-extrabold font-mono mt-0.5 ${
                        isMalignant ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      {probPct}%
                    </span>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isMalignant ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, primaryRes.probability * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-Model Live Ensemble Voting Cards (Click to select Primary Model) */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-500" />
                      Multi-Model Ensemble Consensus (All 5 Trained Pipelines)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Click any classifier card below to switch the active primary diagnostic model
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    Consensus: {inferenceData.consensus.malignant_votes} Malignant /{' '}
                    {inferenceData.consensus.benign_votes} Benign
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {Object.values(inferenceData.models).map((m) => {
                    const isSelected = selectedModel === m.model;
                    const mal = m.prediction === 1;
                    const pScore = (m.probability * 100).toFixed(1);
                    return (
                      <button
                        key={m.model}
                        onClick={() => setSelectedModel(m.model)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
                            {m.model}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              mal ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <div
                          className={`mt-2 text-sm font-extrabold font-mono ${
                            mal
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {m.diagnosis}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span>P(M):</span>
                          <span>{pScore}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-sm mt-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              m.probability >= 0.5
                                ? 'bg-rose-500'
                                : m.probability >= 0.25
                                ? 'bg-orange-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, m.probability * 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart 1 (1 Chart Per Row): Cytological Radar Profile */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      Cytological Biomarker Fingerprint vs Cohort Means
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Compares the current patient&apos;s 9 features against Benign (N=363) and Malignant (N=189) training centroids
                    </p>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
                    Apache ECharts Radar
                  </span>
                </div>
                <ReactECharts option={radarOption} style={{ height: '360px', width: '100%' }} />
              </div>

              {/* Chart 2 (1 Chart Per Row): Standardized Z-Score Pipeline Inspector */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      Leak-Free Preprocessing Pipeline Inspector (SimpleImputer → StandardScaler)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Exact Z-score transformation z = (x − μ_train) / σ_train fed into the classifier
                    </p>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
                    Z-Score (σ)
                  </span>
                </div>
                <ReactECharts option={zScoreBarOption} style={{ height: '320px', width: '100%' }} />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: MODEL EVALUATION & ROC BENCHMARKS
        =================================================================== */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            {/* 1 Chart Per Row: Held-Out Test Set Grouped Metrics */}
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                    Task 5 Held-Out Test Set Performance Across All 5 Classifiers (N = 139)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Stratified test evaluation (91 Benign, 48 Malignant) — optimizing Recall (Sensitivity) to minimize missed carcinomas
                  </p>
                </div>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded">
                  Primary Metric: Recall
                </span>
              </div>
              <ReactECharts option={benchmarkChartOption} style={{ height: '380px', width: '100%' }} />
            </div>

            {/* 1 Chart Per Row: Random Forest Feature Importance */}
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                    Random Forest Gini Feature Importance Ranking (200 Trees, Max Depth = 5)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Uniformity of Cell Size, Uniformity of Cell Shape, and Bare Nuclei account for over 60% of split information
                  </p>
                </div>
              </div>
              <ReactECharts option={featureImportanceOption} style={{ height: '340px', width: '100%' }} />
            </div>

            {/* Interactive Confusion Matrices + CV vs Test Comparison Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Confusion Matrices for all 5 models */}
              <div className="lg:col-span-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      Interactive Confusion Matrix Inspector
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Held-out test set (91 Benign, 48 Malignant)
                    </p>
                  </div>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {Object.keys(MODEL_META).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const cm = MODEL_META[selectedModel].cm;
                  return (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
                          True Negative (TN)
                        </span>
                        <div className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1">
                          {cm.tn}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Correctly Predicted Benign
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <span className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 font-semibold">
                          False Positive (FP)
                        </span>
                        <div className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1">
                          {cm.fp}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Benign Flagged for Biopsy
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-rose-500/15 border-2 border-rose-500/50">
                        <span className="text-xs font-mono uppercase text-rose-600 dark:text-rose-400 font-bold">
                          False Negative (FN) • Critical
                        </span>
                        <div className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
                          {cm.fn}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Missed Malignant Tumours
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <span className="text-xs font-mono uppercase text-blue-600 dark:text-blue-400 font-semibold">
                          True Positive (TP)
                        </span>
                        <div className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1">
                          {cm.tp}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Correctly Detected Cancer
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Full Benchmark Table */}
              <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                    Task 4 (5-Fold CV) vs Task 5 (Held-Out Test) Complete Benchmark Table
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    All pipelines wrapped in leak-free Pipeline([SimpleImputer(median), StandardScaler(), Classifier])
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-mono">
                      <tr>
                        <th className="py-3 px-4">Model</th>
                        <th className="py-3 px-4">Test Recall</th>
                        <th className="py-3 px-4">Test F1</th>
                        <th className="py-3 px-4">Test Precision</th>
                        <th className="py-3 px-4">Test ROC-AUC</th>
                        <th className="py-3 px-4">FN / FP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WBC_MODEL_BUNDLE.test_results.map((r) => {
                        const meta = MODEL_META[r.Model];
                        return (
                          <tr
                            key={r.Model}
                            onClick={() => setSelectedModel(r.Model)}
                            className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                              selectedModel === r.Model
                                ? 'bg-blue-50 dark:bg-blue-900/40'
                                : 'text-zinc-900 dark:text-zinc-200'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-bold">{r.Model}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {(r['Test Recall'] * 100).toFixed(2)}%
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {(r['Test F1'] * 100).toFixed(2)}%
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {(r['Test Precision'] * 100).toFixed(2)}%
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {r['Test ROC-AUC'].toFixed(4)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              <span className="text-rose-500 font-bold">{meta.cm.fn} FN</span> /{' '}
                              <span>{meta.cm.fp} FP</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: HELD-OUT PATIENT COHORT EXPLORER (Split Table + Investigation Panel)
        =================================================================== */}
        {activeTab === 'patients' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Primary Data Table (shrinks to w-2/3 when a patient row is selected) */}
            <div
              className={`w-full ${
                selectedPatient ? 'lg:w-2/3' : 'lg:w-full'
              } transition-all duration-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] overflow-hidden shadow-sm`}
            >
              {/* Table Toolbar */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                    Held-Out Test Cohort Explorer (N = 139 Patients)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Click any patient record to inspect cytology or load into the live simulator
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Sample ID..."
                      className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  {/* Filter Segmented Control */}
                  <div className="flex items-center bg-zinc-100 dark:bg-[#0c0c0f] p-1 rounded-[8px] text-xs font-medium">
                    {[
                      { id: 'ALL', label: 'All (139)' },
                      { id: 'MALIGNANT', label: 'Malignant (48)' },
                      { id: 'BENIGN', label: 'Benign (91)' },
                      { id: 'DISCORDANT', label: 'Errors (3)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setPatientFilter(f.id)}
                        className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                          patientFilter === f.id
                            ? 'bg-white dark:bg-zinc-800 text-[#2563eb] dark:text-[#60a5fa] shadow-sm font-semibold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Header Table */}
              <div className="overflow-x-auto max-h-[620px]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Sample ID</th>
                      <th className="py-3 px-4">Ground Truth</th>
                      <th className="py-3 px-4">ANN Prediction</th>
                      <th className="py-3 px-4 w-44">Malignancy Risk Score</th>
                      <th className="py-3 px-4">Ensemble Votes</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPatients.map((p) => {
                      const isSelected = selectedPatient && selectedPatient.row_index === p.row_index;
                      const scorePct = Math.round(p.ann_prob * 100);
                      const isCorrect = p.true_class === p.ann_pred;
                      return (
                        <tr
                          key={p.row_index}
                          onClick={() => setSelectedPatient(p)}
                          className={`border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                              : 'text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                            {p.row_index}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                              {p.case_id}
                            </span>
                            {p.has_missing_bare_nuclei && (
                              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                Imputed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span
                              className={
                                p.true_class === 1
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              {p.true_class === 1 ? 'Malignant' : 'Benign'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span
                              className={
                                p.ann_pred === 1
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              {p.ann_pred === 1 ? 'Malignant' : 'Benign'}
                            </span>
                          </td>
                          {/* Visual Sparkline Progress Bar per Skill Guidelines */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-zinc-700 rounded-sm overflow-hidden">
                                <div
                                  className={`h-full rounded-sm ${
                                    scorePct >= 60
                                      ? 'bg-rose-500'
                                      : scorePct >= 30
                                      ? 'bg-orange-400'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(4, scorePct)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{scorePct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {p.malignant_votes}/5 Mal.
                          </td>
                          <td className="py-3 px-4">
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-500">
                                <AlertTriangle className="w-3.5 h-3.5" /> Discordant
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Icon-Only Pagination Bar per Skill Guidelines */}
              <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  Showing {(currentPage - 1) * rowsPerPage + 1}–
                  {Math.min(currentPage * rowsPerPage, filteredPatients.length)} of{' '}
                  {filteredPatients.length} records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Investigation Side Panel (w-1/3 when a row is clicked) */}
            {selectedPatient && (
              <div className="w-full lg:w-1/3 transition-all duration-300 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                      {selectedPatient.case_id}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mt-1">
                      Patient Cytology Investigation
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                    aria-label="Close Investigation Panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                      Histopathology Truth
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        selectedPatient.true_class === 1 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedPatient.true_class === 1 ? 'Malignant (1)' : 'Benign (0)'}
                    </span>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                      ANN (MLP) Probability
                    </span>
                    <span className="text-sm font-bold font-mono text-blue-400">
                      {(selectedPatient.ann_prob * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 9 Feature Breakdown inside Side Panel */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Microscopic Feature Profile (1–10)
                  </span>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {FEATURE_META.map((f, idx) => {
                      const val = selectedPatient.features[idx];
                      return (
                        <div
                          key={f.key}
                          className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/70 rounded-md px-3 py-2 text-xs"
                        >
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {f.label}
                          </span>
                          <span className="font-mono font-bold text-zinc-950 dark:text-zinc-100">
                            {val === null ? '? (Imputed 1.0)' : val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => loadPatientIntoSimulator(selectedPatient)}
                    className="w-full bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-[16px] py-[10px] font-[600] transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Load Patient into Live Simulator
                  </button>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="w-full bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[16px] py-[8px] font-[500] transition-colors shadow-sm text-xs"
                  >
                    Dismiss Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 4: RESEARCH FIGURES & TUNING ATLAS (1 Chart Per Row Pattern)
        =================================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  Publication-Grade Research Figures & Hyperparameter Tuning Atlas
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  All 14 high-resolution visual artifacts generated from wisconsin_breast_cancer.ipynb (presented 1 per row for full clinical readability)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg text-xs">
                {[
                  'ALL',
                  'EDA & Distributions',
                  'Correlation & Multivariate',
                  'Data Quality & Scaling',
                  'Hyperparameter Tuning',
                  'Test Evaluation',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryCategory(cat)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      galleryCategory === cat
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Strict 1 Chart Per Row (grid-cols-1) per Skill Guidelines */}
            <div className="grid grid-cols-1 gap-6">
              {GALLERY_FIGURES.filter(
                (fig) => galleryCategory === 'ALL' || fig.category === galleryCategory
              ).map((fig) => (
                <div
                  key={fig.id}
                  className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">
                        {fig.category}
                      </span>
                      <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
                        {fig.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{fig.desc}</p>
                    </div>
                    <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded">
                      {fig.id}.png
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 flex justify-center">
                    <img
                      src={fig.src}
                      alt={fig.title}
                      loading="lazy"
                      className="max-h-[540px] w-auto object-contain rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-zinc-200 dark:border-zinc-800/80 mt-12 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-bold text-zinc-900 dark:text-zinc-200">
            OncoVision Clinical AI Platform
          </span>{' '}
          — Built with React 18, Vite, Tailwind CSS, Apache ECharts & FastAPI (Scikit-Learn 1.8.0)
        </div>
        <div className="font-mono">
          Wisconsin Breast Cancer Original (UCI ID 15) • Mayer Romany
        </div>
      </footer>
    </div>
  );
}

