import type { Metadata } from 'next';
import { SignInCard } from './sign-in-card';
import { safeInternalPath } from '@/services/authRedirect';

export const metadata: Metadata = {
  title: 'Sign in | Skills Connect Pro',
  description: 'Sign in to save and manage your Skills Connect Pro projects.',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <SignInCard
      nextPath={safeInternalPath(first(params.next))}
      projectId={first(params.projectId) ?? ''}
      projectToken={first(params.token) ?? ''}
      initialError={first(params.error) ?? ''}
    />
  );
}
