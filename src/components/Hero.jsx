import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, BookOpen, Sparkles } from 'lucide-react';
import { BUNDLE, PRIMARY } from '../lib/engine.js';
import { Counter, EASE } from './ui.jsx';

// Deterministic pseudo-random so the field looks the same on every load
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function useCells() {
  return useMemo(() => {
    const r = rng(7);
    const cells = [];
    for (let i = 0; i < 24; i++) {
      const malignant = i % 5 === 0;
      const size = malignant ? 20 + r() * 12 : 13 + r() * 9;
      // Distribute organically inside the microscope radius (176)
      const angle = r() * Math.PI * 2;
      const dist = 24 + r() * 116;
      const cx = 200 + Math.cos(angle) * dist;
      const cy = 200 + Math.sin(angle) * dist;

      const dx = (r() - 0.5) * 42;
      const dy = (r() - 0.5) * 42;
      const dur = 4.5 + r() * 4.5;
      const rotDelta = (r() - 0.5) * 30;

      cells.push({
        id: i,
        cx,
        cy,
        size,
        malignant,
        rot: r() * 180,
        squash: 0.72 + r() * 0.24,
        nucleus: malignant ? 0.5 + r() * 0.15 : 0.32 + r() * 0.08,
        dx,
        dy,
        dur,
        rotDelta,
      });
    }
    return cells;
  }, []);
}

function MicroscopeField() {
  const cells = useCells();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
      className="relative mx-auto aspect-square w-full max-w-[460px]"
    >
      <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
        <defs>
          <clipPath id="field">
            <circle cx="200" cy="200" r="176" />
          </clipPath>
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgb(var(--paper))" stopOpacity="0" />
            <stop offset="100%" stopColor="rgb(var(--paper))" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        {/* outer rotating scale ring */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 200"
            to="360 200 200"
            dur="90s"
            repeatCount="indefinite"
          />
          {Array.from({ length: 72 }).map((_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const long = i % 6 === 0;
            const r1 = 186;
            const r2 = long ? 197 : 192;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * r1}
                y1={200 + Math.sin(a) * r1}
                x2={200 + Math.cos(a) * r2}
                y2={200 + Math.sin(a) * r2}
                stroke="rgb(var(--muted))"
                strokeOpacity={long ? 0.7 : 0.35}
                strokeWidth="1"
              />
            );
          })}
        </g>

        <circle cx="200" cy="200" r="176" fill="rgb(var(--card))" />

        <g clipPath="url(#field)">
          {cells.map((c) => (
            <g key={c.id} transform={`translate(${c.cx} ${c.cy})`}>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0 0; ${c.dx} ${c.dy}; ${-c.dx * 0.75} ${-c.dy * 0.6}; ${c.dx * 0.5} ${c.dy * 0.8}; 0 0`}
                  keyTimes="0; 0.3; 0.6; 0.85; 1"
                  dur={`${c.dur}s`}
                  repeatCount="indefinite"
                />
                <g transform={`rotate(${c.rot})`}>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0; ${c.rotDelta}; ${-c.rotDelta * 0.7}; 0`}
                    dur={`${c.dur * 1.25}s`}
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  <ellipse
                    rx={c.size}
                    ry={c.size * c.squash}
                    fill={c.malignant ? 'rgb(var(--malignant) / 0.15)' : 'rgb(var(--benign) / 0.12)'}
                    stroke={c.malignant ? 'rgb(var(--malignant) / 0.65)' : 'rgb(var(--benign) / 0.55)'}
                    strokeWidth="1.3"
                  />
                  <ellipse
                    cx={c.malignant ? c.size * 0.12 : 0}
                    rx={c.size * c.nucleus}
                    ry={c.size * c.nucleus * (c.malignant ? 0.78 : 0.95)}
                    fill={c.malignant ? 'rgb(var(--malignant) / 0.65)' : 'rgb(var(--accent) / 0.55)'}
                  />
                </g>
              </g>
            </g>
          ))}

          {/* scanning line */}
          <rect x="0" width="400" height="2" fill="rgb(var(--accent) / 0.35)">
            <animate
              attributeName="y"
              values="25; 375; 25"
              dur="6.5s"
              repeatCount="indefinite"
            />
          </rect>
          <circle cx="200" cy="200" r="176" fill="url(#vignette)" />
        </g>

        {/* reticle */}
        <g stroke="rgb(var(--ink) / 0.25)" strokeWidth="1">
          <line x1="200" y1="40" x2="200" y2="360" strokeDasharray="2 6" />
          <line x1="40" y1="200" x2="360" y2="200" strokeDasharray="2 6" />
        </g>
        <circle cx="200" cy="200" r="176" fill="none" stroke="rgb(var(--ink) / 0.8)" strokeWidth="1.5" />
      </svg>
    </motion.div>
  );
}

const HEADLINE = ['Reading', 'a', 'biopsy,', 'one', 'cell', 'feature', 'at', 'a', 'time.'];

export default function Hero({ onOpenGuide }) {
  const m = BUNDLE.test_metrics[PRIMARY];
  const c = BUNDLE.counts;
  const stats = [
    { value: c.total, decimals: 0, suffix: '', label: 'Patient samples', hint: 'Wisconsin FNA dataset' },
    { value: m.accuracy * 100, decimals: 1, suffix: '%', label: 'Unseen case accuracy', hint: 'Held-out test set' },
    { value: m.tp, decimals: 0, suffix: ` / ${m.tp + m.fn}`, label: 'Cancers caught', hint: '100% test recall' },
    { value: 5, decimals: 0, suffix: '', label: 'AI models compared', hint: 'Scikit-learn in-browser' },
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          {/* Introductory badge removed per Requirement #2 */}
          <h1 className="font-display text-[42px] leading-[1.03] tracking-tight sm:text-6xl lg:text-[72px]">
            {HEADLINE.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className={`inline-block ${w === 'cell' ? 'italic text-accent' : ''}`}
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.75, ease: EASE, delay: 0.05 + i * 0.05 }}
                >
                  {w}
                </motion.span>
                {i < HEADLINE.length - 1 && '\u00A0'}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.6 }}
            className="mt-6 max-w-xl text-[16px] sm:text-[17px] leading-relaxed text-muted"
          >
            An interactive research platform comparing five trained machine learning models on the Wisconsin
            Breast Cancer dataset. Adjust 9 microscopic cell features to see real-time predictions, or evaluate
            models against real patient biopsies directly in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.75 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href="#try" className="btn-primary group text-[14px]">
              <Sparkles className="h-4 w-4 text-paper/80" />
              Try an Example
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            {onOpenGuide ? (
              <button onClick={onOpenGuide} className="btn-ghost text-[14px]">
                <BookOpen className="h-4 w-4 text-muted" />
                How It Works
              </button>
            ) : (
              <a href="#cases" className="btn-ghost text-[14px]">
                <BookOpen className="h-4 w-4 text-muted" />
                How It Works
              </a>
            )}
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-7 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.85 + i * 0.07 }}
                className="group"
              >
                <div className="font-display text-3xl sm:text-4xl leading-none text-ink">
                  <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} duration={1.4} />
                </div>
                <div className="mt-2 text-xs font-medium text-ink/90">{s.label}</div>
                <div className="mt-0.5 text-[11px] text-muted">{s.hint}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <MicroscopeField />
      </div>
    </section>
  );
}
