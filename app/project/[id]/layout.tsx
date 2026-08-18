import type { ReactNode } from 'react';
import backdropStyles from '../../project-overview-backdrop.module.css';

export default function ProjectOverviewLayout({ children }: { children: ReactNode }) {
  return <div className={backdropStyles.backdropShell}>{children}</div>;
}
