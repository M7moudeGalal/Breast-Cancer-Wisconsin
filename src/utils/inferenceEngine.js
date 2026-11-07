import { WBC_MODEL_BUNDLE } from '../data/modelBundle';

export const FEATURE_META = [
  { key: 'clump_thickness', label: 'Clump Thickness', short: 'Clump Thick.', desc: 'Mono-layer vs multi-layer epithelial grouping (1–10)' },
  { key: 'uniformity_of_cell_size', label: 'Uniformity of Cell Size', short: 'Cell Size', desc: 'Anisocytosis / consistency of epithelial cell size (1–10)' },
  { key: 'uniformity_of_cell_shape', label: 'Uniformity of Cell Shape', short: 'Cell Shape', desc: 'Pleomorphism / regularity of cell contours (1–10)' },
  { key: 'marginal_adhesion', label: 'Marginal Adhesion', short: 'Marg. Adhesion', desc: 'Loss of cell-to-cell cohesion at periphery (1–10)' },
  { key: 'single_epithelial_cell_size', label: 'Single Epithelial Size', short: 'Epithelial Size', desc: 'Diameter of largest isolated epithelial cells (1–10)' },
  { key: 'bare_nuclei', label: 'Bare Nuclei', short: 'Bare Nuclei', desc: 'Nuclei stripped of cytoplasm (supports Median Imputation if missing)' },
  { key: 'bland_chromatin', label: 'Bland Chromatin', short: 'Chromatin', desc: 'Nuclear chromatin texture from fine/uniform to coarse (1–10)' },
  { key: 'normal_nucleoli', label: 'Normal Nucleoli', short: 'Nucleoli', desc: 'Prominence and multiplicity of nucleoli (1–10)' },
  { key: 'mitoses', label: 'Mitoses', short: 'Mitoses', desc: 'Mitotic figures rate per high-power field (1–10)' },
];

export const MODEL_META = {
  'ANN (MLP)': {
    badge: 'Best Recall & F1 (Primary)',
    architecture: 'MLPClassifier(hidden_layer_sizes=(50,), alpha=0.001)',
    testRecall: 0.9792,
    testF1: 0.9691,
    testAuc: 0.9950,
    testAcc: 0.9784,
    cm: { tn: 89, fp: 2, fn: 1, tp: 47 },
  },
  'Random Forest': {
    badge: 'Best ROC-AUC (0.9963)',
    architecture: 'RandomForestClassifier(n_estimators=200, max_depth=5)',
    testRecall: 0.9583,
    testF1: 0.9485,
    testAuc: 0.9963,
    testAcc: 0.9640,
    cm: { tn: 88, fp: 3, fn: 2, tp: 46 },
  },
  'SVM': {
    badge: 'RBF Kernel Margin',
    architecture: 'SVC(C=1.0, kernel="rbf", gamma=0.01)',
    testRecall: 0.9583,
    testF1: 0.9485,
    testAuc: 0.9950,
    testAcc: 0.9640,
    cm: { tn: 88, fp: 3, fn: 2, tp: 46 },
  },
  'KNN': {
    badge: 'Distance-Weighted k=9',
    architecture: 'KNeighborsClassifier(n_neighbors=9, p=2, weights="distance")',
    testRecall: 0.9583,
    testF1: 0.9485,
    testAuc: 0.9927,
    testAcc: 0.9640,
    cm: { tn: 88, fp: 3, fn: 2, tp: 46 },
  },
  'Decision Tree': {
    badge: 'Interpretable Rule Tree',
    architecture: 'DecisionTreeClassifier(criterion="entropy", max_depth=5)',
    testRecall: 0.9167,
    testF1: 0.9167,
    testAuc: 0.9752,
    testAcc: 0.9424,
    cm: { tn: 87, fp: 4, fn: 4, tp: 44 },
  },
};

function evalTree(tree, z) {
  let node = 0;
  while (tree.left[node] !== -1) {
    const f = tree.feature[node];
    if (z[f] <= tree.threshold[node]) {
      node = tree.left[node];
    } else {
      node = tree.right[node];
    }
  }
  return tree.prob1[node];
}

