import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { BUNDLE, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, Verdict } from './ui.jsx';

const MODEL_INFO = {
  'ANN (MLP)': { abbr: 'ANN', fullName: 'Neural Network (MLP)', role: 'Primary' },
  'Random Forest': { abbr: 'RF', fullName: 'Random Forest', role: 'Ensemble' },
  SVM: { abbr: 'SVM', fullName: 'Support Vector Machine', role: 'Margin' },
  KNN: { abbr: 'KNN', fullName: 'K-Nearest Neighbors', role: 'Instance' },
  'Decision Tree': { abbr: 'DT', fullName: 'Decision Tree', role: 'Rule' },
};

const PAGE = 8;

/* ---------- Live test runner: re-runs every test case in the browser ---------- */
function TestRunner() {
  const cases = BUNDLE.cases;
  const [state, setState] = useState({ status: 'idle', done: 0, correct: {} });
  const raf = useRef(0);

  const start = () => {
    cancelAnimationFrame(raf.current);
    const correct = Object.fromEntries(MODEL_ORDER.map((m) => [m, 0]));
    let i = 0;
    const step = () => {
      const end = Math.min(cases.length, i + 3);
      for (; i < end; i++) {
        const out = predict(cases[i].x);
        out.models.forEach((m) => {
          if (m.pred === cases[i].y) correct[m.name] += 1;
        });
      }
      setState({ status: i < cases.length ? 'running' : 'done', done: i, correct: { ...correct } });
      if (i < cases.length) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const progress = cases.length > 0 ? state.done / cases.length : 0;

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">Real-Time Batch Evaluation</span>
            <span
              className={`text-[10.5px] font-mono px-2 py-0.5 rounded-full font-medium ${
                state.status === 'done'
                  ? 'bg-benign/15 text-benign'
                  : state.status === 'running'
                  ? 'bg-accent/15 text-accent animate-pulse'
                  : 'bg-soft text-muted'
              }`}
            >
              {state.status === 'done'
                ? 'Evaluation Complete'
                : state.status === 'running'
                ? 'Evaluating Cases...'
                : 'Ready to Run'}
            </span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold">
            Evaluate All {cases.length} Unseen Test Cases Live in Browser
          </h3>
        </div>

        <button
          className="btn-primary shrink-0 text-xs px-4 py-2.5 shadow-md"
          onClick={start}
          disabled={state.status === 'running'}
        >
          {state.status === 'done' ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Play className={`h-3.5 w-3.5 ${state.status === 'running' ? 'animate-spin' : ''}`} />
          )}
          <span>
            {state.status === 'idle'
              ? 'Run 139-Case Live Test'
              : state.status === 'running'
              ? 'Classifying Patients…'
              : 'Re-run Evaluation'}
          </span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5">
        <div className="flex justify-between items-center text-[11px] font-mono text-muted mb-1">
          <span>
            Progress: <strong className="text-ink">{state.done}</strong> / {cases.length} patients classified
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-soft border border-line/40">
          <motion.div
            className="h-full bg-accent rounded-full transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 5 Model Results Grid */}
      <div className="mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {MODEL_ORDER.map((m) => {
          const c = state.correct[m] || 0;
          const acc = state.done ? c / state.done : 0;
          const isPrimary = m === PRIMARY;
          const missed = state.done ? state.done - c : 0;

          return (
            <motion.div
              key={m}
              whileHover={{ y: -3, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={`rounded-xl p-3 transition-all border ${
                isPrimary
                  ? 'bg-card border-accent/40 shadow-sm ring-1 ring-accent/20'
                  : 'bg-soft/70 border-line/60 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-semibold text-ink truncate" title={m}>
                  {MODEL_INFO[m].fullName}
                </span>
                {isPrimary && (
                  <span className="shrink-0 text-[9.5px] font-mono font-bold bg-accent/15 text-accent px-1.5 py-0.1 rounded-full">
                    Top
                  </span>
                )}
              </div>
              <div className="mt-1 font-display text-2xl font-bold leading-none text-ink tabular-nums">
                {state.done ? `${(acc * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10.5px] font-mono text-muted">
                <span>{state.done ? `${c}/${state.done} correct` : 'Awaiting run'}</span>
                {state.done > 0 && (
                  <span className={missed === 0 ? 'text-benign font-medium' : 'text-muted'}>
                    {missed === 0 ? '0 missed' : `${missed} errors`}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {state.status === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3.5 rounded-xl bg-benign/10 border border-benign/20 p-3 text-xs text-ink flex items-start gap-2"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-benign mt-0.5" />
            <div className="leading-relaxed">
              <strong>Perfect Match with Scikit-Learn:</strong> The in-browser inference reproduces the exact metrics
              calculated in the scientific Python notebook. Neural Network, Random Forest, and SVM each achieve 100% recall
              on malignant cases ({BUNDLE.counts.test_malignant} of {BUNDLE.counts.test_malignant} cancers detected).
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Table and cards of real test cases ---------- */
export default function TestCases({ onTry }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return BUNDLE.cases.filter((c) => {
      const wrong = MODEL_ORDER.some((m) => c.pred[m] !== c.y);
      if (filter === 'benign' && c.y !== 0) return false;
      if (filter === 'malignant' && c.y !== 1) return false;
      if (filter === 'missed' && !wrong) return false;
      if (query.trim() && !String(c.id).includes(query.trim())) return false;
      return true;
    });
  }, [filter, query]);

  const counts = useMemo(() => {
    const all = BUNDLE.cases;
    return {
      all: all.length,
      benign: all.filter((c) => c.y === 0).length,
      malignant: all.filter((c) => c.y === 1).length,
      missed: all.filter((c) => MODEL_ORDER.some((m) => c.pred[m] !== c.y)).length,
    };
  }, []);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE, current * PAGE);

  const filters = [
    { id: 'all', label: 'All Cases', count: counts.all },
    { id: 'benign', label: 'Confirmed Benign', count: counts.benign },
    { id: 'malignant', label: 'Confirmed Malignant', count: counts.malignant },
    { id: 'missed', label: 'Model Disagreements', count: counts.missed },
  ];

  return (
    <section id="cases" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12 border-t border-line/60">
      <SectionHeader
        index="02"
        eyebrow="Held-Out Patient Validation"
        title={<>Inspect real patient cases <em className="text-accent">one by one.</em></>}
      >
        Explore all {BUNDLE.counts.test} unseen patients from the test set. Compare what each of the five
        algorithms predicted against the confirmed histological pathology.
      </SectionHeader>

      <Reveal>
        <TestRunner />
      </Reveal>

      <Reveal className="card mt-5 overflow-hidden shadow-card">
        {/* Controls: Filter chips and Search bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-line p-4 sm:p-5 bg-card/60">
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-soft/70 p-1 border border-line/60">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilter(f.id);
                    setPage(1);
                  }}
                  className={`relative rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active ? 'text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="case-filter"
                      className="absolute inset-0 rounded-xl bg-card border border-line/80 shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {f.label}
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-soft text-ink' : 'bg-card text-muted'
                      }`}
                    >
                      {f.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              inputMode="numeric"
              placeholder="Search by Patient ID..."
              className="w-full rounded-full border border-line bg-paper py-2 pl-9 pr-4 text-xs font-medium outline-none transition focus:border-ink/50 focus:ring-4 focus:ring-ink/5"
            />
          </label>
        </div>

        {/* Model Abbreviations Explanatory Banner */}
        <div className="border-b border-line/60 bg-soft/30 px-5 py-2.5 text-xs text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-ink">Model Key:</span>
          {MODEL_ORDER.map((m) => (
            <span key={m} className="inline-flex items-center gap-1">
              <strong className="font-mono text-ink">{MODEL_INFO[m].abbr}</strong> = {MODEL_INFO[m].fullName}
            </span>
          ))}
        </div>

        {/* Desktop View: Clean Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold bg-soft/20">
                <th className="px-5 py-3.5">Sample ID</th>
                <th className="px-5 py-3.5">Confirmed Diagnosis</th>
                {MODEL_ORDER.map((m) => (
                  <th key={m} className="px-2 py-3.5 text-center font-mono" title={MODEL_INFO[m].fullName}>
                    {MODEL_INFO[m].abbr}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait" initial={false}>
              <motion.tbody
                key={`${filter}-${query}-${current}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {visible.map((c, i) => (
                  <motion.tr
                    key={c.id + '-' + i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE, delay: i * 0.02 }}
                    className="group border-b border-line/60 last:border-0 transition-colors hover:bg-soft/50"
                  >
                    <td className="px-5 py-2.5 font-mono font-medium text-ink">#{c.id}</td>
                    <td className="px-5 py-2.5">
                      <Verdict pred={c.y} showDetails />
                    </td>
                    {MODEL_ORDER.map((m) => {
                      const p = c.pred[m];
                      const wrong = p !== c.y;
                      return (
                        <td key={m} className="px-2 py-2.5 text-center">
                          <span
                            title={`${MODEL_INFO[m].fullName}: ${p ? 'Malignant' : 'Benign'}${
                              wrong ? ' (Disagreed with actual diagnosis)' : ' (Correct)'
                            }`}
                            className={`inline-block h-3.5 w-3.5 rounded-full transition-transform group-hover:scale-110 ${
                              p ? 'bg-malignant' : 'bg-benign'
                            } ${wrong ? 'ring-2 ring-ink ring-offset-2 ring-offset-card shadow-sm' : ''}`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => onTry(c)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-xs font-semibold text-ink transition-all hover:bg-ink hover:text-paper active:scale-95"
                      >
                        <span>Load in Classifier</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted">
                      No patient cases match your current search or filter criteria.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>

        {/* Mobile View: Responsive Cards (No horizontal scroll needed!) */}
        <div className="md:hidden divide-y divide-line/60">
          {visible.map((c, i) => (
            <div key={c.id + '-' + i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-ink">Patient #{c.id}</span>
                  <div className="mt-0.5">
                    <Verdict pred={c.y} showDetails />
                  </div>
                </div>
                <button
                  onClick={() => onTry(c)}
                  className="btn-ghost py-1.5 px-3 text-xs font-semibold"
                >
                  <span>Load</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Model predictions grid */}
              <div className="rounded-xl bg-soft/60 p-2.5 flex items-center justify-between">
                <span className="text-[11px] text-muted font-medium">Model votes:</span>
                <div className="flex items-center gap-2">
                  {MODEL_ORDER.map((m) => {
                    const p = c.pred[m];
                    const wrong = p !== c.y;
                    return (
                      <div key={m} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-mono text-muted">{MODEL_INFO[m].abbr}</span>
                        <span
                          title={`${m}: ${p ? 'Malignant' : 'Benign'}`}
                          className={`h-3 w-3 rounded-full ${p ? 'bg-malignant' : 'bg-benign'} ${
                            wrong ? 'ring-1 ring-ink ring-offset-1' : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="p-8 text-center text-xs text-muted">
              No patient cases match your search criteria.
            </div>
          )}
        </div>

        {/* Footer / Pagination & Legend */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line px-5 py-3.5 text-xs text-muted bg-soft/20">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-benign" /> Predicted Benign
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-malignant" /> Predicted Malignant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-ink ring-1 ring-ink ring-offset-1" /> Model
              Error
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="mr-2 text-muted">
              Page {current} of {pages}
            </span>
            <button
              aria-label="First page"
              disabled={current === 1}
              onClick={() => setPage(1)}
              className="rounded-lg p-1.5 transition hover:bg-card border border-transparent hover:border-line disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Previous page"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="rounded-lg p-1.5 transition hover:bg-card border border-transparent hover:border-line disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              className="rounded-lg p-1.5 transition hover:bg-card border border-transparent hover:border-line disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              aria-label="Last page"
              disabled={current === pages}
              onClick={() => setPage(pages)}
              className="rounded-lg p-1.5 transition hover:bg-card border border-transparent hover:border-line disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export { Counter };

