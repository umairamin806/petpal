import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const SERVICE_LABELS = {
  sitting:  '🏠 Sitting',
  walking:  '🦮 Walking',
  grooming: '✂️ Grooming',
  training: '🎓 Training',
  vet:      '🩺 Vet',
}

export default function ProviderListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchListings() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('listings')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    setLoading(false)
    if (err) { setError(err.message); return }
    setListings(data)
  }

  async function toggleActive(listing) {
    const { error: err } = await supabase
      .from('listings')
      .update({ is_active: !listing.is_active })
      .eq('id', listing.id)

    if (err) { setError(err.message); return }
    setListings(prev =>
      prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l)
    )
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    const { error: err } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (err) { setError(err.message); return }
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return <div className="page-loading">Loading your listings…</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">{listings.length} service{listings.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link to="/provider/listings/new" className="btn btn-primary">
          + New listing
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      {listings.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📋</p>
          <h2>No listings yet</h2>
          <p>Create your first service listing to start receiving bookings.</p>
          <Link to="/provider/listings/new" className="btn btn-primary">Create listing</Link>
        </div>
      ) : (
        <div className="provider-listing-grid">
          {listings.map(listing => (
            <div key={listing.id} className={`provider-listing-card ${!listing.is_active ? 'inactive' : ''}`}>
              <div className="plc-header">
                <span className="service-badge">{SERVICE_LABELS[listing.service_type]}</span>
                <span className={`status-pill ${listing.is_active ? 'active' : 'paused'}`}>
                  {listing.is_active ? 'Active' : 'Paused'}
                </span>
              </div>

              <h2 className="plc-title">{listing.title}</h2>
              <p className="plc-meta">{listing.city} · ${listing.price_per_hour}/hr</p>
              <p className="plc-availability">{listing.availability}</p>
              <p className="plc-description">{listing.description}</p>

              <div className="plc-actions">
                <Link to={`/provider/listings/${listing.id}/edit`} className="btn btn-sm btn-outline">
                  Edit
                </Link>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => toggleActive(listing)}
                >
                  {listing.is_active ? 'Pause' : 'Activate'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteListing(listing.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
