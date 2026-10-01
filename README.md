# 🎮 LibraryTracker

> **LibraryTracker** es una aplicación web moderna y elegante para gestionar y hacer seguimiento de tu colección personal de videojuegos, con sincronización en la nube a través de Supabase e integración en tiempo real con la base de datos de **IGDB**.

---

## ✨ Características Principales

- 🔍 **Búsqueda en Tiempo Real con IGDB**: Consulta millones de videojuegos con portadas en alta definición, año de lanzamiento, desarrolladores, géneros y enlace a Steam.
- 🌐 **Soporte Multilingüe (Español / Inglés)**: Selector global de idioma en el header con banderas vectoriales SVG (🇪🇸 / 🇬🇧). Prioriza nombres y datos regionalizados en español cuando están disponibles en IGDB.
- 📊 **Gestión de Estados**: Categoriza tu biblioteca en *Pendientes*, *En curso*, *Jugados*, *Abandonados* y *Prestados*.
- 🔀 **Filtros y Ordenación Avanzada**:
  - Filtro rápido por texto y estado.
  - Ordenación por *Recientes*, *A-Z*, *Valoración* y *Año de lanzamiento*.
  - Conmutador bidireccional de orden (ascendente `↑` / descendente `↓`).
- 📦 **Asistente de Importación y Exportación en 3 Pasos**:
  - **Exportación**: Backups completos en **JSON nativo** y **CSV estándar**.
  - **Importación desde CSV / Excel**: Carga de archivos con normalización automática de plataformas (*GameCube, GC, GameBoy, GBA, NDS, Wii...*).
  - **Emparejamiento Inteligente**: Asignación automática (🟢) y ambigua (🟡) con desplegable de candidatas y corrección de título manual en tiempo real.
  - **Gestión de Conflictos**: Control global o por juego para *Sobreescribir* o *Omitir* duplicados, además de opción para vaciar la biblioteca y re-importar de cero.
