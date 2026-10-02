-- Migration: Add Books and Book Library Items tables with RLS policies

-- 1. Create ENUM for book status if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_status') THEN 
        CREATE TYPE book_status AS ENUM ('Pendiente', 'Leyendo', 'Leído', 'Abandonado', 'Prestado'); 
    END IF; 
END $$;

-- 2. Table for Books (Snapshot from Google Books API)
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY, -- Google Books volume ID (e.g., "zyTCAl4tu-UC")
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT '{}',
    cover_url TEXT,
    published_year INT,
    publisher TEXT,
    page_count INT,
    categories TEXT[] DEFAULT '{}',
    isbn TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Table for Book Library Items (User book readings)
CREATE TABLE IF NOT EXISTS public.book_library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    format TEXT NOT NULL DEFAULT 'Físico', -- 'Físico', 'Ebook', 'Audiolibro'
    status book_status NOT NULL DEFAULT 'Pendiente',
    start_date DATE,
    finish_date DATE,
    current_page INT DEFAULT 0 CHECK (current_page >= 0),
    total_pages INT DEFAULT 0 CHECK (total_pages >= 0),
    rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    notes TEXT,
    lent_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_library_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Books table policies: Everyone can read and insert books
DROP POLICY IF EXISTS "Books cache readable by everyone" ON public.books;
CREATE POLICY "Books cache readable by everyone" 
ON public.books FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can cache books" ON public.books;
CREATE POLICY "Authenticated users can cache books" 
ON public.books FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Book library items policies: Users can manage only their own items
DROP POLICY IF EXISTS "Users can read own book library items" ON public.book_library_items;
CREATE POLICY "Users can read own book library items" 
ON public.book_library_items FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own book library items" ON public.book_library_items;
CREATE POLICY "Users can insert own book library items" 
ON public.book_library_items FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own book library items" ON public.book_library_items;
CREATE POLICY "Users can update own book library items" 
ON public.book_library_items FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own book library items" ON public.book_library_items;
CREATE POLICY "Users can delete own book library items" 
ON public.book_library_items FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_library_items_user_id ON public.book_library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_book_library_items_book_id ON public.book_library_items(book_id);
CREATE INDEX IF NOT EXISTS idx_book_library_items_status ON public.book_library_items(status);
