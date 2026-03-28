'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, Cpu, Loader, Terminal, X } from 'lucide-react'
import { fetchFileContent, buildFileTree } from '@/lib/github'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props { owner: string; name: string; repoData: any }

function FileNode({ node, depth, onSelect, selected }: any) {
  const [open, setOpen] = useState(depth < 1)
  const isDir = node.type === 'tree'
  const isSelected = selected === node.path
  return (
    <div>
      <div onClick={() => isDir ? setOpen(o => !o) : onSelect(node)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-xs font-mono transition-all group ${
          isSelected
            ? 'bg-indigo-500/20 text-[var(--accent2)] border border-indigo-500/25'
            : 'hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        {isDir ? (
          <>
            {open ? <ChevronDown size={9} className="flex-shrink-0 text-[var(--text3)]"/>
                  : <ChevronRight size={9} className="flex-shrink-0 text-[var(--text3)]"/>}
            {open ? <FolderOpen size={11} className="text-[var(--accent2)] flex-shrink-0"/>
                  : <Folder size={11} className="text-amber-400/70 flex-shrink-0"/>}
          </>
        ) : (
          <><span className="w-2 flex-shrink-0"/><FileCode size={11} className="text-blue-400/70 flex-shrink-0"/></>
        )}
        <span className="truncate text-[11px]">{node.name}</span>
      </div>
      {isDir && open && node.children?.map((child: any) => (
        <FileNode key={child.path} node={child} depth={depth+1} onSelect={onSelect} selected={selected}/>
      ))}
    </div>
  )
}

export default function FileExplorer({ owner, name, repoData }: Props) {
  const [tree, setTree]           = useState<any[]>([])
  const [selected, setSelected]   = useState<string>('')
  const [content, setContent]     = useState('')
  const [aiExplain, setAiExplain] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)
  const [explaining, setExplaining]   = useState(false)
  const [showTree, setShowTree]   = useState(true)
  const [mobileView, setMobileView] = useState<'tree'|'code'|'ai'>('tree')

  useEffect(() => { if (repoData?.tree) setTree(buildFileTree(repoData.tree)) }, [repoData])

  const handleSelect = async (node: any) => {
    if (node.type === 'tree') return
    setSelected(node.path); setContent(''); setAiExplain('')
    setLoadingFile(true); setMobileView('code')
    try {
      const raw = await fetchFileContent(owner, name, node.path)
      setContent(raw); setLoadingFile(false)
      setExplaining(true)
      try {
        const { analyzeFile } = await import('@/lib/analyze')
        const text = await analyzeFile({ owner, name, path: node.path, content: raw })
        setAiExplain(text)
      } catch (e: any) {
        setAiExplain(e.message === 'NO_KEY'
          ? 'Add `NEXT_PUBLIC_GROQ_API_KEY` to `.env.local` and restart.'
          : 'Unable to explain: ' + e.message)
      } finally { setExplaining(false) }
    } catch (err: any) {
      setContent(''); setLoadingFile(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Mobile tab bar */}
      <div className="flex sm:hidden rounded-xl bg-[var(--surface2)] p-1 gap-1">
        {(['tree','code','ai'] as const).map(v => (
          <button key={v} onClick={()=>setMobileView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mobileView===v?'bg-[var(--surface3)] text-[var(--text)]':'text-[var(--text3)]'
            }`}>
            {v==='tree'?'📁 Files':v==='code'?'</> Code':'✨ Explain'}
          </button>
        ))}
      </div>

      {/* Desktop — 3 columns / Mobile — single panel */}
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3" style={{minHeight:'60vh'}}>

        {/* File Tree */}
        <div className={`sm:col-span-3 glass rounded-xl border border-white/5 overflow-hidden flex flex-col ${
          mobileView !== 'tree' ? 'hidden sm:flex' : 'flex'
        }`} style={{maxHeight:'70vh'}}>
          <div className="bg-[var(--surface2)] px-3 py-2 border-b border-white/5 flex-shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/50"/>
            <span className="w-2 h-2 rounded-full bg-yellow-500/50"/>
            <span className="w-2 h-2 rounded-full bg-green-500/50"/>
            <span className="ml-2 text-[10px] font-mono text-[var(--text3)]">explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {tree.length === 0
              ? <p className="text-[10px] font-mono text-[var(--text3)] p-2">Loading...</p>
              : tree.map(n => <FileNode key={n.path} node={n} depth={0} onSelect={handleSelect} selected={selected}/>)
            }
          </div>
        </div>

        {/* Code view */}
        <div className={`sm:col-span-4 glass rounded-xl border border-white/5 overflow-hidden flex flex-col ${
          mobileView !== 'code' ? 'hidden sm:flex' : 'flex'
        }`} style={{maxHeight:'70vh'}}>
          <div className="bg-[var(--surface2)] px-3 py-2 border-b border-white/5 flex-shrink-0 flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-500/50 flex-shrink-0"/>
            <span className="w-2 h-2 rounded-full bg-yellow-500/50 flex-shrink-0"/>
            <span className="w-2 h-2 rounded-full bg-green-500/50 flex-shrink-0"/>
            <span className="ml-1 text-[10px] font-mono text-[var(--text3)] truncate">
              {selected || 'select a file'}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {loadingFile ? (
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent2)]">
                <Loader size={11} className="animate-spin"/>Loading file...
              </div>
            ) : content ? (
              <pre className="text-[11px] font-mono text-[var(--accent3)] whitespace-pre-wrap leading-relaxed break-all">{content}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text3)]">
                <FileCode size={24} className="opacity-30"/>
                <p className="text-xs font-mono text-center">Click a file in the tree to view its code</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Explanation */}
        <div className={`sm:col-span-5 glass rounded-xl border border-white/5 overflow-hidden flex flex-col ${
          mobileView !== 'ai' ? 'hidden sm:flex' : 'flex'
        }`} style={{maxHeight:'70vh'}}>
          <div className="bg-[var(--surface2)] px-3 py-2 border-b border-white/5 flex-shrink-0 flex items-center gap-1.5">
            <Cpu size={11} className="text-[var(--accent2)] flex-shrink-0"/>
            <span className="text-[10px] font-mono text-[var(--text2)]">Code Explanation</span>
            {explaining && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[var(--accent2)]">
                <Loader size={9} className="animate-spin"/>Analysing...
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-3 sm:p-4">
            {aiExplain ? (
              <div className="ai-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiExplain}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text3)]">
                <Terminal size={22} className="opacity-30"/>
                <p className="text-xs font-mono text-center">
                  {selected ? 'AI explanation will appear here' : 'Select a file to get an AI explanation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
