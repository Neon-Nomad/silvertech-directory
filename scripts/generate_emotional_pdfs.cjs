const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'pdfs', 'emotional');

/**
 * Minimal PDF generator (single page, Helvetica) without external deps.
 * @param {string} title
 * @param {string[]} bodyLines
 */
function createPdfContent(title, bodyLines) {
  const escape = (text) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const lines = [
    'BT',
    '/F1 20 Tf',
    '72 720 Td',
    '24 TL',
    `(${escape(title)}) Tj`,
    '/F1 12 Tf',
    '18 TL',
    ...bodyLines.flatMap((line) => [`T*`, `(${escape(line)}) Tj`]),
    'ET'
  ];

  const contentStream = lines.join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}\nendstream\nendobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

const catalog = [
  {
    slug: 'surviving-the-guilt',
    title: "Surviving the Guilt: The Caregiver's Emotional Guide",
    body: [
      'Covers guilt, grief, and anger that arise when moving a loved one to memory care.',
      'Step-by-step grounding exercises and sample scripts for hard conversations.',
      'Daily 10-minute routines to protect your sleep, nutrition, and emotional resilience.'
    ]
  },
  {
    slug: 'finding-peace-boundaries',
    title: 'Finding Peace: Setting Boundaries After Placement',
    body: [
      'Helps spouses and adult children redefine their role post-placement.',
      'Boundary templates with facilities, siblings, and extended family.',
      'Time-blocking guide to reclaim your day without losing connection.'
    ]
  },
  {
    slug: 'first-30-days-diagnosis',
    title: "Navigating the Diagnosis: A Partner's First 30 Days",
    body: [
      'Day-by-day actions for the first month after an Alzheimer’s diagnosis.',
      'How to share the news, coordinate paperwork, and build your care team.',
      'Emotional anchors to manage shock, confusion, and anticipatory grief.'
    ]
  },
  {
    slug: 'medicaid-planning-guide',
    title: 'The 50-State Medicaid Planning Guide: Simplified',
    body: [
      'Breaks down lookback periods, spend-down rules, and exemptions by state.',
      'Checklists for documents, timelines, and who to call first.',
      'Reduces anxiety by turning regulatory complexity into clear steps.'
    ]
  },
  {
    slug: 'hidden-cost-finder',
    title: 'The Hidden Cost Finder: Fees, Commissions, and Budgeting',
    body: [
      'Uncovers referral commissions, move-in fees, and recurring charges.',
      'Budget templates to compare true monthly costs across facilities.',
      'Questions to ask to avoid surprise increases.'
    ]
  },
  {
    slug: '72-hour-crisis-checklist',
    title: 'The 72-Hour Memory Care Crisis Checklist',
    body: [
      'Covers immediate steps when you must place a loved one quickly.',
      'What to pack, who to notify, and how to keep medical records ready.',
      'Reduces panic with a prioritized action list.'
    ]
  },
  {
    slug: 'facility-interview-scorecard',
    title: 'The Facility Interview & Red Flag Scorecard',
    body: [
      'Interview questions mapped to safety, staffing, and culture signals.',
      'How to read inspection reports and translate them into risk levels.',
      'Scoring sheet to compare multiple communities objectively.'
    ]
  },
  {
    slug: 'transitioning-well-move-in',
    title: 'Transitioning Well: 10 Steps for a Smooth Move-In',
    body: [
      'Covers emotional prep, room setup, and coordination with staff.',
      'Scripts to explain the move to your loved one with empathy.',
      'Week-one check-ins to stabilize routines and reduce distress.'
    ]
  },
  {
    slug: 'maximizing-visits-connection',
    title: 'Maximizing Visits: Connecting with Memory Care Residents',
    body: [
      'Sensory prompts, music, and photo routines to spark recognition.',
      'Visit structures for early, mid, and late-stage dementia.',
      'How to make short visits meaningful without overwhelming your loved one.'
    ]
  },
  {
    slug: 'care-team-handbook',
    title: 'The Care Team Handbook: How to Partner with Facility Staff',
    body: [
      'Communication cadences with nurses, administrators, and aides.',
      'Escalation paths when something feels off, without burning bridges.',
      'Shared-notes template to keep everyone aligned on care changes.'
    ]
  }
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const item of catalog) {
  const pdf = createPdfContent(item.title, item.body);
  const outPath = path.join(OUTPUT_DIR, `${item.slug}.pdf`);
  fs.writeFileSync(outPath, pdf, 'utf8');
  console.log('Wrote', outPath);
}
