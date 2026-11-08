export default function PageSpinner({ message = 'Loading…' }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
