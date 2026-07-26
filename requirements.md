# 📚 Especificación de Requisitos - LibraryTracker

> **LibraryTracker** es una aplicación web moderna para gestionar la biblioteca personal de videojuegos: juegos jugados, en curso, pendientes, abandonados y prestados. 
> Este documento sirve como la fuente de verdad (*Source of Truth*) de los requisitos funcionales, reglas de negocio, arquitectura técnica y modelo de datos del sistema.

---

## 1. 🎯 Visión General e Ideas Clave

- **Gestión Completa de Biblioteca**: Registrar y clasificar videojuegos en diferentes estados de progreso o préstamo.
- **Búsqueda e Integración con IGDB**: Integración con la API de [IGDB](https://www.igdb.com/) para buscar videojuegos al vuelo y obtener metadatos ricos (título, portada, año de lanzamiento, géneros, desarrolladores, etc.).
- **Almacenamiento Híbrido de Datos**: Los metadatos del juego se obtienen de IGDB y se guardan como instantánea (*snapshot*) en la biblioteca del usuario junto con sus datos y métricas personales.
- **Modelo Juego + Plataforma**: Un mismo juego puede estar registrado múltiples veces si se juega en plataformas distintas (cada entrada es la combinación única `[Juego + Plataforma]`).
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

---

## 6. 🚀 Hoja de Ruta y Futuras Mejoras

### Fase 1: MVP (Producto Mínimo Viable)
- Proyecto en Astro con Tailwind CSS / Vanilla CSS y componentes interactivos.
- Buscador interactivo de juegos consumiendo IGDB mediante API SSR en Astro.
- Gestión de biblioteca de usuario con persistencia en Supabase (o base de datos elegida).
- Panel de Estadísticas con gráficos interactivos.

### Fase 2: Autenticación Social (Google & Microsoft)
- Inicio de sesión con proveedores de identidad Google OAuth y Microsoft OAuth vía Supabase Auth.
- Gestión de usuarios y perfiles públicos / compartibles de bibliotecas.

### Fase 3: Integración con Steam (Vinculación de Biblioteca)
- Login con Steam (OpenID).
- Consulta de juegos poseídos mediante Steam Web API (`IPlayerService/GetOwnedGames`).
- Cruce automático de datos: IGDB contiene mapeos de `steam_appid` en su tabla/endpoint `external_games` (`category = 1`), lo que permite vincular e importar automáticamente la biblioteca de Steam hacia LibraryTracker con sus horas jugadas.


