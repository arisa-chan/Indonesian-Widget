# Indonesian Widget

**Indonesian Sentence of the Day — Floating Desktop Widget**

A lightweight, always-on-top desktop widget that helps you learn Indonesian (Bahasa Indonesia) with a new sentence every day. Type your English translation and get AI-powered feedback — all from a frameless, glassmorphism widget that lives in your system tray.

![Widget Preview](https://img.shields.io/badge/platform-Windows-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## Features

- **Daily Indonesian Sentences** — One new A2-level sentence every day on topics like greetings, food, travel, work, and family
- **AI-Powered Translation Check** — OpenRouter validates your English translation against the correct answer, accepting natural paraphrases
- **Frameless Transparent Widget** — Stays on top of all windows without getting in the way
- **System Tray Integration** — Minimizes to tray, runs unobtrusively in the background
- **Automatic Day Detection** — Refreshes the sentence when a new day starts
- **Settings Panel** — Configure your OpenRouter API key and toggle auto-start with Windows
- **No Backend Required** — Everything runs locally on your machine
- **Glassmorphism UI** — Modern frosted-glass design with backdrop blur

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later
- An [OpenRouter](https://openrouter.ai/) API key (free tier supported)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd indonesian-widget
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This starts the Vite dev server and launches the Electron window with hot-reload.

### 3. Configure API Key

1. Right-click the system tray icon and select **Show Widget**
2. Click the blue settings button (top-right)
3. Enter your OpenRouter API key
4. The widget will start fetching sentences automatically

## Building for Production

To build the installer:

```bash
npm run dist
```

This generates an NSIS installer at `release/Indonesian Widget Setup 1.0.0.exe`.

To build only the frontend assets (without packaging):

```bash
npm run build
```

## Usage

| Action | How |
|--------|-----|
| **Drag widget** | Click and drag the title bar |
| **Minimize to tray** | Click the yellow minimize button |
| **Close / hide to tray** | Click the red close button |
| **Quit app** | Right-click tray icon → Quit |
| **Open settings** | Click the blue settings button |
| **Check translation** | Type in the input box and click "Check Answer" |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 35 |
| UI Framework | React 19 |
| Bundler | Vite 6 |
| Language | TypeScript 5 |
| Styling | Plain CSS (glassmorphism) |
| AI API | OpenRouter (openai/gpt-oss-120b:free) |
| Packaging | electron-builder (NSIS) |

## Project Structure

```
indonesian-widget/
├── electron/           # Electron main process
│   ├── main.js         # Window, tray, IPC, day-change detection
│   └── preload.js      # Secure context bridge (contextIsolation)
├── src/                # React renderer
│   ├── App.tsx         # Root component (state machine)
│   ├── App.css         # All styles (glassmorphism)
│   ├── api.ts          # OpenRouter API integration
│   ├── storage.ts      # localStorage persistence
│   ├── components/     # UI components
│   └── types/          # TypeScript interfaces
├── scripts/            # Build utilities
├── build/              # Generated assets (icons)
└── release/            # Installer output
```

## Security

- **contextIsolation: true** — no direct Node.js access from the renderer
- **nodeIntegration: false** — Electron security best practices
- **Preload bridge** — only 5 specific IPC methods exposed to the UI
- All external communication is through the OpenRouter API only

## License

MIT
