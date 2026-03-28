'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Code2, GitBranch, Layers, Zap, BarChart3, Search, ArrowRight,
  ChevronDown, Sparkles, Globe, FileCode, Network, Lock, Unlock,
  Mail, MessageSquare, ExternalLink, Github, Star, LogOut, X, User
} from 'lucide-react'
import GlowOrb from '@/components/GlowOrb'
import CustomCursor from '@/components/CustomCursor'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────── constants ─────────────────────── */
const FEATURES = [
  { icon: Code2,     title: 'Code Explainer',      desc: 'Every file, function and class explained in plain English instantly.',         color: '#6366f1' },
  { icon: GitBranch, title: 'Architecture Diagram', desc: 'Interactive 3D graph showing exactly how your modules connect.',                color: '#c9a84c' },
  { icon: Zap,       title: 'Instant Analysis',     desc: 'Paste any public GitHub URL and get a full breakdown in under 30 seconds.',    color: '#8b5cf6' },
  { icon: BarChart3, title: 'Analytics Dashboard',  desc: 'Complexity scores, file sizes, language breakdowns and quality metrics.',     color: '#3b82f6' },
  { icon: Network,   title: 'Dependency Map',       desc: 'Trace exactly what imports what — follow data flow through any codebase.',    color: '#06b6d4' },
  { icon: Globe,     title: '3D Activity View',     desc: 'Commits, PRs, issues and contributors in an interactive 3D chart.',           color: '#c9a84c' },
]

const STEPS = [
  { icon: FileCode, title: 'Paste a GitHub URL',  desc: 'Drop any public repo link. No sign-in needed for your first 3 analyses.',      color: '#6366f1' },
  { icon: Zap,      title: 'Analysis Runs',        desc: 'The engine scans every file, maps dependencies, and builds a knowledge model.', color: '#c9a84c' },
  { icon: Layers,   title: 'Explore Everything',   desc: 'File explanations, 3D diagrams, activity charts, and metrics — one place.',    color: '#3b82f6' },
  { icon: Lock,     title: 'Sign up for More',     desc: 'After 3 free repos, sign up free with your email to keep going unlimited.',    color: '#8b5cf6' },
]

const DEMO_STEPS = [
  { text: '$ paste github.com/facebook/react',   color: '#a5b4fc', delay: 0 },
  { text: '> Fetching repository tree...',        color: '#94a3b8', delay: 0.8 },
  { text: '> Scanning 6,835 files...      [OK]',  color: '#22c55e', delay: 1.6 },
  { text: '> Mapping dependencies...      [OK]',  color: '#22c55e', delay: 2.4 },
  { text: '> Building explanation...      [OK]',  color: '#22c55e', delay: 3.2 },
  { text: '> 3D diagram ready             [OK]',  color: '#22c55e', delay: 4.0 },
  { text: '✓ Analysis complete in 8.2s',          color: '#6366f1', delay: 4.8 },
  { text: '  → 12 modules identified',            color: '#94a3b8', delay: 5.2 },
  { text: '  → Dashboard is ready',               color: '#94a3b8', delay: 5.6 },
]

