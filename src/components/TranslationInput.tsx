import { useState, useRef, useEffect } from 'react'

interface TranslationInputProps {
  onSubmit: (translation: string) => void
  disabled: boolean
  alreadyCorrect: boolean
}

export function TranslationInput({ onSubmit, disabled, alreadyCorrect }: TranslationInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!alreadyCorrect && inputRef.current) {
      inputRef.current.focus()
    }
  }, [alreadyCorrect])

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

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
