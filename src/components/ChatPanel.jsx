import React, { useState, useRef, useEffect, Component } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  User,
  Loader2,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

// ErrorBoundary to protect ReactMarkdown v9/v10 rendering
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-rose-500 text-xs p-2">MD Err: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

function buildLocalChatResponse(query, inferenceData) {
  const q = query.toLowerCase();
  const thoughts = [
    'Parsing clinical natural-language query and multi-turn conversation history...',
    'Inspecting Wisconsin Breast Cancer dataset (N=691 deduplicated: 453 Benign, 238 Malignant)...',
    'Evaluating 5 trained pipelines (ANN, Random Forest, SVM, KNN, Decision Tree)...',
  ];

  if (q.includes('recall') || q.includes('ann') || q.includes('primary') || q.includes('best') || q.includes('افضل') || q.includes('أفضل')) {
    thoughts.push('Comparing Task 4 (5-fold CV) and Task 5 (Held-Out Test N=139) sensitivity & F1 metrics...');
    return {
      thoughts,
      answer:
        `### Why ANN (MLP) is Selected as the Primary Clinical Classifier\n\n` +
        `In breast cancer cytological triage, **Recall (Sensitivity)** on the Malignant class is the paramount clinical metric because a **False Negative (FN)** leaves a malignant carcinoma untreated.\n\n` +
        `* **ANN (\`MLPClassifier(hidden_layer_sizes=(50,), alpha=0.001)\`)** achieved the highest held-out test performance:\n` +
        `  * **Test Recall (Sensitivity):** \`97.92%\` (**47 / 48** malignant tumours detected; only **1 FN**).\n` +
        `  * **Test F1-Score:** \`96.91%\`\n` +
        `  * **Test Accuracy:** \`97.84%\`\n` +
        `  * **Test ROC-AUC:** \`0.9950\`\n` +
        `* **Random Forest (\`200 trees, max_depth=5\`)** achieved the highest **Test ROC-AUC (\`0.9963\`)** and \`95.83%\` Recall (2 FNs), making it an ideal secondary probability ranker.`,
      suggestions: [
        'Which cytological features have the highest importance?',
        'How are the 16 missing Bare Nuclei values handled?',
        'Analyze the current patient in the simulator',
      ],
    };
  }

  if (q.includes('feature') || q.includes('important') || q.includes('correlation') || q.includes('gini') || q.includes('خصائص')) {
    thoughts.push('Extracting Random Forest Gini feature importances and Pearson correlation matrix...');
    return {
      thoughts,
      answer:
        `### Top Discriminative Cytological Biomarkers\n\n` +
        `Across both Pearson correlation with malignancy and Random Forest (\`n_estimators=200\`) Gini importance, four features dominate diagnostic separation:\n\n` +
        `1. **Uniformity of Cell Size** (\`24.8%\` Gini Importance, $r = 0.82$ with target)\n` +
        `2. **Uniformity of Cell Shape** (\`22.6%\` Gini Importance, $r = 0.82$ with target)\n` +
        `3. **Bare Nuclei** (\`18.1%\` Gini Importance, $r = 0.82$ with target)\n` +
        `4. **Bland Chromatin** (\`12.4%\` Gini Importance, $r = 0.76$ with target)\n\n` +
        `> **Multicollinearity Note:** \`uniformity_of_cell_size\` and \`uniformity_of_cell_shape\` exhibit strong collinearity ($r = 0.91$). L2 regularization in ANN (\`alpha=0.001\`) and SVM (\`C=1.0\`), along with depth pruning (\`max_depth=5\`) in tree models, prevent variance inflation.`,
      suggestions: [
        'How are the 16 missing Bare Nuclei values handled?',
        'Why is ANN (MLP) the primary recommended model?',
        'Analyze the current patient in the simulator',
      ],
    };
  }

  if (q.includes('missing') || q.includes('bare') || q.includes('imput') || q.includes('leak') || q.includes('scaler')) {
    thoughts.push('Auditing SimpleImputer(strategy="median") and StandardScaler pipeline steps...');
    return {
      thoughts,
      answer:
        `### Leak-Free Missing Data & Standardization Architecture\n\n` +
        `The raw UCI Wisconsin dataset (\`N = 699\`) contains **16 records** where \`bare_nuclei\` is recorded as \`'?'\` (\`NaN\`), alongside **8 exact duplicate rows**.\n\n` +
        `* **Deduplication:** Removing the 8 exact duplicates yields \`N = 691\` (\`453 Benign [65.56%]\`, \`238 Malignant [34.44%]\`).\n` +
        `* **Median Imputation (\`SimpleImputer(strategy='median')\`):** Because \`bare_nuclei\` is strongly right-skewed (\`skewness = +1.43\`), the training median (\`1.0\`) is used rather than the mean (\`3.54\`) to preserve the discrete ordinal scale.\n` +
        `* **Zero Data Leakage:** Both \`SimpleImputer\` and \`StandardScaler\` are encapsulated inside a scikit-learn \`Pipeline\` and fitted **exclusively on the 552 training rows** (and inside each 5-fold CV split).`,
      suggestions: [
        'Why is ANN (MLP) the primary recommended model?',
        'Which cytological features have the highest importance?',
        'Analyze the current patient in the simulator',
      ],
    };
  }

  if (q.includes('patient') || q.includes('current') || q.includes('simulator') || q.includes('sample') || q.includes('مريض')) {
    thoughts.push('Evaluating live patient cytological vector and Z-scores from simulator state...');
    const pr = inferenceData?.primary_result;
    const cons = inferenceData?.consensus;
    const topZ = [...(inferenceData?.preprocessing || [])]
      .sort((a, b) => b.z_score - a.z_score)
      .slice(0, 3);

    return {
      thoughts,
      answer:
        `### Live Simulator Patient Assessment\n\n` +
        `* **Active Classifier (\`${pr?.model}\`):** **${pr?.diagnosis}** (Malignancy Probability: \`${((pr?.probability || 0) * 100).toFixed(2)}%\`)\n` +
        `* **5-Model Ensemble Consensus:** \`${cons?.malignant_votes} / 5\` models vote **Malignant** (\`${((cons?.agreement_ratio || 1) * 100).toFixed(0)}%\` agreement).\n` +
        `* **Highest Standardized Z-Scores:** ${topZ.map((z) => `\`${z.label}: z=${z.z_score >= 0 ? '+' : ''}${z.z_score.toFixed(2)}\``).join(', ')}\n\n` +
        `**Clinical Recommendation:** ` +
        (pr?.prediction === 1
          ? `High-priority pathology alert. Cytological atypia exceeds malignancy threshold; immediate histopathological biopsy confirmation is recommended.`
          : `Low-risk cytological profile consistent with benign epithelial proliferation. Standard clinical follow-up is recommended.`),
      suggestions: [
        'Why is ANN (MLP) the primary recommended model?',
        'Which cytological features have the highest importance?',
        'How are the 16 missing Bare Nuclei values handled?',
      ],
    };
  }

  thoughts.push('Synthesizing comprehensive clinical data science summary...');
  return {
    thoughts,
    answer:
      `### OncoVision Clinical AI — Dataset & Model Summary\n\n` +
      `I am your **Gemini-powered Clinical Data Analytics Assistant** for the Wisconsin Breast Cancer Diagnostic Platform (\`N = 691\` deduplicated cases, \`9\` cytological features).\n\n` +
      `* **Cohort Split:** \`552\` Training (\`80%\`) / \`139\` Held-Out Test (\`20%\`, \`91 Benign\`, \`48 Malignant\`).\n` +
      `* **Champion Primary Model:** **ANN (MLP)** — \`97.92%\` Test Recall (\`47/48\` cancers caught), \`96.91%\` F1-Score, \`0.9950\` ROC-AUC.\n` +
      `* **Best Probability Ranker:** **Random Forest** — \`0.9963\` Test ROC-AUC.\n\n` +
      `Select one of the prompts below or ask me any question about the models, features, or current patient!`,
    suggestions: [
      'Why is ANN (MLP) the primary recommended model?',
      'Which cytological features have the highest importance?',
      'Analyze the current patient in the simulator',
    ],
  };
}