/* ─────────────────────── sub-components ─────────────────── */
function DemoTerminal() {
  const [visible, setVisible] = useState<number[]>([])
  const ref  = useRef(null)
  const inView = useInView(ref, { once: false })

  useEffect(() => {
    if (!inView) { setVisible([]); return }
    const timers: NodeJS.Timeout[] = []
    DEMO_STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => setVisible(p => [...p, i]), s.delay * 1000))
    })
    const loop = setInterval(() => {
      setVisible([])
      DEMO_STEPS.forEach((s, i) => {
        timers.push(setTimeout(() => setVisible(p => [...p, i]), s.delay * 1000))
      })
    }, 8500)
    return () => { timers.forEach(clearTimeout); clearInterval(loop) }
  }, [inView])

  return (
    <div ref={ref} className="border-gradient p-[1px] rounded-2xl w-full">
      <div className="bg-[var(--surface)] rounded-2xl overflow-hidden">
        {/* Browser bar */}
        <div className="bg-[var(--surface2)] px-3 sm:px-4 py-2 flex items-center gap-2 border-b border-white/5">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500/60 flex-shrink-0"/>
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500/60 flex-shrink-0"/>
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500/60 flex-shrink-0"/>
          <div className="ml-2 flex-1 bg-[var(--surface3)] rounded px-2 py-1 text-[10px] sm:text-xs font-mono text-[var(--text3)] truncate">
            gitwhisper.ai/repo/facebook/react
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono text-[var(--accent2)] flex-shrink-0">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[var(--accent2)] animate-pulse"/>
            <span className="hidden sm:inline">LIVE</span>
          </div>
        </div>
        {/* Terminal body */}
        <div className="p-3 sm:p-5 font-mono text-[11px] sm:text-xs space-y-1 sm:space-y-1.5 min-h-[180px] sm:min-h-[220px]">
          {DEMO_STEPS.map((s, i) => (
            visible.includes(i) ? (
              <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ duration:0.2 }}
                className="flex items-center gap-2" style={{ color: s.color }}>
                {i === 6 && <span className="text-indigo-400">▶</span>}
                <span className="break-all">{s.text}</span>
                {i === visible[visible.length-1] && visible.length < DEMO_STEPS.length && (
                  <span className="inline-block w-1 h-3 sm:w-1.5 sm:h-3.5 bg-indigo-400 animate-pulse ml-0.5 flex-shrink-0"/>
                )}
              </motion.div>
            ) : null
          ))}
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/5">
          {[['Files','6,835','#6366f1'],['Modules','47','#c9a84c'],['Health','A+','#22c55e']].map(([l,v,c])=>(
            <div key={l} className="bg-[var(--surface2)] px-2 sm:px-4 py-2 sm:py-3 text-center">
              <div className="font-mono font-bold text-xs sm:text-sm" style={{color:c}}>{v}</div>
              <div className="text-[10px] sm:text-xs text-[var(--text3)] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, index }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:24 }} animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.5, ease:[0.23,1,0.32,1] }}
      className="relative glass rounded-2xl p-5 sm:p-6 border border-white/5 hover:border-white/12 transition-all group cursor-default overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background:`radial-gradient(circle at 30% 30%, ${color}12, transparent 65%)` }}/>
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
        style={{ background:`${color}15`, border:`1px solid ${color}30` }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <h3 className="font-semibold text-white mb-1.5 text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-[var(--text2)] leading-relaxed">{desc}</p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background:`linear-gradient(90deg, transparent, ${color}, transparent)` }}/>
    </motion.div>
  )
}

function ProcessStep({ step, index, total }: any) {
  const ref  = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, x:-28 }} animate={inView ? { opacity:1, x:0 } : { opacity:0, x:-28 }}
      transition={{ duration:0.5, ease:[0.23,1,0.32,1] }}
      className="flex items-start gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div animate={inView ? { scale:[0.8,1.1,1] } : {}} transition={{ duration:0.35, delay:0.1 }}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold font-mono text-xs sm:text-sm"
          style={{ background:`${step.color}18`, border:`2px solid ${step.color}50`, color:step.color,
            boxShadow: inView ? `0 0 14px ${step.color}30` : 'none' }}>
          {String(index+1).padStart(2,'0')}
        </motion.div>
        {index < total-1 && (
          <motion.div initial={{ scaleY:0 }} animate={inView ? { scaleY:1 } : { scaleY:0 }}
            transition={{ duration:0.35, delay:0.2 }}
            className="w-px h-10 sm:h-14 origin-top mt-1"
            style={{ background:`linear-gradient(to bottom, ${step.color}50, transparent)` }}/>
        )}
      </div>
      <div className="pt-1 pb-6 sm:pb-8">
        <div className="flex items-center gap-2 mb-1">
          <step.icon size={13} style={{ color:step.color }}/>
          <h3 className="font-semibold text-white text-sm sm:text-base">{step.title}</h3>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text2)] leading-relaxed max-w-[260px]">{step.desc}</p>
      </div>
    </motion.div>
  )
}

