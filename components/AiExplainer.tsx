'use client'
import { motion } from 'framer-motion'
import { FileSearch, Loader, FileCode } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props { summary: string; analysing: boolean; repoData: any }

export default function AiExplainer({ summary, analysing }: Props) {
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
      className="glass rounded-2xl border border-white/5 overflow-hidden h-full">
      <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5 flex items-center gap-2">
        <FileSearch size={14} className="text-[var(--accent2)]"/>
        <span className="text-sm font-medium text-[var(--text2)]">Code Analysis</span>
        {analysing && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--accent2)]">
            <Loader size={11} className="animate-spin"/> Analysing...
          </span>
        )}
      </div>
      <div className="p-6">
        {analysing && !summary ? (
          <div className="space-y-3">
            {['Reading file structure...','Mapping dependencies...','Building explanation...'].map((t,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.4}}
                className="flex items-center gap-2.5 text-sm text-[var(--text2)]">
                <Loader size={13} className="animate-spin text-indigo-400"/> {t}
              </motion.div>
            ))}
          </div>
        ) : summary ? (
          <div className="ai-prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text3)]">
            <FileCode size={36} className="opacity-30"/>
            <p className="text-sm">Waiting for repository data...</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
