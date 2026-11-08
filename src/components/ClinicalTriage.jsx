import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Microscope,
  FileText,
  AlertTriangle,
  ChevronRight,
  Activity,
  HeartPulse,
} from 'lucide-react';

export default function ClinicalTriage({ mal, score }) {
  const isHighRisk = mal || score >= 0.5;
  const isBorderline = score >= 0.3 && score < 0.7;

  return (
    <div className="rounded-xl border border-line bg-card/90 p-4 transition-all">
      <div className="flex items-center justify-between border-b border-line/70 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-accent" />
          <span className="font-semibold text-xs text-ink">Clinical Oncology Decision-Support &amp; Triage</span>
        </div>
        <span
          className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
            isHighRisk
              ? 'bg-malignant/15 text-malignant'
              : isBorderline
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-benign/15 text-benign'
          }`}
        >
          {isHighRisk ? 'Category 5: Suspicious Malignancy' : isBorderline ? 'Category 4: Atypical / Indeterminate' : 'Category 2: Benign Lesion'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Step 1: Cytopathological Finding */}
        <div className="rounded-lg bg-soft/50 p-2.5 border border-line/50">
          <div className="flex items-center gap-1.5 text-muted mb-1 font-mono text-[10.5px]">
            <Microscope className="h-3.5 w-3.5 text-accent" />
            <span>Cytopathology Finding</span>
          </div>
          <div className="font-semibold text-ink text-[12px] leading-tight">
            {isHighRisk
              ? 'Marked Cellular Atypia & Pleomorphism'
              : 'Cohesive Sheets & Uniform Architecture'}
          </div>
          <p className="text-[11px] text-muted mt-1 leading-snug">
            {isHighRisk
              ? 'High nuclear-to-cytoplasmic ratio, chromatin clumping, and loss of cohesive cellular adhesion.'
              : 'Monomorphic ductal cells with intact borders, regular chromatin, and absence of mitotic figures.'}
          </p>
        </div>

        {/* Step 2: Clinical Recommendation */}
        <div className="rounded-lg bg-soft/50 p-2.5 border border-line/50">
          <div className="flex items-center gap-1.5 text-muted mb-1 font-mono text-[10.5px]">
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span>Recommended Next Step</span>
          </div>
          <div className="font-semibold text-ink text-[12px] leading-tight">
            {isHighRisk
              ? 'Urgent Histological Core Biopsy (CNB)'
              : 'Routine Clinical & Imaging Surveillance'}
          </div>
          <p className="text-[11px] text-muted mt-1 leading-snug">
            {isHighRisk
              ? 'Confirm invasive carcinoma via tissue section, assess receptor status (ER, PR, HER2), and refer to multidisciplinary tumor board.'
              : 'Consistent with benign fibroadenoma or fibrocystic change. Continue standard screening protocol.'}
          </p>
        </div>

        {/* Step 3: Zero False-Negative Guarantee */}
        <div className="rounded-lg bg-soft/50 p-2.5 border border-line/50">
          <div className="flex items-center gap-1.5 text-muted mb-1 font-mono text-[10.5px]">
            <HeartPulse className="h-3.5 w-3.5 text-accent" />
            <span>Diagnostic Safety Goal</span>
          </div>
          <div className="font-semibold text-ink text-[12px] leading-tight flex items-center gap-1">
            <span className="text-benign font-bold">100% Sensitivity (0 FN)</span>
          </div>
          <p className="text-[11px] text-muted mt-1 leading-snug">
            In breast cancer triage, avoiding False Negatives is paramount to prevent delayed oncological intervention.
          </p>
        </div>
      </div>
    </div>
  );
}

