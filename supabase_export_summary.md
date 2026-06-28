# Full Supabase Database Export Summary

**Generated:** 2026-06-28
**Project:** njvnmribopknrqvtjkup.supabase.co

---

## 1. SQL Schema for Public Tables

See `supabase_full_export.sql` for complete DDL statements.

### Tables Summary

| Table | Rows | RLS Enabled | Description |
|-------|------|-------------|-------------|
| `invitations` | 33 | Yes | Main invitations table with 89 columns for customization |
| `invitation_photos` | 0 | Yes | Gallery photos for invitations |
| `rsvp_responses` | 0 | Yes | Individual RSVP responses |
| `rsvps` | 0 | No | Alternative RSVP with dietary requirements |
| `responses` | 5 | No | Group RSVP responses with guest details |
| `profiles` | 3 | Yes | User profiles with subscription info |
| `payments` | 23 | Yes | SePay payment transactions |
| `activation_codes` | 13 | Yes | Premium/activation codes |
| `promo_campaigns` | 3 | Yes | Promotional code campaigns |
| `promo_redemptions` | 4 | Yes | Promo code redemption tracking |
| `partners` | 0 | Yes | Business partners |
| `partner_batches` | 0 | Yes | Partner activation code batches |
| `sales_receipts` | 6 | Yes | Sales transaction receipts |

### Key Constraints

- `invitations.plan_type`: CHECK IN ('FREE', 'PREMIUM')
- `invitations.opening_type`: CHECK IN ('vinyl', 'filmstrip')
- `profiles.plan_package`: CHECK IN ('free', 'solo', 'multi', 'business')
- `activation_codes.plan_package`: CHECK IN ('solo', 'multi', 'business', 'demo')

### Indexes

- `idx_invitations_slug` on invitations(slug)
- `idx_invitations_plan_type` on invitations(plan_type)
- `idx_invitation_photos_invitation_id` on invitation_photos(invitation_id)
- `idx_rsvp_responses_invitation_id` on rsvp_responses(invitation_id)

---

## 2. SQL Insert Data

See `supabase_full_export.sql` for INSERT statements.

### Data Highlights

- **33 invitations** with extensive customization (opening themes, photos, music)
- **23 payments** via SePay (VietQR integration)
- **13 activation codes** (3 used, 5 partner codes, rest unused)
- **3 promo campaigns** (LANCEMENT2026, TEST ANDROID, PREMIUMDEMO)
- **5 RSVP responses** from guests

---

## 3. RLS Policies

### invitations
- Public SELECT (all visible)
- Public INSERT/UPDATE (no restrictions)
- DELETE restricted to owner (auth.uid() = user_id)

### invitation_photos
- Full public access (SELECT, INSERT)

### rsvp_responses
- Public INSERT (anyone can RSVP)
- SELECT restricted to invitation owners

### profiles
- Full CRUD restricted to own profile (auth.uid() = id)

### payments
- SELECT restricted to own payments

### activation_codes
- SELECT for codes user created, used, or paid for

### sales_receipts
- SELECT for buyer or linked payment owner

---

## 4. Database Functions and Triggers

**None found** in public schema. All logic is handled at the application layer or via Edge Functions.

---

## 5. Storage Buckets and Policies

### Buckets

| Bucket | Public | Created |
|--------|--------|---------|
| `invitations` | Yes | 2026-03-26 |
| `photos` | Yes | 2026-03-28 |
| `musics` | Yes | 2026-03-28 |

### Storage Policies

- **Public access** for SELECT, INSERT, UPDATE on `invitations` bucket
- **Specific file access** for admin asset: `admin/assets/Costa Rican Frog.jpg` (user ID: d7bed83c-44a0-4a4f-925f-efc384ea1e50)

---

## 6. Edge Functions

The following Edge Functions are deployed (source code not in local project):

| Function | Status | JWT Verify |
|----------|--------|------------|
| `create-sepay-checkout` | ACTIVE | Yes |
| `sepay-webhook` | ACTIVE | No (public webhook) |
| `get-payment-status` | ACTIVE | Yes |
| `activate-code` | ACTIVE | Yes |
| `generate-promo-codes` | ACTIVE | No |

### Likely Purpose

1. **create-sepay-checkout**: Creates a SePay payment request and returns QR code URL
2. **sepay-webhook**: Handles SePay payment notifications (auto-activates premium, generates codes)
3. **get-payment-status**: Returns current payment status for a transaction
4. **activate-code**: Redeems an activation code for premium access
5. **generate-promo-codes**: Admin function to batch-generate promotional codes

---

## 7. Environment/Secrets Used by Edge Functions

The following secret names are configured (values hidden):

| Secret Name | Likely Purpose |
|-------------|----------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin service role key |
| `SUPABASE_PUBLISHABLE_KEYS` | Publishable key set |
| `SUPABASE_SECRET_KEYS` | Secret key set |
| `SUPABASE_DB_URL` | Database connection string |
| `SUPABASE_JWKS` | JSON Web Key Set |
| `SEPAY_ENV` | SePay environment (sandbox/production) |
| `SEPAY_MERCHANT_ID` | SePay merchant identifier |
| `SEPAY_SECRET_KEY` | SePay API secret (hidden) |
| `SEPAY_BANK_CODE` | Bank code (970432) |
| `SEPAY_BANK_ACCOUNT` | Bank account number |
| `SITE_URL` | Application base URL |

---

## Files Generated

1. `supabase_full_export.sql` - Complete SQL export with:
   - CREATE TABLE statements
   - Index definitions
   - RLS policy creation
   - INSERT statements for data
   - Storage bucket setup
   - Storage policies

2. This summary document (`supabase_export_summary.md`)

---

## Notes

- Edge function source code is deployed directly to Supabase and not stored in the local project
- The `rsvps` and `responses` tables have RLS disabled but contain data
- Storage objects were not exported (too many files) - use Supabase dashboard for file listings
- Invitations table has 89 columns supporting extensive customization themes
