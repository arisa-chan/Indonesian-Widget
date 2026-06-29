import { VocabularyItem } from '../types'

interface VocabularyPanelProps {
  vocabulary: VocabularyItem[]
  onClose: () => void
}

export function VocabularyPanel({ vocabulary, onClose }: VocabularyPanelProps) {
  if (!vocabulary || vocabulary.length === 0) {
    return null
  }

  return (
    <div className="vocab-overlay" onClick={onClose}>
      <div className="vocab-panel" onClick={(e) => e.stopPropagation()}>
        <div className="vocab-header">
          <span>Vocabulary</span>
          <button className="vocab-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="vocab-list">
          {vocabulary.map((item, i) => (
            <div className="vocab-row" key={i}>
              <span className="vocab-word">{item.word}</span>
              <span className="vocab-arrow">→</span>
              <span className="vocab-translation">{item.translation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
