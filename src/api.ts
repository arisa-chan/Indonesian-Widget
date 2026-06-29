const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const FREE_MODEL = 'openai/gpt-oss-120b:free'

import { VocabularyItem } from './types'

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

function getDaySeed(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

function pickFrom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function pickN<T>(arr: T[], seed: number, count: number): T[] {
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    result.push(arr[(seed + i * 103) % arr.length])
  }
  return result
}

type SentenceStyle = {
  label: string
  instruction: string
  minWords: number
  maxWords: number
  form: 'declarative' | 'interrogative' | 'imperative' | 'exclamatory' | 'optative'
  structure: 'simple' | 'compound' | 'complex' | 'compound-complex'
  function: string
}

const SENTENCE_STYLES: SentenceStyle[] = [
  // === MICRO SENTENCES (1-3 words) ===
  { label: 'micro greeting', instruction: 'Write a micro-sized greeting or farewell (1-3 words). Very common everyday phrase.', minWords: 1, maxWords: 3, form: 'declarative', structure: 'simple', function: 'greeting/farewell' },
  { label: 'micro exclamation', instruction: 'Write a micro exclamation (1-3 words). An interjection like expressing surprise, pain, joy, or disgust.', minWords: 1, maxWords: 3, form: 'exclamatory', structure: 'simple', function: 'interjection' },
  { label: 'micro command', instruction: 'Write a micro command (1-3 words). A terse instruction or request.', minWords: 1, maxWords: 3, form: 'imperative', structure: 'simple', function: 'command' },
  { label: 'micro answer', instruction: 'Write a micro-sized response to a question (1-3 words). Like agreeing, disagreeing, or confirming.', minWords: 1, maxWords: 3, form: 'declarative', structure: 'simple', function: 'response' },
  { label: 'micro filler', instruction: 'Write a micro hesitation filler or thinking sound (1-2 words) like "anu...", "eeee...", "hmm..." as used naturally in Indonesian conversation.', minWords: 1, maxWords: 2, form: 'declarative', structure: 'simple', function: 'filler/hesitation' },

  // === SHORT SIMPLE DECLARATIVE (3-6 words) ===
  { label: 'short statement', instruction: 'Write a short simple declarative sentence (3-6 words). Plain factual statement.', minWords: 3, maxWords: 6, form: 'declarative', structure: 'simple', function: 'statement' },
  { label: 'short opinion', instruction: 'Write a short sentence expressing an opinion or belief (3-6 words). Use "menurut saya", "kayaknya", "rasanya" or similar.', minWords: 3, maxWords: 6, form: 'declarative', structure: 'simple', function: 'opinion' },
  { label: 'short description', instruction: 'Write a short descriptive sentence about a person, place, or object (3-6 words).', minWords: 3, maxWords: 6, form: 'declarative', structure: 'simple', function: 'description' },
  { label: 'short self-introduction', instruction: 'Write a short self-introduction phrase (3-6 words). Like introducing name, origin, or occupation.', minWords: 3, maxWords: 6, form: 'declarative', structure: 'simple', function: 'self-introduction' },
  { label: 'short agreement', instruction: 'Write a short sentence strongly agreeing or disagreeing with something (3-6 words). Use "setuju", "betul", "nggak", "salah" etc.', minWords: 3, maxWords: 6, form: 'declarative', structure: 'simple', function: 'agreement/disagreement' },

  // === QUESTIONS ===
  { label: 'yes/no question', instruction: 'Write a yes/no question. Use "Apakah" naturally, or form it colloquially without "Apakah".', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'yes-no question' },
  { label: 'colloquial yes/no with rising intonation', instruction: 'Write a yes/no question in colloquial style WITHOUT "Apakah" — just use rising intonation implied by word order or "...nggak?" / "...gak sih?" pattern.', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'colloquial yes-no' },
  { label: '"apa" question', instruction: 'Write a question starting with "Apa" (what).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"siapa" question', instruction: 'Write a question starting with "Siapa" (who/whose).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"di mana/ke mana/dari mana" question', instruction: 'Write a question about location or direction using "di mana", "ke mana", or "dari mana".', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"kapan" question', instruction: 'Write a question starting with "Kapan" (when).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"mengapa/kenapa" question', instruction: 'Write a question starting with "Mengapa" or "Kenapa" (why).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"bagaimana" question', instruction: 'Write a question starting with "Bagaimana" (how).', minWords: 3, maxWords: 12, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"berapa" question', instruction: 'Write a question starting with "Berapa" (how many/how much).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"yang mana" question', instruction: 'Write a question using "yang mana" (which one).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'WH question' },
  { label: '"punya siapa" question', instruction: 'Write a question using "punya siapa" or "milik siapa" (whose).', minWords: 3, maxWords: 8, form: 'interrogative', structure: 'simple', function: 'possession question' },
  { label: '"dengan siapa" question', instruction: 'Write a question using "dengan siapa" (with whom).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'companion question' },
  { label: '"buat apa"/"untuk apa" question', instruction: 'Write a question using "buat apa" or "untuk apa" (what for / why).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'purpose question' },
  { label: '"sejak kapan" question', instruction: 'Write a question using "sejak kapan" (since when).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'time-since question' },
  { label: '"sampai kapan" question', instruction: 'Write a question using "sampai kapan" (until when).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'time-until question' },
  { label: '"kok" question', instruction: 'Write a colloquial question using "kok" expressing surprise or seeking explanation (e.g. "Kok bisa?", "Kok tahu?").', minWords: 2, maxWords: 8, form: 'interrogative', structure: 'simple', function: 'kok question' },
  { label: 'tag question with "ya"', instruction: 'Write a statement followed by a tag "...ya?" seeking confirmation.', minWords: 3, maxWords: 12, form: 'interrogative', structure: 'compound', function: 'tag question' },
  { label: 'tag question with "kan"', instruction: 'Write a statement followed by "...kan?" — implying the listener already knows or should agree.', minWords: 3, maxWords: 12, form: 'interrogative', structure: 'compound', function: 'tag question' },
  { label: 'tag question with "dong"', instruction: 'Write a statement followed by "...dong?" — a friendly, slightly playful tag.', minWords: 3, maxWords: 12, form: 'interrogative', structure: 'compound', function: 'tag question' },
  { label: 'choice question', instruction: 'Write a question offering a choice between two options using "atau" (or).', minWords: 4, maxWords: 14, form: 'interrogative', structure: 'compound', function: 'choice question' },
  { label: 'multi-choice question', instruction: 'Write a question offering 3+ options using "atau" (or) multiple times.', minWords: 6, maxWords: 18, form: 'interrogative', structure: 'compound', function: 'multi-choice question' },
  { label: 'rhetorical question', instruction: 'Write a rhetorical question — a question asked for effect, not expecting an answer.', minWords: 3, maxWords: 12, form: 'interrogative', structure: 'simple', function: 'rhetorical' },
  { label: 'self-directed question', instruction: 'Write a question someone asks themselves (wondering aloud).', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'self-question' },
  { label: 'embedded question', instruction: 'Write a sentence containing an indirect/embedded question (e.g. "Saya tidak tahu apakah...", "Dia tanya kapan...").', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'embedded question' },
  { label: 'follow-up question', instruction: 'Write a natural follow-up question — like continuing a conversation after an answer was given (e.g. "Terus...?", "Lalu kenapa?").', minWords: 2, maxWords: 8, form: 'interrogative', structure: 'simple', function: 'follow-up question' },

  // === COMPOUND SENTENCES ===
  { label: 'compound with "dan"', instruction: 'Write a compound sentence joining two clauses with "dan" (and).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'addition' },
  { label: 'compound with "serta"', instruction: 'Write a compound sentence using "serta" (and/along with) — a more formal alternative to "dan".', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'addition formal' },
  { label: 'compound with "tetapi"', instruction: 'Write a compound sentence using "tetapi" (but) to contrast two ideas.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'contrast' },
  { label: 'compound with "tapi" colloquial', instruction: 'Write a compound sentence using "tapi" (colloquial "but") for informal contrast.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'contrast informal' },
  { label: 'compound with "melainkan"', instruction: 'Write a sentence using "bukan...melainkan..." (not...but rather...) — a formal contrast pattern.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'not-but-rather' },
  { label: 'compound with "atau"', instruction: 'Write a compound sentence using "atau" (or) to present alternatives.', minWords: 4, maxWords: 12, form: 'declarative', structure: 'compound', function: 'choice' },
  { label: 'compound with "lalu"/"kemudian"', instruction: 'Write a compound sentence using "lalu" or "kemudian" (then) to show chronological sequence.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'sequence' },
  { label: 'compound with "terus" colloquial', instruction: 'Write a compound sentence using "terus" (then/and then) — very common colloquial sequence marker.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'sequence colloquial' },
  { label: 'compound with "jadi"', instruction: 'Write a compound sentence using "jadi" (so/therefore) to show consequence.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'consequence' },
  { label: 'compound with "padahal"', instruction: 'Write a compound sentence using "padahal" (whereas/in fact) — contrasting expectation vs reality.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'contrary-to-expectation' },
  { label: 'compound with "bahkan"', instruction: 'Write a compound sentence using "bahkan" (even/moreover) — intensifying or adding an extreme case.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'intensification' },
  { label: 'compound with "apalagi"', instruction: 'Write a sentence using "apalagi" (let alone/especially) — emphasizing that if A is true, B is even more so.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'let-alone' },
  { label: 'compound with "malahan"', instruction: 'Write a sentence using "malahan" (on the contrary/in fact) — correcting or contrasting what was expected.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'compound', function: 'on-the-contrary' },

  // === COMPLEX — CAUSE/REASON ===
  { label: 'complex with "karena"', instruction: 'Write a complex sentence using "karena" (because) — main clause + reason clause.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'cause' },
  { label: 'complex with "sebab"', instruction: 'Write a complex sentence using "sebab" (because/for) — more formal than "karena".', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'cause formal' },
  { label: 'complex with "soalnya" colloquial', instruction: 'Write a sentence using "soalnya" (because/the thing is) — very common colloquial reason marker.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'cause colloquial' },
  { label: 'complex with "gara-gara"', instruction: 'Write a sentence using "gara-gara" (because of / due to) — often implies a slightly negative or consequential cause.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'cause negative' },
  { label: 'complex with "berhubung"', instruction: 'Write a sentence using "berhubung" (considering that/since) — a formal reason connector.', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'cause considering' },
  { label: 'complex with "karena itu"/"oleh karena itu"', instruction: 'Write a sentence using "karena itu" or "oleh karena itu" (therefore).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'therefore' },
  { label: 'complex with "akibatnya"', instruction: 'Write a sentence using "akibatnya" (as a result/consequently) — showing the outcome.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'result' },

  // === COMPLEX — CONDITION ===
  { label: 'complex with "jika"/"kalau"', instruction: 'Write a conditional sentence using "jika" or "kalau" (if).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'condition' },
  { label: 'complex with "asal(kan)"', instruction: 'Write a conditional using "asal" or "asalkan" (provided that/as long as).', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'condition-provided' },
  { label: 'complex with "seandainya"/"andaikata"', instruction: 'Write a hypothetical using "seandainya" or "andaikata" (if only/suppose).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'hypothetical' },
  { label: 'complex with "kecuali"', instruction: 'Write a sentence using "kecuali" (unless/except) to state an exception or condition.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'exception' },
  { label: 'complex with "manakala"', instruction: 'Write a formal conditional sentence using "manakala" (whenever/if ever).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'condition formal' },
  { label: 'complex with "jangan-jangan"', instruction: 'Write a sentence using "jangan-jangan" (what if / maybe it\'s the case that...) — expressing worried speculation.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'worried speculation' },

  // === COMPLEX — TIME ===
  { label: 'complex with "ketika"/"saat"', instruction: 'Write a complex sentence using "ketika" or "saat" (when).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'time-when' },
  { label: 'complex with "waktu" colloquial', instruction: 'Write a sentence using "waktu" (when) — the more colloquial time connector.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-when colloquial' },
  { label: 'complex with "pas" very colloquial', instruction: 'Write a sentence using "pas" (exactly when / right at the moment) — very casual Jakarta-style.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-exact colloquial' },
  { label: 'complex with "sebelum"', instruction: 'Write a complex sentence using "sebelum" (before).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-before' },
  { label: 'complex with "setelah"/"sesudah"', instruction: 'Write a complex sentence using "setelah" or "sesudah" (after).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-after' },
  { label: 'complex with "begitu"', instruction: 'Write a sentence using "begitu" (as soon as / once) for immediate sequence.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-immediate' },
  { label: 'complex with "sementara"/"sambil"', instruction: 'Write a sentence using "sementara" or "sambil" (while/during) for simultaneous actions.', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-simultaneous' },
  { label: 'complex with "sejak"/"semenjak"', instruction: 'Write a sentence using "sejak" or "semenjak" (since) indicating a starting point.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-since' },
  { label: 'complex with "sampai"/"hingga"', instruction: 'Write a sentence using "sampai" or "hingga" (until) indicating an endpoint.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-until' },
  { label: 'complex with "selagi"', instruction: 'Write a sentence using "selagi" (while/as long as) for a window of opportunity.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-opportunity' },
  { label: 'complex with "selama"', instruction: 'Write a sentence using "selama" (during/throughout/as long as) for duration.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'time-duration' },
  { label: 'complex with "tatkala"', instruction: 'Write a poetic/literary sentence using "tatkala" (at the time when) — a formal/literary time marker.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'time-literary' },

  // === COMPLEX — CONCESSION/CONTRAST ===
  { label: 'complex with "walaupun"/"meskipun"', instruction: 'Write a concessive sentence using "walaupun" or "meskipun" (although/even though).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'concession' },
  { label: 'complex with "biarpun"/"kendatipun"', instruction: 'Write a concessive using "biarpun" or "kendatipun" (even if/although) — strong contrast.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'concession strong' },
  { label: 'complex with "sekalipun"', instruction: 'Write a sentence using "sekalipun" (even if/even though) — very emphatic concession.', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'concession emphatic' },
  { label: 'complex with "sungguhpun"', instruction: 'Write a formal sentence using "sungguhpun" (although/despite) — literary concessive.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'concession formal' },
  { label: 'complex with "namun"', instruction: 'Write a sentence using "namun" (however/nevertheless) — a formal contrast connector.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'contrast formal' },
  { label: 'complex with "akan tetapi"', instruction: 'Write a sentence using "akan tetapi" (however/but) — a more formal compound contrast.', minWords: 6, maxWords: 14, form: 'declarative', structure: 'complex', function: 'contrast formal 2' },

  // === COMPLEX — PURPOSE ===
  { label: 'complex with "supaya"/"agar"', instruction: 'Write a purpose clause using "supaya" or "agar" (so that/in order to).', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'purpose' },
  { label: 'complex with "biar" colloquial', instruction: 'Write a sentence using "biar" (so that) — the colloquial short form of "supaya/agar".', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'purpose colloquial' },
  { label: 'complex with "untuk" purpose', instruction: 'Write a sentence where "untuk" introduces a purpose clause (in order to).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'purpose-untuk' },
  { label: 'complex with "guna"', instruction: 'Write a formal sentence using "guna" (for the purpose of / in order to).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'purpose formal' },
  { label: 'complex with "demi"', instruction: 'Write a sentence using "demi" (for the sake of) — expressing sacrifice or strong motivation.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'purpose-sacrifice' },

  // === COMPLEX — RESULT ===
  { label: 'complex with "sehingga"', instruction: 'Write a result clause using "sehingga" (so that/thus) — cause leads to result.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'result' },
  { label: 'complex with "maka"', instruction: 'Write a sentence using "maka" (then/therefore) for logical consequence.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'logical consequence' },
  { label: 'complex with "alhasil"', instruction: 'Write a sentence using "alhasil" (as a result/in the end) — summarizing the outcome.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'outcome summary' },

  // === COMPLEX — COMPARISON ===
  { label: 'complex with "daripada"', instruction: 'Write a comparative using "daripada" (than) — comparing two things.', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'comparison' },
  { label: 'complex with "seperti"/"bagai"', instruction: 'Write a simile or comparison using "seperti" or "bagai" (like/as).', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'simile' },
  { label: 'complex with "laksana"', instruction: 'Write a poetic simile using "laksana" (like/as) — very literary/formal.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'simile poetic' },
  { label: 'complex with "se-...seperti"', instruction: 'Write an equative comparison using "se-...seperti" or "se-..." (as...as). E.g., "sebesar", "setinggi".', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'equative comparison' },
  { label: 'complex with "dibanding(kan)"', instruction: 'Write a sentence using "dibanding" or "dibandingkan" (compared to) — formal comparative structure.', minWords: 6, maxWords: 16, form: 'declarative', structure: 'complex', function: 'formal comparison' },
  { label: 'superlative with "paling"/"ter-"', instruction: 'Write a superlative sentence using "paling" or "ter-" prefix (the most / the -est). E.g., "paling enak", "tertinggi".', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'superlative' },

  // === COMPLEX — RELATIVE CLAUSE ===
  { label: '"yang" relative clause', instruction: 'Write a sentence with a relative clause introduced by "yang" (that/which/who).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'relative clause' },
  { label: '"tempat di mana" relative', instruction: 'Write a sentence with a location relative clause: "...tempat di mana..." (the place where...).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'relative location' },
  { label: '"saat di mana" relative', instruction: 'Write a sentence with a time relative clause: "...saat di mana..." or "...waktu di mana..." (the time when...).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'relative time' },
  { label: 'multi-"yang" clause', instruction: 'Write a sentence with TWO "yang" relative clauses — one embedded in another.', minWords: 8, maxWords: 18, form: 'declarative', structure: 'complex', function: 'nested relative clauses' },

  // === IMPERATIVE / COMMANDS ===
  { label: 'bare command', instruction: 'Write a bare command — a terse instruction without softening (2-5 words).', minWords: 2, maxWords: 5, form: 'imperative', structure: 'simple', function: 'bare command' },
  { label: 'polite request with "tolong"', instruction: 'Write a polite request using "tolong" (please).', minWords: 3, maxWords: 10, form: 'imperative', structure: 'simple', function: 'polite request' },
  { label: 'invitation with "mari"/"ayo"/"yuk"', instruction: 'Write an invitational sentence using "mari", "ayo", or "yuk" (let\'s / come on).', minWords: 2, maxWords: 10, form: 'imperative', structure: 'simple', function: 'invitation' },
  { label: 'soft suggestion with "coba"', instruction: 'Write a suggestion/request using "coba" (try / why don\'t you...).', minWords: 3, maxWords: 10, form: 'imperative', structure: 'simple', function: 'suggestion' },
  { label: 'soft request with "bisa...nggak?"', instruction: 'Write a very soft, indirect request in the form "Bisa...nggak?" (Can you...or not?) — extremely common polite pattern.', minWords: 4, maxWords: 12, form: 'interrogative', structure: 'simple', function: 'indirect request' },
  { label: 'prohibition with "jangan"', instruction: 'Write a prohibition/negative command using "jangan" (don\'t).', minWords: 2, maxWords: 8, form: 'imperative', structure: 'simple', function: 'prohibition' },
  { label: 'prohibition with "dilarang"', instruction: 'Write a formal prohibition using "dilarang" (it is forbidden to...).', minWords: 3, maxWords: 8, form: 'imperative', structure: 'simple', function: 'formal prohibition' },
  { label: 'prohibition with "nggak boleh"', instruction: 'Write a colloquial prohibition using "nggak boleh" (not allowed) — how parents or friends say it.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial prohibition' },
  { label: 'imperative + reason', instruction: 'Write a command or request followed by a reason (e.g. "...karena...", "...soalnya...").', minWords: 5, maxWords: 14, form: 'imperative', structure: 'complex', function: 'reasoned command' },
  { label: 'soft command with "-lah"', instruction: 'Write a softened command using "-lah" suffix (e.g. "datanglah", "duduklah", "dengarlah") — slightly formal/poetic.', minWords: 2, maxWords: 8, form: 'imperative', structure: 'simple', function: 'softened command' },

  // === EXCLAMATORY ===
  { label: 'exclamation of surprise', instruction: 'Write an exclamatory sentence expressing surprise or shock. Use interjections like "Wah!", "Aduh!", "Astaga!", "Ya ampun!".', minWords: 1, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'surprise' },
  { label: 'exclamation of admiration', instruction: 'Write an exclamatory sentence expressing admiration, praise, or wonder.', minWords: 2, maxWords: 10, form: 'exclamatory', structure: 'simple', function: 'admiration' },
  { label: 'exclamation of frustration', instruction: 'Write an exclamatory sentence expressing frustration, complaint, or annoyance. Use "Aduh!", "Sial!", "Ah sudahlah!" style.', minWords: 2, maxWords: 10, form: 'exclamatory', structure: 'simple', function: 'frustration' },
  { label: 'exclamation of relief', instruction: 'Write an exclamatory sentence expressing relief — "Syukurlah!", "Untunglah!", "Alhamdulillah!" style.', minWords: 1, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'relief' },
  { label: 'exclamation of disgust', instruction: 'Write an exclamatory sentence expressing disgust or distaste — "Ih!", "Jijik!", "Aduh najis!" style.', minWords: 1, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'disgust' },
  { label: 'exclamation with "sekali"', instruction: 'Write an exclamatory sentence using "...sekali!" for emphasis (very/so...!).', minWords: 2, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'emphasis' },
  { label: 'exclamation with "banget"', instruction: 'Write an exclamatory sentence using "...banget!" (colloquial "very/so") — Jakarta-style.', minWords: 2, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'emphasis colloquial' },
  { label: 'exclamation with "gila"', instruction: 'Write an exclamatory using "gila!" (crazy/insane!) — a very common intensifier in casual Indonesian.', minWords: 2, maxWords: 8, form: 'exclamatory', structure: 'simple', function: 'gila intensifier' },

  // === NEGATION ===
  { label: 'negation with "tidak"', instruction: 'Write a negative declarative sentence using "tidak" (not, for verbs/adjectives).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'negation' },
  { label: 'negation with "nggak"/"gak" colloquial', instruction: 'Write a negative sentence using "nggak" or "gak" (colloquial "tidak").', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'negation colloquial' },
  { label: 'negation with "bukan"', instruction: 'Write a sentence using "bukan" (not, for nouns/identities/classifications).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'negation-noun' },
  { label: 'negation with "belum"', instruction: 'Write a sentence using "belum" (not yet) — something that has not happened yet.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'not-yet' },
  { label: 'negation with "belum tentu"', instruction: 'Write a sentence using "belum tentu" (not necessarily / not certain) — expressing uncertainty or doubt.', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'not-necessarily' },
  { label: 'double negation', instruction: 'Write a sentence with a double-negative construction like "tidak...tidak" or "bukan tidak..." (it\'s not that I don\'t...).', minWords: 5, maxWords: 14, form: 'declarative', structure: 'complex', function: 'double negation' },
  { label: 'emphatic negative with "sama sekali tidak"', instruction: 'Write a sentence using "sama sekali tidak" or "sama sekali nggak" (not at all / absolutely not).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'strong negation' },

  // === ASPECT & MODALITY ===
  { label: '"sedang" progressive', instruction: 'Write a sentence using "sedang" for an ongoing action (currently...).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'progressive' },
  { label: '"lagi" colloquial progressive', instruction: 'Write a sentence using "lagi" (colloquial form of "sedang") for ongoing action.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial progressive' },
  { label: '"tengah" formal progressive', instruction: 'Write a formal sentence using "tengah" (currently/in the middle of) — a more formal progressive marker.', minWords: 4, maxWords: 10, form: 'declarative', structure: 'simple', function: 'formal progressive' },
  { label: '"sudah" perfective', instruction: 'Write a sentence using "sudah" (already) for a completed action.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'already' },
  { label: '"udah" colloquial perfective', instruction: 'Write a sentence using "udah" (colloquial "sudah") for completed action.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial already' },
  { label: '"telah" formal perfective', instruction: 'Write a formal sentence using "telah" (has/have — completed action) — formal/literary perfect.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'formal already' },
  { label: '"pernah" experiential', instruction: 'Write a sentence using "pernah" (have ever) for a past experience.', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'experience' },
  { label: '"akan" future', instruction: 'Write a sentence using "akan" (will) for a future event.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'future' },
  { label: '"bakal" colloquial future', instruction: 'Write a sentence using "bakal" (gonna/will) — colloquial future marker.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'colloquial future' },
  { label: '"mau" immediate future', instruction: 'Write a sentence using "mau" (going to/about to) for imminent future.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'imminent future' },
  { label: '"baru saja" recent past', instruction: 'Write a sentence using "baru saja" (just now) for a very recent action.', minWords: 4, maxWords: 10, form: 'declarative', structure: 'simple', function: 'recent past' },
  { label: '"barusan" colloquial', instruction: 'Write a sentence using "barusan" (just now/a moment ago) — the shortened colloquial "baru saja".', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial recent past' },
  { label: '"masih" continuity', instruction: 'Write a sentence using "masih" (still) for a continuing state.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'still' },
  { label: '"bisa"/"dapat" ability', instruction: 'Write a sentence about ability using "bisa" or "dapat" (can/able to).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ability' },
  { label: '"boleh" permission', instruction: 'Write a sentence about permission using "boleh" (may/allowed to).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'permission' },
  { label: '"harus"/"mesti" obligation', instruction: 'Write a sentence about obligation using "harus" or "mesti" (must/have to).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'obligation' },
  { label: '"perlu" necessity', instruction: 'Write a sentence about necessity using "perlu" (need to).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'necessity' },
  { label: '"mau"/"ingin" desire', instruction: 'Write a sentence expressing desire or intention using "mau" or "ingin" (want).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'desire' },
  { label: '"pengen" colloquial desire', instruction: 'Write a sentence using "pengen" (wanna/want) — colloquial Jakarta-style for "ingin".', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial desire' },
  { label: '"suka"/"gemar" preference', instruction: 'Write a sentence about liking or enjoying using "suka" or "gemar".', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'preference' },
  { label: '"doyan" colloquial liking', instruction: 'Write a sentence using "doyan" (really like/enjoy, especially food) — colloquial.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'colloquial liking' },
  { label: '"mungkin"/"barangkali" possibility', instruction: 'Write a sentence about possibility using "mungkin" or "barangkali" (maybe/perhaps).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'possibility' },
  { label: '"kayaknya"/"sepertinya" seeming', instruction: 'Write a sentence using "kayaknya" or "sepertinya" (it seems like / looks like) for tentative observation.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'seeming' },
  { label: '"ternyata" realization', instruction: 'Write a sentence using "ternyata" (it turns out that / apparently) — expressing discovery or realization.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'realization' },
  { label: '"rupanya" realization', instruction: 'Write a sentence using "rupanya" (apparently/it seems) — similar to "ternyata" but slightly softer.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'apparent realization' },
  { label: '"semestinya"/"seharusnya" should-have', instruction: 'Write a sentence using "semestinya" or "seharusnya" (should have / ought to) — expressing a missed obligation or ideal.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'should-have' },

  // === GRAMMATICAL FEATURES — VERB AFFIXES ===
  { label: '"me-" active verb focus', instruction: 'Write a sentence using an active transitive verb with "me-" prefix (e.g. melihat, membaca, menulis, mendengar).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'me- prefix' },
  { label: '"di-" passive voice', instruction: 'Write a sentence in passive voice using the "di-" prefix on a verb (e.g. dibuat, dimakan, dilihat, dibeli).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'di- passive' },
  { label: 'agentive passive "oleh"', instruction: 'Write a passive sentence that includes the agent using "oleh" (by) — e.g. "...dimasak oleh ibu".', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'agentive passive' },
  { label: 'bare passive (no "di-")', instruction: 'Write a sentence in bare passive voice — where the object comes first and the verb has no prefix (e.g. "Buku itu saya baca"). Very natural in Indonesian.', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'bare passive' },
  { label: '"ter-" accidental/stative', instruction: 'Write a sentence using "ter-" prefix — accidental action or stative meaning (e.g. terjatuh, tertidur, teringat, terbuka, terlihat).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ter- prefix' },
  { label: '"ter-" superlative', instruction: 'Write a superlative sentence using "ter-" prefix (e.g. terbaik, terburuk, termahal, tercantik).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'ter- superlative' },
  { label: '"ber-" intransitive', instruction: 'Write a sentence using a "ber-" prefixed verb (e.g. berjalan, berbicara, bekerja, bermain, belajar).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'ber- prefix' },
  { label: '"ber-" possessive', instruction: 'Write a sentence using "ber-" to mean "to have/possess" (e.g. beruang = have money, berbaju = wear clothes, beratap = have a roof).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'ber- possessive' },
  { label: '"me-kan" causative', instruction: 'Write a sentence using a "me-kan" suffixed verb (e.g. mengirimkan, memberikan, menjelaskan, mengembalikan).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'me-kan suffix' },
  { label: '"me-i" locative', instruction: 'Write a sentence using a "me-i" suffixed verb (e.g. menemani, mengirimi, menaiki, memasuki).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'me-i suffix' },
  { label: '"memper-" prefix', instruction: 'Write a sentence using a "memper-" prefixed verb (e.g. memperbaiki, mempercepat, memperluas) — causative/transitive with intensity.', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'memper- prefix' },
  { label: '"diper-" passive', instruction: 'Write a passive sentence using "diper-" prefix (e.g. diperbaiki, diperlukan, diperhatikan).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'diper- passive' },
  { label: '"memper-kan" complex causative', instruction: 'Write a sentence using "memper-kan" (e.g. mempertimbangkan, mempertunjukkan, memperingatkan).', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'memper-kan' },

  // === GRAMMATICAL FEATURES — CIRCUMFIXES & DERIVATION ===
  { label: '"ke-an" circumfix', instruction: 'Write a sentence using a "ke-an" circumfix — abstract noun or adversative (e.g. kedinginan, kehujanan, kesehatan, kebersihan, kecantikan).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ke-an circumfix' },
  { label: '"ke-an" adversative specifically', instruction: 'Write a sentence using "ke-an" for an adversative/undesirable condition (e.g. kedinginan = suffer from cold, kepanasan = suffer from heat, kehujanan = caught in rain).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ke-an adversative' },
  { label: '"pe-an" process', instruction: 'Write a sentence using a "pe-an" abstract noun (e.g. pembangunan, pendidikan, pengiriman, penulisan).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'pe-an process' },
  { label: '"per-an" abstract', instruction: 'Write a sentence using a "per-an" abstract noun (e.g. pertemuan, pergaulan, perkawinan, perbankan).', minWords: 4, maxWords: 12, form: 'declarative', structure: 'simple', function: 'per-an abstract' },
  { label: '"ber-an" reciprocal/collective', instruction: 'Write a sentence using "ber-an" verbs (e.g. berpelukan, bersalaman, berjatuhan, bermunculan, berdatangan).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ber-an' },

  // === GRAMMATICAL FEATURES — REDUPLICATION ===
  { label: 'reduplication — plural', instruction: 'Write a sentence using reduplication for plurality (e.g. anak-anak, buku-buku, rumah-rumah).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'plural reduplication' },
  { label: 'reduplication — variety', instruction: 'Write a sentence using reduplication to mean "various kinds of" (e.g. sayur-sayuran, buah-buahan, tumbuh-tumbuhan).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'variety reduplication' },
  { label: 'reduplication — reciprocal', instruction: 'Write a sentence using reciprocal reduplication (e.g. pukul-memukul, kunjung-mengunjungi, salam-salaman).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'reciprocal reduplication' },
  { label: 'reduplication — intensity/plural adjectives', instruction: 'Write a sentence using reduplicated adjectives for intensity/plurality (e.g. besar-besar, tinggi-tinggi, cantik-cantik, enak-enak).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'intensity reduplication' },
  { label: 'reduplication — leisure/relaxed action', instruction: 'Write a sentence using verb reduplication to express leisure or casual activity (e.g. jalan-jalan, duduk-duduk, makan-makan, lihat-lihat).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'leisure reduplication' },
  { label: 'reduplication — "se-...-nya" pattern', instruction: 'Write a sentence using the "se-...-nya" reduplication pattern (e.g. sebaik-baiknya, setinggi-tingginya, secepat-cepatnya) — expressing "as X as possible" or superlative.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'se-nya reduplication' },
  { label: 'reduplication — adverb formation', instruction: 'Write a sentence using reduplicated words that form adverbs (e.g. diam-diam = secretly, pelan-pelan = slowly, tiba-tiba = suddenly, hati-hati = carefully).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'adverbial reduplication' },

  // === GRAMMATICAL FEATURES — PREFIXES & SUFFIXES ===
  { label: '"se-" prefix', instruction: 'Write a sentence using "se-" prefix — meaning "one" or "same as" (e.g. seorang, seekor, sebaiknya, sepanjang, sesudah).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'se- prefix' },
  { label: '"se-nya" should-form', instruction: 'Write a sentence using "sebaiknya", "seharusnya", "semestinya", or "sepantasnya" (should/ought to / it would be best if...).', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'se-nya should' },
  { label: '"-nya" possessive/definite', instruction: 'Write a sentence naturally employing the "-nya" suffix — as possessive, definite article, or emphatic (e.g. bukunya, ternyata, seharusnya, rupanya).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: '-nya suffix' },
  { label: '"-an" nominalizer', instruction: 'Write a sentence using an "-an" suffixed noun (e.g. makanan, minuman, tulisan, masakan, mainan).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: '-an nominalizer' },
  { label: '"-wan/-wati" agent', instruction: 'Write a sentence using a profession/person noun with "-wan" or "-wati" (e.g. wartawan, karyawan, wisatawan, olahragawan).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: '-wan/-wati' },
  { label: 'prefix "pe-" agent', instruction: 'Write a sentence using a "pe-" prefixed agent noun — the person who does the action (e.g. pembaca, penulis, pembeli, penjual, pemain).', minWords: 3, maxWords: 10, form: 'declarative', structure: 'simple', function: 'pe- agent' },

  // === PARTICLES ===
  { label: 'particle "lah"', instruction: 'Write a sentence using the particle "lah" for emphasis or softening (e.g. dialah, itulah, datanglah, pergilah).', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'lah particle' },
  { label: 'particle "kah"', instruction: 'Write a question using the particle "kah" (e.g. bisakah, sudahkah, tahukah, siapakah).', minWords: 2, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'kah particle' },
  { label: 'particle "pun"', instruction: 'Write a sentence using "pun" — meaning "also/even" or in words like "siapapun", "apapun", "meskipun", "walaupun".', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'pun particle' },
  { label: 'particle "sih"', instruction: 'Write a sentence using the colloquial particle "sih" — softens, adds curiosity, or expresses mild emphasis.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'sih particle' },
  { label: 'particle "dong"', instruction: 'Write a sentence using the colloquial particle "dong" — adds warm emphasis, like "obviously!/come on!" feeling.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'dong particle' },
  { label: 'particle "deh"', instruction: 'Write a sentence using the colloquial particle "deh" — expresses a decision, resignation, or gentle suggestion.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'deh particle' },
  { label: 'particle "kok"', instruction: 'Write a sentence using the particle "kok" — implies "why/how come" or emphasizes that something is contrary to expectation.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'kok particle' },
  { label: 'particle "kan" emphasis', instruction: 'Write a sentence using "kan" as an emphatic particle (not a question tag) — "you know...", "right...".', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'kan particle' },
  { label: 'particle "nih"/"tuh"', instruction: 'Write a sentence using "nih" (here/take this — offering) or "tuh" (there/look — pointing out) — common deictic particles.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'deictic particle' },
  { label: 'particle "ya" non-question', instruction: 'Write a sentence using "ya" as a filler/softener — not a question tag, but the conversational "ya" (well, um, you know).', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'ya filler' },
  { label: 'multiple particles combined', instruction: 'Write a sentence combining 2-3 colloquial particles naturally (e.g. "...sih, ya?", "...dong, ah!", "...deh, kok...").', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'combined particles' },

  // === LONGER / COMPOUND-COMPLEX ===
  { label: 'medium compound-complex', instruction: 'Write a compound-complex sentence (10-18 words) combining at least two clause types (e.g. compound + complex).', minWords: 10, maxWords: 18, form: 'declarative', structure: 'compound-complex', function: 'medium narrative' },
  { label: 'long compound-complex', instruction: 'Write a long compound-complex sentence (18-28 words) with multiple subordinate clauses woven together naturally.', minWords: 18, maxWords: 28, form: 'declarative', structure: 'compound-complex', function: 'long narrative' },
  { label: 'very long sentence', instruction: 'Write a very long, flowing sentence (25-35 words) that tells a mini-story or describes a complex situation — but keeps A2-level vocabulary.', minWords: 25, maxWords: 35, form: 'declarative', structure: 'compound-complex', function: 'very long narrative' },
  { label: 'multi-part list sentence', instruction: 'Write a sentence listing 3+ items or actions in a flowing list (use commas naturally, like Indonesian speakers do).', minWords: 8, maxWords: 20, form: 'declarative', structure: 'compound', function: 'listing' },

  // === OPTATIVE / EXPRESSIVE ===
  { label: 'wish/hope with "semoga"', instruction: 'Write a sentence expressing a wish or hope using "semoga" or "mudah-mudahan" (may/hopefully).', minWords: 3, maxWords: 12, form: 'optative', structure: 'simple', function: 'wish' },
  { label: 'prayer with "insya Allah"', instruction: 'Write a sentence using "insya Allah" (God willing) — very commonly used in Indonesian daily speech.', minWords: 3, maxWords: 12, form: 'optative', structure: 'simple', function: 'prayer' },
  { label: 'gratitude with "terima kasih"', instruction: 'Write a sentence expressing gratitude or thanks — beyond just "terima kasih", include a reason.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'gratitude' },
  { label: 'apology with "maaf"', instruction: 'Write a sentence apologizing — using "maaf" and explaining or softening the apology.', minWords: 3, maxWords: 14, form: 'declarative', structure: 'complex', function: 'apology' },
  { label: 'congratulation', instruction: 'Write a congratulatory sentence or well-wish (e.g. "selamat...").', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'congratulation' },
  { label: 'sympathy/condolence', instruction: 'Write a sentence expressing sympathy or offering condolences — "turut berduka cita" or supportive phrases.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'sympathy' },
  { label: 'warning/caution', instruction: 'Write a warning or cautionary sentence (using "hati-hati", "awas", or similar).', minWords: 3, maxWords: 12, form: 'imperative', structure: 'simple', function: 'warning' },
  { label: 'encouragement', instruction: 'Write a sentence encouraging or motivating someone — "Semangat!", "Ayo!", "Kamu pasti bisa!" style.', minWords: 2, maxWords: 12, form: 'exclamatory', structure: 'simple', function: 'encouragement' },

  // === NARRATIVE & CONVERSATIONAL ===
  { label: 'first-person narrative', instruction: 'Write a first-person ("saya"/"aku") narrative sentence — like someone telling a short story about themselves.', minWords: 6, maxWords: 18, form: 'declarative', structure: 'complex', function: 'first-person narrative' },
  { label: 'third-person narration', instruction: 'Write a third-person narrative sentence — describing what someone else did or what happened.', minWords: 6, maxWords: 18, form: 'declarative', structure: 'complex', function: 'third-person narrative' },
  { label: 'reported speech', instruction: 'Write a sentence that includes reported/indirect speech (e.g. "Dia bilang bahwa...", "Ibu mengatakan...").', minWords: 6, maxWords: 18, form: 'declarative', structure: 'complex', function: 'reported speech' },
  { label: 'direct speech quotation', instruction: 'Write a sentence that includes a direct quote or dialogue fragment — use quotation marks naturally.', minWords: 6, maxWords: 20, form: 'declarative', structure: 'complex', function: 'direct speech' },
  { label: 'self-talk/thinking aloud', instruction: 'Write a sentence of someone talking to themselves or thinking aloud — use introspective language.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'self-talk' },
  { label: 'gossip/rumour', instruction: 'Write a sentence that sounds like gossip or passing along a rumour (e.g. "Katanya...", "Denger-denger...").', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'gossip' },
  { label: 'complaint about daily life', instruction: 'Write a sentence complaining about a very Indonesian everyday annoyance — traffic, heat, queues, bureaucracy, etc.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'complaint' },
  { label: 'bragging/boasting', instruction: 'Write a sentence someone might say while showing off or bragging a little — in a natural Indonesian way.', minWords: 4, maxWords: 14, form: 'declarative', structure: 'simple', function: 'boasting' },
  { label: 'indirect refusal', instruction: 'Write a sentence that politely/indirectly refuses or declines something — Indonesian culture often avoids direct "no". Use "nanti dulu", "lain kali", "belum bisa", etc.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'indirect refusal' },
  { label: 'changing topic', instruction: 'Write a sentence that smoothly changes the conversation topic — "Ngomong-ngomong...", "Eh iya...", "Btw..." style.', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'topic change' },
  { label: 'expressing confusion', instruction: 'Write a sentence expressing confusion or not understanding — "Maksudnya?", "Kok gitu?", "Aku bingung deh..." style.', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'confusion' },
  { label: 'recalling/remembering', instruction: 'Write a sentence of someone suddenly remembering something — "Oh iya!", "Aku lupa...!", "Eh, ingat..." style.', minWords: 2, maxWords: 12, form: 'declarative', structure: 'simple', function: 'recall' },
  { label: 'idiomatic expression', instruction: 'Write a sentence using a common Indonesian idiom or proverb that would be natural in conversation (e.g. "besar kepala", "ringan tangan", "buah tangan", "panjang akal", "banting tulang", "angkat kaki").', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'idiom' },
  { label: 'texting/chat-style', instruction: 'Write a sentence in the style of a WhatsApp chat message — abbreviated, casual, maybe using shortened words like "yg", "dg", "tdk", "blm", "jg".', minWords: 2, maxWords: 12, form: 'declarative', structure: 'simple', function: 'chat message' },
  { label: 'phone conversation opener', instruction: 'Write a typical phone call opening — "Halo?", "Halo, dengan...", "Halo, bisa bicara dengan...?" style.', minWords: 2, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'phone call' },
  { label: 'offering help', instruction: 'Write a sentence offering help or assistance — "Bisa saya bantu?", "Perlu bantuan?", "Mau saya...?" style.', minWords: 3, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'offering help' },
  { label: 'expressing disbelief', instruction: 'Write a sentence expressing disbelief or skepticism — "Masa sih?", "Serius?", "Nggak mungkin...", "Yang bener?" style.', minWords: 2, maxWords: 10, form: 'interrogative', structure: 'simple', function: 'disbelief' },

  // === CODE-SWITCHING & CULTURAL ===
  { label: 'Indonesian-English code-switch', instruction: 'Write a sentence that naturally mixes Indonesian with one or two English words — the way urban Indonesians actually speak (e.g. "...exciting banget!", "Gue nggak mood today").', minWords: 3, maxWords: 14, form: 'declarative', structure: 'simple', function: 'code-switching' },
  { label: 'Javanese-influenced Indonesian', instruction: 'Write a sentence that incorporates a Javanese word or expression naturally into Indonesian — like "lho", "to", "wis", "piye", "ora".', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'Javanese influence' },
  { label: 'Sundanese-influenced Indonesian', instruction: 'Write a sentence that incorporates a Sundanese word or expression — like "atuh", "teh", "mah", "euy", "dulur".', minWords: 3, maxWords: 12, form: 'declarative', structure: 'simple', function: 'Sundanese influence' },
  { label: 'religious expression', instruction: 'Write a sentence that naturally includes a common Islamic expression used in daily Indonesian — like "Alhamdulillah", "Astagfirullah", "Masya Allah", "Bismillah".', minWords: 2, maxWords: 10, form: 'declarative', structure: 'simple', function: 'religious expression' },

  // === FORMAL & ACADEMIC ===
  { label: 'formal announcement', instruction: 'Write a sentence in formal announcement style — like a public notice, schedule change, or official statement.', minWords: 5, maxWords: 16, form: 'declarative', structure: 'complex', function: 'formal announcement' },
  { label: 'definition/explanation', instruction: 'Write a sentence that defines or explains what something is — using "...adalah..." or "...merupakan..." structure.', minWords: 5, maxWords: 16, form: 'declarative', structure: 'complex', function: 'definition' },
  { label: 'instructional "cara"', instruction: 'Write a sentence giving instructions or explaining how to do something — "Cara..." or step-like format in one flowing sentence.', minWords: 6, maxWords: 18, form: 'declarative', structure: 'complex', function: 'instruction' },
]

const TOPICS: string[] = [
  'Daily routine & morning habits (waking, bathing, breakfast, commuting to work/school)',
  'Evening & bedtime routines (dinner, relaxing, going to sleep, night activities)',
  'Weekend & holiday activities (leisure, trips, sleeping in, special events)',
  'Food, cooking & eating out (restaurants, street food, warung, taste, hunger, cooking)',
  'Indonesian cuisine specifically (nasi goreng, sate, rendang, gado-gado, soto, bakso, nasi padang)',
  'Beverages & drinks (coffee, tea, juice, es teh, kopi tubruk, ordering drinks, drinking culture)',
  'Warung kopi & nongkrong culture (hanging out at coffee stalls, chatting for hours)',
  'Street food & kaki lima (food carts, night markets, snacking culture)',
  'Travel & transportation (planes, trains, buses, ojek, taxis, traffic, commuting)',
  'Traffic jams & macet culture (Jakarta traffic, coping strategies, ojek advantages)',
  'Ride-hailing (Gojek, Grab — ordering, drivers, ratings, promotions)',
  'Public transport (KRL Commuter Line, TransJakarta, MRT, angkot, becak)',
  'Directions & navigation (asking the way, maps, landmarks, getting lost, GPS)',
  'Work & office life (meetings, deadlines, coworkers, boss, tasks, career)',
  'Indonesian workplace culture (jam karet, hierarchy, basa-basi, office dynamics)',
  'School, university & studying (classes, exams, homework, grades, teachers, subjects)',
  'Boarding houses / kos-kosan (student life, renting a room, shared spaces)',
  'Family & relatives (parents, siblings, grandparents, cousins, family events)',
  'Extended family dynamics (Indonesian family gatherings, many cousins, respect for elders)',
  'Friendship & social life (hanging out, chatting, making friends, conflicts, loyalty)',
  'Nongkrong (the art of hanging out — malls, parks, roadside, anywhere)',
  'Love, dating & relationships (romance, marriage, breakups, crushes, feelings)',
  'Indonesian dating culture (pacaran, taaruf, family involvement, PDKT)',
  'Marriage & weddings (Indonesian wedding traditions, receptions, preparations)',
  'Shopping & markets (traditional markets, malls, bargaining, prices, groceries)',
  'Traditional markets / pasar tradisional (bargaining, fresh produce, atmosphere)',
  'Online shopping & e-commerce (Tokopedia, Shopee, Lazada, COD, reviews)',
  'Money, budgeting & finance (saving, spending, salaries, bills, banking)',
  'Arisan (rotating savings groups — a very Indonesian social-financial practice)',
  'Weather, climate & seasons (rain, heat, humidity, floods, dry season, forecasts)',
  'Monsoon & banjir (flood season, dealing with floods, Jakarta floods)',
  'Nature & the outdoors (mountains, beach, forest, gardens, camping, scenery)',
  'Indonesian geography (islands, volcanoes, beaches, rice terraces, landmarks)',
  'Volcanoes & mountains (Gunung Bromo, Merapi, Rinjani — hiking, eruptions)',
  'Animals, pets & wildlife (cats, dogs, birds, fish, wild animals, insects)',
  'Indonesian wildlife (orangutans, komodo dragons, hornbills, coral reef fish)',
  'Plants, gardening & farming (flowers, trees, vegetables, rice fields, harvest)',
  'Rice cultivation & sawah (rice paddies, planting, harvesting, farmers)',
  'Health, illness & medicine (doctor visits, symptoms, medicine, hospitals, recovery)',
  'Traditional medicine / jamu (herbal drinks, traditional healing, remedies)',
  'Exercise, sports & fitness (running, gym, football, badminton, swimming, yoga)',
  'Football culture in Indonesia (club loyalties, watching matches, street football)',
  'Badminton (Indonesia\'s favorite sport — playing, watching, national pride)',
  'Body & physical sensations (pain, hunger, tiredness, hot/cold, comfort)',
  'Hobbies & pastimes (music, reading, photography, collecting, DIY, crafts)',
  'Indonesian music (dangdut, pop, indie, koplo, traditional gamelan)',
  'Entertainment & media (movies, TV, YouTube, music, concerts, celebrities)',
  'Indonesian TV & sinetron (soap operas, reality shows, gossip programs)',
  'Games & gaming (board games, video games, mobile games, sports games)',
  'Mobile gaming culture (Mobile Legends, PUBG Mobile, Free Fire — huge in Indonesia)',
  'Technology, gadgets & devices (smartphones, laptops, apps, internet, WiFi)',
  'Social media & online life (Instagram, TikTok, WhatsApp, chatting, posting, memes)',
  'WhatsApp culture (groups, voice notes, status updates, emoji etiquette)',
  'Emotions, feelings & mental health (happy, sad, stressed, anxious, calm, angry, jealous)',
  'Personality & character traits (kind, honest, lazy, brave, shy, funny, stubborn)',
  'Time, schedules & punctuality (clocks, being late, appointments, deadlines, calendars)',
  'Jam karet (rubber time — the cultural concept of flexible punctuality)',
  'Home, rooms & furniture (living room, kitchen, bedroom, bathroom, cleaning, decorating)',
  'Household chores & cleaning (washing, sweeping, cooking, tidying up, laundry)',
  'Indonesian home life (open layouts, tile floors, family rooms, prayer spaces)',
  'Clothing, fashion & style (clothes, shoes, accessories, colors, shopping for clothes)',
  'Batik & traditional clothing (batik patterns, kebaya, sarung, when to wear them)',
  'Personal appearance & grooming (haircuts, makeup, skincare, looking good/bad)',
  'Opinions, debates & arguments (agreeing, disagreeing, convincing, debating politely)',
  'Indonesian communication style (indirectness, saving face, basa-basi, reading between lines)',
  'Making plans & invitations (suggesting activities, arranging meetups, RSVPs, scheduling)',
  'Gotong royong (community cooperation — neighbors helping each other)',
  'Holidays, festivals & celebrations (Lebaran, Christmas, New Year, birthdays, weddings)',
  'Lebaran/Idul Fitri (mudik, ketupat, halal bihalal, family visits, forgiveness)',
  'Ramadan & fasting culture (sahur, buka puasa, ngabuburit, takjil)',
  'Indonesian independence day (17 Agustus — lomba, panjat pinang, ceremonies)',
  'Culture, customs & traditions (manners, etiquette, local customs, superstitions)',
  'Indonesian superstitions & myths (ghost stories, urban legends, pamali, mystical beliefs)',
  'Religion & spirituality (prayer, mosque/church/temple, religious holidays, daily practice)',
  'Language & communication (learning Indonesian, speaking, misunderstanding, accents)',
  'Regional languages & dialects (Javanese, Sundanese, Minang, Betawi, etc. — influence on Indonesian)',
  'News, current events & gossip (what happened, stories, rumours, headlines)',
  'Indonesian politics & bureaucracy (administrative procedures, government offices, urus surat)',
  'Memories & past experiences (childhood, nostalgia, recent events, stories from the past)',
  'Indonesian childhood (traditional games, school days, growing up memories)',
  'Dreams, wishes & aspirations (future goals, hopes, ambitions, fantasies)',
  'Problems, complaints & solutions (everyday annoyances, fixing things, solving issues)',
  'Colors, shapes & visual descriptions (describing what things look like, aesthetics)',
  'Sounds, noises & hearing (loud, quiet, music, voices, ambient sounds)',
  'Tastes, smells & sensory experiences (delicious, bitter, fragrant, stinky, textures)',
  'Numbers, measurements & quantities (counting, sizes, distances, weights, prices)',
  'Comparisons & rankings (better/worse, biggest, most/least, comparing things)',
  'Small talk & casual greetings (introductions, saying hi/bye, asking how someone is)',
  'Basa-basi (the art of polite small talk — asking where someone is going, etc.)',
  'Polite expressions & etiquette (thank you, sorry, excuse me, please, formalities)',
  'Instructions & giving directions (how to do something, step-by-step, explaining processes)',
  'Indonesian arts & crafts (batik making, wayang kulit, gamelan music, traditional dance)',
  'Fishing & maritime life (fishermen, boats, seafood, coastal communities)',
  'Urban vs rural life contrast (city life vs village life, urbanization, kampung vs kota)',
  'Electricity & infrastructure (mati lampu / power outages, water supply, internet reliability)',
  'Delivery & logistics (paket, kurir, online delivery, waiting for packages)',
  'Photography & selfie culture (foto-foto, Instagram spots, OOTD, aesthetic cafes)',
  'Horror & ghost stories (hantu, kuntilanak, pocong, scary experiences — very popular topic!)',
]

const MOODS: string[] = [
  'Neutral and matter-of-fact — just state information plainly.',
  'Warm and positive — cheerful, friendly, optimistic, encouraging tone.',
  'Curious and wondering — ask or imply something thought-provoking.',
  'Lighthearted and playful — humorous, witty, a little surprising or absurd.',
  'Reflective and thoughtful — makes the reader pause and think deeply.',
  'Dramatic and expressive — a bit theatrical, emotional, or intense.',
  'Calm and soothing — gentle, reassuring, peaceful, like a meditation.',
  'Urgent and direct — feels like something important needs immediate attention.',
  'Sarcastic or ironic — says one thing but implies another, clever twist.',
  'Nostalgic and wistful — longing for the past, bittersweet memories.',
  'Skeptical and doubtful — questioning, unsure, not quite convinced.',
  'Inspired and motivational — uplifting, pushing the reader to take action.',
  'Anxious and worried — nervous energy, concern about what might happen.',
  'Relieved and grateful — a weight has been lifted, thankful for how things turned out.',
  'Grumpy and complaining — venting about everyday frustrations in a relatable way.',
  'Mischievous and teasing — gently poking fun, a wink in the tone.',
  'Awkward and sheepish — embarrassed, admitting a mistake or social faux pas.',
  'Determined and resolute — firm, decided, not backing down.',
  'Romantic and tender — soft, loving, affectionate expression.',
  'Jealous and envious — a little green-eyed, wanting what someone else has.',
  'Bored and indifferent — apathetic, couldn\'t care less, yawning through it.',
  'Awestruck and amazed — wonder, amazement, something incredible happened.',
  'Guilty and regretful — wishing something had gone differently.',
  'Proud and accomplished — satisfaction in achievement, deserved pride.',
  'Lonely and isolated — feeling alone even in a crowd, missing someone.',
  'Confident and self-assured — bold, sure of oneself, assertive.',
  'Shy and hesitant — reluctant, unsure whether to speak up.',
  'Overwhelmed and exhausted — too much happening, running on empty.',
]

const REGISTERS: string[] = [
  'Formal/baku — use standard Indonesian (bahasa baku), proper grammar, suitable for official situations.',
  'Informal/sehari-hari — use everyday conversational Indonesian, the way people actually speak with friends and family.',
  'Colloquial/Jakarta-style — use casual Jakarta-influenced Indonesian with words like "gue", "lo", "aja", "banget", "nggak", "udah".',
  'Semi-formal — polite but not stiff, like talking to a respected elder or a teacher. Use "saya" and polite terms.',
  'Youth slang/gaul — use current Indonesian youth slang and abbreviations where natural (but still understandable to learners).',
  'Warm and intimate — soft, caring tone like talking to a child, a loved one, or a close friend.',
  'Professional — like workplace communication, clear and efficient, respectful.',
  'Poetic/expressive — use more evocative vocabulary, metaphors, or rhythmic phrasing.',
  'Betawi-influenced — use Betawi dialect flavor (Jakarta native) with words like "aye", "ente", "saye" where natural.',
  'Javanese-influenced — sprinkle Javanese words like "lho", "to", "wis", "piye", "ngono" into Indonesian.',
  'Sundanese-influenced — sprinkle Sundanese flair like "atuh", "teh", "mah", "euy" into Indonesian.',
  'Text/chat language — use WhatsApp-style abbreviations: "yg", "dg", "tdk", "blm", "jg", "trs", "gpp", "bgt".',
  'Child-directed speech — warm, simple language as if speaking to a small child. Use "sini", "adek", cute reduplications.',
  'Market/bargaining speech — the quick, informal style used when haggling at a pasar tradisional.',
  'Religious/solemn — include religious expressions, respectful tone suitable for spiritual contexts.',
  'Tourist-guide style — friendly, explanatory, like a guide welcoming visitors to Indonesia.',
]

const PERSONS: string[] = [
  'First person singular ("saya"/"aku") — the speaker is talking about themselves.',
  'First person singular intimate ("aku") — specifically the intimate/casual first person.',
  'First person formal ("saya") — specifically the formal first person.',
  'First person plural inclusive ("kita") — the speaker + listener, we together.',
  'First person plural exclusive ("kami") — the speaker + others, not the listener.',
  'Second person familiar ("kamu"/"kau") — addressing a peer, friend, or younger person.',
  'Second person colloquial ("lu"/"elo") — Jakarta-style casual second person.',
  'Second person formal ("Anda"/"Bapak"/"Ibu") — addressing someone respectfully.',
  'Third person singular ("dia"/"ia"/"beliau") — talking about someone else.',
  'Third person colloquial ("dia" casual) — informal reference to a third person.',
  'Third person plural ("mereka") — talking about a group of other people.',
  'Impersonal/general ("orang"/"kita" generic) — talking about people in general, no specific person.',
]

const FORBIDDEN_PATTERNS = [
  '"Apakah kamu mau ikut"',
  '"Apakah kamu mau pergi ke"',
  '"Apakah kamu ingin" as a monotonous pattern',
  'Any sentence starting with "Apakah kamu mau"',
  'The exact sentence "Saya suka makan nasi goreng"',
  '"Saya pergi ke" as a sentence opener for multiple days',
  'The pattern "Saya mau pergi ke..." appearing frequently',
  '"Hari ini saya..." as a repetitive opener',
  '"Saya tinggal di..." appearing too often',
  '"Nama saya..." appearing too frequently (unless it\'s an introduction-style sentence)',
  'Repeatedly using the same verb (e.g. "makan", "pergi", "minum", "tidur") day after day without variety',
  '"Saya dari..." as a sentence opener for multiple days',
  'Any sentence that is just a subject + verb + object with no other grammatical features',
  'Sentences that feel like textbook drill exercises rather than natural speech',
  'The exact sentence "Apa kabar?" appearing (too basic, too repetitive)',
  'Repeating the same sentence structure as the immediate previous sentence in the forbidden list',
  'Generating a sentence with the same communicative function as the most recent 3 sentences',
  'Using the same topic domain as the most recent 5 sentences',
  'Sentences entirely composed of words that appeared in the 3 most recent sentences',
]

export async function generateSentence(
  apiKey: string,
  previousSentences: string[] = []
): Promise<{ indonesian: string; translation: string; cefr: string; vocabulary: VocabularyItem[] }> {
  const seed = getDaySeed()
  const style = pickFrom(SENTENCE_STYLES, seed)
  const topic = pickFrom(TOPICS, seed * 17 + 31)
  const mood = pickFrom(MOODS, seed * 13 + 7)
  const register = pickFrom(REGISTERS, seed * 19 + 11)
  const person = pickFrom(PERSONS, seed * 23 + 13)

  const previousList = previousSentences.length > 0
    ? `\nPREVIOUS SENTENCES — you MUST NOT repeat or closely paraphrase any of these:\n${previousSentences.map((s, i) => `${i + 1}. "${s}"`).join('\n')}\nThese were recent sentences. Generate something completely different.`
    : ''

  const forbiddenList = FORBIDDEN_PATTERNS.map((p, i) => `${i + 1}. ${p}`).join('\n')

  const systemPrompt = `You are a wildly creative Bahasa Indonesia teacher. Generate ONE Indonesian sentence for an A2-level learner. Every single day must be completely different — different structure, different rhythm, different vocabulary, different everything.

BLOCKED PATTERNS — never produce anything like these:
${forbiddenList}
${previousList}

ABSOLUTE VARIETY MANDATE:
- Sentence TYPE must bounce around: declarative statements, interrogative questions, imperative commands, exclamatory outbursts, optative wishes.
- Sentence STRUCTURE must cycle: simple single-clause, compound with conjunctions, complex with subordinate clauses, compound-complex with multiple clause types woven together.
- Sentence LENGTH must vary wildly: from terse 1-word fragments to sprawling 25+ word sentences that paint a full picture.
- VOCABULARY must be diverse. Never lean on the same nouns/verbs/adjectives two days in a row. Explore the entire Indonesian lexicon appropriate for A2.
- The sentence must sound NATURAL — the way real Indonesians actually speak in daily life, not robotic textbook examples.
- Deploy the full range of Indonesian grammar: "me-" and "ber-" verbs, "di-" passives, "ter-" accidentals/statives, "me-kan" and "me-i" suffixes, "ke-an" and "pe-an"/"per-an" circumfixes, reduplication for plurals/reciprocals/intensity, "se-" prefix, "-nya" suffix in all its uses, particles like "lah"/"kah"/"pun"/"sih"/"dong"/"deh"/"kok".
- Vary the REGISTER: some days use formal "bahasa baku", other days informal colloquial, other days Jakarta-influenced casual speech with "gue"/"lo".
- Vary the PERSON: sometimes first-person, sometimes second-person, sometimes third-person, sometimes impersonal general statements.
- Occasionally use common Indonesian idioms, expressions, or cultural references.
- Occasionally use interjections like "aduh", "wah", "aduh", "ih", "nah", "lho" where natural.
- Use a rich variety of conjunctions beyond just "dan" and "tetapi": "lalu", "kemudian", "jadi", "padahal", "sementara", "sambil", "sejak", "sampai", "walaupun", "meskipun", "supaya", "agar", "sehingga", "maka", "asal", "seandainya".

CRITICAL: Each day's sentence must feel like it came from a completely different speaker, in a completely different situation, with a completely different rhythm and vocabulary. No two days should ever feel similar.

Return ONLY a JSON object with these exact fields:
{
  "indonesian": "...",
  "english": "...",
  "cefr": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "vocabulary": [
    {"word": "makan", "translation": "eat"},
    {"word": "nasi", "translation": "rice"}
  ]
}
- The "cefr" field must be your estimate of this sentence's CEFR difficulty level (A1 through C2).
- The "vocabulary" field must list 3-8 key words from the Indonesian sentence paired with their English translations. Include only content words (nouns, verbs, adjectives, adverbs) — skip particles and prepositions unless essential.`

  const userPrompt = `TODAY'S SENTENCE SPECIFICATION:
—————————————————————
Topic domain: ${topic}
Tone/mood: ${mood}
Register: ${register}
Narrative person: ${person}
Form: ${style.form}
Structure: ${style.structure}
Communicative function: ${style.function}
Word count: ${style.minWords}—${style.maxWords}
Instruction: ${style.instruction}
—————————————————————
Generate exactly ONE Indonesian sentence that satisfies ALL of the above parameters simultaneously. Make it feel spontaneous, natural, and completely unlike any sentence from previous days. Do not force it — the sentence should feel like it naturally emerged from a real conversation or thought.`

  const result = await callOpenRouter(apiKey, systemPrompt, userPrompt, 1.0, { type: 'json_object' })
  const parsed = JSON.parse(result)
  return {
    indonesian: parsed.indonesian,
    translation: parsed.english,
    cefr: parsed.cefr || 'A2',
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
  }
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
