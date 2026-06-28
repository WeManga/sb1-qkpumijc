-- ============================================================
-- FULL SUPABASE DATABASE EXPORT
-- Generated: 2026-06-28
-- Project: njvnmribopknrqvtjkup.supabase.co
-- ============================================================

-- ============================================================
-- SECTION 1: TABLE SCHEMAS (DDL)
-- ============================================================

-- Table: activation_codes
-- Stores premium/activation codes for subscription management
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_months integer NOT NULL,
  status text NOT NULL DEFAULT 'unused',
  source text NOT NULL DEFAULT 'paid',
  payment_id uuid,
  partner_id uuid,
  batch_id uuid,
  created_by_user_id uuid,
  used_by_user_id uuid,
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

-- Table: invitation_photos
-- Stores gallery photos for invitations
CREATE TABLE IF NOT EXISTS invitation_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table: invitations
-- Main invitations table with extensive customization options
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
COMMENT ON COLUMN invitations.envelope_color IS 'Couleur unie ou dégradé CSS de l enveloppe';
COMMENT ON COLUMN invitations.plan_type IS 'Type de plan de l invitation: FREE ou PREMIUM';
COMMENT ON COLUMN invitations.envelope_decor IS 'Type de décor de fond pour l enveloppe : none, floral, balloons';

-- Table: partner_batches
-- Batch management for partner activation codes
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

-- Table: partners
-- Business partners reselling activation codes
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table: payments
-- Payment transactions via SePay
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

-- Table: profiles
-- User profiles with subscription info
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

-- Table: promo_campaigns
-- Promotional code campaigns
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

-- Table: promo_redemptions
-- Tracks promotional code redemptions
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES promo_campaigns ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

-- Table: responses
-- RSVP group responses with guest details
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE,
  group_leader_name text NOT NULL,
  guest_details jsonb NOT NULL,
  total_guests integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: rsvp_responses
-- Individual RSVP responses
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

-- Table: rsvps
-- Alternative RSVP table with dietary requirements
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

-- Table: sales_receipts
-- Sales transaction receipts
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

-- ============================================================
-- SECTION 2: INDEXES
-- ============================================================

CREATE INDEX idx_invitations_slug ON invitations(slug);
CREATE INDEX idx_invitations_plan_type ON invitations(plan_type);
CREATE INDEX idx_invitation_photos_invitation_id ON invitation_photos(invitation_id);
CREATE INDEX idx_rsvp_responses_invitation_id ON rsvp_responses(invitation_id);

-- ============================================================
-- SECTION 3: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_batches ENABLE ROW LEVEL SECURITY;

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
-- SECTION 4: DATA EXPORT (INSERT STATEMENTS)
-- ============================================================

-- Profiles (3 rows)
INSERT INTO profiles (id, plan_type, premium_duration_months, premium_expires_at, created_at, updated_at, plan_package, max_invitations) VALUES
('12dba9b9-f24d-401b-9559-cd5b704df365', 'PREMIUM', 1200, '2126-06-07 07:04:55.118+00', '2026-05-30 10:36:17.148312+00', '2026-06-07 07:04:55.118+00', 'solo', 1),
('639a9df3-97c3-4821-bf52-85505357b90e', 'PREMIUM', 1200, '2126-06-07 06:13:03.373+00', '2026-06-01 03:44:31.693304+00', '2026-06-07 06:13:03.373+00', 'solo', 1),
('45cdc566-5820-486e-84f0-046e991fb3b2', 'PREMIUM', 0, '2026-06-04 13:24:14.778+00', '2026-06-03 13:24:15.02907+00', '2026-06-03 13:24:14.778+00', 'solo', 1);

