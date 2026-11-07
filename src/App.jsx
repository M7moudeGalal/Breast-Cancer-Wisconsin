import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BookOpen, MessageCircle, Moon, Sun, ArrowUp } from 'lucide-react';
import { BUNDLE, valuesFromCase } from './lib/engine.js';
import Hero from './components/Hero.jsx';
import Diagnose from './components/Diagnose.jsx';
import TestCases from './components/TestCases.jsx';
import Performance from './components/Performance.jsx';
import Figures from './components/Figures.jsx';
import Guide from './components/Guide.jsx';
import ChatDrawer from './components/ChatDrawer.jsx';

const NAV = [
  ['#try', '01 · Classify'],
  ['#cases', '02 · Test cases'],
  ['#performance', '03 · Results'],
  ['#figures', '04 · Figures'],
];

export default function App() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [values, setValuesState] = useState(() => valuesFromCase(BUNDLE.cases[0]));
  const [loadedCase, setLoadedCase] = useState(() => BUNDLE.cases[0]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('#try');

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
      { rootMargin: '-35% 0px -55% 0px' }
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

  const loadCase = (c) => {
    setValuesState(valuesFromCase(c));
    setLoadedCase(c);
    const el = document.getElementById('try');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-accent"
      />

      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-ink/80">
              <span className="h-2 w-2 rounded-full bg-malignant" />
            </span>
            <span className="font-display text-xl tracking-tight">Wisconsin Cytology</span>
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-line bg-card p-1 md:flex">
            {NAV.map(([href, label]) => {
              const active = activeNav === href;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setActiveNav(href)}
                  className={`relative rounded-full px-3.5 py-1 text-[13px] transition-colors ${
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
                  <span className="relative">{label}</span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setGuideOpen(true)} className="chip">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">How it works</span>
            </button>
            <button onClick={() => setChatOpen(true)} className="chip">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask Q&amp;A</span>
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card transition hover:border-ink/40"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <Diagnose values={values} setValues={setValues} loadedCase={loadedCase} loadCase={loadCase} />
        <TestCases onTry={loadCase} />
        <Performance />
        <Figures />
      </main>

      <footer className="border-t border-line bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-10 text-xs text-muted">
          <div>
            <span className="font-display text-base text-ink">Wisconsin Breast Cancer Cytology</span> ·{' '}
            {BUNDLE.counts.total} samples · 5 trained scikit-learn models running in-browser · Mayer Romany
          </div>
          <a href="#top" className="chip">
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </footer>

      <Guide open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        values={values}
        loadedCase={loadedCase}
      />
    </div>
  );
}
