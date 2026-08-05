import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './IntakeVisualShell.module.css';

export const IntakeVisualShell = ({ children }: { children: ReactNode }) => (
  <div className={styles.shell} data-scp-page="intake">
    <div className={styles.background} aria-hidden="true">
      <Image
        src="/artisans/Cards/builders.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.overlay} />
      <div className={styles.texture} />
    </div>
    <div className={styles.content}>{children}</div>
  </div>
);
