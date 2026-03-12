// ────────────────────────────────────────────────────────────
// Whril — Main Page (Smart Study Mode)
// Phase-driven rendering: IDLE → CALIBRATING → FOCUS → BREAK → READY
// ────────────────────────────────────────────────────────────
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useStore } from '@/hooks/useStore';
import { useFocusLoop } from '@/hooks/useFocusLoop';
import Link from 'next/link';

// Dynamic imports to avoid SSR issues with browser APIs
const WhrilAvatar = dynamic(() => import('@/components/Pet/WhrilAvatar'), { ssr: false });
const StatusHud = dynamic(() => import('@/components/Pet/StatusHud'), { ssr: false });
const HiddenCamera = dynamic(() => import('@/components/Camera/HiddenCamera'), { ssr: false });
const SessionSetup = dynamic(() => import('@/components/Session/SessionSetup'), { ssr: false });
const CalibrationOverlay = dynamic(() => import('@/components/Session/CalibrationOverlay'), { ssr: false });
const PomodoroBar = dynamic(() => import('@/components/Session/PomodoroBar'), { ssr: false });

export default function HomePage() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const hydrate = useStore((s) => s.hydrate);
  const isHydrated = useStore((s) => s.isHydrated);
  const isTracking = useStore((s) => s.isTracking);
  const isModelLoading = useStore((s) => s.isModelLoading);
  const isModelReady = useStore((s) => s.isModelReady);
  const cameraError = useStore((s) => s.cameraError);
  const isIncognito = useStore((s) => s.isIncognito);
  const focusStatus = useStore((s) => s.focusStatus);
  const pet = useStore((s) => s.pet);
  const sessionPhase = useStore((s) => s.sessionPhase);
  const endSession = useStore((s) => s.endSession);
  const setSessionPhase = useStore((s) => s.setSessionPhase);
  const resetTimer = useStore((s) => s.resetTimer);
  const pomodoroConfig = useStore((s) => s.pomodoroConfig);
  const sendWorkerMessage = useStore((s) => s.sendWorkerMessage);
  const setBaseline = useStore((s) => s.setBaseline);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Activate the game loop
  useFocusLoop();

  // Screen Wake Lock
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => setWakeLock(null));
      }
    } catch {
      // Wake lock not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isTracking) {
        await acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isTracking, acquireWakeLock]);

  // Acquire wake lock when tracking starts
  useEffect(() => {
    if (isTracking) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isTracking, acquireWakeLock, releaseWakeLock]);

  const handleEndSession = () => {
    endSession();
    releaseWakeLock();
  };

  const handleResume = (recalibrate: boolean) => {
    if (recalibrate) {
      // Clear existing baseline, go to calibration
      setBaseline({ yaw: 0, pitch: 0, set: false });
      sendWorkerMessage({ type: 'CLEAR_BASELINE' });
      setSessionPhase('CALIBRATING');
    } else {
      // Keep existing baseline, restart focus timer
      resetTimer(pomodoroConfig.focusMinutes * 60);
      setSessionPhase('FOCUS');
    }
  };

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

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Background ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${sessionPhase === 'BREAK'
            ? 'rgba(245,197,66,0.04)'
            : focusStatus === 'FOCUSED'
              ? 'rgba(245,197,66,0.06)'
              : focusStatus === 'DISTRACTED'
                ? 'rgba(245,66,66,0.04)'
                : 'rgba(100,100,150,0.03)'
            } 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Incognito Warning */}
      <AnimatePresence>
        {isIncognito && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 bg-yellow-900/40 backdrop-blur-sm border border-yellow-600/30 rounded-xl px-4 py-3 z-40"
          >
            <p className="text-yellow-200 text-xs text-center">
              ⚠️ Incognito mode detected. Your pet&apos;s progress won&apos;t be saved.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Error */}
      <AnimatePresence>
        {cameraError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 bg-red-900/40 backdrop-blur-sm border border-red-600/30 rounded-xl px-4 py-3 z-40"
          >
            <p className="text-red-200 text-xs text-center">{cameraError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase-driven Content ── */}
      <AnimatePresence mode="wait">
        {sessionPhase === 'IDLE' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Pet preview */}
            <div className="relative w-40 h-40 mb-2">
              <WhrilAvatar />
            </div>

            <SessionSetup />

            {/* Stats Link */}
            <Link
              href="/stats"
              className="text-white/20 text-xs tracking-widest uppercase hover:text-white/40 transition-colors"
            >
              STATS
            </Link>
          </motion.div>
        )}

        {sessionPhase === 'CALIBRATING' && (
          <CalibrationOverlay key="calibrating" />
        )}

        {(sessionPhase === 'FOCUS' || sessionPhase === 'BREAK') && (
          <motion.div
            key="session"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-5 w-full max-w-sm px-4"
          >
            {/* Model Loading */}
            <AnimatePresence>
              {isModelLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-6 flex items-center gap-2"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-white/40 text-xs">Loading AI...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pomodoro Timer */}
            <PomodoroBar />

            {/* Pet Container with HUD rings */}
            <div className="relative w-full aspect-square flex items-center justify-center">
              <StatusHud />
              <div className={sessionPhase === 'BREAK' ? 'opacity-40 transition-opacity duration-1000' : ''}>
                <WhrilAvatar />
              </div>
            </div>

            {/* Break overlay message */}
            {sessionPhase === 'BREAK' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-yellow-300/80 text-sm font-semibold">☕ Break Time</p>
                <p className="text-white/25 text-xs mt-1">Your pet is resting</p>
              </motion.div>
            )}

            {/* Focus status indicator */}
            {sessionPhase === 'FOCUS' && (
              <motion.div
                className="flex items-center gap-2"
                animate={{ opacity: isModelReady ? 1 : 0.3 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      focusStatus === 'FOCUSED'
                        ? '#4ade80'
                        : focusStatus === 'DISTRACTED'
                          ? '#ef4444'
                          : focusStatus === 'ABSENT'
                            ? '#666'
                            : '#42d4f5',
                  }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-white/30 text-xs uppercase tracking-[0.2em]">
                  {isModelReady ? focusStatus : 'starting...'}
                </span>
              </motion.div>
            )}

            {/* Session info */}
            <div className="text-white/15 text-xs text-center">
              {pet.totalFocusSeconds > 0 && (
                <span>{Math.floor(pet.totalFocusSeconds / 60)}m focused</span>
              )}
            </div>

            {/* End Session */}
            <motion.button
              onClick={handleEndSession}
              className="px-8 py-2 rounded-xl text-xs tracking-[0.2em] uppercase"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.3)',
              }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
              whileTap={{ scale: 0.95 }}
            >
              END SESSION
            </motion.button>
          </motion.div>
        )}

        {sessionPhase === 'READY' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 px-8 w-full max-w-sm"
          >
            {/* Pet preview */}
            <div className="relative w-40 h-40">
              <WhrilAvatar />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white/80">Break&apos;s Over!</h2>
              <p className="text-white/30 text-sm mt-2">
                Ready to continue? Did you change your seating position?
              </p>
            </div>

            {/* Resume buttons */}
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                onClick={() => handleResume(false)}
                className="w-full py-4 rounded-2xl font-semibold text-sm tracking-[0.15em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, rgba(66,212,245,0.15), rgba(66,212,245,0.08))',
                  border: '1px solid rgba(66,212,245,0.25)',
                  color: '#42d4f5',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Resume Session
              </motion.button>

              <motion.button
                onClick={() => handleResume(true)}
                className="w-full py-3 rounded-xl text-xs tracking-[0.15em] uppercase"
                style={{
                  background: 'rgba(245,197,66,0.08)',
                  border: '1px solid rgba(245,197,66,0.2)',
                  color: 'rgba(245,197,66,0.7)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                🔄 Re-calibrate Posture
              </motion.button>

              <button
                onClick={handleEndSession}
                className="text-white/20 text-xs tracking-widest uppercase hover:text-white/40 transition-colors mt-2"
              >
                END SESSION
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Camera (always mounted, only active when tracking) */}
      <HiddenCamera />
    </div>
  );
}
