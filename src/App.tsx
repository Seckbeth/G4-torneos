import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { TournamentProvider } from './store/TournamentProvider'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { CreateTournament } from './pages/CreateTournament'
import { TournamentDashboard } from './pages/TournamentDashboard'
import { PublicBracket } from './pages/PublicBracket'
import { RegistrationPage } from './pages/RegistrationPage'
import { CheckInPage } from './pages/CheckInPage'
import { MyTournaments } from './pages/MyTournaments'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DemoPage } from './pages/DemoPage'
import { LoadingSpinner } from './components/ui'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" state={{ from: window.location.pathname }} replace />
}

import { useAuth } from './hooks/useAuth'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="demo" element={<DemoPage />} />
              
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="create" element={<CreateTournament />} />
                <Route path="my-tournaments" element={<MyTournaments />} />
              </Route>
            </Route>
            
            {/* Public routes (no layout) */}
            <Route path="register/:id" element={<RegistrationPage />} />
            <Route path="checkin/:id" element={<CheckInPage />} />
            <Route path="t/:id/bracket" element={<PublicBracket />} />
            <Route path="t/:id" element={<ProtectedRoute><TournamentDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TournamentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}