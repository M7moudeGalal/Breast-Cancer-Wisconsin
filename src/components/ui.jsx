import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1];

export function Reveal({ children, delay = 0, y = 24, className = '', as = 'div' }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

export function Counter({ value, decimals = 0, suffix = '', prefix = '', duration = 1.2, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        from.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, inView, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function SectionHeader({ index, eyebrow, title, children }) {
  return (
    <div className="mb-10 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-end">
      <Reveal>
        <div className="eyebrow mb-3 flex items-center gap-3">
          <span className="text-ink">{index}</span>
          <span className="h-px w-8 bg-line" />
          {eyebrow}
        </div>
        <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h2>
      </Reveal>
      {children && (
        <Reveal delay={0.1}>
          <p className="max-w-xl text-[15px] leading-relaxed text-muted md:justify-self-end">{children}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Verdict({ pred, className = '' }) {
  const mal = pred === 1;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        mal ? 'bg-malignant/10 text-malignant' : 'bg-benign/10 text-benign'
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${mal ? 'bg-malignant' : 'bg-benign'}`} />
      {mal ? 'Malignant' : 'Benign'}
    </span>
  );
}

export const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

