/**
 * POST /.netlify/functions/send-tour-guide
 *
 * Sends a single branded tour-prep email via Brevo REST API.
 * Logs aggregate interest to facility_tour_interest (no PII stored per facility).
 *
 * Requires env vars:
 *   BREVO_API_KEY          — Brevo API key (Settings > API Keys in Brevo dashboard)
 *   BREVO_FROM_EMAIL       — Verified sender email (already set)
 *   VITE_SUPABASE_URL      — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — Supabase anon key (public insert only)
 */

import type { Handler } from '@netlify/functions';

const CARE_TYPE_LABELS: Record<string, string> = {
  'assisted-living':    'Assisted Living',
  'memory-care':        'Memory Care',
  'nursing-homes':      'Nursing Homes',
  'independent-living': 'Independent Living',
  'residential-care':   'Residential Care',
  'adult-day-services': 'Adult Day Services',
  'ccrc':               'CCRC / Life Plan Community',
};

const GUIDE_URLS: Record<string, string> = {
  'assisted-living':    'https://silvertechdirectory.com/downloads/tour-guide-assisted-living.pdf',
  'memory-care':        'https://silvertechdirectory.com/downloads/tour-guide-memory-care.pdf',
  'nursing-homes':      'https://silvertechdirectory.com/downloads/tour-guide-nursing-homes.pdf',
  'independent-living': 'https://silvertechdirectory.com/downloads/tour-guide-independent-living.pdf',
  'residential-care':   'https://silvertechdirectory.com/downloads/tour-guide-residential-care.pdf',
  'adult-day-services': 'https://silvertechdirectory.com/downloads/tour-guide-adult-day-services.pdf',
  'ccrc':               'https://silvertechdirectory.com/downloads/tour-guide-ccrc.pdf',
};

const PREVIEW_QUESTIONS: Record<string, string[]> = {
  'assisted-living': [
    'What is the staff-to-resident ratio on nights and weekends?',
    'What does the monthly fee include — and what costs extra?',
    'How are medications managed and administered?',
    'How do you communicate updates to family members?',
    'What happens if my loved one\'s care needs increase?',
  ],
  'memory-care': [
    'Is this a dedicated, secure memory care unit?',
    'What specialized dementia training do staff receive?',
    'How do you handle behavioral changes like agitation or sundowning?',
    'What happens if a resident wanders or tries to exit?',
    'How do you support family members through this journey?',
  ],
  'nursing-homes': [
    'What is your CMS star rating and when was your last inspection?',
    'What is the nurse-to-resident ratio on each shift?',
    'How do you handle rehab and discharge planning?',
    'What is your policy on restraints and antipsychotic medications?',
    'How are family members notified of changes in condition?',
  ],
  'independent-living': [
    'What services are included vs. available for an additional fee?',
    'How does the community handle it if a resident\'s health declines?',
    'What does a typical week of activities look like?',
    'Is there a minimum age requirement?',
    'What is the pet policy?',
  ],
  'residential-care': [
    'How many residents live here, and what is the staff-to-resident ratio?',
    'Are staff present overnight?',
    'What level of medical care can you provide?',
    'How are medications managed?',
    'Can we speak with current residents\' families?',
  ],
  'adult-day-services': [
    'What are your operating hours, and is transportation available?',
    'What activities and therapies do you offer?',
    'How do you handle medical emergencies during the day?',
    'What is the caregiver-to-participant ratio?',
    'How do you communicate daily updates to families?',
  ],
  'ccrc': [
    'What are the entrance fee and monthly fee structures?',
    'Is the entrance fee refundable, and under what conditions?',
    'What continuum of care is included vs. additional cost?',
    'What is the community\'s financial health and occupancy rate?',
    'What happens if I outlive my financial resources?',
  ],
};

function buildEmailHtml(params: {
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string;
  careType: string;
  guideUrl: string;
  previewQuestions: string[];
}): string {
  const { facilityName, facilityAddress, facilityPhone, careType, guideUrl, previewQuestions } = params;
  const careLabel = CARE_TYPE_LABELS[careType] || 'Senior Care';
  const questionsHtml = previewQuestions
    .map((q, i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;vertical-align:top"><strong style="color:#ca8a04;margin-right:6px">${i + 1}.</strong>${q}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Tour Prep Guide</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Public Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f172a;border-radius:14px 14px 0 0;padding:24px 32px;text-align:center">
          <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:#fbbf24">SilverTech Directory</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;line-height:1.2">Your Tour Prep Guide</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8">${careLabel}</p>
        </td></tr>

        <!-- Facility banner -->
        <tr><td style="background:#1e293b;padding:16px 32px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <p style="margin:0;font-size:16px;font-weight:700;color:#fff">${facilityName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">${facilityAddress}${facilityPhone ? ' &nbsp;·&nbsp; ' + facilityPhone : ''}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0f172a">You're visiting <span style="color:#ca8a04">${facilityName}</span>.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6">These are the most important questions to ask while you're there. The full guide has 20 questions with space to take notes.</p>

          <!-- Questions preview -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            ${questionsHtml}
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px">
              <a href="${guideUrl}" style="display:inline-block;background:#ca8a04;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:9px;text-decoration:none">
                Download Full 20-Question Guide →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
            <strong style="color:#64748b">Tip:</strong> Bring this guide printed or on your phone. Take notes on-site — impressions fade fast when comparing multiple facilities.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 14px 14px;padding:20px 32px;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center">
            This is the only email we'll send. We don't sell your information — ever.<br>
            <a href="https://silvertechdirectory.com/unsubscribe" style="color:#ca8a04">Unsubscribe</a> &nbsp;·&nbsp;
            <a href="https://silvertechdirectory.com/privacy" style="color:#94a3b8">Privacy Policy</a><br><br>
            SilverTech Directory — We exist to fill beds, not your phonebook.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { email, facilityId, facilityName, facilityAddress, facilityPhone, careType, optedIn, visitNote } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Valid email required' }) };
  }
  if (!facilityId || !facilityName || !careType) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const guideUrl = GUIDE_URLS[careType] || GUIDE_URLS['assisted-living'];
  const previewQuestions = PREVIEW_QUESTIONS[careType] || PREVIEW_QUESTIONS['assisted-living'];
  const careLabel = CARE_TYPE_LABELS[careType] || 'Senior Care';

  // 1. Send one email via Brevo REST API
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error('BREVO_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  try {
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'SilverTech Directory',
          email: process.env.BREVO_FROM_EMAIL || 'hello@silvertechdirectory.com',
        },
        to: [{ email }],
        subject: `Your tour prep guide for ${facilityName}`,
        htmlContent: buildEmailHtml({
          facilityName,
          facilityAddress: facilityAddress || '',
          facilityPhone: facilityPhone || '',
          careType,
          guideUrl,
          previewQuestions,
        }),
        tags: ['tour-guide', careType],
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Brevo error:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send email' }) };
    }
  } catch (err) {
    console.error('Email send failed:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Email service unavailable' }) };
  }

  // 2. Log aggregate tour interest to Supabase (no PII stored against facility)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/facility_tour_interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          facility_id: facilityId,
          care_type: careType,
          guide_downloaded: true,
          opted_in_contact: Boolean(optedIn),
          visit_note: optedIn && visitNote ? String(visitNote).slice(0, 300) : null,
        }),
      });
    } catch (err) {
      // Non-fatal — email already sent
      console.warn('Tour interest log failed:', err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, careType, careLabel }),
  };
};
