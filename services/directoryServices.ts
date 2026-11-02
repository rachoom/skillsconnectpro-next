/** Display/filter taxonomy; legacy database categories remain unchanged. */
export function directoryServiceCategories(value: string | null | undefined): string[] {
  return [...new Set(String(value || '').split(/[,;]+/).map(raw => {
    const category = raw.trim();
    const key = category.toLowerCase();
    if (/plumb/.test(key)) return 'Plumbing';
    if (/electric/.test(key)) return 'Electrical';
    if (/mechanic|automotive/.test(key)) return 'Mechanics';
    if (/clean/.test(key)) return 'Cleaning';
    if (/paint/.test(key)) return 'Painting';
    if (/^(builder|builders|building|general|general contractor)$/.test(key)) return 'General Contractor';
    if (/^carpent/.test(key)) return 'Carpentry';
    if (/^weld/.test(key)) return 'Welding';
    return category;
  }).filter(Boolean))];
}

const JOBS: Record<string, string[]> = {
  Plumbing: ['Burst pipe / flooding', 'Blocked drain', 'Leaking geyser', 'Leaking tap', 'Other plumbing problem'],
  Electrical: ['No power', 'Exposed wires / sparks', 'Tripping power', 'Faulty lights', 'Other electrical problem'],
  Mechanics: ['Car will not start', 'Vehicle breakdown', 'Brake problem', 'Engine overheating', 'Other mechanical problem'],
};

export function quickRequestIssueOptions(service: string): string[] {
  const options = directoryServiceCategories(service).flatMap(category => JOBS[category] || []);
  return [...new Set([...options, 'Service or repair', 'Urgent assistance', 'Inspection / assessment', 'Other'])];
}
