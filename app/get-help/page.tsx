import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IntakeCopyPolish } from '../../components/IntakeCopyPolish';
import { IntakeNavigation } from '../../components/IntakeNavigation';
import { IntakeVisualShell } from '../../components/IntakeVisualShell';
import { ProjectIntakeEntryBridge } from '../../components/ProjectIntakeEntryBridge';
import { ProjectIntakeV2 } from '../../components/ProjectIntakeV2';

export const metadata: Metadata = {
  title: 'What Do You Need Done? | Skills Connect Pro',
  description: 'Tell Skills Connect Pro what you need, add a photograph or use your voice, then answer clear job-specific questions and invite suitable local providers through a tracked marketplace request.',
};

export default function GetHelpPage() {
  return (
    <IntakeVisualShell>
      <IntakeNavigation />
      <IntakeCopyPolish />
      <Suspense fallback={null}>
        <ProjectIntakeEntryBridge />
      </Suspense>
      <ProjectIntakeV2 />
    </IntakeVisualShell>
  );
}
