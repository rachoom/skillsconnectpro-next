import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const QUESTION_COUNT_COOKIE = 'scp_intake_question_count';
const NORMAL_QUESTION_TARGET = 7;
const HARD_QUESTION_LIMIT = 9;

type IntakeAnswer = {
  question: string;
  answer: string;
};

type IntakeMaterial = {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  notes?: string;
};

type IntakeQuestion = {
  id: string;
  question: string;
  options: string[];
  required: boolean;
};

type IntakeAssessment = {
  title: string;
  summary: string;
  likelyIssue: string;
  category: string;
  urgency: 'emergency' | 'urgent' | 'planned' | 'large_project';
  confidence: number;
  professionalInspectionRequired: boolean;
  safetyNotes: string[];
  estimatedMin: number | null;
  estimatedMax: number | null;
  materials: IntakeMaterial[];
  clarifyingQuestions: IntakeQuestion[];
  estimateType: 'standardized' | 'refined';
  model: string;
};

const CATEGORY_OPTIONS = [
  'Plumbing',
  'Electrical',
  'Building',
  'Painting',
  'Carpentry',
  'Roofing',
  'Tiling',
  'Cleaning',
  'Landscaping',
  'Appliance Repair',
  'General Contractor',
] as const;

function cleanText(value: unknown, maximum = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function cleanAnswers(value: unknown): IntakeAnswer[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const question = cleanText(record.question, 500);
      const answer = cleanText(record.answer, 1_000);
      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is IntakeAnswer => Boolean(item))
    .slice(0, 9);
}

function safeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function normaliseUrgency(value: unknown): IntakeAssessment['urgency'] {
  return value === 'emergency' || value === 'urgent' || value === 'large_project'
    ? value
    : 'planned';
}

function normaliseAssessment(value: unknown, model: string): IntakeAssessment {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const rawMaterials = Array.isArray(record.materials) ? record.materials : [];
  const materials = rawMaterials
    .map((item): IntakeMaterial | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const material = item as Record<string, unknown>;
      const name = cleanText(material.name, 120);
      if (!name) return null;
      return {
        name,
        quantity: safeNumber(material.quantity) ?? undefined,
        unit: cleanText(material.unit, 40) || undefined,
        estimatedUnitPrice: safeNumber(material.estimatedUnitPrice) ?? undefined,
        estimatedTotal: safeNumber(material.estimatedTotal) ?? undefined,
        notes: cleanText(material.notes, 300) || undefined,
      };
    })
    .filter((item): item is IntakeMaterial => Boolean(item))
    .slice(0, 12);

  const rawQuestions = Array.isArray(record.clarifyingQuestions)
    ? record.clarifyingQuestions
    : [];
  const clarifyingQuestions = rawQuestions
    .map((item, index): IntakeQuestion | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const question = item as Record<string, unknown>;
      const text = cleanText(question.question, 300);
      if (!text) return null;
      return {
        id: cleanText(question.id, 60) || `question-${index + 1}`,
        question: text,
        options: Array.isArray(question.options)
          ? question.options.map((option) => cleanText(option, 100)).filter(Boolean).slice(0, 6)
          : [],
        required: question.required !== false,
      };
    })
    .filter((item): item is IntakeQuestion => Boolean(item))
    .slice(0, 3);

  const requestedCategory = cleanText(record.category, 80);
  const category = CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === requestedCategory.toLowerCase(),
  ) ?? 'General Contractor';

  const estimatedMin = safeNumber(record.estimatedMin);
  const estimatedMax = safeNumber(record.estimatedMax);
  const confidence = typeof record.confidence === 'number' && Number.isFinite(record.confidence)
    ? Math.max(0, Math.min(1, record.confidence))
    : 0.45;

  return {
    title: cleanText(record.title, 100) || `${category} assistance needed`,
    summary: cleanText(record.summary, 1_500) || 'A professional should inspect the reported issue.',
    likelyIssue: cleanText(record.likelyIssue, 500) || 'Issue requires professional assessment.',
    category,
    urgency: normaliseUrgency(record.urgency),
    confidence,
    professionalInspectionRequired: record.professionalInspectionRequired !== false,
    safetyNotes: Array.isArray(record.safetyNotes)
      ? record.safetyNotes.map((note) => cleanText(note, 300)).filter(Boolean).slice(0, 6)
      : [],
    estimatedMin,
    estimatedMax: estimatedMin !== null && estimatedMax !== null && estimatedMax < estimatedMin
      ? estimatedMin
      : estimatedMax,
    materials,
    clarifyingQuestions,
    estimateType: record.estimateType === 'refined' ? 'refined' : 'standardized',
    model,
  };
}

