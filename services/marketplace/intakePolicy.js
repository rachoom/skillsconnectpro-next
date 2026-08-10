const MAX_QUESTION_OPTIONS = 6;

function question(id, text, options = [], required = true) {
  return {
    id,
    question: text,
    options: options.slice(0, MAX_QUESTION_OPTIONS),
    required,
  };
}

export function detectIntakeCategory(text) {
  const value = String(text || '').toLowerCase();
  const rules = [
    ['Plumbing', ['pipe', 'tap', 'toilet', 'drain', 'leak', 'water', 'geyser', 'basin', 'shower']],
    ['Electrical', ['electric', 'power', 'plug', 'socket', 'light', 'wire', 'trip', 'breaker', 'db board']],
    ['Roofing', ['roof', 'ceiling leak', 'gutter', 'roof tile']],
    ['Painting', ['paint', 'repaint', 'wall colour', 'peeling paint']],
    ['Carpentry', ['door', 'cupboard', 'cabinet', 'wood', 'carpenter', 'shelving']],
    ['Tiling', ['tile', 'grout', 'tiled', 'floor tiles']],
    ['Cleaning', ['clean', 'washing', 'deep clean', 'cleaning']],
    ['Landscaping', ['garden', 'grass', 'tree', 'landscape', 'paving']],
    ['Appliance Repair', ['fridge', 'stove', 'washing machine', 'dishwasher', 'appliance']],
    ['Building', ['build', 'building', 'brick', 'wall', 'foundation', 'renovation', 'room', 'extension']],
  ];

  return rules.find(([, words]) => words.some((word) => value.includes(word)))?.[0]
    ?? 'General Contractor';
}

const COMMON_QUESTIONS = [
  question(
    'desired-timing',
    'How soon do you need the work to begin?',
    ['Today', 'Within 2–3 days', 'Within a week', 'I am planning ahead'],
  ),
  question(
    'property-area',
    'Which part of the property needs the work?',
    ['Inside the main house', 'Outside the building', 'Roof or ceiling', 'Bathroom or kitchen', 'Yard or boundary', 'Other'],
  ),
  question(
    'desired-result',
    'What result do you need from the provider?',
    ['Repair what is there', 'Replace or install something new', 'Inspect and advise first', 'Provide a quotation', 'Not sure yet'],
  ),
  question(
    'access-condition',
    'Can the provider reach the work area easily?',
    ['Yes, access is clear', 'Limited or difficult access', 'Special ladder or equipment may be needed', 'Not sure'],
  ),
  question(
    'measurements-photos',
    'Do you have useful measurements or additional photographs?',
    ['Yes, I have measurements', 'Yes, I have more photos', 'I have both', 'Not yet'],
  ),
  question(
    'occupied-property',
    'Is the property currently occupied?',
    ['Yes', 'No', 'Partly occupied', 'Prefer not to say'],
  ),
];