- 📅 **Fechas de Seguimiento**: Registro opcional de *Fecha de Inicio* y *Fecha de Fin* de cada videojuego.
- 🤝 **Control de Préstamos**: Anota a quién le has prestado cada juego físico o digital.
- 📱 **Aplicación Web Instalable (PWA)**: Compatible con móviles (Android / iOS Safari) y ordenadores. Los usuarios pueden pulsar el botón **"Instalar App en tu dispositivo"** en el menú para añadirla como una aplicación nativa en su pantalla de inicio con su propio icono.
- 📱 **Diseño Responsive & Glassmorphism**: Interfaz adaptada a dispositivos móviles, tablets y pantallas de escritorio con modo oscuro refinado.
- 🛡️ **Seguridad y Backups Automáticos**:
  - Control de acceso de datos con **Row Level Security (RLS)** en PostgreSQL/Supabase.
  - **Backups diarios automatizados** mediante GitHub Actions (`pg_dump` cada día a las 03:00 UTC).

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Astro](https://astro.build/) (Modo Server / SSR) con adaptador `@astrojs/vercel`.
- **UI & Reactividad**: [Vue 3](https://vuejs.org/) (Composition API `<script setup lang="ts">`).
- **Base de Datos & Autenticación**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Supabase Auth).
- **API Externa**: [IGDB API v4](https://api-docs.igdb.com/) (Autenticación OAuth2 vía Twitch).
- **Estilos**: Vanilla CSS3 (Design System con variables CSS, animaciones suaves y componentes adaptativos).

---

## 📁 Estructura del Proyecto

```text
LibraryTracker/
├── .github/workflows/
│   └── db-backup.yml        # Workflow de backup diario a Supabase PostgreSQL
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AddGameModal.vue       # Modal para añadir / editar un juego
│   │   ├── GameSearch.vue         # Buscador principal con autocompletado IGDB
│   │   ├── ImportExportModal.vue  # Asistente de importación CSV/JSON y exportación
│   │   ├── LibraryGrid.vue        # Vista principal de la biblioteca con filtros y ordenación
│   │   ├── StatsDashboard.vue     # Panel de estadísticas visuales
│   │   └── UserMenu.vue           # Menú de usuario, login/registro y selector de idioma
│   ├── layouts/
│   │   └── Layout.astro           # Estructura HTML base y Header global
│   ├── lib/
│   │   ├── igdb.ts                # Cliente API IGDB (OAuth2 Twitch + Formateo)
│   │   └── supabase.ts            # Cliente e isomorphic helpers de Supabase
│   ├── pages/
│   │   ├── api/igdb/search.ts     # Endpoint proxy API para búsquedas IGDB
│   │   └── index.astro            # Página principal de la aplicación
│   └── styles/
│       └── global.css             # Sistema de diseño global y variables CSS
├── database_schema.md             # Script SQL idempotente para Supabase
└── package.json
```

---

## 🚀 Guía de Instalación Local

### 1. Requisitos Previos

- [Node.js](https://nodejs.org/) v18.0.0 o superior.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (opcional pero recomendado para ejecutar Supabase en local sin tocar producción).
- Una cuenta de desarrollador en [Twitch Developers](https://dev.twitch.tv/) para obtener credenciales de la API de IGDB.

### 2. Clonar el Repositorio e Instalar Dependencias

```bash
git clone https://github.com/tu-usuario/LibraryTracker.git
cd LibraryTracker
npm install
```

### 3. Opción A: Desarrollo Local Independiente con Supabase (Docker) — Recomendado

Para desarrollar en local **sin modificar la base de datos de producción**:

1. Asegúrate de tener **Docker Desktop** abierto.
2. Inicia la base de datos local de Supabase:
   ```bash
   npx supabase start
   ```
   *Esto creará e iniciará automáticamente los contenedores locales (PostgreSQL, Auth, Studio) y aplicará la migración inicial de [`supabase/migrations`](file:///c:/Users/halft/Documents/Coding%20Projects/LibraryTracker/supabase/migrations).*
3. Copia el archivo de variables locales:
   ```bash
   cp .env.local.example .env.local
   ```
4. Abre el panel de administración local de Supabase Studio en [http://127.0.0.1:54323](http://127.0.0.1:54323).

### 4. Opción B: Conexión Directa a Supabase Cloud (Producción)

Si prefieres usar un proyecto remoto de Supabase:

1. Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
   TWITCH_CLIENT_ID=tu-twitch-client-id
   TWITCH_CLIENT_SECRET=tu-twitch-client-secret
   ```
2. Ejecuta el script SQL [`database_schema.md`](file:///c:/Users/halft/Documents/Coding%20Projects/LibraryTracker/database_schema.md) en el **SQL Editor** de tu proyecto en Supabase Cloud.

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

---

## 📦 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local de Astro.
- `npm run test`: Ejecuta la suite completa de pruebas unitarias con Vitest.
- `npm run test:watch`: Ejecuta las pruebas en modo interactivo/watch.
- `npm run db:start`: Inicia la base de datos local de Supabase con Docker.
- `npm run db:stop`: Detiene los contenedores locales de Supabase.
- `npm run db:status`: Muestra el estado y claves de la API local de Supabase.
- `npm run db:reset`: Reinicia la base de datos local y vuelve a ejecutar todas las migraciones.
- `npm run build`: Compila la aplicación para producción (adaptador Vercel).
- `npm run preview`: Previsualiza la build de producción localmente.

---

## 🧪 Pruebas Automáticas

El proyecto cuenta con una suite de pruebas unitarias basadas en **Vitest** y **Vue Test Utils** que validan componentes clave (`LibraryGrid`, `AddGameModal`, `GameSearch`, `StatsDashboard`) y utilidades de la plataforma (`platforms.ts`).

> [!IMPORTANT]
> **Normas de desarrollo e integración continua**:
> 1. **Mantenimiento y creación de pruebas**: Ante cualquier cambio en el código o nueva funcionalidad, se debe añadir nuevos tests o actualizar las pruebas existentes que se vean afectadas.
> 2. **Verificación previa a finalización**: Tras realizar cambios, **SIEMPRE** se debe ejecutar `npm run test` y `npm run build` para validar que todas las pruebas pasen al 100% y la compilación sea totalmente limpia.


---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. ¡Siéntete libre de hacer un fork, mejorarlo y contribuir!

