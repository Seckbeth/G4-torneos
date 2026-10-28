import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribeTournaments } from '../services/supabase'
import { useTournamentStore } from '../store/tournamentStore'
import { Button, Card, Badge, LoadingSpinner, EmptyState, Modal } from '../components/ui'
import type { Tournament, TournamentStatus } from '../types/tournament'

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Borrador',
  registration_open: 'Inscripciones Abiertas',
  check_in: 'Check-in',
  in_progress: 'En Progreso',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<TournamentStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  registration_open: 'info',
  check_in: 'warning',
  in_progress: 'success',
  completed: 'default',
  cancelled: 'error',
}

export function MyTournaments() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { setTournament, reset } = useTournamentStore()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    setLoading(true)
    const unsubscribe = subscribeTournaments(user.id, (t) => {
      setTournaments(t)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [user, navigate])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este torneo permanentemente?')) return
    setDeletingId(id)
    try {
      // await deleteTournament(id)
      alert('Función de eliminar pendiente de implementar')
    } catch (e) {
      alert('Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenRegistration = (id: string) => {
    navigate(`/register/${id}`)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Torneos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus torneos creados</p>
        </div>
        <Link to="/create">
          <Button>+ Crear Torneo</Button>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
          title="Sin torneos aún"
          description="Crea tu primer torneo para empezar a organizar competiciones"
          action={<Link to="/create"><Button>Crear mi primer torneo</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(t => (
            <Card key={t.id} className="p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{t.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.game}</p>
                </div>
                <Badge variant={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="info">{t.format.replace('_', ' ').toUpperCase()}</Badge>
                {t.settings.groupStage?.enabled && <Badge variant="warning">Grupos + Bracket</Badge>}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Bo{t.settings.bestOf}</span>
                <span>{t.settings.seedMethod}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Link to={`/t/${t.id}`} className="flex-1 text-center">
                  <Button variant="outline" size="sm" className="w-full">Gestionar</Button>
                </Link>
                {t.status === 'draft' && (
                  <Link to={`/register/${t.id}`} className="flex-1 text-center">
                    <Button variant="secondary" size="sm" className="w-full">Ver Registro</Button>
                  </Link>
                )}
                {['registration_open', 'check_in'].includes(t.status) && (
                  <Link to={`/register/${t.id}`} className="flex-1 text-center">
                    <Button size="sm" className="w-full">Inscripciones</Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span>Creado: {new Date(t.createdAt).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}>
                  {deletingId === t.id ? <LoadingSpinner size="sm" /> : 'Eliminar'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}