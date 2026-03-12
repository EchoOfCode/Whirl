// ────────────────────────────────────────────────────────────
// SessionSetup — Study mode + duration picker before session
// ────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/hooks/useStore';

const DURATION_PRESETS = [
    { label: '15', minutes: 15, breakMin: 3 },
    { label: '25', minutes: 25, breakMin: 5 },
    { label: '45', minutes: 45, breakMin: 10 },
];

export default function SessionSetup() {
    const [step, setStep] = useState<'mode' | 'duration'>('mode');
    const [selectedDuration, setSelectedDuration] = useState(1); // index into DURATION_PRESETS

    const setStudyMode = useStore((s) => s.setStudyMode);
    const setSessionPhase = useStore((s) => s.setSessionPhase);
    const setPomodoroConfig = useStore((s) => s.setPomodoroConfig);
    const startTracking = useStore((s) => s.startTracking);
    const sendWorkerMessage = useStore((s) => s.sendWorkerMessage);
    const studyMode = useStore((s) => s.studyMode);

    const handleModeSelect = (mode: 'digital' | 'analog') => {
        setStudyMode(mode);
        setStep('duration');
    };

    const handleStart = () => {
        const preset = DURATION_PRESETS[selectedDuration];
        setPomodoroConfig({ focusMinutes: preset.minutes, breakMinutes: preset.breakMin });
        // Tell the worker which study mode so it uses correct thresholds
        sendWorkerMessage({ type: 'SET_STUDY_MODE' as never, mode: studyMode } as never);
        startTracking();
        setSessionPhase('CALIBRATING');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-8 px-8 w-full max-w-sm"
        >
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
                <motion.h1
                    className="text-4xl font-bold tracking-[0.3em] bg-gradient-to-r from-yellow-300 via-cyan-300 to-yellow-300 bg-clip-text text-transparent"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    style={{ backgroundSize: '200% 100%' }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                >
                    WHRIL
                </motion.h1>
                <p className="text-white/30 text-xs tracking-widest uppercase">Smart Study Mode</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'mode' && (
                    <motion.div
                        key="mode"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-5 w-full"
                    >
                        <p className="text-white/50 text-sm">How are you studying?</p>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <motion.button
                                onClick={() => handleModeSelect('digital')}
                                className="flex flex-col items-center gap-2 p-5 rounded-2xl border transition-colors"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.08)',
                                }}
                                whileHover={{
                                    borderColor: 'rgba(66,212,245,0.4)',
                                    background: 'rgba(66,212,245,0.06)',
                                }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <span className="text-3xl">💻</span>
                                <span className="text-sm font-semibold text-white/80">Digital</span>
                                <span className="text-[10px] text-white/30">Screen · Monitor</span>
                            </motion.button>

                            <motion.button
                                onClick={() => handleModeSelect('analog')}
                                className="flex flex-col items-center gap-2 p-5 rounded-2xl border transition-colors"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.08)',
                                }}
                                whileHover={{
                                    borderColor: 'rgba(245,197,66,0.4)',
                                    background: 'rgba(245,197,66,0.06)',
                                }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <span className="text-3xl">📚</span>
                                <span className="text-sm font-semibold text-white/80">Analog</span>
                                <span className="text-[10px] text-white/30">Book · Desk</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {step === 'duration' && (
                    <motion.div
                        key="duration"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-6 w-full"
                    >
                        <p className="text-white/50 text-sm">Focus duration</p>

                        {/* Duration pills */}
                        <div className="flex gap-3">
                            {DURATION_PRESETS.map((preset, i) => (
                                <motion.button
                                    key={preset.label}
                                    onClick={() => setSelectedDuration(i)}
                                    className="relative px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                                    style={{
                                        background: selectedDuration === i
                                            ? 'rgba(66,212,245,0.15)'
                                            : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${selectedDuration === i
                                            ? 'rgba(66,212,245,0.4)'
                                            : 'rgba(255,255,255,0.08)'}`,
                                        color: selectedDuration === i
                                            ? '#42d4f5'
                                            : 'rgba(255,255,255,0.5)',
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {preset.label}m
                                </motion.button>
                            ))}
                        </div>

                        {/* Break info */}
                        <p className="text-white/20 text-xs">
                            {DURATION_PRESETS[selectedDuration].breakMin} min break after each session
                        </p>

                        {/* Start Button */}
                        <motion.button
                            onClick={handleStart}
                            className="relative w-full py-4 rounded-2xl font-semibold text-sm tracking-[0.2em] uppercase overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(245,197,66,0.15), rgba(66,212,245,0.15))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e8e8f0',
                            }}
                            whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.25)' }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-cyan-400/20 to-yellow-400/10"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />
                            <span className="relative z-10">START SESSION</span>
                        </motion.button>

                        {/* Back */}
                        <button
                            onClick={() => setStep('mode')}
                            className="text-white/20 text-xs tracking-widest uppercase hover:text-white/40 transition-colors"
                        >
                            ← BACK
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
