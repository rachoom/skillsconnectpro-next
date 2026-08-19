const MECHANICS_TERMS = [
  'mechanic',
  'mechanics',
  'vehicle',
  'car repair',
  'car service',
  'engine',
  'gearbox',
  'clutch',
  'brake',
  'brakes',
  'alternator',
  'starter motor',
  'radiator',
  'suspension',
  'overheating',
  'oil change',
  'won’t start',
  "won't start",
  'not starting',
  'breakdown',
];

export function isMechanicsRequest(value) {
  const text = String(value || '').toLowerCase();
  return MECHANICS_TERMS.some((term) => text.includes(term));
}

export function normalisePrimaryServiceCategory(value) {
  const raw = String(value || '').trim();
  const category = raw.toLowerCase();

  if (
    category === 'building' ||
    category === 'builders' ||
    category === 'building & renovations' ||
    category === 'building and renovations' ||
    category === 'carpentry' ||
    category === 'carpenters'
  ) {
    return 'General Contractor';
  }

  if (category === 'mechanic' || category === 'mechanics' || category === 'automotive') {
    return 'Mechanics';
  }

  if (category === 'cleaner' || category === 'cleaners' || category === 'cleaning') {
    return 'Cleaning';
  }

  return raw;
}
