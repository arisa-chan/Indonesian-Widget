import { ValidationResult } from '../types'

interface FeedbackDisplayProps {
  result: ValidationResult
}

export function FeedbackDisplay({ result }: FeedbackDisplayProps) {
  return (
    <div className={`feedback ${result.correct ? 'correct' : 'incorrect'}`}>
      {result.correct ? (
        <>
          <strong>✅ Benar!</strong> {result.feedback}
        </>
      ) : (
        <>
          <strong>❌ Not quite.</strong>
          <div className="correct-answer">
            Correct translation: <em>"{result.correctTranslation}"</em>
          </div>
          {result.feedback && <div className="feedback-text">{result.feedback}</div>}
        </>
      )}
    </div>
  )
}
