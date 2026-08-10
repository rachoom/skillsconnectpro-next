export type IntakePolicyQuestion = {
  id: string;
  question: string;
  options: string[];
  required: boolean;
};

export function detectIntakeCategory(text: string): string;

export function buildBaselineQuestions(
  category: string,
  description?: string,
): IntakePolicyQuestion[];

export function mergeClarifyingQuestions(input: {
  modelQuestions?: IntakePolicyQuestion[];
  baselineQuestions?: IntakePolicyQuestion[];
  answeredQuestions?: string[];
  minimum?: number;
  maximum?: number;
}): IntakePolicyQuestion[];

export function isLikelyStreetAddress(value: string): boolean;
export function phoneValidationMessage(value: string): string | null;
