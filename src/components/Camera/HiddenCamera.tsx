// ────────────────────────────────────────────────────────────
// HiddenCamera — Captures frames and sends to detection worker
// Relays worker messages and forwards pending store messages
// ────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';

const FRAME_INTERVAL = 200; // 5fps

export default function HiddenCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const frameLoopRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isTracking = useStore((s) => s.isTracking);
    const setFocusStatus = useStore((s) => s.setFocusStatus);
    const setCameraError = useStore((s) => s.setCameraError);
    const setModelLoading = useStore((s) => s.setModelLoading);
    const setModelReady = useStore((s) => s.setModelReady);
    const setCurrentPose = useStore((s) => s.setCurrentPose);
    const pendingWorkerMessage = useStore((s) => s.pendingWorkerMessage);
    const clearPendingWorkerMessage = useStore((s) => s.clearPendingWorkerMessage);

    const handleWorkerMessage = useCallback(
        (event: MessageEvent) => {
            const { type, status, pose } = event.data;
            switch (type) {
                case 'MODEL_LOADING':
                    setModelLoading(true);
                    break;
                case 'MODEL_READY':
                    setModelLoading(false);
                    setModelReady(true);
                    break;
                case 'MODEL_ERROR':
                    setModelLoading(false);
                    setCameraError('AI model failed to load. Try refreshing.');
                    break;
                case 'DETECTION':
                    if (status) setFocusStatus(status);
                    if (pose) setCurrentPose(pose); // Gated in store
                    break;
                case 'BASELINE_SET':
                case 'BASELINE_CLEARED':
                    // Acknowledgement from worker — no action needed
                    break;
            }
        },
        [setFocusStatus, setCameraError, setModelLoading, setModelReady, setCurrentPose]
    );

    // Initialize Worker
    useEffect(() => {
        const worker = new Worker(
            new URL('../../app/worker/detection.worker.ts', import.meta.url),
            { type: 'module' }
        );
        worker.onmessage = handleWorkerMessage;
        worker.postMessage({ type: 'INIT' });
        workerRef.current = worker;

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, [handleWorkerMessage]);

    // Relay pending worker messages from the store
    useEffect(() => {
        if (pendingWorkerMessage && workerRef.current) {
            workerRef.current.postMessage(pendingWorkerMessage);
            clearPendingWorkerMessage();
        }
    }, [pendingWorkerMessage, clearPendingWorkerMessage]);

    // Start/Stop Camera
    useEffect(() => {
        if (!isTracking) {
            if (frameLoopRef.current) {
                cancelAnimationFrame(frameLoopRef.current);
                frameLoopRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
            return;
        }

        let active = true;

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
                    audio: false,
                });

                if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    startFrameLoop();
                }
            } catch (err) {
                if (active) {
                    setCameraError(
                        err instanceof DOMException && err.name === 'NotAllowedError'
                            ? 'Camera permission denied. Please allow camera access.'
                            : 'Could not access camera.'
                    );
                }
            }
        }

        function startFrameLoop() {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const worker = workerRef.current;
            if (!video || !canvas || !worker) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: false });
            if (!ctx) return;
            canvas.width = 320;
            canvas.height = 240;

            let lastFrameTime = 0;

            function captureFrame(timestamp: number) {
                if (!active) return;
                if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
                    lastFrameTime = timestamp;
                    if (video!.readyState >= 2) {
                        ctx!.drawImage(video!, 0, 0, 320, 240);
                        createImageBitmap(canvas!).then((bitmap) => {
                            worker!.postMessage({ type: 'FRAME', data: bitmap }, [bitmap]);
                        }).catch(() => { });
                    }
                }
                frameLoopRef.current = requestAnimationFrame(captureFrame);
            }

            frameLoopRef.current = requestAnimationFrame(captureFrame);
        }

        startCamera();

        return () => {
            active = false;
            if (frameLoopRef.current) { cancelAnimationFrame(frameLoopRef.current); frameLoopRef.current = null; }
            if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
        };
    }, [isTracking, setCameraError]);

    return (
        <>
            <video
                ref={videoRef}
                playsInline
                muted
                style={{
                    position: 'fixed', bottom: 16, right: 16,
                    width: 160, height: 120, borderRadius: 16,
                    objectFit: 'cover', opacity: isTracking ? 0.6 : 0,
                    zIndex: 50, border: '1px solid rgba(255,255,255,0.15)',
                    pointerEvents: 'none', transition: 'opacity 0.3s ease',
                }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
}
