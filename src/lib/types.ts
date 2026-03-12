// ────────────────────────────────────────────────────────────
// Shared Types — Smart Study Mode
// ────────────────────────────────────────────────────────────

/** Session lifecycle phases */
export type SessionPhase = 'IDLE' | 'CALIBRATING' | 'FOCUS' | 'BREAK' | 'READY';

/** Study posture preset */
export type StudyMode = 'digital' | 'analog';

/** Baseline posture captured during calibration */
export interface CalibrationData {
    yaw: number;
    pitch: number;
    set: boolean;
}

/** Pomodoro timing configuration */
export interface PomodoroConfig {
    focusMinutes: number;
    breakMinutes: number;
}

/** Head pose from worker */
export interface HeadPose {
    yaw: number;
    pitch: number;
}

/** Messages that can be sent to the detection worker */
export type WorkerOutboundMessage =
    | { type: 'INIT' }
    | { type: 'FRAME'; data: ImageBitmap }
    | { type: 'SET_BASELINE'; yaw: number; pitch: number }
    | { type: 'CLEAR_BASELINE' };
