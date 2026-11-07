import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  X,
  Database,
  Sparkles,
  GitFork,
  Cpu,
  Award,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { BUNDLE, PRIMARY } from '../lib/engine.js';
import { EASE } from './ui.jsx';

const c = BUNDLE.counts;
const ann = BUNDLE.test_metrics[PRIMARY];

const STAGES = [
  {
    step: 1,
    title: 'Data Collection',
    badge: `${c.total} Biopsies`,
    icon: Database,
    desc: `Gathered from fine-needle aspirate (FNA) breast masses at University of Wisconsin Hospitals. Comprises ${c.benign} confirmed benign and ${c.malignant} malignant patient cases, each evaluated on nine cellular characteristics under microscopy.`,
  },
  {
    step: 2,
    title: 'Data Cleaning & Preprocessing',
    badge: 'Zero Data Leakage',
    icon: Sparkles,
    desc: `Duplicate entries were scrubbed. For the ${c.missing_bare_nuclei} records missing a "Bare Nuclei" score, the value is imputed strictly using the median (1.0) calculated solely from the training partition to prevent any information leakage.`,
  },
  {
    step: 3,
    title: 'Stratified Train / Test Split',
    badge: '80% Train · 20% Test',
    icon: GitFork,
    desc: `The dataset was split into ${c.train} training samples and ${c.test} strictly held-out test samples. Stratification preserves the exact 65.5% benign / 34.5% malignant ratio across both sets.`,
  },
  {
    step: 4,
    title: 'Model Training & Hyperparameter Tuning',
    badge: '5-Fold CV',
    icon: Cpu,
    desc: `Five machine learning algorithms were tuned with 5-fold cross-validation on the training set: Artificial Neural Network (MLP), Random Forest, Support Vector Machine (SVM), K-Nearest Neighbors (KNN), and Decision Tree.`,
  },
  {
    step: 5,
    title: 'Unseen Test Set Evaluation',
    badge: `${(ann.accuracy * 100).toFixed(1)}% Top Accuracy`,
    icon: Award,
    desc: `All models were evaluated against the ${c.test} unseen patients. The primary Neural Network achieved ${(ann.accuracy * 100).toFixed(1)}% accuracy and 100% recall on malignant cases, successfully identifying all ${ann.tp} cancers with only ${ann.fp} false alarms.`,
  },
];

const FAQ = [
  {
    q: 'Do my inputs or test cases get sent to a server?',
    a: 'No. All five scikit-learn models run directly in your browser using pure client-side JavaScript math. Zero data leaves your device, guaranteeing total privacy.',
  },
  {
    q: 'Are these actual machine learning models or simulated scores?',
    a: 'These are the authentic trained scikit-learn models. All neural network weights, decision tree split thresholds, support vectors, and random forest trees were exported directly from the Python pipelines and verified against all 691 records.',
  },
  {
    q: 'Why is the Artificial Neural Network (ANN) the primary model?',
    a: `On the held-out test set, the ANN achieved 100% recall (catching 39 of 39 cancers), the highest overall accuracy (${(ann.accuracy * 100).toFixed(1)}%), and the top ROC-AUC score (${ann.auc.toFixed(4)}) with only ${ann.fp} false alarms.`,
  },
  {
    q: 'Can this tool replace a physician or hospital biopsy?',
    a: 'No. This application is designed purely as an educational and scientific demonstration. Diagnostic decisions must always be made by board-certified pathologists and licensed medical oncologists.',
  },
];

function FaqItem({ q, a, i }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div className="border-b border-line/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-xs font-semibold text-ink hover:text-accent transition-colors"
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-3.5 text-xs leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Guide({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-lg flex-col border-l border-line bg-paper shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            aria-label="How It Works Guide"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-card/60">
              <div>
                <div className="font-display text-2xl font-semibold text-ink">How It Works</div>
                <div className="text-xs text-muted">Complete Machine Learning Pipeline</div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Guide"
                className="rounded-full p-2 hover:bg-soft text-muted hover:text-ink transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Clinical Notice */}
              <div className="rounded-xl border border-line bg-card p-4 text-xs leading-relaxed text-muted flex items-start gap-3 shadow-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <strong className="text-ink font-semibold">Educational &amp; Research Platform: </strong>
                  This application demonstrates machine learning classification techniques on the Wisconsin Breast
                  Cancer dataset. It is not approved as a diagnostic medical device.
                </div>
              </div>

              {/* 5-Stage Pipeline */}
              <div>
                <div className="eyebrow mb-4">Five-Stage Research Pipeline</div>
                <ol className="relative space-y-6 border-l-2 border-line/80 ml-3 pl-6">
                  {STAGES.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.li
                        key={s.title}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.06, duration: 0.35, ease: EASE }}
                        className="relative"
                      >
                        <span className="absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-card text-xs font-mono font-bold text-ink shadow-sm">
                          {s.step}
                        </span>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-accent" />
                            {s.title}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-soft text-muted font-medium">
                            {s.badge}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted">{s.desc}</p>
                      </motion.li>
                    );
                  })}
                </ol>
              </div>

              {/* FAQ Section */}
              <div>
                <div className="eyebrow mb-3 flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-accent" />
                  <span>Frequently Asked Questions</span>
                </div>
                <div className="card px-4 py-1 divide-y divide-line/60">
                  {FAQ.map((item, i) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} i={i} />
                  ))}
                </div>
              </div>

              {/* Research Footnote */}
              <div className="text-[11px] font-mono text-muted text-center pt-2">
                Wisconsin Breast Cancer Cytology · University of Wisconsin Hospitals
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

