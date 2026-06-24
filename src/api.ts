const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const FREE_MODEL = 'openai/gpt-oss-120b:free'

export function getApiKey(): string | null {
  return localStorage.getItem('openrouter_api_key')
}

export function saveApiKey(key: string): void {
  localStorage.setItem('openrouter_api_key', key)
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  responseFormat?: { type: string }
): Promise<string> {
  const body: any = {
    model: FREE_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  }

  if (responseFormat) {
    body.response_format = responseFormat
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'Indonesian Widget',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

export async function generateSentence(apiKey: string): Promise<{ indonesian: string; translation: string }> {
  const prompt = `You are a Bahasa Indonesia teacher. Generate one natural, everyday Indonesian sentence 
suitable for an A2-level learner. Return ONLY a JSON object with two fields:
- "indonesian": the Indonesian sentence
- "english": its English translation

Make the sentence useful for daily conversation (greetings, food, travel, work, family). 
Do not use the same sentence as any previous day. Be creative.`

  const result = await callOpenRouter(apiKey, prompt, 'Generate today\'s sentence.', 0.8, { type: 'json_object' })
  const parsed = JSON.parse(result)
  return { indonesian: parsed.indonesian, translation: parsed.english }
}

export async function validateTranslation(
  apiKey: string,
  indonesian: string,
  userTranslation: string,
  correctTranslation: string
): Promise<{ correct: boolean; correctTranslation: string; feedback: string }> {
  const prompt = `You are an English-Indonesian translation validator. Given an Indonesian sentence, 
its correct English translation, and a user's attempt:

Indonesian: "${indonesian}"
Correct translation: "${correctTranslation}"
User's attempt: "${userTranslation}"

Decide if the user's translation is correct. Accept natural paraphrases — the user doesn't need to match 
word-for-word. If the user's translation conveys the same meaning, it's correct.

Respond in JSON format:
{
  "correct": true/false,
  "correctTranslation": "${correctTranslation}",
  "feedback": "Brief encouraging feedback for the user"
}`

  const result = await callOpenRouter(apiKey, prompt, 'Validate this translation.', 0.3, { type: 'json_object' })
  return JSON.parse(result)
}
