# 🛠️ Guía de Desarrollo y Despliegue - LibraryTracker

> Esta guía describe el flujo de trabajo para ejecutar **LibraryTracker** en entorno local, configurar las variables de entorno, conectar la base de datos en **Supabase**, desplegar en **Vercel** y mantener la disciplina de desarrollo respetando la especificación de requisitos.

---

## 1. ⚙️ Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu máquina:

- **Node.js**: v24.18.0 o superior.
- **npm** (incluido con Node.js) o `pnpm`.
- **Cuenta en Supabase**: Gratuita para la base de datos PostgreSQL y Auth ([supabase.com](https://supabase.com)).
- **Cuenta en Vercel**: Gratuita para el alojamiento y CI/CD ([vercel.com](https://vercel.com)).

---

## 2. 🔐 Configuración de Variables de Entorno (`.env`)

Crea un archivo llamado `.env` en la raíz del proyecto (basado en `.env.example`). 

```env
# -----------------------------------------------------------------------------
# API de IGDB / Twitch Developer Credentials
# -----------------------------------------------------------------------------
TWITCH_CLIENT_ID="twitch_client_id"
TWITCH_CLIENT_SECRET="twitch_client_secret"

# -----------------------------------------------------------------------------
# Configuración de Supabase
# -----------------------------------------------------------------------------
PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-publica"
```

> ⚠️ **IMPORTANTE**: El archivo `.env` nunca debe subirse al repositorio Git. Asegúrate de que esté incluido en `.gitignore`.

---

## 3. 🚀 Ejecución en Modo Desarrollo

### 3.1 Instalación de dependencias
```bash
npm install
```

### 3.2 Iniciar servidor local
```bash
npm run dev
```
El servidor local se iniciará en `http://localhost:4321`. Podrás probar las rutas SSR y la interacción con los componentes de Vue 3 en tiempo real.

### 3.3 Verificación y Compilación de Producción
Antes de subir cualquier cambio o hacer deploy, verifica que no haya errores de compilación:
```bash
npm run build
```

Para probar la compilación localmente antes de Vercel:
```bash
npm run preview
```

---

## 4. ☁️ Despliegue y Conexión con Vercel

### Opción A: Despliegue Automático mediante GitHub (Recomendado)
1. Sube tu código a un repositorio en **GitHub**.
2. Entra en tu panel de **Vercel** (`https://vercel.com/dashboard`) y haz clic en **"Add New" > "Project"**.
3. Importa el repositorio de GitHub de `LibraryTracker`.
4. Vercel detectará automáticamente **Astro**.
5. En la sección **Environment Variables**, añade todas las variables definidas en tu archivo `.env`:
   - `TWITCH_CLIENT_ID`
   - `TWITCH_CLIENT_SECRET`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
6. Haz clic en **Deploy**. Cada `git push` a la rama principal actualizará automáticamente el sitio.

### Opción B: Despliegue vía Vercel CLI
```bash
# Instalar / Ejecutar Vercel CLI
npx vercel
```
Sigue las instrucciones en pantalla para vincular tu proyecto.

---

## 5. 🗄️ Configuración Inicial de Supabase

1. Crea un nuevo proyecto en **Supabase**.
2. Ve al **SQL Editor** en el panel de Supabase.
3. Copia y ejecuta todo el script SQL definido en [`database_schema.md`](file:///c:/Users/halft/Documents/Coding%20Projects/LibraryTracker/database_schema.md).
4. Ve a **Project Settings > API** para obtener tu `URL` y `anon key` e insertarlas en tu `.env`.

---

## 6. 📜 Metodología y Reglas de Trabajo

1. **Fuente de Verdad (`requirements.md`)**:
   - Todas las nuevas funcionalidades, campos o cambios de flujo deben ser contrastados contra [`requirements.md`](file:///c:/Users/halft/Documents/Coding%20Projects/LibraryTracker/requirements.md).
   - Si se añade un cambio estructural a la aplicación, se debe actualizar primero o simultáneamente `requirements.md`.

2. **Esquema de Base de Datos (`database_schema.md`)**:
   - Cualquier modificación en tablas, columnas o tipos de datos debe registrarse en [`database_schema.md`](file:///c:/Users/halft/Documents/Coding%20Projects/LibraryTracker/database_schema.md).

3. **Validación de Funcionalidades**:
   - Antes de considerar una tarea terminada, se debe ejecutar `npm run build` para asegurar la integridad de Astro y TypeScript/Vue.
