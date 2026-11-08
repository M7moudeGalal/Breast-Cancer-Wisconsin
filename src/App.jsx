import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { BookOpen, Moon, Sun, ArrowUp, Menu, X, CheckCircle2, AlertOctagon, Dna } from 'lucide-react';
import { BUNDLE, valuesFromCase } from './lib/engine.js';
import Hero from './components/Hero.jsx';
import Diagnose from './components/Diagnose.jsx';
import TestCases from './components/TestCases.jsx';
import Performance from './components/Performance.jsx';
import Figures from './components/Figures.jsx';
import Guide from './components/Guide.jsx';

const NAV = [
  ['#try', 'Try Classifier'],
  ['#cases', 'Test Cases'],
  ['#performance', 'Model Results'],
  ['#figures', 'Research Figures'],
];

export default function App() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [values, setValuesState] = useState(() => valuesFromCase(BUNDLE.cases[0]));
  const [loadedCase, setLoadedCase] = useState(() => BUNDLE.cases[0]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('#try');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.2 });

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
    const ids = ['try', 'cases', 'performance', 'figures'];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveNav(`#${entry.target.id}`);
        });
      },
      { rootMargin: '-30% 0px -50% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const setValues = (nextVals, c = null) => {
    setValuesState(nextVals);
    setLoadedCase(c);
  };

  const loadCase = (c, shouldScroll = true) => {
    setValuesState(valuesFromCase(c));
    setLoadedCase(c);
    if (shouldScroll) {
      const el = document.getElementById('try');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast(c);
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300 overflow-x-hidden">
      {/* Top scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent"
      />

      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-2.5">
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-accent/25 via-ink to-ink text-paper shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lift ring-1 ring-ink/20">
              <Dna className="h-4 w-4 text-accent transition-transform duration-500 group-hover:rotate-180" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[17px] tracking-tight leading-tight font-bold bg-gradient-to-r from-ink via-ink to-accent bg-clip-text">
                Cytology.AI
              </span>
              <span className="text-[9.5px] font-mono text-muted uppercase tracking-wider font-medium">
                Clinical Diagnostic Suite
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-card p-1 md:flex shadow-sm">
            {NAV.map(([href, label]) => {
              const active = activeNav === href;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setActiveNav(href)}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    active ? 'text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="top-nav-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </a>
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card transition hover:border-ink/40"
            >
              {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-ink" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card md:hidden"
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
                {NAV.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => {
                      setActiveNav(href);
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      activeNav === href ? 'bg-soft text-ink font-semibold' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {label}
                  </a>
                ))}
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

      {/* Main Single Application Flow */}
      <main>
        <Hero onOpenGuide={() => setGuideOpen(true)} />
        <Diagnose values={values} setValues={setValues} loadedCase={loadedCase} loadCase={loadCase} />
        <TestCases onTry={loadCase} />
        <Performance />
        <Figures />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-card/50">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-muted">
          <div className="space-y-1">
            <div className="font-display text-base text-ink font-semibold">
              Cytology.AI · Clinical Diagnostic Suite
            </div>
            <p>
              {BUNDLE.counts.total} samples · 5 trained scikit-learn models running client-side · Mayer Romany
            </p>
          </div>
          <a href="#top" className="chip">
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </a>
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