function detectCategory(text: string): string {
  const value = text.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ['Plumbing', ['pipe', 'tap', 'toilet', 'drain', 'leak', 'water', 'geyser']],
    ['Electrical', ['electric', 'power', 'plug', 'socket', 'light', 'wire', 'trip', 'breaker']],
    ['Roofing', ['roof', 'ceiling leak', 'gutter']],
    ['Painting', ['paint', 'repaint', 'wall colour']],
    ['Carpentry', ['door', 'cupboard', 'cabinet', 'wood', 'carpenter']],
    ['Tiling', ['tile', 'grout', 'tiled']],
    ['Cleaning', ['clean', 'washing', 'deep clean']],
    ['Landscaping', ['garden', 'grass', 'tree', 'landscape']],
    ['Appliance Repair', ['fridge', 'stove', 'washing machine', 'appliance']],
    ['Building', ['build', 'brick', 'wall', 'foundation', 'renovation']],
  ];

  return rules.find(([, words]) => words.some((word) => value.includes(word)))?.[0]
    ?? 'General Contractor';
}

function fallbackAssessment(description: string, answers: IntakeAnswer[]): IntakeAssessment {
  const category = detectCategory(`${description} ${answers.map((item) => item.answer).join(' ')}`);
  const lower = description.toLowerCase();
  const emergency = ['fire', 'smoke', 'sparking', 'flooding', 'burst pipe', 'live wire', 'gas smell']
    .some((term) => lower.includes(term));
  const urgent = emergency || ['leak', 'no power', 'blocked toilet', 'broken lock']
    .some((term) => lower.includes(term));

  const ranges: Record<string, [number, number]> = {
    Plumbing: [650, 2_500],
    Electrical: [750, 3_000],
    Roofing: [1_500, 8_000],
    Painting: [1_200, 6_000],
    Carpentry: [900, 5_000],
    Tiling: [1_500, 8_000],
    Cleaning: [450, 2_500],
    Landscaping: [700, 4_000],
    'Appliance Repair': [650, 2_800],
    Building: [2_500, 15_000],
    'General Contractor': [1_000, 8_000],
  };
  const [estimatedMin, estimatedMax] = ranges[category] ?? [1_000, 8_000];

  return {
    title: `${category} assistance needed`,
    summary: description,
    likelyIssue: 'The information provided should be confirmed by a professional inspection.',
    category,
    urgency: emergency ? 'emergency' : urgent ? 'urgent' : 'planned',
    confidence: 0.35,
    professionalInspectionRequired: true,
    safetyNotes: emergency
      ? ['Keep a safe distance from the affected area and contact emergency services when life or property is at immediate risk.']
      : [],
    estimatedMin,
    estimatedMax,
    materials: [],
    clarifyingQuestions: answers.length > 0 ? [] : [
      {
        id: 'when-started',
        question: 'When did the problem start?',
        options: ['Today', 'This week', 'More than a week ago', 'Not sure'],
        required: true,
      },
      {
        id: 'getting-worse',
        question: 'Is the problem getting worse?',
        options: ['Yes', 'No', 'Not sure'],
        required: true,
      },
    ],
    estimateType: answers.length > 0 ? 'refined' : 'standardized',
    model: 'heuristic-fallback',
  };
}

function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function readQuestionCount(request: NextRequest, hasAnswers: boolean): number {
  if (!hasAnswers) return 0;
  const value = Number(request.cookies.get(QUESTION_COUNT_COOKIE)?.value ?? 0);
  return Number.isFinite(value)
    ? Math.max(0, Math.min(HARD_QUESTION_LIMIT, Math.floor(value)))
    : 0;
}

function limitQuestions(
  assessment: IntakeAssessment,
  questionsAlreadyAsked: number,
): IntakeAssessment {
  const normalRemaining = Math.max(0, NORMAL_QUESTION_TARGET - questionsAlreadyAsked);
  const hardRemaining = Math.max(0, HARD_QUESTION_LIMIT - questionsAlreadyAsked);

  let allowed = Math.min(3, normalRemaining);

  // Only extend beyond the normal seven-question target when the model remains
  // genuinely uncertain. The absolute limit can never exceed nine questions.
  if (assessment.confidence < 0.55 && hardRemaining > normalRemaining) {
    allowed = Math.min(3, hardRemaining);
  }

  if (hardRemaining === 0) allowed = 0;

  return {
    ...assessment,
    clarifyingQuestions: assessment.clarifyingQuestions.slice(0, allowed),
  };
}

