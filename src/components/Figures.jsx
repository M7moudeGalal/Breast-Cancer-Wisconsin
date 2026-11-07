import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { EASE, Reveal, SectionHeader } from './ui.jsx';

const FIGS = [
  ['fig_3_1_missing_values', 'Missing values', 'Where the dataset has gaps (Bare nuclei).', 'Data'],
  ['fig_3_2_class_distribution', 'Class balance', 'How many benign vs. malignant samples.', 'Data'],
  ['fig_3_3_feature_histograms', 'Feature distributions', 'Each feature split by diagnosis.', 'Data'],
  ['fig_3_4_feature_boxplots', 'Box plots', 'Spread of each feature per class.', 'Data'],
  ['fig_3_5_correlation_heatmap', 'Correlations', 'Which features move together.', 'Data'],
  ['fig_3_6_standardization_comparison', 'Standardisation', 'Feature scales before and after scaling.', 'Data'],
  ['fig_4_1_knn_tuning', 'KNN tuning', 'Choosing the number of neighbours.', 'Tuning'],
  ['fig_4_2_dt_tuning', 'Decision tree tuning', 'Choosing depth and split rule.', 'Tuning'],
  ['fig_4_3_rf_feature_importance', 'Random forest importance', 'Features the forest relies on.', 'Tuning'],
  ['fig_4_4_ann_tuning', 'Neural network tuning', 'Hidden layer size and regularisation.', 'Tuning'],
  ['fig_4_5_svm_tuning', 'SVM tuning', 'Regularisation strength and kernel width.', 'Tuning'],
  ['fig_4_6_cv_comparison', 'Cross-validation', 'All models compared on training folds.', 'Tuning'],
  ['fig_5_1_confusion_matrices', 'Confusion matrices', 'Right and wrong answers on the test set.', 'Results'],
  ['fig_5_2_roc_and_metrics', 'ROC & metrics', 'Final comparison on unseen patients.', 'Results'],
].map(([file, title, desc, group]) => ({ id: file, src: `/figures/${file}.png`, title, desc, group }));

const GROUPS = ['All', 'Data', 'Tuning', 'Results'];

export default function Figures() {
  const [group, setGroup] = useState('All');
  const [open, setOpen] = useState(null);
  const list = FIGS.filter((f) => group === 'All' || f.group === group);

  const move = useCallback(
    (d) => {
      setOpen((cur) => {
        if (cur === null) return cur;
        const idx = list.findIndex((f) => f.id === cur);
        return list[(idx + d + list.length) % list.length].id;
      });
    },
    [list]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, move]);

  const active = FIGS.find((f) => f.id === open);

  return (
    <section id="figures" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeader index="04" eyebrow="Notebook figures" title={<>The analysis, <em className="text-accent">step by step.</em></>}>
        Every chart from the project notebook. Click one to view it full size; use the arrow keys to browse.
      </SectionHeader>

      <Reveal className="mb-6 flex gap-1">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`relative rounded-full px-4 py-1.5 text-[13px] transition-colors ${group === g ? 'text-paper' : 'text-muted hover:text-ink'}`}
          >
            {group === g && <motion.span layoutId="fig-group" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
            <span className="relative">{g}</span>
          </button>
        ))}
      </Reveal>

      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((f, i) => (
            <motion.button
              layout
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
              onClick={() => setOpen(f.id)}
              className="group card overflow-hidden text-left transition-shadow hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-white">
                <motion.img
                  layoutId={`img-${f.id}`}
                  src={f.src}
                  alt={f.title}
                  loading="lazy"
                  className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute right-3 top-3 rounded-full bg-ink/80 p-1.5 text-paper opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="p-4">
                <div className="eyebrow mb-1">{f.group}</div>
                <div className="font-medium">{f.title}</div>
                <div className="mt-0.5 text-[13px] text-muted">{f.desc}</div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
            >
              <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
                <div>
                  <div className="font-medium">{active.title}</div>
                  <div className="text-[12px] text-muted">{active.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button aria-label="Previous figure" onClick={() => move(-1)} className="rounded-full p-2 hover:bg-soft">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button aria-label="Next figure" onClick={() => move(1)} className="rounded-full p-2 hover:bg-soft">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button aria-label="Close" onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-soft">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
                <motion.img layoutId={`img-${active.id}`} src={active.src} alt={active.title} className="mx-auto max-h-[78vh] w-auto object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

