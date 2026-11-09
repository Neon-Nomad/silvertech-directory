# Resend domain verification: what is missing (2026-11-08)

Written for: the production owner. Status: **one DNS record is missing.** No DNS change has been made from this document.

## Correction

An earlier version of this document said `send.silvertechdirectory.com` conflicted with Resend. That was wrong. Resend runs its sending infrastructure under the name "Forge" (`*.forge.rmta.net`). The `send` CNAME is Resend's own record and is verified in the Resend dashboard. Nothing needs to be removed or renamed.

## Resend dashboard, 2026-11-08 (domain added 5:44 PM, status pending)

| Record | Type | Name | Content | Status in Resend |
|---|---|---|---|---|
| DKIM | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+OxSoxQjyZDU5IJkdKleAWZbGBtKzR03K5WO5AdVZrZomUTOSdzx1b/6CDwlF9AhrdNEj3jwO8TkqxzeWs3NMpmOSLGg22YqfGXDtSJIqipPr9yGkIurXsBaHF/KWfjW4RqPt794uGTC5msGqJBB6hSYBQGTdOmEdRZ1xOwB0cwIDAQAB` | **pending** |
| SPF (return path) | CNAME | `send` | `send.forge.rmta.net` | verified |
| SPF (return path) | CNAME | `rsend` | `rsend.forge.rmta.net` | verified |
| DMARC (optional) | TXT | `_dmarc` | `v=DMARC1; p=none;` | not set |

Region: us-east-1. DNS provider: NS1 (Netlify DNS).

## Public DNS check (read-only, 2026-11-08)

- `send.silvertechdirectory.com`: CNAME to `send.forge.rmta.net` (present).
- `rsend.silvertechdirectory.com`: CNAME to `rsend.forge.rmta.net` (present).
- `resend._domainkey.silvertechdirectory.com`: **not found** (NXDOMAIN).

## The one missing record

Add this record in Netlify DNS for `silvertechdirectory.com`:

- Type: TXT
- Name: `resend._domainkey`
- Value: the full `p=MIGf…AQAB` key shown in the table above, copied exactly from the Resend dashboard

Do not proxy it. Then wait for the DNS and use "Restart verification" in Resend if it does not verify within a few hours. Check with `nslookup -type=TXT resend._domainkey.silvertechdirectory.com 8.8.8.8`.

## Do not change

- The `send` and `rsend` CNAMEs.
- The Google site-verification TXT at the root.
- Any other record.

## Decisions outside this fix

- **Enable receiving** in Resend adds inbound MX records. The root domain has no MX today, so the site's contact addresses (`andrew@`, `hello@`, `support@`, `editorial@`) cannot receive mail. Enabling receiving is a separate decision.
- **Brevo.** Transactional mail (tour and welcome emails) goes through Brevo. Its DKIM selector is not on the domain. Check Brevo's domain status before changing anything for it.
- **Supabase Auth SMTP.** Once the domain verifies, Supabase's SMTP settings should use Resend's SMTP details, and sign-up confirmation can be retested. Those settings stay unchanged until verification is confirmed.
