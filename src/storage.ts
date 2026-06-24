import { SentenceRecord } from './types'

const STORAGE_KEY = 'indonesian_widget_sentences'

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
  englishTranslation: string
): SentenceRecord {
  const today = new Date().toISOString().split('T')[0]
  const records = loadAllSentences()
  const existing = records.findIndex((r) => r.date === today)

  const record: SentenceRecord = {
    date: today,
    indonesian,
    englishTranslation,
    userAttempt: null,
    attemptCorrect: null,
    attemptedAt: null,
  }

  if (existing >= 0) {
    records[existing] = record
  } else {
    records.push(record)
  }

  saveAllSentences(records)
  return record
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