-- Payments (23 rows - showing sample)
INSERT INTO payments (id, user_id, provider, provider_reference, plan_id, plan_months, amount, currency, status, qr_code_url, raw_provider_data, created_at, paid_at, plan_days) VALUES
('7bda8968-b7e8-485c-b396-45aa0dd75755', '12dba9b9-f24d-401b-9559-cd5b704df365', 'sepay', 'INVST-2B02413C26', 'test_1_day', 0, 1, 'VND', 'paid', 'https://qr.sepay.vn/img?acc=0975433337&bank=970432&amount=1&des=INVST-2B02413C26', '{"bank_code":"970432","description":"INVST-2B02413C26","bank_account":"0975433337","receipt_number":"R-20260530-5BC10986","activation_code":"INV-9F4D642F3E47","received_amount":2000}', '2026-05-30 09:14:42.384002+00', '2026-05-30 09:26:21.638+00', 1),
('4ba694ec-0a49-43e3-82c7-88d22e7d2fbd', '12dba9b9-f24d-401b-9559-cd5b704df365', 'sepay', 'INVST-C58A2CF6DE', 'test_1_day', 0, 1, 'VND', 'paid', 'https://qr.sepay.vn/img?acc=0975433337&bank=970432&amount=1&des=INVST-C58A2CF6DE', '{"bank_code":"970432","description":"INVST-C58A2CF6DE","bank_account":"0975433337","receipt_number":"R-20260530-2F71E8AE","activation_code":"INV-1F623572CA12","received_amount":2000}', '2026-05-30 10:03:51.359158+00', '2026-05-30 10:16:45.021+00', 1);

