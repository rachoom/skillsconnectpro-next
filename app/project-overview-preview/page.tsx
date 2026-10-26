'use client';

// Reuse the real customer dashboard rather than a separate mock-up. The
// preview uses a closed set of sample data and explicitly bypasses all
// project API requests, WhatsApp links and write operations.
import { CustomerProjectExperience } from '../project/[id]/page';

export default function ProjectOverviewPreviewPage() {
  return <CustomerProjectExperience preview />;
}
