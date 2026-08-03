import type { ReactNode } from 'react';
import styles from './palette.module.css';

export default function ProviderOpportunityLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
