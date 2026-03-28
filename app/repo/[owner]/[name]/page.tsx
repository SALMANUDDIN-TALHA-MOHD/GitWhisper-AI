'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code2, FileCode, GitBranch, BarChart3, ArrowLeft, BookOpen, Activity } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import GlowOrb from '@/components/GlowOrb'
import FileExplorer from '@/components/FileExplorer'
import AiExplainer from '@/components/AiExplainer'
import CodeMetrics from '@/components/CodeMetrics'
import ReadmeViewer from '@/components/ReadmeViewer'
import { fetchRepoData } from '@/lib/github'
import { analyzeRepo } from '@/lib/analyze'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ActivityDashboard3D = dynamic(() => import('@/components/ActivityDashboard3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] gap-3 text-[var(--text2)]">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"/>
      <span className="text-sm">Loading activity data...</span>
    </div>
  )
})

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: BookOpen  },
  { id: 'files',     label: 'Files',       icon: FileCode  },
  { id: 'activity',  label: '3D Activity', icon: Activity  },
  { id: 'metrics',   label: 'Metrics',     icon: BarChart3 },
  { id: 'readme',    label: 'README',      icon: GitBranch },
]

const LANG_COLORS: Record<string,string> = {
  JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572a5',
  Go:'#00add8', Rust:'#dea584', Java:'#b07219', 'C++':'#f34b7d', Ruby:'#701516',
}

