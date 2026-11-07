import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, MessageCircle, X, CornerDownLeft, RotateCcw } from 'lucide-react';
import { BUNDLE, FEATURES, MODEL_ORDER, PRIMARY, predict } from '../lib/engine.js';
import { EASE } from './ui.jsx';

const SUGGESTIONS = [
  'Explain the current sample',
  'Why is the Neural Network the main model?',
  'Which features matter most?',
  'How does the test set evaluation work?',
];

function buildAnswer(query, values, loadedCase) {
  const q = query.toLowerCase();
  const res = predict(values);
  const ann = BUNDLE.test_metrics[PRIMARY];
  const rf = BUNDLE.test_metrics['Random Forest'];
  const c = BUNDLE.counts;

  if (q.includes('current') || q.includes('sample') || q.includes('this') || q.includes('explain') || q.includes('حالي') || q.includes('مريض')) {
    const mal = res.primary.pred === 1;
    const agree = res.models.filter((m) => m.pred === res.primary.pred).length;
    const highFeats = FEATURES.map((f, i) => ({ label: f.label, val: res.filled[i] }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);

    return {
      title: mal ? 'Current sample: Likely malignant' : 'Current sample: Likely benign',
      body: [
        `The primary Neural Network (ANN) scores this sample at ${(res.primary.score * 100).toFixed(1)}% malignancy probability, with ${agree} of 5 models in agreement.`,
        `Highest scored features on this sample: ${highFeats.map((f) => `${f.label} (${f.val}/10)`).join(', ')}.`,
        loadedCase
          ? `This is real held-out test patient #${loadedCase.id} (confirmed ${loadedCase.y ? 'Malignant' : 'Benign'}).`
          : 'You can click any preset or real patient in Section 02 to compare against confirmed pathology.',
      ],
    };
  }

  if (q.includes('neural') || q.includes('ann') || q.includes('main') || q.includes('best') || q.includes('افضل') || q.includes('أفضل')) {
    return {
      title: 'Why the Neural Network (ANN) leads',
      body: [
        `On the ${c.test} unseen test patients (${c.test_benign} benign, ${c.test_malignant} malignant), both ANN, Random Forest, and SVM caught 100% of malignant tumours (${ann.tp}/${ann.tp} recall — 0 missed cancers).`,
        `Among those 100%-recall models, ANN achieved the highest overall accuracy (${(ann.accuracy * 100).toFixed(2)}%), highest F1 score (${(ann.f1 * 100).toFixed(2)}%), and highest ROC-AUC (${ann.auc.toFixed(4)}) with only ${ann.fp} false alarms.`,
        `Random Forest is a close second with ${(rf.accuracy * 100).toFixed(2)}% accuracy and ${rf.auc.toFixed(4)} ROC-AUC.`,
      ],
    };
  }

  if (q.includes('feature') || q.includes('matter') || q.includes('important') || q.includes('خصائص')) {
    const top = FEATURES.map((f, i) => ({ label: f.label, imp: BUNDLE.importance[i] }))
      .sort((a, b) => b.imp - a.imp)
      .slice(0, 4);
    return {
      title: 'Most influential cell features',
      body: [
        `According to the trained Random Forest importance ranking, the top four features driving the classification are:`,
        top.map((t, idx) => `${idx + 1}. ${t.label} — ${(t.imp * 100).toFixed(1)}% importance`).join('\n'),
        `Cell size uniformity and cell shape uniformity alone account for over 61% of the split decisions.`,
      ],
    };
  }

  if (q.includes('test') || q.includes('data') || q.includes('missing') || q.includes('bare') || q.includes('evaluation')) {
    return {
      title: 'Dataset & leak-free evaluation',
      body: [
        `The Wisconsin Breast Cancer dataset contains ${c.total} deduplicated samples (${c.benign} benign, ${c.malignant} malignant). It is split 80/20 into ${c.train} training cases and ${c.test} held-out test cases.`,
        `${c.missing_bare_nuclei} records have a missing Bare nuclei score ("?"). Each pipeline imputes missing values using the training median (1.0) so zero information leaks from the test set.`,
      ],
    };
  }

  return {
    title: 'Project summary',
    body: [
      `This tool runs all 5 trained scikit-learn models (${MODEL_ORDER.join(', ')}) directly in your browser on the Wisconsin Breast Cancer dataset (N=${c.total}).`,
      `Use Section 01 to score a sample 1–10, Section 02 to run all ${c.test} unseen test cases live, or ask me about a specific model or feature.`,
    ],
  };
}

export default function ChatDrawer({ open, onClose, values, loadedCase }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      title: 'Ask about the sample or models',
      body: [
        'I can explain the current sample score, why the 5 models agree or disagree, or how the dataset was evaluated.',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    if (!text) setInput('');
    const reply = buildAnswer(q, values, loadedCase);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      { role: 'assistant', ...reply },
    ]);
  };

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
            aria-label="Ask a question"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <div className="font-display text-2xl leading-none">Ask about this case</div>
                <div className="mt-1 font-mono text-[11px] text-muted">
                  Interactive Q&amp;A · live sample context
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setMessages([
                      {
                        role: 'assistant',
                        title: 'Ask about the sample or models',
                        body: [
                          'I can explain the current sample score, why the 5 models agree or disagree, or how the dataset was evaluated.',
                        ],
                      },
                    ])
                  }
                  title="Reset conversation"
                  className="rounded-full p-2 text-muted hover:bg-soft hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-soft">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-[13.5px] text-paper"
                  >
                    {m.text}
                  </motion.div>
                ) : (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="card p-4 text-[13.5px] leading-relaxed"
                  >
                    {m.title && <div className="mb-1.5 font-medium text-ink">{m.title}</div>}
                    <div className="space-y-2 text-muted">
                      {m.body.map((p, idx) => (
                        <p key={idx} className="whitespace-pre-line">
                          {p}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )
              )}

              <div className="pt-2">
                <div className="eyebrow mb-2">Suggested questions</div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="chip text-xs">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-line bg-card p-4"
            >
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the current sample or models…"
                  className="w-full rounded-full border border-line bg-paper py-2.5 pl-4 pr-11 text-[13.5px] outline-none transition focus:border-ink/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-ink/85 disabled:opacity-40"
                >
                  <CornerDownLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

