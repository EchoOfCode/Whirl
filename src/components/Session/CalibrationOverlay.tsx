// ────────────────────────────────────────────────────────────
// CalibrationOverlay — 3-second posture lock during calibration
// ────────────────────────────────────────────────────────────
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/hooks/useStore';

export default function CalibrationOverlay() {
    const [countdown, setCountdown] = useState(3);
    const [phase, setPhase] = useState<'instruction' | 'counting' | 'locking'>('instruction');
    const poseBuffer = useRef<{ yaw: number; pitch: number }[]>([]);

    const currentPose = useStore((s) => s.currentPose);
    const setBaseline = useStore((s) => s.setBaseline);
    const setSessionPhase = useStore((s) => s.setSessionPhase);
    const sendWorkerMessage = useStore((s) => s.sendWorkerMessage);
    const studyMode = useStore((s) => s.studyMode);

    // Collect poses during calibration
    useEffect(() => {
        if (phase === 'counting' && currentPose) {
            poseBuffer.current.push({ ...currentPose });
        }
    }, [currentPose, phase]);

    // Start counting after instruction phase
    useEffect(() => {
        if (phase === 'instruction') {
            const timer = setTimeout(() => setPhase('counting'), 1500);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Countdown timer
    useEffect(() => {
        if (phase !== 'counting') return;

        if (countdown <= 0) {
            setPhase('locking');
            return;
        }

        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, countdown]);

    // Lock baseline when countdown reaches 0
    useEffect(() => {
        if (phase !== 'locking') return;

        const poses = poseBuffer.current;
        let avgYaw = 0;
        let avgPitch = 0;

        if (poses.length > 0) {
            avgYaw = poses.reduce((s, p) => s + p.yaw, 0) / poses.length;
            avgPitch = poses.reduce((s, p) => s + p.pitch, 0) / poses.length;
        }

        // Set baseline in store
        setBaseline({ yaw: avgYaw, pitch: avgPitch, set: true });

        // Send to worker
        sendWorkerMessage({ type: 'SET_BASELINE', yaw: avgYaw, pitch: avgPitch });

        // Transition to FOCUS after a brief "locked" animation
        const timer = setTimeout(() => {
            setSessionPhase('FOCUS');
        }, 600);

        return () => clearTimeout(timer);
    }, [phase, setBaseline, sendWorkerMessage, setSessionPhase]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-md px-8"
        >
            <AnimatePresence mode="wait">
                {phase === 'instruction' && (
                    <motion.div
                        key="instruction"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <motion.div
                            className="text-5xl"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {studyMode === 'digital' ? '💻' : '📚'}
                        </motion.div>
                        <h2 className="text-xl font-bold text-white/90">
                            Adopt your study posture
                        </h2>
                        <p className="text-sm text-white/40 max-w-xs">
                            {studyMode === 'digital'
                                ? 'Look at your screen naturally. Stay still.'
                                : 'Look down at your book or desk. Stay still.'}
                        </p>
                    </motion.div>
                )}

                {phase === 'counting' && (
                    <motion.div
                        key="counting"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Pulsing ring */}
                        <div className="relative">
                            <motion.div
                                className="w-32 h-32 rounded-full border-2 border-cyan-400/40"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <motion.span
                                key={countdown}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-cyan-300"
                            >
                                {countdown}
                            </motion.span>
                        </div>
                        <p className="text-white/30 text-xs uppercase tracking-[0.3em]">
                            Locking posture...
                        </p>
                    </motion.div>
                )}

                {phase === 'locking' && (
                    <motion.div
                        key="locked"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <motion.div
                            className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-2xl">✓</span>
                        </motion.div>
                        <p className="text-cyan-300 text-sm font-semibold">Posture Locked</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
