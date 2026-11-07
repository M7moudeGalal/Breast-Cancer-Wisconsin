import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader } from './ui.jsx';

const METRICS = [
  ['accuracy', 'Accuracy', 'Share of all test cases classified correctly'],
  ['recall', 'Recall', 'Share of cancers that were caught'],
  ['precision', 'Precision', 'Share of “malignant” answers that were right'],
  ['f1', 'F1 score', 'Balance of precision and recall'],
  ['auc', 'ROC-AUC', 'How well scores separate the two classes'],
];

function ModelTabs({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-line bg-card p-1">
      {MODEL_ORDER.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`relative rounded-full px-4 py-2 text-[13px] transition-colors ${value === m ? 'text-paper' : 'text-muted hover:text-ink'}`}
        >
          {value === m && (
            <motion.span layoutId="model-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />
          )}
          <span className="relative">{m}</span>
        </button>
      ))}
    </div>
  );
}

function ConfusionMatrix({ m }) {
  const cells = [
    { label: 'Correctly benign', v: m.tn, tone: 'benign', strong: true },
    { label: 'False alarm', v: m.fp, tone: 'muted' },
    { label: 'Missed cancer', v: m.fn, tone: 'malignant', warn: true },
    { label: 'Cancer caught', v: m.tp, tone: 'malignant', strong: true },
  ];
  return (
    <div className="card p-6">
      <div className="eyebrow mb-1">Confusion matrix</div>
      <h3 className="font-display text-2xl">Where it’s right and wrong</h3>
      <div className="mt-5 grid grid-cols-[auto_1fr_1fr] gap-2 text-[12px]">
        <div />
        <div className="pb-1 text-center text-muted">Predicted benign</div>
        <div className="pb-1 text-center text-muted">Predicted malignant</div>
        {[0, 1].map((row) => (
          <React.Fragment key={row}>
            <div className="flex items-center pr-2 text-muted [writing-mode:vertical-rl] rotate-180 justify-center">
              {row ? 'Actually malignant' : 'Actually benign'}
            </div>
            {cells.slice(row * 2, row * 2 + 2).map((c, i) => (
              <motion.div
                key={c.label + m.tp + m.fp}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE, delay: (row * 2 + i) * 0.06 }}
                className={`rounded-xl p-4 ${
                  c.strong
                    ? c.tone === 'benign'
                      ? 'bg-benign/10'
                      : 'bg-malignant/10'
                    : c.warn && c.v > 0
                      ? 'bg-malignant/20 ring-1 ring-malignant/40'
                      : 'bg-soft'
                }`}
              >
                <div className="font-display text-4xl leading-none">
                  <Counter value={c.v} duration={0.7} />
                </div>
                <div className="mt-1.5 text-muted">{c.label}</div>
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function RocChart({ selected }) {
  const S = 260;
  const P = 34;
  const x = (v) => P + v * S;
  const y = (v) => P + (1 - v) * S;
  const toPath = (pts) => pts.map(([fx, ty], i) => `${i ? 'L' : 'M'}${x(fx).toFixed(1)},${y(ty).toFixed(1)}`).join(' ');
  return (
    <div className="card p-6">
      <div className="eyebrow mb-1">ROC curve · test set</div>
      <h3 className="font-display text-2xl">Closer to the top-left is better</h3>
      <svg viewBox={`0 0 ${S + P * 2} ${S + P * 2}`} className="mt-3 w-full max-w-[420px]">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" />
            <line y1={y(0)} y2={y(1)} x1={x(t)} x2={x(t)} stroke="rgb(var(--line))" />
            <text x={x(t)} y={y(0) + 16} textAnchor="middle" fontSize="9" className="fill-muted font-mono">{t}</text>
            <text x={x(0) - 8} y={y(t) + 3} textAnchor="end" fontSize="9" className="fill-muted font-mono">{t}</text>
          </g>
        ))}
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="rgb(var(--muted))" strokeDasharray="4 4" strokeOpacity="0.6" />
        {MODEL_ORDER.filter((m) => m !== selected).map((m) => (
          <path key={m} d={toPath(BUNDLE.roc[m])} fill="none" stroke="rgb(var(--muted))" strokeOpacity="0.35" strokeWidth="1.2" />
        ))}
        <motion.path
          key={selected}
          d={toPath(BUNDLE.roc[selected])}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2.6"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <text x={x(0.5)} y={S + P * 2 - 2} textAnchor="middle" fontSize="10" className="fill-muted">False positive rate</text>
        <text transform={`translate(10 ${y(0.5)}) rotate(-90)`} textAnchor="middle" fontSize="10" className="fill-muted">True positive rate</text>
      </svg>
      <div className="mt-1 text-[12px] text-muted">
        Grey lines are the other four models. AUC for {selected}:{' '}
        <span className="font-mono text-ink">{BUNDLE.test_metrics[selected].auc.toFixed(4)}</span>
      </div>
    </div>
  );
}

function Importance() {
  const rows = FEATURES.map((f, i) => ({ label: f.label, v: BUNDLE.importance[i] })).sort((a, b) => b.v - a.v);
  const max = rows[0].v;
  return (
    <div className="card p-6">
      <div className="eyebrow mb-1">Random forest</div>
      <h3 className="font-display text-2xl">Which features matter most</h3>
      <ul className="mt-5 space-y-3">
        {rows.map((r, i) => (
          <li key={r.label} className="grid grid-cols-[150px_1fr_48px] items-center gap-3 text-[13px]">
            <span className="truncate text-muted">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-soft">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.v / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.06 }}
              />
            </div>
            <span className="text-right font-mono text-[12px]">{(r.v * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareTable({ selected, onSelect }) {
  const cols = [
    ['accuracy', 'Accuracy'],
    ['recall', 'Recall'],
    ['precision', 'Precision'],
    ['f1', 'F1'],
    ['auc', 'ROC-AUC'],
  ];
  const best = Object.fromEntries(cols.map(([k]) => [k, Math.max(...MODEL_ORDER.map((m) => BUNDLE.test_metrics[m][k]))]));
  return (
    <div className="card overflow-hidden">
      <div className="p-6 pb-3">
        <div className="eyebrow mb-1">All models · test set</div>
        <h3 className="font-display text-2xl">Side by side</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-y border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-6 py-3 font-medium">Model</th>
              {cols.map(([, l]) => (
                <th key={l} className="px-3 py-3 text-right font-medium">{l}</th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Missed cancers</th>
              <th className="px-6 py-3 text-right font-medium">False alarms</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_ORDER.map((m) => {
              const t = BUNDLE.test_metrics[m];
              const active = m === selected;
              return (
                <tr
                  key={m}
                  onClick={() => onSelect(m)}
                  className={`cursor-pointer border-b border-line transition-colors last:border-0 ${active ? 'bg-soft' : 'hover:bg-soft/60'}`}
                >
                  <td className="px-6 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ scale: active ? 1 : 0 }} className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {m}
                      {m === PRIMARY && <span className="rounded-full border border-line px-1.5 font-mono text-[10px] text-muted">main</span>}
                    </span>
                  </td>
                  {cols.map(([k]) => (
                    <td key={k} className={`px-3 py-3 text-right font-mono ${t[k] === best[k] ? 'font-semibold text-ink' : 'text-muted'}`}>
                      {k === 'auc' ? t[k].toFixed(4) : `${(t[k] * 100).toFixed(1)}%`}
                    </td>
                  ))}
                  <td className={`px-3 py-3 text-right font-mono ${t.fn ? 'text-malignant' : 'text-benign'}`}>{t.fn}</td>
                  <td className="px-6 py-3 text-right font-mono text-muted">{t.fp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-4 text-[12px] text-muted">Bold = best in column. Click a row to inspect that model.</p>
    </div>
  );
}

export default function Performance() {
  const [model, setModel] = useState(PRIMARY);
  const t = BUNDLE.test_metrics[model];
  const cv = BUNDLE.cv_metrics[model];

  return (
    <section id="performance" className="border-y border-line bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <SectionHeader index="03" eyebrow="Results" title={<>How well do <em className="text-accent">the models</em> perform?</>}>
          Measured on {BUNDLE.counts.test} unseen patients ({BUNDLE.counts.test_benign} benign, {BUNDLE.counts.test_malignant} malignant).
          In cancer screening, missing a cancer is the costliest mistake, so recall matters most.
        </SectionHeader>

        <Reveal className="mb-6">
          <ModelTabs value={model} onChange={setModel} />
        </Reveal>

        <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {METRICS.map(([k, label, hint]) => (
            <div key={k} className="card p-5">
              <div className="text-[12px] text-muted">{label}</div>
              <div className="mt-2 font-display text-[40px] leading-none">
                {k === 'auc' ? <Counter value={t[k]} decimals={3} duration={0.9} /> : <Counter value={t[k] * 100} decimals={1} suffix="%" duration={0.9} />}
              </div>
              <div className="mt-2 text-[11px] leading-snug text-muted">{hint}</div>
            </div>
          ))}
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.p
            key={model}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 font-mono text-[12px] text-muted"
          >
            5-fold cross-validation on training data: recall {(cv.recall * 100).toFixed(1)}% ± {(cv.recall_sd * 100).toFixed(1)} · ROC-AUC {cv.auc.toFixed(3)} · settings: {BUNDLE.params[model]}
          </motion.p>
        </AnimatePresence>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ConfusionMatrix m={t} />
          </Reveal>
          <Reveal delay={0.08}>
            <RocChart selected={model} />
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <CompareTable selected={model} onSelect={setModel} />
          </Reveal>
          <Reveal delay={0.08}>
            <Importance />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

