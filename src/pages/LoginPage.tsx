import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, Card, LoadingSpinner } from '../components/ui'

export function LoginPage() {
  const { login, error: authError, setError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showForgot, setShowForgot] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/my-tournaments'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (e) {
      // Error handled by auth hook
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) {
      setError('Ingresa tu email para recuperar la contraseña')
      return
    }
    // Would call resetPassword from auth hook
    alert('Función de recuperación pendiente. Email: ' + form.email)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">App de Torneos</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Accede para gestionar tus torneos</p>
        </div>

        {authError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" role="alert">
            {authError}
          </div>
        )}

        {showForgot ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Enviar enlace de recuperación'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
              Volver al login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Iniciar Sesión'}
            </Button>
            <div className="text-center">
              <Button type="button" variant="ghost" className="text-sm" onClick={() => setShowForgot(true)}>
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>¿No tienes cuenta? <Link to="/register" className="text-indigo-600 hover:underline font-medium">Regístrate gratis</Link></p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
          <p>Demo: admin@demo.com / demo123</p>
        </div>
      </Card>
    </div>
  )
}