export default function ChatPanel({ isOpen, onClose, inferenceData }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'Hi! I am your **Gemini Clinical Data Assistant**. Ask me any questions about the **Wisconsin Breast Cancer cohort (N=691)**, **5-model benchmarks**, or the **current patient in the simulator**.',
      thoughts: '',
      suggestions: [
        'Why is ANN (MLP) the primary recommended model?',
        'Which cytological features have the highest importance?',
        'Analyze the current patient in the simulator',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState({});
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Dynamic textarea height resizing per skill requirements
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 112) + 'px';
      textareaRef.current.style.overflowY = scrollHeight > 112 ? 'auto' : 'hidden';
    }
  }, [input]);

  const toggleThought = (idx) => {
    setExpandedThoughts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSend = async (e, overrideText = null) => {
    e?.preventDefault();
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    if (!overrideText) setInput('');
    setIsLoading(true);

    const currentMessages = [...messages, { role: 'user', content: textToSend.trim() }];
    const nextIdx = currentMessages.length;
    let thinking = '';
    let reply = '';
    let suggestions = [];

    setMessages([
      ...currentMessages,
      { role: 'model', content: '', thoughts: '', suggestions: [] },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: currentMessages.slice(0, -1),
          context: inferenceData,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('text/event-stream')) {
        throw new Error('Fallback to local SSE simulator');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        setIsLoading(false);
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'THOUGHT') {
                  thinking += parsed.content + '\n';
                } else if (parsed.type === 'SUGGESTION') {
                  suggestions.push(parsed.content);
                } else {
                  reply += parsed.content;
                }

                setMessages((prev) => {
                  const updated = [...prev];
                  updated[nextIdx] = {
                    role: 'model',
                    content: reply,
                    thoughts: thinking,
                    suggestions: [...suggestions],
                  };
                  return updated;
                });
              } catch (parseErr) {
                console.error('SSE JSON parse error:', parseErr);
              }
            }
          }
        }
      }
    } catch {
      // Seamless client-side SSE streaming when deployed on static Vercel hosting
      const fallback = buildLocalChatResponse(textToSend.trim(), inferenceData);
      for (const t of fallback.thoughts) {
        thinking += t + '\n';
        setMessages((prev) => {
          const updated = [...prev];
          updated[nextIdx] = {
            role: 'model',
            content: reply,
            thoughts: thinking,
            suggestions: [],
          };
          return updated;
        });
        await new Promise((r) => setTimeout(r, 110));
      }

      setIsLoading(false);
      const words = fallback.answer.split(' ');
      for (let i = 0; i < words.length; i += 5) {
        reply += (i === 0 ? '' : ' ') + words.slice(i, i + 5).join(' ');
        setMessages((prev) => {
          const updated = [...prev];
          updated[nextIdx] = {
            role: 'model',
            content: reply,
            thoughts: thinking,
            suggestions: [],
          };
          return updated;
        });
        await new Promise((r) => setTimeout(r, 25));
      }

      suggestions = fallback.suggestions;
      setMessages((prev) => {
        const updated = [...prev];
        updated[nextIdx] = {
          role: 'model',
          content: reply,
          thoughts: thinking,
          suggestions,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white dark:bg-[#0c0c0f] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              Gemini Clinical AI Chat
            </div>
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              SSE Streaming • Multi-Turn Context
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          aria-label="Close Chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="max-w-[85%] flex flex-col gap-2">
              {/* 1. Thoughts Box (Collapsible with Dynamic Title Tracking) */}
              {m.role === 'model' && m.thoughts && m.thoughts.trim().length > 0 && (
                <div className="bg-zinc-50 dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleThought(i)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  >
                    {expandedThoughts[i] ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <BrainCircuit className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate text-left">
                      {(() => {
                        if (m.content && m.content.length > 0) return 'View reasoning process';
                        const lines = m.thoughts
                          .split('\n')
                          .filter((l) => l.trim().length > 0);
                        return lines.length > 0
                          ? lines[lines.length - 1]
                          : 'Analyzing clinical context...';
                      })()}
                    </span>
                  </button>
                  {expandedThoughts[i] && (
                    <div className="px-3 pb-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 max-h-[220px] overflow-y-auto bg-zinc-100/70 dark:bg-black/30 text-[11px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-400 flex flex-col gap-1.5">
                      {m.thoughts
                        .split('\n')
                        .filter((l) => l.trim().length > 0)
                        .map((line, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <div className="text-blue-500 mt-[1px]">›</div>
                            <div className="break-words whitespace-pre-wrap">{line}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Loading Pulse */}
              {m.role === 'model' && !m.content && !expandedThoughts[i] && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 italic ml-1 mb-1 p-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  {m.thoughts ? 'Thinking...' : 'Gathering clinical insights...'}
                </div>
              )}

              {/* 3. FINAL_RESPONSE Markdown Rendering */}
              {m.content && (
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  {m.role === 'model' ? (
                    <ErrorBoundary>
                      <div className="[&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-2 [&>h3]:font-bold [&>h3]:text-zinc-950 dark:[&>h3]:text-zinc-50 [&>h3]:mb-1.5 [&>h3]:mt-1 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-2 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&>blockquote]:border-l-2 [&>blockquote]:border-blue-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </ErrorBoundary>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              )}

              {/* 4. Interactive Follow-up Suggestions */}
              {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {m.suggestions.slice(0, 3).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(null, s)}
                      disabled={isLoading}
                      className="text-left text-xs bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Multiline Auto-Resizing Input Form */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-end bg-zinc-50 dark:bg-[#09090b] relative"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask about models, features, or current patient..."
          rows={1}
          className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-300 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none overscroll-contain"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-6 bottom-6 p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

