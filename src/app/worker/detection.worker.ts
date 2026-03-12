// ────────────────────────────────────────────────────────────
// Detection Worker — MediaPipe FaceLandmarker (off-main-thread)
// Supports both absolute and relative (baseline) detection
// with study-mode-aware thresholds
// ────────────────────────────────────────────────────────────

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let lastFaceTimestamp = 0;
let isProcessing = false;

// ── Baseline & Mode State ──
let baseline: { yaw: number; pitch: number; set: boolean } = { yaw: 0, pitch: 0, set: false };
let studyMode: 'digital' | 'analog' = 'digital';

// Thresholds adjust based on study mode
// Analog (book) needs more pitch tolerance since reading involves natural head bobbing
function getThresholds() {
    if (studyMode === 'analog') {
        return { yaw: 28, pitch: 25 }; // more lenient for looking down at desk
    }
    return { yaw: 25, pitch: 20 }; // tighter for screen-based work
}

async function initializeModel() {
    try {
        self.postMessage({ type: 'MODEL_LOADING' });

        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        try {
            faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU',
                },
                runningMode: 'IMAGE',
                numFaces: 1,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: false,
            });
        } catch {
            faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'CPU',
                },
                runningMode: 'IMAGE',
                numFaces: 1,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: false,
            });
        }

        self.postMessage({ type: 'MODEL_READY' });
    } catch (error) {
        self.postMessage({
            type: 'MODEL_ERROR',
            error: error instanceof Error ? error.message : 'Failed to load model',
        });
    }
}

function calculateYawPitch(landmarks: { x: number; y: number; z: number }[]) {
    if (!landmarks || landmarks.length < 468) return { yaw: 0, pitch: 0 };

    // ── Key Landmarks ──
    const noseTip = landmarks[1];        // Nose tip
    const noseBase = landmarks[6];       // Nose bridge
    const chin = landmarks[152];         // Chin
    const forehead = landmarks[10];      // Top of forehead
    const leftEar = landmarks[234];      // Left ear tragion
    const rightEar = landmarks[454];     // Right ear tragion
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const leftMouth = landmarks[61];     // Left mouth corner
    const rightMouth = landmarks[291];   // Right mouth corner

    // ── YAW (left/right rotation) ──
    // Method: Compare nose-to-ear distances (z-aware) + nose offset from face center
    const faceCenterX = (leftEar.x + rightEar.x) / 2;
    const noseDeviationX = noseTip.x - faceCenterX;

    // Z-depth ratio between ears — when head turns, one ear goes further in z
    const leftDist = Math.sqrt((noseTip.x - leftEyeOuter.x) ** 2 + (noseTip.z - leftEyeOuter.z) ** 2);
    const rightDist = Math.sqrt((noseTip.x - rightEyeOuter.x) ** 2 + (noseTip.z - rightEyeOuter.z) ** 2);
    const asymmetry = (rightDist - leftDist) / (rightDist + leftDist + 0.0001);

    // Mouth width ratio — narrows on the turning side
    const mouthLeft = Math.abs(noseTip.x - leftMouth.x);
    const mouthRight = Math.abs(noseTip.x - rightMouth.x);
    const mouthAsymmetry = (mouthRight - mouthLeft) / (mouthRight + mouthLeft + 0.0001);

    // Combine signals for robust yaw
    const yawRaw = (noseDeviationX * 2.5 + asymmetry * 0.8 + mouthAsymmetry * 0.3);
    const yaw = Math.atan2(yawRaw, 0.8) * (180 / Math.PI);

    // ── PITCH (up/down tilt) ──
    // Method: Ratio of nose-to-forehead vs nose-to-chin distances
    // When looking down, nose moves closer to chin; looking up, closer to forehead
    const noseToForehead = Math.sqrt(
        (noseTip.x - forehead.x) ** 2 +
        (noseTip.y - forehead.y) ** 2 +
        (noseTip.z - forehead.z) ** 2
    );
    const noseToChin = Math.sqrt(
        (noseTip.x - chin.x) ** 2 +
        (noseTip.y - chin.y) ** 2 +
        (noseTip.z - chin.z) ** 2
    );
    const faceHeight = noseToForehead + noseToChin + 0.0001;

    // Center ratio is ~0.38-0.42 when looking straight
    const pitchRatio = noseToForehead / faceHeight;
    // Also use z-axis: nose tip goes forward when looking down
    const noseZOffset = (noseTip.z - noseBase.z) * 100;

    const pitch = ((pitchRatio - 0.40) * 180) + (noseZOffset * 0.3);

    return {
        yaw: Math.max(-90, Math.min(90, yaw)),
        pitch: Math.max(-90, Math.min(90, pitch)),
    };
}

