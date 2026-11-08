import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [profile, setProfile]   = useState(null)

  // ── Fetch the extended profile row ──────────────────────────
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('fetchProfile error:', error.message)
      return null
    }
    return data
  }

  // ── Bootstrap: get current session then subscribe to changes ─
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      if (data.session) {
        const p = await fetchProfile(data.session.user.id)
        if (mounted) setProfile(p)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        if (newSession) {
          const p = await fetchProfile(newSession.user.id)
          if (mounted) setProfile(p)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // ── Auth helpers ─────────────────────────────────────────────
  async function signUp({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    return { data, error }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    profile,
    user: session?.user ?? null,
    isLoading: session === undefined,
    isAuthenticated: !!session,
    isOwner:    profile?.role === 'owner',
    isProvider: profile?.role === 'provider',
    signUp,
    signIn,
    signOut,
    refreshProfile: async () => {
      if (session) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
