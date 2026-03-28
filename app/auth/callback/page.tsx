'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Code2, CheckCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')
  const [msg,    setMsg]    = useState('Completing sign in...')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()

    const run = async () => {
      const url      = new URL(window.location.href)
      const code     = url.searchParams.get('code')
      const errParam = url.searchParams.get('error_description') || url.searchParams.get('error')

      if (errParam) {
        setStatus('error')
        setErrMsg(decodeURIComponent(errParam).replace(/\+/g, ' '))
        return
      }

      if (code) {
        setMsg('Verifying your account...')
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) console.warn('exchangeCode warning:', error.message)
        } catch (_e) { /* may already be set */ }
      }

      // Poll for session (works for both PKCE and implicit)
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          clearInterval(poll)
          setStatus('success')
          setMsg(`Welcome${user.user_metadata?.full_name ? ', ' + user.user_metadata.full_name.split(' ')[0] : ''}!`)
          // Go to dashboard — not home
          setTimeout(() => { window.location.href = '/dashboard' }, 1000)
        } else if (attempts >= 20) {
          clearInterval(poll)
          setStatus('error')
          setErrMsg('Session could not be established. Please try signing in again.')
        }
      }, 400)
    }

    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'var(--bg)'}}>
      <div className="glass rounded-2xl border border-[var(--border2)] p-8 max-w-sm w-full text-center space-y-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
          style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
          <Code2 size={20} className="text-white"/>
        </div>
        <div className="font-display font-bold" style={{color:'var(--text)'}}>GitWhisper AI</div>

        {status === 'error' ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-red-400">Sign in failed</p>
            <p className="text-xs leading-relaxed" style={{color:'var(--text2)'}}>{errMsg}</p>
            <button onClick={() => window.location.href = '/login'}
              className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold">
              Try Again
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle size={18}/>
              <span className="text-sm font-semibold">Signed in!</span>
            </div>
            <p className="text-xs" style={{color:'var(--text2)'}}>{msg} Taking you to your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-4 h-4 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin"/>
              <span className="text-sm" style={{color:'var(--text2)'}}>{msg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
