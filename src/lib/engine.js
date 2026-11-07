// In-browser replica of the 5 trained scikit-learn pipelines.
// Parameters are exported from models/*.joblib by the export script; verified
// against Python predictions on all 691 records.
import { BUNDLE } from '../data/modelBundle.js';

export const FEATURES = [
  { key: 'clump_thickness', label: 'Clump thickness', hint: 'Single layer (1) vs. multi-layer clumps (10)' },
  { key: 'uniformity_of_cell_size', label: 'Cell size uniformity', hint: 'How similar the cells are in size' },
  { key: 'uniformity_of_cell_shape', label: 'Cell shape uniformity', hint: 'How similar the cells are in shape' },
  { key: 'marginal_adhesion', label: 'Marginal adhesion', hint: 'Loss of adhesion between cells' },
  { key: 'single_epithelial_cell_size', label: 'Epithelial cell size', hint: 'Size of single epithelial cells' },
  { key: 'bare_nuclei', label: 'Bare nuclei', hint: 'Nuclei without surrounding cytoplasm' },
  { key: 'bland_chromatin', label: 'Bland chromatin', hint: 'Texture of the nucleus chromatin' },
  { key: 'normal_nucleoli', label: 'Normal nucleoli', hint: 'Visibility of nucleoli' },
  { key: 'mitoses', label: 'Mitoses', hint: 'Rate of cell division' },
];

export const MODEL_ORDER = ['ANN (MLP)', 'Random Forest', 'SVM', 'KNN', 'Decision Tree'];
export const PRIMARY = 'ANN (MLP)';

function preprocess(x, prep) {
  let v = x.map((val, i) => (val === null || val === undefined || Number.isNaN(val) ? prep.impute[i] : Number(val)));
  if (prep.scale) v = v.map((val, i) => (val - prep.scale.mean[i]) / prep.scale.std[i]);
  return v;
}

function walk(t, v) {
  let n = 0;
  while (t.l[n] !== -1) n = v[t.f[n]] <= t.t[n] ? t.l[n] : t.r[n];
  return t.p[n];
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

const RUNNERS = {
  'ANN (MLP)': (m, v) => {
    let z = m.b2;
    for (let j = 0; j < m.b1.length; j++) {
      let h = m.b1[j];
      for (let i = 0; i < v.length; i++) h += v[i] * m.W1[i][j];
      z += Math.max(0, h) * m.W2[j];
    }
    const p = sigmoid(z);
    return { pred: p >= 0.5 ? 1 : 0, score: p };
  },
  'Random Forest': (m, v) => {
    let s = 0;
    for (const t of m.trees) s += walk(t, v);
    const p = s / m.trees.length;
    return { pred: p > 0.5 ? 1 : 0, score: p };
  },
  SVM: (m, v) => {
    let d = m.b;
    for (let k = 0; k < m.sv.length; k++) {
      let sq = 0;
      const s = m.sv[k];
      for (let i = 0; i < v.length; i++) sq += (v[i] - s[i]) ** 2;
      d += m.dc[k] * Math.exp(-m.gamma * sq);
    }
    // SVC has no predict_proba: map the margin to 0-1 for display only.
    return { pred: d > 0 ? 1 : 0, score: sigmoid(2 * d), margin: d };
  },
  KNN: (m, v) => {
    const d = m.X.map((row, idx) => {
      let sq = 0;
      for (let i = 0; i < v.length; i++) sq += (v[i] - row[i]) ** 2;
      return { d: Math.sqrt(sq), y: m.y[idx] };
    });
    d.sort((a, b) => a.d - b.d);
    const top = d.slice(0, m.k);
    const exact = top.filter((n) => n.d === 0);
    let p;
    if (exact.length) p = exact.reduce((a, n) => a + n.y, 0) / exact.length;
    else {
      let w = 0, wy = 0;
      for (const n of top) { w += 1 / n.d; wy += n.y / n.d; }
      p = wy / w;
    }
    return { pred: p > 0.5 ? 1 : 0, score: p };
  },
  'Decision Tree': (m, v) => {
    const p = walk(m.tree, v);
    return { pred: p > 0.5 ? 1 : 0, score: p };
  },
};

/** values: array of 9 numbers (1-10) or null for unknown */
export function predict(values) {
  const models = MODEL_ORDER.map((name) => {
    const m = BUNDLE.models[name];
    const v = preprocess(values, m.prep);
    return { name, ...RUNNERS[name](m, v) };
  });
  const votes = models.reduce((a, m) => a + m.pred, 0);
  const primary = models.find((m) => m.name === PRIMARY);
  const ann = BUNDLE.models[PRIMARY].prep;
  const filled = values.map((val, i) => (val === null || val === undefined ? ann.impute[i] : Number(val)));
  return { models, votes, primary, filled };
}

export function valuesFromCase(c) {
  return c.x.slice();
}

export { BUNDLE };

