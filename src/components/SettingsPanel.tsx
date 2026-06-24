import { useState, useEffect } from 'react'
import { getApiKey, saveApiKey } from '../api'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [key, setKey] = useState(getApiKey() || '')
  const [saved, setSaved] = useState(false)
  const [startOnBoot, setStartOnBoot] = useState(false)

  useEffect(() => {
    window.electronAPI?.getLoginItem().then(setStartOnBoot).catch(() => {})
  }, [])

  const handleSave = () => {
    if (key.trim()) {
      saveApiKey(key.trim())
      setSaved(true)
      setTimeout(() => onClose(), 1000)
    }
  }

  const handleToggleStartup = () => {
    const newVal = !startOnBoot
    setStartOnBoot(newVal)
    window.electronAPI?.setLoginItem(newVal)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <div className="settings-section">
          <p className="settings-desc">
            Enter your{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              OpenRouter API key
            </a>{' '}
            to generate sentences and check translations. Free models are used by default.
          </p>
          <input
            type="password"
            className="settings-input"
            placeholder="sk-or-v1-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <label className="startup-toggle">
          <input
            type="checkbox"
            checked={startOnBoot}
            onChange={handleToggleStartup}
          />
          <span>Run at Windows startup</span>
        </label>

        <div className="settings-actions">
          <button className="check-btn" onClick={handleSave} disabled={!key.trim()}>
            {saved ? 'Saved!' : 'Save Key'}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
