import React from 'react';
import { motion } from 'framer-motion';
import { BUNDLE, FEATURES } from '../lib/engine.js';
import { EASE } from './ui.jsx';

const N = 9;
const CX = 150;
const CY = 150;
const R = 95;

const ANGLES = Array.from({ length: N }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / N);

function getPoint(val, i) {
  const norm = Math.max(0, Math.min(1, (val - 1) / 9));
  const r = 10 + norm * R;
  const ang = ANGLES[i];
  return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
}

function getPolygonPath(vals) {
  return vals.map((v, i) => {
    const [x, y] = getPoint(v, i);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

export default function CytologyRadar({ values, mal }) {
  const benignMeans = BUNDLE.means.benign;
  const malignantMeans = BUNDLE.means.malignant;

  const currentPath = getPolygonPath(values);
  const benignPath = getPolygonPath(benignMeans);
  const malignantPath = getPolygonPath(malignantMeans);

  const mainColor = mal ? 'rgb(var(--malignant))' : 'rgb(var(--benign))';

  return (
    <div className="card p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="eyebrow">Multidimensional Signature</div>
          <h4 className="font-display text-lg font-semibold text-ink">9-Axis Tumor Fingerprint</h4>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] font-medium">
          <span className="flex items-center gap-1 text-benign">
            <span className="h-2 w-2 rounded-full bg-benign" /> Benign
          </span>
          <span className="flex items-center gap-1 text-malignant">
            <span className="h-2 w-2 rounded-full bg-malignant" /> Malignant
          </span>
          <span className="flex items-center gap-1 text-accent font-semibold">
            <span className="h-2 w-2 rounded-full bg-accent" /> Sample
          </span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[320px] aspect-square flex items-center justify-center">
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm select-none">
          {/* Concentric grid rings */}
          {[0.25, 0.5, 0.75, 1.0].map((t) => (
            <circle
              key={t}
              cx={CX}
              cy={CY}
              r={10 + t * R}
              fill="none"
              stroke="rgb(var(--line))"
              strokeDasharray={t === 1 ? 'none' : '2 3'}
              strokeWidth={t === 1 ? '1.2' : '0.8'}
              strokeOpacity="0.7"
            />
          ))}

          {/* 9 Radial Spoke Lines & Labels */}
          {ANGLES.map((ang, i) => {
            const x2 = CX + (R + 14) * Math.cos(ang);
            const y2 = CY + (R + 14) * Math.sin(ang);
            const lx = CX + (R + 32) * Math.cos(ang);
            const ly = CY + (R + 32) * Math.sin(ang);

            return (
              <g key={i}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={x2}
                  y2={y2}
                  stroke="rgb(var(--line))"
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
                <text
                  x={lx}
                  y={ly + 3}
                  textAnchor="middle"
                  className="fill-muted font-mono font-medium text-[8.5px]"
                >
                  {FEATURES[i].label.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Historical Benign Polygon */}
          <path
            d={benignPath}
            fill="rgb(var(--benign) / 0.08)"
            stroke="rgb(var(--benign) / 0.45)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />

          {/* Historical Malignant Polygon */}
          <path
            d={malignantPath}
            fill="rgb(var(--malignant) / 0.08)"
            stroke="rgb(var(--malignant) / 0.45)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />

          {/* Live User Sample Polygon */}
          <motion.path
            d={currentPath}
            animate={{ d: currentPath }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            fill={mal ? 'rgb(var(--malignant) / 0.28)' : 'rgb(var(--accent) / 0.25)'}
            stroke={mainColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* 9 Live Vertices */}
          {values.map((v, i) => {
            const [x, y] = getPoint(v, i);
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                animate={{ cx: x, cy: y }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                r="3.5"
                fill={mainColor}
                stroke="rgb(var(--card))"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Center Hub */}
          <circle cx={CX} cy={CY} r="3" fill="rgb(var(--muted))" opacity="0.4" />
        </svg>
      </div>

      <div className="border-t border-line/60 pt-2 text-[11px] text-muted flex items-center justify-between">
        <span>Dynamic morphing 9-axis profile</span>
        <span className="font-mono text-ink">
          {mal ? 'Outward expansion = High atypia' : 'Compact hub = Normal uniformity'}
        </span>
      </div>
    </div>
  );
}

