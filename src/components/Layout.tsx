import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTournamentStore } from '../store/tournamentStore'

export function Layout() {
  const { user, logout } = useAuth()
  const { tournament, reset } = useTournamentStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isTournamentPage = location.pathname.startsWith('/t/')
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2" aria-label="App de Torneos - Inicio">
                <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="font-bold text-xl text-gray-900 dark:text-white">App de Torneos</span>
              </Link>
              
              {isTournamentPage && tournament && (
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{tournament.name}</span>
                  <Badge variant="info">{tournament.format.replace('_', ' ').toUpperCase()}</Badge>
                  <Badge variant={tournament.status === 'in_progress' ? 'success' : 'default'}>{tournament.status}</Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {isTournamentPage && tournament && (
                <Link 
                  to={`/t/${tournament.id}/bracket`}
                  className="hidden sm:block px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Ver Bracket
                </Link>
              )}
              
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">{user.displayName}</span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                  Iniciar sesión
                </Link>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Menú"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-2">
                <Link to="/" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Inicio</Link>
                <Link to="/create" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Crear Torneo</Link>
                <Link to="/my-tournaments" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Mis Torneos</Link>
                {user && <button onClick={logout} className="px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Cerrar sesión</button>}
              </div>
            </div>
          )}
        </nav>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          App de Torneos - Gestor de brackets estilo EVO/Challonge
        </div>
      </footer>
    </div>
  )
}