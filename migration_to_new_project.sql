-- ============================================================
-- COMPLETE MIGRATION SCRIPT
-- From: njvnmribopknrqvtjkup.supabase.co (OLD)
-- To: irqqtqyvggdsodvdlumz.supabase.co (NEW)
-- Generated: 2026-06-30
--
-- RUN THIS IN YOUR NEW PROJECT'S SQL EDITOR:
-- https://irqqtqyvggdsodvdlumz.supabase.co/project/default/sql
-- ============================================================

-- ============================================================
-- STEP 1: CREATE TABLES (in dependency order)
-- ============================================================

-- Table: promo_campaigns (no dependencies)
CREATE TABLE IF NOT EXISTS promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_months integer NOT NULL DEFAULT 0,
  plan_days integer NOT NULL DEFAULT 0,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: partners (no dependencies)
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table: invitations (references auth.users which exists)
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  event_type text NOT NULL DEFAULT 'wedding',
  title text NOT NULL DEFAULT 'Our Special Day',
  host_names text NOT NULL DEFAULT 'John & Jane',
  event_date timestamptz NOT NULL DEFAULT (now() + '30 days'::interval),
  event_address text NOT NULL DEFAULT '',
  event_program jsonb DEFAULT '[]'::jsonb,
  calligraphy_style text NOT NULL DEFAULT 'elegant',
  envelope_color text NOT NULL DEFAULT 'gold',
  date_icon text NOT NULL DEFAULT 'heart',
  main_photo_url text,
  music_url text,
  slug text UNIQUE NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  font_style text DEFAULT 'Inter, sans-serif',
  photo_pos_x integer DEFAULT 50,
  photo_pos_y integer DEFAULT 50,
  paper_type text DEFAULT 'smooth',
  description text,
  language text DEFAULT 'en',
  plan_type text DEFAULT 'FREE',
  is_paid boolean DEFAULT false,
  unlocked_features jsonb DEFAULT '[]'::jsonb,
  end_photo_url text,
  opening_type text DEFAULT 'vinyl',
  photo_url_2 text,
  photo_url_3 text,
  photo_url_2_pos_x double precision DEFAULT 0,
  photo_url_2_pos_y double precision DEFAULT 0,
  photo_url_2_scale double precision DEFAULT 1,
  photo_url_3_pos_x double precision DEFAULT 0,
  photo_url_3_pos_y double precision DEFAULT 0,
  photo_url_3_scale double precision DEFAULT 1,
  end_photo_url_pos_x double precision DEFAULT 0,
  end_photo_url_pos_y double precision DEFAULT 0,
  end_photo_url_scale double precision DEFAULT 1,
  main_photo_url_pos_x double precision DEFAULT 0,
  main_photo_url_pos_y double precision DEFAULT 0,
  main_photo_url_scale double precision DEFAULT 1,
  container_open text DEFAULT 'envelope',
  paper_color text DEFAULT '#FFFFFF',
  envelope_decor text DEFAULT 'none',
  premium_trigger_type text DEFAULT 'emoji',
  background_color text DEFAULT '#FFFFFF',
  background_theme text DEFAULT 'balloons',
  premium_mid_title text DEFAULT '',
  premium_mid_text text DEFAULT '',
  premium_mid_photo_url text DEFAULT '',
  premium_final_title text DEFAULT '',
  premium_final_text text DEFAULT '',
  premium_final_photo_url text DEFAULT '',
  opening_category text,
  opening_theme text,
  opening_video_url text,
  opening_poster_url text,
  album_photo_url_1 text,
  album_photo_url_2 text,
  album_photo_url_3 text,
  album_photo_url_4 text,
  album_photo_url_5 text,
  album_photo_url_6 text,
  album_photo_url_1_pos_x double precision DEFAULT 0,
  album_photo_url_1_pos_y double precision DEFAULT 0,
  album_photo_url_1_scale double precision DEFAULT 1,
  album_photo_url_2_pos_x double precision DEFAULT 0,
  album_photo_url_2_pos_y double precision DEFAULT 0,
  album_photo_url_2_scale double precision DEFAULT 1,
  album_photo_url_3_pos_x double precision DEFAULT 0,
  album_photo_url_3_pos_y double precision DEFAULT 0,
  album_photo_url_3_scale double precision DEFAULT 1,
  album_photo_url_4_pos_x double precision DEFAULT 0,
  album_photo_url_4_pos_y double precision DEFAULT 0,
  album_photo_url_4_scale double precision DEFAULT 1,
  album_photo_url_5_pos_x double precision DEFAULT 0,
  album_photo_url_5_pos_y double precision DEFAULT 0,
  album_photo_url_5_scale double precision DEFAULT 1,
  album_photo_url_6_pos_x double precision DEFAULT 0,
  album_photo_url_6_pos_y double precision DEFAULT 0,
  album_photo_url_6_scale double precision DEFAULT 1,
  premium_mid_photo_url_pos_x double precision DEFAULT 0,
  premium_mid_photo_url_pos_y double precision DEFAULT 0,
  premium_mid_photo_url_scale double precision DEFAULT 1,
  premium_final_photo_url_pos_x double precision DEFAULT 0,
  premium_final_photo_url_pos_y double precision DEFAULT 0,
  premium_final_photo_url_scale double precision DEFAULT 1,
  CONSTRAINT check_opening_type CHECK (opening_type IN ('vinyl', 'filmstrip')),
  CONSTRAINT invitations_plan_type_check CHECK (plan_type IN ('FREE', 'PREMIUM'))
);

