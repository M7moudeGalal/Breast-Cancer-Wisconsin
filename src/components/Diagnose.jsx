import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  AlertOctagon,
  Dices,
  FlaskConical,
  RotateCcw,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, pct, ResearchDisclaimer } from './ui.jsx';

const SHORT = {
  'ANN (MLP)': 'Neural Network (ANN)',
  'Random Forest': 'Random Forest',
  SVM: 'Support Vector Machine (SVM)',
  KNN: 'K-Nearest Neighbors (KNN)',
  'Decision Tree': 'Decision Tree',
};

const FEATURE_EXPLANATIONS = {
  clump_thickness: 'Cell layering: 1 = single flat layer, 10 = thick multi-layer masses',
  uniformity_of_cell_size: 'Size variation: 1 = all cells identical, 10 = highly irregular cell sizes',
  uniformity_of_cell_shape: 'Shape variation: 1 = regular round cells, 10 = deformed irregular shapes',
  marginal_adhesion: 'Cell sticking: 1 = cells firmly bonded, 10 = cells detach freely from tissue',
  single_epithelial_cell_size: 'Epithelial size: 1 = normal small size, 10 = abnormally enlarged cells',
  bare_nuclei: 'Exposed nuclei: 1 = normal cytoplasm envelope, 10 = frequent naked nuclei',
  bland_chromatin: 'Nuclear texture: 1 = fine, uniform chromatin, 10 = coarse, dark clumps',
  normal_nucleoli: 'Nucleoli visibility: 1 = tiny or invisible, 10 = enlarged, prominent nucleoli',
  mitoses: 'Division rate: 1 = no dividing cells observed, 10 = active abnormal cell division',
};

/* ---------- presets built from real held-out test cases ---------- */
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

