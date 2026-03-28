'use client'
import { useState, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, Mail, Lock, User, ArrowRight, AlertCircle,
  Eye, EyeOff, UserPlus, LogIn, Github, CheckCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import GlowOrb from '@/components/GlowOrb'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const params    = useSearchParams()
  const isLimit   = params.get('reason') === 'limit'
  const modeParam = params.get('mode')

  const [mode, setMode]         = useState<'signup'|'signin'>(modeParam === 'signin' ? 'signin' : 'signup')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string|null>(null)
  const [success, setSuccess]   = useState<'confirm'|'signedin'|null>(null)

  // IMPORTANT: use the same SSR-compatible client as the rest of the app
  const supabase = createClient()

  useEffect(() => {
    // Apply saved theme
    const saved = localStorage.getItem('gw-theme')
    if (saved) document.documentElement.setAttribute('data-theme', saved)

    // If already signed in → go directly to dashboard (not home)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = '/dashboard'
    })
  }, [])

  /* ── DB helpers (wrapped in try/catch so they never block the auth flow) ── */
  const recordLogin = async (userId: string, userEmail: string, provider: string) => {
    try {
      await (supabase as any).from('login_history').insert({
        user_id: userId, email: userEmail, provider
      })
    } catch (_e) { /* non-critical */ }
    try {
      await (supabase as any).from('user_profiles').upsert(
        { id: userId, email: userEmail, last_seen: new Date().toISOString() },
        { onConflict: 'id' }
      )
    } catch (_e) { /* non-critical */ }
  }

  /* ── Email / Password ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || password.length < 6) {
      toast.error('Enter a valid email and password (min 6 chars)')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) { toast.error('Please enter your name'); setLoading(false); return }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: name.trim() }
          }
        })
        if (error) {
          if (error.message.toLowerCase().includes('already') ||
              error.message.toLowerCase().includes('registered')) {
            toast.error('Account already exists — switching to Sign In')
            setMode('signin')
          } else { throw error }
        } else if (data.user && !data.session) {
          // Email confirmation required
          setSuccess('confirm')
        } else if (data.session) {
          // Auto-confirmed (e.g. email confirm disabled in Supabase settings)
          await recordLogin(data.user!.id, email.trim(), 'email')
          setSuccess('signedin')
          setTimeout(() => { window.location.href = '/dashboard' }, 1200)
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(), password
        })
        if (error) {
          if (error.message.includes('Invalid login credentials') ||
              error.message.includes('Invalid login')) {
            throw new Error('Incorrect email or password.')
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email first. Check your inbox.')
          }
          throw error
        }
        await recordLogin(data.user.id, email.trim(), 'email')
        setSuccess('signedin')
        // Hard redirect → ensures session cookie is fully written before next page loads
        setTimeout(() => { window.location.href = '/dashboard' }, 1200)
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed')
    } finally { setLoading(false) }
  }

  /* ── OAuth ── */
  const signInWithOAuth = async (provider: 'github' | 'google') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) throw error
      // browser redirects — oauthLoading stays set (page navigates away)
    } catch (err: any) {
      toast.error(err.message || `${provider} sign in failed`)
      setOauthLoading(null)
    }
  }

  /* ── Confirm screen (email verification sent) ── */
  if (success === 'confirm') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'var(--bg)'}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
        className="glass rounded-2xl border border-[var(--border2)] p-7 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <Mail size={24} className="text-green-400"/>
        </div>
        <h2 className="font-display font-black text-xl mb-2" style={{color:'var(--text)'}}>
          Check your email
        </h2>
        <p className="text-sm mb-5 leading-relaxed" style={{color:'var(--text2)'}}>
          We sent a confirmation to{' '}
          <span className="font-semibold" style={{color:'var(--accent2)'}}>{email}</span>.<br/>
          Click the link, then come back and sign in.
        </p>
        <button onClick={()=>{setSuccess(null);setMode('signin')}}
          className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold mb-2">
          Go to Sign In →
        </button>
        <Link href="/" className="block text-xs transition-colors" style={{color:'var(--text3)'}}>
          ← Back to home
        </Link>
      </motion.div>
    </div>
  )

  /* ── Success screen (signed in) ── */
  if (success === 'signedin') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'var(--bg)'}}>
      <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}}
        className="glass rounded-2xl border border-[var(--border2)] p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle size={26} className="text-green-400"/>
        </div>
        <h2 className="font-display font-black text-xl" style={{color:'var(--text)'}}>You're in! 🎉</h2>
        <p className="text-sm" style={{color:'var(--text2)'}}>
          Taking you to your dashboard...
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin"/>
          <span className="text-xs" style={{color:'var(--text3)'}}>Redirecting...</span>
        </div>
      </motion.div>
    </div>
  )

  /* ── Main login form ── */
  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-6 overflow-hidden"
      style={{background:'var(--bg)'}}>
      <GlowOrb className="top-1/4 left-1/4 w-80 h-80" color="#6366f1" blur={120}/>
      <GlowOrb className="bottom-1/4 right-1/4 w-64 h-64" color="#c9a84c" blur={100}/>
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage:'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)',
        backgroundSize:'60px 60px'
      }}/>

      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="relative z-10 w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{color:'var(--text3)'}}>
          ← Back to home
        </Link>

        {isLimit && (
          <div className="mb-3 flex items-start gap-2.5 p-3.5 rounded-xl border text-xs text-amber-300"
            style={{background:'rgba(245,158,11,0.08)', borderColor:'rgba(245,158,11,0.25)'}}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
            <span><strong>Free limit reached.</strong> Create a free account for unlimited access.</span>
          </div>
        )}

        <div className="border-gradient p-[1px] rounded-2xl">
          <div className="rounded-2xl p-5 sm:p-6" style={{background:'var(--surface)'}}>

            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                <Code2 size={15} className="text-white"/>
              </div>
              <div>
                <div className="font-display font-bold text-sm" style={{color:'var(--text)'}}>GitWhisper AI</div>
                <div className="text-[10px]" style={{color:'var(--text3)'}}>Unlimited repo analysis</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl p-1 mb-4" style={{background:'var(--surface2)'}}>
              {(['signup','signin'] as const).map(m=>(
                <button key={m} onClick={()=>setMode(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: mode===m ? 'var(--surface3)' : 'transparent',
                    color: mode===m ? 'var(--text)' : 'var(--text3)'
                  }}>
                  {m==='signup' ? <><UserPlus size={12}/>Sign Up</> : <><LogIn size={12}/>Sign In</>}
                </button>
              ))}
            </div>

            <p className="text-xs mb-4 leading-relaxed" style={{color:'var(--text2)'}}>
              {mode==='signup'
                ? 'Free account = unlimited analyses. No credit card.'
                : 'Sign in to continue with unlimited analyses.'}
            </p>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={()=>signInWithOAuth('github')} disabled={!!oauthLoading}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-white text-xs font-medium transition-all disabled:opacity-50"
                style={{background:'#24292e', borderColor:'#444d56'}}>
                {oauthLoading==='github'
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <Github size={13}/>}
                GitHub
              </button>
              <button onClick={()=>signInWithOAuth('google')} disabled={!!oauthLoading}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-50"
                style={{background:'white', borderColor:'#e5e7eb', color:'#374151'}}>
                {oauthLoading==='google'
                  ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/>
                  : <svg width="13" height="13" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>}
                Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{background:'var(--border2)'}}/>
              <span className="text-[10px]" style={{color:'var(--text3)'}}>or email</span>
              <div className="flex-1 h-px" style={{background:'var(--border2)'}}/>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {mode === 'signup' && (
                <div className="relative">
                  <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text3)'}}/>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)}
                    placeholder="Your full name" required={mode==='signup'}
                    className="w-full rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                    style={{background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)'}}/>
                </div>
              )}
              <div className="relative">
                <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text3)'}}/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                  style={{background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)'}}/>
              </div>
              <div className="relative">
                <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text3)'}}/>
                <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder={mode==='signup' ? 'Min. 6 characters' : 'Your password'} required
                  className="w-full rounded-xl pl-8 pr-9 py-2.5 text-xs focus:outline-none transition-colors"
                  style={{background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)'}}/>
                <button type="button" onClick={()=>setShowPwd(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{color:'var(--text3)'}}>
                  {showPwd ? <EyeOff size={12}/> : <Eye size={12}/>}
                </button>
              </div>
              <button type="submit" disabled={!email||!password||loading}
                className="w-full btn-primary py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      {mode==='signup' ? 'Creating...' : 'Signing in...'}</>
                  : mode==='signup'
                    ? <><UserPlus size={13}/>Create Free Account</>
                    : <><LogIn size={13}/>Sign In<ArrowRight size={11} className="ml-auto"/></>}
              </button>
            </form>

            <p className="text-center text-[10px] mt-3" style={{color:'var(--text3)'}}>
              Secure · Private · Free forever
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"/>
      </div>
    }>
      <LoginContent/>
    </Suspense>
  )
}
