// Code analysis — uses Groq (free, fast) with Gemini as fallback

export async function analyzeRepo(params: {
  owner: string
  name: string
  description: string
  language: string
  stars: number
  files: string[]
}): Promise<string> {

  const prompt = `You are a senior software engineer helping a student or junior developer understand a codebase.

Repository: ${params.owner}/${params.name}
Description: ${params.description || 'No description'}
Language: ${params.language}
Stars: ${params.stars}
Files: ${params.files.slice(0, 50).join(', ')}

Write a clear, detailed explanation with these sections:

## What This Project Does
3-4 sentences explaining what it is, what problem it solves, and who uses it. Use simple language.

## How It Is Structured
Describe the folder structure. What does each major folder contain?

## Technology Breakdown
List every major technology and its specific role in this project.

## The Most Important Files
List 5-6 files a new developer must read first. For each: what it does and why it matters.

## How to Understand This Codebase (Step by Step)
Numbered steps — in what order should a developer explore this project?

## Common Questions a New Developer Would Ask
Answer 3-4 typical questions about this project.

Be specific. Be clear. Assume the reader is learning.`

  // Try Groq first (free, fast, no credit card)
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (groqKey && groqKey !== 'your-groq-api-key-here' && groqKey.length > 10) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      })
      const d = await res.json()
      if (res.ok && d.choices?.[0]?.message?.content) {
        return d.choices[0].message.content
      }
      if (d.error) throw new Error(d.error.message)
    } catch (e: any) {
      console.warn('Groq failed:', e.message, '— trying Gemini fallback')
    }
  }

  // Gemini fallback
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (geminiKey && geminiKey !== 'your-gemini-api-key-here' && geminiKey.length > 10) {
    // Try multiple model names in order
    const models = ['gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-flash']
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        )
        const d = await res.json()
        if (res.ok && !d.error) {
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) return text
        }
        if (d.error?.status === 'NOT_FOUND') continue // try next model
        if (d.error) throw new Error(d.error.message)
      } catch (e: any) {
        if (e.message?.includes('NOT_FOUND')) continue
        throw e
      }
    }
  }

  throw new Error('NO_KEY')
}

export async function analyzeFile(params: {
  owner: string
  name: string
  path: string
  content: string
}): Promise<string> {

  const prompt = `Explain this code file to a student or junior developer.

Repository: ${params.owner}/${params.name}
File: ${params.path}

\`\`\`
${params.content.slice(0, 3000)}
\`\`\`

Explain clearly:
## What This File Does
## Key Functions / Classes
## How It Connects to the Rest of the Project

Be specific and simple.`

  // Try Groq first
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (groqKey && groqKey !== 'your-groq-api-key-here' && groqKey.length > 10) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.2,
        }),
      })
      const d = await res.json()
      if (res.ok && d.choices?.[0]?.message?.content) return d.choices[0].message.content
    } catch {}
  }

  // Gemini fallback
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (geminiKey && geminiKey !== 'your-gemini-api-key-here' && geminiKey.length > 10) {
    const models = ['gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-flash']
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        )
        const d = await res.json()
        if (res.ok && !d.error) {
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) return text
        }
        if (d.error?.status === 'NOT_FOUND') continue
      } catch {}
    }
  }

  throw new Error('NO_KEY')
}
