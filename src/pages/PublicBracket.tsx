import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTournamentStore, useTournament, useParticipants, useMatches } from '../store/tournamentStore'
import { getTournament } from '../services/supabase'
import { Button, Card, Badge, LoadingSpinner, Modal, Select } from '../components/ui'
import type { Match, Participant, BracketType } from '../types/tournament'

const BRACKET_LABELS: Record<BracketType, string> = {
  winners: 'Winners Bracket',
  losers: 'Losers Bracket',
  grand_finals: 'Grand Finals',
  groups: 'Fase de Grupos',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
  ready: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 animate-pulse',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  disputed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300',
  cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-400 line-through',
}

export function PublicBracket() {
  const { id } = useParams<{ id: string }>()
  const tournament = useTournament()
  const participants = useParticipants()
  const matches = useMatches()
  const { initListeners, setTournament, reset } = useTournamentStore()
  
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showMatchDetail, setShowMatchDetail] = useState<Match | null>(null)
  const [filterBracket, setFilterBracket] = useState<BracketType | 'all'>('all')
  const [searchPlayer, setSearchPlayer] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      initListeners(id)
      getTournament(id).then(t => t && setTournament(t))
    }
    return () => reset()
  }, [id])

  const participantMap = new Map(participants.map(p => [p.id, p]))

  const filteredMatches = matches.filter(m => {
    if (filterBracket !== 'all' && m.bracketType !== filterBracket) return false
    if (searchPlayer) {
      const p1 = participantMap.get(m.player1Id || '')?.name.toLowerCase() || ''
      const p2 = participantMap.get(m.player2Id || '')?.name.toLowerCase() || ''
      return p1.includes(searchPlayer.toLowerCase()) || p2.includes(searchPlayer.toLowerCase())
    }
    return true
  })

  const groupedByRound = filteredMatches.reduce((acc, match) => {
    const key = `${match.bracketType}-${match.round}`
    if (!acc[key]) acc[key] = { bracketType: match.bracketType, round: match.round, matches: [] }
    acc[key].matches.push(match)
    return acc
  }, {} as Record<string, { bracketType: BracketType; round: number; matches: Match[] }>)

  const sortedGroups = Object.values(groupedByRound).sort((a, b) => {
    const bracketOrder: Record<BracketType, number> = { groups: 0, winners: 1, losers: 2, grand_finals: 3 }
    if (bracketOrder[a.bracketType] !== bracketOrder[b.bracketType]) {
      return bracketOrder[a.bracketType] - bracketOrder[b.bracketType]
    }
    return a.round - b.round
  })

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setScale(prev => Math.max(0.3, Math.min(2.5, prev - e.deltaY * 0.001)))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      e.preventDefault()
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const getWinner = (match: Match) => match.winnerId ? participantMap.get(match.winnerId) : null
  const getLoser = (match: Match) => match.loserId ? participantMap.get(match.loserId) : null

  const renderMatch = (match: Match) => {
    const p1 = match.player1Id ? participantMap.get(match.player1Id) : null
    const p2 = match.player2Id ? participantMap.get(match.player2Id) : null
    const isReady = match.status === 'ready'
    const isLive = match.status === 'in_progress'
    const isCompleted = match.status === 'completed'
    const isDisputed = match.status === 'disputed'

    return (
      <div
        key={match.id}
        className={`relative p-3 rounded-lg transition-all ${STATUS_COLORS[match.status]} ${isLive ? 'ring-2 ring-blue-500' : ''} ${match.onStream ? 'ring-2 ring-red-500' : ''}`}
        onClick={() => setShowMatchDetail(match)}
        style={{ minWidth: 280 }}
      >
        {match.onStream && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 text-red-600 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            EN VIVO
          </div>
        )}
        
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-gray-500">{match.bracketType === 'grand_finals' ? 'GF' : `R${match.round}-${match.position}`}</span>
          {match.bestOf > 1 && <span className="text-xs text-gray-400">Bo{match.bestOf}</span>}
        </div>

        <div className="space-y-1">
          <div className={`flex items-center gap-2 ${isCompleted && match.winnerId === match.player1Id ? 'font-semibold' : ''}`}>
            <span className="flex-1 truncate">{p1?.name || (match.player1Id ? 'Por definir' : 'BYE')}</span>
            {isCompleted && <span className="font-mono">{match.player1Score}</span>}
            {p1?.character && <Badge variant="default" className="text-xs">{p1.character}</Badge>}
          </div>
          <div className={`flex items-center gap-2 ${isCompleted && match.winnerId === match.player2Id ? 'font-semibold' : ''}`}>
            <span className="flex-1 truncate">{p2?.name || (match.player2Id ? 'Por definir' : 'BYE')}</span>
            {isCompleted && <span className="font-mono">{match.player2Score}</span>}
            {p2?.character && <Badge variant="default" className="text-xs">{p2.character}</Badge>}
          </div>
        </div>

        {match.games.length > 0 && isCompleted && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {match.games.map(g => (
              <span key={g.id} className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700">
                {g.player1Score}-{g.player2Score}
              </span>
            ))}
          </div>
        )}

        {isDisputed && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            ⚠️ Disputa: {match.disputeReason}
          </div>
        )}
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-indigo-600 hover:underline text-sm">← Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
          <Badge variant="info">{tournament.format.replace('_', ' ').toUpperCase()}</Badge>
          <Badge variant={tournament.status === 'in_progress' ? 'success' : 'default'}>{tournament.status}</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchPlayer}
              onChange={e => setSearchPlayer(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-48"
            />
          </div>
          
          <Select
            value={filterBracket}
            onChange={e => setFilterBracket(e.target.value as any)}
            className="w-auto"
          >
            <option value="all">Todos</option>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
            <option value="grand_finals">Grand Finals</option>
            <option value="groups">Grupos</option>
          </Select>

          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
            <Button variant="ghost" size="sm" onClick={() => setScale(prev => Math.max(0.3, prev - 0.1))}>-</Button>
            <span className="text-sm font-mono w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setScale(prev => Math.min(2.5, prev + 0.1))}>+</Button>
            <Button variant="ghost" size="sm" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>⌂</Button>
          </div>
        </div>
      </div>

      {/* Bracket Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <div
          ref={contentRef}
          className="absolute top-0 left-0 p-4"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: 'max-content',
          }}
        >
          <div className="flex flex-row gap-8 pb-8">
            {sortedGroups.map(group => (
              <div key={`${group.bracketType}-${group.round}`} className="flex flex-col gap-3 min-w-[300px]">
                <div className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-center font-medium sticky top-4">
                  {BRACKET_LABELS[group.bracketType]} {group.bracketType !== 'grand_finals' ? `- Ronda ${group.round}` : ''}
                  <span className="ml-2 text-xs opacity-80">{group.matches.length} partidas</span>
                </div>
                <div className="flex flex-col gap-3">
                  {group.matches.map(renderMatch)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Detail Modal */}
      <Modal
        isOpen={!!showMatchDetail}
        onClose={() => setShowMatchDetail(null)}
        title="Detalle de Partida"
      >
        {showMatchDetail && (
          <MatchDetailModal
            match={showMatchDetail}
            tournament={tournament}
            participants={participants}
            onClose={() => setShowMatchDetail(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function MatchDetailModal({ match, tournament, participants, onClose }: {
  match: Match
  tournament: any
  participants: Participant[]
  onClose: () => void
}) {
  const p1 = match.player1Id ? participants.find(p => p.id === match.player1Id) : null
  const p2 = match.player2Id ? participants.find(p => p.id === match.player2Id) : null
  const winner = match.winnerId ? participants.find(p => p.id === match.winnerId) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${match.winnerId === match.player1Id ? 'bg-green-50 dark:bg-green-900/30 border border-green-300' : ''}`}>
          <div className="font-semibold">{p1?.name || 'Por definir'}</div>
          <div className="text-sm text-gray-500">{p1?.tag}</div>
          {p1?.character && <Badge variant="default" className="mt-1">{p1.character}</Badge>}
          {match.status === 'completed' && (
            <div className="mt-2 text-2xl font-bold font-mono">{match.player1Score}</div>
          )}
        </div>
        <div className={`p-4 rounded-lg ${match.winnerId === match.player2Id ? 'bg-green-50 dark:bg-green-900/30 border border-green-300' : ''}`}>
          <div className="font-semibold">{p2?.name || 'Por definir'}</div>
          <div className="text-sm text-gray-500">{p2?.tag}</div>
          {p2?.character && <Badge variant="default" className="mt-1">{p2.character}</Badge>}
          {match.status === 'completed' && (
            <div className="mt-2 text-2xl font-bold font-mono">{match.player2Score}</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Best of {match.bestOf}</span>
        <span className={`px-2 py-1 rounded ${STATUS_COLORS[match.status]}`}>{match.status}</span>
      </div>

      {match.games.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Juegos</h4>
          <div className="flex flex-wrap gap-2">
            {match.games.map(g => (
              <div key={g.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                {g.player1Score} - {g.player2Score}
              </div>
            ))}
          </div>
        </div>
      )}

      {match.status === 'disputed' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded">
          <p className="text-red-700 dark:text-red-400">⚠️ Disputa reportada</p>
          <p className="text-sm">{match.disputeReason}</p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cerrar</Button>
        {match.status === 'ready' && (
          <Button className="flex-1">Reportar Resultado</Button>
        )}
      </div>
    </div>
  )
}