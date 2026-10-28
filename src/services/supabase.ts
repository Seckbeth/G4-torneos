import { supabase } from '../lib/supabase'
import type {
  Tournament,
  Participant,
  Match,
  User,
  JudgeAssignment,
  Group,
  TournamentStatus,
  MatchStatus,
  ParticipantStatus,
  BracketType,
  UserRole,
} from '../types/tournament'

// ============================================================
// TORNEOS
// ============================================================

export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('tournaments')
    .insert([{ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select('id')
    .single()
  if (error) throw error
  return inserted.id
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as unknown as Tournament
}

export async function updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTournament(id: string): Promise<void> {
  await supabase.from('tournaments').delete().eq('id', id)
}

export function subscribeTournaments(userId: string | undefined, callback: (tournaments: Tournament[]) => void) {
  const channel = supabase
    .channel('tournaments-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments', filter: userId ? `created_by=eq.${userId}` : undefined },
      () => {
        fetchTournaments(userId).then(callback)
      }
    )
    .subscribe()

  // Initial fetch
  fetchTournaments(userId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

async function fetchTournaments(userId?: string): Promise<Tournament[]> {
  let query = supabase.from('tournaments').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('created_by', userId)
  const { data, error } = await query
  if (error) return []
  return (data || []) as unknown as Tournament[]
}

export function subscribeTournament(id: string, callback: (tournament: Tournament | null) => void) {
  const channel = supabase
    .channel(`tournament-${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` },
      (payload) => {
        callback((payload.new as Tournament) || null)
      }
    )
    .subscribe()

  // Initial fetch
  getTournament(id).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================================
// PARTICIPANTES
// ============================================================

export async function addParticipant(tournamentId: string, data: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('participants')
    .insert([{ ...data, tournament_id: tournamentId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select('id')
    .single()
  if (error) throw error
  return inserted.id
}

export async function bulkAddParticipants(tournamentId: string, participants: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const rows = participants.map(p => ({
    ...p,
    tournament_id: tournamentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('participants').insert(rows)
  if (error) throw error
}

export async function updateParticipant(tournamentId: string, id: string, data: Partial<Participant>): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tournament_id', tournamentId)
  if (error) throw error
}

export async function deleteParticipant(tournamentId: string, id: string): Promise<void> {
  await supabase.from('participants').delete().eq('id', id).eq('tournament_id', tournamentId)
}

export function subscribeParticipants(tournamentId: string, callback: (participants: Participant[]) => void) {
  const channel = supabase
    .channel(`participants-${tournamentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants', filter: `tournament_id=eq.${tournamentId}` },
      () => {
        fetchParticipants(tournamentId).then(callback)
      }
    )
    .subscribe()

  fetchParticipants(tournamentId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

async function fetchParticipants(tournamentId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('seed', { ascending: true })
  if (error) return []
  return (data || []) as unknown as Participant[]
}

// ============================================================
// PARTIDAS
// ============================================================

export async function addMatch(tournamentId: string, data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('matches')
    .insert([{ ...data, tournament_id: tournamentId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select('id')
    .single()
  if (error) throw error
  return inserted.id
}

export async function bulkAddMatches(tournamentId: string, matches: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const rows = matches.map(m => ({
    ...m,
    tournament_id: tournamentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('matches').insert(rows)
  if (error) throw error
}

export async function updateMatch(tournamentId: string, id: string, data: Partial<Match>): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tournament_id', tournamentId)
  if (error) throw error
}

export async function updateMatchTransaction(
  tournamentId: string,
  matchId: string,
  updater: (match: Match) => Match
): Promise<void> {
  // Supabase no tiene transacciones automáticas en el cliente, así que leemos y actualizamos
  const { data: existing } = await supabase.from('matches').select('*').eq('id', matchId).single()
  if (!existing) throw new Error('Match not found')
  const updated = updater(existing as unknown as Match)
  await updateMatch(tournamentId, matchId, updated)
}

export function subscribeMatches(tournamentId: string, callback: (matches: Match[]) => void) {
  const channel = supabase
    .channel(`matches-${tournamentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
      () => {
        fetchMatches(tournamentId).then(callback)
      }
    )
    .subscribe()

  fetchMatches(tournamentId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('position', { ascending: true })
  if (error) return []
  return (data || []) as unknown as Match[]
}

// ============================================================
// USUARIOS
// ============================================================

export async function createUserProfile(userId: string, data: Omit<User, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('users').upsert({ ...data, id: userId, created_at: new Date().toISOString() })
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) return null
  return data as unknown as User
}

export function subscribeUser(userId: string, callback: (user: User | null) => void) {
  const channel = supabase
    .channel(`user-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      (payload) => {
        callback((payload.new as User) || null)
      }
    )
    .subscribe()

  getUserProfile(userId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================================
// JUECES
// ============================================================

export async function assignJudge(tournamentId: string, judgeId: string, matchIds: string[], assignedBy: string): Promise<void> {
  await supabase.from('judges').upsert({
    tournament_id: tournamentId,
    judge_id: judgeId,
    match_ids: matchIds,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString(),
  })
}

export async function removeJudge(tournamentId: string, judgeId: string): Promise<void> {
  await supabase.from('judges').delete().eq('tournament_id', tournamentId).eq('judge_id', judgeId)
}

export function subscribeJudges(tournamentId: string, callback: (judges: JudgeAssignment[]) => void) {
  const channel = supabase
    .channel(`judges-${tournamentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'judges', filter: `tournament_id=eq.${tournamentId}` },
      () => {
        fetchJudges(tournamentId).then(callback)
      }
    )
    .subscribe()

  fetchJudges(tournamentId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

async function fetchJudges(tournamentId: string): Promise<JudgeAssignment[]> {
  const { data, error } = await supabase.from('judges').select('*').eq('tournament_id', tournamentId)
  if (error) return []
  return (data || []) as unknown as JudgeAssignment[]
}

// ============================================================
// GRUPOS
// ============================================================

export async function saveGroup(tournamentId: string, group: Group): Promise<void> {
  await supabase.from('groups').upsert({ ...group, tournament_id: tournamentId })
}

export function subscribeGroups(tournamentId: string, callback: (groups: Group[]) => void) {
  const channel = supabase
    .channel(`groups-${tournamentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'groups', filter: `tournament_id=eq.${tournamentId}` },
      () => {
        fetchGroups(tournamentId).then(callback)
      }
    )
    .subscribe()

  fetchGroups(tournamentId).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}

async function fetchGroups(tournamentId: string): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select('*').eq('tournament_id', tournamentId)
  if (error) return []
  return (data || []) as unknown as Group[]
}

// ============================================================
// HELPERS
// ============================================================

export function fromFirestoreTimestamp(ts: any): number | undefined {
  if (!ts) return undefined
  if (typeof ts === 'number') return ts
  if (typeof ts === 'string') return new Date(ts).getTime()
  return undefined
}

export function toFirestoreTimestamp(ms: number): string {
  return new Date(ms).toISOString()
}