import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, Card, LoadingSpinner } from '../components/ui'

export function RegisterPage() {
  const { register, error: authError, setError } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.password, form.displayName || form.email.split('@')[0])
      navigate('/my-tournaments')
    } catch (e) {
      // Error handled by auth hook
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Únete y empieza a organizar torneos</p>
        </div>

        {authError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre de usuario"
            value={form.displayName}
            onChange={e => setForm({...form, displayName: e.target.value})}
            placeholder="Tu nombre o tag"
            required
            autoComplete="name"
          />
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
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirmar Contraseña"
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm({...form, confirmPassword: e.target.value})}
            placeholder="Repite la contraseña"
            required
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Inicia sesión</Link></p>
        </div>
      </Card>
    </div>
  )
}