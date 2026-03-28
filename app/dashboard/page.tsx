'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, Search, GitBranch, LogOut, Clock,
  ExternalLink, Trash2, Zap, Star, Github,
  ArrowLeft, LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import GlowOrb from '@/components/GlowOrb'
import toast from 'react-hot-toast'

// Use the same unified SSR-compatible client as all other pages
import { createClient } from '@/lib/supabase/client'
function getClient() { return createClient() }

interface Analysis {
  id: string; owner: string; repo_name: string; repo_url: string | null
  language: string | null; stars: number; analysed_at: string
}
interface Profile {
  full_name: string | null; email: string; total_logins: number
  created_at: string; last_seen: string
}

const LANG_COLORS: Record<string, string> = {
  JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572a5', Go:'#00add8',
  Rust:'#dea584', Java:'#b07219', 'C++':'#f34b7d', Ruby:'#701516',
  Swift:'#f05138', Kotlin:'#7f52ff', CSS:'#563d7c', HTML:'#e34c26',
}

export default function DashboardPage() {
  const [user, setUser]         = useState<any>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading]   = useState(true)
  const [url, setUrl]           = useState('')
  const [adding, setAdding]     = useState(false)
  const [inputError, setInputError] = useState('')
  const router = useRouter()

  const loadData = useCallback(async (userId: string) => {
    const sb = getClient()
    const [{ data: a }, { data: p }] = await Promise.all([
      sb.from('repo_analyses')
        .select('id,owner,repo_name,repo_url,language,stars,analysed_at')
        .eq('user_id', userId)
        .order('analysed_at', { ascending: false })
        .limit(5),
      sb.from('user_profiles')
        .select('full_name,email,total_logins,created_at,last_seen')
        .eq('id', userId)
        .single(),
    ])
    if (a) setAnalyses(a as Analysis[])
    if (p) setProfile(p as Profile)
  }, [])

  useEffect(() => {
    // Apply theme
    const saved = localStorage.getItem('gw-theme')
    if (saved) document.documentElement.setAttribute('data-theme', saved)

    const sb = getClient()

    // getUser() verifies session server-side — most reliable after OAuth redirect
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        await loadData(user.id)
        setLoading(false)
        // Update last_seen silently
        try {
          await (sb as any).from('user_profiles').upsert(
            { id: user.id, email: user.email ?? '', last_seen: new Date().toISOString() },
            { onConflict: 'id' }
          )
        } catch {}
      } else {
        // No session — redirect to login
        window.location.href = '/login'
      }
    })
  }, [loadData])

  // Real-time updates
  useEffect(() => {
    if (!user) return
    const sb = getClient()
    const ch = sb.channel(`dash_rt_${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'repo_analyses',
        filter: `user_id=eq.${user.id}`
      }, () => loadData(user.id))
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [user, loadData])

  const parseRepo = (input: string) => {
    try {
      const u = new URL(input.startsWith('http') ? input : 'https://' + input)
      const p = u.pathname.replace(/^\//, '').split('/')
      if (p.length >= 2) return { owner: p[0], name: p[1].replace(/\.git$/, '') }
    } catch {
      const p = input.replace(/^github\.com\//, '').split('/')
      if (p.length >= 2) return { owner: p[0], name: p[1].replace(/\.git$/, '') }
    }
    return null
  }

  const handleAnalyse = async () => {
    setInputError('')
    if (!url.trim()) return
    const parsed = parseRepo(url.trim())
    if (!parsed) { setInputError('Enter a valid GitHub URL — e.g. github.com/facebook/react'); return }
    setAdding(true)
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.name}`)
      if (!res.ok) throw new Error('Repository not found or private.')
      const repo = await res.json()
      const sb = getClient()
      if (user) {
        const repoUrl = `https://github.com/${parsed.owner}/${parsed.name}`
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: recent } = await sb.from('repo_analyses').select('id')
          .eq('user_id', user.id).eq('owner', parsed.owner).eq('repo_name', parsed.name)
          .gte('analysed_at', fiveMinAgo).limit(1)
        if (!recent || recent.length === 0) {
          await (sb as any).from('repo_analyses').insert({
            user_id: user.id, owner: parsed.owner, repo_name: parsed.name,
            repo_url: repoUrl, language: repo.language || null, stars: repo.stargazers_count || 0,
          })
          await loadData(user.id)
        }
      }
      setUrl('')
      router.push(`/repo/${parsed.owner}/${parsed.name}`)
    } catch (err: any) {
      setInputError(err.message)
      toast.error(err.message)
    } finally { setAdding(false) }
  }

  const handleDelete = async (id: string) => {
    await getClient().from('repo_analyses').delete().eq('id', id)
    setAnalyses(p => p.filter(a => a.id !== id))
    toast.success('Removed')
  }

  const handleSignOut = async () => {
    await getClient().auth.signOut()
    window.location.href = '/'
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'
  const lastRepo = analyses[0]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3"
      style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      <p className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Loading your dashboard...</p>
      <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
        Taking too long?{' '}
        <button onClick={() => window.location.reload()} className="underline" style={{ color: 'var(--accent2)' }}>
          Refresh
        </button>
        {' '}or{' '}
        <Link href="/" className="underline" style={{ color: 'var(--accent2)' }}>go home</Link>
      </p>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="bg-noise" />
      <GlowOrb className="top-0 right-0 w-96 h-96" color="#6366f1" blur={140} />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: 'var(--nav-bg,rgba(6,8,15,0.95))', borderColor: 'var(--border2)' }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2">
          <Link href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border glass text-xs font-medium flex-shrink-0 transition-all"
            style={{ color: 'var(--text2)', borderColor: 'var(--border2)' }}>
            <ArrowLeft size={13} /><span>Home</span>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0 ml-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <LayoutDashboard size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:inline" style={{ color: 'var(--text)' }}>Dashboard</span>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass border flex-shrink-0"
            style={{ borderColor: 'var(--border2)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
              {user?.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} className="w-5 h-5 object-cover" alt="" />
                : initial}
            </div>
            <span className="text-xs font-mono truncate max-w-[100px]" style={{ color: 'var(--accent2)' }}>
              {displayName}
            </span>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border glass flex-shrink-0"
            style={{ color: 'var(--text2)', borderColor: 'var(--border2)' }}
            onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}>
            <LogOut size={13} /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">

        {/* Welcome */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="mb-5 sm:mb-7">
          <h1 className="font-display font-black text-lg sm:text-2xl mb-0.5" style={{ color:'var(--text)' }}>
            Welcome back, {displayName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs" style={{ color:'var(--text3)' }}>
            {profile?.email || user?.email}
            {profile?.created_at && ` · Member since ${new Date(profile.created_at).toLocaleDateString()}`}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-7">
          {[
            { label:'Repos Analysed', value: analyses.length, icon:<GitBranch size={15}/>, color:'#6366f1' },
            { label:'Total Sessions',  value: profile?.total_logins ?? 1, icon:<Zap size={15}/>, color:'#c9a84c' },
            { label:'Last Analysis',   value: lastRepo ? new Date(lastRepo.analysed_at).toLocaleDateString() : '—', icon:<Clock size={15}/>, color:'#3b82f6' },
            { label:'Last Language',   value: lastRepo?.language || '—', icon:<Code2 size={15}/>, color:'#22c55e' },
          ].map(({ label, value, icon, color }) => (
            <motion.div key={label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              className="glass rounded-xl p-3 sm:p-4 border" style={{ borderColor:'var(--border2)' }}>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
                {icon}
                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color:'var(--text3)' }}>{label}</span>
              </div>
              <div className="font-bold text-sm sm:text-lg truncate" style={{ color:'var(--text)' }}>{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Last repo */}
        {lastRepo && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
            className="glass rounded-xl border p-3 sm:p-4 mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ borderColor:'var(--border2)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
              <Github size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] mb-0.5" style={{ color:'var(--text3)' }}>Last analysed</p>
              <p className="font-bold text-sm truncate" style={{ color:'var(--text)' }}>
                {lastRepo.owner}/{lastRepo.repo_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-0.5">
                {lastRepo.language && (
                  <span className="text-[10px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[lastRepo.language]||'#6366f1' }}/>
                    <span style={{ color:'var(--text2)' }}>{lastRepo.language}</span>
                  </span>
                )}
                <span className="text-[10px] flex items-center gap-1" style={{ color:'var(--text3)' }}>
                  <Star size={9}/> {(lastRepo.stars||0).toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={() => router.push(`/repo/${lastRepo.owner}/${lastRepo.repo_name}`)}
              className="btn-primary text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
              <Zap size={11}/> Re-analyse
            </button>
          </motion.div>
        )}

        {/* Analyse input */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
          className="glass rounded-xl border p-3 sm:p-4 mb-5 sm:mb-7" style={{ borderColor:'var(--border2)' }}>
          <h2 className="font-semibold text-sm mb-2.5" style={{ color:'var(--text)' }}>Analyse a Repository</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 border-gradient p-[1px] rounded-xl">
              <div className="rounded-xl flex items-center gap-2 px-3" style={{ background:'var(--surface)' }}>
                <Search size={12} style={{ color:'var(--text3)', flexShrink:0 }}/>
                <input value={url} onChange={e => { setUrl(e.target.value); setInputError('') }}
                  onKeyDown={e => e.key==='Enter' && handleAnalyse()}
                  placeholder="github.com/owner/repository"
                  className="flex-1 py-2.5 text-xs bg-transparent focus:outline-none" style={{ color:'var(--text)' }}/>
              </div>
            </div>
            <button onClick={handleAnalyse} disabled={!url.trim()||adding}
              className="btn-primary text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap flex-shrink-0">
              {adding ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Fetching...</> : <><Zap size={11}/>Analyse</>}
            </button>
          </div>
          {inputError && <p className="text-red-400 text-[11px] mt-1.5 font-mono">{inputError}</p>}
          <p className="text-[10px] mt-1.5" style={{ color:'var(--text3)' }}>✓ Unlimited · Last 5 analyses shown · Updates in real time</p>
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}>
          <h2 className="font-semibold text-sm mb-3" style={{ color:'var(--text)' }}>
            Recent Analyses {analyses.length > 0 && `(${analyses.length} shown)`}
          </h2>
          {analyses.length === 0 ? (
            <div className="glass rounded-xl border p-8 sm:p-12 text-center" style={{ borderColor:'var(--border2)' }}>
              <GitBranch size={28} className="mx-auto mb-2 opacity-30" style={{ color:'var(--text3)' }}/>
              <p className="text-sm mb-1" style={{ color:'var(--text2)' }}>No analyses yet</p>
              <p className="text-xs" style={{ color:'var(--text3)' }}>Paste a GitHub URL above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {analyses.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i*0.05 }}
                  className="glass rounded-xl border p-3 sm:p-4 flex flex-col gap-2.5 group hover:border-indigo-500/30 transition-all"
                  style={{ borderColor:'var(--border2)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate" style={{ color:'var(--text)' }}>
                        {a.owner}/{a.repo_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {a.language && (
                          <span className="text-[10px] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[a.language]||'#6366f1' }}/>
                            <span style={{ color:'var(--text2)' }}>{a.language}</span>
                          </span>
                        )}
                        <span className="text-[10px] flex items-center gap-1" style={{ color:'var(--text3)' }}>
                          <Star size={9}/> {(a.stars||0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(a.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0"
                      style={{ color:'var(--text3)' }}
                      onMouseOver={e => (e.currentTarget.style.color='#f87171')}
                      onMouseOut={e => (e.currentTarget.style.color='var(--text3)')}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor:'var(--border2)' }}>
                    <span className="text-[10px]" style={{ color:'var(--text3)' }}>
                      {new Date(a.analysed_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {a.repo_url && (
                        <a href={a.repo_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg glass border" style={{ color:'var(--text3)', borderColor:'var(--border2)' }}
                          onMouseOver={e => (e.currentTarget.style.color='var(--accent2)')}
                          onMouseOut={e => (e.currentTarget.style.color='var(--text3)')}>
                          <ExternalLink size={10}/>
                        </a>
                      )}
                      <button onClick={() => router.push(`/repo/${a.owner}/${a.repo_name}`)}
                        className="btn-primary text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <Zap size={9}/> Open
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