const CATEGORY_QUESTIONS = {
  Building: [
    question(
      'building-type',
      'What are you planning to build?',
      ['A room attached to the house', 'A freestanding room or outbuilding', 'An extension or conversion', 'A wall or structural section', 'I need advice first'],
    ),
    question(
      'room-use',
      'What will the new room or space be used for?',
      ['Bedroom', 'Bathroom', 'Kitchen', 'Living or work space', 'Storage', 'Other'],
    ),
    question(
      'room-size',
      'Approximately how large should it be?',
      ['Small — up to about 12 m²', 'Medium — about 13–25 m²', 'Large — more than 25 m²', 'I need help measuring'],
    ),
    question(
      'site-stage',
      'What is currently on the building site?',
      ['Open ground', 'An existing slab or foundation', 'Existing walls or structure', 'An existing room to convert', 'I am not sure'],
    ),
    question(
      'services-required',
      'Will the room need electricity, plumbing or both?',
      ['Electricity only', 'Plumbing only', 'Both electricity and plumbing', 'Neither', 'Not sure yet'],
    ),
    question(
      'plans-approval',
      'Do you already have building plans or municipal approval?',
      ['Approved plans', 'Plans prepared but not approved', 'No plans yet', 'Not sure what is required'],
    ),
    question(
      'finish-level',
      'What finish level are you expecting?',
      ['Basic shell only', 'Standard finished room', 'Higher-end finish', 'I need advice and options'],
    ),
  ],
  Plumbing: [
    question('water-source', 'Where is the plumbing problem?', ['Kitchen', 'Bathroom', 'Outside pipe or drain', 'Geyser area', 'Multiple areas', 'Not sure']),
    question('water-control', 'Can the water supply be shut off safely?', ['Yes', 'No', 'Not sure', 'Water is already off']),
    question('leak-severity', 'What is happening now?', ['Slow drip', 'Continuous leak', 'Flooding or heavy flow', 'Blocked or slow drain', 'No water flow', 'Other']),
  ],
  Electrical: [
    question('electrical-symptom', 'What is the electrical problem?', ['No power', 'Power keeps tripping', 'Sparks or burning smell', 'Faulty plug or light', 'New installation', 'Other']),
    question('affected-area', 'How much of the property is affected?', ['One fitting or plug', 'One room', 'Several rooms', 'The whole property', 'Not sure']),
    question('power-isolated', 'Have you switched off the affected circuit or main power?', ['Yes', 'No', 'Not sure', 'Not safe to approach']),
  ],
  Painting: [
    question('paint-area', 'What needs painting?', ['One room', 'Several rooms', 'Exterior walls', 'Roof or ceiling', 'Doors, gates or woodwork', 'Other']),
    question('surface-condition', 'What condition is the surface in?', ['Good condition', 'Peeling or cracked', 'Damp or stained', 'New plaster', 'Not sure']),
    question('paint-supply', 'Who should supply the paint and materials?', ['Provider supplies everything', 'I will supply paint', 'Please quote both options', 'Not sure']),
  ],
  Roofing: [
    question('roof-symptom', 'What is happening with the roof?', ['Active leak', 'Broken or missing tiles', 'Sagging or structural concern', 'Gutter problem', 'New roof or extension', 'Other']),
    question('roof-type', 'What type of roof is it?', ['Tiles', 'Metal sheeting', 'Flat or concrete roof', 'Thatch', 'Not sure']),
    question('roof-access', 'How easy is it to access the roof?', ['Single-storey and clear', 'Double-storey', 'Restricted access', 'Not sure']),
  ],
  Tiling: [
    question('tiling-area', 'Where is the tiling work?', ['Floor', 'Bathroom wall', 'Kitchen wall', 'Outdoor area', 'Several areas', 'Other']),
    question('tiling-scope', 'What work is needed?', ['Install new tiles', 'Replace damaged tiles', 'Remove and retile', 'Repair grout', 'Inspect first']),
    question('tile-supply', 'Are the tiles already available?', ['Yes', 'No', 'Some materials are available', 'I need help choosing']),
  ],
  Carpentry: [
    question('carpentry-item', 'What needs carpentry work?', ['Door or frame', 'Cupboards or cabinets', 'Shelving', 'Roof timber', 'Furniture', 'Other']),
    question('carpentry-scope', 'What is required?', ['Repair', 'Replace', 'Build new', 'Measure and quote', 'Not sure']),
    question('material-available', 'Are materials already available?', ['Yes', 'No', 'Some materials', 'Provider should advise']),
  ],
  Cleaning: [
    question('cleaning-property', 'What needs cleaning?', ['House or flat', 'Office or shop', 'Post-construction site', 'Carpet or upholstery', 'Outdoor area', 'Other']),
    question('cleaning-size', 'How large is the area?', ['One room', '2–3 rooms', '4 or more rooms', 'Large commercial space', 'Not sure']),
    question('cleaning-condition', 'How intensive is the cleaning?', ['Routine clean', 'Deep clean', 'Very dirty or neglected', 'After building work', 'Not sure']),
  ],
  Landscaping: [
    question('garden-work', 'What garden or outdoor work is needed?', ['Grass cutting', 'Tree or bush trimming', 'Garden design or planting', 'Paving or hard landscaping', 'General clean-up', 'Other']),
    question('garden-size', 'Approximately how large is the area?', ['Small yard', 'Medium garden', 'Large property', 'Commercial or communal area', 'Not sure']),
    question('waste-removal', 'Should the provider remove garden waste?', ['Yes', 'No', 'Please quote both options', 'Not sure']),
  ],
  'Appliance Repair': [
    question('appliance-type', 'Which appliance needs attention?', ['Fridge or freezer', 'Stove or oven', 'Washing machine', 'Dishwasher', 'Microwave', 'Other']),
    question('appliance-symptom', 'What is the appliance doing?', ['Not switching on', 'Not heating or cooling', 'Leaking', 'Making unusual noise', 'Showing an error', 'Other']),
    question('appliance-details', 'Do you know the brand and model?', ['Yes', 'Brand only', 'No', 'I can send a photo']),
  ],
};

export function buildBaselineQuestions(category, description = '') {
  const detected = category || detectIntakeCategory(description);
  const specific = CATEGORY_QUESTIONS[detected] || [];
  const combined = detected === 'Building'
    ? specific
    : [...specific, ...COMMON_QUESTIONS];

  const seen = new Set();
  return combined.filter((item) => {
    const key = item.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeClarifyingQuestions({
  modelQuestions = [],
  baselineQuestions = [],
  answeredQuestions = [],
  minimum = 5,
  maximum = 6,
}) {
  const answered = new Set(
    answeredQuestions.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean),
  );
  const seen = new Set();
  const output = [];

  const add = (item) => {
    if (!item || typeof item !== 'object') return;
    const text = String(item.question || '').trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (answered.has(key) || seen.has(key) || output.length >= maximum) return;
    seen.add(key);
    output.push({
      id: String(item.id || `question-${output.length + 1}`).slice(0, 60),
      question: text.slice(0, 300),
      options: Array.isArray(item.options)
        ? item.options.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 6)
        : [],
      required: item.required !== false,
    });
  };

  modelQuestions.forEach(add);
  if (output.length < minimum) baselineQuestions.forEach(add);
  return output.slice(0, maximum);
}

export function isLikelyStreetAddress(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  if (/^\d{1,6}\s+\S+/i.test(text)) return true;
  return /\b(street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|lane|ln\.?|close|crescent|cres\.?|boulevard|blvd\.?|place|pl\.?|way)\b/i.test(text);
}

export function phoneValidationMessage(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!raw) return 'Phone or WhatsApp number is required.';
  if (digits.length < 10) return 'Phone number is incomplete. Enter all digits, for example 082 123 4567.';
  if (digits.length > 15) return 'Phone number is too long. Check the number and try again.';
  return null;
}
