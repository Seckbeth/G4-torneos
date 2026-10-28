import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createTournament } from '../services/supabase'
import { Button, Input, Select, Textarea, Card, Modal, LoadingSpinner } from '../components/ui'
import type { Tournament, TournamentFormat, TournamentSettings } from '../types/tournament'

const FORMATS: { value: TournamentFormat; label: string; description: string }[] = [
  { value: 'double_elimination', label: 'Doble Eliminación', description: 'Winners + Losers bracket, Grand Finals. Estándar FGC/EVO' },
  { value: 'single_elimination', label: 'Eliminación Directa', description: 'Single elimination clásico. Rápido y simple' },
  { value: 'groups_then_bracket', label: 'Grupos + Bracket Final', description: 'Fase de grupos (Round Robin) → Top 8/16/32 a DE. Formato TNS/EVO' },
  { value: 'swiss', label: 'Suizo', description: 'Rondas suizas por ranking. Sin eliminación' },
  { value: 'round_robin', label: 'Round Robin', description: 'Todos contra todos. Para ligas y grupos pequeños' },
]

const COMMON_GAMES = [
  'Street Fighter 6', 'Tekken 8', 'Guilty Gear Strive', 'King of Fighters XV',
  'Super Smash Bros. Ultimate', 'Mortal Kombat 1', 'Dragon Ball FighterZ',
  'Melty Blood: Type Lumina', 'Under Night In-Birth II', 'Granblue Fantasy Versus: Rising',
  'Otro...'
]

const DEFAULT_CHARACTERS = [
  'Ryu', 'Ken', 'Chun-Li', 'Guile', 'Zangief', 'Dhalsim', 'Blanka', 'E. Honda',
  'Luke', 'Jamie', 'Kimberly', 'Lily', 'JP', 'Marisa', 'Manon', 'Dee Jay', 'Cammy'
]

