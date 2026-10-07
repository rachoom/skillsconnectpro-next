import { POST as publicIntake } from './intake/route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) { return publicIntake(request); }
