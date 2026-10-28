export type TournamentFormat = 'double_elimination' | 'single_elimination' | 'groups_then_bracket' | 'swiss' | 'round_robin'
export type TournamentStatus = 'draft' | 'registration_open' | 'check_in' | 'in_progress' | 'completed' | 'cancelled'
export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'disputed' | 'cancelled'
export type ParticipantStatus = 'registered' | 'checked_in' | 'disqualified' | 'dropped'
export type BracketType = 'winners' | 'losers' | 'grand_finals' | 'groups'
export type UserRole = 'admin' | 'judge' | 'participant' | 'viewer'

export interface Tournament {
  id: string
  name: string
  game: string
  description?: string
  format: TournamentFormat
  status: TournamentStatus
  maxParticipants?: number
  registrationOpen: boolean
  checkInEnabled: boolean
  checkInStartTime?: number
  checkInEndTime?: number
  startTime?: number
  endTime?: number
  settings: TournamentSettings
  createdBy: string
  createdAt: number
  updatedAt: number
  currentRound: number
  totalRounds: number
}

export interface TournamentSettings {
  doubleElimination: boolean
  grandFinalsReset: boolean
  seedMethod: 'manual' | 'random' | 'ranking'
  bestOf: number
  allowCharacterSelection: boolean
  characters: string[]
  randomCharacterAssignment: boolean
  streamQueueEnabled: boolean
  groupStage?: GroupStageSettings
}

export interface GroupStageSettings {
  enabled: boolean
  groupsCount: number
  participantsPerGroup: number
  advancePerGroup: number
  bracketSize: 8 | 16 | 32 | 64
}

export interface Participant {
  id: string
  tournamentId: string
  userId?: string
  name: string
  tag?: string
  email?: string
  discord?: string
  seed: number
  status: ParticipantStatus
  checkedInAt?: number
  group?: number
  placement?: number
  character?: string
  customData?: Record<string, string>
  createdAt: number
  updatedAt: number
}

export interface Match {
  id: string
  tournamentId: string
  round: number
  bracketType: BracketType
  groupId?: string
  position: number
  player1Id?: string
  player2Id?: string
  player1Score: number
  player2Score: number
  winnerId?: string
  loserId?: string
  status: MatchStatus
  scheduledTime?: number
  startedAt?: number
  completedAt?: number
  reportedBy?: string
  confirmedBy?: string
  disputedBy?: string
  disputeReason?: string
  onStream: boolean
  streamStation?: string
  bestOf: number
  games: Game[]
  createdAt: number
  updatedAt: number
}

export interface Game {
  id: string
  matchId: string
  gameNumber: number
  player1Character?: string
  player2Character?: string
  player1Score: number
  player2Score: number
  winnerId?: string
  completedAt?: number
}

export interface Group {
  id: string
  tournamentId: string
  name: string
  participants: string[]
  standings: GroupStanding[]
  completed: boolean
}

export interface GroupStanding {
  participantId: string
  wins: number
  losses: number
  gamesWon: number
  gamesLost: number
  points: number
  tiebreaker?: number
}

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  tournaments: string[]
  createdAt: number
}

export interface JudgeAssignment {
  id: string
  tournamentId: string
  judgeId: string
  matchIds: string[]
  assignedBy: string
  assignedAt: number
}

export interface StreamQueue {
  id: string
  tournamentId: string
  matchId: string
  station: string
  queuedAt: number
  startedAt?: number
  completedAt?: number
}

export interface TournamentState {
  tournament: Tournament | null
  participants: Participant[]
  matches: Match[]
  groups: Group[]
  currentUser: User | null
  userRole: UserRole
  isLoading: boolean
  error: string | null
}

export interface QRCodeData {
  tournamentId: string
  registrationUrl: string
  type: 'registration' | 'checkin' | 'bracket'
}