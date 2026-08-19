import { NextRequest, NextResponse } from 'next/server';
import { POST as assessV2 } from '../assess-v2/route';
import {
  isMechanicsRequest,
  normalisePrimaryServiceCategory,
} from '@/services/marketplace/serviceTaxonomy.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MECHANIC_QUESTIONS = [
  {
    id: 'vehicle-type',
    question: 'What type of vehicle needs attention?',
    options: ['Car', 'SUV', 'Bakkie', 'Van or minibus', 'Other'],
    required: true,
  },
  {
    id: 'vehicle-details',
    question: 'Do you know the make, model and year?',
    options: ['Yes, I can provide them', 'Make and model only', 'Not sure', 'I can send a photo'],
    required: true,
  },
  {
    id: 'mechanical-symptom',
    question: 'What best describes the problem?',
    options: ['Will not start', 'Engine or warning light', 'Brakes', 'Overheating', 'Noise or vibration', 'Routine service'],
    required: true,
  },
  {
    id: 'vehicle-mobility',
    question: 'Can the vehicle be driven safely?',
    options: ['Yes', 'Only a short distance', 'No, it needs mobile help or towing', 'Not sure'],
    required: true,
  },
  {
    id: 'fault-timing',
    question: 'When did the problem start?',
    options: ['Today', 'Within the last few days', 'It has been getting worse', 'This is planned maintenance'],
    required: true,
  },
  {
    id: 'previous-diagnosis',
    question: 'Has anyone already inspected or diagnosed the vehicle?',
    options: ['Yes', 'No', 'A warning code was read', 'Not sure'],
    required: false,
  },
];

type IntakeAnswer = { question?: unknown; answer?: unknown };

function cleanText(value: unknown, maximum = 4_000) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function mechanicsAssessment(body: Record<string, unknown>) {
  const description = cleanText(body.description);
  const answers = Array.isArray(body.answers) ? body.answers as IntakeAnswer[] : [];
  const asked = Number.isFinite(Number(body.questionsAsked))
    ? Math.max(0, Math.min(9, Math.floor(Number(body.questionsAsked))))
    : 0;
  const answeredQuestions = new Set(
    answers
      .map((item) => cleanText(item?.question, 500).toLowerCase())
      .filter(Boolean),
  );
  const answerText = answers
    .map((item) => `${cleanText(item?.question, 300)} ${cleanText(item?.answer, 700)}`.trim())
    .filter(Boolean)
    .join(' ');
  const combined = `${description} ${answerText}`.toLowerCase();

  const emergency = [
    'brake failure',
    'brakes failed',
    'fuel leak',
    'vehicle fire',
    'smoke from engine',
    'stranded on highway',
  ].some((term) => combined.includes(term));
  const urgent = emergency || [
    "won't start",
    'won’t start',
    'not starting',
    'overheating',
    'breakdown',
    'stranded',
  ].some((term) => combined.includes(term));

  const title = combined.includes('brake')
    ? 'Vehicle brake inspection or repair'
    : combined.includes('service') || combined.includes('oil change')
      ? 'Vehicle service and maintenance'
      : combined.includes('start')
        ? 'Vehicle starting fault'
        : 'Mechanic assistance needed';

  const remainingBudget = Math.max(0, 9 - asked);
  const unanswered = MECHANIC_QUESTIONS.filter(
    (item) => !answeredQuestions.has(item.question.toLowerCase()),
  );
  const minimumAnswered = answers.length >= 5;
  const clarifyingQuestions = minimumAnswered
    ? []
    : unanswered.slice(0, Math.min(5, remainingBudget));

  const nextAsked = Math.min(9, asked + clarifyingQuestions.length);
  const safetyNotes = emergency
    ? ['Do not drive the vehicle if braking, fuel, fire or severe overheating makes it unsafe. Move to a safe location and arrange roadside assistance where necessary.']
    : urgent && combined.includes('overheating')
      ? ['Avoid continuing to drive an overheating vehicle until a mechanic has assessed it.']
      : [];

  return NextResponse.json({
    assessment: {
      title,
      summary: description || 'The customer needs a mechanic to inspect the vehicle.',
      likelyIssue: 'The vehicle symptoms require a mechanic to inspect and confirm the fault before a final repair scope and quotation are agreed.',
      category: 'Mechanics',
      urgency: emergency ? 'emergency' : urgent ? 'urgent' : 'planned',
      confidence: answers.length >= 3 ? 0.7 : 0.55,
      professionalInspectionRequired: true,
      safetyNotes,
      estimatedMin: 650,
      estimatedMax: 15_000,
      materials: [],
      clarifyingQuestions,
      estimateType: answers.length ? 'refined' : 'standardized',
      model: 'mechanics-policy-v1',
    },
    usedFallback: false,
    questionProgress: {
      asked: nextAsked,
      answered: answers.length,
      normalTarget: 7,
      hardLimit: 9,
    },
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.clone().json() as Record<string, unknown>;
  } catch {
    // The existing V2 route will return the canonical validation error.
  }

  const description = cleanText(body.description);
  const answers = Array.isArray(body.answers) ? body.answers as IntakeAnswer[] : [];
  const combined = [
    description,
    ...answers.map((item) => cleanText(item?.answer, 700)),
  ].join(' ');

  if (isMechanicsRequest(combined)) {
    return mechanicsAssessment(body);
  }

  const response = await assessV2(request);
  if (!response.ok) return response;

  const payload = await response.json().catch(() => null) as Record<string, any> | null;
  if (!payload?.assessment) return NextResponse.json(payload ?? {}, { status: response.status });

  const currentCategory = String(payload.assessment.category || '');
  const nextCategory = normalisePrimaryServiceCategory(currentCategory);

  if (nextCategory !== currentCategory) {
    payload.assessment = {
      ...payload.assessment,
      category: nextCategory,
    };
  }

  return NextResponse.json(payload, { status: response.status });
}
