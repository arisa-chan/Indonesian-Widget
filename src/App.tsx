import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { SentenceDisplay } from './components/SentenceDisplay'
import { TranslationInput } from './components/TranslationInput'
import { FeedbackDisplay } from './components/FeedbackDisplay'
import { SettingsPanel } from './components/SettingsPanel'
import { VocabularyPanel } from './components/VocabularyPanel'
import { SentenceRecord, ValidationResult } from './types'
import { hasApiKey, generateSentence, validateTranslation, getApiKey } from './api'
import {
  getTodaySentence,
  saveTodaySentence,
  updateTodayAttempt,
  loadAllSentences,
  getEloRating,
  adjustElo,
  getCefrFromElo,
  getTodayResetUsed,
  markTodayReset,
} from './storage'
import './App.css'

function App() {
  const [sentence, setSentence] = useState<SentenceRecord | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [loadingSentence, setLoadingSentence] = useState(true)
  const [checking, setChecking] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eloRating, setEloRating] = useState(() => getEloRating())
  const [resetAvailable, setResetAvailable] = useState(true)

  const generateAndSave = useCallback(async (isReset: boolean = false) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowSettings(true)
      setLoadingSentence(false)
      return null
    }

    const allRecords = loadAllSentences()
    const recentSentences = allRecords.slice(-20).map((r) => r.indonesian)
    if (isReset && sentence) {
      recentSentences.push(sentence.indonesian)
    }

    const currentElo = getEloRating()
    const targetCefr = getCefrFromElo(currentElo)

    const { indonesian, translation, cefr, vocabulary } = await generateSentence(apiKey, recentSentences, targetCefr)
    const record = saveTodaySentence(indonesian, translation, vocabulary, cefr)
    return record
  }, [sentence])

  const loadSentence = useCallback(async () => {
    setLoadingSentence(true)
    setError(null)

    const existing = getTodaySentence()
    if (existing) {
      setSentence(existing)
      setResetAvailable(!existing.resetUsed)
      setLoadingSentence(false)
      return
    }

    try {
      const record = await generateAndSave(false)
      if (record) {
        setSentence(record)
        setResetAvailable(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate sentence')
    }

    setLoadingSentence(false)
  }, [generateAndSave])

  useEffect(() => {
    loadSentence()
  }, [loadSentence])

  useEffect(() => {
    const cleanup = window.electronAPI.onNewDay(() => {
      setValidationResult(null)
      setShowVocab(false)
      setResetAvailable(true)
      loadSentence()
    })
    return cleanup
  }, [loadSentence])

  const handleReset = async () => {
    if (!resetAvailable) return
    setResetting(true)
    setError(null)
    setValidationResult(null)
    setShowVocab(false)

    try {
      const record = await generateAndSave(true)
      if (record) {
        markTodayReset()
        setSentence(record)
        setResetAvailable(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate new sentence')
    }

    setResetting(false)
  }

  const handleCheck = async (userTranslation: string) => {
    if (!sentence || !userTranslation.trim()) return

    setChecking(true)
    setError(null)

    const apiKey = getApiKey()
    if (!apiKey) {
      setShowSettings(true)
      setChecking(false)
      return
    }

    try {
      const result = await validateTranslation(
        apiKey,
        sentence.indonesian,
        userTranslation.trim(),
        sentence.englishTranslation
      )
      setValidationResult(result)
      updateTodayAttempt(sentence.indonesian, userTranslation.trim(), result.correct)
      setSentence((prev) =>
        prev
          ? { ...prev, userAttempt: userTranslation.trim(), attemptCorrect: result.correct }
          : prev
      )
      const newElo = adjustElo(result.correct)
      setEloRating(newElo)
    } catch (err: any) {
      setError(err.message || 'Failed to check translation')
    }

    setChecking(false)
  }

  const handleSettingsClose = () => {
    setShowSettings(false)
    loadSentence()
  }

  const alreadyCorrect = sentence?.attemptCorrect === true
  const showVocabButton = validationResult !== null || alreadyCorrect
  const currentTargetCefr = getCefrFromElo(eloRating)

  return (
    <div className="app-container">
      <TitleBar onSettingsClick={() => setShowSettings(true)} />
      <div className="widget">
        {loadingSentence || resetting ? (
          <div className="loading">Memuat...</div>
        ) : sentence ? (
          <>
            <div className="sentence-header">
              <div className="sentence-spacer" />
              {resetAvailable && (
                <button
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={resetting}
                  title="Get a different sentence (1x per day)"
                >
                  ↻ Reset
                </button>
              )}
            </div>
            <SentenceDisplay sentence={sentence.indonesian} />
            <TranslationInput
              onSubmit={handleCheck}
              disabled={checking || alreadyCorrect}
              alreadyCorrect={alreadyCorrect}
            />
            {validationResult && !alreadyCorrect && (
              <FeedbackDisplay result={validationResult} />
            )}
            {alreadyCorrect && (
              <div className="feedback correct">
                ✅ Benar! You've completed today's sentence.
              </div>
            )}
          </>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button className="check-btn" onClick={loadSentence}>
              Retry
            </button>
          </div>
        ) : null}

        {!showSettings && (
          <div className="footer-bar">
            <div className="footer-left">
              <span className="elo-badge" title="Your Elo rating — adjusts based on correct/incorrect answers">
                {currentTargetCefr} · Elo: {eloRating}
              </span>
              {sentence && (
                <span className="cefr-badge" title="Estimated CEFR level of today's sentence">
                  Sentence: {sentence.cefr}
                </span>
              )}
            </div>
            <div className="footer-right">
              {showVocabButton && sentence && sentence.vocabulary.length > 0 && (
                <button
                  className="vocab-fab"
                  onClick={() => setShowVocab(!showVocab)}
                  title="View vocabulary"
                >
                  📚
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showVocab && showVocabButton && sentence && (
        <VocabularyPanel
          vocabulary={sentence.vocabulary}
          onClose={() => setShowVocab(false)}
        />
      )}

      {showSettings && <SettingsPanel onClose={handleSettingsClose} />}
    </div>
  )
}

export default App
