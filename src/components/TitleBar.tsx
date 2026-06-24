import { useState } from 'react'

interface TitleBarProps {
  onSettingsClick: () => void
}

export function TitleBar({ onSettingsClick }: TitleBarProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  return (
    <div className="title-bar">
      <div className="title-bar-title">🇮🇩 Indonesian Widget</div>
      <div className="title-bar-actions">
        <button
          className={`title-btn btn-settings ${hovered === 'settings' ? 'active' : ''}`}
          onClick={onSettingsClick}
          onMouseEnter={() => setHovered('settings')}
          onMouseLeave={() => setHovered(null)}
          title="Settings"
        />
        <button
          className={`title-btn btn-minimize ${hovered === 'minimize' ? 'active' : ''}`}
          onClick={handleMinimize}
          onMouseEnter={() => setHovered('minimize')}
          onMouseLeave={() => setHovered(null)}
          title="Minimize"
        />
        <button
          className={`title-btn btn-close ${hovered === 'close' ? 'active' : ''}`}
          onClick={handleClose}
          onMouseEnter={() => setHovered('close')}
          onMouseLeave={() => setHovered(null)}
          title="Close"
        />
      </div>
    </div>
  )
}
