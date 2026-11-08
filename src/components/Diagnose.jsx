import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  AlertOctagon,
  Dices,
  FlaskConical,
  RotateCcw,
  X,
  Play,
  Square,
  Sliders,
  Eye,
  Sparkles,
} from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, pct } from './ui.jsx';
import CytologyRadar from './CytologyRadar.jsx';
import ClinicalTriage from './ClinicalTriage.jsx';

const SHORT = {
  'ANN (MLP)': 'Neural Network (ANN)',
  'Random Forest': 'Random Forest',
  SVM: 'Support Vector Machine',
  KNN: 'K-Nearest Neighbors',
  'Decision Tree': 'Decision Tree',
};

const FEATURE_EXPLANATIONS = {
  clump_thickness: '1 = Monolayer sheets (Benign) · 10 = Syncytial 3D clusters (Carcinoma)',
  uniformity_of_cell_size: '1 = Monomorphic cells · 10 = Severe anisocytosis (size atypia)',
  uniformity_of_cell_shape: '1 = Regular round contours · 10 = Marked pleomorphism (deformity)',
  marginal_adhesion: '1 = Intact cohesive bonds · 10 = Discohesive infiltrative single cells',
  single_epithelial_cell_size: '1 = Normal small ductal cells · 10 = Markedly enlarged macrocytes',
  bare_nuclei: '1 = Benign stripped bipolar cells · 10 = Naked malignant tumor nuclei',
  bland_chromatin: '1 = Powdery vesicular chromatin · 10 = Coarse hyperchromatic clumping',
  normal_nucleoli: '1 = Inconspicuous micronucleoli · 10 = Prominent multiple macronucleoli',
  mitoses: '1 = Quiescent non-dividing · 10 = Abnormal mitotic figures (proliferation)',
};

function usePresets() {
  return useMemo(() => {
    const cases = BUNDLE.cases;
    const votes = (c) => MODEL_ORDER.reduce((a, m) => a + c.pred[m], 0);
    const benign = cases.find((c) => c.y === 0 && votes(c) === 0 && c.x.every((v) => v !== null));
    const malignant = cases.find((c) => c.y === 1 && votes(c) === 5 && c.x[0] >= 7);
    const borderline =
      cases.find((c) => votes(c) === 2 || votes(c) === 3) || cases.find((c) => votes(c) > 0 && votes(c) < 5);
    return { benign, malignant, borderline };
  }, []);
}

