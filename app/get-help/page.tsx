import type { Metadata } from 'next';
import { ProjectIntakeV2 } from '../../components/ProjectIntakeV2';

export const metadata: Metadata = {
  title: 'Show Us the Job | Skills Connect Pro',
  description: 'Describe or photograph a job, answer clear job-specific questions, receive a preliminary project brief, and connect with suitable local professionals.',
};

export default function GetHelpPage() {
  return <ProjectIntakeV2 />;
}
