import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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

export default function ProviderBookings() {
  const { user }  = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('pending')

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchBookings() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(title, service_type, city),
        owner:profiles!bookings_owner_id_fkey(full_name, email)
      `)
      .eq('provider_id', user.id)
      .order('booking_date', { ascending: true })

    setLoading(false)
    if (err) { setError(err.message); return }
    setBookings(data)
  }

  async function updateStatus(bookingId, status) {
    const { error: err } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (err) { setError(err.message); return }
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status } : b)
    )
  }

  const filtered  = bookings.filter(b => b.status === filter)
  const counts    = {
    pending:  bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    declined: bookings.filter(b => b.status === 'declined').length,
  }

  if (loading) return <div className="page-loading">Loading bookings…</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incoming Bookings</h1>
          <p className="page-subtitle">{bookings.length} total request{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Filter tabs */}
      <div className="tab-bar">
        {(['pending', 'accepted', 'declined']).map(s => (
          <button
            key={s}
            className={`tab-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABELS[s].label}
            {counts[s] > 0 && <span className="tab-count">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <h2>No {filter} bookings</h2>
          <p>Requests will appear here when owners book your services.</p>
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
                  <span className="bc-detail-label">Pet name</span>
                  <span>{booking.pet_name}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Owner</span>
                  <span>{booking.owner?.full_name} ({booking.owner?.email})</span>
                </div>
                {booking.notes && (
                  <div className="bc-detail-row">
                    <span className="bc-detail-label">Notes</span>
                    <span>{booking.notes}</span>
                  </div>
                )}
              </div>

              {booking.status === 'pending' && (
                <div className="bc-actions">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => updateStatus(booking.id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => updateStatus(booking.id, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
