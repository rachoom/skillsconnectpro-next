import type { Metadata } from 'next';
import { ControlledProviderDirectory } from '../../components/ControlledProviderDirectory';

export const metadata: Metadata = {
  title: 'Browse and Invite Local Providers | Skills Connect Pro',
  description: 'Explore controlled provider profiles and invite suitable local professionals through a tracked Skills Connect Pro project request.',
};

export default function BrowseProvidersPage() {
  return <ControlledProviderDirectory />;
}
