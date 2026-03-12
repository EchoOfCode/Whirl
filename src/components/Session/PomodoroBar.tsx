// ────────────────────────────────────────────────────────────
// PomodoroBar — Compact session timer with progress
// ────────────────────────────────────────────────────────────
'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/hooks/useStore';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PomodoroBar() {
    const sessionPhase = useStore((s) => s.sessionPhase);
    const pomodoroTimeLeft = useStore((s) => s.pomodoroTimeLeft);
    const pomodoroConfig = useStore((s) => s.pomodoroConfig);

    const isFocus = sessionPhase === 'FOCUS';
    const isBreak = sessionPhase === 'BREAK';
    const totalSeconds = isFocus
        ? pomodoroConfig.focusMinutes * 60
        : pomodoroConfig.breakMinutes * 60;
    const progress = totalSeconds > 0 ? pomodoroTimeLeft / totalSeconds : 0;

    const color = isFocus ? '#42d4f5' : isBreak ? '#f5c542' : '#666';
    const label = isFocus ? 'FOCUS' : isBreak ? 'BREAK' : '';

    if (!isFocus && !isBreak) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs flex flex-col items-center gap-2"
        >
            {/* Timer display */}
            <div className="flex items-center gap-3">
                <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: isBreak ? 2 : 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span
                    className="text-2xl font-mono font-bold tabular-nums tracking-wider"
                    style={{ color }}
                >
                    {formatTime(pomodoroTimeLeft)}
                </span>
                <span className="text-xs text-white/30 uppercase tracking-[0.2em] font-semibold">
                    {label}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </motion.div>
    );
}
