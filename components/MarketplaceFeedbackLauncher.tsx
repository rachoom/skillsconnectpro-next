'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react';

type Review = {
  id: string;
  overallRating: number;
  reviewText: string | null;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
};

type Complaint = {
  id: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  resolutionOutcome: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type FeedbackState = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  providerId: number | null;
  providerName: string;
  reviewEligible: boolean;
  complaintEligible: boolean;
  review: Review | null;
  complaint: Complaint | null;
};

type Panel = 'review' | 'complaint';

const COMPLAINT_OPTIONS = [
  ['no_show', 'Provider did not arrive'],
  ['non_completion', 'Work was not completed'],
  ['quality', 'Quality of work'],
  ['communication', 'Communication problem'],
  ['overcharging', 'Price or overcharging'],
  ['damage', 'Damage to property'],
  ['safety', 'Safety concern'],
  ['misconduct', 'Serious conduct concern'],
  ['other', 'Something else'],
] as const;

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to process feedback.');
  return payload;
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export const MarketplaceFeedbackLauncher = () => {
  const pathname = usePathname();
  const projectId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'project' ? parts[1] : '';
  }, [pathname]);

  const [accessToken, setAccessToken] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('review');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadFeedback = async (id: string, token: string) => {
    setLoading(true);
    setError('');
    try {
      const payload = await readJson(
        await fetch(`/api/projects/${encodeURIComponent(id)}/feedback`, {
          headers: { 'x-project-access-token': token },
          cache: 'no-store',
        }),
      );
      const next = payload.feedback as FeedbackState;
      setFeedback(next);
      setRating(next.review?.overallRating ?? 0);
      setReviewText(next.review?.reviewText ?? '');
      setPanel(next.reviewEligible ? 'review' : 'complaint');
    } catch (reason) {
      // The project page itself handles invalid access links. Keep this optional
      // launcher quiet unless the customer opens it.
      setFeedback(null);
      setError(reason instanceof Error ? reason.message : 'Unable to load feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) {
      setAccessToken('');
      setFeedback(null);
      return;
    }

    const token = new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
    setAccessToken(token);
    if (token) void loadFeedback(projectId, token);
  }, [projectId]);

  const submitReview = async () => {
    if (!projectId || !accessToken) return;
    if (rating < 1) {
      setError('Tap a star to rate the completed job.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await readJson(
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({
            type: 'review',
            overallRating: rating,
            reviewText,
          }),
        }),
      );
      setNotice('Your verified job rating has been recorded.');
      await loadFeedback(projectId, accessToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitComplaint = async () => {
    if (!projectId || !accessToken) return;
    if (!complaintCategory) {
      setError('Select the type of problem.');
      return;
    }
    if (complaintDescription.trim().length < 10) {
      setError('Please describe what happened in a little more detail.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await readJson(
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({
            type: 'complaint',
            category: complaintCategory,
            description: complaintDescription,
          }),
        }),
      );
      setNotice('Your support case has been sent for administrator review.');
      setComplaintDescription('');
      await loadFeedback(projectId, accessToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create a support case.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!projectId || !accessToken || loading || !feedback) return null;

  const visible =
    feedback.reviewEligible ||
    feedback.complaintEligible ||
    Boolean(feedback.review) ||
    Boolean(feedback.complaint);
  if (!visible) return null;

  const launcherLabel = feedback.complaint
    ? 'Support case'
    : feedback.review
      ? 'Your feedback'
      : feedback.reviewEligible
        ? 'Rate this job'
        : 'Feedback & support';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError('');
          setNotice('');
        }}
        className="fixed bottom-4 left-1/2 z-[88] flex min-h-13 -translate-x-1/2 items-center gap-2 rounded-full border-2 border-[#D0A629] bg-[#F5C518] px-5 text-sm font-black text-[#172019] shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
      >
        {feedback.reviewEligible ? <Star size={18} /> : <MessageSquareText size={18} />}
        {launcherLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border-2 border-[#6A7768] bg-[#EEF0E5] p-5 text-[#1C261E] shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6B5A16]">Verified job record</p>
                <h2 className="mt-2 text-2xl font-black">How did the job go?</h2>
                <p className="mt-1 text-sm text-[#667064]">{feedback.projectTitle} · {feedback.providerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#AEB7AA] bg-white/70 p-2"
                aria-label="Close feedback"
              >
                <X size={19} />
              </button>
            </div>

            {(feedback.reviewEligible || feedback.complaintEligible) && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#DDE3D6] p-1.5">
                <button
                  type="button"
                  disabled={!feedback.reviewEligible && !feedback.review}
                  onClick={() => { setPanel('review'); setError(''); setNotice(''); }}
                  className={`rounded-xl px-3 py-3 text-xs font-black ${panel === 'review' ? 'bg-[#F5C518] text-black' : 'text-[#59655A] disabled:opacity-35'}`}
                >
                  Rate service
                </button>
                <button
                  type="button"
                  disabled={!feedback.complaintEligible && !feedback.complaint}
                  onClick={() => { setPanel('complaint'); setError(''); setNotice(''); }}
                  className={`rounded-xl px-3 py-3 text-xs font-black ${panel === 'complaint' ? 'bg-[#243228] text-white' : 'text-[#59655A] disabled:opacity-35'}`}
                >
                  Report a problem
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
                <AlertTriangle className="shrink-0" size={18} /> {error}
              </div>
            )}
            {notice && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="shrink-0" size={18} /> {notice}
              </div>
            )}

            {panel === 'review' && (
              <div className="mt-6">
                {!feedback.reviewEligible && !feedback.review ? (
                  <p className="rounded-2xl bg-[#DDE3D6] p-4 text-sm text-[#59655A]">Verified ratings open after the job is marked completed.</p>
                ) : (
                  <>
                    <p className="text-sm font-black">Your overall rating</p>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          type="button"
                          key={value}
                          disabled={!feedback.reviewEligible}
                          onClick={() => setRating(value)}
                          className={`flex aspect-square items-center justify-center rounded-2xl border-2 ${value <= rating ? 'border-[#C89A18] bg-[#F5C518]' : 'border-[#BCC5B8] bg-white/75'} disabled:cursor-not-allowed`}
                          aria-label={`${value} star rating`}
                        >
                          <Star size={24} className={value <= rating ? 'fill-current' : ''} />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-xs font-bold text-[#667064]">{rating ? `${rating} out of 5` : 'Tap a star'}</p>

                    <label className="mt-5 block">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Short comment — optional</span>
                      <textarea
                        value={reviewText}
                        disabled={!feedback.reviewEligible}
                        onChange={(event) => setReviewText(event.target.value)}
                        placeholder="What went well, or what could have been better?"
                        maxLength={2000}
                        className="mt-2 min-h-28 w-full rounded-2xl border-2 border-[#BCC5B8] bg-white p-4 text-sm outline-none focus:border-[#667764] disabled:bg-[#DDE3D6]"
                      />
                    </label>

                    {feedback.reviewEligible && (
                      <button
                        type="button"
                        disabled={submitting || rating < 1}
                        onClick={() => void submitReview()}
                        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#F5C518] font-black text-black shadow-[0_6px_0_#9D7900] disabled:opacity-45"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Star size={18} />}
                        {feedback.review ? 'Update verified rating' : 'Submit verified rating'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {panel === 'complaint' && (
              <div className="mt-6">
                {feedback.complaint ? (
                  <div className="rounded-3xl border-2 border-[#B9C5B5] bg-white/70 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="text-[#8B5A16]" size={24} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Support case</p>
                        <h3 className="font-black">{titleCase(feedback.complaint.status)}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-bold">{titleCase(feedback.complaint.category)}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59655A]">{feedback.complaint.description}</p>
                    <p className="mt-4 rounded-xl bg-[#DDE3D6] p-3 text-xs leading-5 text-[#59655A]">
                      A complaint does not automatically lower a provider&apos;s rating. It is reviewed before any accountability outcome is recorded.
                    </p>
                    {feedback.complaint.resolutionOutcome && (
                      <p className="mt-3 text-xs font-bold text-[#405044]">Outcome: {titleCase(feedback.complaint.resolutionOutcome)}</p>
                    )}
                  </div>
                ) : feedback.complaintEligible ? (
                  <>
                    <p className="text-sm font-black">What went wrong?</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {COMPLAINT_OPTIONS.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setComplaintCategory(value)}
                          className={`min-h-12 rounded-xl border-2 px-3 text-left text-xs font-bold ${complaintCategory === value ? 'border-[#33473A] bg-[#D4DFCE]' : 'border-[#C5CCC1] bg-white/75'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <label className="mt-5 block">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Tell us what happened</span>
                      <textarea
                        value={complaintDescription}
                        onChange={(event) => setComplaintDescription(event.target.value)}
                        placeholder="Include the important facts so the case can be reviewed fairly."
                        maxLength={4000}
                        className="mt-2 min-h-32 w-full rounded-2xl border-2 border-[#BCC5B8] bg-white p-4 text-sm outline-none focus:border-[#667764]"
                      />
                    </label>
                    <p className="mt-3 rounded-xl bg-[#DDE3D6] p-3 text-xs leading-5 text-[#59655A]">
                      Submitting a complaint opens a review case. It does not automatically punish or lower the provider&apos;s rating.
                    </p>
                    <button
                      type="button"
                      disabled={submitting || !complaintCategory || complaintDescription.trim().length < 10}
                      onClick={() => void submitComplaint()}
                      className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#243228] font-black text-white disabled:opacity-45"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                      Send for administrator review
                    </button>
                  </>
                ) : (
                  <p className="rounded-2xl bg-[#DDE3D6] p-4 text-sm text-[#59655A]">Problem reporting becomes available after a provider is selected.</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};