// ── Smoothing: Simple EMA filter to reduce jitter ──
let smoothedYaw = 0;
let smoothedPitch = 0;
const SMOOTH_FACTOR = 0.4; // 0 = full smoothing, 1 = no smoothing

async function processFrame(imageBitmap: ImageBitmap) {
    if (!faceLandmarker || isProcessing) return;
    isProcessing = true;

    try {
        const result = faceLandmarker.detect(imageBitmap);

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            const rawPose = calculateYawPitch(landmarks);
            lastFaceTimestamp = Date.now();

            // Apply EMA smoothing
            smoothedYaw = smoothedYaw + SMOOTH_FACTOR * (rawPose.yaw - smoothedYaw);
            smoothedPitch = smoothedPitch + SMOOTH_FACTOR * (rawPose.pitch - smoothedPitch);

            const pose = { yaw: smoothedYaw, pitch: smoothedPitch };

            let status: string;
            let confidence: number;
            const THRESHOLD = getThresholds();

            if (baseline.set) {
                // ── Relative Detection (Smart Mode) ──
                const deltaYaw = Math.abs(pose.yaw - baseline.yaw);
                const deltaPitch = Math.abs(pose.pitch - baseline.pitch);

                if (deltaYaw > THRESHOLD.yaw || deltaPitch > THRESHOLD.pitch) {
                    status = 'DISTRACTED';
                    confidence = Math.min(1, Math.max(deltaYaw / 45, deltaPitch / 35));
                } else {
                    status = 'FOCUSED';
                    confidence = Math.max(0.5, 1 - Math.max(deltaYaw / THRESHOLD.yaw, deltaPitch / THRESHOLD.pitch));
                }
            } else {
                // ── Absolute Detection (Fallback) ──
                const absYaw = Math.abs(pose.yaw);
                const absPitch = Math.abs(pose.pitch);

                if (absYaw > 20 || absPitch > 15) {
                    status = 'DISTRACTED';
                    confidence = Math.min(1, Math.max(absYaw / 45, absPitch / 30));
                } else {
                    status = 'FOCUSED';
                    confidence = Math.max(0.5, 1 - Math.max(absYaw / 20, absPitch / 15));
                }
            }

            self.postMessage({ type: 'DETECTION', status, confidence, pose });
        } else {
            const absentDuration = Date.now() - lastFaceTimestamp;
            self.postMessage({
                type: 'DETECTION',
                status: absentDuration > 2000 ? 'ABSENT' : 'FOCUSED',
                confidence: absentDuration > 2000 ? 1 : 0.3,
                pose: null,
            });
        }
    } catch {
        // Skip frame on error
    } finally {
        imageBitmap.close();
        isProcessing = false;
    }
}

// ── Message Handler ──
self.onmessage = async (event: MessageEvent) => {
    const { type, data } = event.data;
    switch (type) {
        case 'INIT':
            await initializeModel();
            break;
        case 'FRAME':
            if (data instanceof ImageBitmap) await processFrame(data);
            break;
        case 'SET_BASELINE':
            baseline = { yaw: event.data.yaw, pitch: event.data.pitch, set: true };
            // Reset smoother to baseline to avoid drift on first frames after calibration
            smoothedYaw = event.data.yaw;
            smoothedPitch = event.data.pitch;
            self.postMessage({ type: 'BASELINE_SET', yaw: baseline.yaw, pitch: baseline.pitch });
            break;
        case 'CLEAR_BASELINE':
            baseline = { yaw: 0, pitch: 0, set: false };
            smoothedYaw = 0;
            smoothedPitch = 0;
            self.postMessage({ type: 'BASELINE_CLEARED' });
            break;
        case 'SET_STUDY_MODE':
            studyMode = event.data.mode || 'digital';
            break;
    }
};
