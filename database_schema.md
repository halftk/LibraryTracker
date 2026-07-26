# 🗄️ Esquema de Base de Datos - LibraryTracker (Supabase / PostgreSQL)

> Este documento especifica el modelo relacional de datos, tipos de datos, restricciones de integridad y políticas de seguridad (RLS) para **LibraryTracker** implementado sobre **Supabase (PostgreSQL)**.

---

## 📐 Diagrama Entidad-Relación (E-R Conceptualmente)

```
 [auth.users] (Supabase Auth)
       │ (1:1)
       ▼
 [public.profiles]
       │
       │ (1:N)
       ▼
 [public.library_items] ◄─── (N:1) ─── [public.games] (IGDB Cache Snapshot)
       │
       │ (1:N)
       ▼
 [public.reviews]
```

---

## 📋 Tablas de la Base de Datos

### 1. `public.profiles`
Extensión del perfil público del usuario registrado mediante Supabase Auth.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    steam_id TEXT UNIQUE, -- Para la Fase 3 (Integración con Steam)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2. `public.games`
Instantánea (*snapshot*) de los metadatos del juego obtenidos desde IGDB. Evita realizar peticiones repetidas a IGDB y garantiza que la información persista aunque cambie en la API externa.

```sql
CREATE TABLE public.games (
    id BIGINT PRIMARY KEY, -- IGDB Game ID
    title TEXT NOT NULL,
    cover_url TEXT,
    release_year INT,
    genres TEXT[] DEFAULT '{}',
    developers TEXT[] DEFAULT '{}',
    steam_appid BIGINT, -- ID del juego en Steam (obtenido de external_games en IGDB)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3. `public.library_items`
Representa una entrada en la biblioteca del usuario. La clave única está formada por la combinación de `(user_id, game_id, platform)`.

```sql
CREATE TYPE game_status AS ENUM (
    'Pendiente',
    'En curso',
    'Jugado',
    'Abandonado',
    'Prestado'
);

CREATE TABLE public.library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- ej: 'PC', 'PS5', 'Nintendo Switch', 'Xbox Series X'
    status game_status NOT NULL DEFAULT 'Pendiente',
    start_date DATE,
    finish_date DATE,
    playtime_hours NUMERIC(6, 1) DEFAULT 0.0 NOT NULL CHECK (playtime_hours >= 0),
    rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    notes TEXT,
    lent_to TEXT, -- Nombre de la persona si status = 'Prestado'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Restricción de unicidad: Un usuario no puede tener duplicados del mismo juego en la misma plataforma
    CONSTRAINT unique_user_game_platform UNIQUE (user_id, game_id, platform)
);
```

### 4. `public.reviews`
Permite asociar múltiples impresiones, bitácoras o reseñas a un juego registrado en la biblioteca.

```sql
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 🔒 Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)

Supabase requiere habilitar RLS para asegurar que los usuarios solo modifiquen sus propios datos.

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Lectura pública, actualización solo del propio perfil
CREATE POLICY "Perfiles públicos legibles por todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Games: Lectura pública, inserción por usuarios autenticados al añadir a biblioteca
CREATE POLICY "Juegos legibles por todos" ON public.games FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden registrar juegos" ON public.games FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Library Items: Lectura pública/propia, control total sobre items propios
CREATE POLICY "Items de biblioteca legibles por todos" ON public.library_items FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar en su propia biblioteca" ON public.library_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus propios items" ON public.library_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus propios items" ON public.library_items FOR DELETE USING (auth.uid() = user_id);

-- 4. Reviews: Lectura pública, control total sobre sus reseñas
CREATE POLICY "Reseñas legibles por todos" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden gestionar reseñas de sus items" ON public.reviews FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.library_items
        WHERE library_items.id = reviews.library_item_id
        AND library_items.user_id = auth.uid()
    )
);
```

---

## ⚡ Triggers Automáticos (Disparadores)

### Creación Automática de Perfil tras registro Auth
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