export default function RepoPage() {
  const params  = useParams()
  const owner   = params.owner as string
  const name    = params.name  as string

  const [tab,       setTab]       = useState('overview')
  const [repoData,  setRepoData]  = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [summary,   setSummary]   = useState('')
  const [analysing, setAnalysing] = useState(false)

  /* ── 1. Fetch repo data from GitHub ── */
  useEffect(() => {
    if (!owner || !name) return
    fetchRepoData(owner, name)
      .then(async data => {
        setRepoData(data)
        setLoading(false)
        // Save to Supabase history if user is logged in
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Check if this exact analysis already saved in last 5 mins to avoid duplicates
            const fiveMinAgo = new Date(Date.now() - 5*60*1000).toISOString()
            const { data: existing } = await supabase
              .from('repo_analyses')
              .select('id')
              .eq('user_id', user.id)
              .eq('owner', owner)
              .eq('repo_name', name)
              .gte('analysed_at', fiveMinAgo)
              .limit(1)
            if (!existing || existing.length === 0) {
              await (supabase as any).from('repo_analyses').insert({
                user_id: user.id,
                owner,
                repo_name: name,
                repo_url: `https://github.com/${owner}/${name}`,
                language: data.language || null,
                stars: data.stargazers_count || 0,
              })
            }
          }
        } catch {}
      })
      .catch(err => { toast.error(err.message || 'Failed to load repo'); setLoading(false) })
  }, [owner, name])

  /* ── 2. Run analysis once repo data is ready ── */
  useEffect(() => {
    if (!repoData) return

    // Check keys up front — give clear message
    const groqKey   = process.env.NEXT_PUBLIC_GROQ_API_KEY   || ''
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    const hasGroq   = groqKey.length > 10   && groqKey   !== 'your-groq-api-key-here'
    const hasGemini = geminiKey.length > 10 && geminiKey !== 'your-gemini-api-key-here'

    if (!hasGroq && !hasGemini) {
      setSummary(
        '## Add an API Key to Enable Analysis\n\n' +
        '**Groq** (recommended — free, fast, no credit card):\n' +
        '1. Go to **https://console.groq.com**\n' +
        '2. Sign up free → API Keys → Create Key\n' +
        '3. Add to `.env.local`: `NEXT_PUBLIC_GROQ_API_KEY=gsk_...`\n' +
        '4. Restart: `npm run dev`\n\n' +
        'You can still explore files using the **Files** tab above.'
      )
      return
    }

    setAnalysing(true)

    analyzeRepo({
      owner,
      name,
      description : repoData.description  || '',
      language    : repoData.language      || 'Unknown',
      stars       : repoData.stargazers_count || 0,
      files       : (repoData.tree || []).map((f: any) => f.path),
    })
      .then(text => setSummary(text))
      .catch(err => {
        if (err.message === 'NO_KEY') {
          setSummary('## API Key Not Found\n\nAdd `NEXT_PUBLIC_GROQ_API_KEY` to `.env.local` and restart the server with `npm run dev`.')
        } else {
          setSummary(`## Analysis Error\n\n**${err.message}**\n\nCheck your API key in \`.env.local\` and restart the server.`)
        }
      })
      .finally(() => setAnalysing(false))
  }, [repoData])

  /* ── Loading screen ── */
  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"/>
        <p className="text-[var(--text2)] text-sm">Fetching {owner}/{name}...</p>
      </div>
    </div>
  )

  const langColor  = LANG_COLORS[repoData?.language] || '#6366f1'
  const totalFiles = repoData?.tree?.filter((f:any) => f.type === 'blob').length || 0
  const totalDirs  = repoData?.tree?.filter((f:any) => f.type === 'tree').length || 0

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-x-hidden">
      <div className="bg-noise"/>
      <GlowOrb className="top-20 right-20 w-80 h-80" color="#6366f1" blur={120}/>

      {/* ── Header ── */}
      <header className="glass border-b border-white/5 sticky top-0 z-40" style={{height:60}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
              <Code2 size={13} className="text-white"/>
            </div>
            <span className="font-display font-bold text-sm hidden sm:block">GitWhisper AI</span>
          </Link>

          <div className="w-px h-5 bg-white/10"/>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-[var(--text3)] hover:text-white text-sm transition-colors">
            <ArrowLeft size={14}/><span className="hidden sm:block">Dashboard</span>
          </Link>

          <div className="w-px h-5 bg-white/10"/>
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch size={14} className="text-indigo-400 flex-shrink-0"/>
            <span className="font-mono text-sm truncate">
              <span className="text-[var(--text2)]">{owner}/</span>
              <span className="text-white font-semibold">{name}</span>
            </span>
          </div>

          {repoData && (
            <div className="ml-auto flex items-center gap-2 text-xs font-mono flex-shrink-0">
              <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--surface2)] border border-white/5">
                <span className="w-2 h-2 rounded-full" style={{background:langColor}}/>
                {repoData.language || 'Multi'}
              </span>
              <span className="hidden md:block text-[var(--text3)]">
                ⭐ {repoData.stargazers_count?.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs">
                ✓ Loaded
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="glass border-b border-white/5 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto" style={{scrollbarWidth:'none'}}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id
                    ? 'text-[var(--accent2)] border-[var(--accent)]'
                    : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'
                }`}>
                <t.icon size={14}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Quick stats */}
        {repoData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label:'Total Files',  val: totalFiles.toLocaleString(),                       color:'#6366f1' },
              { label:'Directories',  val: totalDirs.toLocaleString(),                        color:'#c9a84c' },
              { label:'Stars',        val: repoData.stargazers_count?.toLocaleString()||'0',  color:'#3b82f6' },
              { label:'Open Issues',  val: repoData.open_issues_count?.toLocaleString()||'0', color:'#8b5cf6' },
            ].map(({ label, val, color }) => (
              <motion.div key={label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                className="glass rounded-xl p-4 border border-white/5">
                <div className="text-xl font-black font-mono" style={{color}}>{val}</div>
                <div className="text-xs text-[var(--text3)] mt-0.5">{label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab panels */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AiExplainer summary={summary} analysing={analysing} repoData={repoData}/>
            </div>
            <div>
              {repoData && (
                <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}}
                  className="glass rounded-xl border border-white/5 overflow-hidden">
                  <div className="bg-[var(--surface2)] px-4 py-3 border-b border-white/5">
                    <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Repository Info
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      ['Owner',    owner],
                      ['Repo',     name],
                      ['Language', repoData.language || '—'],
                      ['Stars',    repoData.stargazers_count?.toLocaleString()],
                      ['Forks',    repoData.forks_count?.toLocaleString()],
                      ['Branch',   repoData.default_branch],
                      ['License',  repoData.license?.spdx_id || '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between text-xs">
                        <span className="text-[var(--text3)] font-mono">{k}</span>
                        <span className="text-[var(--accent2)] font-mono font-medium">{v as string}</span>
                      </div>
                    ))}
                    {repoData.description && (
                      <p className="text-xs text-[var(--text2)] leading-relaxed pt-2 border-t border-white/5">
                        {repoData.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {tab === 'files'    && <FileExplorer owner={owner} name={name} repoData={repoData}/>}
        {tab === 'readme'   && <ReadmeViewer owner={owner} name={name}/>}
        {tab === 'metrics'  && <CodeMetrics  repoData={repoData} owner={owner} name={name}/>}

        {tab === 'activity' && (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden"
            style={{minHeight: 400}}>
            <div className="bg-[var(--surface2)] px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <Activity size={14} className="text-indigo-400"/>
              <span className="text-sm font-medium text-[var(--text2)]">
                Repository Activity — commits · PRs · issues · contributors
              </span>
            </div>
            <ActivityDashboard3D owner={owner} name={name}/>
          </div>
        )}
      </main>
    </div>
  )
}
