// ────────────────────────────────────────────────────────────
// useFocusLoop — Game heartbeat with Pomodoro timer
// Only ticks pet stats during FOCUS phase.
// Manages FOCUS → BREAK → READY phase transitions.
// ────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/hooks/useStore';

export function useFocusLoop() {
    const isTracking = useStore((s) => s.isTracking);
    const sessionPhase = useStore((s) => s.sessionPhase);
    const tick = useStore((s) => s.tick);
    const decrementTimer = useStore((s) => s.decrementTimer);
    const pomodoroTimeLeft = useStore((s) => s.pomodoroTimeLeft);
    const pomodoroConfig = useStore((s) => s.pomodoroConfig);
    const setSessionPhase = useStore((s) => s.setSessionPhase);
    const resetTimer = useStore((s) => s.resetTimer);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Only run when tracking and in FOCUS or BREAK phase
        const isActive = isTracking && (sessionPhase === 'FOCUS' || sessionPhase === 'BREAK');

        if (!isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            const currentTime = useStore.getState().pomodoroTimeLeft;
            const currentPhase = useStore.getState().sessionPhase;

            if (currentTime <= 0) {
                // Timer expired — transition phase
                if (currentPhase === 'FOCUS') {
                    // FOCUS → BREAK
                    setSessionPhase('BREAK');
                    resetTimer(pomodoroConfig.breakMinutes * 60);
                } else if (currentPhase === 'BREAK') {
                    // BREAK → READY (gated — user must press Resume)
                    setSessionPhase('READY');
                }
                return;
            }

            // Decrement timer
            decrementTimer();

            // Only update pet stats during FOCUS
            if (currentPhase === 'FOCUS') {
                tick();
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isTracking, sessionPhase, tick, decrementTimer, setSessionPhase, resetTimer, pomodoroConfig]);
}
