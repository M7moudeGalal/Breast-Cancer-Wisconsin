import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Filter, Cpu, CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { BUNDLE } from '../lib/engine.js';
import { EASE } from './ui.jsx';

const STAGES = [
  {
    id: 'fna',
    num: '01',
    title: 'FNA Biopsy Intake',
    sub: 'Wisconsin Clinical Cytology',
    stat: '691 Biopsies',
    desc: 'Fine Needle Aspiration samples collected at University of Wisconsin Hospitals by Dr. William H. Wolberg. 9 microscopic characteristics scored 1 to 10.',
    icon: Database,
    color: 'accent',
  },
  {
    id: 'clean',
    num: '02',
    title: 'Clean & Impute',
    sub: 'Missing Value Handling',
    stat: '16 Imputed',
    desc: 'Bare Nuclei contained 16 missing records (?) imputed via training median (1.0). Stratified 80/20 train/test split preserved class proportions.',
    icon: Filter,
    color: 'benign',
  },
  {
    id: 'scale',
    num: '03',
    title: 'StandardScaler',
    sub: 'Feature Normalisation',
    stat: 'μ=0, σ=1',
    desc: 'Prevents features with higher variances from dominating distance metrics in KNN and gradient updates in Artificial Neural Network and SVM.',
    icon: Sparkles,
    color: 'accent',
  },
  {
    id: 'models',
    num: '04',
    title: '5 ML Classifiers',
    sub: 'Algorithm Diversity',
    stat: '5 Pipelines',
    desc: 'Multi-paradigm comparison: Neural Network (MLP), Random Forest (100 trees), Support Vector Machine (RBF), KNN (k=5), Decision Tree (depth=3).',
    icon: Cpu,
    color: 'ink',
  },
  {
    id: 'verdict',
    num: '05',
    title: 'Clinical Consensus',
    sub: 'Held-Out Test Set',
    stat: '100% Recall',
    desc: 'Top model achieves 98.6% overall accuracy and 100% sensitivity on malignant cases (0 missed cancers out of 39 in unseen evaluation).',
    icon: ShieldCheck,
    color: 'malignant',
  },
];

export default function PipelineFlow() {
  const [activeStage, setActiveStage] = useState(STAGES[0]);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow">End-to-End Methodology</div>
          <h3 className="font-display text-2xl font-semibold text-ink">
            Clinical Machine Learning Pipeline Architecture
          </h3>
        </div>
        <span className="font-mono text-xs text-muted bg-soft px-2.5 py-1 rounded-full">
          Scikit-Learn Verified
        </span>
      </div>

      {/* 5-Stage Animated Flow Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 relative">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isSelected = activeStage.id === s.id;

          return (
            <motion.button
              key={s.id}
              onClick={() => setActiveStage(s)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={`relative text-left rounded-xl p-3 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-card border-accent shadow-lift ring-2 ring-accent/20'
                  : 'bg-soft/40 border-line/70 hover:bg-soft/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-muted mb-1.5">
                  <span className="font-mono text-[10px] font-bold">{s.num}</span>
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="text-xs font-bold text-ink leading-tight">{s.title}</div>
                <div className="text-[10.5px] text-muted truncate mt-0.5">{s.sub}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[10.5px] font-mono">
                <span className="font-semibold text-ink">{s.stat}</span>
                {idx < STAGES.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted/60 hidden sm:inline" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic Detail Card below */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="mt-4 rounded-xl bg-soft/60 border border-line p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-accent">{activeStage.num}</span>
              <span className="font-semibold text-ink text-sm">{activeStage.title}</span>
              <span className="text-xs text-muted">· {activeStage.sub}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{activeStage.desc}</p>
          </div>

          <div className="shrink-0 font-mono text-xs rounded-lg bg-card px-3 py-1.5 border border-line text-ink">
            Metric: <strong>{activeStage.stat}</strong>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

