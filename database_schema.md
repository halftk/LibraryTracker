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

## 📜 Script SQL Completo e Idempotente para Supabase

Copiar y ejecutar todo este bloque en el **SQL Editor** de tu panel de Supabase:

```sql
-- 1. Crear extensión uuid-ossp si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tipo ENUM para el estado del juego (Idempotente)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status') THEN 
        CREATE TYPE game_status AS ENUM ('Pendiente', 'En curso', 'Jugado', 'Abandonado', 'Prestado'); 
    END IF; 
END $$;

-- 3. Tabla Profiles (Perfil público)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    steam_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Tabla Games (Snapshot de IGDB)
CREATE TABLE IF NOT EXISTS public.games (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT,
    release_year INT,
    genres TEXT[] DEFAULT '{}',
    developers TEXT[] DEFAULT '{}',
    steam_appid BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Tabla Library Items (Juegos en la biblioteca del usuario)
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    status game_status NOT NULL DEFAULT 'Pendiente',
    start_date DATE,
    finish_date DATE,
    playtime_hours NUMERIC(6, 1) DEFAULT 0.0 NOT NULL CHECK (playtime_hours >= 0),
    rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    notes TEXT,
    lent_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_game_platform UNIQUE (user_id, game_id, platform)
);

-- 6. Tabla Reviews (Reseñas/Impresiones por item)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 8. Limpiar políticas previas si re-ejecutas el script
DROP POLICY IF EXISTS "Perfiles públicos legibles por todos" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Juegos legibles por todos" ON public.games;
DROP POLICY IF EXISTS "Usuarios pueden registrar juegos" ON public.games;
DROP POLICY IF EXISTS "Items de biblioteca legibles por todos" ON public.library_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar en su propia biblioteca" ON public.library_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios items" ON public.library_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios items" ON public.library_items;
DROP POLICY IF EXISTS "Reseñas legibles por todos" ON public.reviews;
DROP POLICY IF EXISTS "Usuarios pueden gestionar reseñas de sus items" ON public.reviews;

-- 9. Crear Políticas RLS
CREATE POLICY "Perfiles públicos legibles por todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Juegos legibles por todos" ON public.games FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden registrar juegos" ON public.games FOR INSERT WITH CHECK (true);

CREATE POLICY "Items de biblioteca legibles por todos" ON public.library_items FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar en su propia biblioteca" ON public.library_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus propios items" ON public.library_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus propios items" ON public.library_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reseñas legibles por todos" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden gestionar reseñas de sus items" ON public.reviews FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.library_items
        WHERE library_items.id = reviews.library_item_id
        AND library_items.user_id = auth.uid()
    )
);

-- 10. Trigger para auto-crear registro en profiles al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
