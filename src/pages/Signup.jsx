import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email:    '',
    password: '',
    role:     'owner',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error: err } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      role:     form.role,
    })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    // Redirect to appropriate dashboard
    navigate(form.role === 'provider' ? '/provider/listings' : '/', { replace: true })
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">🐾</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join PetPal as an owner or provider</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="form-error">{error}</p>}

          <label className="field-label">
            Full name
            <input
              className="field-input"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </label>

          <label className="field-label">
            Email
            <input
              className="field-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="field-label">
            Password
            <input
              className="field-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
          </label>

          <fieldset className="role-fieldset">
            <legend className="field-label" style={{ display:'block', marginBottom:'0.5rem' }}>
              I am a…
            </legend>
            <div className="role-options">
              <label className={`role-option ${form.role === 'owner' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={form.role === 'owner'}
                  onChange={handleChange}
                />
                <span className="role-icon">🐶</span>
                <span className="role-name">Pet Owner</span>
                <span className="role-desc">Browse &amp; book services</span>
              </label>

              <label className={`role-option ${form.role === 'provider' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="provider"
                  checked={form.role === 'provider'}
                  onChange={handleChange}
                />
                <span className="role-icon">🧑‍⚕️</span>
                <span className="role-name">Service Provider</span>
                <span className="role-desc">List &amp; manage services</span>
              </label>
            </div>
          </fieldset>

          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