function intakeResponse(
  assessment: IntakeAssessment,
  usedFallback: boolean,
  questionsAlreadyAsked: number,
): NextResponse {
  const limited = limitQuestions(assessment, questionsAlreadyAsked);
  const nextCount = Math.min(
    HARD_QUESTION_LIMIT,
    questionsAlreadyAsked + limited.clarifyingQuestions.length,
  );

  const response = NextResponse.json({
    assessment: limited,
    usedFallback,
    questionProgress: {
      asked: nextCount,
      normalTarget: NORMAL_QUESTION_TARGET,
      hardLimit: HARD_QUESTION_LIMIT,
    },
  });

  if (limited.clarifyingQuestions.length === 0) {
    response.cookies.delete(QUESTION_COUNT_COOKIE);
  } else {
    response.cookies.set(QUESTION_COUNT_COOKIE, String(nextCount), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/get-help',
      maxAge: 30 * 60,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  let description = '';
  let answers: IntakeAnswer[] = [];
  let image = '';
  let questionsAlreadyAsked = 0;

  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 4_000_000) {
      return NextResponse.json({ error: 'The intake payload is too large.' }, { status: 413 });
    }

    const body = await request.json() as Record<string, unknown>;
    description = cleanText(body.description);
    image = cleanText(body.image, 3_000_000);
    answers = cleanAnswers(body.answers);
    questionsAlreadyAsked = readQuestionCount(request, answers.length > 0);

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Please describe the problem in a little more detail.' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY
      || process.env.NEXT_PUBLIC_GEMINI_KEY
      || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return intakeResponse(
        fallbackAssessment(description, answers),
        true,
        questionsAlreadyAsked,
      );
    }

    const answerContext = answers.length > 0
      ? `\nCustomer answers:\n${answers.map((item) => `- ${item.question}: ${item.answer}`).join('\n')}`
      : '';

    const hardRemaining = Math.max(0, HARD_QUESTION_LIMIT - questionsAlreadyAsked);
    const normalRemaining = Math.max(0, NORMAL_QUESTION_TARGET - questionsAlreadyAsked);
    const suggestedMaximum = Math.min(3, hardRemaining);

    const prompt = `You are the structured intake assistant for Skills Connect Pro, a South African home-services marketplace.

Customer description:
${description}${answerContext}

Create a cautious preliminary project brief. Never claim a final diagnosis or guaranteed price. A professional may need to inspect the site. Detect immediate safety risks and use South African Rand estimates suitable for a broad preliminary range.

Question progress:
- Questions already shown: ${questionsAlreadyAsked}
- Normal total target: ${NORMAL_QUESTION_TARGET}
- Absolute total maximum: ${HARD_QUESTION_LIMIT}
- Normal questions remaining: ${normalRemaining}
- Absolute questions remaining: ${hardRemaining}

Return ONLY valid JSON with this exact shape:
{
  "title": "Short plain-language job title",
  "summary": "Clear structured summary of what the customer reported",
  "likelyIssue": "Cautious likely issue, explicitly preliminary",
  "category": "One of: ${CATEGORY_OPTIONS.join(', ')}",
  "urgency": "emergency | urgent | planned | large_project",
  "confidence": 0.0,
  "professionalInspectionRequired": true,
  "safetyNotes": ["Short safety note"],
  "estimatedMin": 0,
  "estimatedMax": 0,
  "materials": [{"name":"Item","quantity":1,"unit":"item","estimatedUnitPrice":0,"estimatedTotal":0,"notes":"Optional"}],
  "clarifyingQuestions": [{"id":"short-id","question":"Question","options":["Option"],"required":true}],
  "estimateType": "standardized | refined"
}

Rules:
1. Ask no more than ${suggestedMaximum} new clarifying questions in this response.
2. Aim to finish after no more than ${NORMAL_QUESTION_TARGET} total questions. Ask questions eight or nine only when essential information remains missing and confidence is below 0.55.
3. Never repeat a question the customer has already answered.
4. If the question budget is exhausted, return an empty clarifyingQuestions array and produce the best cautious brief possible.
5. If customer answers are already supplied, provide a refined brief and ask questions only when essential information is still missing.
6. For emergency hazards such as fire, gas, live electricity, major flooding or structural collapse, set urgency to emergency and provide immediate safety guidance.
7. Do not recommend DIY work for dangerous electrical, gas, structural or major plumbing hazards.
8. Return null for estimatedMin and estimatedMax when a meaningful range cannot be given.
9. Materials are preliminary possibilities, not a shopping instruction. Return an empty array when uncertain.
10. Keep language simple and suitable for customers with varied literacy levels.`;

    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [prompt];
    if (image) {
      const data = image.includes(',') ? image.split(',').pop() ?? '' : image;
      if (data) contents.push({ inlineData: { mimeType: 'image/jpeg', data } });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = parseModelJson(response.text ?? '{}');
    return intakeResponse(
      normaliseAssessment(parsed, 'gemini-flash-latest'),
      false,
      questionsAlreadyAsked,
    );
  } catch (error) {
    console.error('POST /api/project-intake/assess failed:', error);

    // The request body has already been parsed above, so use the captured values
    // rather than attempting to clone and reread a consumed request stream.
    if (description) {
      return intakeResponse(
        fallbackAssessment(description, answers),
        true,
        questionsAlreadyAsked,
      );
    }

    return NextResponse.json(
      { error: 'We could not assess the project. Please try again.' },
      { status: 500 },
    );
  }
}
