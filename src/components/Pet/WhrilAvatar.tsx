// ────────────────────────────────────────────────────────────
// WhrilAvatar — Procedurally generated SVG pet
// ────────────────────────────────────────────────────────────
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/hooks/useStore';
import { useMemo, useCallback } from 'react';
import type { EvolutionStage, FocusStatus } from '@/lib/petLogic';

function getColors(focus: FocusStatus, aura: number) {
    const a = aura / 100;
    if (focus === 'FOCUSED') {
        return {
            primary: `hsl(${45 + a * 10}, ${80 + a * 20}%, ${55 + a * 15}%)`,
            secondary: `hsl(${190 + a * 10}, ${80 + a * 20}%, ${55 + a * 15}%)`,
            glow: `rgba(245, 197, 66, ${0.3 + a * 0.4})`,
            particle: '#f5c542',
        };
    }
    if (focus === 'DISTRACTED') {
        return {
            primary: `hsl(0, ${30 + (1 - a) * 40}%, ${40 + a * 10}%)`,
            secondary: `hsl(0, 20%, 35%)`,
            glow: `rgba(245, 66, 66, ${0.15 + (1 - a) * 0.2})`,
            particle: '#f54242',
        };
    }
    if (focus === 'ABSENT') {
        return { primary: 'hsl(0,5%,35%)', secondary: 'hsl(0,5%,25%)', glow: 'rgba(100,100,100,0.1)', particle: '#555' };
    }
    return { primary: 'hsl(220,30%,50%)', secondary: 'hsl(220,20%,40%)', glow: 'rgba(100,150,220,0.2)', particle: '#6690dc' };
}

// ── Particles ──
// Use fixed cx/cy + motion x/y transforms to avoid SVG attribute errors
function Particles({ count, color, radius, focus }: { count: number; color: string; radius: number; focus: FocusStatus }) {
    const particles = useMemo(
        () => Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * 360;
            return {
                id: i,
                angle,
                delay: Math.random() * 2,
                size: 2 + Math.random() * 3,
                orbR: radius + Math.random() * 20,
                cx: Math.cos((angle * Math.PI) / 180) * (radius + Math.random() * 20),
                cy: Math.sin((angle * Math.PI) / 180) * (radius + Math.random() * 20),
            };
        }),
        [count, radius]
    );

    return (
        <g>
            {particles.map((p) => {
                // Pre-compute orbit positions for FOCUSED
                const pos0x = Math.cos(((p.angle) * Math.PI) / 180) * p.orbR;
                const pos0y = Math.sin(((p.angle) * Math.PI) / 180) * p.orbR;
                const pos1x = Math.cos(((p.angle + 180) * Math.PI) / 180) * p.orbR;
                const pos1y = Math.sin(((p.angle + 180) * Math.PI) / 180) * p.orbR;

                const jitterX = focus === 'DISTRACTED' ? (Math.random() - 0.5) * 10 : 0;
                const jitterY = focus === 'DISTRACTED' ? (Math.random() - 0.5) * 10 : 0;

                return (
                    <motion.circle
                        key={p.id}
                        cx={0}
                        cy={0}
                        r={p.size}
                        fill={color}
                        animate={
                            focus === 'FOCUSED'
                                ? {
                                    x: [pos0x, pos1x, pos0x],
                                    y: [pos0y, pos1y, pos0y],
                                    opacity: [0.4, 0.9, 0.4],
                                }
                                : {
                                    x: p.cx + jitterX,
                                    y: p.cy + jitterY,
                                    opacity: focus === 'DISTRACTED' ? 0.4 : 0.3,
                                }
                        }
                        transition={{
                            duration: focus === 'FOCUSED' ? 6 + p.delay : 2,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: p.delay,
                        }}
                    />
                );
            })}
        </g>
    );
}

// ── Stage Components ──
// CRITICAL: Never animate r/cx/cy directly. Use scale/x/y transforms instead.

