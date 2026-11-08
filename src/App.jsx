import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Moon,
  Sun,
  Menu,
  X,
  CheckCircle2,
  AlertOctagon,
  Dna,
  Sliders,
  FlaskConical,
  Activity,
  Image as ImageIcon,
  ArrowUp,
} from 'lucide-react';
import { BUNDLE, valuesFromCase } from './lib/engine.js';
import Overview from './components/Overview.jsx';
import Diagnose from './components/Diagnose.jsx';
import TestCases from './components/TestCases.jsx';
import Performance from './components/Performance.jsx';
import Figures from './components/Figures.jsx';
import Guide from './components/Guide.jsx';

const TABS = [
  { id: 'overview', label: 'Overview & Lens', icon: Dna },
  { id: 'try', label: 'Try Classifier', icon: Sliders },
  { id: 'cases', label: '139 Test Cases', icon: FlaskConical },
  { id: 'performance', label: 'Model Benchmarks', icon: Activity },
  { id: 'figures', label: 'Research Atlas', icon: ImageIcon },
];

export default function App() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [values, setValuesState] = useState(() => valuesFromCase(BUNDLE.cases[0]));
  const [loadedCase, setLoadedCase] = useState(() => BUNDLE.cases[0]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const h = window.location.hash.replace('#', '');
      return ['overview', 'try', 'cases', 'performance', 'figures'].includes(h) ? h : 'overview';
    } catch {
      return 'overview';
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }
  }, [dark]);

  useEffect(() => {
    const handleHash = () => {
      try {
        const h = window.location.hash.replace('#', '');
        if (['overview', 'try', 'cases', 'performance', 'figures'].includes(h)) {
          setActiveTab(h);
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    try {
      if (window.location.hash.replace('#', '') !== tabId) {
        window.history.replaceState(null, '', '#' + tabId);
      }
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const setValues = (nextVals, c = null) => {
    setValuesState(nextVals);
    setLoadedCase(c);
  };

  const loadCase = (c) => {
    setValuesState(valuesFromCase(c));
    setLoadedCase(c);
    switchTab('try');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(c);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300 overflow-x-hidden relative flex flex-col justify-between">
      {/* Ambient glowing radial orbs & tech grid to eliminate empty dark void */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-36 -left-36 h-[520px] w-[520px] rounded-full bg-accent/8 blur-[120px] dark:bg-accent/15" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-benign/6 blur-[130px] dark:bg-benign/12" />
        <div className="absolute -bottom-40 left-1/4 h-[480px] w-[480px] rounded-full bg-malignant/5 blur-[140px] dark:bg-malignant/10" />
        <div className="absolute inset-0 bg-tech-grid opacity-35 dark:opacity-20" />
      </div>

      {/* Sticky Editorial Header with Interactive Tab Navigation */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-2.5">
          <button
            onClick={() => switchTab('overview')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-accent/25 via-ink to-ink text-paper shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lift ring-1 ring-ink/20">
              <Dna className="h-4 w-4 text-accent transition-transform duration-500 group-hover:rotate-180" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-[17px] tracking-tight leading-tight font-bold bg-gradient-to-r from-ink via-ink to-accent bg-clip-text">
                  Cytology.AI
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-0.2 text-[10px] font-semibold text-pink-600 dark:text-pink-400">
                  <span>🎀</span>
                  <span>Breast Oncology</span>
                </span>
              </div>
              <span className="text-[9.5px] font-mono text-muted uppercase tracking-wider font-medium">
                Clinical Diagnostic Suite
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-card p-1 md:flex shadow-sm">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
                    active ? 'text-paper font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="top-tab-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    />
                  )}
                  <Icon className={`relative z-10 h-3.5 w-3.5 ${active ? 'text-accent' : 'opacity-70'}`} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideOpen(true)}
              className="chip hidden sm:inline-flex"
              title="Learn how the machine learning pipeline works"
            >
              <BookOpen className="h-3.5 w-3.5 text-muted" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card transition hover:border-ink/40 cursor-pointer"
            >
              {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-ink" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-line bg-card px-5 py-3 md:hidden shadow-lg"
            >
              <div className="flex flex-col gap-1 pb-2">
                {TABS.map((t) => {
                  const active = activeTab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTab(t.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left ${
                        active ? 'bg-soft text-ink font-semibold' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-accent" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <button
                  onClick={() => {
                    setGuideOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="chip flex-1 justify-center py-2"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>How It Works</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Persistent Tabbed Application View */}
      <main className="relative z-10 flex-1">
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          <Overview
            onOpenGuide={() => setGuideOpen(true)}
            onGoToTry={() => switchTab('try')}
            onGoToCases={() => switchTab('cases')}
          />
        </div>

        <div className={activeTab === 'try' ? 'block' : 'hidden'}>
          <Diagnose values={values} setValues={setValues} loadedCase={loadedCase} loadCase={loadCase} />
        </div>

        <div className={activeTab === 'cases' ? 'block' : 'hidden'}>
          <TestCases onTry={loadCase} />
        </div>

        <div className={activeTab === 'performance' ? 'block' : 'hidden'}>
          <Performance />
        </div>

        <div className={activeTab === 'figures' ? 'block' : 'hidden'}>
          <Figures />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-line bg-card/60 mt-12">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-7 text-xs text-muted">
          <div className="space-y-1">
            <div className="font-display text-base text-ink font-semibold">
              Cytology.AI · Clinical Diagnostic Suite
            </div>
            <p>
              {BUNDLE.counts.total} samples · 5 trained scikit-learn models running client-side · Mayer Romany
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-soft px-3 py-1 font-mono text-[11px] text-muted">
              Active Tab: <strong className="text-ink capitalize">{activeTab}</strong>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="chip cursor-pointer"
            >
              Back to top <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Drawers */}
      <Guide open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Live Toast Feedback Pill */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-line bg-card/95 px-4 py-3 shadow-lift backdrop-blur-md"
          >
            {toast.y ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-malignant/15 text-malignant">
                <AlertOctagon className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-benign/15 text-benign">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
            <div className="text-xs">
              <div className="font-semibold text-ink">
                Loaded Patient <span className="font-mono">#{toast.id}</span> into Classifier
              </div>
              <div className="text-[11px] text-muted">
                Confirmed Histology:{' '}
                <strong className={toast.y ? 'text-malignant' : 'text-benign'}>
                  {toast.y ? 'Malignant (Cancerous)' : 'Benign (Non-Cancerous)'}
                </strong>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
