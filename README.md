# Whril 🌀

Whril is a smart, gamified study and focus timer application built with Next.js. It uses on-device AI (MediaPipe) to track your posture and presence, ensuring you stay focused during your study sessions. 

## WORK STILL IN PROGRESS ##

As you maintain focus, your virtual pet companion grows and thrives!

## ✨ Features

- **Smart Posture Tracking**: Uses your webcam and MediaPipe Vision AI to detect if you are `FOCUSED`, `DISTRACTED`, or `ABSENT`.
- **Privacy First (On-Device AI)**: All camera processing happens locally in your browser using a dedicated Web Worker. No video frames are ever sent to a server.
- **Phase-Driven Pomodoro Timer**: Seamlessly transitions between `IDLE`, `CALIBRATING`, `FOCUS`, `BREAK`, and `READY` phases.
- **Virtual Pet Companion**: Your focus time directly impacts your virtual pet's well-being and growth.
- **Progressive Web App (PWA)**: Installable on your device for a native-like experience.
- **Screen Wake Lock**: Automatically prevents your device screen from sleeping while a focus session is active.
- **Offline Capable**: Uses IndexedDB (`idb-keyval`) to save your pet's progress locally.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI / Computer Vision**: [@mediapipe/tasks-vision](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/web_js)
- **Local Storage**: IndexedDB via `idb-keyval`
- **PWA**: `next-pwa`

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone this repository (if you haven't already).
2. Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `src/app/`: Next.js App Router pages and layouts.
  - `page.tsx`: The main application orchestrator, handling phase transitions and rendering.
  - `worker/`: Contains the Web Worker (`detection.worker.ts`) for off-thread AI inference.
- `src/components/`:
  - `Camera/`: Handles the hidden camera feed and passes frames to the AI worker.
  - `Pet/`: The virtual pet avatar and status HUD.
  - `Session/`: Pomodoro timer, calibration overlay, and session setup components.
- `src/hooks/`: Custom React hooks, including the Zustand `useStore` and the main focus loop logic.
- `src/lib/`: Utility functions and helpers.
- `src/types/`: TypeScript type definitions.

## 🔒 Permissions Required

To operate correctly, Whril requires **Camera** permissions from your browser. This must be allowed when prompted so the AI can track your posture.

> **Note on Incognito Mode:** If you use Whril in Incognito/Private Browsing, your pet's progress will not be saved permanently due to browser storage restrictions.

## 📄 License

This project is licensed under the MIT License.
