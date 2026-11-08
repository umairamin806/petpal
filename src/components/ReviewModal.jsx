import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'

/**
 * Modal for leaving a 1-5 star review after an accepted booking.
 *
 * Props:
 *   booking   – the booking object (id, listing_id, provider_id, listing.title)
 *   onClose   – () => void
 *   onSuccess – () => void
 */
export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { user } = useAuth()
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase.from('reviews').insert({
      booking_id:  booking.id,
      listing_id:  booking.listing_id,
      owner_id:    user.id,
      provider_id: booking.provider_id,
      rating,
      comment:     comment.trim() || null,
    })
    setSaving(false)

    if (err) { setError(err.message); return }
    onSuccess()
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 id="review-modal-title" className="modal-title">Leave a Review</h2>
        <p className="modal-subtitle">{booking.listing?.title}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="form-error">{error}</p>}

          <div className="review-star-row">
            <StarRating value={rating} onChange={setRating} size="md" />
            {rating > 0 && (
              <span className="rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
              </span>
            )}
          </div>

          <label className="field-label">
            Comment <span className="optional">(optional)</span>
            <textarea
              className="field-input field-textarea"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this provider…"
              rows={4}
              maxLength={500}
            />
          </label>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={saving || rating === 0}>
              {saving ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
