# Release Notes

## 1.2.0 (2026-07-01)

Adaptive difficulty system — the app now tracks your skill with Elo ratings and auto-adjusts sentence difficulty from A1 through C2.

### New Features

- **Elo Difficulty Progression System** — Your Elo rating (starting at 400 = A1) adjusts by ±16 per answer. Correct answers increase your Elo, gradually unlocking harder CEFR levels. Wrong answers decrease it, easing back to simpler sentences.
- **6-Tier CEFR Mapping** — A1 (0–799) → A2 (800–1199) → B1 (1200–1599) → B2 (1600–1999) → C1 (2000–2399) → C2 (2400–3000)
- **Target CEFR Display** — The footer now shows both your current Elo tier (e.g. `A1 · Elo: 416`) and today's sentence CEFR estimate
- **Dynamic Sentence Generation** — The AI prompt now includes the user's current CEFR target level so sentences match your demonstrated skill

### Bug Fixes

- Fixed crash when OpenRouter API returned unexpected response structures (missing `choices` or `content`)
- Fixed JSON parsing failures when the AI model returned malformed or markdown-wrapped JSON
- Fixed Elo rating direction — correct answers now correctly raise Elo (harder sentences) instead of lowering it
- Fixed default CEFR label on saved sentences from A2 to A1 (matching the new starting level)

### Installation

Download **Indonesian Widget Setup 1.2.0.exe** from the release assets and run the installer. The app launches automatically after installation.

### System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 256 MB minimum
- **Disk:** ~150 MB for the application
- **Network:** Internet connection required for fetching sentences from OpenRouter
- **Dependency:** OpenRouter API key (free tier supported)

### Known Issues

- The app requires an internet connection and a valid OpenRouter API key to function
- Widget position is not persisted between sessions (resets to center of screen)
- Windows-only release (cross-platform support planned)

### Technical Notes

- Built with Electron 35 and React 19, bundled via Vite 6
- Packaged as an NSIS installer via electron-builder
- Uses `openai/gpt-oss-120b:free` model on OpenRouter
- All data stored in localStorage (no external databases)
- Tray icon generated programmatically (no file dependency, works in both dev and production)

---

## 1.1.0 (2026-06-29)

Major feature update with enhanced sentence variety, learning tools, and UI improvements.

### New Features

- **Sentence Reset** — Generate a completely different sentence of the day with one click (max 1x/day)
- **Vocabulary Panel** — After checking your answer, tap the floating 📚 button to see word-by-word Indonesian→English translations
- **Elo Difficulty Rating** — A dynamic score (starting at 1200) that adjusts per answer: correct answers decrease it, wrong answers increase it
- **CEFR Level Indicator** — Each sentence now shows its estimated CEFR level (A1–C2)
- **Fancy Tray Icon** — Indonesian flag (red over white) with gold "ID" monogram — no more orange square!

### Enhanced Sentence Variety

- **210+ sentence styles** (up from 109) — covers every Indonesian grammatical pattern, from micro exclamations to 35-word compound-complex narratives
- **100 topics** (up from 50) — now includes Indonesian-specific cultural topics: nongkrong, jam karet, gotong royong, arisan, mudik, buka puasa, and more
- **28 moods** (up from 12) — anxious, relieved, grumpy, mischievous, romantic, nostalgic, and more
- **16 registers** (up from 8) — added chat/text abbreviations, market bargaining speech, Javanese/Sundanese/Betawi influences, religious/solemn tone, and code-switching
- **12 narrative persons** (up from 7) — split first/second/third person into formal vs colloquial vs intimate variants
- **19 forbidden patterns** (up from 9) — stronger guardrails against repetitive output
- **~113 million unique sentence parameter combinations** (up from 3.6M)

### Installation

Download **Indonesian Widget Setup 1.1.0.exe** from the release assets and run the installer. The app launches automatically after installation.

### System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 256 MB minimum
- **Disk:** ~150 MB for the application
- **Network:** Internet connection required for fetching sentences from OpenRouter
- **Dependency:** OpenRouter API key (free tier supported)

### Known Issues

- The app requires an internet connection and a valid OpenRouter API key to function
- Widget position is not persisted between sessions (resets to center of screen)
- Windows-only release (cross-platform support planned)

### Technical Notes

- Built with Electron 35 and React 19, bundled via Vite 6
- Packaged as an NSIS installer via electron-builder
- Uses `openai/gpt-oss-120b:free` model on OpenRouter
- All data stored in localStorage (no external databases)
- Tray icon generated programmatically (no file dependency, works in both dev and production)

---

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

Download **Indonesian Widget Setup 1.0.0.exe** from the release assets and run the installer.

### System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 256 MB minimum
- **Disk:** ~150 MB for the application
- **Network:** Internet connection required for fetching sentences from OpenRouter
- **Dependency:** OpenRouter API key (free tier supported)

### Known Issues

- The app requires an internet connection and a valid OpenRouter API key to function
- Widget position is not persisted between sessions (resets to center of screen)
- Windows-only release (cross-platform support planned for a future release)

### Technical Notes

- Built with Electron 35 and React 19, bundled via Vite 6
- Packaged as an NSIS installer via electron-builder
- Uses `openai/gpt-oss-120b:free` model on OpenRouter for sentence generation and translation validation
- All data stored in localStorage (no external databases)
