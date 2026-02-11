export type AnswerType = 'yes_no' | 'text' | 'rating';

export type CompareQuestion = {
  id: string;
  prompt: string;
  helpText?: string;
  answerType?: AnswerType;
};

export type CompareTopic = {
  id: 'licensing' | 'inspections' | 'staffing' | 'resident-rights' | 'complaints';
  label: string;
  questions: CompareQuestion[];
};

export const COMPARE_TOPICS: CompareTopic[] = [
  {
    id: 'licensing',
    label: 'Licensing',
    questions: [
      { id: 'license_current', prompt: 'Is your license current, and where can I verify it?', answerType: 'text' },
      { id: 'last_inspection', prompt: 'When was your last inspection?', answerType: 'text' },
      { id: 'recent_violations', prompt: 'Have there been any recent violations?', answerType: 'yes_no' },
    ],
  },
  {
    id: 'inspections',
    label: 'Inspections',
    questions: [
      { id: 'inspection_findings', prompt: 'What were the findings in your most recent inspection?', answerType: 'text' },
      { id: 'issues_resolved', prompt: 'How were any issues resolved?', answerType: 'text' },
      { id: 'latest_report', prompt: 'Can I see a copy of the latest report?', answerType: 'yes_no' },
    ],
  },
  {
    id: 'staffing',
    label: 'Staffing',
    questions: [
      { id: 'overnight_coverage', prompt: 'How many caregivers are on duty overnight?', answerType: 'text' },
      { id: 'caregiver_training', prompt: 'What training do caregivers receive?', answerType: 'text' },
      { id: 'staff_tenure', prompt: 'How long have most staff members worked here?', answerType: 'text' },
    ],
  },
  {
    id: 'resident-rights',
    label: 'Resident Rights',
    questions: [
      { id: 'file_complaints', prompt: 'How do residents or families file complaints?', answerType: 'text' },
      { id: 'move_out', prompt: 'What happens if a resident wants to move out?', answerType: 'text' },
      { id: 'family_concerns', prompt: 'How do you handle concerns from families?', answerType: 'text' },
    ],
  },
  {
    id: 'complaints',
    label: 'Complaints',
    questions: [
      { id: 'first_contact', prompt: 'Who should families contact first if there is a concern?', answerType: 'text' },
      { id: 'internal_handling', prompt: 'How are complaints handled internally?', answerType: 'text' },
      { id: 'contact_ombudsman', prompt: 'When should someone contact the ombudsman?', answerType: 'text' },
    ],
  },
];
