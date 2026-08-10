import type { Metadata } from 'next';
import { ProviderJoinExperience } from '../../components/ProviderJoinExperience';

export const metadata: Metadata = {
  title: 'Join as a Service Provider | Skills Connect Pro',
  description: 'Apply to join the Skills Connect Pro local provider network and receive relevant tracked marketplace opportunities after review.',
};

export default function JoinPage() {
  return <ProviderJoinExperience />;
}
