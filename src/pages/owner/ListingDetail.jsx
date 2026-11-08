import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/StarRating'

const SERVICE_LABELS = {
  sitting:  '🏠 Sitting',
  walking:  '🦮 Walking',
  grooming: '✂️ Grooming',
  training: '🎓 Training',
  vet:      '🩺 Vet',
}

export default function ListingDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user, isOwner, isAuthenticated } = useAuth()

  const [listing, setListing]     = useState(null)
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Booking form state
  const [showForm, setShowForm]   = useState(false)
  const [bookingForm, setBookingForm] = useState({
    booking_date: '',
    booking_time: '',
    pet_name:     '',
    notes:        '',
  })
  const [booking, setBooking]     = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError]     = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchData() {
    setLoading(true)
    const [{ data: listingData, error: le }, { data: reviewData, error: re }] =
      await Promise.all([
        supabase
          .from('listings_with_stats')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('reviews')
          .select('*, owner:profiles!reviews_owner_id_fkey(full_name)')
          .eq('listing_id', id)
          .order('created_at', { ascending: false }),
      ])

    setLoading(false)
    if (le) { setError('Listing not found.'); return }
    setListing(listingData)
    setReviews(reviewData ?? [])
  }

  function handleBookingChange(e) {
    setBookingForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function submitBooking(e) {
    e.preventDefault()
    setBookingError('')
    setBooking(true)

    const { error: err } = await supabase.from('bookings').insert({
      listing_id:   id,
      owner_id:     user.id,
      provider_id:  listing.provider_id,
      booking_date: bookingForm.booking_date,
      booking_time: bookingForm.booking_time,
      pet_name:     bookingForm.pet_name,
      notes:        bookingForm.notes || null,
    })

    setBooking(false)
    if (err) { setBookingError(err.message); return }
    setBookingSuccess(true)
    setShowForm(false)
    setBookingForm({ booking_date: '', booking_time: '', pet_name: '', notes: '' })
  }

  if (loading) return <div className="page-loading">Loading listing…</div>
  if (error)   return <div className="page-container"><p className="form-error">{error}</p></div>

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="page-container detail-layout">

      {/* ── Left column: listing info ── */}
      <div className="detail-main">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-badges">
          <span className="service-badge">{SERVICE_LABELS[listing.service_type]}</span>
          {!listing.is_active && <span className="status-pill paused">Unavailable</span>}
        </div>

        <h1 className="detail-title">{listing.title}</h1>

        <div className="detail-meta-row">
          <span>📍 {listing.city}</span>
          <span>💰 ${listing.price_per_hour}/hr</span>
          <span>🕐 {listing.availability}</span>
        </div>

        <div className="detail-rating-row">
          <StarRating value={Number(listing.avg_rating)} readonly />
          <span className="rating-value">
            {Number(listing.avg_rating) > 0
              ? `${Number(listing.avg_rating).toFixed(1)} (${listing.review_count} review${listing.review_count !== 1 ? 's' : ''})`
              : 'No reviews yet'}
          </span>
        </div>

        <p className="detail-description">{listing.description}</p>

        {/* Provider info */}
        <div className="provider-info-box">
          <div className="pib-avatar">
            {listing.provider_avatar
              ? <img src={listing.provider_avatar} alt={listing.provider_name} />
              : <span>{listing.provider_name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="pib-name">{listing.provider_name}</p>
            <p className="pib-label">Service provider</p>
          </div>
        </div>

        {/* Reviews */}
        <section className="reviews-section">
          <h2 className="section-title">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first to book!</p>
          ) : (
            <div className="review-list">
              {reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <StarRating value={r.rating} readonly size="sm" />
                    <span className="review-author">{r.owner?.full_name}</span>
                    <span className="review-date">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Right column: booking panel ── */}
      <aside className="detail-aside">
        <div className="booking-panel">
          <h2 className="bp-title">${listing.price_per_hour}<span>/hr</span></h2>

          {bookingSuccess && (
            <div className="alert-success">
              Booking request sent! The provider will get back to you soon.
            </div>
          )}

          {!isAuthenticated ? (
            <div>
              <p className="muted" style={{ marginBottom: '1rem' }}>
                Sign in to request a booking.
              </p>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${id}` } } })}
              >
                Sign in to book
              </button>
            </div>
          ) : !isOwner ? (
            <p className="muted">Only pet owners can request bookings.</p>
          ) : !listing.is_active ? (
            <p className="muted">This listing is currently unavailable.</p>
          ) : !showForm ? (
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowForm(true)}
            >
              Request booking
            </button>
          ) : (
            <form onSubmit={submitBooking} className="booking-form">
              {bookingError && <p className="form-error">{bookingError}</p>}

              <label className="field-label">
                Date
                <input
                  className="field-input"
                  type="date"
                  name="booking_date"
                  value={bookingForm.booking_date}
                  onChange={handleBookingChange}
                  min={today}
                  required
                />
              </label>

              <label className="field-label">
                Time
                <input
                  className="field-input"
                  type="time"
                  name="booking_time"
                  value={bookingForm.booking_time}
                  onChange={handleBookingChange}
                  required
                />
              </label>

              <label className="field-label">
                Pet name
                <input
                  className="field-input"
                  type="text"
                  name="pet_name"
                  value={bookingForm.pet_name}
                  onChange={handleBookingChange}
                  placeholder="e.g. Buddy"
                  required
                  maxLength={80}
                />
              </label>

              <label className="field-label">
                Notes <span className="optional">(optional)</span>
                <textarea
                  className="field-input field-textarea"
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  placeholder="Any special instructions for the provider…"
                  rows={3}
                  maxLength={400}
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={booking}>
                  {booking ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </div>
  )
}
