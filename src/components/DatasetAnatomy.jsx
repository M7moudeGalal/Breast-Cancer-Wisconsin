import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertOctagon, Layers, ShieldCheck, Database } from 'lucide-react';
import { BUNDLE } from '../lib/engine.js';
import { Counter, EASE } from './ui.jsx';

export default function DatasetAnatomy() {
  const c = BUNDLE.counts;
  const benignPct = (c.benign / c.total) * 100;
  const malignantPct = (c.malignant / c.total) * 100;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Cytology Cohort Anatomy</div>
          <h3 className="font-display text-2xl font-semibold text-ink">
            Dataset Demographics &amp; Class Balance
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-benign">
            <span className="h-2.5 w-2.5 rounded-full bg-benign" /> {c.benign} Benign ({benignPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5 text-malignant">
            <span className="h-2.5 w-2.5 rounded-full bg-malignant" /> {c.malignant} Malignant ({malignantPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Visual Bicolor Class Balance Bar with Framer Motion */}
      <div className="h-4 w-full rounded-full overflow-hidden bg-soft border border-line flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${benignPct}%` }}
          transition={{ duration: 0.9, ease: EASE }}
          className="h-full bg-benign"
          title={`Benign: ${c.benign} (${benignPct.toFixed(1)}%)`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${malignantPct}%` }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="h-full bg-malignant"
          title={`Malignant: ${c.malignant} (${malignantPct.toFixed(1)}%)`}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-line/70 bg-soft/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold text-ink">Train Cohort (80%)</span>
            <Layers className="h-4 w-4 text-accent" />
          </div>
          <div className="font-display text-2xl font-bold text-ink">
            <Counter value={c.train} duration={0.8} /> biopsies
          </div>
          <div className="text-[11px] text-muted mt-1 font-mono">
            {c.train_benign} Benign · {c.train_malignant} Malignant
          </div>
        </div>

        <div className="rounded-xl border border-line/70 bg-soft/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold text-ink">Test Cohort (20%)</span>
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <div className="font-display text-2xl font-bold text-ink">
            <Counter value={c.test} duration={0.8} /> biopsies
          </div>
          <div className="text-[11px] text-muted mt-1 font-mono">
            {c.test_benign} Benign · {c.test_malignant} Malignant
          </div>
        </div>

        <div className="rounded-xl border border-line/70 bg-soft/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold text-ink">Data Dimensions</span>
            <Database className="h-4 w-4 text-accent" />
          </div>
          <div className="font-display text-2xl font-bold text-ink">
            9 Features + 1 Target
          </div>
          <div className="text-[11px] text-muted mt-1 font-mono">
            16 Missing Bare Nuclei Median Imputed
          </div>
        </div>
      </div>
    </div>
  );
}

