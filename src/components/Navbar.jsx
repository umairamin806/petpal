import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, isOwner, isProvider, profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  const navClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link--active' : ''}`

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setOpen(false)}>
          🐾 <span>PetPal</span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar-links" aria-label="Main navigation">
          <NavLink to="/" className={navClass} end>Browse</NavLink>

          {isProvider && (
            <>
              <NavLink to="/provider/listings" className={navClass}>My Listings</NavLink>
              <NavLink to="/provider/bookings"  className={navClass}>Bookings</NavLink>
            </>
          )}

          {isOwner && (
            <NavLink to="/my-bookings" className={navClass}>My Bookings</NavLink>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="navbar-user">
              <span className="navbar-avatar" title={profile?.full_name}>
                {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="navbar-name">{profile?.full_name}</span>
              <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline btn-sm">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="navbar-drawer" onClick={() => setOpen(false)}>
          <NavLink to="/" className={navClass} end>Browse</NavLink>

          {isProvider && (
            <>
              <NavLink to="/provider/listings" className={navClass}>My Listings</NavLink>
              <NavLink to="/provider/bookings"  className={navClass}>Bookings</NavLink>
            </>
          )}

          {isOwner && (
            <NavLink to="/my-bookings" className={navClass}>My Bookings</NavLink>
          )}

          <div className="drawer-divider" />

          {isAuthenticated ? (
            <>
              <span className="drawer-user">{profile?.full_name}</span>
              <button className="btn btn-outline btn-full" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline btn-full">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-full">Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
