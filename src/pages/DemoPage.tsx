import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Badge, Tabs } from '../components/ui'

const DEMO_TOURNAMENT = {
  name: 'EVO 2024 Qualifier - Madrid',
  game: 'Street Fighter 6',
  format: 'Grupos + Doble Eliminación',
  status: 'in_progress',
  participants: [
    { name: 'Daigo Umehara', tag: 'Daigo', seed: 1, status: 'checked_in', character: 'Ryu' },
    { name: 'Tokido', tag: 'Tokido', seed: 2, status: 'checked_in', character: 'Ken' },
    { name: 'Punk', tag: 'Punk', seed: 3, status: 'checked_in', character: 'Cammy' },
    { name: 'iDom', tag: 'iDom', seed: 4, status: 'checked_in', character: 'Laura' },
    { name: 'Kawano', tag: 'Kawano', seed: 5, status: 'checked_in', character: 'Dhalsim' },
    { name: 'MenaRD', tag: 'MenaRD', seed: 6, status: 'checked_in', character: 'Guile' },
    { name: 'AngryBird', tag: 'AngryBird', seed: 7, status: 'checked_in', character: 'Rashid' },
    { name: 'Haitani', tag: 'Haitani', seed: 8, status: 'checked_in', character: 'Sakura' },
    { name: 'Problem X', tag: 'ProblemX', seed: 9, status: 'checked_in', character: 'M. Bison' },
    { name: 'Fujimura', tag: 'Fujimura', seed: 10, status: 'checked_in', character: 'Akuma' },
    { name: 'Bonchan', tag: 'Bonchan', seed: 11, status: 'checked_in', character: 'Karin' },
    { name: 'Nemo', tag: 'Nemo', seed: 12, status: 'checked_in', character: 'Urien' },
    { name: 'Kakeru', tag: 'Kakeru', seed: 13, status: 'checked_in', character: 'JP' },
    { name: 'Oil King', tag: 'OilKing', seed: 14, status: 'checked_in', character: 'Marisa' },
    { name: 'Ryota', tag: 'Ryota', seed: 15, status: 'checked_in', character: 'Lily' },
    { name: 'YHC-Mochi', tag: 'Mochi', seed: 16, status: 'checked_in', character: 'Kimberly' },
  ],
  matches: [
    { round: 1, bracket: 'winners', p1: 'Daigo Umehara', p2: 'YHC-Mochi', score: '2-0', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'Tokido', p2: 'Ryota', score: '2-1', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'Punk', p2: 'Oil King', score: '2-0', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'iDom', p2: 'Kakeru', score: '2-1', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'Kawano', p2: 'Nemo', score: '2-0', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'MenaRD', p2: 'Bonchan', score: '2-0', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'AngryBird', p2: 'Fujimura', score: '1-2', status: 'completed' },
    { round: 1, bracket: 'winners', p1: 'Haitani', p2: 'Problem X', score: '2-0', status: 'completed' },
    { round: 2, bracket: 'winners', p1: 'Daigo Umehara', p2: 'Haitani', score: '2-1', status: 'completed' },
    { round: 2, bracket: 'winners', p1: 'Tokido', p2: 'Fujimura', score: '2-0', status: 'completed' },
    { round: 2, bracket: 'winners', p1: 'Punk', p2: 'MenaRD', score: '2-1', status: 'completed' },
    { round: 2, bracket: 'winners', p1: 'iDom', p2: 'Kawano', score: '2-0', status: 'completed' },
    { round: 3, bracket: 'winners', p1: 'Daigo Umehara', p2: 'Tokido', score: '3-2', status: 'completed' },
    { round: 3, bracket: 'winners', p1: 'Punk', p2: 'iDom', score: '3-1', status: 'completed' },
    { round: 4, bracket: 'winners', p1: 'Daigo Umehara', p2: 'Punk', score: '3-2', status: 'in_progress' },
    { round: 1, bracket: 'losers', p1: 'YHC-Mochi', p2: 'Ryota', score: '2-0', status: 'completed' },
    { round: 1, bracket: 'losers', p1: 'Oil King', p2: 'Kakeru', score: '0-2', status: 'completed' },
    { round: 1, bracket: 'losers', p1: 'Nemo', p2: 'Bonchan', score: '2-1', status: 'completed' },
    { round: 1, bracket: 'losers', p1: 'AngryBird', p2: 'Problem X', score: '2-0', status: 'completed' },
  ]
}

const MOCK_BRACKET_ROUNDS = [
  { round: 1, label: 'Ronda 1 (16→8)', matches: 8 },
  { round: 2, label: 'Ronda 2 (8→4)', matches: 4 },
  { round: 3, label: 'Semifinales (4→2)', matches: 2 },
  { round: 4, label: 'Final Winners', matches: 1 },
]

