import type { ReactNode } from 'react';
import styles from './IntakeVisualShell.module.css';

export const IntakeVisualShell = ({ children }: { children: ReactNode }) => (
  <div className={styles.shell} data-scp-page="intake">
    <div className={styles.content}>{children}</div>
  </div>
);
