import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ListingCard from '../../components/ListingCard'

const SERVICE_TYPES = [
  { value: '',         label: 'All types' },
  { value: 'sitting',  label: '🏠 Sitting' },
  { value: 'walking',  label: '🦮 Walking' },
  { value: 'grooming', label: '✂️ Grooming' },
  { value: 'training', label: '🎓 Training' },
  { value: 'vet',      label: '🩺 Vet' },
]

export default function Browse() {
  const [listings, setListings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Filters
  const [search, setSearch]         = useState('')
  const [serviceType, setServiceType] = useState('')
  const [city, setCity]             = useState('')
  const [maxPrice, setMaxPrice]     = useState('')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')

    let query = supabase
      .from('listings_with_stats')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (serviceType) query = query.eq('service_type', serviceType)
    if (city.trim()) query = query.ilike('city', `%${city.trim()}%`)
    if (maxPrice)    query = query.lte('price_per_hour', parseFloat(maxPrice))

    const { data, error: err } = await query
    setLoading(false)
    if (err) { setError(err.message); return }

    // Client-side title/description search
    const q = search.trim().toLowerCase()
    setListings(
      q
        ? data.filter(l =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.provider_name.toLowerCase().includes(q)
          )
        : data
    )
  }, [serviceType, city, maxPrice, search])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find a Pet Service</h1>
          <p className="page-subtitle">Browse trusted providers near you</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          className="field-input filter-search"
          type="search"
          placeholder="Search by title, description, or provider…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search listings"
        />

        <select
          className="field-input filter-select"
          value={serviceType}
          onChange={e => setServiceType(e.target.value)}
          aria-label="Filter by service type"
        >
          {SERVICE_TYPES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <input
          className="field-input filter-city"
          type="text"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
          aria-label="Filter by city"
        />

        <input
          className="field-input filter-price"
          type="number"
          placeholder="Max $/hr"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          min="0"
          aria-label="Maximum price per hour"
        />

        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSearch(''); setServiceType(''); setCity(''); setMaxPrice('')
          }}
        >
          Clear
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="listings-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="listing-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🔍</p>
          <h2>No listings found</h2>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <p className="results-count">{listings.length} result{listings.length !== 1 ? 's' : ''}</p>
          <div className="listings-grid">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
