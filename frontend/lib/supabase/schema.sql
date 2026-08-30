-- ==============================================================================
-- AI Criminal Intelligence Platform - Supabase Postgres Metadata Schema
-- Table: data_sources
-- Description: Stores structured metadata, ingestion lifecycle, and indexing
--              for files stored in Supabase Storage.
-- ==============================================================================

-- 1. Create data_sources table
CREATE TABLE IF NOT EXISTS public.data_sources (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (
        source_type IN (
            'FIR',
            'CDR',
            'FINANCIAL',
            'SURVEILLANCE',
            'REPORT',
            'OSINT',
            'CUSTOMS',
            'OTHER'
        )
    ),
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    file_size BIGINT,
    uploaded_by TEXT,
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (
        status IN (
            'UPLOADED',
            'PROCESSING',
            'REVIEW',
            'IMPORTED',
            'FAILED'
        )
    ),
    extracted_data JSONB,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration for existing tables:
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- 2. Create performance & query indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_case_id 
    ON public.data_sources(case_id);

CREATE INDEX IF NOT EXISTS idx_data_sources_source_type 
    ON public.data_sources(source_type);

CREATE INDEX IF NOT EXISTS idx_data_sources_status 
    ON public.data_sources(status);

CREATE INDEX IF NOT EXISTS idx_data_sources_uploaded_by 
    ON public.data_sources(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_data_sources_uploaded_at 
    ON public.data_sources(uploaded_at DESC);

-- 3. Create updated_at automatic trigger
CREATE OR REPLACE FUNCTION update_data_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_data_sources_updated_at ON public.data_sources;

CREATE TRIGGER trigger_data_sources_updated_at
    BEFORE UPDATE ON public.data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_data_sources_timestamp();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role / backend queries
DROP POLICY IF EXISTS "Service role full access on data_sources" ON public.data_sources;
CREATE POLICY "Service role full access on data_sources"
    ON public.data_sources
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read records
DROP POLICY IF EXISTS "Allow authenticated users to read data_sources" ON public.data_sources;
CREATE POLICY "Allow authenticated users to read data_sources"
    ON public.data_sources
    FOR SELECT
    TO authenticated
    USING (true);