function ContactForm() {
  const [form, setForm]     = useState<Record<string,string>>({ name:'', email:'', subject:'', message:'' })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('loading')
    try {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const sb = createClient()
        const { error: dbErr } = await (sb as any).from('contact_submissions').insert({
          name: form.name,
          email: form.email,
          subject: form.subject || null,
          message: form.message,
        })
        if (dbErr) console.error('Supabase contact insert error:', dbErr.message)
      } catch (dbEx) { console.error('Contact DB error:', dbEx) }
      const ep = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || ''
      if (ep) {
        const r = await fetch(ep, { method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify(form) })
        if (!r.ok) throw new Error('send failed')
      }
      setStatus('success'); setForm({ name:'',email:'',subject:'',message:'' })
      setTimeout(()=>setStatus('idle'), 5000)
    } catch { setStatus('error'); setTimeout(()=>setStatus('idle'),4000) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {[{key:'name',label:'Your Name',type:'text',ph:'John Doe'},{key:'email',label:'Email',type:'email',ph:'you@example.com'}].map(({key,label,type,ph})=>(
          <div key={key}>
            <label className="block text-[10px] sm:text-xs text-[var(--text3)] mb-1.5 uppercase tracking-wider">{label}</label>
            <input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
              placeholder={ph} required
              className="w-full bg-[var(--surface2)] border border-white/8 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] focus:outline-none focus:border-indigo-500/50 transition-colors"/>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-[10px] sm:text-xs text-[var(--text3)] mb-1.5 uppercase tracking-wider">Subject</label>
        <input type="text" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} placeholder="What's this about?"
          className="w-full bg-[var(--surface2)] border border-white/8 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] focus:outline-none focus:border-indigo-500/50 transition-colors"/>
      </div>
      <div>
        <label className="block text-[10px] sm:text-xs text-[var(--text3)] mb-1.5 uppercase tracking-wider">Message</label>
        <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}
          placeholder="Tell me about your project..." rows={4} required
          className="w-full bg-[var(--surface2)] border border-white/8 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"/>
      </div>
      <button type="submit" disabled={status==='loading'}
        className="w-full btn-primary py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
        {status==='loading' ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending...</>
         : status==='success' ? <>✓ Message Sent!</>
         : <><ArrowRight size={15}/>Send Message</>}
      </button>
      {status==='success' && <p className="text-green-400 text-xs text-center">Thanks! I'll get back to you soon.</p>}
      {status==='error'   && <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}

function LimitModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
      <motion.div initial={{ opacity:0, scale:0.92, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92 }} transition={{ duration:0.22, ease:[0.23,1,0.32,1] }}
        className="relative z-10 w-full max-w-sm glass rounded-2xl border border-white/10 p-6 sm:p-7"
        onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text3)] hover:text-white transition-colors p-1">
          <X size={16}/>
        </button>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
          <Lock size={22} className="text-white"/>
        </div>
        <h2 className="font-display font-black text-xl text-white text-center mb-2">Free limit reached</h2>
        <p className="text-[var(--text2)] text-sm text-center mb-6 leading-relaxed">
          You've used your 3 free analyses. Create a free account to unlock unlimited access forever.
        </p>
        <div className="space-y-2.5">
          <button onClick={()=>router.push('/login?mode=signup')}
            className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm">
            Create Free Account
          </button>
          <button onClick={()=>router.push('/login')}
            className="w-full btn-outline py-2.5 rounded-xl text-sm font-medium">
            Already have an account? Sign In
          </button>
        </div>
        <p className="text-[10px] text-[var(--text3)] text-center mt-4">No credit card required · Free forever</p>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────── main page ─────────────────────── */
export default function LandingPage() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('gw-theme', next)
  }

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('gw-theme') as 'dark'|'light' | null
    if (saved) { setTheme(saved); document.documentElement.setAttribute('data-theme', saved) }
  }, [])

  const [url, setUrl]               = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [freeUsed, setFreeUsed]     = useState(0)
  const [user, setUser]             = useState<any>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Device fingerprint for free limit — persistent per device
    let deviceId = localStorage.getItem('gw_device_id')
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('gw_device_id', deviceId)
    }
    // Use device-specific key so signing out doesn't reset count
    const storageKey = 'gw_free_' + deviceId
    const n = parseInt(localStorage.getItem(storageKey) || '0')
    setFreeUsed(n)
    const sb = createClient()
    sb.auth.getUser().then(({ data:{ user } }) => { setUser(user||null); setUserLoaded(true) })
    const { data:{ subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user||null); setUserLoaded(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    setTimeout(() => window.addEventListener('click', handler), 100)
    return () => window.removeEventListener('click', handler)
  }, [menuOpen])

  const parseRepo = (input: string) => {
    try {
      const u = new URL(input.startsWith('http') ? input : 'https://' + input)
      const p = u.pathname.replace(/^\//, '').split('/')
      if (p.length >= 2) return { owner:p[0], name:p[1].replace(/\.git$/,'') }
    } catch {
      const p = input.replace(/^github\.com\//,'').split('/')
      if (p.length >= 2) return { owner:p[0], name:p[1].replace(/\.git$/,'') }
    }
    return null
  }

  const handleAnalyse = async () => {
    setError('')
    const parsed = parseRepo(url.trim())
    if (!parsed) { setError('Enter a valid GitHub URL — e.g. github.com/facebook/react'); return }
    if (!user) {
      const deviceId = localStorage.getItem('gw_device_id') || 'default'
      const storageKey = 'gw_free_' + deviceId
      const used = parseInt(localStorage.getItem(storageKey) || '0')
      if (used >= 3) { setShowLimitModal(true); return }
    }
    setLoading(true)
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.name}`)
      if (!res.ok) throw new Error('Repository not found or is private.')
      if (!user) {
        const deviceId = localStorage.getItem('gw_device_id') || 'default'
        const storageKey = 'gw_free_' + deviceId
        const used = parseInt(localStorage.getItem(storageKey) || '0')
        const nu = used + 1
        localStorage.setItem(storageKey, String(nu))
        setFreeUsed(nu)
      }
      router.push(`/repo/${parsed.owner}/${parsed.name}`)
    } catch (err: any) { setError(err.message||'Could not reach that repository.'); setLoading(false) }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })
    setMenuOpen(false)
  }

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    setUser(null)
    // Do NOT reset free count — it's device-based, not account-based
  }

  const freeLeft   = Math.max(0, 3 - freeUsed)
  const isLoggedIn = !!user

  const NAV_LINKS = [
    { label:'Features',     id:'features' },
    { label:'How it Works', id:'how-it-works' },
    { label:'Contact',      id:'contact' },
  ]

  return (
    <div className="relative overflow-x-hidden" style={{background:"var(--bg)",color:"var(--text)"}}>
      <AnimatePresence>{showLimitModal && <LimitModal onClose={()=>setShowLimitModal(false)}/>}</AnimatePresence>
      <CustomCursor/>
      <div className="bg-noise"/>

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[200] backdrop-blur-xl border-b" style={{height:60,background:"var(--nav-bg,rgba(6,8,15,0.95))",borderColor:"var(--border2)"}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={()=>scrollTo('hero')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
              <Code2 size={14} className="text-white"/>
            </div>
            <span className="font-display font-bold text-sm sm:text-base">
              GitWhisper<span className="gradient-indigo"> AI</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {NAV_LINKS.map(item=>(
              <button key={item.id} onClick={()=>scrollTo(item.id)}
                className="px-3 py-2 text-sm text-[var(--text2)] hover:text-[var(--text)] rounded-lg hover:bg-white/5 transition-all">
                {item.label}
              </button>
            ))}
            <button onClick={toggleTheme} title="Toggle theme"
              className="px-2.5 py-1.5 rounded-lg glass border border-[var(--border2)] text-[var(--text3)] hover:text-[var(--text)] transition-all text-sm ml-1">
              {theme==='dark'?'☀️':'🌙'}
            </button>
          </div>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* User chip */}
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass border border-white/8 max-w-[140px]">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user?.user_metadata?.avatar_url
                      ? <img src={user.user_metadata.avatar_url} className="w-5 h-5 object-cover" alt=""/>
                      : <span className="text-[9px] font-bold text-indigo-300">{(user.email||'U')[0].toUpperCase()}</span>}
                  </div>
                  <span className="hidden sm:inline text-xs font-mono text-[var(--accent2)] truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </div>
                <button onClick={()=>{ window.location.href='/dashboard'; }}
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                  Dashboard<ArrowRight size={12}/>
                </button>
                {/* Visible sign out button */}
                <button onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs text-[var(--text2)] hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg border border-white/8 glass whitespace-nowrap">
                  <LogOut size={13}/><span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login?mode=signin"
                  className="hidden sm:block text-sm text-[var(--text2)] hover:text-white transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/login?mode=signup"
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o)}}
              className="md:hidden p-2 rounded-lg border border-white/10 glass transition-colors ml-1"
              aria-label="Menu">
              {menuOpen
                ? <X size={16} className="text-[var(--text2)]"/>
                : <div className="space-y-[5px]">
                    <span className="block w-5 h-0.5 bg-[var(--text2)] rounded"/>
                    <span className="block w-5 h-0.5 bg-[var(--text2)] rounded"/>
                    <span className="block w-4 h-0.5 bg-[var(--text2)] rounded"/>
                  </div>}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
              transition={{duration:0.18}}
              className="md:hidden absolute top-[60px] left-0 right-0 backdrop-blur-xl border-b shadow-2xl z-50 mobile-menu-bg"  style={{background: "var(--bg)", borderColor: "var(--border2)"}}
              onClick={e=>e.stopPropagation()}>
              <div className="px-3 py-3 flex flex-col items-start">
                {NAV_LINKS.map(item=>(
                  <button key={item.id} onClick={()=>scrollTo(item.id)}
                    className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all" style={{color:"var(--text2)"}}>
                    {item.label}
                  </button>
                ))}
                <div className="border-t pt-2 mt-2 space-y-0.5" style={{borderColor:"var(--border2)"}}>
                  {isLoggedIn ? (
                    <>
                      <div className="px-3 py-2 text-xs text-[var(--text3)] font-mono truncate">
                        {user.email}
                      </div>
                      <button onClick={()=>{ setMenuOpen(false); window.location.href='/dashboard'; }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[var(--accent2)] hover:text-white rounded-lg hover:bg-white/5 transition-all">
                        → Dashboard
                      </button>
                      <button onClick={()=>{handleSignOut();setMenuOpen(false)}}
                        className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/8 transition-all flex items-center gap-2">
                        <LogOut size={13}/>Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={()=>setMenuOpen(false)}
                        className="block px-3 py-2.5 text-sm text-[var(--text2)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface2)] transition-all">
                        Sign In
                      </Link>
                      <Link href="/login?mode=signup" onClick={()=>setMenuOpen(false)}
                        className="block px-3 py-2.5 text-sm text-[var(--accent2)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface2)] transition-all font-medium">
                        Create Free Account →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section id="hero" className="relative flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{minHeight:'100svh', paddingTop:72, paddingBottom:40}}>
        <GlowOrb className="top-1/4 left-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px]" color="#6366f1" blur={120}/>
        <GlowOrb className="bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]" color="#c9a84c" blur={100}/>
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage:'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)',
          backgroundSize:'60px 60px'
        }}/>

        <div className="relative z-10 w-full max-w-2xl mx-auto text-center flex flex-col items-center gap-0">
          {/* Badge */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 mb-3">
            <Sparkles size={11} className="text-[var(--accent2)]"/>
            <span className="text-[11px] sm:text-xs font-medium text-[var(--accent2)]">Powered by Groq — free to start</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="font-display font-black leading-tight mb-2 sm:mb-4 px-1 text-center"
            style={{fontSize:'clamp(1.75rem,5vw,3.8rem)'}}>
            Understand any{' '}
            <span className="gradient-indigo">GitHub repo</span>
            <span className="block text-[var(--text2)] font-light mt-1" style={{fontSize:'clamp(1rem,3vw,2rem)'}}>in seconds, not hours.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
            className="text-[var(--text2)] text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-4 sm:mb-6 px-2">
            Paste a GitHub URL. Get explanations, 3D diagrams, and analytics instantly.
            No account required for your first 3 repos.
          </motion.p>

          {/* URL Input */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="w-full max-w-xl mb-2">
            <div className="border-gradient p-[1px] rounded-2xl">
              <div className="bg-[var(--surface)] rounded-2xl flex flex-col sm:flex-row gap-2 p-2">
                <div className="flex items-center gap-2 flex-1 px-3 min-w-0">
                  <Search size={14} className="text-[var(--text3)] flex-shrink-0"/>
                  <input value={url} onChange={e=>{setUrl(e.target.value);setError('')}}
                    onKeyDown={e=>e.key==='Enter'&&handleAnalyse()}
                    placeholder="github.com/facebook/react"
                    className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--text3)] text-sm outline-none py-2 font-mono min-w-0"/>
                </div>
                <button onClick={handleAnalyse} disabled={!url.trim()||loading}
                  className="btn-primary rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Fetching...</>
                           : <><Zap size={13}/>Analyse</>}
                </button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="text-red-400 text-[11px] mb-2 font-mono text-center px-2">{error}</motion.p>
            )}
          </AnimatePresence>

          {/* Usage pill */}
          <motion.div initial={{opacity:0}} animate={{opacity:userLoaded?1:0}} transition={{delay:0.3}}
            className="text-[11px] sm:text-xs mb-4 px-2">
            {isLoggedIn ? (
              <span className="flex items-center justify-center gap-1.5 text-green-400 font-mono">
                <Unlock size={10}/> Signed in — unlimited analyses
              </span>
            ) : freeLeft > 0 ? (
              <span className="flex items-center justify-center gap-1.5 text-[var(--text3)] font-mono">
                <Unlock size={10} className="text-[var(--accent2)]"/>
                <span className="text-[var(--accent2)] font-semibold">{freeLeft}</span>
                <span>free {freeLeft===1?'analysis':'analyses'} remaining — no sign-up needed</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 text-amber-400 font-mono">
                <Lock size={10}/> Limit reached —
                <button onClick={()=>setShowLimitModal(true)} className="underline hover:text-white">sign up free</button>
                &nbsp;to continue
              </span>
            )}
          </motion.div>

          {/* Example pills */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
            className="flex flex-wrap justify-center gap-2 px-2">
            <span className="text-[11px] text-[var(--text3)]">Try:</span>
            {['facebook/react','vercel/next.js','tiangolo/fastapi'].map(r=>(
              <button key={r} onClick={()=>setUrl('https://github.com/'+r)}
                className="text-[11px] px-2.5 py-1 rounded-full glass border border-white/8 text-[var(--text2)] hover:text-white hover:border-indigo-500/40 transition-all font-mono">
                {r}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.button onClick={()=>scrollTo('features')}
          animate={{y:[0,5,0]}} transition={{repeat:Infinity,duration:2.5}}
          className="relative z-10 mt-6 flex flex-col items-center gap-1 text-[var(--text3)] hover:text-[var(--text2)] transition-colors">
          <span className="text-[10px] font-mono">scroll to explore</span>
          <ChevronDown size={13}/>
        </motion.button>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="relative py-8 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-14">
            <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-[var(--accent2)] mb-3 block">
              Capabilities
            </motion.span>
            <motion.h2 initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              className="font-bold leading-tight mb-3" style={{fontSize:"clamp(1.5rem,4vw,2.8rem)",color:"var(--text)"}}>
              Everything you need to{" "}
              <span className="gradient-gold">understand any codebase</span>
            </motion.h2>
            <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.1}}
              className="text-[var(--text2)] max-w-lg mx-auto text-sm">
              No more spending hours reading unfamiliar code. Get answers in seconds.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {FEATURES.map((f,i)=><FeatureCard key={i} {...f} index={i}/>)}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="relative py-10 sm:py-20 px-4">
        <GlowOrb className="top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]" color="#6366f1" blur={100}/>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-[var(--accent2)] mb-3 block">
              How It Works
            </motion.span>
            <motion.h2 initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              className="font-bold leading-tight" style={{fontSize:"clamp(1.5rem,4vw,2.8rem)",color:"var(--text)"}}>
              From URL to full analysis{" "}
              <span className="gradient-blue-indigo">in 4 steps</span>
            </motion.h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            <div className="order-2 lg:order-1 pt-2">
              {STEPS.map((step,i)=><ProcessStep key={i} step={step} index={i} total={STEPS.length}/>)}
            </div>
            <div className="order-1 lg:order-2 lg:sticky lg:top-20 w-full">
              <DemoTerminal/>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CONTACT ══════════ */}
      <section id="contact" className="relative py-14 sm:py-20 px-4 overflow-hidden">
        <GlowOrb className="top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px]" color="#6366f1" blur={130}/>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-12">
            <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-[var(--accent2)] mb-3 block">
              Get In Touch
            </motion.span>
            <motion.h2 initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              className="font-bold leading-tight mb-3" style={{fontSize:"clamp(1.5rem,4vw,2.8rem)",color:"var(--text)"}}>
              Let's <span className="gradient-indigo">Work Together</span>
            </motion.h2>
            <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.1}}
              className="text-[var(--text2)] max-w-lg mx-auto text-sm">
              Have a question or want to collaborate? My inbox is always open.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Info card */}
            <motion.div initial={{opacity:0,x:-16}} whileInView={{opacity:1,x:0}} viewport={{once:true}}
              className="lg:col-span-2 glass rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                  <Code2 size={20} className="text-white"/>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">GitWhisper AI</div>
                  <div className="text-xs text-[var(--accent2)]">Built for developers</div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail size={12} className="text-indigo-400"/>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text3)]">Email</div>
                    <a href="mailto:tproject418@gmail.com" className="text-xs text-[var(--accent2)] hover:text-white transition-colors">
                      tproject418@gmail.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="text-[10px] text-[var(--text3)] mb-2 uppercase tracking-wider">Find me online</div>
                <div className="space-y-1">
                  {[
                    { icon:Github,        label:'GitHub',   handle:'@SALMANUDDIN-TALHA-MOHD', href:'https://github.com/SALMANUDDIN-TALHA-MOHD' },
                    { icon:MessageSquare, label:'LinkedIn', handle:'/in/mohd-salmanuddin-talha', href:'https://www.linkedin.com/in/mohd-salmanuddin-talha/' },
                    { icon:ExternalLink,  label:'Twitter',  handle:'Coming Soon', href:'#' },
                  ].map(({ icon:Icon, label, handle, href:h })=>(
                    <a key={label} href={h} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface2)] border border-white/8 flex items-center justify-center flex-shrink-0">
                        <Icon size={12} className="text-[var(--text2)] group-hover:text-[var(--accent2)] transition-colors"/>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">{label}</div>
                        <div className="text-[10px] text-[var(--text3)] truncate">{handle}</div>
                      </div>
                      <ArrowRight size={10} className="ml-auto text-[var(--text3)] group-hover:text-[var(--accent2)] flex-shrink-0"/>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{opacity:0,x:16}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:0.1}}
              className="lg:col-span-3 glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">Send a Message</h3>
              <p className="text-xs text-[var(--text2)] mb-4">I'll reply as soon as possible.</p>
              <ContactForm/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t py-8 sm:py-10 px-4" style={{borderColor:"var(--border2)",background:"var(--surface)"}}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                  <Code2 size={13} className="text-white"/>
                </div>
                <span className="font-display font-bold text-sm text-white">GitWhisper AI</span>
              </div>
              <p className="text-xs text-[var(--text3)] leading-relaxed">
                Understand any GitHub repository instantly. Free for 3 analyses — no account needed.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3">Navigation</div>
              <div className="space-y-2">
                {NAV_LINKS.map(item=>(
                  <button key={item.id} onClick={()=>scrollTo(item.id)}
                    className="block text-sm text-[var(--text3)] hover:text-[var(--text2)] transition-colors text-left">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3">Built With</div>
              <div className="flex flex-wrap gap-1.5">
                {['Next.js 14','TypeScript','Supabase','Groq AI','Three.js','Tailwind'].map(t=>(
                  <span key={t} className="text-[10px] px-2 py-1 rounded-full glass border border-white/8 text-[var(--text3)]">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text3)]">
            <span>© 2024 GitWhisper AI. Built for developers who love learning.</span>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-[var(--accent2)]"/>
              <span>Free forever for 3 repos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
