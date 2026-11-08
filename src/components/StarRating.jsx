/**
 * StarRating
 *
 * Props:
 *   value    – current rating (1-5, 0 = unset)
 *   onChange – (newValue: number) => void  — omit for readonly
 *   readonly – boolean
 *   size     – 'sm' | 'md' (default 'md')
 */
export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5]

  function handleClick(star) {
    if (readonly || !onChange) return
    onChange(star)
  }

  function handleKey(e, star) {
    if (readonly || !onChange) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(star)
    }
  }

  return (
    <div
      className={`star-rating star-rating--${size} ${readonly ? 'star-rating--readonly' : 'star-rating--interactive'}`}
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={readonly ? `Rating: ${value} out of 5` : 'Select a rating'}
    >
      {stars.map(star => (
        <span
          key={star}
          className={`star ${star <= value ? 'star--filled' : 'star--empty'}`}
          onClick={() => handleClick(star)}
          onKeyDown={e => handleKey(e, star)}
          role={readonly ? undefined : 'radio'}
          aria-checked={readonly ? undefined : star === value}
          tabIndex={readonly ? -1 : 0}
          aria-label={readonly ? undefined : `${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