-- Table: profiles (references auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'FREE',
  premium_duration_months integer,
  premium_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  plan_package text DEFAULT 'free',
  max_invitations integer DEFAULT 1,
  CONSTRAINT profiles_plan_package_check
    CHECK (plan_package IN ('free', 'solo', 'multi', 'business'))
);

-- Table: payments (references auth.users)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'sepay',
  provider_reference text UNIQUE NOT NULL,
  plan_id text NOT NULL,
  plan_months integer NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'VND',
  status text NOT NULL DEFAULT 'pending',
  checkout_url text,
  qr_code_url text,
  raw_provider_data jsonb,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  plan_days integer
);

-- Table: partner_batches (references partners)
CREATE TABLE IF NOT EXISTS partner_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners ON DELETE SET NULL,
  batch_code text UNIQUE NOT NULL,
  quantity integer NOT NULL,
  plan_months integer NOT NULL,
  code_expires_at timestamptz,
  unit_price integer DEFAULT 0,
  total_price integer DEFAULT 0,
  currency text NOT NULL DEFAULT 'VND',
  payment_method text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table: activation_codes (references payments, partners, partner_batches, auth.users)
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_months integer NOT NULL,
  status text NOT NULL DEFAULT 'unused',
  source text NOT NULL DEFAULT 'paid',
  payment_id uuid REFERENCES payments ON DELETE SET NULL,
  partner_id uuid REFERENCES partners ON DELETE SET NULL,
  batch_id uuid REFERENCES partner_batches ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  used_by_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  plan_days integer,
  plan_package text DEFAULT 'solo',
  max_invitations integer DEFAULT 1,
  CONSTRAINT activation_codes_plan_package_check
    CHECK (plan_package IN ('solo', 'multi', 'business', 'demo'))
);

-- Table: sales_receipts (references payments, activation_codes, partners, partner_batches, auth.users)
CREATE TABLE IF NOT EXISTS sales_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text UNIQUE NOT NULL,
  payment_id uuid REFERENCES payments ON DELETE SET NULL,
  activation_code_id uuid REFERENCES activation_codes ON DELETE SET NULL,
  partner_id uuid REFERENCES partners ON DELETE SET NULL,
  batch_id uuid REFERENCES partner_batches ON DELETE SET NULL,
  buyer_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  buyer_email text,
  buyer_name text,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'VND',
  plan_id text,
  plan_months integer,
  payment_provider text,
  payment_method text,
  payment_reference text,
  status text NOT NULL DEFAULT 'paid',
  note text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  plan_days integer,
  activation_code text
);

-- Table: invitation_photos (references invitations)
CREATE TABLE IF NOT EXISTS invitation_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table: responses (references invitations)
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE,
  group_leader_name text NOT NULL,
  guest_details jsonb NOT NULL,
  total_guests integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: rsvp_responses (references invitations)
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE,
  guest_name text NOT NULL,
  email text,
  phone text,
  attending boolean NOT NULL,
  number_of_guests integer DEFAULT 1,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Table: rsvps (references invitations)
CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE,
  guest_name text NOT NULL,
  is_attending boolean NOT NULL,
  adults_count integer DEFAULT 1,
  children_count integer DEFAULT 0,
  dietary_requirements text,
  created_at timestamptz DEFAULT now()
);

-- Table: promo_redemptions (references promo_campaigns, auth.users)
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES promo_campaigns ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

