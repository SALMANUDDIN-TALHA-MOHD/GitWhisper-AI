'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, Terminal, ArrowRight, AlertCircle } from 'lucide-react'
import { fetchRepoData } from '@/lib/github'
import toast from 'react-hot-toast'

interface Props { onClose: () => void; onSuccess: (repo: any) => void }

export default function RepoImportModal({ onClose, onSuccess }: Props) {
  const [url, setUrl]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const parseUrl = (input: string) => {
    try {
      const u = new URL(input.startsWith('http') ? input : 'https://' + input)
      const parts = u.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
      if (parts.length >= 2) return { owner: parts[0], name: parts[1].replace(/\.git$/, '') }
    } catch {
      const parts = input.replace(/^github\.com\//, '').split('/')
      if (parts.length >= 2) return { owner: parts[0], name: parts[1].replace(/\.git$/, '') }
    }
    return null
  }

  const handleImport = async () => {
    setError(''); setLoading(true)
    const parsed = parseUrl(url.trim())
    if (!parsed) { setError('Invalid GitHub URL. Example: https://github.com/facebook/react'); setLoading(false); return }
    try {
      const data = await fetchRepoData(parsed.owner, parsed.name)
      const repo = {
        id: `${parsed.owner}-${parsed.name}-${Date.now()}`,
        name:     parsed.name,
        owner:    parsed.owner,
        language: data.language || 'Unknown',
        stars:    data.stargazers_count || 0,
        files:    data.tree?.length || 0,
        analysed: false,
        summary:  data.description || 'Analysis pending...',
      }
      onSuccess(repo)
      toast.success(`${parsed.owner}/${parsed.name} added!`)
    } catch (err: any) {
      setError(err.message || 'Repository not found or is private.')
    } finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3,10,3,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="terminal-card rounded-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="terminal-bar px-5 py-3">
            <span className="terminal-dot bg-red-500/60" />
            <span className="terminal-dot bg-yellow-500/60 mx-1.5" />
            <span className="terminal-dot bg-green-500/60" />
            <span className="ml-3 text-xs font-mono text-text3">import_repository.sh</span>
            <button onClick={onClose} className="ml-auto text-text3 hover:text-text transition-colors"><X size={15} /></button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Github size={20} className="text-[var(--accent2)]" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-text">Import Repository</h3>
                <p className="text-xs font-mono text-text3">Any public GitHub repository</p>
              </div>
            </div>

            {/* Terminal prompt */}
            <div className="bg-surface rounded-xl border border-white/8 p-4 mb-4 font-mono">
              <div className="text-xs text-text3 mb-2">&gt; Enter repository URL:</div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent2)] text-sm">$</span>
                <input
                  autoFocus
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleImport()}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-transparent text-sm text-[var(--accent2)]2 placeholder-[var(--text3)] outline-none"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs font-mono text-red-400 mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
              >
                <AlertCircle size={13} /> {error}
              </motion.div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 btn-outline font-mono text-sm py-2.5 rounded-xl">Cancel</button>
              <button
                onClick={handleImport}
                disabled={!url.trim() || loading}
                className="flex-1 btn-primary font-mono text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Fetching...</>
                ) : (
                  <><Terminal size={14} /> Analyse <ArrowRight size={13} /></>
                )}
              </button>
            </div>

            <p className="text-xs font-mono text-text3 text-center mt-4">
              Tip: Add a <span className="text-[var(--accent2)]">GITHUB_TOKEN</span> in .env.local for private repos
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
