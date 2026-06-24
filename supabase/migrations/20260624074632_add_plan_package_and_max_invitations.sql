
-- 1. Add columns to public.profiles (if not exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_package text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS max_invitations integer DEFAULT 1;

-- 2. Add columns to public.activation_codes (if not exists)
ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS plan_package text DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS max_invitations integer DEFAULT 1;

-- 3. Check constraint on profiles.plan_package
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_plan_package_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_package_check
      CHECK (plan_package IN ('free', 'solo', 'multi', 'business'));
  END IF;
END $$;

-- 4. Check constraint on activation_codes.plan_package
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'activation_codes'
      AND constraint_name = 'activation_codes_plan_package_check'
  ) THEN
    ALTER TABLE public.activation_codes
      ADD CONSTRAINT activation_codes_plan_package_check
      CHECK (plan_package IN ('solo', 'multi', 'business', 'demo'));
  END IF;
END $$;

-- 5. Backfill existing profiles
UPDATE public.profiles
SET
  plan_package = CASE WHEN plan_type = 'PREMIUM' THEN 'solo' ELSE 'free' END,
  max_invitations = 1;
