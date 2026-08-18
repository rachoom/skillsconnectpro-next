import {
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import styles from '../project/[id]/project-overview.module.css';

export const metadata = {
  title: 'Project Overview Visual Preview | Skills Connect Pro',
  robots: { index: false, follow: false },
};

export default function ProjectOverviewPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.overviewBar}>
          <div>
            <span>Customer workspace</span>
            <strong>Project Overview</strong>
          </div>
          <div className={styles.liveState}><i /> Live updates</div>
        </div>

        <header className={styles.projectHero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}>
                <span><ShieldCheck size={17} /></span>
                Ongoing project
              </div>
              <h1>Interior Wall Painting (Labour Only)</h1>
              <p>Paint a wall. The customer needs labour for an interior wall painting job and will provide the required materials.</p>

              <div className={styles.projectMeta}>
                <span>Painting</span>
                <span>Planned</span>
                <span>Matching</span>
                <span><MapPin size={13} /> Benoni</span>
              </div>

              <div className={styles.heroFoot}>
                <span>Created 18 Aug 2026, 09:42</span>
                <span>Updated 10:31</span>
              </div>
            </div>

            <aside className={styles.matchingPanel}>
              <div className={styles.matchingOrb}>
                <span><Users size={25} /></span>
              </div>
              <p className={styles.matchingKicker}>Matching in progress</p>
              <strong>3 providers contacted</strong>
              <p className={styles.matchingCopy}>We are contacting suitable local providers. This page updates automatically.</p>
              <button type="button" className={styles.refreshButton}>
                <RefreshCw size={15} /> Refresh now
              </button>
            </aside>
          </div>
        </header>

        <section className={styles.metricsGrid} aria-label="Project matching status">
          <article className={styles.metricCard}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><Users size={19} /></span><small>01</small></div>
            <strong>3</strong>
            <h2>Providers invited</h2>
            <p>Invitations sent to suitable local providers.</p>
          </article>
          <article className={styles.metricCard}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><Clock3 size={19} /></span><small>02</small></div>
            <strong>0</strong>
            <h2>Currently reviewing</h2>
            <p>Providers actively considering your project.</p>
          </article>
          <article className={`${styles.metricCard} ${styles.metricSuccess}`}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><CheckCircle2 size={19} /></span><small>03</small></div>
            <strong>0</strong>
            <h2>Responses received</h2>
            <p>Provider options ready for you to compare.</p>
          </article>
        </section>

        <section className={styles.responsesSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>Rolling responses</span>
              <h2>Available provider options</h2>
              <p>Compare real responses as suitable providers reply to your project.</p>
            </div>
            <div className={styles.responseTarget}>
              <Clock3 size={15} />
              <span>Response target</span>
              <strong>18 Aug 2026, 13:30</strong>
            </div>
          </div>

          <div className={styles.emptyState}>
            <div className={styles.emptyVisual}>
              <span><Wrench size={28} /></span>
              <i />
            </div>
            <span>Live matching</span>
            <h3>Providers are being contacted</h3>
            <p>Responses will appear here as providers confirm availability. You do not need to keep refreshing — this page updates every 15 seconds.</p>
            <div className={styles.emptySteps}>
              <span><b>1</b> Request shared</span>
              <span><b>2</b> Providers reviewing</span>
              <span><b>3</b> Responses arrive here</span>
            </div>
          </div>
        </section>

        <section className={styles.activityCard}>
          <div className={styles.activityHeading}>
            <div>
              <span>Project activity</span>
              <h2>Your project journey</h2>
            </div>
            <small>Latest activity updates automatically</small>
          </div>

          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineMarker}><span>1</span></div>
              <div>
                <p>Assessment completed</p>
                <small>Your project brief was prepared and confirmed.</small>
                <time>18 Aug 2026, 09:43</time>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineMarker}><span>2</span></div>
              <div>
                <p>Providers invited</p>
                <small>Suitable local painting providers were contacted.</small>
                <time>18 Aug 2026, 09:44</time>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineMarker}><span>3</span></div>
              <div>
                <p>Automatic routing wave queued</p>
                <small>The matching process is active.</small>
                <time>18 Aug 2026, 09:44</time>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineMarker}><span>4</span></div>
              <div>
                <p>Awaiting responses</p>
                <small>New provider options will appear above as they arrive.</small>
                <time>Live</time>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
