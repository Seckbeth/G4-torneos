import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types/tournament'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setError: (error: string | null) => void
} | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Sesión existente
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        loadUserProfile(data.session.user)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (authUser: any) => {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser(profile as unknown as User)
    } else {
      // Crear perfil si no existe
      const newUser: Omit<User, 'id' | 'createdAt'> = {
        email: authUser.email!,
        displayName: authUser.user_metadata?.display_name || authUser.email!.split('@')[0],
        photoURL: authUser.user_metadata?.avatar_url || undefined,
        role: 'admin',
        tournaments: [],
      }
      await supabase.from('users').insert({ ...newUser, id: authUser.id, created_at: new Date().toISOString() })
      setUser({ ...newUser, id: authUser.id, createdAt: Date.now() })
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.includes('Invalid login') ? 'Usuario o contraseña incorrectos' :
                  error.message.includes('email not confirmed') ? 'Email no confirmado' :
                  error.message
      setError(msg)
      throw error
    }
  }

  const register = async (email: string, password: string, displayName: string) => {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) {
      const msg = error.message.includes('already registered') ? 'El email ya está registrado' :
                  error.message.includes('weak password') ? 'La contraseña es demasiado débil' :
                  error.message
      setError(msg)
      throw error
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setError('Error al enviar email de recuperación')
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, resetPassword, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}