/* ---------- Compact Live Reactive Cell Preview + Semicircle Gauge ---------- */
function CockpitVisuals({ values, p, mal }) {
  const clump = values[0] || 1;
  const sizeU = values[1] || 1;
  const shapeU = values[2] || 1;
  const bareN = values[5] || 1;
  const chrom = values[6] || 1;
  const mitoses = values[8] || 1;

  const baseR = 21 + sizeU * 1.5;
  const squash = Math.max(0.58, 1 - shapeU * 0.04);
  const nucR = baseR * (0.32 + bareN * 0.032);
  const satelliteCount = Math.min(6, Math.floor((clump + mitoses) / 3));
  const color = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';
  const arcPath = 'M 18 96 A 72 72 0 0 1 162 96';

  return (
    <div className="mt-3.5 grid grid-cols-2 gap-3 rounded-xl border border-line bg-soft/45 p-3">
      {/* Left: Semicircle Probability Gauge */}
      <div className="flex flex-col items-center justify-between rounded-lg bg-card/85 p-2.5 border border-line/60 min-h-[148px]">
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-muted">
          <span>Malignancy Risk</span>
          <span>0–100%</span>
        </div>
        <div className="relative w-full max-w-[165px]">
          <svg viewBox="0 0 180 105" className="w-full">
            <path d={arcPath} fill="none" stroke="rgb(var(--soft))" strokeWidth="13" strokeLinecap="round" />
            <motion.path
              d={arcPath}
              fill="none"
              stroke={color}
              strokeWidth="13"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: Math.max(0.01, p), stroke: color }}
              transition={{ type: 'spring', stiffness: 65, damping: 16 }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0.5 text-center">
            <div className="font-display text-3xl font-bold leading-none" style={{ color }}>
              <Counter value={p * 100} decimals={1} suffix="%" duration={0.6} />
            </div>
          </div>
        </div>
        <div className="text-[10.5px] font-medium text-muted text-center">
          Primary Model Probability
        </div>
      </div>

      {/* Right: Live Simulated Cell Morphology */}
      <div className="flex flex-col items-center justify-between rounded-lg bg-card/85 p-2.5 border border-line/60 min-h-[148px]">
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-muted">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-accent" /> Cell Sim
          </span>
          <span>Live 400×</span>
        </div>
        <div className="relative h-[74px] w-[74px] overflow-hidden rounded-full border border-line bg-soft/50 shadow-inner my-0.5">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {Array.from({ length: satelliteCount }).map((_, idx) => {
              const ang = (idx / Math.max(1, satelliteCount)) * Math.PI * 2;
              const dist = 22 + (clump % 3) * 3;
              return (
                <motion.circle
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    cx: 50 + Math.cos(ang) * dist,
                    cy: 50 + Math.sin(ang) * dist,
                    r: 6.5 + (sizeU % 4),
                    scale: 1,
                    opacity: 0.45,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  fill={color}
                />
              );
            })}
            <motion.ellipse
              cx="50"
              cy="50"
              animate={{
                rx: baseR,
                ry: baseR * squash,
                rotate: shapeU * 8,
              }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              fill={mal ? 'rgb(var(--malignant) / 0.22)' : 'rgb(var(--benign) / 0.18)'}
              stroke={color}
              strokeWidth="2"
            />
            <motion.ellipse
              animate={{
                cx: 50 + (shapeU > 5 ? 4 : 0),
                cy: 50,
                rx: nucR,
                ry: nucR * (mal ? 0.82 : 0.96),
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              fill={color}
              fillOpacity={0.45 + chrom * 0.05}
            />
          </svg>
        </div>
        <div className="text-[10.5px] font-medium text-muted text-center truncate w-full">
          {mal ? 'Pleomorphic / Clustered' : 'Uniform / Regular Cell'}
        </div>
      </div>
    </div>
  );
}

/* ---------- Compact Feature Card (for 2x5 symmetrical laptop grid) ---------- */
function ScoreCard({ index, feature, value, onChange, allowUnknown }) {
  const explanation = FEATURE_EXPLANATIONS[feature.key] || feature.hint;
  const isUnknown = value === null || value === undefined;
  const currentVal = isUnknown ? 1 : value;
  const isHighAbnormal = !isUnknown && currentVal >= 7;
  const isModerate = !isUnknown && currentVal >= 4 && currentVal < 7;

  return (
    <motion.div
      layout
      className="flex flex-col justify-between rounded-xl border border-line/80 bg-soft/30 p-2.5 min-h-[96px] transition-colors hover:border-ink/25 hover:bg-soft/55"
    >
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10px] font-bold text-muted">
              0{index + 1}
            </span>
            <span className="text-[13px] font-semibold text-ink truncate" title={feature.label}>
              {feature.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full ${
                isUnknown
                  ? 'bg-accent/15 text-accent'
                  : isHighAbnormal
                  ? 'bg-malignant/15 text-malignant'
                  : isModerate
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-benign/15 text-benign'
              }`}
            >
              {isUnknown ? 'Imputed' : isHighAbnormal ? 'High' : isModerate ? 'Mod' : 'Normal'}
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={String(value)}
                initial={{ y: -8, scale: 0.8, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 8, scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className={`min-w-[1.8ch] text-right font-display text-xl font-bold leading-none ${
                  isUnknown
                    ? 'text-accent'
                    : isHighAbnormal
                    ? 'text-malignant'
                    : isModerate
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-benign'
                }`}
              >
                {isUnknown ? '?' : currentVal}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-0.5 mb-2 text-[10.5px] text-muted truncate" title={explanation}>
          {explanation}
        </div>
      </div>

      {/* Tactile 1..10 button bar */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label={feature.label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = !isUnknown && currentVal === n;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${feature.label} score ${n} of 10`}
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(n)}
              className={`relative h-7 flex-1 min-w-[20px] rounded-md font-mono text-[11.5px] font-medium transition-colors ${
                active
                  ? 'shadow-sm text-paper font-bold'
                  : 'bg-card/90 text-muted border border-line/60 hover:bg-line/60 hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`pick-${feature.key}`}
                  className={`absolute inset-0 rounded-md ${
                    n >= 7 ? 'bg-malignant' : n >= 4 ? 'bg-amber-600' : 'bg-ink'
                  }`}
                  transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                />
              )}
              <span className={`relative z-10 ${active ? 'text-paper' : ''}`}>{n}</span>
            </motion.button>
          );
        })}

        {allowUnknown && (
          <motion.button
            type="button"
            role="radio"
            aria-checked={isUnknown}
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(null)}
            title="Simulate missing value (?) — pipeline fills with training median (1.0)"
            className={`relative h-7 px-2 rounded-md font-mono text-[11px] font-semibold transition-colors ${
              isUnknown
                ? 'text-paper shadow-sm'
                : 'bg-card/90 text-muted border border-line/60 hover:bg-line/60 hover:text-ink'
            }`}
          >
            {isUnknown && (
              <motion.span
                layoutId={`pick-${feature.key}`}
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              />
            )}
            <span className="relative z-10">?</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Result Card (Matches Left Column Height on Laptop!) ---------- */
function ResultCard({ result, loadedCase }) {
  const { primary, models, filled } = result;
  const mal = primary.pred === 1;
  const agree = models.filter((m) => m.pred === primary.pred).length;
  const correct = loadedCase ? loadedCase.y === primary.pred : null;

  return (
    <motion.div
      layout
      className="card h-full flex flex-col justify-between overflow-hidden border-2 shadow-card transition-colors duration-500"
      style={{ borderColor: mal ? 'rgb(var(--malignant) / 0.4)' : 'rgb(var(--benign) / 0.4)' }}
    >
      {/* Top Status Banner */}
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-2.5 text-xs ${
          loadedCase
            ? correct
              ? 'border-benign/30 bg-benign/10'
              : 'border-malignant/30 bg-malignant/10'
            : 'border-line bg-soft/50'
        }`}
      >
        {loadedCase ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono font-bold text-ink">Patient #{loadedCase.id}</span>
              <span className="text-muted">· Actual Lab:</span>
              <span className={`font-bold ${loadedCase.y ? 'text-malignant' : 'text-benign'}`}>
                {loadedCase.y ? 'Malignant' : 'Benign'}
              </span>
            </div>
            <motion.span
              key={String(loadedCase.id) + String(correct)}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                correct ? 'bg-benign text-paper' : 'bg-malignant text-paper'
              }`}
            >
              {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {correct ? 'Matches Lab ✓' : 'Mismatch'}
            </motion.span>
          </>
        ) : (
          <>
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Custom Biopsy Profile
            </span>
            <span className="font-mono text-[11px] text-muted">Primary: {PRIMARY}</span>
          </>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Verdict Headline */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              key={mal ? 'icon-m' : 'icon-b'}
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 ${
                mal ? 'bg-malignant/15 text-malignant' : 'bg-benign/15 text-benign'
              }`}
            >
              {mal ? <AlertOctagon className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </motion.div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Real-Time AI Verdict
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h3
                  key={mal ? 'm' : 'b'}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className={`font-display text-2xl sm:text-3xl leading-none font-bold ${
                    mal ? 'text-malignant' : 'text-benign'
                  }`}
                >
                  {mal ? 'Likely Malignant' : 'Likely Benign'}
                </motion.h3>
              </AnimatePresence>
            </div>
          </div>

          {/* Consensus Pill */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 border border-line/70">
              {models.map((m, idx) => (
                <motion.span
                  key={m.name + m.pred}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 18, delay: idx * 0.03 }}
                  title={`${m.name}: ${m.pred ? 'Malignant' : 'Benign'}`}
                  className={`h-2.5 w-2.5 rounded-full ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
                />
              ))}
            </div>
            <div className="mt-1 text-[10.5px] font-semibold text-muted">
              {agree}/5 Models Agree
            </div>
          </div>
        </div>

        {/* Side-by-side Gauge + Live Morphing Cell */}
        <CockpitVisuals values={filled} p={primary.score} mal={mal} />

        {/* All 5 Models Live Breakdown */}
        <div className="mt-4 pt-3 border-t border-line">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink mb-2">
            <span>All 5 Models Live Breakdown</span>
            <span className="font-mono text-[10px] text-muted">Malignancy Score</span>
          </div>
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.name} className="rounded-lg bg-soft/45 px-2.5 py-1.5 text-xs border border-line/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-ink text-[11.5px] flex items-center gap-1.5">
                    {SHORT[m.name] || m.name}
                    {m.name === PRIMARY && (
                      <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.1 text-[9.5px] font-mono font-bold">
                        Primary
                      </span>
                    )}
                  </span>
                  <span className={`font-mono text-[11px] font-semibold ${m.pred ? 'text-malignant' : 'text-benign'}`}>
                    {m.pred ? 'Malignant' : 'Benign'} · {pct(m.score, 0)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
                  <motion.div
                    className={`h-full rounded-full ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(2, m.score * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Compact 3x3 Benchmark Matrix: Where This Sample Sits ---------- */
function Profile({ values }) {
  const pos = (v) => `${((v - 1) / 9) * 100}%`;
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-2.5">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-ink">
            Where This Sample Sits vs. Dataset Averages
          </h3>
          <span className="text-xs text-muted">
            9-feature comparison against historical Benign &amp; Malignant means
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-benign">
            <span className="h-2.5 w-1.5 rounded-full bg-benign" /> Benign Mean
          </span>
          <span className="flex items-center gap-1.5 text-malignant">
            <span className="h-2.5 w-1.5 rounded-full bg-malignant" /> Malignant Mean
          </span>
          <span className="flex items-center gap-1.5 text-ink">
            <span className="h-3 w-3 rounded-full border-2 border-paper bg-ink ring-1 ring-ink" /> Current Score
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
        {FEATURES.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2.5">
            <div className="w-[125px] shrink-0 truncate text-xs font-medium text-ink" title={f.label}>
              {f.label}
            </div>
            <div className="relative h-5 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-soft" />
              {Array.from({ length: 10 }).map((_, k) => (
                <div
                  key={k}
                  className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-line"
                  style={{ left: `${(k / 9) * 100}%` }}
                />
              ))}
              <div
                title={`Benign average: ${BUNDLE.means.benign[i].toFixed(1)}`}
                className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-benign"
                style={{ left: pos(BUNDLE.means.benign[i]) }}
              />
              <div
                title={`Malignant average: ${BUNDLE.means.malignant[i].toFixed(1)}`}
                className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-malignant"
                style={{ left: pos(BUNDLE.means.malignant[i]) }}
              />
              <motion.div
                className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-card bg-ink shadow-sm"
                style={{ x: '-50%', y: '-50%' }}
                title={`Current value: ${values[i]}`}
                initial={false}
                animate={{ left: pos(values[i]) }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              />
            </div>
            <span className="w-4 text-right font-mono text-[11px] font-bold text-ink">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Diagnose({ values, setValues, loadedCase, loadCase }) {
  const presets = usePresets();
  const result = useMemo(() => predict(values), [values]);
  const [activePreset, setActivePreset] = useState('benign');
  const [tourRunning, setTourRunning] = useState(false);
  const tourTimer = useRef(null);

  const setOne = (i, v) => {
    stopTour();
    setActivePreset(null);
    const next = values.slice();
    next[i] = v;
    setValues(next, null);
  };

  const applyPresetCard = (key, caseObj) => {
    stopTour();
    setActivePreset(key);
    loadCase(caseObj, false);
  };

  const randomCase = () => {
    stopTour();
    setActivePreset('random');
    const pool = BUNDLE.cases.filter((c) => !loadedCase || c.id !== loadedCase.id);
    loadCase(pool[Math.floor(Math.random() * pool.length)], false);
  };

  const resetAll = () => {
    stopTour();
    setActivePreset(null);
    setValues(Array(9).fill(1), null);
  };

  const stopTour = () => {
    if (tourTimer.current) {
      clearInterval(tourTimer.current);
      tourTimer.current = null;
    }
    setTourRunning(false);
  };

  const toggleAutoTour = () => {
    if (tourRunning) {
      stopTour();
      return;
    }
    setTourRunning(true);
    const steps = [
      ['benign', presets.benign],
      ['borderline', presets.borderline],
      ['malignant', presets.malignant],
    ].filter(([, c]) => Boolean(c));

    let idx = 0;
    setActivePreset(steps[0][0]);
    loadCase(steps[0][1], false);

    tourTimer.current = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setActivePreset(steps[idx][0]);
      loadCase(steps[idx][1], false);
    }, 2200);
  };

  useEffect(() => () => stopTour(), []);

  return (
    <section id="try" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        index="01"
        eyebrow="Interactive Cytology Classifier"
        title={<>Score a biopsy sample, <em className="text-accent">see real-time predictions.</em></>}
      >
        Pick a patient preset or tap any score from 1 (normal) to 10 (abnormal) across the 9 features. All five
        machine learning models and the cell simulation update instantaneously.
      </SectionHeader>

      {/* Unified Compact Laptop Control Toolbar: 4 Patient Presets + Auto-Play Demo + Reset */}
      <Reveal className="mb-4 rounded-2xl border border-line bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted px-2">
              Patient Presets:
            </span>

            {presets.benign && (
              <motion.button
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => applyPresetCard('benign', presets.benign)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  activePreset === 'benign'
                    ? 'border-benign bg-benign/10 text-ink ring-2 ring-benign/20'
                    : 'border-line bg-soft/50 text-ink hover:border-benign/50'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-benign" />
                <span>Benign Case</span>
                <span className="font-mono text-[10px] text-benign bg-benign/15 px-1.5 py-0.2 rounded-full">
                  #{presets.benign.id}
                </span>
              </motion.button>
            )}

            {presets.malignant && (
              <motion.button
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => applyPresetCard('malignant', presets.malignant)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  activePreset === 'malignant'
                    ? 'border-malignant bg-malignant/10 text-ink ring-2 ring-malignant/20'
                    : 'border-line bg-soft/50 text-ink hover:border-malignant/50'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-malignant" />
                <span>Malignant Case</span>
                <span className="font-mono text-[10px] text-malignant bg-malignant/15 px-1.5 py-0.2 rounded-full">
                  #{presets.malignant.id}
                </span>
              </motion.button>
            )}

            {presets.borderline && (
              <motion.button
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => applyPresetCard('borderline', presets.borderline)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  activePreset === 'borderline'
                    ? 'border-amber-500 bg-amber-500/10 text-ink ring-2 ring-amber-500/20'
                    : 'border-line bg-soft/50 text-ink hover:border-amber-500/50'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                <span>Borderline Case</span>
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded-full">
                  #{presets.borderline.id}
                </span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              onClick={randomCase}
              className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                activePreset === 'random'
                  ? 'border-accent bg-accent/10 text-ink ring-2 ring-accent/20'
                  : 'border-line bg-soft/50 text-ink hover:border-ink/40'
              }`}
            >
              <Dices className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:rotate-180" />
              <span>Random Patient</span>
              <span className="font-mono text-[10px] text-muted bg-card px-1.5 py-0.2 rounded-full">
                1/139
              </span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoTour}
              className={`btn text-xs px-3.5 py-2 ${
                tourRunning
                  ? 'bg-malignant text-paper shadow-md'
                  : 'bg-accent text-paper hover:opacity-95 shadow-sm'
              }`}
            >
              {tourRunning ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
              <span>{tourRunning ? 'Stop Auto-Demo' : 'Auto-Play Demo'}</span>
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="chip py-2 text-xs text-muted hover:text-ink"
              title="Reset all 9 features to 1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset (All 1s)</span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Main Laptop-Friendly 2-Column Cockpit: Equal Height Left (7 cols) & Right (5 cols) */}
      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        {/* Left: Symmetrical 2x5 Grid of 9 Cell Features + 1 Scale & Guide Card */}
        <Reveal className="card p-4 sm:p-5 lg:col-span-7 flex flex-col justify-between">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              <h3 className="font-display text-xl font-semibold">9 Microscopic Cell Features</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-benign" /> 1–3 Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 4–6 Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-malignant" /> 7–10 High Risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1">
            {FEATURES.map((f, i) => (
              <ScoreCard
                key={f.key}
                index={i}
                feature={f}
                value={values[i]}
                onChange={(v) => setOne(i, v)}
                allowUnknown={f.key === 'bare_nuclei'}
              />
            ))}

            {/* 10th Card in 2x5 grid: Quick Cytology Guide & Missing Value Info */}
            <div className="flex flex-col justify-between rounded-xl border border-dashed border-line bg-soft/20 p-2.5 text-xs min-h-[96px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                    Quick Guide
                  </span>
                  <span className="font-mono text-[10px] text-muted">Scale 1–10</span>
                </div>
                <div className="mt-1 font-semibold text-ink text-[12.5px]">
                  How Pathologists Score Biopsies
                </div>
                <p className="mt-0.5 text-[11px] text-muted leading-snug">
                  Values near <strong>1</strong> indicate healthy uniform cells. Values above <strong>6</strong> signal
                  pleomorphism and elevated malignancy risk.
                </p>
              </div>
              <div className="mt-2 pt-1.5 border-t border-line/60 flex items-center justify-between text-[10.5px] text-muted">
                <span>
                  <strong className="text-ink font-mono">?</strong> on Bare Nuclei = Missing
                </span>
                <span className="font-mono text-ink">Auto-imputed: 1.0</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right: Unified Diagnostic Result Card */}
        <Reveal delay={0.08} className="lg:col-span-5 flex flex-col">
          <ResultCard result={result} loadedCase={loadedCase} />
        </Reveal>
      </div>

      {/* 2-Column Benchmark & Multidimensional Radar Signature */}
      <Reveal className="mt-5 grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 items-stretch">
        <Profile values={result.filled} />
        <CytologyRadar values={result.filled} mal={result.primary.pred === 1} />
      </Reveal>

      {/* Clinical Oncology Decision-Support & Triage Section */}
      <Reveal className="mt-5">
        <ClinicalTriage mal={result.primary.pred === 1} score={result.primary.score} />
      </Reveal>
    </section>
  );
}