export function DemoPage() {
  const [activeTab, setActiveTab] = useState<'bracket' | 'participants' | 'matches'>('bracket')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="font-bold text-xl text-gray-900 dark:text-white">App de Torneos</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/create">
                <Button>Crear mi Torneo</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Info */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{DEMO_TOURNAMENT.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{DEMO_TOURNAMENT.game}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="info">{DEMO_TOURNAMENT.format}</Badge>
              <Badge variant="success">{DEMO_TOURNAMENT.status.replace('_', ' ')}</Badge>
              <Badge variant="warning">16 Participantes</Badge>
              <Badge variant="default">Best of 3</Badge>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <p className="text-indigo-700 dark:text-indigo-300">
              <strong>Modo Demo:</strong> Esta es una vista de demostración con datos simulados. 
              Los brackets, participantes y resultados son de ejemplo. 
              <Link to="/create" className="underline hover:text-indigo-600">Crea tu propio torneo</Link> para empezar de verdad.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'bracket', label: 'Bracket Principal' },
            { id: 'participants', label: 'Participantes (16)' },
            { id: 'matches', label: 'Partidas' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Bracket View */}
        {activeTab === 'bracket' && (
          <div className="mt-6 bracket-scroll overflow-auto p-4">
            <div className="flex flex-row gap-8 pb-8 min-w-max">
              {MOCK_BRACKET_ROUNDS.map((r, i) => (
                <div key={r.round} className="flex flex-col gap-3 min-w-[280px]">
                  <div className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-center font-medium sticky top-4">
                    {r.label}
                  </div>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: r.matches }).map((_, j) => {
                      const match = DEMO_TOURNAMENT.matches.find(m => m.round === r.round && m.bracket === 'winners')
                      const isLive = r.round === 4 && j === 0
                      return (
                        <div 
                          key={`${r.round}-${j}`}
                          className={`relative p-3 rounded-lg transition-all ${isLive ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 animate-pulse' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-gray-500">W{match ? '' : r.round}-{j + 1}</span>
                            {isLive && (
                              <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                EN VIVO
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="flex-1 truncate">{match?.p1 || 'Por definir'}</span>
                              {match?.score && <span className="font-mono text-green-600">{match.score.split('-')[0]}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex-1 truncate">{match?.p2 || 'Por definir'}</span>
                              {match?.score && <span className="font-mono text-red-600">{match.score.split('-')[1]}</span>}
                            </div>
                          </div>
                          {match?.status === 'completed' && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Finalizada</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {/* Losers Bracket */}
              <div className="flex flex-col gap-3 min-w-[280px] border-l-2 border-indigo-500 pl-8">
                <div className="px-3 py-2 bg-red-600 text-white rounded-lg text-center font-medium sticky top-4">
                  Losers Bracket
                </div>
                <div className="flex flex-col gap-3">
                  {DEMO_TOURNAMENT.matches.filter(m => m.bracket === 'losers').slice(0, 4).map((m, j) => (
                    <div key={`l-${m.round}-${j}`} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-mono text-gray-500 mb-1">L{m.round}-{j + 1}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 truncate">{m.p1}</span>
                          <span className="font-mono text-green-600">{m.score.split('-')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 truncate">{m.p2}</span>
                          <span className="font-mono text-red-600">{m.score.split('-')[1]}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Finalizada</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants View */}
        {activeTab === 'participants' && (
          <Card className="mt-6 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="pb-2 pr-4 px-4">Seed</th>
                    <th className="pb-2 pr-4 px-4">Nombre</th>
                    <th className="pb-2 pr-4 px-4">Tag</th>
                    <th className="pb-2 pr-4 px-4">Personaje</th>
                    <th className="pb-2 pr-4 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_TOURNAMENT.participants.map(p => (
                    <tr key={p.name} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 pr-4 px-4 font-mono text-gray-900 dark:text-white">{p.seed}</td>
                      <td className="py-3 pr-4 px-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-3 pr-4 px-4 text-gray-500 dark:text-gray-400">{p.tag}</td>
                      <td className="py-3 pr-4 px-4">
                        <Badge variant="default">{p.character}</Badge>
                      </td>
                      <td className="py-3 pr-4 px-4">
                        <Badge variant="success">✓ Check-in</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Matches View */}
        {activeTab === 'matches' && (
          <Card className="mt-6 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="pb-2 pr-4 px-4">Ronda</th>
                    <th className="pb-2 pr-4 px-4">Bracket</th>
                    <th className="pb-2 pr-4 px-4">Jugador 1</th>
                    <th className="pb-2 pr-4 px-4">Jugador 2</th>
                    <th className="pb-2 pr-4 px-4">Resultado</th>
                    <th className="pb-2 pr-4 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_TOURNAMENT.matches.map((m, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 pr-4 px-4 font-mono text-gray-900 dark:text-white">R{m.round}</td>
                      <td className="py-3 pr-4 px-4">
                        <Badge variant={m.bracket === 'winners' ? 'info' : 'warning'}>
                          {m.bracket === 'winners' ? 'W' : 'L'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 px-4 font-medium text-gray-900 dark:text-white">{m.p1}</td>
                      <td className="py-3 pr-4 px-4 text-gray-500 dark:text-gray-400">{m.p2}</td>
                      <td className="py-3 pr-4 px-4 font-mono">
                        {m.status === 'in_progress' ? 'En juego...' : m.score}
                      </td>
                      <td className="py-3 pr-4 px-4">
                        <Badge variant={
                          m.status === 'completed' ? 'success' :
                          m.status === 'in_progress' ? 'warning' : 'default'
                        }>
                          {m.status === 'completed' ? '✓' : m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="p-8 md:p-12 bg-indigo-600 border-indigo-600">
            <h2 className="text-3xl font-bold text-white mb-4">¿Listo para tu torneo real?</h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Crea tu torneo con bracket interactivo, check-in por QR, seeding manual, 
              ruleta de personajes, stream queue y overlays para OBS. Todo gratis en GitHub Pages + Firebase.
            </p>
            <Link to="/create">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 bg-white text-indigo-600 hover:bg-indigo-50 text-lg">
                Crear mi Torneo Gratis
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}