import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Award,
  Layers,
  HelpCircle,
  Info,
  ShieldCheck,
  Target,
  Activity,
} from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, InfoBadge } from './ui.jsx';

const METRICS = [
  {
    key: 'accuracy',
    name: 'Accuracy',
    plainQuestion: 'How many predictions were correct?',
    hint: 'Overall share of test cases correctly diagnosed',
    icon: Target,
  },
  {
    key: 'recall',
    name: 'Recall (Sensitivity)',
    plainQuestion: 'How many actual cancer cases were caught?',
    hint: 'Most critical metric in oncology (0 missed cancers = 100% recall)',
    icon: ShieldCheck,
  },
  {
    key: 'precision',
    name: 'Precision',
    plainQuestion: 'When cancer was predicted, was it correct?',
    hint: 'Minimizes unnecessary patient anxiety and excess procedures',
    icon: CheckCircle2,
  },
  {
    key: 'f1',
    name: 'F1 Score',
    plainQuestion: 'Harmonic balance of precision & recall?',
    hint: 'Combined measure weighing false alarms vs missed cases',
    icon: Activity,
  },
  {
    key: 'auc',
    name: 'ROC-AUC',
    plainQuestion: 'How well are benign and malignant separated?',
    hint: 'Area under the curve across all decision thresholds (1.0 = perfect)',
    icon: TrendingUp,
  },
];

