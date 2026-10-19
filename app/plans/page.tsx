import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, FolderKanban, ShieldCheck } from 'lucide-react';
import { createServerSupabaseClient } from '@/services/supabase/server';
import styles from '../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Project Plans | Skills Connect Pro',
  description: 'Simple, transparent project-workspace plans for Skills Connect Pro customers.',
};

type Plan = {
  code: string;
  name: string;
  price_cents: number;
  duration_days: number | null;
  project_limit: number | null;
  features: string[];
};

function price(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency: 'ZAR', maximumFractionDigits: 0,
  }).format(value / 100);
}

export default async function PlansPage() {
  const supabase = await createServerSupabaseClient();
  const { data: plans, error } = await supabase
    .from('plans')
    .select('code,name,price_cents,duration_days,project_limit,features')
    .eq('active', true)
    .order('price_cents');

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Site navigation"><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}><Link href="/my-projects" className={styles.navLink}>My Projects</Link><Link href="/assistant" className={styles.primaryLink}>Plan a project <ArrowRight size={16} /></Link></div>
      </div></nav>

      <div className={styles.shell}>
        <section className={styles.planHero}>
          <span className={styles.eyebrow}>Project workspace plans</span>
          <h1>Keep the whole project together.</h1>
          <p>Start with the access period that suits the job. Every plan keeps your project brief, preliminary estimate and working documents in one private place.</p>
        </section>

        {error && <div className={styles.error}>Plans are temporarily unavailable. Please try again shortly.</div>}
        <section className={styles.planGrid} aria-label="Project workspace plans">
          {(plans as Plan[] | null ?? []).map((plan) => {
            const isFeatured = plan.code === 'project_pass_90';
            return <article className={`${styles.planCard} ${isFeatured ? styles.featuredPlan : ''}`} key={plan.code}>
              {isFeatured && <span className={styles.planBadge}>Best value</span>}
              <FolderKanban size={26} aria-hidden="true" />
              <h2>{plan.name}</h2>
              <p className={styles.planPrice}>{price(plan.price_cents)}<span>{plan.duration_days ? ` / ${plan.duration_days} days` : ''}</span></p>
              <p className={styles.subtle}>{plan.project_limit === 1 ? 'One project workspace' : 'Project workspace access'}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}
              </ul>
              <Link href="/my-projects" className={isFeatured ? styles.planAction : styles.planSecondaryAction}>Open My Projects <ArrowRight size={16} /></Link>
            </article>;
          })}
        </section>

        {!error && !plans?.length && <div className={styles.empty}><div className={styles.emptyIcon}><ShieldCheck size={30} /></div><h2>Plans are being prepared.</h2><p>Please check back shortly.</p></div>}
        <p className={styles.planFinePrint}>Project plans are for private workspace access. A provider may still need to inspect the site before agreeing work, price or a building plan.</p>
      </div>
    </main>
  );
}
