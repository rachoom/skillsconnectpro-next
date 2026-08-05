import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IntakeNavigation } from '../../components/IntakeNavigation';
import { IntakeVisualShell } from '../../components/IntakeVisualShell';
import { ProjectIntakeEntryBridge } from '../../components/ProjectIntakeEntryBridge';
import { ProjectIntakeV2 } from '../../components/ProjectIntakeV2';

export const metadata: Metadata = {
  title: 'Show Us the Job | Skills Connect Pro',
  description: 'Describe, photograph or speak about a home-service job, answer clear job-specific questions and invite suitable local providers through a tracked marketplace request.',
};

export default function GetHelpPage() {
  return (
    <IntakeVisualShell>
      <IntakeNavigation />
      <Suspense fallback={null}>
        <ProjectIntakeEntryBridge />
      </Suspense>
      <ProjectIntakeV2 />
    </IntakeVisualShell>
  );
}
