import type { Metadata } from 'next';
import { ProjectIntake } from '../../components/ProjectIntake';

export const metadata: Metadata = {
  title: 'Show Us the Job | Skills Connect Pro',
  description: 'Describe or photograph a job, receive a preliminary project brief, and connect with suitable local professionals.',
};

export default function GetHelpPage() {
  return <ProjectIntake />;
}
