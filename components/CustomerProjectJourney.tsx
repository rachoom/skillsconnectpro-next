import { BadgeCheck, ClipboardList, MessagesSquare, UsersRound, Wrench } from 'lucide-react';
import styles from './CustomerExperience.module.css';

export function CustomerProjectJourney({ stage, closed, next, tone }: { stage: number; closed: boolean; next: string; tone: string }) {
  const steps = [{ label: 'Request', icon: ClipboardList }, { label: 'Providers', icon: UsersRound }, { label: 'Responses', icon: MessagesSquare }, { label: 'Connection', icon: BadgeCheck }, { label: 'Work', icon: Wrench }];
  return <section className={styles.journey} data-tone={tone} aria-label="Your project progress">
    <ol className={styles.steps}>{steps.map(({ label, icon: Icon }, index) => <li key={label} data-reached={index <= stage} aria-current={!closed && index === stage ? 'step' : undefined}><span className={styles.stepIcon}><Icon size={18} aria-hidden="true" /></span><span>{label}</span></li>)}</ol>
    <div className={styles.nextStep}><strong>{closed ? 'Project record' : 'Your next step'}</strong><p>{next}</p></div>
  </section>;
}
