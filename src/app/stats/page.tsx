// ────────────────────────────────────────────────────────────
// Stats Page — Session history and evolution progress
// ────────────────────────────────────────────────────────────
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useStore } from '@/hooks/useStore';
import { getStageLabel, getStageProgress } from '@/lib/petLogic';

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatAge(createdAt: number): string {
    const diff = Date.now() - createdAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Born today';
    if (days === 1) return '1 day old';
    return `${days} days old`;
}

export default function StatsPage() {
    const hydrate = useStore((s) => s.hydrate);
    const isHydrated = useStore((s) => s.isHydrated);
    const pet = useStore((s) => s.pet);
    const resetPet = useStore((s) => s.resetPet);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    if (!isHydrated) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
                <motion.div
                    className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    const totalSession = pet.totalFocusSeconds + pet.totalDistractedSeconds;
    const focusRatio = totalSession > 0 ? pet.totalFocusSeconds / totalSession : 0;
    const stageProgress = getStageProgress(pet);

    return (
        <div className="min-h-screen w-screen bg-[#0a0a0f] text-white/80 px-6 py-10 flex flex-col gap-8 items-center overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-sm">
                <Link
                    href="/"
                    className="text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition-colors"
                >
                    ← BACK
                </Link>
                <h1 className="text-lg font-semibold tracking-[0.15em] text-white/60">STATS</h1>
                <div className="w-12" />
            </div>

            {/* Pet Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white/80">{getStageLabel(pet.stage)}</h2>
                        <p className="text-xs text-white/30 mt-1">{formatAge(pet.createdAt)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-300">{Math.floor(pet.evolutionXP)}</p>
                        <p className="text-xs text-white/30">XP</p>
                    </div>
                </div>

                {/* Evolution Progress */}
                <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                        <span>Evolution</span>
                        <span>{Math.floor(stageProgress * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${stageProgress * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm grid grid-cols-2 gap-3"
            >
                <StatCard label="Health" value={`${Math.floor(pet.health)}%`} color="#4ade80" />
                <StatCard label="Aura" value={`${Math.floor(pet.aura)}%`} color="#42d4f5" />
                <StatCard label="Focus Time" value={formatTime(pet.totalFocusSeconds)} color="#f5c542" />
                <StatCard label="Distracted" value={formatTime(pet.totalDistractedSeconds)} color="#ef4444" />
            </motion.div>

            {/* Focus Ratio */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
            >
                <p className="text-xs text-white/30 mb-2">Focus Ratio</p>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-white/80">{Math.floor(focusRatio * 100)}</span>
                    <span className="text-lg text-white/30 mb-1">%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mt-3">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background:
                                focusRatio > 0.7
                                    ? 'linear-gradient(to right, #4ade80, #42d4f5)'
                                    : focusRatio > 0.4
                                        ? 'linear-gradient(to right, #facc15, #f59e0b)'
                                        : 'linear-gradient(to right, #ef4444, #dc2626)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${focusRatio * 100}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                </div>
            </motion.div>

            {/* Reset */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                    if (confirm('Are you sure? This will reset your pet to Egg stage.')) {
                        resetPet();
                    }
                }}
                className="text-red-400/40 text-xs tracking-widest uppercase hover:text-red-400/80 transition-colors mt-4"
            >
                RESET PET
            </motion.button>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/30 mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color }}>
                {value}
            </p>
        </div>
    );
}
