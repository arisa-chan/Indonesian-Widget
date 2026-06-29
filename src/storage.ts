import { SentenceRecord, VocabularyItem } from './types'

const STORAGE_KEY = 'indonesian_widget_sentences'
const ELO_KEY = 'indonesian_widget_elo'

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
  cefr: string = 'A2'
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
    return raw ? parseInt(raw, 10) : 1200
  } catch {
    return 1200
  }
}

export function adjustElo(correct: boolean): number {
  const current = getEloRating()
  const K = 32
  const change = correct ? -(K / 2) : K / 2
  const newRating = Math.max(400, Math.min(3000, current + change))
  localStorage.setItem(ELO_KEY, String(Math.round(newRating)))
  return Math.round(newRating)
}
