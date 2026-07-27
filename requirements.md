# 📚 Especificación de Requisitos - LibraryTracker

> **LibraryTracker** es una aplicación web moderna para gestionar la biblioteca personal de videojuegos: juegos jugados, en curso, pendientes, abandonados y prestados. 
> Este documento sirve como la fuente de verdad (*Source of Truth*) de los requisitos funcionales, reglas de negocio, arquitectura técnica y modelo de datos del sistema.

---

## 1. 🎯 Visión General e Ideas Clave

- **Gestión Completa de Biblioteca**: Registrar y clasificar videojuegos en diferentes estados de progreso o préstamo.
- **Búsqueda e Integración con IGDB**: Integración con la API de [IGDB](https://www.igdb.com/) para buscar videojuegos al vuelo y obtener metadatos ricos (título, portada, año de lanzamiento, géneros, desarrolladores, etc.).
- **Almacenamiento Híbrido de Datos**: Los metadatos del juego se obtienen de IGDB y se guardan como instantánea (*snapshot*) en la biblioteca del usuario junto con sus datos y métricas personales.
- **Modelo Juego + Plataforma**: Un mismo juego puede estar registrado múltiples veces si se juega en plataformas distintas (cada entrada es la combinación única `[Juego + Plataforma]`).
- **Importación y Exportación de Datos**: Opción para exportar e importar la biblioteca completa del usuario en formatos estándar (**JSON / CSV**).
- **Interfaz Moderna y Atractiva**: Experiencia de usuario (UX/UI) cuidada, rápida y limpia con soporte para tema claro/oscuro.

---

## 2. 🗃️ Modelo de Datos y Campos de la Biblioteca

Cada elemento en la biblioteca del usuario representa un par **(Juego, Plataforma)** y pertenece a un usuario (`user_id`):

### 2.1 Metadatos Provenientes de IGDB (Instantánea)
- `igdb_id`: Identificador único del juego en IGDB.
- `titulo`: Nombre oficial del juego.
- `portada_url`: URL de la imagen de portada.
- `anio_lanzamiento`: Año de publicación.
- `generos`: Lista de géneros (ej. RPG, Acción, Aventura).
- `desarrolladores`: Estudio/compañía desarrolladora.
- `steam_appid`: (Opcional) Identificador del juego en Steam si existe en IGDB (`external_games`).

### 2.2 Datos Propios del Usuario
- `user_id`: Identificador del usuario propietario de la biblioteca.
- `plataforma`: Plataforma jugada (ej. PC, PS5, Nintendo Switch, Xbox Series X, etc.). **(Requerido)**.
- `estado`: Estado actual del juego en la biblioteca (`Pendiente`, `En curso`, `Jugado`, `Abandonado`, `Prestado`). **(Requerido)**.
- `fecha_inicio`: Fecha en la que se empezó a jugar.
- `fecha_fin`: Fecha en la que se terminó o abandonó el juego.
- `tiempo_jugado_horas`: Tiempo estimado u horas jugadas (permite calcular el tiempo promedio jugado).
- `puntuacion`: Valoración personal (0 a 5 estrellas, admite medios puntos ej. 4.5).
- `resenas`: Lista de notas, impresiones o reseñas escritas por el usuario.
- `prestado_a`: Nombre de la persona a la que se le prestó el juego *(Fase 1: texto libre; Fase 2: usuario registrado en la app)*.

---

## 3. 🔄 Estados del Juego y Reglas de Validación

Un registro en la biblioteca debe cumplir con las siguientes condiciones según su estado:

| Estado | Descripción | Campos Obligatorios | Campos Opcionales / Recomendados |
| :--- | :--- | :--- | :--- |
| **`Pendiente`** | Estado por defecto al añadir un juego a la biblioteca. | Plataforma | Fecha de inicio |
| **`En curso`** | El usuario está jugando el título actualmente. | Plataforma | Fecha de inicio, Tiempo jugado |
| **`Jugado`** | Juego completado/terminado por el usuario. | Plataforma, Fecha de fin, Puntuación | Fecha de inicio, Tiempo jugado, Reseña(s) |
| **`Abandonado`** | Juego que el usuario dejó de jugar sin terminar. | Plataforma | Fecha de fin, Puntuación, Motivo / Reseña, Tiempo jugado |
| **`Prestado`** | Juego físico o digital prestado a otra persona. | Plataforma, Prestado a (`prestado_a`) | Fecha de préstamo, Reseña |

### Reglas de Transición de Estado
1. **Paso a `Jugado`**: Requiere asignar obligatoriamente una fecha de fin (`fecha_fin`) y una puntuación de 0 a 5 estrellas.
2. **Paso a `Prestado`**: Requiere especificar obligatoriamente a quién se le prestó (`prestado_a`).
3. **Múltiples Plataformas**: Un usuario puede añadir el mismo juego dos o más veces siempre que especifique plataformas distintas (ej. *The Witcher 3* en *PC* y *The Witcher 3* en *Nintendo Switch*).

---

## 4. 📊 Sistema de Estadísticas y Métricas

La aplicación calculará y mostrará estadísticas en tiempo real sobre la biblioteca del usuario:

- **Totales Globales**:
  - Total de registros en la biblioteca.
  - Cantidad por estado: *Jugados*, *En curso*, *Pendientes*, *Abandonados*, *Prestados*.
- **Métricas Promedio**:
  - Puntuación promedio global de juegos terminados/valorados.
  - Tiempo de juego promedio (horas por juego).
- **Desgloses y Distribución (Gráficos/Filtros)**:
  - Distribución por **Plataforma**.
  - Distribución por **Género**.
  - Distribución por **Año de lanzamiento**.
  - Registro cronológico por **Año y Mes** (juegos completados por mes/año).

---

## 5. 🏗️ Arquitectura Técnica e Integraciones

- **Framework**: **Astro** en modo SSR (Server-Side Rendering) con adaptador `@astrojs/vercel`.
- **Despliegue**: **Vercel** (Capa Gratuita / Hobby).
- **Base de Datos & Auth**: **Supabase** (PostgreSQL Gratuito en la nube).
  - Incluye autenticación integrada (Email/Password, Google OAuth, Microsoft OAuth, Steam OpenID).
- **API de IGDB & Twitch OAuth2**:
  - **Client ID**: Configurado mediante variable de entorno `TWITCH_CLIENT_ID`.
  - **Client Secret**: Configurado mediante variable de entorno `TWITCH_CLIENT_SECRET`.
  - *Proxy Endpoint*: Endpoints SSR en Astro (`/api/igdb/search`, `/api/igdb/game/[id]`) que gestionan la obtención automática del token OAuth de Twitch y sirven los resultados de forma segura sin exponer credenciales al cliente.
- **Respaldo Automático (Backups Nocturnos)**:
  - Programación de respaldos nocturnos automáticos de la base de datos PostgreSQL (mediante Supabase Scheduled Backups o GitHub Actions / Cron Job) para protección de datos y recuperación ante desastres.

---

## 6. 📥📤 Importación y Exportación de Datos

### 6.1 Formatos Soportados

#### Formato A: CSV (para importar desde Excel u hojas de cálculo)
Columnas soportadas al importar un CSV:

| Columna | Obligatorio | Valor por defecto | Notas |
| :--- | :--- | :--- | :--- |
| `Titulo` o `Nombre` | **Sí** | — | Se usa para buscar en IGDB |
| `Plataforma` | No | `PC` | Texto libre: PC, PS5, Switch, etc. |
| `Fecha Fin` | No | null | Formatos: YYYY-MM-DD o DD/MM/YYYY |
| `Estado` | No | `Jugado` si hay fecha fin, sino `Pendiente` | Pendiente / En curso / Jugado / Abandonado / Prestado |
| `Puntuacion` | No | null | Número de 0 a 5 |
| `Horas` | No | 0 | Número entero o decimal |
| `Notas` | No | null | Texto libre |

#### Formato B: JSON nativo (backup completo de LibraryTracker)
Al exportar en JSON, se guardan todos los campos incluyendo `igdb_id`, `cover_url`, `genres`, `developers`, etc. Al re-importar JSON, no es necesario hacer matching con IGDB, ya que los datos están completos.

### 6.2 Flujo de Importación CSV (3 Pasos)

**Paso 1 — Subida de Archivo**
- El usuario arrastra o selecciona un archivo `.csv` o `.json`.
- El sistema parsea el archivo y muestra cuántas filas/entradas se detectaron.
- Se muestran las columnas detectadas para confirmación.

**Paso 2 — Matching con IGDB (Revisión y Corrección)**
- Para cada fila del CSV, se lanza automáticamente una búsqueda en la API de IGDB.
- Cada resultado tiene uno de estos estados visuales:
  - 🟢 **Coincidencia Exacta**: Alta confianza — se asigna automáticamente (muestra portada y año para confirmar).
  - 🟡 **Múltiples Opciones**: Se muestra un desplegable para que el usuario elija el correcto (ej: *God of War 2005* vs *God of War 2018*).
  - 🔴 **No Encontrado**: El usuario puede corregir el título manualmente o omitir la fila.
- El usuario puede revisar y ajustar todos los matchings antes de importar.

**Paso 3 — Confirmación e Importación**
- Se muestra un resumen: X juegos listos para importar, Y omitidos.
- Al pulsar **"Confirmar e Importar"**, se insertan en bloque en Supabase.
- Si un juego ya existe en la misma plataforma (conflicto de unicidad), se ofrece la opción de **Omitir** o **Actualizar** el registro existente.

### 6.3 Exportación
- **Exportar JSON**: Descarga un archivo `librarytracker-backup-YYYY-MM-DD.json` con todos los datos completos del usuario.
- **Exportar CSV**: Descarga un archivo `librarytracker-YYYY-MM-DD.csv` con las columnas legibles por Excel/Sheets.

---

## 7. 🚀 Hoja de Ruta y Futuras Mejoras

### Fase 1: MVP (Producto Mínimo Viable) ✅
- Proyecto en Astro con Vanilla CSS y componentes Vue interactivos.
- Buscador interactivo de juegos consumiendo IGDB mediante API SSR en Astro.
- Gestión de biblioteca de usuario con persistencia en Supabase.
- Panel de Estadísticas con métricas básicas.

### Fase 2: Importación/Exportación & Backups ✅ (En progreso)
- **Importación y Exportación CSV/JSON**: Flujo en 3 pasos con matching asistido contra IGDB.
- **Backups Nocturnos Automáticos**: GitHub Actions ejecuta `pg_dump` cada noche a las 03:00 AM UTC y guarda el artefacto en GitHub por 30 días.

### Fase 3: Autenticación Social
- Inicio de sesión con Google OAuth y Microsoft OAuth vía Supabase Auth.
- Gestión de perfiles públicos / compartibles de bibliotecas.

### Fase 4: Integración con Steam (Vinculación de Biblioteca)
- Login con Steam (OpenID).
- Consulta de juegos poseídos mediante Steam Web API (`IPlayerService/GetOwnedGames`).
- Cruce automático de datos con `igdb_id` → `steam_appid` para importar horas jugadas.