/* ---------- one feature row: 1..10 selector ---------- */
function ScoreRow({ feature, value, onChange }) {
  const explanation = FEATURE_EXPLANATIONS[feature.key] || feature.hint;
  const currentVal = value ?? 1;
  const isHighAbnormal = currentVal >= 7;
  const isModerate = currentVal >= 4 && currentVal < 7;

  return (
    <div className="border-b border-line/70 py-4 last:border-0 transition-colors">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{feature.label}</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isHighAbnormal
                  ? 'bg-malignant/15 text-malignant'
                  : isModerate
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-benign/15 text-benign'
              }`}
            >
              {isHighAbnormal ? 'Abnormal' : isModerate ? 'Moderate' : 'Normal'}
            </span>
          </div>
          <div className="text-xs text-muted mt-0.5">{explanation}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted">Score:</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(currentVal)}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`min-w-[2.2ch] text-right font-display text-2xl font-bold leading-none ${
                isHighAbnormal ? 'text-malignant' : isModerate ? 'text-amber-600 dark:text-amber-400' : 'text-benign'
              }`}
            >
              {currentVal}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Button selector from 1 to 10 */}
      <div className="flex items-center gap-1 sm:gap-1.5" role="radiogroup" aria-label={feature.label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = currentVal === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${feature.label} score ${n} of 10`}
              onClick={() => onChange(n)}
              className={`relative h-10 flex-1 min-w-[28px] rounded-lg font-mono text-[13px] font-medium transition-all ${
                active
                  ? 'shadow-sm text-paper font-bold'
                  : 'bg-soft/80 text-muted hover:bg-line hover:text-ink active:scale-95'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`pick-${feature.key}`}
                  className="absolute inset-0 rounded-lg bg-ink"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}
              <span className={`relative z-10 ${active ? 'text-paper' : ''}`}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Semicircle Gauge ---------- */
function Gauge({ p, mal }) {
  const color = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';
  const d = 'M 20 110 A 90 90 0 0 1 200 110';
  return (
    <div className="relative mx-auto w-full max-w-[270px]">
      <svg viewBox="0 0 220 125" className="w-full">
        {/* Track background */}
        <path d={d} fill="none" stroke="rgb(var(--soft))" strokeWidth="15" strokeLinecap="round" />
        {/* Animated fill */}
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.008, p), stroke: color }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
        {/* Markers */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = Math.PI * (1 - t);
          return (
            <text
              key={t}
              x={110 + Math.cos(a) * 70}
              y={110 - Math.sin(a) * 70 + 4}
              textAnchor="middle"
              className="fill-muted font-mono"
              fontSize="9"
            >
              {t * 100}%
            </text>
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="font-display text-5xl font-bold leading-none" style={{ color }}>
          <Counter value={p * 100} decimals={1} suffix="%" duration={0.8} />
        </div>
        <div className="mt-1 text-xs font-medium text-muted">
          Estimated Malignancy Probability
        </div>
      </div>
    </div>
  );
}

/* ---------- Result Card ---------- */
function ResultCard({ result, loadedCase }) {
  const { primary, models } = result;
  const mal = primary.pred === 1;
  const agree = models.filter((m) => m.pred === primary.pred).length;
  const correct = loadedCase ? loadedCase.y === primary.pred : null;
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="card overflow-hidden border-2 shadow-card" style={{ borderColor: mal ? 'rgb(var(--malignant) / 0.3)' : 'rgb(var(--benign) / 0.3)' }}>
      {/* Real Test Case Banner (if loaded from preset or table) */}
      <AnimatePresence initial={false}>
        {loadedCase && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div
              className={`flex items-center justify-between gap-3 border-b px-5 py-3 text-[13px] ${
                correct ? 'border-benign/30 bg-benign/10' : 'border-malignant/30 bg-malignant/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">Test Case #{loadedCase.id}:</span>
                <span className="text-muted">Confirmed pathology:</span>
                <span className={`font-semibold ${loadedCase.y ? 'text-malignant' : 'text-benign'}`}>
                  {loadedCase.y ? 'Malignant (Cancerous)' : 'Benign (Non-Cancerous)'}
                </span>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  correct ? 'bg-benign text-paper' : 'bg-malignant text-paper'
                }`}
              >
                {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {correct ? 'Match ✓' : 'Disagreement'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow">Model Prediction</span>
          <span className="text-[11px] font-mono text-muted">Primary: {PRIMARY}</span>
        </div>

        {/* Big visual classification result */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              mal ? 'bg-malignant/15 text-malignant' : 'bg-benign/15 text-benign'
            }`}
          >
            {mal ? <AlertOctagon className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
          </div>
          <div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={mal ? 'm' : 'b'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`font-display text-3xl sm:text-4xl leading-tight font-bold ${
                  mal ? 'text-malignant' : 'text-benign'
                }`}
              >
                {mal ? 'Likely Malignant' : 'Likely Benign'}
              </motion.h3>
            </AnimatePresence>
            <div className="text-xs font-medium text-muted">
              {mal ? 'Cell morphology indicates cancerous changes' : 'Cell morphology indicates non-cancerous tissue'}
            </div>
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="mt-6 border-y border-line py-5">
          <Gauge p={primary.score} mal={mal} />
        </div>

        {/* Model consensus bar */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-soft/80 px-4 py-3 border border-line/60">
          <div>
            <div className="text-[13px] font-semibold text-ink">
              {agree} of 5 Models Agree
            </div>
            <div className="text-[11px] text-muted">
              {agree === 5 ? 'Unanimous consensus across all algorithms' : `${5 - agree} model(s) gave contrasting output`}
            </div>
          </div>
          <div className="flex items-center gap-1.5" title="Consensus across all 5 models">
            {models.map((m) => (
              <span
                key={m.name}
                title={`${m.name}: ${m.pred ? 'Malignant' : 'Benign'}`}
                className={`h-4 w-4 rounded-full border-2 border-card ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
              />
            ))}
          </div>
        </div>

        {/* Plain English explanation box */}
        <div className="mt-4 rounded-xl bg-card border border-line p-3.5 text-xs leading-relaxed text-muted">
          <p>
            <strong className="text-ink font-medium">What this means: </strong>
            {mal
              ? 'Malignant cells show irregular shapes, nuclear enlargement, and clustered growth. In clinical practice, this pattern warrants urgent histological biopsy.'
              : 'Benign cells show uniform size, intact cell adhesion, and normal nuclei. This pattern is characteristic of healthy or non-cancerous breast tissue.'}
          </p>
        </div>

        {/* Expandable Model Comparison */}
        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex w-full items-center justify-between py-2 text-xs font-semibold text-ink hover:text-accent transition-colors"
          >
            <span>Inspect All 5 Model Predictions</span>
            <span className="flex items-center gap-1 text-muted text-[11px]">
              {detailsOpen ? 'Hide' : 'Show breakdown'}
              {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>

          <AnimatePresence>
            {detailsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden space-y-3 pt-3"
              >
                {models.map((m) => (
                  <div key={m.name} className="rounded-lg bg-soft/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-ink flex items-center gap-1.5">
                        {SHORT[m.name] || m.name}
                        {m.name === PRIMARY && (
                          <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.2 text-[10px] font-mono font-semibold">
                            Primary
                          </span>
                        )}
                      </span>
                      <span className={`font-mono font-semibold ${m.pred ? 'text-malignant' : 'text-benign'}`}>
                        {m.pred ? 'Malignant' : 'Benign'} · {pct(m.score, 0)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line/80">
                      <motion.div
                        className={`h-full rounded-full ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, m.score * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted pt-1">
                  SVM outputs a scaled decision distance. Decision Tree and Random Forest use leaf purity ratios.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 pt-3 border-t border-line/60">
          <p className="text-[11px] leading-relaxed text-muted">
            <span className="font-medium text-ink/80">Research Note: </span>
            This tool provides statistical machine learning estimates for educational demonstration only. Not a medical diagnostic device.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Where this sample sits vs training averages ---------- */
function Profile({ values }) {
  const pos = (v) => `${((v - 1) / 9) * 100}%`;
  return (
    <div className="card p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">Comparative Cytology Benchmark</div>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold">Where This Sample Sits</h3>
          <p className="text-xs text-muted mt-1 max-w-xl">
            Compare each feature of your current sample against the historical training averages for confirmed
            benign vs. malignant biopsies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-benign">
            <span className="h-3 w-1.5 rounded-full bg-benign" /> Benign Average
          </span>
          <span className="flex items-center gap-1.5 text-malignant">
            <span className="h-3 w-1.5 rounded-full bg-malignant" /> Malignant Average
          </span>
          <span className="flex items-center gap-1.5 text-ink">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-paper bg-ink ring-1 ring-ink" /> Your Sample
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {FEATURES.map((f, i) => (
          <div key={f.key} className="grid grid-cols-[140px_1fr] items-center gap-3 sm:grid-cols-[180px_1fr]">
            <div className="truncate text-[13px] font-medium text-ink" title={f.label}>
              {f.label}
            </div>
            <div className="relative h-7">
              {/* Baseline axis */}
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-soft" />

              {/* Tick marks */}
              {Array.from({ length: 10 }).map((_, k) => (
                <div
                  key={k}
                  className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line"
                  style={{ left: `${(k / 9) * 100}%` }}
                />
              ))}

              {/* Benign Mean Marker */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 + i * 0.03 }}
                title={`Benign average: ${BUNDLE.means.benign[i].toFixed(1)}`}
                className="absolute top-1/2 h-4 w-1.5 rounded bg-benign shadow-sm"
                style={{ left: pos(BUNDLE.means.benign[i]), x: '-50%', y: '-50%' }}
              />

              {/* Malignant Mean Marker */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.03 }}
                title={`Malignant average: ${BUNDLE.means.malignant[i].toFixed(1)}`}
                className="absolute top-1/2 h-4 w-1.5 rounded bg-malignant shadow-sm"
                style={{ left: pos(BUNDLE.means.malignant[i]), x: '-50%', y: '-50%' }}
              />

              {/* Current Sample Marker */}
              <motion.div
                className="absolute top-1/2 h-5 w-5 rounded-full border-2 border-card bg-ink shadow-md"
                style={{ x: '-50%', y: '-50%' }}
                title={`Current value: ${values[i]}`}
                initial={false}
                animate={{ left: pos(values[i]) }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              />
            </div>
          </div>
        ))}

        <div className="grid grid-cols-[140px_1fr] gap-3 sm:grid-cols-[180px_1fr] pt-2 border-t border-line/60">
          <div className="text-[11px] text-muted">Feature Scale:</div>
          <div className="flex justify-between font-mono text-[11px] text-muted">
            <span>1 (Normal / Healthy)</span>
            <span>5 (Intermediate)</span>
            <span>10 (Severely Abnormal)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Diagnose({ values, setValues, loadedCase, loadCase }) {
  const presets = usePresets();
  const result = useMemo(() => predict(values), [values]);

  const setOne = (i, v) => {
    const next = values.slice();
    next[i] = v;
    setValues(next, null);
  };

  const randomCase = () => {
    const pool = BUNDLE.cases.filter((c) => !loadedCase || c.id !== loadedCase.id);
    loadCase(pool[Math.floor(Math.random() * pool.length)]);
  };

  const resetAll = () => {
    setValues(Array(9).fill(1), null);
  };

  return (
    <section id="try" className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeader
        index="01"
        eyebrow="Interactive Cytology Classifier"
        title={<>Score a biopsy sample, <em className="text-accent">see real-time predictions.</em></>}
      >
        Select values from 1 (healthy baseline) to 10 (severe cellular abnormality) for the nine microscopic features below.
        The consensus across all five models updates instantly.
      </SectionHeader>

      {/* Beginner Instruction & User Guide Card */}
      <Reveal className="mb-8 rounded-2xl border border-line bg-card/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">How to Use This Classifier:</h4>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Score each feature from <strong className="text-benign">1 (Normal)</strong> to <strong className="text-malignant">10 (Abnormal)</strong>.
                Not sure what values to try? Click a ready-made preset below to load a verified patient biopsy into the system.
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="chip shrink-0 text-muted hover:text-ink text-xs"
            title="Reset all 9 features to 1 (normal baseline)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Normal (All 1s)</span>
          </button>
        </div>
      </Reveal>

      {/* Quick-Start Preset Examples */}
      <Reveal className="mb-8">
        <div className="eyebrow mb-2.5">Quick-Start Real Biopsy Presets:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.benign && (
            <button
              onClick={() => loadCase(presets.benign)}
              className="card p-3.5 text-left hover:border-benign/60 hover:shadow-lift transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-benign" />
                  Benign Example
                </span>
                <span className="font-mono text-[10px] text-muted">#{presets.benign.id}</span>
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Loads a confirmed non-cancerous biopsy with low scores (mostly 1s and 2s).
              </p>
            </button>
          )}

          {presets.malignant && (
            <button
              onClick={() => loadCase(presets.malignant)}
              className="card p-3.5 text-left hover:border-malignant/60 hover:shadow-lift transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-malignant" />
                  Malignant Example
                </span>
                <span className="font-mono text-[10px] text-muted">#{presets.malignant.id}</span>
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Loads a confirmed cancerous case showing severe cellular clustering and atypia.
              </p>
            </button>
          )}

          {presets.borderline && (
            <button
              onClick={() => loadCase(presets.borderline)}
              className="card p-3.5 text-left hover:border-amber-500/60 hover:shadow-lift transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <FlaskConical className="h-3 w-3 text-amber-500" />
                  Borderline Example
                </span>
                <span className="font-mono text-[10px] text-muted">#{presets.borderline.id}</span>
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Loads an ambiguous case where individual algorithms show differing confidence.
              </p>
            </button>
          )}

          <button
            onClick={randomCase}
            className="card p-3.5 text-left hover:border-ink/40 hover:shadow-lift transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Dices className="h-3.5 w-3.5 text-muted group-hover:rotate-45 transition-transform" />
                Random Patient
              </span>
              <span className="font-mono text-[10px] text-muted">Test Pool</span>
            </div>
            <p className="text-[11px] text-muted leading-snug">
              Picks an arbitrary sample from the 139 held-out test cases.
            </p>
          </button>
        </div>
      </Reveal>

      {/* Main interactive grid: 9 features (left) & Result card (right) */}
      <div className="grid items-start gap-8 lg:grid-cols-[1.18fr_0.82fr]">
        <Reveal className="card p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-display text-2xl font-semibold">9 Cytology Features</h3>
              <p className="text-xs text-muted">Adjust values to reflect microscopic biopsy findings</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-benign" /> 1-3 Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-malignant" /> 7-10 Abnormal
              </span>
            </div>
          </div>

          <div className="divide-y divide-line/60">
            {FEATURES.map((f, i) => (
              <ScoreRow
                key={f.key}
                feature={f}
                value={values[i]}
                onChange={(v) => setOne(i, v)}
              />
            ))}
          </div>
        </Reveal>

        {/* Sticky Result card */}
        <Reveal delay={0.1} className="lg:sticky lg:top-24">
          <ResultCard result={result} loadedCase={loadedCase} />
        </Reveal>
      </div>

      {/* Feature Profile visualization */}
      <Reveal className="mt-8">
        <Profile values={result.filled} />
      </Reveal>
    </section>
  );
}
