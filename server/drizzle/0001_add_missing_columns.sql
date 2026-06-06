-- Migration: add missing enums, categories table, and new columns for users and vendors
-- Safe for development: does not change existing primary key types

BEGIN;

-- Create enums if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN','PROCUREMENT_OFFICER','MANAGER','VENDOR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('PENDING','APPROVED','REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rfq_status') THEN
        CREATE TYPE rfq_status AS ENUM ('DRAFT','OPEN','CLOSED','APPROVED','REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
        CREATE TYPE quotation_status AS ENUM ('DRAFT','SUBMITTED','SELECTED','REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        CREATE TYPE po_status AS ENUM ('CREATED','SENT','ACKNOWLEDGED','PARTIALLY_FULFILLED','COMPLETED','CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('GENERATED','SENT','VIEWED','PAID','PARTIALLY_PAID','OVERDUE','CANCELLED');
    END IF;
END$$;

-- Create categories table if missing
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- Add missing columns to users table safely
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS phone varchar(10),
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'VENDOR',
  ADD COLUMN IF NOT EXISTS profile_picture varchar(500),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Ensure uniqueness on phone if desired (only add if column exists and index missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='users_phone_idx') THEN
      BEGIN
        -- Create unique index only if no NULLs conflict
        CREATE UNIQUE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
      EXCEPTION WHEN others THEN
        -- ignore index creation errors in case of existing duplicates
        RAISE NOTICE 'Could not create users.phone unique index - duplicates may exist';
      END;
    END IF;
  END IF;
END$$;

-- Add missing columns to vendors table safely
ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS contact_person varchar(100),
  ADD COLUMN IF NOT EXISTS contact_email varchar(100),
  ADD COLUMN IF NOT EXISTS contact_phone varchar(15),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS status approval_status DEFAULT 'PENDING' NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Add category_id foreign key if missing and categories table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendors') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='categories') THEN
    -- Add category_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='category_id') THEN
      ALTER TABLE vendors ADD COLUMN category_id integer;
    END IF;
    -- Add FK constraint if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name='vendors' AND tc.constraint_type='FOREIGN KEY' AND kcu.column_name='category_id') THEN
      ALTER TABLE vendors ADD CONSTRAINT vendors_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id);
    END IF;
  END IF;
END$$;

COMMIT;

-- End migration
