import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildBaselineQuestions,
  detectIntakeCategory,
  mergeClarifyingQuestions,
  type IntakePolicyQuestion,
} from '@/services/marketplace/intakePolicy.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NORMAL_QUESTION_TARGET = 7;
const HARD_QUESTION_LIMIT = 9;
const MINIMUM_INITIAL_QUESTIONS = 5;
const MAXIMUM_QUESTIONS_PER_ROUND = 6;

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
  clarifyingQuestions: IntakePolicyQuestion[];
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
  const seen = new Set<string>();

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const question = cleanText(record.question, 500);
      const answer = cleanText(record.answer, 1_000);
      if (!question || !answer) return null;
      const key = question.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key);
      return { question, answer };
    })
    .filter((item): item is IntakeAnswer => Boolean(item))
    .slice(0, HARD_QUESTION_LIMIT);
}

function cleanQuestionCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count)
    ? Math.max(0, Math.min(HARD_QUESTION_LIMIT, Math.floor(count)))
    : 0;
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
    .map((item, index): IntakePolicyQuestion | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const rawQuestion = item as Record<string, unknown>;
      const text = cleanText(rawQuestion.question, 300);
      if (!text) return null;
      return {
        id: cleanText(rawQuestion.id, 60) || `question-${index + 1}`,
        question: text,
        options: Array.isArray(rawQuestion.options)
          ? rawQuestion.options
              .map((option) => cleanText(option, 100))
              .filter(Boolean)
              .slice(0, 6)
          : [],
        required: rawQuestion.required !== false,
      };
    })
    .filter((item): item is IntakePolicyQuestion => Boolean(item))
    .slice(0, MAXIMUM_QUESTIONS_PER_ROUND);

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
    summary: cleanText(record.summary, 1_500) || 'A suitable professional should assess the requested work.',
    likelyIssue: cleanText(record.likelyIssue, 500) || 'The scope should be confirmed by a suitable professional.',
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

