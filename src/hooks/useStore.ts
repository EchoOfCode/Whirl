// ────────────────────────────────────────────────────────────
// Zustand Store — Global state with IndexedDB persistence
// ────────────────────────────────────────────────────────────
'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { PetStats, FocusStatus, createNewPet, tickUpdate } from '@/lib/petLogic';
import type {
    SessionPhase, StudyMode, CalibrationData,
    PomodoroConfig, HeadPose, WorkerOutboundMessage,
} from '@/lib/types';

const IDB_KEY = 'whril-pet-state';
const SAVE_DEBOUNCE_MS = 5000;
const DEFAULT_POMODORO: PomodoroConfig = { focusMinutes: 25, breakMinutes: 5 };

export interface WhrilState {
    // ── Persisted (pet data) ──
    pet: PetStats;

    // ── Session-only (NOT persisted) ──
    focusStatus: FocusStatus;
    isTracking: boolean;
    isHydrated: boolean;
    cameraError: string | null;
    isIncognito: boolean;
    isModelLoading: boolean;
    isModelReady: boolean;

    // ── Smart Study Mode ──
    sessionPhase: SessionPhase;
    studyMode: StudyMode;
    baseline: CalibrationData;
    currentPose: HeadPose | null;
    pomodoroTimeLeft: number;
    pomodoroConfig: PomodoroConfig;
    pendingWorkerMessage: WorkerOutboundMessage | null;

    // ── Actions ──
    tick: () => void;
    setFocusStatus: (status: FocusStatus) => void;
    startTracking: () => void;
    stopTracking: () => void;
    setCameraError: (error: string | null) => void;
    setIncognito: (val: boolean) => void;
    setModelLoading: (val: boolean) => void;
    setModelReady: (val: boolean) => void;
    hydrate: () => Promise<void>;
    resetPet: () => void;

    // ── Smart Study Actions ──
    setSessionPhase: (phase: SessionPhase) => void;
    setStudyMode: (mode: StudyMode) => void;
    setBaseline: (data: CalibrationData) => void;
    setCurrentPose: (pose: HeadPose | null) => void;
    setPomodoroConfig: (config: PomodoroConfig) => void;
    decrementTimer: () => void;
    resetTimer: (seconds: number) => void;
    sendWorkerMessage: (msg: WorkerOutboundMessage) => void;
    clearPendingWorkerMessage: () => void;
    endSession: () => void;
}

export const useStore = create<WhrilState>()(
    subscribeWithSelector((set, get) => ({
        // ── Persisted ──
        pet: createNewPet(),

        // ── Session-only ──
        focusStatus: 'IDLE' as FocusStatus,
        isTracking: false,
        isHydrated: false,
        cameraError: null,
        isIncognito: false,
        isModelLoading: false,
        isModelReady: false,

        // ── Smart Study Mode ──
        sessionPhase: 'IDLE' as SessionPhase,
        studyMode: 'digital' as StudyMode,
        baseline: { yaw: 0, pitch: 0, set: false },
        currentPose: null,
        pomodoroTimeLeft: DEFAULT_POMODORO.focusMinutes * 60,
        pomodoroConfig: DEFAULT_POMODORO,
        pendingWorkerMessage: null,

        // ── Core Actions ──
        tick: () => {
            const { pet, focusStatus } = get();
            const updatedPet = tickUpdate(pet, focusStatus);
            set({ pet: updatedPet });
        },

        setFocusStatus: (status) => set({ focusStatus: status }),

        startTracking: () => set({ isTracking: true, focusStatus: 'FOCUSED' }),

        stopTracking: () => set({ isTracking: false, focusStatus: 'IDLE' }),

        setCameraError: (error) => set({ cameraError: error }),
        setIncognito: (val) => set({ isIncognito: val }),
        setModelLoading: (val) => set({ isModelLoading: val }),
        setModelReady: (val) => set({ isModelReady: val }),

        hydrate: async () => {
            try {
                const saved = await idbGet<PetStats>(IDB_KEY);
                if (saved && typeof saved.health === 'number' && typeof saved.aura === 'number' && typeof saved.evolutionXP === 'number') {
                    set({ pet: saved, isHydrated: true });
                    return;
                }
            } catch {
                set({ isIncognito: true });
            }
            set({ isHydrated: true });
        },

        resetPet: () => {
            const newPet = createNewPet();
            set({ pet: newPet, focusStatus: 'IDLE', isTracking: false });
            idbSet(IDB_KEY, newPet).catch(() => { });
        },

        // ── Smart Study Actions ──
        setSessionPhase: (phase) => set({ sessionPhase: phase }),

        setStudyMode: (mode) => set({ studyMode: mode }),

        setBaseline: (data) => set({ baseline: data }),

        // Gated update: only set if pose actually changed meaningfully (>0.5° delta)
        setCurrentPose: (pose) => {
            if (!pose) { set({ currentPose: null }); return; }
            const prev = get().currentPose;
            if (prev) {
                const dYaw = Math.abs(pose.yaw - prev.yaw);
                const dPitch = Math.abs(pose.pitch - prev.pitch);
                if (dYaw < 0.5 && dPitch < 0.5) return; // Gate: skip trivial updates
            }
            set({ currentPose: pose });
        },

        setPomodoroConfig: (config) => set({
            pomodoroConfig: config,
            pomodoroTimeLeft: config.focusMinutes * 60,
        }),

        decrementTimer: () => {
            const tl = get().pomodoroTimeLeft;
            if (tl > 0) set({ pomodoroTimeLeft: tl - 1 });
        },

        resetTimer: (seconds) => set({ pomodoroTimeLeft: seconds }),

        sendWorkerMessage: (msg) => set({ pendingWorkerMessage: msg }),

        clearPendingWorkerMessage: () => set({ pendingWorkerMessage: null }),

        endSession: () => {
            set({
                sessionPhase: 'IDLE',
                isTracking: false,
                focusStatus: 'IDLE',
                baseline: { yaw: 0, pitch: 0, set: false },
                currentPose: null,
                pomodoroTimeLeft: get().pomodoroConfig.focusMinutes * 60,
                pendingWorkerMessage: { type: 'CLEAR_BASELINE' },
            });
        },
    }))
);

// Auto-Save (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe(
    (state) => state.pet,
    (pet) => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            idbSet(IDB_KEY, pet).catch(() => { });
        }, SAVE_DEBOUNCE_MS);
    }
);

// Force-save on unload + visibility change (covers rapid close / swipe away)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        const pet = useStore.getState().pet;
        idbSet(IDB_KEY, pet).catch(() => { });
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            const pet = useStore.getState().pet;
            idbSet(IDB_KEY, pet).catch(() => { });
        }
    });
}