function EggStage({ c, f }: { c: ReturnType<typeof getColors>; f: FocusStatus }) {
    return (
        <motion.g>
            {/* Glow (use scale instead of animating r) */}
            <motion.circle cx={0} cy={0} r={35} fill={c.glow}
                animate={{ scale: [0.91, 1.09, 0.91], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Egg body */}
            <motion.ellipse cx={0} cy={2} rx={22} ry={28} fill={c.primary} stroke={c.secondary} strokeWidth={1.5}
                animate={f === 'DISTRACTED' ? { x: [-2, 2, -2], rotate: [-3, 3, -3] } : { scale: [0.97, 1.03, 0.97] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.3 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Crack pattern */}
            <motion.path d="M -5 -8 L 0 -3 L 5 -9 L 3 -4 L 8 -6" stroke={c.secondary} strokeWidth={1} fill="none" opacity={0.4} />
        </motion.g>
    );
}

function WispStage({ c, f }: { c: ReturnType<typeof getColors>; f: FocusStatus }) {
    return (
        <motion.g>
            {/* Outer glow */}
            <motion.circle cx={0} cy={0} r={50} fill={c.glow}
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Core circle */}
            <motion.circle cx={0} cy={0} r={25} fill={c.primary}
                animate={
                    f === 'DISTRACTED'
                        ? { x: [-4, 4, -3, 3, 0], y: [-2, 2, -1, 1, 0], scale: [0.95, 1.05, 0.95] }
                        : { scale: [0.95, 1.08, 0.95], y: [-3, 3, -3] }
                }
                transition={{ duration: f === 'DISTRACTED' ? 0.4 : 3, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'easeInOut' }}
            />
            {/* Inner light */}
            <motion.circle cx={0} cy={0} r={10} fill={c.secondary}
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </motion.g>
    );
}

function OrbStage({ c, f }: { c: ReturnType<typeof getColors>; f: FocusStatus }) {
    return (
        <motion.g>
            {/* Glow */}
            <motion.circle cx={0} cy={0} r={60} fill={c.glow}
                animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Core */}
            <motion.circle cx={0} cy={0} r={30} fill={c.primary}
                animate={
                    f === 'DISTRACTED'
                        ? { x: [-5, 5, -3, 3, 0], scale: [0.9, 1.1, 0.9] }
                        : { scale: [0.93, 1.07, 0.93], y: [-4, 4, -4] }
                }
                transition={{ duration: f === 'DISTRACTED' ? 0.35 : 3.5, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'easeInOut' }}
            />
            {/* Inner ring */}
            <motion.circle cx={0} cy={0} r={18} fill="none" stroke={c.secondary} strokeWidth={2}
                animate={{ scale: [0.89, 1.11, 0.89], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Particles count={6} color={c.particle} radius={45} focus={f} />
        </motion.g>
    );
}

function ConstructStage({ c, f }: { c: ReturnType<typeof getColors>; f: FocusStatus }) {
    const hex = useCallback((r: number, off = 0) => Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 + off) * Math.PI / 180;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' '), []);

    return (
        <motion.g>
            {/* Glow */}
            <motion.circle cx={0} cy={0} r={70} fill={c.glow}
                animate={{ scale: [0.93, 1.07, 0.93], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Outer hexagon */}
            <motion.polygon points={hex(40)} fill="none" stroke={c.primary} strokeWidth={2}
                animate={f === 'DISTRACTED' ? { rotate: [0, 10, -10, 0], scale: [0.95, 1.05, 0.95] } : { rotate: [0, 360] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.5 : 20, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'linear' }}
            />
            {/* Inner hexagon (counter-rotating) */}
            <motion.polygon points={hex(25, 30)} fill={c.primary} opacity={0.7}
                animate={f === 'DISTRACTED' ? { rotate: [0, -10, 10, 0] } : { rotate: [360, 0] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.5 : 15, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'linear' }}
            />
            {/* Center diamond */}
            <motion.polygon points="0,-12 12,0 0,12 -12,0" fill={c.secondary}
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Particles count={10} color={c.particle} radius={55} focus={f} />
        </motion.g>
    );
}

function SentinelStage({ c, f }: { c: ReturnType<typeof getColors>; f: FocusStatus }) {
    const hex = useCallback((r: number, off = 0) => Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 + off) * Math.PI / 180;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' '), []);

    return (
        <motion.g>
            {/* Multiple glow layers */}
            <motion.circle cx={0} cy={0} r={90} fill={c.glow}
                animate={{ scale: [0.94, 1.06, 0.94], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle cx={0} cy={0} r={70} fill={c.glow}
                animate={{ scale: [0.93, 1.07, 0.93], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            {/* Outer dashed ring */}
            <motion.circle cx={0} cy={0} r={50} fill="none" stroke={c.primary} strokeWidth={1.5} strokeDasharray="8 4"
                animate={f === 'DISTRACTED' ? { rotate: [0, 20, -20, 0] } : { rotate: [0, 360] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.6 : 30, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'linear' }}
            />
            {/* Outer hexagon */}
            <motion.polygon points={hex(42)} fill="none" stroke={c.secondary} strokeWidth={2}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
            {/* Mid hexagon */}
            <motion.polygon points={hex(30, 30)} fill={c.primary} opacity={0.5}
                animate={f === 'DISTRACTED' ? { rotate: [0, -15, 15, 0], scale: [0.95, 1.05, 0.95] } : { rotate: [360, 0] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.5 : 18, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'linear' }}
            />
            {/* Inner star */}
            <motion.polygon points="0,-18 5,-6 18,-6 8,3 11,16 0,9 -11,16 -8,3 -18,-6 -5,-6" fill={c.secondary}
                animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.7, 1, 0.7], rotate: f === 'DISTRACTED' ? [0, 10, -10, 0] : [0, 180, 360] }}
                transition={{ duration: f === 'DISTRACTED' ? 0.4 : 12, repeat: Infinity, ease: f === 'DISTRACTED' ? 'easeOut' : 'linear' }}
            />
            {/* Core */}
            <motion.circle cx={0} cy={0} r={8} fill={f === 'FOCUSED' ? '#fff' : c.primary}
                animate={{ scale: [0.75, 1.25, 0.75], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Particles count={16} color={c.particle} radius={65} focus={f} />
        </motion.g>
    );
}

// ── Main Component ──
export default function WhrilAvatar() {
    const pet = useStore((s) => s.pet);
    const focusStatus = useStore((s) => s.focusStatus);
    const colors = useMemo(() => getColors(focusStatus, pet.aura), [focusStatus, pet.aura]);

    const renderStage = (stage: EvolutionStage) => {
        const props = { c: colors, f: focusStatus };
        switch (stage) {
            case 'egg': return <EggStage {...props} />;
            case 'wisp': return <WispStage {...props} />;
            case 'orb': return <OrbStage {...props} />;
            case 'construct': return <ConstructStage {...props} />;
            case 'sentinel': return <SentinelStage {...props} />;
        }
    };

    return (
        <motion.div
            className="relative flex items-center justify-center"
            style={{ width: '100%', maxWidth: 350, aspectRatio: '1/1' }}
            animate={{ y: focusStatus === 'DISTRACTED' ? [0, -3, 3, -2, 2, 0] : [0, -8, 0] }}
            transition={{ duration: focusStatus === 'DISTRACTED' ? 0.5 : 4, repeat: Infinity, ease: focusStatus === 'DISTRACTED' ? 'easeOut' : 'easeInOut' }}
        >
            <svg viewBox="-120 -120 240 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <AnimatePresence mode="wait">
                    <motion.g key={pet.stage} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
                        {renderStage(pet.stage)}
                    </motion.g>
                </AnimatePresence>
            </svg>
        </motion.div>
    );
}
