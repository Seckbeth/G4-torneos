import type { Match, Participant, Tournament, TournamentFormat, BracketType } from '../types/tournament'

export function generateDoubleEliminationBracket(
  participants: Participant[],
  tournament: Tournament,
  existingMatches: Match[] = []
): Match[] {
  const checkedIn = participants.filter(p => p.status === 'checked_in' || p.status === 'registered')
  const sorted = [...checkedIn].sort((a, b) => a.seed - b.seed)
  const count = sorted.length
  
  if (count < 2) return []

  const matches: Match[] = [...existingMatches]
  const now = Date.now()
  const bestOf = tournament.settings.bestOf || 3

  const nextMatchId = () => crypto.randomUUID()
  const getNextPosition = (bracketType: BracketType) => {
    return matches.filter(m => m.bracketType === bracketType).length + 1
  }

  // Calculate rounds needed for winners bracket
  const getNextPowerOfTwo = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)))
  const bracketSize = getNextPowerOfTwo(count)
  const totalRounds = Math.log2(bracketSize)

  // --- WINNERS BRACKET ---
  // Round 1: First round of winners bracket
  const round1Matches: Match[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = sorted[i * 2]
    const p2 = sorted[i * 2 + 1]
    
    round1Matches.push({
      id: nextMatchId(),
      tournamentId: tournament.id,
      round: 1,
      bracketType: 'winners',
      position: i + 1,
      player1Id: p1?.id,
      player2Id: p2?.id,
      player1Score: 0,
      player2Score: 0,
      status: p1 && p2 ? 'ready' : p1 ? 'completed' : 'pending',
      winnerId: p1 && !p2 ? p1.id : undefined,
      loserId: p1 && !p2 ? undefined : undefined,
      onStream: false,
      bestOf,
      games: [],
      createdAt: now,
      updatedAt: now,
    })
  }
  matches.push(...round1Matches)

  // Subsequent winners bracket rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: nextMatchId(),
        tournamentId: tournament.id,
        round,
        bracketType: 'winners',
        position: i + 1,
        player1Id: undefined,
        player2Id: undefined,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
        onStream: false,
        bestOf,
        games: [],
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // --- LOSERS BRACKET ---
  // Losers bracket starts from round 2 (after first WB round)
  // LB Round 1: Losers of WB Round 1
  const lbRound1Count = bracketSize / 2
  for (let i = 0; i < lbRound1Count; i++) {
    matches.push({
      id: nextMatchId(),
      tournamentId: tournament.id,
      round: 1,
      bracketType: 'losers',
      position: i + 1,
      player1Id: undefined,
      player2Id: undefined,
      player1Score: 0,
      player2Score: 0,
      status: 'pending',
      onStream: false,
      bestOf,
      games: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  // Subsequent losers bracket rounds
  // LB rounds alternate between: losers from WB + winners from previous LB round
  let lbRound = 2
  let wbRound = 2
  let lbPositions = lbRound1Count / 2

  while (lbPositions >= 1) {
    // Even LB rounds: winners of previous LB round vs losers of current WB round
    if (wbRound <= totalRounds) {
      const wbMatchesInRound = bracketSize / Math.pow(2, wbRound)
      for (let i = 0; i < wbMatchesInRound; i++) {
        matches.push({
          id: nextMatchId(),
          tournamentId: tournament.id,
          round: lbRound,
          bracketType: 'losers',
          position: i + 1,
          player1Id: undefined,
          player2Id: undefined,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
          onStream: false,
          bestOf,
          games: [],
          createdAt: now,
          updatedAt: now,
        })
      }
      lbRound++
      wbRound++
      lbPositions = wbMatchesInRound
    }

    // Odd LB rounds: winners of previous LB round face each other
    if (lbPositions > 1) {
      for (let i = 0; i < lbPositions / 2; i++) {
        matches.push({
          id: nextMatchId(),
          tournamentId: tournament.id,
          round: lbRound,
          bracketType: 'losers',
          position: i + 1,
          player1Id: undefined,
          player2Id: undefined,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
          onStream: false,
          bestOf,
          games: [],
          createdAt: now,
          updatedAt: now,
        })
      }
      lbRound++
      lbPositions = lbPositions / 2
    }
  }

  // --- GRAND FINALS ---
  matches.push({
    id: nextMatchId(),
    tournamentId: tournament.id,
    round: totalRounds + 1,
    bracketType: 'grand_finals',
    position: 1,
    player1Id: undefined, // Winners bracket winner
    player2Id: undefined, // Losers bracket winner
    player1Score: 0,
    player2Score: 0,
    status: 'pending',
    onStream: true,
    bestOf: tournament.settings.grandFinalsReset ? bestOf : bestOf,
    games: [],
    createdAt: now,
    updatedAt: now,
  })

  // If grand finals reset is enabled, add a second grand finals match
  if (tournament.settings.grandFinalsReset) {
    matches.push({
      id: nextMatchId(),
      tournamentId: tournament.id,
      round: totalRounds + 2,
      bracketType: 'grand_finals',
      position: 2,
      player1Id: undefined,
      player2Id: undefined,
      player1Score: 0,
      player2Score: 0,
      status: 'pending',
      onStream: true,
      bestOf,
      games: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  return matches
}

export function generateSingleEliminationBracket(
  participants: Participant[],
  tournament: Tournament,
  existingMatches: Match[] = []
): Match[] {
  const checkedIn = participants.filter(p => p.status === 'checked_in' || p.status === 'registered')
  const sorted = [...checkedIn].sort((a, b) => a.seed - b.seed)
  const count = sorted.length
  
  if (count < 2) return []

  const matches: Match[] = [...existingMatches]
  const now = Date.now()
  const bestOf = tournament.settings.bestOf || 3

  const nextMatchId = () => crypto.randomUUID()
  const getNextPowerOfTwo = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)))
  const bracketSize = getNextPowerOfTwo(count)
  const totalRounds = Math.log2(bracketSize)

  // Round 1
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = sorted[i * 2]
    const p2 = sorted[i * 2 + 1]
    
    matches.push({
      id: nextMatchId(),
      tournamentId: tournament.id,
      round: 1,
      bracketType: 'winners',
      position: i + 1,
      player1Id: p1?.id,
      player2Id: p2?.id,
      player1Score: 0,
      player2Score: 0,
      status: p1 && p2 ? 'ready' : p1 ? 'completed' : 'pending',
      winnerId: p1 && !p2 ? p1.id : undefined,
      onStream: false,
      bestOf,
      games: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  // Subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: nextMatchId(),
        tournamentId: tournament.id,
        round,
        bracketType: 'winners',
        position: i + 1,
        player1Id: undefined,
        player2Id: undefined,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
        onStream: round === totalRounds,
        bestOf,
        games: [],
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return matches
}

export function generateGroupStageBracket(
  participants: Participant[],
  tournament: Tournament,
  existingMatches: Match[] = []
): Match[] {
  const settings = tournament.settings.groupStage
  if (!settings?.enabled) return []

  const checkedIn = participants.filter(p => p.status === 'checked_in' || p.status === 'registered')
  const sorted = [...checkedIn].sort((a, b) => a.seed - b.seed)
  
  const matches: Match[] = [...existingMatches]
  const now = Date.now()
  const bestOf = tournament.settings.bestOf || 3
  const nextMatchId = () => crypto.randomUUID()

  // Distribute participants into groups (snake seeding)
  const groups: Participant[][] = Array.from({ length: settings.groupsCount }, () => [])
  sorted.forEach((p, i) => {
    const groupIndex = i % settings.groupsCount
    const reverse = Math.floor(i / settings.groupsCount) % 2 === 1
    const actualIndex = reverse ? settings.groupsCount - 1 - groupIndex : groupIndex
    groups[actualIndex].push(p)
  })

  // Generate round-robin matches within each group
  groups.forEach((groupParticipants, groupIndex) => {
    const groupId = `group_${groupIndex + 1}`
    for (let i = 0; i < groupParticipants.length; i++) {
      for (let j = i + 1; j < groupParticipants.length; j++) {
        matches.push({
          id: nextMatchId(),
          tournamentId: tournament.id,
          round: 0, // Group stage rounds are 0
          bracketType: 'groups',
          position: matches.filter(m => m.groupId === groupId).length + 1,
          groupId,
          player1Id: groupParticipants[i].id,
          player2Id: groupParticipants[j].id,
          player1Score: 0,
          player2Score: 0,
          status: 'ready',
          onStream: false,
          bestOf,
          games: [],
          createdAt: now,
          updatedAt: now,
        })
      }
    }
  })

  return matches
}

export function generateBracket(
  participants: Participant[],
  tournament: Tournament,
  existingMatches: Match[] = []
): Match[] {
  switch (tournament.format) {
    case 'double_elimination':
      return generateDoubleEliminationBracket(participants, tournament, existingMatches)
    case 'single_elimination':
      return generateSingleEliminationBracket(participants, tournament, existingMatches)
    case 'groups_then_bracket':
      return [
        ...generateGroupStageBracket(participants, tournament, existingMatches),
        // The bracket phase will be generated after groups complete
      ]
    default:
      return generateDoubleEliminationBracket(participants, tournament, existingMatches)
  }
}

export function advanceWinner(
  matches: Match[],
  matchId: string,
  winnerId: string,
  loserId: string,
  score1: number,
  score2: number
): Match[] {
  const updated = [...matches]
  const matchIndex = updated.findIndex(m => m.id === matchId)
  if (matchIndex === -1) return updated

  const match = { ...updated[matchIndex] }
  match.player1Score = score1
  match.player2Score = score2
  match.winnerId = winnerId
  match.loserId = loserId
  match.status = 'completed'
  match.completedAt = Date.now()
  match.updatedAt = Date.now()
  updated[matchIndex] = match

  // Find next match in winners bracket
  if (match.bracketType === 'winners' || match.bracketType === 'groups') {
    const nextRound = match.round + 1
    const nextMatch = updated.find(m => 
      m.bracketType === 'winners' && 
      m.round === nextRound &&
      m.position === Math.ceil(match.position / 2) &&
      !m.player1Id
    )
    if (nextMatch) {
      const nextIndex = updated.indexOf(nextMatch)
      const updatedNext = { ...nextMatch }
      if (nextMatch.position * 2 - 1 === match.position) {
        updatedNext.player1Id = winnerId
      } else {
        updatedNext.player2Id = winnerId
      }
      updatedNext.status = updatedNext.player1Id && updatedNext.player2Id ? 'ready' : 'pending'
      updatedNext.updatedAt = Date.now()
      updated[nextIndex] = updatedNext
    }
  }

  // Handle losers bracket advancement
  if (match.bracketType === 'winners' && match.loserId) {
    advanceToLosersBracket(updated, match, match.loserId)
  }

  // Handle losers bracket winner advancement
  if (match.bracketType === 'losers') {
    advanceInLosersBracket(updated, match, winnerId)
  }

  // Handle grand finals
  if (match.bracketType === 'grand_finals') {
    handleGrandFinals(updated, match, winnerId, loserId)
  }

  return updated
}

function advanceToLosersBracket(matches: Match[], wbMatch: Match, loserId: string) {
  // Find the appropriate losers bracket match
  // LB round 1 receives losers from WB round 1
  const lbRound = wbMatch.round
  const lbPosition = wbMatch.position
  
  const lbMatch = matches.find(m => 
    m.bracketType === 'losers' && 
    m.round === lbRound &&
    m.position === lbPosition &&
    !m.player1Id
  )
  
  if (lbMatch) {
    const idx = matches.indexOf(lbMatch)
    const updated = { ...lbMatch }
    updated.player1Id = loserId
    updated.status = updated.player1Id && updated.player2Id ? 'ready' : 'pending'
    updated.updatedAt = Date.now()
    matches[idx] = updated
  }
}

function advanceInLosersBracket(matches: Match[], lbMatch: Match, winnerId: string) {
  // Find next losers bracket match
  const nextRound = lbMatch.round + 1
  // This is simplified - real implementation needs to track LB structure carefully
  const nextMatch = matches.find(m => 
    m.bracketType === 'losers' && 
    m.round === nextRound &&
    !m.player1Id
  )
  
  if (nextMatch) {
    const idx = matches.indexOf(nextMatch)
    const updated = { ...nextMatch }
    if (!updated.player1Id) {
      updated.player1Id = winnerId
    } else if (!updated.player2Id) {
      updated.player2Id = winnerId
    }
    updated.status = updated.player1Id && updated.player2Id ? 'ready' : 'pending'
    updated.updatedAt = Date.now()
    matches[idx] = updated
  }
}

function handleGrandFinals(matches: Match[], gfMatch: Match, winnerId: string, loserId: string) {
  const tournamentSettings = { grandFinalsReset: true } // Would come from tournament
  
  if (tournamentSettings.grandFinalsReset) {
    // Check if this is the first grand finals match
    const isFirstGF = gfMatch.position === 1
    if (isFirstGF) {
      // Winner of WB vs Winner of LB
      // If WB winner wins, tournament ends
      // If LB winner wins, play second match
      const wbWinner = gfMatch.player1Id // Assuming player1 is WB winner
      const lbWinner = gfMatch.player2Id // Assuming player2 is LB winner
      
      if (winnerId === wbWinner) {
        // Tournament over
        return
      }
      
      // LB winner won, need second match
      const secondGF = matches.find(m => m.bracketType === 'grand_finals' && m.position === 2)
      if (secondGF) {
        const idx = matches.indexOf(secondGF)
        const updated = { ...secondGF }
        updated.player1Id = wbWinner
        updated.player2Id = lbWinner
        updated.status = 'ready'
        updated.updatedAt = Date.now()
        matches[idx] = updated
      }
    }
  }
}

export function assignRandomCharacters(
  participants: Participant[],
  characters: string[]
): Map<string, string> {
  const assignments = new Map<string, string>()
  const shuffledChars = [...characters].sort(() => Math.random() - 0.5)
  
  participants.forEach((p, i) => {
    const charIndex = i % shuffledChars.length
    assignments.set(p.id, shuffledChars[charIndex])
  })
  
  return assignments
}

export function calculateGroupStandings(
  groupParticipants: Participant[],
  groupMatches: Match[]
): Participant[] {
  const standings = new Map<string, { wins: number; losses: number; gamesWon: number; gamesLost: number }>()
  
  groupParticipants.forEach(p => {
    standings.set(p.id, { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 })
  })
  
  groupMatches.filter(m => m.status === 'completed').forEach(match => {
    const p1Stat = standings.get(match.player1Id!)
    const p2Stat = standings.get(match.player2Id!)
    
    if (p1Stat && p2Stat) {
      p1Stat.gamesWon += match.player1Score
      p1Stat.gamesLost += match.player2Score
      p2Stat.gamesWon += match.player2Score
      p2Stat.gamesLost += match.player1Score
      
      if (match.winnerId === match.player1Id) {
        p1Stat.wins++
        p2Stat.losses++
      } else if (match.winnerId === match.player2Id) {
        p2Stat.wins++
        p1Stat.losses++
      }
    }
  })
  
  return [...groupParticipants].sort((a, b) => {
    const aStat = standings.get(a.id)!
    const bStat = standings.get(b.id)!
    
    // Sort by wins, then by game differential, then by head-to-head
    if (bStat.wins !== aStat.wins) return bStat.wins - aStat.wins
    const aDiff = aStat.gamesWon - aStat.gamesLost
    const bDiff = bStat.gamesWon - bStat.gamesLost
    if (bDiff !== aDiff) return bDiff - aDiff
    return a.seed - b.seed
  })
}

export function getBracketProgress(matches: Match[]): { completed: number; total: number; percentage: number } {
  const total = matches.filter(m => m.bracketType !== 'groups').length
  const completed = matches.filter(m => m.bracketType !== 'groups' && m.status === 'completed').length
  return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
}

export function getNextMatches(matches: Match[], limit = 5): Match[] {
  return matches
    .filter(m => m.status === 'ready' || m.status === 'in_progress')
    .sort((a, b) => {
      // Prioritize stream matches
      if (a.onStream !== b.onStream) return a.onStream ? -1 : 1
      // Then by round
      return a.round - b.round
    })
    .slice(0, limit)
}