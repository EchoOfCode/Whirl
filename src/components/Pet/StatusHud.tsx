// ────────────────────────────────────────────────────────────
// StatusHud — Minimalist circular health/aura rings
// ────────────────────────────────────────────────────────────
'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/hooks/useStore';
import { getStageLabel, getStageProgress } from '@/lib/petLogic';

const R = 130;
const R_INNER = 120;
const C = 2 * Math.PI * R;
const C_INNER = 2 * Math.PI * R_INNER;

export default function StatusHud() {
    const pet = useStore((s) => s.pet);
    const focusStatus = useStore((s) => s.focusStatus);

    const healthFraction = pet.health / 100;
    const auraFraction = pet.aura / 100;
    const progress = getStageProgress(pet);

    const healthColor = pet.health > 60 ? '#4ade80' : pet.health > 30 ? '#facc15' : '#ef4444';
    const auraColor = focusStatus === 'FOCUSED' ? '#42d4f5' : focusStatus === 'DISTRACTED' ? '#f54242' : '#666';

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="-160 -160 320 320" className="w-full h-full max-w-[400px] max-h-[400px]" style={{ overflow: 'visible' }}>
                {/* Health ring background (outer) */}
                <circle cx={0} cy={0} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
                {/* Health ring foreground */}
                <motion.circle
                    cx={0} cy={0} r={R}
                    fill="none"
                    stroke={healthColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={`${healthFraction * C} ${C}`}
                    style={{ rotate: -90, transformOrigin: 'center' }}
                    animate={{
                        strokeDasharray: `${healthFraction * C} ${C}`,
                        stroke: healthColor,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {/* Aura ring background (inner) */}
                <circle cx={0} cy={0} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
                {/* Aura ring foreground */}
                <motion.circle
                    cx={0} cy={0} r={R_INNER}
                    fill="none"
                    stroke={auraColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={`${auraFraction * C_INNER} ${C_INNER}`}
                    style={{ rotate: -90, transformOrigin: 'center' }}
                    animate={{
                        strokeDasharray: `${auraFraction * C_INNER} ${C_INNER}`,
                        stroke: auraColor,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </svg>
            {/* Stage label & progress */}
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1">
                <motion.span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: auraColor }}
                    animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {getStageLabel(pet.stage)}
                </motion.span>
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: auraColor }}
                        animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>
        </div>
    );
}
