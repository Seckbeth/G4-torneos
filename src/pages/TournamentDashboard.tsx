import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  getTournament, 
  updateTournament, 
  addParticipant, 
  bulkAddParticipants,
  bulkAddMatches 
} from '../services/supabase'
import { generateBracket, assignRandomCharacters } from '../lib/bracketLogic'
import { useTournamentStore, useTournament, useParticipants, useMatches, useIsLoading } from '../store/tournamentStore'
import { Button, Input, Select, Card, Badge, Modal, LoadingSpinner, Tabs, EmptyState } from '../components/ui'
import { QRCodeSVG } from 'qrcode.react'
import type { Tournament, Participant, TournamentFormat, TournamentStatus } from '../types/tournament'

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

export function TournamentDashboard() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const tournament = useTournament()
  const participants = useParticipants()
  const matches = useMatches()
  const isLoading = useIsLoading()
  const { initListeners, setTournament, reset } = useTournamentStore()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'bracket' | 'settings'>('overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [showGenerateBracket, setShowGenerateBracket] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkNames, setBulkNames] = useState('')
  const [newParticipant, setNewParticipant] = useState({ name: '', tag: '', seed: 1 })

  useEffect(() => {
    if (id) {
      initListeners(id)
      // Load initial tournament data
      getTournament(id).then(t => {
        if (t) setTournament(t)
      })
    }
    return () => reset()
  }, [id])

  const isAdmin = user && tournament?.createdBy === user.id
  const canManage = isAdmin || user?.role === 'admin'

  const handleStatusChange = async (newStatus: TournamentStatus) => {
    if (!tournament || !canManage) return
    setSaving(true)
    try {
      await updateTournament(tournament.id, { status: newStatus })
    } catch (e) {
      setError('Error al cambiar estado')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateBracket = async () => {
    if (!tournament || !canManage) return
    setSaving(true)
    try {
      const newMatches = generateBracket(participants, tournament)
      await bulkAddMatches(tournament.id, newMatches.map(m => {
        const { id, createdAt, updatedAt, ...rest } = m
        return rest
      }))
      await updateTournament(tournament.id, { 
        status: 'in_progress',
        currentRound: 1,
        totalRounds: Math.max(...newMatches.map(m => m.round))
      })
      setShowGenerateBracket(false)
    } catch (e) {
      setError('Error al generar bracket')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleRandomizeCharacters = async () => {
    if (!tournament || !canManage) return
    const assignments = assignRandomCharacters(
      participants.filter(p => p.status === 'checked_in' || p.status === 'registered'),
      tournament.settings.characters
    )
    // Update participants with characters
    for (const [pid, char] of assignments) {
      // Would need updateParticipant function
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament || !newParticipant.name) return
    setSaving(true)
    try {
      await addParticipant(tournament.id, {
        tournamentId: tournament.id,
        name: newParticipant.name,
        tag: newParticipant.tag,
        seed: newParticipant.seed,
        status: 'registered',
      })
      setNewParticipant({ name: '', tag: '', seed: participants.length + 1 })
      setShowAddParticipant(false)
    } catch (e) {
      setError('Error al agregar participante')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament || !bulkNames.trim()) return
    setSaving(true)
    try {
      const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean)
      const participantsData = names.map((name, i) => ({
        tournamentId: tournament.id,
        name,
        seed: participants.length + i + 1,
        status: 'registered' as const,
      }))
      await bulkAddParticipants(tournament.id, participantsData)
      setBulkNames('')
      setShowBulkImport(false)
    } catch (e) {
      setError('Error al importar participantes')
    } finally {
      setSaving(false)
    }
  }

  const registrationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register/${tournament?.id}`
    : ''

  const checkedInCount = participants.filter(p => p.status === 'checked_in').length
  const registeredCount = participants.filter(p => p.status === 'registered').length

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
            <Badge variant={STATUS_COLORS[tournament.status]}>
              {STATUS_LABELS[tournament.status]}
            </Badge>
            <Badge variant="info">{tournament.format.replace('_', ' ').toUpperCase()}</Badge>
            {tournament.settings.groupStage?.enabled && (
              <Badge variant="warning">Grupos + Bracket</Badge>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">{tournament.game}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={() => setShowQR(true)}>Ver QR</Button>
              <Button variant="outline" onClick={() => setShowGenerateBracket(true)} disabled={participants.length < 2}>
                Generar Bracket
              </Button>
              <Button variant="outline" onClick={() => setShowAddParticipant(true)}>+ Jugador</Button>
              <Button variant="outline" onClick={() => setShowBulkImport(true)}>Importar</Button>
            </>
          )}
          <Link to={`/t/${tournament.id}/bracket`}>
            <Button>Ver Bracket Público</Button>
          </Link>
        </div>
      </div>

      {/* Status Actions */}
      {canManage && tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-gray-700 dark:text-gray-300">Cambiar estado:</span>
            {['registration_open', 'check_in', 'in_progress', 'completed'].map(s => (
              <Button
                key={s}
                variant={tournament.status === s ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(s as TournamentStatus)}
                disabled={saving || tournament.status === s}
              >
                {STATUS_LABELS[s as TournamentStatus]}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange('cancelled')}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{participants.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Inscritos</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{checkedInCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Check-in</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Partidas Finalizadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {matches.filter(m => m.status === 'ready' || m.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Resumen' },
          { id: 'participants', label: `Participantes (${participants.length})` },
          { id: 'bracket', label: 'Bracket' },
          { id: 'settings', label: 'Configuración' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información del Torneo</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Juego</dt><dd className="font-medium">{tournament.game}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Formato</dt><dd className="font-medium">{tournament.format.replace('_', ' ')}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Best of</dt><dd className="font-medium">{tournament.settings.bestOf}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Seeding</dt><dd className="font-medium">{tournament.settings.seedMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Grand Finals Reset</dt><dd className="font-medium">{tournament.settings.grandFinalsReset ? 'Sí' : 'No'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Personajes</dt><dd className="font-medium">{tournament.settings.allowCharacterSelection ? 'Habilitado' : 'Deshabilitado'}</dd></div>
              {tournament.settings.groupStage?.enabled && (
                <>
                  <div className="flex justify-between"><dt className="text-gray-500">Grupos</dt><dd className="font-medium">{tournament.settings.groupStage.groupsCount}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Por grupo</dt><dd className="font-medium">{tournament.settings.groupStage.participantsPerGroup}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Clasificados</dt><dd className="font-medium">{tournament.settings.groupStage.advancePerGroup} por grupo</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Bracket Final</dt><dd className="font-medium">Top {tournament.settings.groupStage.bracketSize}</dd></div>
                </>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Enlaces de Acceso</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Registro Público</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={registrationUrl}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg"
                  />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(registrationUrl)}>
                    Copiar
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bracket Público</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/t/${tournament.id}/bracket`}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg"
                  />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/t/${tournament.id}/bracket`)}>
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'participants' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Participantes</h3>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddParticipant(true)}>Agregar Uno</Button>
                <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>Importar Lista</Button>
              </div>
            )}
          </div>

          {participants.length === 0 ? (
            <EmptyState
              icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
              title="Sin participantes"
              description="Los jugadores se inscriben vía link público o agrégalos manualmente"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4">Seed</th>
                    <th className="pb-2 pr-4">Nombre</th>
                    <th className="pb-2 pr-4">Tag</th>
                    <th className="pb-2 pr-4">Estado</th>
                    <th className="pb-2 pr-4">Personaje</th>
                    <th className="pb-2 pr-4">Grupo</th>
                    {canManage && <th className="pb-2">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {participants
                    .sort((a, b) => a.seed - b.seed)
                    .map(p => (
                      <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 pr-4 font-mono text-gray-900 dark:text-white">{p.seed}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{p.tag || '-'}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={
                            p.status === 'checked_in' ? 'success' :
                            p.status === 'registered' ? 'info' :
                            p.status === 'disqualified' ? 'error' : 'warning'
                          }>
                            {p.status === 'checked_in' ? '✓ Check-in' : p.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{p.character || '-'}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{p.group || '-'}</td>
                        {canManage && (
                          <td className="py-3">
                            <div className="flex gap-1">
                              <button className="p-1 text-gray-400 hover:text-indigo-600" title="Editar">✏️</button>
                              <button className="p-1 text-gray-400 hover:text-red-600" title="Eliminar">🗑️</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'bracket' && (
        <Card className="p-6">
          <Link to={`/t/${tournament.id}/bracket`} className="block">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ver Bracket Completo</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Bracket interactivo con tiempo real, zoom, navegación</p>
              <Button>Abrir Bracket</Button>
            </div>
          </Link>
        </Card>
      )}

      {activeTab === 'settings' && canManage && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Configuración</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <Input
                value={tournament.name}
                onChange={e => updateTournament(tournament.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <Input
                value={tournament.description || ''}
                onChange={e => updateTournament(tournament.id, { description: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tournament.registrationOpen}
                  onChange={e => updateTournament(tournament.id, { registrationOpen: e.target.checked })}
                  className="h-4 w-4 text-indigo-600"
                />
                Inscripciones abiertas
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tournament.checkInEnabled}
                  onChange={e => updateTournament(tournament.id, { checkInEnabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600"
                />
                Check-in obligatorio
              </label>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <Button variant="danger" onClick={() => {
                if (confirm('¿Eliminar este torneo permanentemente?')) {
                  // deleteTournament(tournament.id)
                  navigate('/my-tournaments')
                }
              }}>
                Eliminar Torneo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Código QR de Registro">
        <div className="text-center">
          <QRCodeSVG value={registrationUrl} size={200} level="M" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Escanea para inscribirse</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{registrationUrl}</p>
        </div>
      </Modal>

      <Modal isOpen={showGenerateBracket} onClose={() => setShowGenerateBracket(false)} title="Generar Bracket" confirmAction={handleGenerateBracket} confirmLabel="Generar" loading={saving}>
        <p className="text-gray-600 dark:text-gray-400">
          Se generará el bracket completo con {participants.length} participantes.
          <strong>Esta acción no se puede deshacer fácilmente.</strong>
        </p>
        <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <li>• Formato: {tournament.format.replace('_', ' ')}</li>
          <li>• Best of: {tournament.settings.bestOf}</li>
          <li>• Seeding: {tournament.settings.seedMethod}</li>
          {tournament.settings.allowCharacterSelection && <li>• Personajes: Ruleta aleatoria</li>}
        </ul>
      </Modal>

      <Modal isOpen={showAddParticipant} onClose={() => setShowAddParticipant(false)} title="Agregar Participante" confirmAction={handleAddParticipant} confirmLabel="Agregar" loading={saving}>
        <form onSubmit={handleAddParticipant} className="space-y-3">
          <Input label="Nombre *" value={newParticipant.name} onChange={e => setNewParticipant({...newParticipant, name: e.target.value})} required />
          <Input label="Tag" value={newParticipant.tag} onChange={e => setNewParticipant({...newParticipant, tag: e.target.value})} />
          <Input label="Seed" type="number" value={newParticipant.seed} onChange={e => setNewParticipant({...newParticipant, seed: parseInt(e.target.value) || 1})} />
        </form>
      </Modal>

      <Modal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} title="Importar Participantes" confirmAction={handleBulkImport} confirmLabel="Importar" loading={saving}>
        <Textarea
          label="Nombres (uno por línea)"
          value={bulkNames}
          onChange={e => setBulkNames(e.target.value)}
          placeholder="Juan Pérez\nMaría García\nCarlos López\n..."
          rows={8}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Se asignarán seeds automáticamente después de los existentes</p>
      </Modal>
    </div>
  )
}