import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/apiService'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await authService.login(form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="orb orb-green" />
      <div className="orb orb-amber" />
      <div className="orb orb-sky" />

      <div className="relative z-10 w-full max-w-[420px] slide-up">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-strong mb-5 bounce-slow">
            <span className="text-4xl">✈️</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-1">Pack & Go</h1>
          <p className="text-white/40 text-sm">Your intelligent travel packing companion</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-white/35 text-sm mb-7">Sign in to your travel dashboard</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4 stagger">
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
              <input type="email" required placeholder="you@example.com" className="inp"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
              <input type="password" required placeholder="••••••••" className="inp"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="pt-1">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Signing in…
                    </span>
                  : 'Sign In →'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-white/35 text-sm">
              New here?{' '}
              <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/15 text-xs mt-6">
          Powered by real-time weather intelligence 🌤
        </p>
      </div>
    </div>
  )
}
