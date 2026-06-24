# Release Notes

## 1.0.0 (2026-06-24)

Initial release of **Indonesian Widget** — a floating desktop widget for learning Indonesian sentences.

### Features

- **Daily Indonesian Sentences** — Fetches a new A2-level sentence each day via OpenRouter AI, covering greetings, food, travel, work, and family topics
- **Translation Practice** — Type your English translation and get AI-powered validation that accepts natural paraphrases
- **Frameless Always-on-Top Widget** — Stays visible above other windows with a draggable glassmorphism interface
- **System Tray** — Minimize to tray, show/hide on click, right-click menu with Quit
- **Automatic Day Refresh** — Sentence updates automatically when a new calendar day begins
- **Settings Overlay** — Configure your OpenRouter API key and toggle Windows auto-start
- **Persistent History** — All past sentences and attempts are stored locally

### Installation

Download **Indonesian Widget Setup 1.0.0.exe** from the release assets and run the installer. The app launches automatically after installation.

### System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 256 MB minimum
- **Disk:** ~150 MB for the application
- **Network:** Internet connection required for fetching sentences from OpenRouter
- **Dependency:** [OpenRouter](https://openrouter.ai/) API key (free tier supported)

### Known Issues

- The app requires an internet connection and a valid OpenRouter API key to function
- Widget position is not persisted between sessions (resets to center of screen)
- Windows-only release (Cross-platform support planned for a future release)

### Technical Notes

- Built with Electron 35 and React 19, bundled via Vite 6
- Packaged as an NSIS installer via electron-builder
- Uses `openai/gpt-oss-120b:free` model on OpenRouter for sentence generation and translation validation
- All data stored in localStorage (no external databases)
