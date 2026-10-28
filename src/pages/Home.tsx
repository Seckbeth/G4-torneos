import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, Card, Badge } from '../components/ui'

export function Home() {
  const { user, loading } = useAuth()

  const features = [
    { icon: '🏆', title: 'Brackets Profesionales', desc: 'Doble eliminación, grupos + bracket final, suizo, round robin. Estilo EVO/Start.gg' },
    { icon: '⚡', title: 'Tiempo Real', desc: 'Resultados, inscripciones y check-in sincronizados instantáneamente vía Firebase' },
    { icon: '🎲', title: 'Ruleta de Personajes', desc: 'Asignación aleatoria de personajes para torneos randomizer' },
    { icon: '👨‍⚖️', title: 'Sistema de Jueces', desc: 'Asigna jueces a partidas, reportes con confirmación doble y gestión de disputas' },
    { icon: '📱', title: 'QR & Registro Público', desc: 'Código QR para inscripción móvil, check-in y visualización de bracket' },
    { icon: '🎮', title: 'Modo Stream/Overlay', desc: 'Cola de streaming, marcadores para OBS, partidas "En vivo"' },
    { icon: '🧪', title: 'Modo Test', desc: 'Carga jugadores dummy y simula torneo completo para validar flujo' },
    { icon: '☁️', title: 'Deploy Gratis', desc: 'GitHub Pages + Firebase Spark - cero coste, online en minutos' },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 sm:py-20">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Gestor de Torneos <span className="text-indigo-600 dark:text-indigo-400">estilo EVO</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
          Crea torneos de fighting games con brackets de doble eliminación, pools, check-in, 
          seeding, ruleta de personajes y overlays para streaming. Todo en tiempo real, gratis en GitHub Pages.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={user ? '/create' : '/login'}>
            <Button size="lg" className="w-full sm:w-auto px-8">
              {user ? 'Crear mi primer torneo' : 'Empezar gratis'}
            </Button>
          </Link>
          <Link to="/demo" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              Ver Demo
            </Button>
          </Link>
        </div>
        {user && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Conectado como <strong>{user.displayName}</strong>
          </p>
        )}
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Características principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow h-full">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tournament Formats */}
      <section>
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Formatos soportados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Doble Eliminación', desc: 'Winners & Losers bracket, Grand Finals con reset opcional. Estándar FGC/EVO.', icon: '🥊' },
            { name: 'Grupos + Bracket', desc: 'Fase de grupos (Round Robin) → Top 8/16/32 a bracket final. Formato TNS/EVO.', icon: '👥' },
            { name: 'Eliminación Directa', desc: 'Single elimination clásico. Rápido y simple.', icon: '⚔️' },
            { name: 'Suizo', desc: 'Rondas suizas por ranking. Ideal para torneos grandes sin eliminación.', icon: '♟️' },
            { name: 'Round Robin', desc: 'Todos contra todos. Para ligas y grupos pequeños.', icon: '🔄' },
            { name: 'Personalizado', desc: 'Combina fases: grupos → bracket DE → grand finals.', icon: '⚙️' },
          ].map((fmt, i) => (
            <Card key={i} className="p-6">
              <div className="text-3xl mb-3">{fmt.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{fmt.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{fmt.desc}</p>
              <Badge variant="info">Disponible</Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Crear Torneo', desc: 'Define nombre, juego, formato (DE, Grupos+DE), reglas y fechas' },
            { step: '2', title: 'Compartir QR/Link', desc: 'Jugadores se inscriben desde móvil. Check-in automático antes de empezar' },
            { step: '3', title: 'Seeding & Bracket', desc: 'Jueces asignan seeds. Genera bracket DE con un click. Ruleta personajes opcional' },
            { step: '4', title: 'Jugar & Reportar', desc: 'Jugadores/jueces reportan scores. Bracket avanza en tiempo real. Stream queue + overlays OBS' },
          ].map((s, i) => (
            <div key={i} className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{s.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{s.desc}</p>
              {i < 3 && (
                <div className="absolute top-5 right-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Card className="p-8 md:p-12 bg-indigo-600 border-indigo-600">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para tu torneo?</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Crea tu primer torneo en minutos. Sin servidores, sin configuración compleja. 
            Solo GitHub Pages + Firebase.
          </p>
          <Link to={user ? '/create' : '/login'}>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 bg-white text-indigo-600 hover:bg-indigo-50">
              {user ? 'Crear Torneo Ahora' : 'Empezar Gratis'}
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  )
}