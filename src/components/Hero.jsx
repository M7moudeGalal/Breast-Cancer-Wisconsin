import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, BookOpen, Sparkles, Play, Activity, ShieldCheck } from 'lucide-react';
import { BUNDLE, PRIMARY } from '../lib/engine.js';
import { Counter, EASE } from './ui.jsx';

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
      const angle = r() * Math.PI * 2;
      const dist = 24 + r() * 116;
      const cx = 200 + Math.cos(angle) * dist;
      const cy = 200 + Math.sin(angle) * dist;

      const dx = (r() - 0.5) * 44;
      const dy = (r() - 0.5) * 44;
      const dur = 4.2 + r() * 4.2;
      const rotDelta = (r() - 0.5) * 32;

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
  const [hoveredCell, setHoveredCell] = useState(null);

  // Interactive 3D parallax tilt on mouse move
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [9, -9]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
    setHoveredCell(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="relative mx-auto aspect-square w-full max-w-[470px] cursor-crosshair select-none"
    >
      {/* Subtle ambient glow behind microscope */}
      <div
        className="pointer-events-none absolute inset-8 rounded-full opacity-40 blur-3xl transition-colors duration-500"
        style={{
          background:
            hoveredCell?.malignant
              ? 'radial-gradient(circle, rgb(var(--malignant) / 0.45), transparent 70%)'
              : 'radial-gradient(circle, rgb(var(--accent) / 0.35), rgb(var(--benign) / 0.25), transparent 70%)',
        }}
      />

      {/* Floating top-left HUD pill */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
        className="animate-float-slow absolute left-2 top-5 z-20 flex items-center gap-2 rounded-full border border-line bg-card/90 px-3.5 py-1.5 text-[11px] font-medium shadow-card backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-benign opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-benign" />
        </span>
        <span className="font-mono text-ink">FNA Live Lens · 400×</span>
      </motion.div>

      {/* Floating bottom-right HUD pill */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
        className="absolute bottom-6 right-2 z-20 flex items-center gap-2 rounded-full border border-line bg-card/90 px-3.5 py-1.5 text-[11px] font-medium shadow-card backdrop-blur-md"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-benign" />
        <span className="text-muted">Hover any cell to inspect</span>
      </motion.div>

      <svg viewBox="0 0 400 400" className="relative z-10 h-full w-full drop-shadow-sm" aria-hidden="true">
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
            dur="75s"
            repeatCount="indefinite"
          />
          {Array.from({ length: 72 }).map((_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const long = i % 6 === 0;
            const r1 = 186;
            const r2 = long ? 198 : 192;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * r1}
                y1={200 + Math.sin(a) * r1}
                x2={200 + Math.cos(a) * r2}
                y2={200 + Math.sin(a) * r2}
                stroke="rgb(var(--muted))"
                strokeOpacity={long ? 0.75 : 0.35}
                strokeWidth={long ? '1.3' : '1'}
              />
            );
          })}
        </g>

        <circle cx="200" cy="200" r="176" fill="rgb(var(--card))" />

        <g clipPath="url(#field)">
          {cells.map((c) => {
            const isHovered = hoveredCell?.id === c.id;
            return (
              <g
                key={c.id}
                transform={`translate(${c.cx} ${c.cy})`}
                onMouseEnter={() => setHoveredCell(c)}
                style={{ cursor: 'pointer' }}
              >
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
                      rx={isHovered ? c.size * 1.22 : c.size}
                      ry={(isHovered ? c.size * 1.22 : c.size) * c.squash}
                      fill={
                        c.malignant
                          ? isHovered
                            ? 'rgb(var(--malignant) / 0.32)'
                            : 'rgb(var(--malignant) / 0.16)'
                          : isHovered
                          ? 'rgb(var(--benign) / 0.28)'
                          : 'rgb(var(--benign) / 0.13)'
                      }
                      stroke={c.malignant ? 'rgb(var(--malignant) / 0.85)' : 'rgb(var(--benign) / 0.7)'}
                      strokeWidth={isHovered ? '2.4' : '1.4'}
                    />
                    <ellipse
                      cx={c.malignant ? c.size * 0.12 : 0}
                      rx={c.size * c.nucleus}
                      ry={c.size * c.nucleus * (c.malignant ? 0.78 : 0.95)}
                      fill={c.malignant ? 'rgb(var(--malignant) / 0.75)' : 'rgb(var(--accent) / 0.6)'}
                    />
                  </g>
                </g>
              </g>
            );
          })}

          {/* scanning laser line */}
          <rect x="0" width="400" height="2.5" fill="rgb(var(--accent) / 0.45)">
            <animate attributeName="y" values="25; 375; 25" dur="5.5s" repeatCount="indefinite" />
          </rect>
          <circle cx="200" cy="200" r="176" fill="url(#vignette)" pointerEvents="none" />
        </g>

        {/* reticle */}
        <g stroke="rgb(var(--ink) / 0.22)" strokeWidth="1" pointerEvents="none">
          <line x1="200" y1="40" x2="200" y2="360" strokeDasharray="2 6" />
          <line x1="40" y1="200" x2="360" y2="200" strokeDasharray="2 6" />
          <circle cx="200" cy="200" r="56" fill="none" strokeDasharray="3 5" />
        </g>
        <circle
          cx="200"
          cy="200"
          r="176"
          fill="none"
          stroke="rgb(var(--ink) / 0.8)"
          strokeWidth="1.6"
          pointerEvents="none"
        />
      </svg>

      {/* Live Cell Inspection Popover when user hovers any cell */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            key={hoveredCell.id}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-card/95 px-3.5 py-2 text-xs shadow-lift backdrop-blur-md"
          >
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  hoveredCell.malignant ? 'bg-malignant' : 'bg-benign'
                }`}
              />
              <span className={hoveredCell.malignant ? 'text-malignant' : 'text-benign'}>
                {hoveredCell.malignant ? 'Atypical Malignant Cell' : 'Normal Benign Epithelial Cell'}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted">
              {hoveredCell.malignant
                ? 'Enlarged pleomorphic nucleus · high chromatin'
                : 'Uniform contour · small regular nucleus'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium shadow-sm"
          >
            <Activity className="h-3.5 w-3.5 text-accent" />
            <span>Interactive Clinical Decision-Support Simulator</span>
            <span className="rounded-full bg-benign/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-benign">
              100% Recall
            </span>
          </motion.div>

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
            transition={{ duration: 0.65, ease: EASE, delay: 0.55 }}
            className="mt-5 max-w-xl text-[16px] sm:text-[17px] leading-relaxed text-muted"
          >
            Explore how five trained machine learning models classify breast biopsy samples. Click any score from
            1 to 10, watch our live 3-step guide, or run all 139 unseen patients right in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.7 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <a href="#try" className="btn-primary group text-[14px]">
              <Sparkles className="h-4 w-4 text-paper/80 transition-transform group-hover:rotate-12" />
              Start Interactive Diagnosis
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a href="#cases" className="btn-ghost group text-[14px]">
              <Play className="h-3.5 w-3.5 text-accent transition-transform group-hover:scale-110" />
              Run 139-Patient Live Test
            </a>
            {onOpenGuide && (
              <button onClick={onOpenGuide} className="chip py-2.5 text-[13px]">
                <BookOpen className="h-3.5 w-3.5 text-muted" />
                How It Works
              </button>
            )}
          </motion.div>

          <div className="mt-11 grid grid-cols-2 gap-3.5 pt-4 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.8 + i * 0.07 }}
                className="card p-4 hover:border-ink/30 hover:shadow-lift"
              >
                <div className="font-display text-3xl sm:text-4xl leading-none text-ink">
                  <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} duration={1.4} />
                </div>
                <div className="mt-2 text-xs font-semibold text-ink">{s.label}</div>
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
