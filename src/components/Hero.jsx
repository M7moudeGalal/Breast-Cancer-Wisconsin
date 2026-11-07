import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ListChecks } from 'lucide-react';
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
    for (let i = 0; i < 22; i++) {
      const malignant = i % 5 === 0;
      const size = malignant ? 22 + r() * 14 : 14 + r() * 9;
      cells.push({
        id: i,
        cx: 40 + r() * 320,
        cy: 40 + r() * 320,
        size,
        malignant,
        rot: r() * 180,
        squash: 0.72 + r() * 0.24,
        nucleus: malignant ? 0.5 + r() * 0.15 : 0.32 + r() * 0.08,
        dx: (r() - 0.5) * 26,
        dy: (r() - 0.5) * 26,
        dur: 9 + r() * 8,
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
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        >
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
        </motion.g>

        <circle cx="200" cy="200" r="176" fill="rgb(var(--card))" />

        <g clipPath="url(#field)">
          {cells.map((c) => (
            <motion.g
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, c.dx, 0], y: [0, c.dy, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 0.4 + c.id * 0.04 },
                x: { duration: c.dur, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: c.dur * 1.2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <g transform={`translate(${c.cx} ${c.cy}) rotate(${c.rot})`}>
                <ellipse
                  rx={c.size}
                  ry={c.size * c.squash}
                  fill={c.malignant ? 'rgb(var(--malignant) / 0.10)' : 'rgb(var(--benign) / 0.09)'}
                  stroke={c.malignant ? 'rgb(var(--malignant) / 0.55)' : 'rgb(var(--benign) / 0.45)'}
                  strokeWidth="1.2"
                />
                <ellipse
                  cx={c.malignant ? c.size * 0.12 : 0}
                  rx={c.size * c.nucleus}
                  ry={c.size * c.nucleus * (c.malignant ? 0.78 : 0.95)}
                  fill={c.malignant ? 'rgb(var(--malignant) / 0.55)' : 'rgb(var(--accent) / 0.45)'}
                />
              </g>
            </motion.g>
          ))}

          {/* scanning line */}
          <motion.rect
            x="0"
            width="400"
            height="2"
            fill="rgb(var(--accent) / 0.25)"
            animate={{ y: [30, 370, 30] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx="200" cy="200" r="176" fill="url(#vignette)" />
        </g>

        {/* reticle */}
        <g stroke="rgb(var(--ink) / 0.25)" strokeWidth="1">
          <line x1="200" y1="40" x2="200" y2="360" strokeDasharray="2 6" />
          <line x1="40" y1="200" x2="360" y2="200" strokeDasharray="2 6" />
        </g>
        <circle cx="200" cy="200" r="176" fill="none" stroke="rgb(var(--ink) / 0.8)" strokeWidth="1.5" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ x: '-50%' }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-3 left-1/2 flex items-center gap-4 whitespace-nowrap rounded-full border border-line bg-card/90 px-4 py-1.5 font-mono text-[11px] text-muted backdrop-blur"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-benign" /> benign-like
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-malignant" /> malignant-like
        </span>
        <span>FNA · ×400</span>
      </motion.div>
    </motion.div>
  );
}

const HEADLINE = ['Reading', 'a', 'biopsy,', 'one', 'cell', 'feature', 'at', 'a', 'time.'];

export default function Hero() {
  const m = BUNDLE.test_metrics[PRIMARY];
  const c = BUNDLE.counts;
  const stats = [
    { value: c.total, decimals: 0, suffix: '', label: 'patient samples' },
    { value: m.accuracy * 100, decimals: 1, suffix: '%', label: 'accuracy on unseen cases' },
    { value: m.tp, decimals: 0, suffix: ` / ${m.tp + m.fn}`, label: 'cancers detected in test set' },
    { value: 5, decimals: 0, suffix: '', label: 'models compared' },
  ];

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-benign opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-benign" />
            </span>
            Wisconsin Breast Cancer dataset
          </motion.div>

          <h1 className="font-display text-[44px] leading-[1.02] tracking-tight sm:text-6xl lg:text-[76px]">
            {HEADLINE.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className={`inline-block ${w === 'cell' ? 'italic text-accent' : ''}`}
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.06 }}
                >
                  {w}
                </motion.span>
                {i < HEADLINE.length - 1 && '\u00A0'}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted"
          >
            Score nine features seen under the microscope and five trained models will tell you whether the
            sample looks benign or malignant. Everything runs instantly in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.85 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#try" className="btn-primary group">
              Try a sample
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a href="#cases" className="btn-ghost">
              <ListChecks className="h-4 w-4" />
              Test on real cases
            </a>
          </motion.div>

          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 1 + i * 0.08 }}
              >
                <div className="font-display text-4xl leading-none">
                  <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} duration={1.6} />
                </div>
                <div className="mt-2 text-xs leading-snug text-muted">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <MicroscopeField />
      </div>
    </section>
  );
}
