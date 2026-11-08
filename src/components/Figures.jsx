import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { EASE, Reveal, SectionHeader } from './ui.jsx';

const FIGS = [
  ['fig_3_1_missing_values', 'Missing values audit', 'Heatmap of gaps in the dataset; 16 bare nuclei records identified for imputation.', 'Data Analysis'],
  ['fig_3_2_class_distribution', 'Class balance', 'Breakdown of 458 benign (65.5%) vs. 241 malignant (34.5%) biopsies in the study.', 'Data Analysis'],
  ['fig_3_3_feature_histograms', 'Feature distributions', 'Histograms for each of the 9 cytology scores, segregated by diagnosis.', 'Data Analysis'],
  ['fig_3_4_feature_boxplots', 'Feature box plots', 'Quartile spread and outliers showing marked difference between classes.', 'Data Analysis'],
  ['fig_3_5_correlation_heatmap', 'Correlation matrix', 'Feature collinearity; cell size & shape uniformity correlate strongly (r = 0.91).', 'Data Analysis'],
  ['fig_3_6_standardization_comparison', 'Feature standardisation', 'Zero-mean and unit-variance scaling comparison before and after StandardScaler.', 'Data Analysis'],
  ['fig_4_1_knn_tuning', 'KNN hyperparameter tuning', 'Cross-validation accuracy and recall across neighbour count (k = 1 to 25).', 'Model Tuning'],
  ['fig_4_2_dt_tuning', 'Decision tree tuning', 'Evaluating tree depth and split criteria (Gini vs. Entropy) against overfitting.', 'Model Tuning'],
  ['fig_4_3_rf_feature_importance', 'Random forest feature importance', 'Gini impurity reduction ranking cell size, shape, and bare nuclei as top predictors.', 'Model Tuning'],
  ['fig_4_4_ann_tuning', 'Neural network tuning', 'Exploring hidden layer architecture (16 to 64 neurons) and L2 regularisation.', 'Model Tuning'],
  ['fig_4_5_svm_tuning', 'SVM kernel & regularisation tuning', 'Grid search comparing linear vs. RBF kernels with varying penalty parameter C.', 'Model Tuning'],
  ['fig_4_6_cv_comparison', '5-fold cross-validation comparison', 'Validation boxplots comparing all 5 algorithms across the training folds.', 'Model Tuning'],
  ['fig_5_1_confusion_matrices', 'Test set confusion matrices', 'Detailed classification breakdown on all 139 unseen patients for each model.', 'Final Results'],
  ['fig_5_2_roc_and_metrics', 'ROC curves & metrics comparison', 'Receiver Operating Characteristic curves and comparative performance bars.', 'Final Results'],
].map(([file, title, desc, group]) => ({ id: file, src: `/figures/${file}.png`, title, desc, group }));

const GROUPS = ['All', 'Data Analysis', 'Model Tuning', 'Final Results'];

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
  const activeIndex = active ? list.findIndex((f) => f.id === active.id) + 1 : 0;

  return (
    <section id="figures" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        index="04"
        eyebrow="Research Gallery"
        title={<>Explore the original <em className="text-accent">research figures.</em></>}
      >
        Every analytical chart generated during the project lifecycle. Filter by stage to inspect data distributions,
        hyperparameter sweeps, or final test set comparisons. Click any figure to open full size.
      </SectionHeader>

      {/* Category filter pills */}
      <Reveal className="mb-5 flex flex-wrap gap-1.5 rounded-2xl bg-card border border-line p-1.5 shadow-sm max-w-fit">
        {GROUPS.map((g) => {
          const activeTab = group === g;
          const count = g === 'All' ? FIGS.length : FIGS.filter((f) => f.group === g).length;
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`relative rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${activeTab ? 'text-paper' : 'text-muted hover:text-ink hover:bg-soft/60'
                }`}
            >
              {activeTab && (
                <motion.span
                  layoutId="fig-group"
                  className="absolute inset-0 rounded-xl bg-ink shadow-sm"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{g}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${activeTab ? 'bg-paper/20 text-paper' : 'bg-soft text-muted'
                    }`}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </Reveal>

      {/* Image Cards Grid */}
      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((f, i) => (
            <motion.button
              layout
              key={f.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 6) * 0.04 }}
              onClick={() => setOpen(f.id)}
              className="group card overflow-hidden text-left hover:shadow-lift hover:border-ink/20 transition-all flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-white/95 flex items-center justify-center p-2.5">
                <img
                  src={f.src}
                  alt={f.title}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[10.5px] font-medium text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 shadow-sm">
                  <ZoomIn className="h-3 w-3" />
                  <span>Enlarge</span>
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="eyebrow">{f.group}</span>
                    <span className="font-mono text-[10px] text-muted">Figure #{f.id.replace('fig_', '').replace(/_/g, '.')}</span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-ink group-hover:text-accent transition-colors leading-snug">
                    {f.title}
                  </h4>
                  <p className="mt-1 text-[11.5px] text-muted leading-snug">{f.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card border border-line shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 bg-paper/60 backdrop-blur">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">{active.group}</span>
                    <span className="text-muted">·</span>
                    <span className="text-xs font-mono text-muted">
                      Figure {activeIndex} of {list.length}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink">{active.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{active.desc}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    aria-label="Previous figure (Left Arrow)"
                    onClick={() => move(-1)}
                    className="rounded-full p-2 hover:bg-soft text-muted hover:text-ink transition border border-transparent hover:border-line"
                    title="Previous (Left Arrow)"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next figure (Right Arrow)"
                    onClick={() => move(1)}
                    className="rounded-full p-2 hover:bg-soft text-muted hover:text-ink transition border border-transparent hover:border-line"
                    title="Next (Right Arrow)"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Close dialog (Escape)"
                    onClick={() => setOpen(null)}
                    className="rounded-full p-2 hover:bg-soft text-muted hover:text-ink transition border border-transparent hover:border-line"
                    title="Close (Esc)"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Image View */}
              <div className="min-h-0 flex-1 overflow-auto bg-white p-6 flex items-center justify-center">
                <img
                  src={active.src}
                  alt={active.title}
                  className="max-h-[72vh] w-auto max-w-full object-contain drop-shadow-sm select-none"
                />
              </div>

              {/* Bottom bar */}
              <div className="border-t border-line px-6 py-2.5 bg-paper/40 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>Use ← and → arrow keys to navigate, Esc to close</span>
                <span className="text-ink font-semibold">Wisconsin Cytology Research</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

