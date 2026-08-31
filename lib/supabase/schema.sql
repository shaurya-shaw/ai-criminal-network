-- ==============================================================================
-- AI Criminal Intelligence Platform - Supabase Postgres Metadata Schema
-- Tables: cases, data_sources, entities, alerts
-- Description: Stores persistent case records, metadata, document-level
--              intelligence, entity registries, and real-time threat alerts.
-- ==============================================================================

-- 1. Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    classification TEXT DEFAULT 'RESTRICTED // LEVEL-3',
    ai_assessment JSONB,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'PENDING', 'CLOSED')
    ),
    priority TEXT DEFAULT 'HIGH' CHECK (
        priority IN ('HIGH', 'MEDIUM', 'LOW')
    ),
    investigator TEXT,
    jurisdiction TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create data_sources table (foreign key to cases)
CREATE TABLE IF NOT EXISTS public.data_sources (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
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

-- 3. Create entities table
CREATE TABLE IF NOT EXISTS public.entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT,
    type TEXT NOT NULL CHECK (
        type IN ('PERSON', 'ORGANIZATION', 'LOCATION', 'PHONE', 'ACCOUNT', 'VEHICLE')
    ),
    risk_score INTEGER NOT NULL DEFAULT 70,
    status TEXT NOT NULL DEFAULT 'MONITORING' CHECK (
        status IN ('FLAGGED', 'MONITORING', 'CLEARED')
    ),
    cases TEXT[] NOT NULL DEFAULT '{}',
    last_seen TEXT NOT NULL,
    attributes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'WARNING' CHECK (
        severity IN ('CRITICAL', 'WARNING', 'INFO')
    ),
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'ACKNOWLEDGED', 'RESOLVED')
    ),
    category TEXT,
    entity_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrations for existing tables:
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'HIGH';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS investigator TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS jurisdiction TEXT;
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- 5. Create performance & query indexes
CREATE INDEX IF NOT EXISTS idx_cases_status 
    ON public.cases(status);

CREATE INDEX IF NOT EXISTS idx_cases_case_number 
    ON public.cases(case_number);

CREATE INDEX IF NOT EXISTS idx_cases_created_at 
    ON public.cases(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_entities_type 
    ON public.entities(type);

CREATE INDEX IF NOT EXISTS idx_entities_status 
    ON public.entities(status);

CREATE INDEX IF NOT EXISTS idx_entities_risk_score 
    ON public.entities(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_entities_name_lower 
    ON public.entities (lower(name), type);

CREATE INDEX IF NOT EXISTS idx_alerts_case_id 
    ON public.alerts(case_id);

CREATE INDEX IF NOT EXISTS idx_alerts_severity 
    ON public.alerts(severity);

CREATE INDEX IF NOT EXISTS idx_alerts_status 
    ON public.alerts(status);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
    ON public.alerts(created_at DESC);

-- 6. Create automatic timestamp triggers
CREATE OR REPLACE FUNCTION update_cases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cases_updated_at ON public.cases;
CREATE TRIGGER trigger_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION update_cases_timestamp();

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

CREATE OR REPLACE FUNCTION update_entities_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_entities_updated_at ON public.entities;
CREATE TRIGGER trigger_entities_updated_at
    BEFORE UPDATE ON public.entities
    FOR EACH ROW
    EXECUTE FUNCTION update_entities_timestamp();

CREATE OR REPLACE FUNCTION update_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alerts_updated_at ON public.alerts;
CREATE TRIGGER trigger_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_timestamp();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role / backend queries
DROP POLICY IF EXISTS "Service role full access on cases" ON public.cases;
CREATE POLICY "Service role full access on cases"
    ON public.cases
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on data_sources" ON public.data_sources;
CREATE POLICY "Service role full access on data_sources"
    ON public.data_sources
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on entities" ON public.entities;
CREATE POLICY "Service role full access on entities"
    ON public.entities
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alerts" ON public.alerts;
CREATE POLICY "Service role full access on alerts"
    ON public.alerts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read records
DROP POLICY IF EXISTS "Allow authenticated users to read cases" ON public.cases;
CREATE POLICY "Allow authenticated users to read cases"
    ON public.cases
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read data_sources" ON public.data_sources;
CREATE POLICY "Allow authenticated users to read data_sources"
    ON public.data_sources
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read entities" ON public.entities;
CREATE POLICY "Allow authenticated users to read entities"
    ON public.entities
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read alerts" ON public.alerts;
CREATE POLICY "Allow authenticated users to read alerts"
    ON public.alerts
    FOR SELECT
    TO authenticated
    USING (true);
