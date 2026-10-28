import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTournament } from '../services/supabase'
import { subscribeParticipants, updateParticipant } from '../services/supabase'
import { Button, Card, Badge, LoadingSpinner, Input } from '../components/ui'
import { useTournamentStore } from '../store/tournamentStore'
import type { Tournament, Participant } from '../types/tournament'

export function CheckInPage() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const { initListeners, reset } = useTournamentStore()

  useEffect(() => {
    if (id) {
      initListeners(id)
      getTournament(id).then(t => {
        setTournament(t)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
    return () => reset()
  }, [id])

  const filteredParticipants = participants
    .filter(p => p.status === 'registered' || p.status === 'checked_in')
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tag?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.seed - b.seed)

  const handleCheckIn = async (participantId: string) => {
    setCheckingIn(participantId)
    try {
      await updateParticipant(id!, participantId, { 
        status: 'checked_in', 
        checkedInAt: Date.now() 
      })
    } catch (e) {
      alert('Error al hacer check-in')
    } finally {
      setCheckingIn(null)
    }
  }

  const handleUndoCheckIn = async (participantId: string) => {
    try {
      await updateParticipant(id!, participantId, { 
        status: 'registered', 
        checkedInAt: undefined 
      })
    } catch (e) {
      alert('Error al deshacer check-in')
    }
  }

  const checkedInCount = participants.filter(p => p.status === 'checked_in').length
  const registeredCount = participants.filter(p => p.status === 'registered').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Torneo no encontrado</h1>
          <Link to="/"><Button>Volver al inicio</Button></Link>
        </Card>
      </div>
    )
  }

  if (!tournament.checkInEnabled || tournament.status !== 'check_in') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {tournament.checkInEnabled ? 'Check-in no disponible' : 'Check-in no habilitado'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {tournament.checkInEnabled 
              ? `El check-in solo está disponible cuando el torneo está en estado "Check-in". Estado actual: ${tournament.status}`
              : 'El organizador no ha habilitado el check-in para este torneo.'}
          </p>
          <Link to={`/t/${tournament.id}`}><Button>Ir al Torneo</Button></Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{tournament.game}</p>
            </div>
            <Badge variant="warning" className="text-lg px-4 py-2">CHECK-IN ACTIVO</Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900 dark:text-white">Progreso del Check-in</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {checkedInCount} / {checkedInCount + registeredCount}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${checkedInCount + registeredCount > 0 ? (checkedInCount / (checkedInCount + registeredCount)) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{checkedInCount} confirmados</span>
              <span>{registeredCount} pendientes</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            label="Buscar participante"
            placeholder="Nombre o tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Participants List */}
        <Card className="p-0 overflow-hidden">
          {filteredParticipants.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No hay participantes pendientes de check-in</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParticipants.map(p => (
                <div 
                  key={p.id} 
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    p.status === 'checked_in' ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold font-mono text-lg flex-shrink-0">
                      {p.seed}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{p.name}</div>
                      {p.tag && <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.tag}</div>}
                      {p.email && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.email}</div>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={p.status === 'checked_in' ? 'success' : 'info'}>
                      {p.status === 'checked_in' ? '✓ Confirmado' : 'Pendiente'}
                    </Badge>
                    
                    {p.status === 'checked_in' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUndoCheckIn(p.id)}
                        disabled={checkingIn === p.id}
                      >
                        Deshacer
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleCheckIn(p.id)}
                        disabled={checkingIn === p.id}
                      >
                        {checkingIn === p.id ? <LoadingSpinner size="sm" /> : 'Check-in'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <Link to={`/t/${tournament.id}`}>
            <Button variant="outline">Panel de Control</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}