-- ============================================================
-- STEP 2: CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_plan_type ON invitations(plan_type);
CREATE INDEX IF NOT EXISTS idx_invitation_photos_invitation_id ON invitation_photos(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_invitation_id ON rsvp_responses(invitation_id);

-- ============================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_batches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================================

-- RLS Policies for invitations
CREATE POLICY "Invitations sont visibles par tous" ON invitations
  FOR SELECT TO public USING (true);
CREATE POLICY "Public Read" ON invitations
  FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON invitations
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON invitations
  FOR UPDATE TO public USING (true);
CREATE POLICY "Users can delete their own invitations" ON invitations
  FOR DELETE TO public USING (auth.uid() = user_id);

-- RLS Policies for invitation_photos
CREATE POLICY "Public Photos Read" ON invitation_photos
  FOR SELECT TO public USING (true);
CREATE POLICY "Public Photos Insert" ON invitation_photos
  FOR INSERT TO public WITH CHECK (true);

-- RLS Policies for rsvp_responses
CREATE POLICY "Enable insert for everyone" ON rsvp_responses
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable select for owners" ON rsvp_responses
  FOR SELECT TO public USING (
    auth.uid() IN (
      SELECT user_id FROM invitations
      WHERE invitations.id = rsvp_responses.invitation_id
    )
  );

-- RLS Policies for rsvps
CREATE POLICY "Public RSVP insert" ON rsvps
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Owner can view RSVPs" ON rsvps
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvps.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- RLS Policies for responses
CREATE POLICY "Allow anonymous inserts" ON responses
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow users to view responses for their invitations" ON responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = responses.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for payments
CREATE POLICY "Users can read their own payments" ON payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for activation_codes
CREATE POLICY "Users can read their own payment activation codes" ON activation_codes
  FOR SELECT TO authenticated USING (
    used_by_user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = activation_codes.payment_id
      AND payments.user_id = auth.uid()
    )
  );

-- RLS Policies for sales_receipts
CREATE POLICY "Users can read their own receipts" ON sales_receipts
  FOR SELECT TO authenticated USING (
    buyer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = sales_receipts.payment_id
      AND payments.user_id = auth.uid()
    )
  );

-- ============================================================
-- STEP 5: CREATE STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('invitations', 'invitations', true),
  ('photos', 'photos', true),
  ('musics', 'musics', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: CREATE STORAGE POLICIES
-- ============================================================

CREATE POLICY "Accès public lecture" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'invitations');
CREATE POLICY "Accès public update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'invitations');
CREATE POLICY "Accès public upload" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'invitations');

-- ============================================================
-- STEP 7: INSERT DATA
-- ============================================================

-- NOTE: auth.users cannot be migrated automatically.
-- You must manually recreate user accounts in the new project,
-- or the foreign key constraints will fail for data referencing auth.users.
--
-- Tables with auth.users references:
--   - profiles (id -> auth.users.id)
--   - invitations (user_id -> auth.users.id)
--   - payments (user_id -> auth.users.id)
--   - activation_codes (created_by_user_id, used_by_user_id -> auth.users.id)
--   - promo_redemptions (user_id -> auth.users.id)
--   - sales_receipts (buyer_user_id -> auth.users.id)
--
-- UNCOMMENT THE INSERTS BELOW AFTER CREATING USERS IN THE NEW PROJECT:

/*
-- Promo Campaigns (3 rows)
INSERT INTO promo_campaigns (id, code, plan_months, plan_days, max_uses, current_uses, active, expires_at, notes, created_at) VALUES
('2fec2d2d-ec52-4db4-9012-e8b79f935683', 'LANCEMENT2026', 1, 0, 50, 0, true, '2026-12-31 22:59:59+00', 'Code promotionnel lancement, utilisable 50 fois', '2026-06-03 01:49:16.428025+00'),
('bd0b0def-52a0-4ef2-a1cd-29f212d97f5f', 'TEST ANDROID', 0, 1, 50, 2, true, '2026-06-04 21:00:21+00', 'Code test Android 1 jour', '2026-06-03 12:08:02+00'),
('3f4378b0-274e-4258-9952-c6075c3ab8a1', 'PREMIUMDEMO', 1200, 0, NULL, 2, true, NULL, NULL, '2026-06-07 06:12:09.741822+00');

-- Partners (0 rows - empty)

-- Partner Batches (0 rows - empty)

-- Payments (needs user_id from auth.users - create users first!)
-- ... payment inserts here after users exist ...

-- Activation Codes (needs user_id from auth.users - create users first!)
-- ... activation_codes inserts here after users exist ...

-- Sales Receipts (needs user_id from auth.users - create users first!)
-- ... sales_receipts inserts here after users exist ...

-- Profiles (needs id from auth.users - create users first!)
-- ... profiles inserts here after users exist ...

-- Promos (needs user_id from auth.users - create users first!)
-- ... promo_redemptions inserts here after users exist ...
*/

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
--
-- NEXT STEPS:
-- 1. Run this SQL in your NEW project's SQL editor
-- 2. Create user accounts in the new project (auth.users)
-- 3. Uncomment and run the INSERT statements with correct user IDs
-- 4. Upload storage files (see supabase_storage_backup.md for file list)