export function CreateTournament() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdTournamentId, setCreatedTournamentId] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Tournament> & { settings: Partial<TournamentSettings> }>({
    name: '',
    game: '',
    description: '',
    format: 'double_elimination',
    registrationOpen: true,
    checkInEnabled: true,
    settings: {
      doubleElimination: true,
      grandFinalsReset: true,
      seedMethod: 'manual',
      bestOf: 3,
      allowCharacterSelection: false,
      characters: DEFAULT_CHARACTERS,
      randomCharacterAssignment: false,
      streamQueueEnabled: true,
      groupStage: {
        enabled: false,
        groupsCount: 4,
        participantsPerGroup: 8,
        advancePerGroup: 2,
        bracketSize: 16,
      },
    },
  })

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSettingsChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }))
  }

  const handleGroupSettingsChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      settings: { ...prev.settings, groupStage: { ...prev.settings!.groupStage!, [field]: value } },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!form.name || !form.game) {
      setError('Nombre y juego son obligatorios')
      setLoading(false)
      return
    }

    if (!user) {
      setError('Debes iniciar sesión para crear un torneo')
      setLoading(false)
      return
    }

    try {
      const tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'> = {
        name: form.name,
        game: form.game,
        description: form.description,
        format: form.format!,
        status: 'draft',
        maxParticipants: form.settings?.groupStage?.enabled ? form.settings.groupStage.groupsCount * form.settings.groupStage.participantsPerGroup : 64,
        registrationOpen: form.registrationOpen,
        checkInEnabled: form.checkInEnabled,
        settings: {
          doubleElimination: form.settings?.doubleElimination ?? true,
          grandFinalsReset: form.settings?.grandFinalsReset ?? true,
          seedMethod: form.settings?.seedMethod ?? 'manual',
          bestOf: form.settings?.bestOf ?? 3,
          allowCharacterSelection: form.settings?.allowCharacterSelection ?? false,
          characters: form.settings?.characters ?? DEFAULT_CHARACTERS,
          randomCharacterAssignment: form.settings?.randomCharacterAssignment ?? false,
          streamQueueEnabled: form.settings?.streamQueueEnabled ?? true,
          groupStage: form.settings?.groupStage,
        },
        createdBy: user.id,
        currentRound: 0,
        totalRounds: 0,
      }

      const id = await createTournament(tournamentData)
      setCreatedTournamentId(id)
      setShowSuccess(true)
    } catch (e) {
      setError('Error al crear el torneo. Intenta de nuevo.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const goToTournament = () => {
    if (createdTournamentId) {
      navigate(`/t/${createdTournamentId}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Torneo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configura tu torneo estilo EVO/Start.gg</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Básica</h2>
          <div className="space-y-4">
            <Input
              label="Nombre del Torneo *"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ej: EVO 2024 Qualifier - Madrid"
              required
            />
            <Select
              label="Juego *"
              value={form.game}
              onChange={e => handleChange('game', e.target.value)}
              required
            >
              {COMMON_GAMES.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Textarea
              label="Descripción / Reglas"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Reglas del torneo, links a Discord, premios, etc."
              rows={3}
            />
          </div>
        </Card>

        {/* Format Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formato de Competición</h2>
          <div className="space-y-3">
            {FORMATS.map(fmt => (
              <label key={fmt.value} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value={fmt.value}
                  checked={form.format === fmt.value}
                  onChange={e => handleChange('format', e.target.value)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{fmt.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{fmt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Format-specific settings */}
        {form.format === 'groups_then_bracket' && (
          <Card className="p-6 border-indigo-200 dark:border-indigo-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600">⚙️</span> Configuración de Grupos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Grupos"
                type="number"
                value={form.settings?.groupStage?.groupsCount}
                onChange={e => handleGroupSettingsChange('groupsCount', parseInt(e.target.value) || 0)}
                min={2}
                max={16}
              />
              <Input
                label="Participantes por Grupo"
                type="number"
                value={form.settings?.groupStage?.participantsPerGroup}
                onChange={e => handleGroupSettingsChange('participantsPerGroup', parseInt(e.target.value) || 0)}
                min={4}
                max={16}
              />
              <Input
                label="Clasificados por Grupo"
                type="number"
                value={form.settings?.groupStage?.advancePerGroup}
                onChange={e => handleGroupSettingsChange('advancePerGroup', parseInt(e.target.value) || 0)}
                min={1}
                max={8}
              />
              <Select
                label="Tamaño Bracket Final"
                value={String(form.settings?.groupStage?.bracketSize || 16)}
                onChange={e => handleGroupSettingsChange('bracketSize', parseInt(e.target.value))}
              >
                <option value="8">Top 8</option>
                <option value="16">Top 16</option>
                <option value="32">Top 32</option>
                <option value="64">Top 64</option>
              </Select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Total estimado: {((form.settings?.groupStage?.groupsCount || 4) * (form.settings?.groupStage?.participantsPerGroup || 8))} participantes → Top {(form.settings?.groupStage?.groupsCount || 4) * (form.settings?.groupStage?.advancePerGroup || 2)} a bracket final
            </p>
          </Card>
        )}

        {/* Advanced Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración Avanzada</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Best of"
                type="number"
                value={form.settings?.bestOf}
                onChange={e => handleSettingsChange('bestOf', parseInt(e.target.value) || 1)}
                min={1}
                max={7}
              />
              <Select
                label="Método de Seeding"
                value={form.settings?.seedMethod || 'manual'}
                onChange={e => handleSettingsChange('seedMethod', e.target.value as any)}
              >
                <option value="manual">Manual (por jueces)</option>
                <option value="random">Aleatorio</option>
                <option value="ranking">Por Ranking</option>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.settings?.grandFinalsReset}
                  onChange={e => handleSettingsChange('grandFinalsReset', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Grand Finals Reset (bracket reset)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.registrationOpen}
                  onChange={e => handleChange('registrationOpen', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Inscripciones abiertas al crear</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.checkInEnabled}
                  onChange={e => handleChange('checkInEnabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Check-in obligatorio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.settings?.streamQueueEnabled}
                  onChange={e => handleSettingsChange('streamQueueEnabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cola de Streaming (Stream Queue)</span>
              </label>
            </div>

            {/* Character Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings?.allowCharacterSelection}
                    onChange={e => handleSettingsChange('allowCharacterSelection', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Selección de Personajes</span>
                </label>
                {form.settings?.allowCharacterSelection && (
                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={form.settings?.randomCharacterAssignment}
                      onChange={e => handleSettingsChange('randomCharacterAssignment', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ruleta Aleatoria (Randomizer)</span>
                  </label>
                )}
              </div>

              {form.settings?.allowCharacterSelection && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lista de Personajes (uno por línea)
                  </label>
                  <Textarea
                    value={form.settings?.characters?.join('\n') || ''}
                    onChange={e => handleSettingsChange('characters', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                    rows={4}
                    placeholder={DEFAULT_CHARACTERS.join('\n')}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/my-tournaments')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? <LoadingSpinner size="sm" /> : 'Crear Torneo'}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); goToTournament(); }}
        title="¡Torneo Creado!"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 text-green-500">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tu torneo está listo</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ahora puedes abrir inscripciones, gestionar check-in y generar el bracket.
          </p>
          <Button onClick={goToTournament} className="w-full sm:w-auto">
            Ir al Torneo
          </Button>
        </div>
      </Modal>
    </div>
  )
}