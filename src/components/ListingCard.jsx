import { Link } from 'react-router-dom'
import StarRating from './StarRating'

const SERVICE_LABELS = {
  sitting:  '🏠 Sitting',
  walking:  '🦮 Walking',
  grooming: '✂️ Grooming',
  training: '🎓 Training',
  vet:      '🩺 Vet',
}

export default function ListingCard({ listing }) {
  const {
    id,
    title,
    service_type,
    description,
    price_per_hour,
    city,
    availability,
    provider_name,
    avg_rating,
    review_count,
  } = listing

  const avgNum = Number(avg_rating)

  return (
    <Link to={`/listings/${id}`} className="listing-card" aria-label={`View ${title}`}>
      {/* Header */}
      <div className="lc-header">
        <span className="service-badge">{SERVICE_LABELS[service_type]}</span>
        <span className="lc-price">${price_per_hour}<span>/hr</span></span>
      </div>

      {/* Title */}
      <h2 className="lc-title">{title}</h2>

      {/* Provider */}
      <p className="lc-provider">by {provider_name}</p>

      {/* Description (truncated) */}
      <p className="lc-description">{description}</p>

      {/* Footer */}
      <div className="lc-footer">
        <div className="lc-meta">
          <span className="lc-city">📍 {city}</span>
          <span className="lc-avail">🕐 {availability}</span>
        </div>

        <div className="lc-rating">
          <StarRating value={avgNum} readonly size="sm" />
          <span className="lc-rating-text">
            {avgNum > 0
              ? `${avgNum.toFixed(1)} (${review_count})`
              : 'No reviews'}
          </span>
        </div>
      </div>
    </Link>
  )
}
