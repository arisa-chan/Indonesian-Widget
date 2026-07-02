import { useState, useRef, useEffect, useCallback } from 'react'

interface TranslationInputProps {
  onSubmit: (translation: string) => void
  disabled: boolean
  alreadyCorrect: boolean
}

export function TranslationInput({ onSubmit, disabled, alreadyCorrect }: TranslationInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  // Reset the submission guard when the parent re-enables the input
  useEffect(() => {
    if (!disabled) {
      submittingRef.current = false
    }
  }, [disabled])

  useEffect(() => {
    if (!alreadyCorrect && inputRef.current) {
      inputRef.current.focus()
    }
  }, [alreadyCorrect])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    // Use ref-based guard so rapid clicks can't slip past stale closure state
    if (trimmed && !disabled && !submittingRef.current) {
      submittingRef.current = true
      onSubmit(trimmed)
    }
  }, [value, disabled, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className="input-area">
      <label>Translate to English:</label>
      <input
        ref={inputRef}
        type="text"
        className="translation-input"
        placeholder="Type your translation..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="check-btn"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
      >
        {disabled ? 'Checking...' : 'Check Answer'}
      </button>
    </div>
  )
}
