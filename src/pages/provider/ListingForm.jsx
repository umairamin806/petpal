import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const SERVICE_TYPES = [
  { value: 'sitting',  label: '🏠 Pet Sitting' },
  { value: 'walking',  label: '🦮 Dog Walking' },
  { value: 'grooming', label: '✂️ Grooming' },
  { value: 'training', label: '🎓 Training' },
  { value: 'vet',      label: '🩺 Vet Services' },
]

const EMPTY = {
  title:          '',
  service_type:   'sitting',
  description:    '',
  price_per_hour: '',
  city:           '',
  availability:   '',
}

export default function ListingForm() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { id }      = useParams()   // present when editing
  const isEdit      = Boolean(id)

  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Load existing listing when editing
  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      const { data, error: err } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('provider_id', user.id)
        .single()

      setLoading(false)
      if (err || !data) { setError('Listing not found.'); return }
      setForm({
        title:          data.title,
        service_type:   data.service_type,
        description:    data.description,
        price_per_hour: String(data.price_per_hour),
        city:           data.city,
        availability:   data.availability,
      })
    })()
  }, [id, isEdit, user.id])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const price = parseFloat(form.price_per_hour)
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price.')
      return
    }

    setSaving(true)
    const payload = {
      ...form,
      price_per_hour: price,
      provider_id: user.id,
    }

    let err
    if (isEdit) {
      ;({ error: err } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', id))
    } else {
      ;({ error: err } = await supabase
        .from('listings')
        .insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/provider/listings')
  }

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
          <p className="page-subtitle">
            {isEdit ? 'Update your service details' : 'Describe the service you offer'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        {error && <p className="form-error">{error}</p>}

        <label className="field-label">
          Title
          <input
            className="field-input"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Cozy Home Pet Sitting"
            required
            maxLength={120}
          />
        </label>

        <label className="field-label">
          Service type
          <select
            className="field-input"
            name="service_type"
            value={form.service_type}
            onChange={handleChange}
            required
          >
            {SERVICE_TYPES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Description
          <textarea
            className="field-input field-textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your service, experience, and what owners can expect…"
            required
            rows={5}
            maxLength={1000}
          />
        </label>

        <div className="form-row">
          <label className="field-label">
            Price per hour ($)
            <input
              className="field-input"
              type="number"
              name="price_per_hour"
              value={form.price_per_hour}
              onChange={handleChange}
              placeholder="25"
              required
              min="0"
              step="0.01"
            />
          </label>

          <label className="field-label">
            City
            <input
              className="field-input"
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Austin"
              required
              maxLength={80}
            />
          </label>
        </div>

        <label className="field-label">
          Availability
          <input
            className="field-input"
            type="text"
            name="availability"
            value={form.availability}
            onChange={handleChange}
            placeholder="e.g. Mon–Fri 8am–6pm"
            required
            maxLength={120}
          />
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/provider/listings')}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
