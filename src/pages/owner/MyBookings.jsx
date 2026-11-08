import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import ReviewModal from '../../components/ReviewModal'

const STATUS_LABELS = {
  pending:  { label: 'Pending',  cls: 'status-pending'  },
  accepted: { label: 'Accepted', cls: 'status-accepted' },
  declined: { label: 'Declined', cls: 'status-declined' },
}

function formatDate(date, time) {
  const d = new Date(`${date}T${time}`)
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function MyBookings() {
  const { user }  = useAuth()
  const [bookings, setBookings]   = useState([])
  const [reviews, setReviews]     = useState(new Set())  // booking IDs that have a review
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [filter, setFilter]       = useState('all')
  const [reviewTarget, setReviewTarget] = useState(null) // booking to review

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const [{ data: bData, error: be }, { data: rData, error: re }] =
      await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            listing:listings(title, service_type, city, price_per_hour),
            provider:profiles!bookings_provider_id_fkey(full_name)
          `)
          .eq('owner_id', user.id)
          .order('booking_date', { ascending: false }),
        supabase
          .from('reviews')
          .select('booking_id')
          .eq('owner_id', user.id),
      ])

    setLoading(false)
    if (be) { setError(be.message); return }
    setBookings(bData ?? [])
    setReviews(new Set((rData ?? []).map(r => r.booking_id)))
  }

  function handleReviewDone(bookingId) {
    setReviews(prev => new Set([...prev, bookingId]))
    setReviewTarget(null)
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const counts = {
    all:      bookings.length,
    pending:  bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    declined: bookings.filter(b => b.status === 'declined').length,
  }

  if (loading) return <div className="page-loading">Loading your bookings…</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Filter tabs */}
      <div className="tab-bar">
        {[
          { key: 'all',      label: 'All' },
          { key: 'pending',  label: 'Pending' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'declined', label: 'Declined' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab-btn ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {counts[t.key] > 0 && <span className="tab-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📅</p>
          <h2>No bookings yet</h2>
          <p>Browse listings and request a service to get started.</p>
        </div>
      ) : (
        <div className="booking-list">
          {filtered.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="bc-top">
                <div>
                  <h3 className="bc-listing-title">{booking.listing?.title}</h3>
                  <p className="bc-meta">
                    {booking.listing?.city} · {formatDate(booking.booking_date, booking.booking_time)}
                  </p>
                </div>
                <span className={`status-pill ${STATUS_LABELS[booking.status].cls}`}>
                  {STATUS_LABELS[booking.status].label}
                </span>
              </div>

              <div className="bc-details">
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Pet</span>
                  <span>{booking.pet_name}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Provider</span>
                  <span>{booking.provider?.full_name}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Rate</span>
                  <span>${booking.listing?.price_per_hour}/hr</span>
                </div>
                {booking.notes && (
                  <div className="bc-detail-row">
                    <span className="bc-detail-label">Notes</span>
                    <span>{booking.notes}</span>
                  </div>
                )}
              </div>

              {/* Leave a review button — only after accepted, once */}
              {booking.status === 'accepted' && !reviews.has(booking.id) && (
                <div className="bc-actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setReviewTarget(booking)}
                  >
                    ⭐ Leave a review
                  </button>
                </div>
              )}
              {booking.status === 'accepted' && reviews.has(booking.id) && (
                <p className="review-done-label">✓ Review submitted</p>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => handleReviewDone(reviewTarget.id)}
        />
      )}
    </div>
  )
}
