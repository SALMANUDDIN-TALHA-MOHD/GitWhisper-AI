'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Loader, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props { owner: string; name: string }

export default function ReadmeViewer({ owner, name }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const h: Record<string,string> = {
      Accept: 'application/vnd.github.v3+json',
      ...(token && token.length > 10 ? { Authorization: `Bearer ${token}` } : {})
    }
    fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers: h })
      .then(async r => {
        if (!r.ok) throw new Error('No README found')
        const d = await r.json()
        const decoded = atob(d.content.replace(/\n/g, ''))
        setContent(decoded)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [owner, name])

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5 flex items-center gap-2">
        <BookOpen size={14} className="text-[var(--accent2)]"/>
        <span className="text-sm font-medium text-[var(--text2)]">README.md</span>
        <a href={`https://github.com/${owner}/${name}#readme`} target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-xs text-[var(--text3)] hover:text-[var(--accent2)] transition-colors">
          View on GitHub <ExternalLink size={11}/>
        </a>
      </div>
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-[var(--text2)] text-sm">
            <Loader size={14} className="animate-spin text-indigo-400"/> Loading README...
          </div>
        ) : error ? (
          <p className="text-[var(--text3)] text-sm font-mono">No README found for this repository.</p>
        ) : (
          <div className="ai-prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}
