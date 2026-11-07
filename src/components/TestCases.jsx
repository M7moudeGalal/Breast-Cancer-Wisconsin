import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Search, RotateCcw } from 'lucide-react';
import { BUNDLE, MODEL_ORDER, predict } from '../lib/engine.js';
import { Counter, EASE, Reveal, SectionHeader, Verdict } from './ui.jsx';

const ABBR = { 'ANN (MLP)': 'ANN', 'Random Forest': 'RF', SVM: 'SVM', KNN: 'KNN', 'Decision Tree': 'DT' };
const PAGE = 10;

/* ---------- live test runner: re-runs every test case in the browser ---------- */
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

  const progress = state.done / cases.length;

  return (
    <div className="card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <div className="eyebrow mb-1">Live test</div>
          <h3 className="font-display text-3xl">Run all {cases.length} test cases</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            These patients were never shown to the models during training. Press run to classify every one of
            them right here and count how many each model gets right.
          </p>
        </div>
        <button className="btn-primary" onClick={start} disabled={state.status === 'running'}>
          {state.status === 'done' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {state.status === 'idle' ? 'Run test' : state.status === 'running' ? 'Running…' : 'Run again'}
        </button>
      </div>

      <div className="mt-6 h-1 overflow-hidden rounded-full bg-soft">
        <motion.div className="h-full bg-ink" animate={{ width: `${progress * 100}%` }} transition={{ ease: 'linear', duration: 0.05 }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-muted">
        <span>{state.done} / {cases.length} classified</span>
        <span>{state.status === 'done' ? 'complete' : state.status === 'running' ? 'running' : 'ready'}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {MODEL_ORDER.map((m) => {
          const c = state.correct[m] || 0;
          const acc = state.done ? c / state.done : 0;
          return (
            <div key={m} className="rounded-xl bg-soft p-4">
              <div className="text-[12px] text-muted">{m}</div>
              <div className="mt-1 font-display text-3xl leading-none tabular-nums">
                {state.done ? `${(acc * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted">
                {state.done ? `${c} / ${state.done} correct` : 'waiting'}
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {state.status === 'done' && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-[13px] text-muted"
          >
            These numbers match the notebook’s test results exactly — the browser runs the same trained models.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- table of real test cases ---------- */
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
    ['all', 'All'],
    ['benign', 'Benign'],
    ['malignant', 'Malignant'],
    ['missed', 'At least one model wrong'],
  ];

  return (
    <section id="cases" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeader index="02" eyebrow="Test it" title={<>Check it against <em className="text-accent">real patients.</em></>}>
        {BUNDLE.counts.test} held-out cases with a confirmed diagnosis. Each dot is one model’s answer. Open any
        case to load it into the classifier above.
      </SectionHeader>

      <Reveal>
        <TestRunner />
      </Reveal>

      <Reveal className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="flex flex-wrap gap-1 rounded-full bg-soft p-1">
            {filters.map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setFilter(id);
                  setPage(1);
                }}
                className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  filter === id ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {filter === id && (
                  <motion.span layoutId="case-filter" className="absolute inset-0 rounded-full bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                )}
                <span className="relative">
                  {label} <span className="font-mono text-[11px] text-muted">{counts[id]}</span>
                </span>
              </button>
            ))}
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              inputMode="numeric"
              placeholder="Search sample ID"
              className="w-52 rounded-full border border-line bg-paper py-2 pl-9 pr-4 text-[13px] outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Sample</th>
                <th className="px-5 py-3 font-medium">Actual</th>
                {MODEL_ORDER.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-mono font-medium" title={m}>
                    {ABBR[m]}
                  </th>
                ))}
                <th className="px-5 py-3" />
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: i * 0.025 }}
                    className="group border-b border-line last:border-0 transition-colors hover:bg-soft/60"
                  >
                    <td className="px-5 py-3 font-mono text-muted">#{c.id}</td>
                    <td className="px-5 py-3">
                      <Verdict pred={c.y} />
                    </td>
                    {MODEL_ORDER.map((m) => {
                      const p = c.pred[m];
                      const wrong = p !== c.y;
                      return (
                        <td key={m} className="px-2 py-3 text-center">
                          <span
                            title={`${m}: ${p ? 'malignant' : 'benign'}${wrong ? ' (wrong)' : ''}`}
                            className={`inline-block h-3 w-3 rounded-full ${p ? 'bg-malignant' : 'bg-benign'} ${
                              wrong ? 'ring-2 ring-ink ring-offset-2 ring-offset-card' : ''
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onTry(c)}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium text-ink transition-all hover:bg-ink hover:text-paper"
                      >
                        Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted">
                      No cases match this search.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[12px] text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-benign" /> benign
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-malignant" /> malignant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-ink ring-offset-1 ring-offset-card" /> wrong answer
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[
              [ChevronsLeft, 1, 'First page'],
              [ChevronLeft, current - 1, 'Previous page'],
            ].map(([Icon, target, label]) => (
              <button
                key={label}
                aria-label={label}
                disabled={current === 1}
                onClick={() => setPage(target)}
                className="rounded-full p-1.5 transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <span className="px-2 font-mono">
              {current} / {pages}
            </span>
            {[
              [ChevronRight, current + 1, 'Next page'],
              [ChevronsRight, pages, 'Last page'],
            ].map(([Icon, target, label]) => (
              <button
                key={label}
                aria-label={label}
                disabled={current === pages}
                onClick={() => setPage(target)}
                className="rounded-full p-1.5 transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export { Counter };

