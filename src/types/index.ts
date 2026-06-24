export interface SentenceRecord {
  date: string
  indonesian: string
  englishTranslation: string
  userAttempt: string | null
  attemptCorrect: boolean | null
  attemptedAt: string | null
}

export interface ValidationResult {
  correct: boolean
  correctTranslation: string
  feedback: string
}

export interface ElectronAPI {
  minimize: () => void
  close: () => void
  setLoginItem: (enabled: boolean) => void
  getLoginItem: () => Promise<boolean>
  onNewDay: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
