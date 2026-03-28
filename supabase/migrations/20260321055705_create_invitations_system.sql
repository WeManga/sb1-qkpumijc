/*
  # Digital Invitation System Schema

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text) - Type of event (wedding, baptism, baby_shower, birthday)
      - `title` (text) - Event title
      - `host_names` (text) - Names of the hosts
      - `event_date` (timestamptz) - Date and time of the event
      - `event_address` (text) - Location address
      - `event_program` (jsonb) - Program details as JSON array
      - `calligraphy_style` (text) - Font style (elegant, handwritten, modern)
      - `envelope_color` (text) - Envelope color (red, blue, pink, white, gold)
      - `date_icon` (text) - Icon type (heart, circle, emoji)
      - `main_photo_url` (text) - URL of the main photo
      - `music_url` (text) - URL of background music
      - `slug` (text, unique) - Unique URL slug for sharing
      - `is_published` (boolean) - Whether the invitation is live
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invitation_photos`
      - `id` (uuid, primary key)
      - `invitation_id` (uuid, references invitations)
      - `photo_url` (text) - URL of the gallery photo
      - `position` (integer) - Order in gallery
      - `created_at` (timestamptz)

    - `rsvp_responses`
      - `id` (uuid, primary key)
      - `invitation_id` (uuid, references invitations)
      - `guest_name` (text) - Name of the guest
      - `email` (text) - Guest email
      - `phone` (text) - Guest phone
      - `attending` (boolean) - Whether they will attend
      - `number_of_guests` (integer) - Number of people attending
      - `message` (text) - Optional message
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own invitations
    - Anyone can view published invitations
    - Anyone can submit RSVP responses
    - Only invitation owners can view RSVP responses
*/

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  event_type text NOT NULL DEFAULT 'wedding',
  title text NOT NULL DEFAULT 'Our Special Day',
  host_names text NOT NULL DEFAULT 'John & Jane',
  event_date timestamptz NOT NULL DEFAULT now() + interval '30 days',
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
  updated_at timestamptz DEFAULT now()
);

-- Create invitation_photos table
CREATE TABLE IF NOT EXISTS invitation_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create rsvp_responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES invitations ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  email text,
  phone text,
  attending boolean NOT NULL,
  number_of_guests integer DEFAULT 1,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- Invitations policies
CREATE POLICY "Users can view own invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published invitations by slug"
  ON invitations FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Users can create own invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Invitation photos policies
CREATE POLICY "Users can view photos of own invitations"
  ON invitation_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view photos of published invitations"
  ON invitation_photos FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.is_published = true
    )
  );

CREATE POLICY "Users can manage photos of own invitations"
  ON invitation_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of own invitations"
  ON invitation_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own invitations"
  ON invitation_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = invitation_photos.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- RSVP responses policies
CREATE POLICY "Anyone can submit RSVP"
  ON rsvp_responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Invitation owners can view RSVPs"
  ON rsvp_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.id = rsvp_responses.invitation_id
      AND invitations.user_id = auth.uid()
    )
  );

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitation_photos_invitation_id ON invitation_photos(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_invitation_id ON rsvp_responses(invitation_id);