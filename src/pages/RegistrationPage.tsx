import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTournament, addParticipant } from '../services/supabase'
import { Button, Input, Card, LoadingSpinner, Badge, Modal } from '../components/ui'
import { QRCodeSVG } from 'qrcode.react'
import type { Tournament, Participant } from '../types/tournament'

export function RegistrationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    tag: '',
    email: '',
    discord: '',
  })

  useEffect(() => {
    if (id) {
      getTournament(id).then(t => {
        setTournament(t)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament || !form.name.trim()) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      await addParticipant(tournament.id, {
        tournamentId: tournament.id,
        name: form.name.trim(),
        tag: form.tag.trim(),
        email: form.email.trim() || undefined,
        discord: form.discord.trim() || undefined,
        seed: 999, // Will be re-seeded by admin
        status: 'registered',
      })
      setSuccess(true)
      setForm({ name: '', tag: '', email: '', discord: '' })
    } catch (e) {
      setError('Error al inscribirse. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Torneo no encontrado</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">El torneo no existe o ha sido eliminado.</p>
          <Link to="/"><Button>Volver al inicio</Button></Link>
        </Card>
      </div>
    )
  }

  if (!tournament.registrationOpen && tournament.status !== 'draft') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inscripciones Cerradas</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Las inscripciones para este torneo están cerradas.</p>
          <Badge variant={tournament.status === 'in_progress' ? 'success' : 'default'}>
            Estado: {tournament.status}
          </Badge>
        </Card>
      </div>
    )
  }

  const registrationUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{tournament.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{tournament.game}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Badge variant="info">{tournament.format.replace('_', ' ').toUpperCase()}</Badge>
            <Badge variant="warning">Inscripciones Abiertas</Badge>
          </div>
        </div>

        {/* QR Code for mobile sharing */}
        <div className="mb-6 text-center">
          <button 
            onClick={() => setShowQR(true)}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Escanea para inscribirte desde móvil</p>
            <QRCodeSVG value={registrationUrl} size={180} level="M" />
          </button>
        </div>

        {/* Registration Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Formulario de Inscripción</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre Completo *"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Tu nombre real"
              required
              autoComplete="name"
            />
            
            <Input
              label="Tag / Nickname"
              value={form.tag}
              onChange={e => setForm({...form, tag: e.target.value})}
              placeholder="Tu tag de jugador (ej: Daigo, Tokido...)"
              autoComplete="nickname"
            />
            
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            
            <Input
              label="Discord"
              value={form.discord}
              onChange={e => setForm({...form, discord: e.target.value})}
              placeholder="Usuario#1234 o @usuario"
              autoComplete="username"
            />

            {tournament.settings.allowCharacterSelection && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  🎲 Este torneo usa <strong>ruleta de personajes</strong>. Tu personaje se asignará aleatoriamente al generar el bracket.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting} size="lg">
              {submitting ? <LoadingSpinner size="sm" /> : 'Inscribirme al Torneo'}
            </Button>
          </form>
        </Card>

        {/* Tournament Info */}
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información del Torneo</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Formato</dt><dd className="font-medium">{tournament.format.replace('_', ' ')}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Best of</dt><dd className="font-medium">{tournament.settings.bestOf}</dd></div>
            {tournament.settings.groupStage?.enabled && (
              <>
                <div className="flex justify-between"><dt className="text-gray-500">Fase de Grupos</dt><dd className="font-medium">{tournament.settings.groupStage.groupsCount} grupos de {tournament.settings.groupStage.participantsPerGroup}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Clasifican</dt><dd className="font-medium">Top {tournament.settings.groupStage.advancePerGroup} por grupo → Bracket Top {tournament.settings.groupStage.bracketSize}</dd></div>
              </>
            )}
            {tournament.checkInEnabled && (
              <div className="flex justify-between"><dt className="text-gray-500">Check-in</dt><dd className="font-medium text-orange-600">Obligatorio antes de empezar</dd></div>
            )}
          </dl>
          
          {tournament.description && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              {tournament.description}
            </div>
          )}
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:underline">← Volver al inicio</Link>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={success} onClose={() => setSuccess(false)} title="¡Inscripción Exitosa!">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 text-green-500">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">¡Te has inscrito correctamente!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {tournament.checkInEnabled 
              ? 'Recibirás notificación cuando abra el check-in. ¡No olvides confirmar tu asistencia!' 
              : 'Estarás listo para el torneo. El organizador publicará el bracket cuando esté listo.'}
          </p>
          <Button onClick={() => setSuccess(false)} className="w-full sm:w-auto">Entendido</Button>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Código QR de Inscripción">
        <div className="text-center">
          <QRCodeSVG value={registrationUrl} size={256} level="M" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Comparte este QR con otros jugadores</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 break-all">{registrationUrl}</p>
        </div>
      </Modal>
    </div>
  )
}