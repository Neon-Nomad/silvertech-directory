import { useState } from 'react';

type Props = {
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string;
  careType: string;
  tourSchedulingUrl?: string;
};

type Step = 'idle' | 'submitting' | 'success' | 'error';

function buildGoogleCalendarUrl(name: string, address: string, phone: string): string {
  const title  = encodeURIComponent(`Tour of ${name}`);
  const loc    = encodeURIComponent(address);
  const detail = encodeURIComponent(`Tour visit scheduled via SilverTech Directory.\nFacility: ${address}${phone ? '\nPhone: ' + phone : ''}\n\nConfirm your visit time directly with the facility.`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${loc}&details=${detail}`;
}

function buildOutlookUrl(name: string, address: string): string {
  const subject  = encodeURIComponent(`Tour of ${name}`);
  const location = encodeURIComponent(address);
  const body     = encodeURIComponent(`Tour visit scheduled via SilverTech Directory. Confirm your visit time with the facility.`);
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&location=${location}&body=${body}`;
}

function buildIcalBlob(name: string, address: string, phone: string): string {
  const stamp   = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const uid     = `tour-${Date.now()}@silvertechdirectory.com`;
  const desc    = `Tour visit scheduled via SilverTech Directory.\\nFacility: ${address}${phone ? '\\nPhone: ' + phone : ''}\\n\\nConfirm your visit time with the facility.`;
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SilverTech Directory//Tour Schedule//EN',
    'BEGIN:VEVENT',
    `DTSTAMP:${stamp}`,
    `UID:${uid}`,
    `SUMMARY:Tour of ${name}`,
    `LOCATION:${address}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ical], { type: 'text/calendar' });
  return URL.createObjectURL(blob);
}

export default function TourScheduler({
  facilityId,
  facilityName,
  facilityAddress,
  facilityPhone,
  careType,
  tourSchedulingUrl,
}: Props) {
  const [email, setEmail]         = useState('');
  const [optedIn, setOptedIn]     = useState(false);
  const [visitNote, setVisitNote] = useState('');
  const [step, setStep]           = useState<Step>('idle');
  const [icalUrl, setIcalUrl]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep('submitting');

    try {
      const res = await fetch('/.netlify/functions/send-tour-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          facilityId,
          facilityName,
          facilityAddress,
          facilityPhone,
          careType,
          optedIn,
          visitNote: optedIn ? visitNote : '',
        }),
      });

      if (!res.ok) throw new Error('Send failed');

      // Build iCal blob URL for download button (client-side only)
      setIcalUrl(buildIcalBlob(facilityName, facilityAddress, facilityPhone));
      setStep('success');
    } catch {
      setStep('error');
    }
  };

  if (step === 'success') {
    return (
      <div>
        <div className="ts-success-banner">
          <span className="ts-success-icon">✓</span>
          <div>
            <p className="ts-success-title">Tour prep guide on its way!</p>
            <p className="ts-success-sub">Check your inbox — one email, no follow-ups.</p>
          </div>
        </div>

        <p className="ts-cal-heading">Add your tour to your calendar:</p>
        <div className="ts-cal-grid">
          <a
            href={buildGoogleCalendarUrl(facilityName, facilityAddress, facilityPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-cal-btn"
          >
            <span className="ts-cal-icon">📅</span>
            Google Calendar
          </a>
          {icalUrl && (
            <a
              href={icalUrl}
              download={`tour-${facilityName.replace(/\s+/g, '-').toLowerCase()}.ics`}
              className="ts-cal-btn"
            >
              <span className="ts-cal-icon">🍎</span>
              Apple Calendar
            </a>
          )}
          <a
            href={buildOutlookUrl(facilityName, facilityAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-cal-btn"
          >
            <span className="ts-cal-icon">📨</span>
            Outlook
          </a>
        </div>

        {tourSchedulingUrl && (
          <div className="ts-book-cta">
            <p className="ts-book-text">Ready to lock in a time?</p>
            <a href={tourSchedulingUrl} target="_blank" rel="noopener noreferrer" className="fp-btn fp-btn-gold">
              Book Your Tour →
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {tourSchedulingUrl && (
        <a
          href={tourSchedulingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fp-btn fp-btn-gold ts-book-primary"
        >
          📅 Book a Tour
        </a>
      )}

      <div className="ts-guide-card">
        <p className="ts-guide-title">Get your free tour prep guide</p>
        <p className="ts-guide-sub">
          20 questions to ask on your visit, specific to {careType.replace(/-/g, ' ')}.
          One email. That's it.
        </p>

        <div className="ts-email-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="ts-email-input"
            aria-label="Your email address"
          />
          <button
            type="submit"
            disabled={step === 'submitting' || !email}
            className="fp-btn fp-btn-gold ts-send-btn"
          >
            {step === 'submitting' ? 'Sending…' : 'Send My Guide'}
          </button>
        </div>

        <label className="ts-optin-label">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(e) => setOptedIn(e.target.checked)}
            className="ts-optin-check"
          />
          <span>Let {facilityName} know I'm coming</span>
        </label>

        {optedIn && (
          <textarea
            value={visitNote}
            onChange={(e) => setVisitNote(e.target.value.slice(0, 300))}
            placeholder="Optional: anything they should know (e.g. 'Planning to visit Thursday afternoon')"
            rows={2}
            className="ts-note-input"
            maxLength={300}
          />
        )}

        <p className="ts-privacy-note">
          🔒 We send one email. Your contact info is never sold or shared with the facility.
        </p>
      </div>

      {step === 'error' && (
        <p className="ts-error">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
