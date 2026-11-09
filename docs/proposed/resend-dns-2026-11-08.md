# Resend domain verification: DNS conflict and corrections (2026-11-08)

Written for: the production owner. Status: investigation only. **No DNS record was changed.** Existing records are not to be deleted until their purpose is confirmed (see section 4).

## 1. What the public DNS shows (read-only lookups, 2026-11-08)

Nameservers: `dns1–4.p06.nsone.net`, which is Netlify DNS. The zone cannot be read from here, so this is the public view.

| Name | Record | Value | Notes |
|---|---|---|---|
| `silvertechdirectory.com` | TXT | `google-site-verification=…` | Google site verification only |
| `silvertechdirectory.com` | MX | none (ENODATA) | **No inbound mail** is routed to the root domain |
| `send.silvertechdirectory.com` | CNAME | `send.forge.rmta.net` | Existing sending service. Its MX and SPF come from the target |
| `send.forge.rmta.net` | MX | `10 feedback.forge.rmta.net` | Target of the CNAME above |
| `send.forge.rmta.net` | TXT | `v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all` | SPF for the target |
| `resend._domainkey.silvertechdirectory.com` | — | not published | Resend's DKIM record is missing |
| `_dmarc.silvertechdirectory.com` | — | not published | No DMARC policy |
| `outbound`, `routbound`, `bounce`, `resend`, `mail` (`.silvertechdirectory.com`) | — | not published | Free to use |

## 2. The conflict

Resend's default return-path subdomain is `send` (Resend's custom-return-path page). Resend then needs MX and TXT records at `send.silvertechdirectory.com`. That name already has a **CNAME** to `send.forge.rmta.net`. A DNS name that has a CNAME cannot also hold an MX or TXT record, so Resend cannot publish its records there. That is why verification cannot complete.

## 3. Corrections (in order)

These avoid the conflict, and nothing existing is removed.

1. **Choose a different return-path name in Resend.** Resend allows a custom return path when a domain is added (Advanced options, or `custom_return_path` in the API). Use `outbound`. It cannot be changed later, so: if the domain was added with the default `send`, delete it in Resend and add it again with `outbound`. Verification is not complete, so nothing is lost. Confirm first that Resend has no live sending on the domain.
2. **Add the records that Resend's Records tab shows for that domain.** Expected shape (exact values come from the Records tab, not from this document):
   - TXT `resend._domainkey` (DKIM). Value: copy exactly from Resend.
   - CNAME `outbound` and CNAME `routbound`, both required for a CNAME return path. Values: copy exactly from Resend.
   - Do not create anything at `send`.
   - Add a proxied record? No. Netlify DNS does not proxy, but the records must not be proxied in any other DNS host either.
3. **Do not change** the existing `send` CNAME, the root TXT, or any record not listed above.
4. Optional, after verification: a DMARC TXT at `_dmarc` (e.g. `v=DMARC1; p=none; rua=mailto:…`). Not needed for verification.

## 4. Existing email functionality, and what must be confirmed first

- **Transactional mail (Brevo).** The repo sends tour and welcome emails through Brevo (`netlify/functions/send-tour-guide.ts`, `supabase/functions/send-registration-email`). Its sender is `hello@` or `andrew@silvertechdirectory.com`. The public DNS has no Brevo DKIM selector (e.g. `brevo1._domainkey`) and no Brevo SPF include on the root. Those mails may be failing authentication. This is not caused by the Resend work, but it should be checked in Brevo before any DNS change.
- **The `send` CNAME to `forge.rmta.net`.** Nothing in the repository refers to it. **Its purpose must be confirmed before any change.** It may be a previous sending service. Do not delete it on the assumption that it is unused.
- **Inbound mail.** The root domain has no MX record, so `andrew@`, `hello@`, `support@`, and `editorial@` addresses on the site cannot receive mail. This may be intended. If it is not, a mail host must be chosen and its MX records added. That is a separate decision.

## 5. Before applying section 3

1. Confirm the Resend domain and return-path name in the Resend dashboard (Domains page).
2. Copy the record values from Resend's Records tab.
3. Confirm the purpose of `send.silvertechdirectory.com` (CNAME to `forge.rmta.net`) with whoever set it up.
4. Apply the records in Netlify DNS, then use "Restart verification" in Resend if it does not verify within an hour. Public checks: `nslookup -type=TXT resend._domainkey.silvertechdirectory.com 8.8.8.8`.