function fallbackAssessment(description: string, answers: IntakeAnswer[]): IntakeAssessment {
  const combinedText = `${description} ${answers.map((item) => item.answer).join(' ')}`;
  const category = detectIntakeCategory(combinedText);
  const lower = combinedText.toLowerCase();
  const emergency = ['fire', 'smoke', 'sparking', 'flooding', 'burst pipe', 'live wire', 'gas smell', 'collapse']
    .some((term) => lower.includes(term));
  const urgent = emergency || ['leak', 'no power', 'blocked toilet', 'broken lock']
    .some((term) => lower.includes(term));
  const largeProject = category === 'Building' && ['build', 'room', 'extension', 'renovation', 'foundation']
    .some((term) => lower.includes(term));

  const ranges: Record<string, [number, number]> = {
    Plumbing: [650, 4_000],
    Electrical: [750, 5_000],
    Roofing: [1_500, 15_000],
    Painting: [1_500, 20_000],
    Carpentry: [900, 12_000],
    Tiling: [1_500, 20_000],
    Cleaning: [450, 4_500],
    Landscaping: [700, 12_000],
    'Appliance Repair': [650, 4_500],
    Building: largeProject ? [25_000, 180_000] : [3_000, 30_000],
    'General Contractor': [1_500, 25_000],
  };
  const [estimatedMin, estimatedMax] = ranges[category] ?? [1_500, 25_000];
  const answerSummary = answers.length
    ? ` Customer details: ${answers.map((item) => `${item.question} ${item.answer}`).join('; ')}.`
    : '';

  return {
    title: category === 'Building' && lower.includes('room')
      ? 'New room construction'
      : `${category} assistance needed`,
    summary: `${description}${answerSummary}`.slice(0, 1_500),
    likelyIssue: category === 'Building'
      ? 'The proposed construction scope, dimensions, foundation, services and approval requirements need to be confirmed before a final quotation.'
      : 'The information provided should be confirmed through a suitable professional assessment.',
    category,
    urgency: emergency ? 'emergency' : urgent ? 'urgent' : largeProject ? 'large_project' : 'planned',
    confidence: answers.length >= MINIMUM_INITIAL_QUESTIONS ? 0.58 : 0.38,
    professionalInspectionRequired: true,
    safetyNotes: emergency
      ? ['Keep a safe distance from the affected area and contact emergency services when life or property is at immediate risk.']
      : [],
    estimatedMin,
    estimatedMax,
    materials: [],
    clarifyingQuestions: answers.length >= MINIMUM_INITIAL_QUESTIONS
      ? []
      : buildBaselineQuestions(category, description),
    estimateType: answers.length > 0 ? 'refined' : 'standardized',
    model: 'contextual-fallback-v2',
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

function prepareAssessment(
  assessment: IntakeAssessment,
  description: string,
  answers: IntakeAnswer[],
  questionsAlreadyAsked: number,
): IntakeAssessment {
  const hardRemaining = Math.max(0, HARD_QUESTION_LIMIT - questionsAlreadyAsked);
  if (hardRemaining === 0) return { ...assessment, clarifyingQuestions: [] };

  const firstRound = questionsAlreadyAsked === 0 && answers.length === 0;
  const maximum = Math.min(MAXIMUM_QUESTIONS_PER_ROUND, hardRemaining);
  const minimum = firstRound
    ? Math.min(MINIMUM_INITIAL_QUESTIONS, maximum)
    : Math.min(Math.max(0, MINIMUM_INITIAL_QUESTIONS - answers.length), maximum);

  const questions = mergeClarifyingQuestions({
    modelQuestions: assessment.clarifyingQuestions,
    baselineQuestions: buildBaselineQuestions(assessment.category, description),
    answeredQuestions: answers.map((item) => item.question),
    minimum,
    maximum,
  });

  return { ...assessment, clarifyingQuestions: questions };
}

function intakeResponse(
  assessment: IntakeAssessment,
  usedFallback: boolean,
  description: string,
  answers: IntakeAnswer[],
  questionsAlreadyAsked: number,
): NextResponse {
  const prepared = prepareAssessment(
    assessment,
    description,
    answers,
    questionsAlreadyAsked,
  );
  const nextCount = Math.min(
    HARD_QUESTION_LIMIT,
    questionsAlreadyAsked + prepared.clarifyingQuestions.length,
  );

  return NextResponse.json({
    assessment: prepared,
    usedFallback,
    questionProgress: {
      asked: nextCount,
      answered: answers.length,
      normalTarget: NORMAL_QUESTION_TARGET,
      hardLimit: HARD_QUESTION_LIMIT,
    },
  });
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
    questionsAlreadyAsked = cleanQuestionCount(body.questionsAsked);

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Please describe the job in a little more detail.' },
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
        description,
        answers,
        questionsAlreadyAsked,
      );
    }

    const answerContext = answers.length > 0
      ? `\nCustomer answers already collected:\n${answers.map((item) => `- ${item.question}: ${item.answer}`).join('\n')}`
      : '';
    const hardRemaining = Math.max(0, HARD_QUESTION_LIMIT - questionsAlreadyAsked);
    const firstRound = questionsAlreadyAsked === 0 && answers.length === 0;
    const questionInstruction = firstRound
      ? `Ask between ${MINIMUM_INITIAL_QUESTIONS} and ${Math.min(MAXIMUM_QUESTIONS_PER_ROUND, hardRemaining)} useful, job-specific clarification questions.`
      : 'Ask another question only when essential information is genuinely still missing. Otherwise return an empty clarifyingQuestions array.';

    const prompt = `You are the structured intake assistant for Skills Connect Pro, a South African home-services marketplace.

Customer description:
${description}${answerContext}

Create a cautious preliminary project brief. Never claim a final diagnosis, approved building plan, guaranteed price or guaranteed availability. A suitable professional may need to inspect the site. Detect immediate safety risks and use South African Rand estimates suitable for a broad preliminary range.

Question progress:
- Questions already shown: ${questionsAlreadyAsked}
- Answers collected: ${answers.length}
- Normal total target: ${NORMAL_QUESTION_TARGET}
- Absolute total maximum: ${HARD_QUESTION_LIMIT}
- Questions remaining before the hard limit: ${hardRemaining}

Return ONLY valid JSON with this exact shape:
{
  "title": "Short plain-language job title",
  "summary": "Clear structured summary of what the customer reported",
  "likelyIssue": "Cautious preliminary scope or likely issue",
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
1. ${questionInstruction}
2. Questions must be specific to the actual job. For construction, ask about dimensions, intended use, site stage, services, plans or approval and expected finish—not when a fault started.
3. Never repeat a question listed in the collected answers.
4. Use simple card-friendly questions and short answer options that an ordinary customer can understand quickly.
5. If the question budget is exhausted, return an empty clarifyingQuestions array and produce the best cautious brief possible.
6. For emergency hazards such as fire, gas, live electricity, major flooding or structural collapse, set urgency to emergency and provide immediate safety guidance.
7. Do not recommend DIY work for dangerous electrical, gas, structural or major plumbing hazards.
8. Return null for estimatedMin and estimatedMax when a meaningful range cannot be given.
9. Materials are preliminary possibilities, not shopping instructions. Return an empty array when uncertain.
10. Keep language clear, practical and suitable for customers with varied literacy levels.`;

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

    return intakeResponse(
      normaliseAssessment(parseModelJson(response.text ?? '{}'), 'gemini-flash-latest'),
      false,
      description,
      answers,
      questionsAlreadyAsked,
    );
  } catch (error) {
    console.error('POST /api/project-intake/assess-v2 failed:', error);

    if (description) {
      return intakeResponse(
        fallbackAssessment(description, answers),
        true,
        description,
        answers,
        questionsAlreadyAsked,
      );
    }

    return NextResponse.json(
      { error: 'We could not assess the project. Please try again.' },
      { status: 500 },
    );
  }
}
