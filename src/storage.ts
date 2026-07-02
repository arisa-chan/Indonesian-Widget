import { SentenceRecord, VocabularyItem } from './types'

const STORAGE_KEY = 'indonesian_widget_sentences'
const ELO_KEY = 'indonesian_widget_elo'

// CEFR level mapped to Elo rating ranges
export const CEFR_ELO_RANGES: { cefr: string; min: number; max: number }[] = [
  { cefr: 'A1', min: 0, max: 799 },
  { cefr: 'A2', min: 800, max: 1199 },
  { cefr: 'B1', min: 1200, max: 1599 },
  { cefr: 'B2', min: 1600, max: 1999 },
  { cefr: 'C1', min: 2000, max: 2399 },
  { cefr: 'C2', min: 2400, max: 3000 },
]

export function getCefrFromElo(elo: number): string {
  for (const range of CEFR_ELO_RANGES) {
    if (elo <= range.max) return range.cefr
  }
  return 'C2'
}

export function loadAllSentences(): SentenceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAllSentences(records: SentenceRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function getTodaySentence(): SentenceRecord | null {
  const today = new Date().toISOString().split('T')[0]
  const records = loadAllSentences()
  return records.find((r) => r.date === today) ?? null
}

export function saveTodaySentence(
  indonesian: string,
  englishTranslation: string,
  vocabulary: VocabularyItem[] = [],
  cefr: string = 'A1'
): SentenceRecord {
  const today = new Date().toISOString().split('T')[0]
  const records = loadAllSentences()
  const existing = records.findIndex((r) => r.date === today)

  const record: SentenceRecord = {
    date: today,
    indonesian,
    englishTranslation,
    vocabulary,
    cefr,
    userAttempt: null,
    attemptCorrect: null,
    attemptedAt: null,
    resetUsed: false,
  }

  if (existing >= 0) {
    record.resetUsed = records[existing].resetUsed ?? false
    records[existing] = record
  } else {
    records.push(record)
  }

  saveAllSentences(records)
  return record
}

export function getTodayResetUsed(): boolean {
  const today = getTodaySentence()
  return today?.resetUsed ?? false
}

export function markTodayReset(): void {
  const records = loadAllSentences()
  const today = new Date().toISOString().split('T')[0]
  const record = records.find((r) => r.date === today)
  if (record) {
    record.resetUsed = true
    saveAllSentences(records)
  }
}

export function updateTodayAttempt(
  indonesian: string,
  userAttempt: string,
  correct: boolean
): void {
  const records = loadAllSentences()
  const record = records.find((r) => r.indonesian === indonesian)
  if (record) {
    record.userAttempt = userAttempt
    record.attemptCorrect = correct
    record.attemptedAt = new Date().toISOString()
    saveAllSentences(records)
  }
}

export function getEloRating(): number {
  try {
    const raw = localStorage.getItem(ELO_KEY)
    // Default to 400 (A1) for new users — the lowest proficiency level
    return raw ? parseInt(raw, 10) : 400
  } catch {
    return 400
  }
}

export function adjustElo(correct: boolean): number {
  const current = getEloRating()
  const K = 40
  // Asymmetric adjustment: wrong answers penalize twice as hard as correct answers reward.
  // This ensures the difficulty drops quickly when the user struggles,
  // preventing frustration from overly difficult sentences.
  const change = correct ? K / 2 : -K
  const newRating = Math.max(0, Math.min(3000, Math.round(current + change)))
  localStorage.setItem(ELO_KEY, String(newRating))
  return newRating
}

/**
 * Clear all stored progress data (sentences, Elo rating, etc.).
 * Used when the user wants a completely fresh start.
 */
export function resetAllProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ELO_KEY)
}
