import { createContext, useContext, useState, ReactNode } from 'react'
import { useTournamentStore } from './tournamentStore'

interface TournamentContextType {
  initListeners: (tournamentId: string) => void
  reset: () => void
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const initListeners = useTournamentStore(state => state.initListeners)
  const reset = useTournamentStore(state => state.reset)

  return (
    <TournamentContext.Provider value={{ initListeners, reset }}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournamentContext() {
  const context = useContext(TournamentContext)
  if (!context) throw new Error('useTournamentContext must be used within TournamentProvider')
  return context
}