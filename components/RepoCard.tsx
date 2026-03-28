'use client'
import { motion } from 'framer-motion'
import { GitBranch, Star, FileCode, ArrowRight, Cpu, Clock } from 'lucide-react'
import Link from 'next/link'

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572a5',
  Rust: '#dea584', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', Swift: '#fa7343', Kotlin: '#a97bff',
}

interface Props { repo: any; index: number }

export default function RepoCard({ repo, index }: Props) {
  const langColor = LANG_COLORS[repo.language] || '#22c55e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className="group glass rounded-xl border border-white/5 hover:border-indigo-500/40 transition-all overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${langColor}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={13} className="text-text3" />
              <span className="text-xs font-mono text-text3">{repo.owner}</span>
            </div>
            <h3 className="font-mono font-bold text-text group-hover:text-[var(--accent2)] transition-colors">
              {repo.name}
            </h3>
          </div>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
            repo.analysed
              ? 'text-[var(--accent2)] border-accent/30 bg-accent/5'
              : 'text-text3 border-green-900/20 bg-surface'
          }`}>
            {repo.analysed ? '✓ Analysed' : 'Pending'}
          </span>
        </div>

        {/* Summary */}
        <p className="text-xs text-text2 leading-relaxed mb-4 line-clamp-2">
          {repo.summary || 'AI analysis pending...'}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 text-xs font-mono text-text3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: langColor }} />
            {repo.language || 'Mixed'}
          </span>
          {repo.stars > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} /> {(repo.stars / 1000).toFixed(0)}k
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileCode size={11} /> {repo.files?.toLocaleString() || '—'} files
          </span>
        </div>

        {/* Action */}
        <Link
          href={`/repo/${repo.owner}/${repo.name}`}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-[var(--accent2)] text-xs font-mono font-semibold border border-indigo-500/20 hover:border-indigo-500/50 transition-all group"
        >
          <Cpu size={13} />
          {repo.analysed ? 'View Analysis' : 'Start Analysis'}
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  )
}
