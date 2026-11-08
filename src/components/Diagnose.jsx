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
  ChevronDown,
  ChevronUp,
  Sparkles,
  Play,
  Square,
  Sliders,
  Eye,
} from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, pct } from './ui.jsx';

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

/* ---------- Live Reactive Cell Preview (morphs based on user's 9 scores!) ---------- */
function LiveCellPreview({ values, mal }) {
  const clump = values[0] || 1;
  const sizeU = values[1] || 1;
  const shapeU = values[2] || 1;
  const bareN = values[5] || 1;
  const chrom = values[6] || 1;
  const mitoses = values[8] || 1;

  const baseR = 22 + sizeU * 1.6;
  const squash = Math.max(0.58, 1 - shapeU * 0.04);
  const nucR = baseR * (0.32 + bareN * 0.032);
  const satelliteCount = Math.min(6, Math.floor((clump + mitoses) / 3));

  const mainColor = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';

  return (
    <div className="mt-4 flex items-center gap-4 rounded-xl border border-line bg-soft/60 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-card shadow-inner">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Satellite cells representing clump thickness & mitoses */}
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
                  r: 7 + (sizeU % 4),
                  scale: 1,
                  opacity: 0.45,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                fill={mainColor}
              />
            );
          })}
          {/* Primary cell body */}
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
            stroke={mainColor}
            strokeWidth="2"
          />
          {/* Cell Nucleus */}
          <motion.ellipse
            animate={{
              cx: 50 + (shapeU > 5 ? 4 : 0),
              cy: 50,
              rx: nucR,
              ry: nucR * (mal ? 0.82 : 0.96),
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            fill={mainColor}
            fillOpacity={0.45 + chrom * 0.05}
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          <Eye className="h-3.5 w-3.5 text-accent" />
          <span>Live Simulated Cell Morphology</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          {mal
            ? 'Enlarged irregular nucleus with dense chromatin & multi-cell clustering.'
            : 'Small regular nucleus with uniform cell membrane & normal spacing.'}
        </p>
      </div>
    </div>
  );
}

