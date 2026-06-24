import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { SentenceDisplay } from './components/SentenceDisplay'
import { TranslationInput } from './components/TranslationInput'
import { FeedbackDisplay } from './components/FeedbackDisplay'
import { SettingsPanel } from './components/SettingsPanel'
import { SentenceRecord, ValidationResult } from './types'
import { hasApiKey, generateSentence, validateTranslation, getApiKey } from './api'
import { getTodaySentence, saveTodaySentence, updateTodayAttempt } from './storage'
import './App.css'

function App() {
  const [sentence, setSentence] = useState<SentenceRecord | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [loadingSentence, setLoadingSentence] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSentence = useCallback(async () => {
    setLoadingSentence(true)
    setError(null)

    // Check if we already have today's sentence stored
    const existing = getTodaySentence()
    if (existing) {
      setSentence(existing)
      setLoadingSentence(false)
      return
    }

    // Need to generate a new sentence
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowSettings(true)
      setLoadingSentence(false)
      return
    }

    try {
      const { indonesian, translation } = await generateSentence(apiKey)
      const record = saveTodaySentence(indonesian, translation)
      setSentence(record)
    } catch (err: any) {
      setError(err.message || 'Failed to generate sentence')
    }

    setLoadingSentence(false)
  }, [])

  useEffect(() => {
    loadSentence()
  }, [loadSentence])

  // Listen for midnight day-change event from the main process
  useEffect(() => {
    const cleanup = window.electronAPI.onNewDay(() => {
      setValidationResult(null)
      loadSentence()
    })
    return cleanup
  }, [loadSentence])

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

  return (
    <div className="app-container">
      <TitleBar onSettingsClick={() => setShowSettings(true)} />
      <div className="widget">
        {loadingSentence ? (
          <div className="loading">Memuat...</div>
        ) : sentence ? (
          <>
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
          <div className="footer-info">
            🔄 New sentence tomorrow
          </div>
        )}
      </div>

      {showSettings && <SettingsPanel onClose={handleSettingsClose} />}
    </div>
  )
}

export default App
