import { create } from 'zustand'
import { subscribeTournament, subscribeParticipants, subscribeMatches, subscribeJudges, subscribeGroups } from '../services/supabase'
import type { Tournament, Participant, Match, User, JudgeAssignment, Group, UserRole } from '../types/tournament'

interface TournamentState {
  tournament: Tournament | null
  participants: Participant[]
  matches: Match[]
  groups: Group[]
  judges: JudgeAssignment[]
  currentUser: User | null
  userRole: UserRole
  isLoading: boolean
  error: string | null
  unsubscribeFns: (() => void)[]
  
  // Actions
  setTournament: (tournament: Tournament | null) => void
  setParticipants: (participants: Participant[]) => void
  setMatches: (matches: Match[]) => void
  setGroups: (groups: Group[]) => void
  setJudges: (judges: JudgeAssignment[]) => void
  setCurrentUser: (user: User | null) => void
  setUserRole: (role: UserRole) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addUnsubscribe: (fn: () => void) => void
  clearUnsubscribes: () => void
  reset: () => void
}

const initialState = {
  tournament: null,
  participants: [],
  matches: [],
  groups: [],
  judges: [],
  currentUser: null,
  userRole: 'viewer' as UserRole,
  isLoading: true,
  error: null,
  unsubscribeFns: [],
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  ...initialState,
  
  setTournament: (tournament) => set({ tournament }),
  setParticipants: (participants) => set({ participants }),
  setMatches: (matches) => set({ matches }),
  setGroups: (groups) => set({ groups }),
  setJudges: (judges) => set({ judges }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setUserRole: (userRole) => set({ userRole }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addUnsubscribe: (fn) => set((state) => ({ unsubscribeFns: [...state.unsubscribeFns, fn] })),
  
  clearUnsubscribes: () => {
    get().unsubscribeFns.forEach(fn => fn())
    set({ unsubscribeFns: [] })
  },
  
  reset: () => {
    get().clearUnsubscribes()
    set(initialState)
  },
  
  // Initialize real-time listeners
  initListeners: (tournamentId: string) => {
    const { clearUnsubscribes, addUnsubscribe, setTournament, setParticipants, setMatches, setGroups, setJudges } = get()
    clearUnsubscribes()
    
    addUnsubscribe(subscribeTournament(tournamentId, setTournament))
    addUnsubscribe(subscribeParticipants(tournamentId, setParticipants))
    addUnsubscribe(subscribeMatches(tournamentId, setMatches))
    addUnsubscribe(subscribeGroups(tournamentId, setGroups))
    addUnsubscribe(subscribeJudges(tournamentId, setJudges))
  },
}))

// Selectors
export const useTournament = () => useTournamentStore(state => state.tournament)
export const useParticipants = () => useTournamentStore(state => state.participants)
export const useMatches = () => useTournamentStore(state => state.matches)
export const useGroups = () => useTournamentStore(state => state.groups)
export const useJudges = () => useTournamentStore(state => state.judges)
export const useCurrentUser = () => useTournamentStore(state => state.currentUser)
export const useUserRole = () => useTournamentStore(state => state.userRole)
export const useIsLoading = () => useTournamentStore(state => state.isLoading)
export const useError = () => useTournamentStore(state => state.error)