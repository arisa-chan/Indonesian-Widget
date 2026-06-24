interface SentenceDisplayProps {
  sentence: string
}

export function SentenceDisplay({ sentence }: SentenceDisplayProps) {
  return (
    <div className="sentence-display">
      <div className="sentence-label">SENTENCE OF THE DAY</div>
      <div className="sentence-text">"{sentence}"</div>
    </div>
  )
}
