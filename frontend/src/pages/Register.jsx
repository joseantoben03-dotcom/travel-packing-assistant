import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/apiService'

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await authService.register(form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#f87171', '#fbbf24', '#52b788'][strength]

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="orb orb-green" />
      <div className="orb orb-amber" />
      <div className="orb orb-sky" />

      <div className="relative z-10 w-full max-w-[420px] slide-up">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-strong mb-5 bounce-slow">
            <span className="text-4xl">🌍</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-1">Pack & Go</h1>
          <p className="text-white/40 text-sm">Smart packing starts here</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-semibold text-white mb-1">Create account</h2>
          <p className="text-white/35 text-sm mb-7">Start planning your first adventure</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4 stagger">
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" required placeholder="Jane Doe" className="inp"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
              <input type="email" required placeholder="you@example.com" className="inp"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
              <input type="password" required placeholder="Min. 6 characters" className="inp"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div className="pt-1">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Creating account…
                    </span>
                  : 'Get Started →'}
              </button>
            </div>
          </form>

          {/* Feature chips */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['🌤 Live weather','🤖 Smart suggestions','✅ Packing tracker'].map(f => (
              <span key={f} className="text-xs text-white/30 px-3 py-1 rounded-full border border-white/8 bg-white/3">{f}</span>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-white/8 text-center">
            <p className="text-white/35 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
