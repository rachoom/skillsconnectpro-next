// Labels used by the public directory. Profile text and invitation details keep the original trade.
const aliases = {
  Plumbing: ['plumber', 'plumbers', 'specialist plumber', 'plumbers and projects'],
  Electrical: ['electrician', 'electricians', 'master electrician'],
  Building: ['builder', 'builders', 'construction', 'building contractor', 'building & renovations'],
  Carpentry: ['carpenter', 'carpenters'],
  Mechanics: ['mechanic', 'automotive', 'automotive mechanic', 'automotive mechanics', 'auto mechanic', 'auto mechanics', 'car repair'],
  Painting: ['painter', 'painters'],
  Cleaning: ['cleaner', 'cleaners', 'household cleaner', 'household cleaning'],
  Welding: ['welder', 'welders'],
  Tiling: ['tiler', 'tilers'],
  Roofing: ['roofer', 'roofers'],
  Ceilings: ['ceiling', 'ceiling installer', 'ceiling installers', 'ceiling installation'],
  'General Contractor': ['general contractors', 'general contracting'],
  'General Maintenance': ['handyman', 'handymen', 'maintenance'],
  General: [],
  Landscaping: ['landscaper', 'landscapers', 'gardening', 'garden'],
  Hairdressing: ['hairdresser', 'hairdressers', 'salon', 'hairstylist', 'hairstylists'],
  Catering: ['caterer', 'caterers', 'event caterer', 'event caterers', 'event catering'],
  'Day Care': ['daycare', 'creche', 'creches', 'child care', 'childcare'],
  Beauty: ['beautician', 'beauticians', 'makeup', 'spa', 'nails'],
  Fashion: ['dressmaker', 'dressmakers', 'tailor', 'tailors', 'tailoring', 'dressmaking'],
  'Linen & Curtains': ['linen and curtains'],
  'Glass and Aluminium': ['glass & aluminium', 'glass and aluminum'],
};

function key(label) {
  return label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\s+/g, ' ').trim().replace(/\s+services?$/, '');
}

const byLabel = new Map();
for (const [group, variants] of Object.entries(aliases)) {
  for (const variant of [group, ...variants]) byLabel.set(key(variant), group);
}

export function directoryServices(value) {
  const label = (value || '').replace(/\b(cleaners?|cleaning)(?:\s+services?)?\s*,\s*household\b/gi, 'Cleaning');
  const services = new Set();
  for (const part of label.split(/[,;/|\n]+/)) {
    const name = part.trim();
    if (!name) continue;
    const known = byLabel.get(key(name));
    if (known) {
      services.add(known);
      continue;
    }
    // Split joined trades only when both sides are identifiable services.
    const joined = name.split(/\s*(?:&|\+|\band\b)\s*/i).map(word => byLabel.get(key(word)));
    if (joined.length > 1 && joined.every(Boolean)) {
      for (const group of joined) services.add(group);
    } else {
      services.add(name);
    }
  }
  return [...services];
}