function ModelTabs({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-sm">
      {MODEL_ORDER.map((m) => {
        const active = value === m;
        const isPrimary = m === PRIMARY;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              active ? 'text-paper' : 'text-muted hover:text-ink hover:bg-soft/60'
            }`}
          >
            {active && (
              <motion.span
                layoutId="model-tab"
                className="absolute inset-0 rounded-xl bg-ink shadow-sm"
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>{m}</span>
              {isPrimary && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-paper/20 text-paper' : 'bg-accent/15 text-accent'
                  }`}
                >
                  Primary
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConfusionMatrix({ m }) {
  const cells = [
    {
      title: 'Correctly Benign (TN)',
      desc: 'Healthy patients correctly identified as non-cancerous',
      v: m.tn,
      type: 'benign',
    },
    {
      title: 'False Alarms (FP)',
      desc: 'Healthy patients flagged as malignant for extra review',
      v: m.fp,
      type: 'alarm',
    },
    {
      title: 'Missed Cancers (FN)',
      desc: 'DANGEROUS: Cancer present but model said benign',
      v: m.fn,
      type: 'missed',
      critical: true,
    },
    {
      title: 'Cancers Caught (TP)',
      desc: 'Cancerous tumours successfully detected',
      v: m.tp,
      type: 'caught',
    },
  ];

  return (
    <div className="card p-6 md:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Diagnostic Breakdown</span>
          <span className="text-[11px] font-mono text-muted">Held-Out Test Set (N=139)</span>
        </div>
        <h3 className="font-display text-2xl font-semibold">Confusion Matrix</h3>
        <p className="mt-1 text-xs text-muted leading-relaxed">
          Shows where this model got it right and where it stumbled. In cancer diagnosis, minimizing missed
          cancers is far more important than avoiding false alarms.
        </p>

        {/* 2x2 Matrix */}
        <div className="mt-5 grid grid-cols-[auto_1fr_1fr] gap-2.5 text-xs">
          <div />
          <div className="pb-1 text-center font-medium text-ink bg-soft/50 rounded-lg py-1">
            Predicted Benign
          </div>
          <div className="pb-1 text-center font-medium text-ink bg-soft/50 rounded-lg py-1">
            Predicted Malignant
          </div>

          {[0, 1].map((row) => (
            <React.Fragment key={row}>
              <div className="flex items-center justify-center pr-2 font-medium text-muted [writing-mode:vertical-rl] rotate-180 bg-soft/30 rounded-lg px-1">
                {row ? 'Actual Malignant' : 'Actual Benign'}
              </div>

              {cells.slice(row * 2, row * 2 + 2).map((c, i) => {
                const isMissed = c.type === 'missed';
                const hasMissed = isMissed && c.v > 0;
                const zeroMissed = isMissed && c.v === 0;

                return (
                  <motion.div
                    key={c.title + m.tp + m.fp}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: EASE, delay: (row * 2 + i) * 0.05 }}
                    className={`rounded-xl p-4 border transition-all ${
                      c.type === 'benign'
                        ? 'bg-benign/10 border-benign/30'
                        : c.type === 'caught'
                        ? 'bg-malignant/10 border-malignant/30'
                        : hasMissed
                        ? 'bg-malignant/20 border-malignant text-malignant ring-2 ring-malignant/30'
                        : zeroMissed
                        ? 'bg-benign/15 border-benign/40 text-benign'
                        : 'bg-soft/70 border-line/60'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-4xl sm:text-5xl font-bold leading-none text-ink">
                        <Counter value={c.v} duration={0.7} />
                      </div>
                      {zeroMissed && (
                        <span className="text-[11px] font-bold text-benign flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Perfect
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-semibold text-ink text-[12px]">{c.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted leading-tight">{c.desc}</div>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-line text-[11px] text-muted">
        <strong className="text-ink">Key takeaway: </strong>
        {m.fn === 0 ? (
          <span className="text-benign font-medium">
            This model achieved 0 missed cancers out of all 39 cancer patients in the test set.
          </span>
        ) : (
          <span className="text-malignant font-medium">
            This model missed {m.fn} malignant tumour(s) on the test set.
          </span>
        )}
      </div>
    </div>
  );
}

function RocChart({ selected }) {
  const S = 260;
  const P = 36;
  const x = (v) => P + v * S;
  const y = (v) => P + (1 - v) * S;
  const toPath = (pts) =>
    pts.map(([fx, ty], i) => `${i ? 'L' : 'M'}${x(fx).toFixed(1)},${y(ty).toFixed(1)}`).join(' ');

  const currentAuc = BUNDLE.test_metrics[selected].auc;

  return (
    <div className="card p-6 md:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Sensitivity vs. Specificity</span>
          <span className="text-[11px] font-mono text-muted">ROC Analysis</span>
        </div>
        <h3 className="font-display text-2xl font-semibold">ROC Curve</h3>
        <p className="mt-1 text-xs text-muted leading-relaxed">
          Curves that arch closer to the top-left corner indicate superior diagnostic power, maximizing true
          cancer detection while keeping false alarms near zero.
        </p>

        {/* SVG Chart */}
        <div className="mt-3 flex justify-center">
          <svg viewBox={`0 0 ${S + P * 2} ${S + P * 2}`} className="w-full max-w-[380px] drop-shadow-sm">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeDasharray="2 3" />
                <line y1={y(0)} y2={y(1)} x1={x(t)} x2={x(t)} stroke="rgb(var(--line))" strokeDasharray="2 3" />
                <text
                  x={x(t)}
                  y={y(0) + 16}
                  textAnchor="middle"
                  fontSize="9"
                  className="fill-muted font-mono"
                >
                  {t}
                </text>
                <text
                  x={x(0) - 8}
                  y={y(t) + 3}
                  textAnchor="end"
                  fontSize="9"
                  className="fill-muted font-mono"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* Random 50/50 Baseline */}
            <line
              x1={x(0)}
              y1={y(0)}
              x2={x(1)}
              y2={y(1)}
              stroke="rgb(var(--muted))"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />

            {/* Other Models (Muted) */}
            {MODEL_ORDER.filter((m) => m !== selected).map((m) => (
              <path
                key={m}
                d={toPath(BUNDLE.roc[m])}
                fill="none"
                stroke="rgb(var(--muted))"
                strokeOpacity="0.3"
                strokeWidth="1.5"
              />
            ))}

            {/* Selected Model Curve */}
            <motion.path
              key={selected}
              d={toPath(BUNDLE.roc[selected])}
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.0, ease: EASE }}
            />

            <text x={x(0.5)} y={S + P * 2 - 2} textAnchor="middle" fontSize="10" className="fill-muted font-medium">
              False Alarm Rate (1 - Specificity)
            </text>
            <text
              transform={`translate(10 ${y(0.5)}) rotate(-90)`}
              textAnchor="middle"
              fontSize="10"
              className="fill-muted font-medium"
            >
              True Detection Rate (Sensitivity)
            </text>
          </svg>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>
          Selected: <strong className="text-ink">{selected}</strong>
        </span>
        <span className="font-mono">
          ROC-AUC Score: <strong className="text-ink text-sm">{currentAuc.toFixed(4)}</strong> / 1.0000
        </span>
      </div>
    </div>
  );
}

function Importance() {
  const rows = FEATURES.map((f, i) => ({ label: f.label, v: BUNDLE.importance[i] })).sort((a, b) => b.v - a.v);
  const max = rows[0].v;
  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Feature Contribution</span>
        <span className="text-[11px] font-mono text-muted">Random Forest Gini Importance</span>
      </div>
      <h3 className="font-display text-2xl font-semibold">Which Features Matter Most?</h3>
      <p className="mt-1 text-xs text-muted leading-relaxed">
        The Random Forest ensemble automatically measures which cellular characteristics are most decisive
        when separating malignant from benign tissue.
      </p>

      <ul className="mt-5 space-y-3">
        {rows.map((r, i) => (
          <li key={r.label} className="grid grid-cols-[140px_1fr_48px] sm:grid-cols-[180px_1fr_54px] items-center gap-3 text-xs">
            <span className="truncate text-ink font-medium" title={r.label}>
              {r.label}
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-soft border border-line/40">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.v / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE, delay: i * 0.05 }}
              />
            </div>
            <span className="text-right font-mono font-semibold text-ink">{(r.v * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-3 border-t border-line text-[11px] text-muted">
        <strong className="text-ink">Key insight: </strong>
        Cell size and shape uniformity alone contribute over <strong>61%</strong> of all diagnostic splitting power.
      </div>
    </div>
  );
}

function CompareTable({ selected, onSelect }) {
  const cols = [
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'recall', label: 'Recall' },
    { key: 'precision', label: 'Precision' },
    { key: 'f1', label: 'F1 Score' },
    { key: 'auc', label: 'ROC-AUC' },
  ];
  const best = Object.fromEntries(
    cols.map(({ key }) => [key, Math.max(...MODEL_ORDER.map((m) => BUNDLE.test_metrics[m][key]))])
  );

  return (
    <div className="card overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Comprehensive Benchmark</span>
          <span className="text-[11px] font-mono text-muted">Unseen Test Set</span>
        </div>
        <h3 className="font-display text-2xl font-semibold">Side-by-Side Model Comparison</h3>
        <p className="mt-1 text-xs text-muted">
          Click any row to switch the active model and view its individual confusion matrix and ROC curve above.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs">
          <thead>
            <tr className="border-y border-line text-left text-[11px] uppercase tracking-wider text-muted font-semibold bg-soft/30">
              <th className="px-6 py-3.5">Model</th>
              {cols.map(({ label }) => (
                <th key={label} className="px-3 py-3.5 text-right">
                  {label}
                </th>
              ))}
              <th className="px-3 py-3.5 text-right">Missed Cancers</th>
              <th className="px-6 py-3.5 text-right">False Alarms</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_ORDER.map((m) => {
              const t = BUNDLE.test_metrics[m];
              const active = m === selected;
              const isPrimary = m === PRIMARY;

              return (
                <tr
                  key={m}
                  onClick={() => onSelect(m)}
                  className={`cursor-pointer border-b border-line/60 transition-colors last:border-0 ${
                    active ? 'bg-soft font-medium' : 'hover:bg-soft/40'
                  }`}
                >
                  <td className="px-6 py-3.5 font-semibold text-ink">
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ scale: active ? 1 : 0 }}
                        className="h-2 w-2 rounded-full bg-accent"
                      />
                      <span>{m}</span>
                      {isPrimary && (
                        <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.2 font-mono text-[10px] font-bold">
                          Primary
                        </span>
                      )}
                    </span>
                  </td>
                  {cols.map(({ key }) => {
                    const isBest = t[key] === best[key];
                    return (
                      <td
                        key={key}
                        className={`px-3 py-3.5 text-right font-mono ${
                          isBest ? 'font-bold text-ink' : 'text-muted'
                        }`}
                      >
                        {key === 'auc' ? t[key].toFixed(4) : `${(t[key] * 100).toFixed(1)}%`}
                        {isBest && <span className="ml-1 text-[10px] text-benign">★</span>}
                      </td>
                    );
                  })}
                  <td
                    className={`px-3 py-3.5 text-right font-mono font-bold ${
                      t.fn === 0 ? 'text-benign' : 'text-malignant'
                    }`}
                  >
                    {t.fn}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-muted">{t.fp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-line text-[11px] text-muted flex items-center justify-between bg-soft/20">
        <span>★ indicates top performer for that evaluation metric</span>
        <span>Held-out evaluation: 139 patients (98.6% top accuracy)</span>
      </div>
    </div>
  );
}

export default function Performance() {
  const [model, setModel] = useState(PRIMARY);
  const t = BUNDLE.test_metrics[model];
  const cv = BUNDLE.cv_metrics[model];

  return (
    <section id="performance" className="border-y border-line bg-card/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeader
          index="03"
          eyebrow="Evaluation &amp; Benchmarks"
          title={<>How well do <em className="text-accent">the five models</em> perform?</>}
        >
          Evaluated against {BUNDLE.counts.test} strictly held-out patient biopsies ({BUNDLE.counts.test_benign} benign, {BUNDLE.counts.test_malignant} malignant).
          Explore individual accuracy, sensitivity, confusion matrices, and ROC curves below.
        </SectionHeader>

        {/* Model Selection Tabs */}
        <Reveal className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <ModelTabs value={model} onChange={setModel} />
            <div className="text-xs text-muted font-mono">
              Active Model: <strong className="text-ink">{model}</strong>
            </div>
          </div>
        </Reveal>

        {/* 5 Metric Cards */}
        <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {METRICS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="card p-5 hover:shadow-lift transition-all">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold text-ink">{item.name}</span>
                  <Icon className="h-4 w-4 text-accent/80" />
                </div>
                <div className="mt-1 font-display text-4xl font-bold leading-none text-ink">
                  {item.key === 'auc' ? (
                    <Counter value={t[item.key]} decimals={4} duration={0.8} />
                  ) : (
                    <Counter value={t[item.key] * 100} decimals={1} suffix="%" duration={0.8} />
                  )}
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-ink/90 leading-tight">
                  {item.plainQuestion}
                </div>
                <div className="mt-1 text-[10px] text-muted leading-tight">{item.hint}</div>
              </div>
            );
          })}
        </Reveal>

        {/* Training hyperparameter notes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={model}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 rounded-xl bg-soft/50 border border-line p-3 font-mono text-[11px] text-muted flex flex-wrap items-center justify-between gap-2"
          >
            <span>
              <strong>5-Fold Cross-Validation on Train Set:</strong> Recall {(cv.recall * 100).toFixed(1)}% ±{' '}
              {(cv.recall_sd * 100).toFixed(1)}% · ROC-AUC {cv.auc.toFixed(3)}
            </span>
            <span>
              <strong>Tuned Hyperparameters:</strong> {BUNDLE.params[model]}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Confusion Matrix & ROC Curve */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <ConfusionMatrix m={t} />
          </Reveal>
          <Reveal delay={0.08}>
            <RocChart selected={model} />
          </Reveal>
        </div>

        {/* Side-by-side table & Feature Importance */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr] min-w-0">
          <Reveal className="min-w-0">
            <CompareTable selected={model} onSelect={setModel} />
          </Reveal>
          <Reveal delay={0.08} className="min-w-0">
            <Importance />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

