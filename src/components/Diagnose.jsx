import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Dices, FlaskConical, RotateCcw, X, HelpCircle } from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, pct } from './ui.jsx';

const SHORT = { 'ANN (MLP)': 'Neural network (ANN)', 'Random Forest': 'Random forest', SVM: 'Support vector machine', KNN: 'K-nearest neighbours', 'Decision Tree': 'Decision tree' };

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
function ScoreRow({ feature, value, onChange, allowUnknown }) {
  return (
    <div className="border-b border-line py-4 last:border-0">
      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[14px] font-medium">{feature.label}</div>
          <div className="text-xs text-muted">{feature.hint}</div>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={String(value)}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-[2ch] text-right font-display text-2xl leading-none"
          >
            {value === null ? '?' : value}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={feature.label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={`relative h-9 flex-1 rounded-md font-mono text-[12px] transition-colors ${
                active ? '' : 'bg-soft text-muted hover:bg-line hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`pick-${feature.key}`}
                  className="absolute inset-0 rounded-md bg-ink"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
              <span className={`relative ${active ? 'text-paper' : ''}`}>{n}</span>
            </button>
          );
        })}
        {allowUnknown && (
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            onClick={() => onChange(null)}
            title="Unknown — the model fills it with the training median"
            className={`relative h-9 w-10 rounded-md font-mono text-[12px] transition-colors ${
              value === null ? '' : 'bg-soft text-muted hover:bg-line hover:text-ink'
            }`}
          >
            {value === null && (
              <motion.span
                layoutId={`pick-${feature.key}`}
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className={`relative ${value === null ? 'text-paper' : ''}`}>?</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- semicircle gauge ---------- */
function Gauge({ p, mal }) {
  const color = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';
  const d = 'M 20 110 A 90 90 0 0 1 200 110';
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <svg viewBox="0 0 220 120" className="w-full">
        <path d={d} fill="none" stroke="rgb(var(--soft))" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.005, p), stroke: color }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
        {[0, 0.5, 1].map((t) => {
          const a = Math.PI * (1 - t);
          return (
            <text
              key={t}
              x={110 + Math.cos(a) * 72}
              y={110 - Math.sin(a) * 72 + 4}
              textAnchor="middle"
              className="fill-muted font-mono"
              fontSize="9"
            >
              {t * 100}%
            </text>
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="font-display text-5xl leading-none" style={{ color }}>
          <Counter value={p * 100} decimals={1} suffix="%" duration={0.8} />
        </div>
        <div className="mt-1 text-[11px] text-muted">chance of malignancy</div>
      </div>
    </div>
  );
}

/* ---------- result card ---------- */
function ResultCard({ result, loadedCase }) {
  const { primary, models } = result;
  const mal = primary.pred === 1;
  const agree = models.filter((m) => m.pred === primary.pred).length;
  const correct = loadedCase ? loadedCase.y === primary.pred : null;

  return (
    <div className="card overflow-hidden">
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
                correct ? 'border-benign/20 bg-benign/[0.07]' : 'border-malignant/20 bg-malignant/[0.07]'
              }`}
            >
              <div>
                <span className="text-muted">Real test case </span>
                <span className="font-mono">#{loadedCase.id}</span>
                <span className="text-muted"> · actual diagnosis: </span>
                <span className={`font-medium ${loadedCase.y ? 'text-malignant' : 'text-benign'}`}>
                  {loadedCase.y ? 'Malignant' : 'Benign'}
                </span>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  correct ? 'bg-benign text-paper' : 'bg-malignant text-paper'
                }`}
              >
                {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {correct ? 'Correct' : 'Wrong'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        <div className="eyebrow mb-1">Result</div>
        <div className="relative h-[52px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3
              key={mal ? 'm' : 'b'}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={`font-display text-[44px] leading-none ${mal ? 'text-malignant' : 'text-benign'}`}
            >
              {mal ? 'Likely malignant' : 'Likely benign'}
            </motion.h3>
          </AnimatePresence>
        </div>

        <div className="mt-6">
          <Gauge p={primary.score} mal={mal} />
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-soft px-4 py-3">
          <div className="text-[13px]">
            <span className="font-medium">
              {agree} of 5 models
            </span>
            <span className="text-muted"> agree</span>
          </div>
          <div className="flex gap-1.5">
            {models.map((m, i) => (
              <motion.span
                key={m.name + m.pred}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: i * 0.05 }}
                title={`${m.name}: ${m.pred ? 'malignant' : 'benign'}`}
                className={`h-3.5 w-3.5 rounded-full ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
              />
            ))}
          </div>
        </div>

        <ul className="mt-5 space-y-3.5">
          {models.map((m) => (
            <li key={m.name}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2">
                  {SHORT[m.name]}
                  {m.name === PRIMARY && (
                    <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px] text-muted">
                      main
                    </span>
                  )}
                </span>
                <span className={`font-mono text-xs ${m.pred ? 'text-malignant' : 'text-benign'}`}>
                  {m.pred ? 'malignant' : 'benign'} · {pct(m.score, 0)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-soft">
                <motion.div
                  className={`h-full rounded-full ${m.pred ? 'bg-malignant' : 'bg-benign'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(1.5, m.score * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                />
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[11px] leading-relaxed text-muted">
          SVM shows a scaled decision score, not a calibrated probability. Educational project — not a medical
          device.
        </p>
      </div>
    </div>
  );
}

/* ---------- where this sample sits vs. the training averages ---------- */
function Profile({ values }) {
  const pos = (v) => `${((v - 1) / 9) * 100}%`;
  return (
    <div className="card p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">Compared with training data</div>
          <h3 className="font-display text-3xl">Where this sample sits</h3>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded bg-benign" /> benign average
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded bg-malignant" /> malignant average
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-paper bg-ink ring-1 ring-ink" /> this sample
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {FEATURES.map((f, i) => (
          <div key={f.key} className="grid grid-cols-[150px_1fr] items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="truncate text-[13px] text-muted">{f.label}</div>
            <div className="relative h-6">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              {Array.from({ length: 10 }).map((_, k) => (
                <div key={k} className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-line" style={{ left: `${(k / 9) * 100}%` }} />
              ))}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="absolute top-1/2 h-4 w-1 rounded bg-benign"
                style={{ left: pos(BUNDLE.means.benign[i]), x: '-50%', y: '-50%' }}
              />
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="absolute top-1/2 h-4 w-1 rounded bg-malignant"
                style={{ left: pos(BUNDLE.means.malignant[i]), x: '-50%', y: '-50%' }}
              />
              <motion.div
                className="absolute top-1/2 h-4 w-4 rounded-full border-2 border-card bg-ink shadow"
                style={{ x: '-50%', y: '-50%' }}
                initial={false}
                animate={{ left: pos(values[i]) }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[150px_1fr] gap-4 sm:grid-cols-[200px_1fr]">
          <div />
          <div className="flex justify-between font-mono text-[10px] text-muted">
            {Array.from({ length: 10 }, (_, k) => (
              <span key={k}>{k + 1}</span>
            ))}
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

  return (
    <section id="try" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeader index="01" eyebrow="Try it" title={<>Score a sample, <em className="text-accent">get an answer.</em></>}>
        Pick a value from 1 (normal) to 10 (most abnormal) for each feature. The result updates instantly. Not sure
        where to start? Load a real case from the test set and check whether the models get it right.
      </SectionHeader>

      <Reveal className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted">Quick start:</span>
        {presets.benign && (
          <button className="chip" onClick={() => loadCase(presets.benign)}>
            <span className="h-2 w-2 rounded-full bg-benign" /> Benign example
          </button>
        )}
        {presets.malignant && (
          <button className="chip" onClick={() => loadCase(presets.malignant)}>
            <span className="h-2 w-2 rounded-full bg-malignant" /> Malignant example
          </button>
        )}
        {presets.borderline && (
          <button className="chip" onClick={() => loadCase(presets.borderline)}>
            <FlaskConical className="h-3.5 w-3.5" /> Tricky case
          </button>
        )}
        <button className="chip" onClick={randomCase}>
          <motion.span whileTap={{ rotate: 180 }} className="inline-flex">
            <Dices className="h-3.5 w-3.5" />
          </motion.span>
          Random test case
        </button>
        <button className="chip text-muted" onClick={() => setValues(Array(9).fill(1), null)}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="card px-6 py-2">
          {FEATURES.map((f, i) => (
            <ScoreRow
              key={f.key}
              feature={f}
              value={values[i]}
              onChange={(v) => setOne(i, v)}
              allowUnknown={f.key === 'bare_nuclei'}
            />
          ))}
          <div className="flex items-center gap-2 py-3 text-xs text-muted">
            <HelpCircle className="h-3.5 w-3.5" />
            “?” on Bare nuclei means unknown — the model fills it with the training median, like the real pipeline.
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:sticky lg:top-24">
          <ResultCard result={result} loadedCase={loadedCase} />
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <Profile values={result.filled} />
      </Reveal>
    </section>
  );
}