/* ---------- one feature row: 1..10 selector + unknown "?" for Bare Nuclei ---------- */
function ScoreRow({ feature, value, onChange, allowUnknown }) {
  const explanation = FEATURE_EXPLANATIONS[feature.key] || feature.hint;
  const isUnknown = value === null || value === undefined;
  const currentVal = isUnknown ? 1 : value;
  const isHighAbnormal = !isUnknown && currentVal >= 7;
  const isModerate = !isUnknown && currentVal >= 4 && currentVal < 7;

  return (
    <motion.div
      layout
      className="border-b border-line/70 py-4 last:border-0 transition-colors hover:bg-soft/25 -mx-3 px-3 rounded-xl"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{feature.label}</span>
            <motion.span
              key={isUnknown ? 'unk' : isHighAbnormal ? 'abn' : isModerate ? 'mod' : 'norm'}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isUnknown
                  ? 'bg-accent/15 text-accent'
                  : isHighAbnormal
                  ? 'bg-malignant/15 text-malignant'
                  : isModerate
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-benign/15 text-benign'
              }`}
            >
              {isUnknown ? 'Imputed (Median 1.0)' : isHighAbnormal ? 'High Risk (7–10)' : isModerate ? 'Moderate (4–6)' : 'Normal (1–3)'}
            </motion.span>
          </div>
          <div className="text-xs text-muted mt-0.5">{explanation}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted">Score:</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(value)}
              initial={{ y: -10, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className={`min-w-[2.2ch] text-right font-display text-2xl font-bold leading-none ${
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

      {/* Button selector from 1 to 10 */}
      <div className="flex items-center gap-1 sm:gap-1.5" role="radiogroup" aria-label={feature.label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = !isUnknown && currentVal === n;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${feature.label} score ${n} of 10`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(n)}
              className={`relative h-10 flex-1 min-w-[26px] rounded-lg font-mono text-[13px] font-medium transition-colors ${
                active
                  ? 'shadow-sm text-paper font-bold'
                  : 'bg-soft/80 text-muted hover:bg-line hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`pick-${feature.key}`}
                  className={`absolute inset-0 rounded-lg ${
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
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(null)}
            title="Simulate missing value (?) — pipeline fills with training median (1.0)"
            className={`relative h-10 px-2.5 rounded-lg font-mono text-[12px] font-semibold transition-colors ${
              isUnknown ? 'text-paper shadow-sm' : 'bg-soft/80 text-muted hover:bg-line hover:text-ink'
            }`}
          >
            {isUnknown && (
              <motion.span
                layoutId={`pick-${feature.key}`}
                className="absolute inset-0 rounded-lg bg-accent"
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

/* ---------- Semicircle Gauge ---------- */
function Gauge({ p, mal }) {
  const color = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';
  const d = 'M 20 110 A 90 90 0 0 1 200 110';
  return (
    <div className="relative mx-auto w-full max-w-[270px]">
      <svg viewBox="0 0 220 125" className="w-full">
        <path d={d} fill="none" stroke="rgb(var(--soft))" strokeWidth="15" strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.008, p), stroke: color }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
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
          <Counter value={p * 100} decimals={1} suffix="%" duration={0.7} />
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
  const { primary, models, filled } = result;
  const mal = primary.pred === 1;
  const agree = models.filter((m) => m.pred === primary.pred).length;
  const correct = loadedCase ? loadedCase.y === primary.pred : null;
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <motion.div
      layout
      className="card overflow-hidden border-2 shadow-card transition-colors duration-500"
      style={{ borderColor: mal ? 'rgb(var(--malignant) / 0.4)' : 'rgb(var(--benign) / 0.4)' }}
    >
      {/* Real Test Case Banner */}
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-ink">Patient #{loadedCase.id}:</span>
                <span className="text-muted">Actual Lab Result:</span>
                <span className={`font-bold ${loadedCase.y ? 'text-malignant' : 'text-benign'}`}>
                  {loadedCase.y ? 'Malignant' : 'Benign'}
                </span>
              </div>
              <motion.span
                key={String( loadedCase.id ) + String(correct)}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  correct ? 'bg-benign text-paper' : 'bg-malignant text-paper'
                }`}
              >
                {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {correct ? 'Accurate ✓' : 'Mismatch'}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow">Live AI Diagnosis</span>
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-mono text-muted">
            Primary: {PRIMARY}
          </span>
        </div>

        {/* Big visual classification result */}
        <div className="flex items-center gap-3.5">
          <motion.div
            key={mal ? 'icon-m' : 'icon-b'}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl p-3 ${
              mal ? 'bg-malignant/15 text-malignant' : 'bg-benign/15 text-benign'
            }`}
          >
            {mal ? <AlertOctagon className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
          </motion.div>
          <div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={mal ? 'm' : 'b'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className={`font-display text-3xl sm:text-4xl leading-tight font-bold ${
                  mal ? 'text-malignant' : 'text-benign'
                }`}
              >
                {mal ? 'Likely Malignant' : 'Likely Benign'}
              </motion.h3>
            </AnimatePresence>
            <div className="text-xs font-medium text-muted">
              {mal ? 'High cellular atypia detected' : 'Consistent with healthy benign tissue'}
            </div>
          </div>
        </div>

        {/* Live Reactive Cell Morphology Preview */}
        <LiveCellPreview values={filled} mal={mal} />

        {/* Probability Gauge */}
        <div className="mt-5 border-y border-line py-4">
          <Gauge p={primary.score} mal={mal} />
        </div>

        {/* Model consensus bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-soft/80 px-4 py-3 border border-line/60">
          <div>
            <div className="text-[13px] font-semibold text-ink">
              {agree} of 5 Models Agree
            </div>
            <div className="text-[11px] text-muted">
              {agree === 5 ? 'Unanimous agreement across all 5 pipelines' : `${5 - agree} model(s) differ`}
            </div>
          </div>
          <div className="flex items-center gap-1.5" title="Consensus across all 5 models">
            {models.map((m, idx) => (
              <motion.span
                key={m.name + m.pred}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 18, delay: idx * 0.04 }}
                title={`${m.name}: ${m.pred ? 'Malignant' : 'Benign'}`}
                className={`h-4 w-4 rounded-full border-2 border-card ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
              />
            ))}
          </div>
        </div>

        {/* Expandable 5-Model Breakdown (Open by default so users see all 5 models animate live!) */}
        <div className="mt-4 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex w-full items-center justify-between py-1.5 text-xs font-semibold text-ink hover:text-accent transition-colors"
          >
            <span>All 5 Models Live Breakdown</span>
            <span className="flex items-center gap-1 text-muted text-[11px]">
              {detailsOpen ? 'Hide' : 'Show'}
              {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {detailsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden space-y-2.5 pt-2.5"
              >
                {models.map((m) => (
                  <div key={m.name} className="rounded-lg bg-soft/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-ink flex items-center gap-1.5">
                        {SHORT[m.name] || m.name}
                        {m.name === PRIMARY && (
                          <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.2 text-[10px] font-mono font-semibold">
                            Best
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
                        transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
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
            Watch the dark marker slide between the historical Benign average (green) and Malignant average (red) as you change any score above.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-benign">
            <span className="h-3 w-1.5 rounded-full bg-benign" /> Benign Mean
          </span>
          <span className="flex items-center gap-1.5 text-malignant">
            <span className="h-3 w-1.5 rounded-full bg-malignant" /> Malignant Mean
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
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-soft" />
              {Array.from({ length: 10 }).map((_, k) => (
                <div
                  key={k}
                  className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line"
                  style={{ left: `${(k / 9) * 100}%` }}
                />
              ))}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.04 + i * 0.03 }}
                title={`Benign average: ${BUNDLE.means.benign[i].toFixed(1)}`}
                className="absolute top-1/2 h-4 w-1.5 rounded bg-benign shadow-sm"
                style={{ left: pos(BUNDLE.means.benign[i]), x: '-50%', y: '-50%' }}
              />
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 + i * 0.03 }}
                title={`Malignant average: ${BUNDLE.means.malignant[i].toFixed(1)}`}
                className="absolute top-1/2 h-4 w-1.5 rounded bg-malignant shadow-sm"
                style={{ left: pos(BUNDLE.means.malignant[i]), x: '-50%', y: '-50%' }}
              />
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
    <section id="try" className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeader
        index="01"
        eyebrow="Interactive Cytology Classifier"
        title={<>Score a biopsy sample, <em className="text-accent">see real-time predictions.</em></>}
      >
        Pick a score from 1 (healthy) to 10 (abnormal) for each cell feature, or click a patient preset below to
        watch all five models respond in real time.
      </SectionHeader>

      {/* Visual 3-Step Beginner Bar + Auto-Play Demo Button */}
      <Reveal className="mb-7 rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {[
              ['Step 1', 'Pick a Patient Preset', 'Start with Benign, Malignant, or Random'],
              ['Step 2', 'Tap Any Score (1–10)', 'Adjust cell size, shape, or bare nuclei'],
              ['Step 3', 'Compare 5 AI Models', 'See probability & simulated cell shape'],
            ].map(([step, title, sub], i) => (
              <div key={step} className="flex items-center gap-3 rounded-xl bg-soft/60 px-3.5 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper font-mono text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">{title}</div>
                  <div className="text-[11px] text-muted truncate">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoTour}
              className={`btn text-xs px-4 py-2.5 ${
                tourRunning
                  ? 'bg-malignant text-paper shadow-md'
                  : 'bg-accent text-paper hover:opacity-95 shadow-sm'
              }`}
            >
              {tourRunning ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{tourRunning ? 'Stop Auto-Demo' : 'Auto-Play Demo'}</span>
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="chip py-2.5 text-xs text-muted hover:text-ink"
              title="Reset all 9 features to 1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Quick-Start Preset Examples with animated active border */}
      <Reveal className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {presets.benign && (
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyPresetCard('benign', presets.benign)}
              className={`card p-4 text-left transition-all ${
                activePreset === 'benign'
                  ? 'border-2 border-benign ring-4 ring-benign/10 shadow-lift'
                  : 'hover:border-benign/60 hover:shadow-lift'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-benign" />
                  Benign Example
                </span>
                <span className="font-mono text-[10px] rounded-full bg-benign/15 text-benign px-2 py-0.5 font-semibold">
                  #{presets.benign.id}
                </span>
              </div>
              <p className="text-[11.5px] text-muted leading-snug">
                Healthy non-cancerous biopsy with low, uniform cell scores (1–2).
              </p>
            </motion.button>
          )}

          {presets.malignant && (
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyPresetCard('malignant', presets.malignant)}
              className={`card p-4 text-left transition-all ${
                activePreset === 'malignant'
                  ? 'border-2 border-malignant ring-4 ring-malignant/10 shadow-lift'
                  : 'hover:border-malignant/60 hover:shadow-lift'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-malignant" />
                  Malignant Example
                </span>
                <span className="font-mono text-[10px] rounded-full bg-malignant/15 text-malignant px-2 py-0.5 font-semibold">
                  #{presets.malignant.id}
                </span>
              </div>
              <p className="text-[11.5px] text-muted leading-snug">
                Confirmed carcinoma with severe cellular enlargement &amp; atypia.
              </p>
            </motion.button>
          )}

          {presets.borderline && (
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyPresetCard('borderline', presets.borderline)}
              className={`card p-4 text-left transition-all ${
                activePreset === 'borderline'
                  ? 'border-2 border-amber-500 ring-4 ring-amber-500/10 shadow-lift'
                  : 'hover:border-amber-500/60 hover:shadow-lift'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                  Borderline Case
                </span>
                <span className="font-mono text-[10px] rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-semibold">
                  #{presets.borderline.id}
                </span>
              </div>
              <p className="text-[11.5px] text-muted leading-snug">
                Intermediate biopsy where individual algorithms vote differently.
              </p>
            </motion.button>
          )}

          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={randomCase}
            className={`card p-4 text-left transition-all group ${
              activePreset === 'random'
                ? 'border-2 border-accent ring-4 ring-accent/10 shadow-lift'
                : 'hover:border-ink/40 hover:shadow-lift'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Dices className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:rotate-180" />
                Random Test Patient
              </span>
              <span className="font-mono text-[10px] rounded-full bg-soft px-2 py-0.5 text-muted">
                1 of 139
              </span>
            </div>
            <p className="text-[11.5px] text-muted leading-snug">
              Loads a random held-out patient and checks if the AI matches lab truth.
            </p>
          </motion.button>
        </div>
      </Reveal>

      {/* Main interactive grid: 9 features (left) & Result card (right) */}
      <div className="grid items-start gap-8 lg:grid-cols-[1.18fr_0.82fr]">
        <Reveal className="card p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-accent" />
              <div>
                <h3 className="font-display text-2xl font-semibold">9 Microscopic Cell Features</h3>
                <p className="text-xs text-muted">Tap any number (1–10) to test how each feature shifts risk</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-benign" /> 1–3 Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 4–6 Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-malignant" /> 7–10 High
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
                allowUnknown={f.key === 'bare_nuclei'}
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