export function runLocalInference(featureValues, selectedModel = 'ANN (MLP)') {
  const b = WBC_MODEL_BUNDLE;
  const rawArr = b.features.map((col) => featureValues[col]);

  const imputedArr = rawArr.map((v, i) =>
    v === null || v === undefined || Number.isNaN(v) ? b.imputer_medians[i] : Number(v)
  );
  const zArr = imputedArr.map((v, i) => (v - b.scaler_mean[i]) / b.scaler_scale[i]);

  const preprocessing = b.features.map((col, i) => ({
    feature: col,
    label: FEATURE_META[i].label,
    raw: rawArr[i] === null || rawArr[i] === undefined ? null : Number(rawArr[i]),
    imputed: Number(imputedArr[i].toFixed(4)),
    z_score: Number(zArr[i].toFixed(4)),
    was_imputed: rawArr[i] === null || rawArr[i] === undefined,
  }));

  // 1. ANN (MLP)
  const hidden = b.ann.b1.map((bias, j) => {
    let sum = bias;
    for (let i = 0; i < 9; i++) {
      sum += zArr[i] * b.ann.W1[i][j];
    }
    return Math.max(0, sum);
  });
  let logit = b.ann.b2;
  for (let j = 0; j < hidden.length; j++) {
    logit += hidden[j] * b.ann.W2[j];
  }
  const annProb = 1 / (1 + Math.exp(-logit));
  const annPred = annProb >= 0.5 ? 1 : 0;

  // 2. Random Forest
  let rfSum = 0;
  for (const t of b.rf.trees) {
    rfSum += evalTree(t, zArr);
  }
  const rfProb = rfSum / b.rf.trees.length;
  const rfPred = rfProb >= 0.5 ? 1 : 0;

  // 3. SVM (RBF)
  let svmDecision = b.svm.intercept;
  for (let k = 0; k < b.svm.sv.length; k++) {
    let sqDist = 0;
    const sv = b.svm.sv[k];
    for (let i = 0; i < 9; i++) {
      const d = zArr[i] - sv[i];
      sqDist += d * d;
    }
    svmDecision += b.svm.dual_coef[k] * Math.exp(-b.svm.gamma * sqDist);
  }
  const svmPred = svmDecision > 0 ? 1 : 0;
  const svmProb = 1 / (1 + Math.exp(-svmDecision));

  // 4. KNN (distance-weighted k=9)
  const dists = b.knn.X.map((row, idx) => {
    let sq = 0;
    for (let i = 0; i < 9; i++) {
      const d = zArr[i] - row[i];
      sq += d * d;
    }
    return { dist: Math.sqrt(sq), y: b.knn.y[idx] };
  });
  dists.sort((a, bItem) => a.dist - bItem.dist);
  const topK = dists.slice(0, b.knn.k);
  const zeroDist = topK.filter((d) => d.dist === 0);
  let knnProb = 0;
  if (zeroDist.length > 0) {
    knnProb = zeroDist.reduce((acc, d) => acc + d.y, 0) / zeroDist.length;
  } else {
    let wSum = 0;
    let wySum = 0;
    for (const d of topK) {
      const w = 1 / d.dist;
      wSum += w;
      wySum += w * d.y;
    }
    knnProb = wySum / wSum;
  }
  const knnPred = knnProb >= 0.5 ? 1 : 0;

  // 5. Decision Tree
  const dtProb = evalTree(b.dt, zArr);
  const dtPred = dtProb >= 0.5 ? 1 : 0;

  const models = {
    'ANN (MLP)': {
      model: 'ANN (MLP)',
      prediction: annPred,
      diagnosis: annPred === 1 ? 'Malignant' : 'Benign',
      probability: Number(annProb.toFixed(6)),
      decision_margin: Number(logit.toFixed(6)),
      badge: MODEL_META['ANN (MLP)'].badge,
      architecture: MODEL_META['ANN (MLP)'].architecture,
    },
    'Random Forest': {
      model: 'Random Forest',
      prediction: rfPred,
      diagnosis: rfPred === 1 ? 'Malignant' : 'Benign',
      probability: Number(rfProb.toFixed(6)),
      decision_margin: null,
      badge: MODEL_META['Random Forest'].badge,
      architecture: MODEL_META['Random Forest'].architecture,
    },
    'SVM': {
      model: 'SVM',
      prediction: svmPred,
      diagnosis: svmPred === 1 ? 'Malignant' : 'Benign',
      probability: Number(svmProb.toFixed(6)),
      decision_margin: Number(svmDecision.toFixed(6)),
      badge: MODEL_META['SVM'].badge,
      architecture: MODEL_META['SVM'].architecture,
    },
    'KNN': {
      model: 'KNN',
      prediction: knnPred,
      diagnosis: knnPred === 1 ? 'Malignant' : 'Benign',
      probability: Number(knnProb.toFixed(6)),
      decision_margin: null,
      badge: MODEL_META['KNN'].badge,
      architecture: MODEL_META['KNN'].architecture,
    },
    'Decision Tree': {
      model: 'Decision Tree',
      prediction: dtPred,
      diagnosis: dtPred === 1 ? 'Malignant' : 'Benign',
      probability: Number(dtProb.toFixed(6)),
      decision_margin: null,
      badge: MODEL_META['Decision Tree'].badge,
      architecture: MODEL_META['Decision Tree'].architecture,
    },
  };

  const malignantVotes = annPred + rfPred + svmPred + knnPred + dtPred;
  const chosen = models[selectedModel] || models['ANN (MLP)'];

  return {
    engine: 'Exact Exported Scikit-Learn Pipeline',
    selected_model: selectedModel,
    primary_result: chosen,
    consensus: {
      malignant_votes: malignantVotes,
      benign_votes: 5 - malignantVotes,
      total_models: 5,
      consensus_diagnosis: malignantVotes >= 3 ? 'Malignant' : 'Benign',
      agreement_ratio: Number((Math.max(malignantVotes, 5 - malignantVotes) / 5).toFixed(2)),
    },
    models,
    preprocessing,
  };
}

