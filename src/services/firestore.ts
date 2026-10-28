import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Tournament,
  Participant,
  Match,
  User,
  JudgeAssignment,
  Group,
} from '../types/tournament'

// Tournaments
export const tournamentsCol = (userId?: string) => {
  const base = collection(db, 'tournaments')
  if (userId) return query(base, where('createdBy', '==', userId), orderBy('createdAt', 'desc'))
  return query(base, orderBy('createdAt', 'desc'))
}

export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(collection(db, 'tournaments'))
  const now = Date.now()
  const tournament: Tournament = { ...data, id: ref.id, createdAt: now, updatedAt: now }
  await setDoc(ref, tournament)
  return ref.id
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(db, 'tournaments', id))
  return snap.exists() ? (snap.data() as Tournament) : null
}

export async function updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
  await updateDoc(doc(db, 'tournaments', id), { ...data, updatedAt: Date.now() })
}

export async function deleteTournament(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tournaments', id))
}

export function subscribeTournaments(userId: string | undefined, callback: (tournaments: Tournament[]) => void): Unsubscribe {
  const q = tournamentsCol(userId)
  return onSnapshot(q, (snap) => {
    const tournaments = snap.docs.map(d => d.data() as Tournament)
    callback(tournaments)
  })
}

export function subscribeTournament(id: string, callback: (tournament: Tournament | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'tournaments', id), (snap) => {
    callback(snap.exists() ? snap.data() as Tournament : null)
  })
}

// Participants
export const participantsCol = (tournamentId: string) => 
  query(collection(db, 'tournaments', tournamentId, 'participants'), orderBy('seed'))

export async function addParticipant(tournamentId: string, data: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(collection(db, 'tournaments', tournamentId, 'participants'))
  const now = Date.now()
  const participant: Participant = { ...data, id: ref.id, createdAt: now, updatedAt: now }
  await setDoc(ref, participant)
  return ref.id
}

export async function bulkAddParticipants(tournamentId: string, participants: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const batch = writeBatch(db)
  const now = Date.now()
  participants.forEach(p => {
    const ref = doc(collection(db, 'tournaments', tournamentId, 'participants'))
    batch.set(ref, { ...p, id: ref.id, createdAt: now, updatedAt: now })
  })
  await batch.commit()
}

export async function updateParticipant(tournamentId: string, id: string, data: Partial<Participant>): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'participants', id), { ...data, updatedAt: Date.now() })
}

export async function deleteParticipant(tournamentId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'tournaments', tournamentId, 'participants', id))
}

export function subscribeParticipants(tournamentId: string, callback: (participants: Participant[]) => void): Unsubscribe {
  return onSnapshot(participantsCol(tournamentId), (snap) => {
    callback(snap.docs.map(d => d.data() as Participant))
  })
}

// Matches
export const matchesCol = (tournamentId: string) => 
  query(collection(db, 'tournaments', tournamentId, 'matches'), orderBy('round'), orderBy('position'))

export async function addMatch(tournamentId: string, data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(collection(db, 'tournaments', tournamentId, 'matches'))
  const now = Date.now()
  const match: Match = { ...data, id: ref.id, createdAt: now, updatedAt: now }
  await setDoc(ref, match)
  return ref.id
}

export async function bulkAddMatches(tournamentId: string, matches: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const batch = writeBatch(db)
  const now = Date.now()
  matches.forEach(m => {
    const ref = doc(collection(db, 'tournaments', tournamentId, 'matches'))
    batch.set(ref, { ...m, id: ref.id, createdAt: now, updatedAt: now })
  })
  await batch.commit()
}

export async function updateMatch(tournamentId: string, id: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', id), { ...data, updatedAt: Date.now() })
}

export async function updateMatchTransaction(
  tournamentId: string,
  matchId: string,
  updater: (match: Match) => Match
): Promise<void> {
  const ref = doc(db, 'tournaments', tournamentId, 'matches', matchId)
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('Match not found')
    const match = snap.data() as Match
    const updated = updater(match)
    transaction.update(ref, { ...updated, updatedAt: Date.now() })
  })
}

export function subscribeMatches(tournamentId: string, callback: (matches: Match[]) => void): Unsubscribe {
  return onSnapshot(matchesCol(tournamentId), (snap) => {
    callback(snap.docs.map(d => d.data() as Match))
  })
}

// Users
export async function createUserProfile(userId: string, data: Omit<User, 'id' | 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'users', userId), { ...data, id: userId, createdAt: Date.now() })
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? snap.data() as User : null
}

export function subscribeUser(userId: string, callback: (user: User | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    callback(snap.exists() ? snap.data() as User : null)
  })
}

// Judges
export const judgesCol = (tournamentId: string) => 
  collection(db, 'tournaments', tournamentId, 'judges')

export async function assignJudge(tournamentId: string, judgeId: string, matchIds: string[], assignedBy: string): Promise<void> {
  const ref = doc(judgesCol(tournamentId), judgeId)
  await setDoc(ref, { tournamentId, judgeId, matchIds, assignedBy, assignedAt: Date.now() })
}

export async function removeJudge(tournamentId: string, judgeId: string): Promise<void> {
  await deleteDoc(doc(judgesCol(tournamentId), judgeId))
}

export function subscribeJudges(tournamentId: string, callback: (judges: JudgeAssignment[]) => void): Unsubscribe {
  return onSnapshot(judgesCol(tournamentId), (snap) => {
    callback(snap.docs.map(d => d.data() as JudgeAssignment))
  })
}

// Groups
export const groupsCol = (tournamentId: string) => 
  collection(db, 'tournaments', tournamentId, 'groups')

export async function saveGroup(tournamentId: string, group: Group): Promise<void> {
  await setDoc(doc(groupsCol(tournamentId), group.id), group)
}

export function subscribeGroups(tournamentId: string, callback: (groups: Group[]) => void): Unsubscribe {
  return onSnapshot(groupsCol(tournamentId), (snap) => {
    callback(snap.docs.map(d => d.data() as Group))
  })
}

// Helper to convert Firestore Timestamps to numbers
export function fromFirestoreTimestamp(ts: Timestamp | number | undefined): number | undefined {
  if (!ts) return undefined
  if (typeof ts === 'number') return ts
  if (ts instanceof Timestamp) return ts.toMillis()
  return undefined
}

export function toFirestoreTimestamp(ms: number): Timestamp {
  return Timestamp.fromMillis(ms)
}