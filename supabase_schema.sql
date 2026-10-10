-- ==============================================================================
-- FORMCRAFT & COURSEFLOW STUDIO - CUSTOM SCHEMA: "registrations"
-- Isolated PostgreSQL schema to prevent any collision with existing "public" tables
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the dedicated "registrations" schema
CREATE SCHEMA IF NOT EXISTS registrations;

-- 3. Grant schema permissions to Supabase roles
GRANT USAGE ON SCHEMA registrations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA registrations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA registrations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA registrations TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA registrations 
    GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA registrations 
    GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA registrations 
    GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 3b. Configure PostgREST API to expose 'registrations' alongside 'public'
-- This allows Supabase client queries with { db: { schema: 'registrations' } }
ALTER ROLE authenticator SET pgrst.extra_search_path = 'registrations, public';
NOTIFY pgrst, 'reload config';


-- 4. Custom ENUM Types inside "registrations" schema
DO $$ BEGIN
    CREATE TYPE registrations.form_status_enum AS ENUM ('draft', 'published', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registrations.form_category_enum AS ENUM ('course_registration', 'survey', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registrations.submission_status_enum AS ENUM ('Pending', 'Paid', 'Approved', 'Checked-in', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registrations.payment_method_enum AS ENUM ('stripe', 'paypal', 'free', 'wire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registrations.payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Profiles Table (Linked with Supabase Auth or standalone)
CREATE TABLE IF NOT EXISTS registrations.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'creator', -- 'creator', 'admin', 'instructor'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5b. Authorized Accounts Table (Dedicated to schema "registrations")
CREATE TABLE IF NOT EXISTS registrations.authorized_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(150) NOT NULL DEFAULT 'Administrator',
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_login_at TIMESTAMPTZ
);

-- Seed required admin account in schema "registrations"
INSERT INTO registrations.authorized_accounts (username, password_hash, display_name, role)
VALUES (
    'admin',
    crypt('EFAdmin@123', gen_salt('bf')),
    'Administrator',
    'admin'
)
ON CONFLICT (username) DO NOTHING;

-- 6. Forms Table
CREATE TABLE IF NOT EXISTS registrations.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES registrations.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category registrations.form_category_enum NOT NULL DEFAULT 'course_registration',
    status registrations.form_status_enum NOT NULL DEFAULT 'published',
    
    -- Multi-Page configuration (JSON array of { id, title, description })
    pages JSONB NOT NULL DEFAULT '[{"id": "page-1", "title": "General Information"}]'::jsonb,
    
    -- Styling & Theme JSON
    theme JSONB NOT NULL DEFAULT '{
        "primaryColor": "#4f46e5",
        "backgroundColor": "#f8fafc",
        "cardBackground": "#ffffff",
        "textColor": "#0f172a",
        "fontFamily": "Inter",
        "borderRadius": "md"
    }'::jsonb,
    
    -- Course & Survey Settings JSON
    settings JSONB NOT NULL DEFAULT '{
        "isCourseRegistration": true,
        "courseFeeType": "fixed",
        "fixedFeeAmount": 99,
        "currency": "USD",
        "isSurvey": false,
        "isAnonymous": false,
        "randomizeQuestions": false,
        "randomizeChoices": false,
        "enableCaptcha": true,
        "requireGdpr": true,
        "confirmationEmailSubject": "Registration Confirmed!",
        "confirmationEmailBody": "Thank you for registering. Your ticket is attached."
    }'::jsonb,
    
    view_count INT DEFAULT 0,
    submission_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Form Fields Table
CREATE TABLE IF NOT EXISTS registrations.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES registrations.forms(id) ON DELETE CASCADE,
    page_index INT NOT NULL DEFAULT 0,
    order_index INT NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'select', 'radio', 'checkbox', 'datetime', 'file', 'rating', 'matrix', 'course_slot'
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    
    -- Options with dynamic capacity management: [{ label, value, price, maxCapacity, currentBookings }]
    options JSONB DEFAULT '[]'::jsonb,
    
    -- Likert matrix rows and columns
    matrix_rows JSONB DEFAULT '[]'::jsonb,
    matrix_columns JSONB DEFAULT '[]'::jsonb,
    
    -- Rating configuration
    rating_max INT DEFAULT 5,
    rating_type VARCHAR(20) DEFAULT 'star', -- 'star' or 'numeric'
    
    -- File constraints
    file_types JSONB DEFAULT '["image/*", "application/pdf"]'::jsonb,
    max_files INT DEFAULT 3,
    
    default_value JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Index for ordering fields quickly per form
CREATE INDEX IF NOT EXISTS idx_reg_form_fields_page ON registrations.form_fields(form_id, page_index, order_index);

-- 8. Logic Rules Table (Conditional Branching Engine)
CREATE TABLE IF NOT EXISTS registrations.logic_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES registrations.forms(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'show', 'hide', 'skip_to_page'
    target_field_id UUID REFERENCES registrations.form_fields(id) ON DELETE CASCADE,
    target_page_index INT,
    
    -- Condition: { fieldId, operator, value }
    condition JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_reg_logic_rules_form ON registrations.logic_rules(form_id);

-- 9. Submissions Table (With unique ticket passes & check-in status)
CREATE TABLE IF NOT EXISTS registrations.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES registrations.forms(id) ON DELETE CASCADE,
    ticket_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. TKT-9843-XY
    user_ip VARCHAR(45), -- Omitted/Null if form is anonymous
    status registrations.submission_status_enum NOT NULL DEFAULT 'Pending',
    
    -- Check-in tracking
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES registrations.profiles(id) ON DELETE SET NULL,
    
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_reg_submissions_form_date ON registrations.submissions(form_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_submissions_ticket ON registrations.submissions(ticket_code);

-- 10. Submission Answers Table
CREATE TABLE IF NOT EXISTS registrations.submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES registrations.submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES registrations.form_fields(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_reg_submission_answers_sub ON registrations.submission_answers(submission_id);

-- 11. Payments Table (Stripe & PayPal transactions)
CREATE TABLE IF NOT EXISTS registrations.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES registrations.submissions(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES registrations.forms(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method registrations.payment_method_enum NOT NULL DEFAULT 'stripe',
    payment_status registrations.payment_status_enum NOT NULL DEFAULT 'completed',
    transaction_id VARCHAR(100) NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_reg_payments_submission ON registrations.payments(submission_id);

-- 12. Webhook Integrations Log
CREATE TABLE IF NOT EXISTS registrations.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES registrations.forms(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES registrations.submissions(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status_code INT,
    response_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES IN SCHEMA "registrations"
-- ==============================================================================
ALTER TABLE registrations.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations.payments ENABLE ROW LEVEL SECURITY;

-- Forms: Public can view published forms; Creators can manage their own
CREATE POLICY "Public can view published forms" 
    ON registrations.forms FOR SELECT 
    USING (status = 'published');

CREATE POLICY "Creators can manage their forms" 
    ON registrations.forms FOR ALL 
    USING (auth.uid() = creator_id OR creator_id IS NULL);

-- Form Fields: Public can read fields for published forms
CREATE POLICY "Public can view fields of published forms" 
    ON registrations.form_fields FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM registrations.forms 
        WHERE registrations.forms.id = registrations.form_fields.form_id 
        AND registrations.forms.status = 'published'
    ));

-- Submissions: Anyone can insert submissions to published forms
CREATE POLICY "Public can submit responses" 
    ON registrations.submissions FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM registrations.forms 
        WHERE registrations.forms.id = registrations.submissions.form_id 
        AND registrations.forms.status = 'published'
    ));

-- Creators can view all submissions for their forms
CREATE POLICY "Creators can view their form submissions" 
    ON registrations.submissions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM registrations.forms 
        WHERE registrations.forms.id = registrations.submissions.form_id 
        AND (registrations.forms.creator_id = auth.uid() OR registrations.forms.creator_id IS NULL)
    ));

-- ==============================================================================
-- 14. ATOMIC CAPACITY DECREMENT FUNCTION (SCHEMA "registrations")
-- Ensures concurrency safety without race conditions in slot allocation
-- ==============================================================================
CREATE OR REPLACE FUNCTION registrations.book_course_slot(
    p_field_id UUID,
    p_slot_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_field RECORD;
    v_options JSONB;
    v_opt JSONB;
    v_new_options JSONB := '[]'::jsonb;
    v_found BOOLEAN := false;
    v_available BOOLEAN := false;
BEGIN
    SELECT * INTO v_field FROM registrations.form_fields WHERE id = p_field_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    v_options := v_field.options;
    
    FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
    LOOP
        IF (v_opt->>'value') = p_slot_value THEN
            v_found := true;
            IF COALESCE((v_opt->>'currentBookings')::INT, 0) < COALESCE((v_opt->>'maxCapacity')::INT, 999999) THEN
                v_available := true;
                v_opt := jsonb_set(
                    v_opt, 
                    '{currentBookings}', 
                    to_jsonb(COALESCE((v_opt->>'currentBookings')::INT, 0) + 1)
                );
            END IF;
        END IF;
        v_new_options := v_new_options || jsonb_build_array(v_opt);
    END LOOP;
    
    IF v_found AND v_available THEN
        UPDATE registrations.form_fields SET options = v_new_options WHERE id = p_field_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;
