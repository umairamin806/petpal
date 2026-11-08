import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar          from './components/Navbar'
import ProtectedRoute  from './components/ProtectedRoute'

// Public pages
import Browse        from './pages/owner/Browse'
import ListingDetail from './pages/owner/ListingDetail'
import Login         from './pages/Login'
import Signup        from './pages/Signup'

// Owner pages
import MyBookings from './pages/owner/MyBookings'

// Provider pages
import ProviderListings from './pages/provider/ProviderListings'
import ListingForm      from './pages/provider/ListingForm'
import ProviderBookings from './pages/provider/ProviderBookings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />

          <main className="app-main">
            <Routes>
              {/* ── Public ── */}
              <Route path="/"              element={<Browse />} />
              <Route path="/listings/:id"  element={<ListingDetail />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/signup"        element={<Signup />} />

              {/* ── Owner ── */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* ── Provider ── */}
              <Route
                path="/provider/listings"
                element={
                  <ProtectedRoute requiredRole="provider">
                    <ProviderListings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/listings/new"
                element={
                  <ProtectedRoute requiredRole="provider">
                    <ListingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/listings/:id/edit"
                element={
                  <ProtectedRoute requiredRole="provider">
                    <ListingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/bookings"
                element={
                  <ProtectedRoute requiredRole="provider">
                    <ProviderBookings />
                  </ProtectedRoute>
                }
              />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>© {new Date().getFullYear()} PetPal · Built with React &amp; Supabase</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