-- Activation Codes (13 rows)
INSERT INTO activation_codes (id, code, plan_months, status, source, payment_id, partner_id, batch_id, created_by_user_id, used_by_user_id, used_at, expires_at, notes, created_at, plan_days, plan_package, max_invitations) VALUES
('e3782b45-5484-4e18-822b-d97af96d1ed5', 'INV-FC5B4941AA32', 0, 'unused', 'paid', '7bda8968-b7e8-485c-b396-45aa0dd75755', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, '2027-05-30 09:24:20.759+00', 'Code generated after SePay payment INVST-2B02413C26', '2026-05-30 09:24:21.097759+00', 1, 'solo', 1),
('4a06cbea-10d6-461c-bfb2-67b187843604', 'INV-9F4D642F3E47', 0, 'unused', 'paid', '7bda8968-b7e8-485c-b396-45aa0dd75755', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, '2027-05-30 09:26:20.753+00', 'Code generated after SePay payment INVST-2B02413C26', '2026-05-30 09:26:21.040022+00', 1, 'solo', 1),
('056ef8bd-2e51-4cfa-9216-fac7ee2554ec', 'INV-4BDD18202E5D', 0, 'used', 'paid', '4b33bdbd-0a7b-44f3-ad63-97841ff1befc', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', '12dba9b9-f24d-401b-9559-cd5b704df365', '2026-05-30 10:36:17.01+00', '2027-05-30 10:35:59.888+00', 'Code generated after SePay payment INVST-5C9D424ACB', '2026-05-30 10:36:00.003818+00', 1, 'solo', 1),
('5fe24951-c5c6-4c7b-aad2-1857bb6df423', 'INV-A9DA02364200', 0, 'used', 'paid', '46611ef1-ae14-44f0-8f75-d5aab3d5126f', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', '12dba9b9-f24d-401b-9559-cd5b704df365', '2026-06-01 03:38:51.915+00', '2027-06-01 03:38:52.192+00', 'Code generated and auto-used after SePay payment INVST-6B629034B8', '2026-06-01 03:38:52.360919+00', 1, 'solo', 1),
('0cfc9bba-8004-4fbc-85c3-2a60f237f664', 'INV-3EEACAB82710', 0, 'used', 'paid', 'dfd2ade1-f33c-4684-bc19-9bea80a17935', NULL, NULL, '639a9df3-97c3-4821-bf52-85505357b90e', '639a9df3-97c3-4821-bf52-85505357b90e', '2026-06-01 03:44:31.048+00', '2027-06-01 03:44:31.297+00', 'Code generated and auto-used after SePay payment INVST-121D1C7762', '2026-06-01 03:44:31.431157+00', 1, 'solo', 1),
('6b2f9855-aa12-44fb-8db5-5130375c4d6c', 'INV-744FE06759CA', 0, 'used', 'paid', '4ba23013-0c48-46da-9fb6-356d58e2bfbe', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', '12dba9b9-f24d-401b-9559-cd5b704df365', '2026-06-02 03:58:19.377+00', '2027-06-02 03:58:19.606+00', 'Code generated and auto-used after SePay payment INVST-0FE63D1AF8', '2026-06-02 03:58:19.75197+00', 1, 'solo', 1),
('034f8e33-9262-407c-9b86-817931a01052', 'TEST-PROMO-1J', 0, 'used', 'promo', NULL, NULL, NULL, NULL, '639a9df3-97c3-4821-bf52-85505357b90e', '2026-06-02 07:21:28.637+00', NULL, NULL, '2026-06-02 23:18:56+00', 1, 'solo', 1),
('575967bb-0901-452b-840b-f23946aa575e', 'PARTNER-001-5DB7B4B5', 1, 'unused', 'promo', NULL, NULL, NULL, NULL, NULL, NULL, '2026-12-31 22:59:59+00', 'Codes partenaire 1 mois', '2026-06-03 01:44:04.540923+00', 0, 'solo', 1),
('9e85c4a5-d15a-4b78-acf9-c7ec704749cd', 'PARTNER-002-A46BC685', 1, 'unused', 'promo', NULL, NULL, NULL, NULL, NULL, NULL, '2026-12-31 22:59:59+00', 'Codes partenaire 1 mois', '2026-06-03 01:44:04.540923+00', 0, 'solo', 1),
('f200ad59-697e-4afc-a249-ba4a2fc4caa4', 'PARTNER-003-C478DC5F', 1, 'unused', 'promo', NULL, NULL, NULL, NULL, NULL, NULL, '2026-12-31 22:59:59+00', 'Codes partenaire 1 mois', '2026-06-03 01:44:04.540923+00', 0, 'solo', 1),
('4db47b2e-25f4-43ed-9b2a-710936361141', 'PARTNER-004-91BA0230', 1, 'unused', 'promo', NULL, NULL, NULL, NULL, NULL, NULL, '2026-12-31 22:59:59+00', 'Codes partenaire 1 mois', '2026-06-03 01:44:04.540923+00', 0, 'solo', 1),
('5f616432-6f7f-45da-bebb-7edca8815536', 'PARTNER-005-0856F6E1', 1, 'unused', 'promo', NULL, NULL, NULL, NULL, NULL, NULL, '2026-12-31 22:59:59+00', 'Codes partenaire 1 mois', '2026-06-03 01:44:04.540923+00', 0, 'solo', 1);

-- Promo Campaigns (3 rows)
INSERT INTO promo_campaigns (id, code, plan_months, plan_days, max_uses, current_uses, active, expires_at, notes, created_at) VALUES
('2fec2d2d-ec52-4db4-9012-e8b79f935683', 'LANCEMENT2026', 1, 0, 50, 0, true, '2026-12-31 22:59:59+00', 'Code promotionnel lancement, utilisable 50 fois', '2026-06-03 01:49:16.428025+00'),
('bd0b0def-52a0-4ef2-a1cd-29f212d97f5f', 'TEST ANDROID', 0, 1, 50, 2, true, '2026-06-04 21:00:21+00', 'Code test Android 1 jour', '2026-06-03 12:08:02+00'),
('3f4378b0-274e-4258-9952-c6075c3ab8a1', 'PREMIUMDEMO', 1200, 0, NULL, 2, true, NULL, NULL, '2026-06-07 06:12:09.741822+00');

-- Promo Redemptions (4 rows)
INSERT INTO promo_redemptions (id, campaign_id, user_id, used_at) VALUES
('3db2f936-08e9-4e59-9608-4e0137d88582', 'bd0b0def-52a0-4ef2-a1cd-29f212d97f5f', '45cdc566-5820-486e-84f0-046e991fb3b2', '2026-06-03 13:24:14.778+00'),
('32d8dd2b-3e0c-4e2a-bc42-46fa4aee5fa8', 'bd0b0def-52a0-4ef2-a1cd-29f212d97f5f', '639a9df3-97c3-4821-bf52-85505357b90e', '2026-06-03 14:06:08.855+00'),
('3c98633c-d96f-425b-982e-9585e1b3c931', '3f4378b0-274e-4258-9952-c6075c3ab8a1', '639a9df3-97c3-4821-bf52-85505357b90e', '2026-06-07 06:13:03.373+00'),
('f9f10440-8794-4581-a124-d904bec81be9', '3f4378b0-274e-4258-9952-c6075c3ab8a1', '12dba9b9-f24d-401b-9559-cd5b704df365', '2026-06-07 07:04:55.118+00');

-- Responses (5 rows)
INSERT INTO responses (id, invitation_id, group_leader_name, guest_details, total_guests, created_at) VALUES
('03b7adad-3668-4405-a256-8f3c627ab74f', '419310f1-e3ca-42c6-9b97-2828a7c77c59', 'Bhhhn Nhfc', '[{"lastName":"Nhfc","firstName":"Bhhhn"}]', 1, '2026-04-14 18:43:52.790735+00'),
('e2dfa29e-2f61-4549-a867-02ba57d31f05', '4d0abdca-979e-43aa-b2d0-915dfd06f8fa', 'Linh Nguyen', '[{"lastName":"Nguyen","firstName":"Linh"}]', 1, '2026-06-02 04:03:51.763584+00'),
('3321a346-8dce-4c7c-ad35-6dd1c24b2323', '40ef5b09-3bf5-4cad-9248-0685d91990c5', 'Mon Ebe', '[{"lastName":"Ebe","firstName":"Mon"},{"lastName":"Beb","firstName":"Nrbr"}]', 2, '2026-06-03 16:08:20.122668+00'),
('fb0fae43-a87d-4f9e-afa3-7a2ebd9b4773', 'a1cf8dc4-2323-44ff-888e-bb4af6c85aba', 'Pas Sur de venir mon copain ', '[{"lastName":"Sur de venir mon copain ","firstName":"Pas"}]', 1, '2026-06-04 08:44:18.32288+00'),
('beeef9cb-c87d-470e-a72a-74faa99888da', 'd16de70f-e235-44d4-bdc1-bd495b0d3a9e', 'Anna Montana', '[{"lastName":"Montana","firstName":"Anna"}]', 1, '2026-06-21 07:20:38.763788+00');

-- Sales Receipts (6 rows)
INSERT INTO sales_receipts (id, receipt_number, payment_id, activation_code_id, partner_id, batch_id, buyer_user_id, buyer_email, buyer_name, amount, currency, plan_id, plan_months, payment_provider, payment_method, payment_reference, status, note, raw_data, created_at, plan_days, activation_code) VALUES
('c6b5345a-5ca8-4ea5-80c4-8d1b0f933028', 'R-20260530-5BC10986', '7bda8968-b7e8-485c-b396-45aa0dd75755', '4a06cbea-10d6-461c-bfb2-67b187843604', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-2B02413C26', 'paid', 'SePay payment confirmed. Premium code generated for 0 month(s) and 1 day(s).', '{"content":"INVST-2B02413C26","transferAmount":2000}', '2026-05-30 09:26:21.484898+00', 1, 'INV-9F4D642F3E47'),
('a1c9227e-2557-4732-969f-e41be06bf441', 'R-20260530-2F71E8AE', '4ba694ec-0a49-43e3-82c7-88d22e7d2fbd', 'c0459238-734c-4f53-aa7e-751d6419fb2e', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-C58A2CF6DE', 'paid', 'SePay payment confirmed. Premium code generated for 0 month(s) and 1 day(s).', '{"content":"INVST-C58A2CF6DE","transferAmount":2000}', '2026-05-30 10:16:44.77258+00', 1, 'INV-1F623572CA12'),
('3c376b22-3d87-47d4-bfee-df12d172c3b5', 'R-20260530-1B18746E', '4b33bdbd-0a7b-44f3-ad63-97841ff1befc', '056ef8bd-2e51-4cfa-9216-fac7ee2554ec', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-5C9D424ACB', 'paid', 'SePay payment confirmed. Premium code generated for 0 month(s) and 1 day(s).', '{"content":"INVST-5C9D424ACB","transferAmount":2000}', '2026-05-30 10:36:00.246294+00', 1, 'INV-4BDD18202E5D'),
('2d45275e-6455-44f0-a971-068a07be8655', 'R-20260601-60067424', '46611ef1-ae14-44f0-8f75-d5aab3d5126f', '5fe24951-c5c6-4c7b-aad2-1857bb6df423', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-6B629034B8', 'paid', 'SePay payment confirmed. Premium automatically activated for 0 month(s) and 1 day(s).', '{"received_amount":2000,"premium_expires_at":"2026-06-02T03:38:51.915Z"}', '2026-06-01 03:38:53.041145+00', 1, 'INV-A9DA02364200'),
('fe5f9c4b-eb89-422c-a7c1-1f6a8309a448', 'R-20260601-E58453D2', 'dfd2ade1-f33c-4684-bc19-9bea80a17935', '0cfc9bba-8004-4fbc-85c3-2a60f237f664', NULL, NULL, '639a9df3-97c3-4821-bf52-85505357b90e', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-121D1C7762', 'paid', 'SePay payment confirmed. Premium automatically activated for 0 month(s) and 1 day(s).', '{"received_amount":2000,"premium_expires_at":"2026-06-02T03:44:31.048Z"}', '2026-06-01 03:44:31.950924+00', 1, 'INV-3EEACAB82710'),
('1e92bca3-e284-4882-bba0-f74f4e775a0e', 'R-20260602-912EDEA0', '4ba23013-0c48-46da-9fb6-356d58e2bfbe', '6b2f9855-aa12-44fb-8db5-5130375c4d6c', NULL, NULL, '12dba9b9-f24d-401b-9559-cd5b704df365', NULL, NULL, 1, 'VND', 'test_1_day', 0, 'sepay', 'vietqr', 'INVST-0FE63D1AF8', 'paid', 'SePay payment confirmed. Premium automatically activated for 0 month(s) and 1 day(s).', '{"received_amount":2000,"premium_expires_at":"2026-06-03T03:58:19.377Z"}', '2026-06-02 03:58:20.308002+00', 1, 'INV-744FE06759CA');

-- Invitations: 33 rows total (sample of structure shown - full export would include all columns)
-- Note: Full invitations data is extensive with 89 columns per row
-- Use: SELECT * FROM invitations; for complete data

-- Empty tables: invitation_photos, rsvp_responses, rsvps, partners, partner_batches

-- ============================================================
-- SECTION 5: STORAGE BUCKETS
-- ============================================================

-- Bucket: invitations (public)
-- Used for: Invitation assets and images
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('invitations', 'invitations', true, '2026-03-26 11:41:30.290143+00', '2026-03-26 11:41:30.290143+00');

-- Bucket: photos (public)
-- Used for: User uploaded photos
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('photos', 'photos', true, '2026-03-28 11:44:45.647132+00', '2026-03-28 11:44:45.647132+00');

-- Bucket: musics (public)
-- Used for: Background music files
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('musics', 'musics', true, '2026-03-28 11:45:02.080014+00', '2026-03-28 11:45:02.080014+00');

-- ============================================================
-- SECTION 6: STORAGE POLICIES
-- ============================================================

-- Public read access to invitations bucket
CREATE POLICY "Accès public lecture" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'invitations');

CREATE POLICY "Accès public update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'invitations');

CREATE POLICY "Accès public upload" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'invitations');

-- Specific file access policy for admin asset
CREATE POLICY "Give access to a file to user 18l1j3u_0" ON storage.objects
  FOR SELECT TO public USING (
    bucket_id = 'invitations'
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND (SELECT auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
  );

CREATE POLICY "Give access to a file to user 18l1j3u_1" ON storage.objects
  FOR INSERT TO public WITH CHECK (
    bucket_id = 'invitations'
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND (SELECT auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
  );

CREATE POLICY "Give access to a file to user 18l1j3u_2" ON storage.objects
  FOR UPDATE TO public USING (
    bucket_id = 'invitations'
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND (SELECT auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
  );

CREATE POLICY "Give access to a file to user 18l1j3u_3" ON storage.objects
  FOR DELETE TO public USING (
    bucket_id = 'invitations'
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND (SELECT auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
  );

-- ============================================================
-- SECTION 7: DATABASE FUNCTIONS AND TRIGGERS
-- ============================================================

-- No custom functions or triggers found in public schema

-- ============================================================
-- END OF EXPORT
-- ============================================================
