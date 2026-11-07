import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { BUNDLE, PRIMARY } from '../lib/engine.js';
import { EASE } from './ui.jsx';

const c = BUNDLE.counts;
const ann = BUNDLE.test_metrics[PRIMARY];

const STEPS = [
  ['The data', `${c.total} fine-needle aspirate samples from the University of Wisconsin hospitals (${c.benign} benign, ${c.malignant} malignant), each scored 1–10 on nine features.`],
  ['Cleaning', `Duplicates were removed. ${c.missing_bare_nuclei} samples have no Bare nuclei value; those are filled with the median of the training data.`],
  ['Splitting', `${c.train} samples were used for training and ${c.test} were locked away as a test set, keeping the benign/malignant ratio the same in both.`],
  ['Training', 'Five models were tuned with 5-fold cross-validation: a neural network, random forest, support vector machine, k-nearest neighbours and a decision tree.'],
  ['Testing', `On the ${c.test} unseen patients the neural network was right ${(ann.accuracy * 100).toFixed(1)}% of the time and caught all ${ann.tp} cancers.`],
];

const FAQ = [
  ['Do my inputs leave the browser?', 'No. The five trained models were exported from scikit-learn and run directly in the page. Nothing is sent to a server.'],
  ['Are these the same models as in the notebook?', 'Yes. The exported models give the same answer as the Python pipelines on all 691 samples — the “Run test” button shows this live.'],
  ['Why is the neural network the main model?', `It had the best mix of results on the test set: no missed cancers, ${ann.fp} false alarms, and the highest ROC-AUC (${ann.auc.toFixed(4)}).`],
  ['What does “?” for Bare nuclei mean?', 'It marks the value as unknown. The model then uses the median from the training data, exactly like the real pipeline.'],
  ['Can I use this to diagnose someone?', 'No. This is a university machine-learning project for learning purposes. Diagnosis must come from a qualified pathologist.'],
];

function Faq({ q, a, i }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[14px] font-medium">
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 text-muted" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-[14px] leading-relaxed text-muted">{a}</p>
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
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col border-l border-line bg-paper"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            aria-label="How it works"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="font-display text-2xl">How it works</div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-soft">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ol className="relative space-y-6 border-l border-line pl-6">
                {STEPS.map(([title, text], i) => (
                  <motion.li
                    key={title}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: EASE }}
                    className="relative"
                  >
                    <span className="absolute -left-[33px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-line bg-card font-mono text-[9px]">
                      {i + 1}
                    </span>
                    <div className="font-medium">{title}</div>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">{text}</p>
                  </motion.li>
                ))}
              </ol>
              <div className="eyebrow mb-1 mt-10">Questions</div>
              {FAQ.map(([q, a], i) => (
                <Faq key={q} q={q} a={a} i={i} />
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

