import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { House, ShieldCheck } from 'lucide-react';
import styles from './CustomerTransactionShell.module.css';

export function CustomerTransactionShell({ children, label }: { children: ReactNode; label: string }) {
  return <main className={styles.page} data-customer-transaction>
    <header className={styles.header}><Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={180} height={48} priority /></Link><Link href="/" className={styles.home}><House size={17} aria-hidden="true" /><span>Home</span></Link></header>
    <div className={styles.label}><ShieldCheck size={17} aria-hidden="true" />{label}</div>
    <div className={styles.content}>{children}</div>
  </main>;
}
