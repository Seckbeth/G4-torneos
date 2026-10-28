# App de Torneos - Gestor de Brackets estilo EVO/Start.gg

Una aplicación completa para gestionar torneos de fighting games (y otros esports) con brackets de doble eliminación, fase de grupos, check-in por QR, seeding, ruleta de personajes, stream queue y overlays para OBS.

## 🚀 Características Principales

- **Formatos de Torneo**: Doble Eliminación, Eliminación Directa, Grupos + Bracket Final (Top 8/16/32), Suizo, Round Robin
- **Gestión de Participantes**: Registro público vía enlace/QR, check-in obligatorio, seeding manual por jueces
- **Brackets Interactivos**: Visualización en tiempo real, zoom/pan, navegación por rondas, indicadores "En Vivo"
- **Ruleta de Personajes**: Asignación aleatoria de personajes para torneos randomizer
- **Sistema de Jueces**: Asignación de jueces a partidas, reporte de resultados con confirmación doble, gestión de disputas
- **Stream Queue**: Cola de streaming, marcadores para OBS Browser Source, partidas marcadas "On Stream"
- **Tiempo Real**: Firebase Firestore sincroniza todo instantáneamente entre organizadores, jueces, jugadores y espectadores
- **Modo Test**: Carga jugadores dummy y simula torneo completo para validar flujo
- **Deploy Gratis**: GitHub Pages + Firebase Spark (plan gratuito)

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta de GitHub
- Cuenta de Firebase (plan Spark gratis)

## 🛠️ Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/app-de-torneos.git
cd app-de-torneos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## 🔥 Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (o usa uno existente)
3. Habilita **Authentication** → Email/Password
4. Habilita **Firestore Database** → Modo prueba (para desarrollo)
5. En **Project Settings** → General, copia la configuración de la app web
6. En **Authentication** → Settings → Authorized domains, añade `localhost` y tu dominio de GitHub Pages (`tu-usuario.github.io`)

### Reglas de Firestore (para desarrollo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Reglas de Firestore (para producción - más seguras)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir su propio perfil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Torneos: creador tiene acceso total, otros solo lectura si es público
    match /tournaments/{tournamentId} {
      allow read: if resource.data.registrationOpen == true || request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.createdBy;
    }
    
    // Subcolecciones de torneos
    match /tournaments/{tournamentId}/{collection}/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/tournaments/$(tournamentId)).data.createdBy == request.auth.uid ||
         exists(/databases/$(database)/documents/tournaments/$(tournamentId)/judges/$(request.auth.uid)));
    }
  }
}
```

## 🌐 Deploy a GitHub Pages

### Opción A: Automático (Recomendado)

1. Haz fork/push a tu repositorio de GitHub
2. Ve a **Settings** → **Pages** → **Build and deployment**
   - Source: **GitHub Actions**
3. Ve a **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   Añade estos secrets (valores de tu Firebase):
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
4. Haz push a `main` o ejecuta el workflow manualmente
5. Tu app estará en `https://TU_USUARIO.github.io/app-de-torneos/`

### Opción B: Manual

```bash
# Build
npm run build

# Deploy (requiere gh-pages instalado)
npm run deploy
```

## 📱 Uso Básico

### 1. Crear Torneo
- Inicia sesión → "Crear Torneo"
- Define nombre, juego, formato (ej: Grupos + Doble Eliminación)
- Configura: Best of, Grand Finals Reset, Personajes, Stream Queue
- Si usas Grupos: define nº grupos, participantes por grupo, clasificados

### 2. Abrir Inscripciones
- En el panel del torneo, cambia estado a "Inscripciones Abiertas"
- Comparte el enlace `/register/{id}` o el código QR
- Jugadores se registran desde móvil/PC

### 3. Check-in
- Cambia estado a "Check-in"
- Jugadores confirman asistencia (o juez hace check-in masivo)
- Solo check-inados entran al bracket

### 4. Seeding y Bracket
- Jueces asignan seeds (1 = mejor seed)
- Click "Generar Bracket" → crea Winners/Losers/Grand Finals automáticamente
- Si hay fase de grupos: se genera Round Robin por grupos primero

### 5. Jugar y Reportar
- Partidas "Ready" aparecen en bracket
- Jugadores/jueces reportan scores
- Bracket avanza automáticamente (Winners → Winners, Losers → Losers, GF)
- Marcadores en tiempo real para espectadores

### 6. Streaming
- Marca partidas como "On Stream" → aparecen en Stream Queue
- Usa `/t/{id}/bracket` como Browser Source en OBS
- Overlays automáticos de marcador

## 🧪 Modo Test

En el panel del torneo:
1. Click "Importar" → pega lista de nombres (ej: 16-32 nombres)
2. Click "Generar Bracket"
3. Click en partidas → "Reportar Resultado" → simula scores
4. Verifica que el flujo Winners/Losers/Grand Finals funciona correctamente

## 🏗️ Arquitectura Técnica

```
src/
├── components/
│   ├── ui/           # Componentes base (Button, Input, Modal, Card, etc.)
│   └── Layout.tsx    # Layout principal con navegación
├── hooks/
│   └── useAuth.ts    # Autenticación Firebase
├── lib/
│   ├── firebase.ts   # Configuración Firebase
│   └── bracketLogic.ts # Algoritmos de bracket (DE, SE, Groups)
├── pages/
│   ├── Home.tsx              # Landing page
│   ├── CreateTournament.tsx  # Formulario creación
│   ├── TournamentDashboard.tsx # Panel admin
│   ├── PublicBracket.tsx     # Bracket público interactivo
│   ├── RegistrationPage.tsx  # Registro público + QR
│   ├── CheckInPage.tsx       # Check-in juez
│   ├── MyTournaments.tsx     # Lista torneos usuario
│   ├── LoginPage.tsx         # Login
│   ├── RegisterPage.tsx      # Registro
│   └── DemoPage.tsx          # Demo con datos EVO
├── services/
│   └── firestore.ts  # Operaciones CRUD Firestore
├── store/
│   ├── tournamentStore.ts    # Estado global (Zustand)
│   └── TournamentProvider.tsx # Context provider
├── types/
│   └── tournament.ts # TypeScript interfaces
├── App.tsx           # Rutas (React Router)
├── main.tsx          # Entry point
└── index.css         # Estilos (Tailwind-like)
```

## 🔧 Scripts Disponibles

```bash
npm run dev       # Servidor desarrollo (Vite)
npm run build     # Build producción (TypeScript + Vite)
npm run preview   # Preview build local
npm run deploy    # Deploy manual a GitHub Pages
```

## 📦 Dependencias Principales

- **React 18** + **TypeScript** + **Vite**
- **Firebase** (Auth, Firestore, Hosting opcional)
- **Zustand** (Estado global ligero)
- **React Router v6** (Routing SPA)
- **QRCode.react** (Generación QR)
- **UUID** (IDs únicos)

## 🤝 Contribuir

1. Fork el repo
2. Crea rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre Pull Request

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

## 🙏 Agradecimientos

- Inspirado en **Challonge**, **Start.gg (Smash.gg)** y el formato **EVO**
- Comunidad FGC por mantener vivo el formato de doble eliminación
- Firebase por el tier gratuito generoso
- GitHub Pages por hosting estático gratis

---

**¿Problemas?** Abre un [Issue](https://github.com/TU_USUARIO/app-de-torneos/issues) o revisa la [Wiki](https://github.com/TU_USUARIO/app-de-torneos/wiki).