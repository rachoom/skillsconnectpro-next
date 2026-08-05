'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SUCCESS_MESSAGES = [
  'your verified job rating has been recorded',
  'your support case has been sent for administrator review',
];

const normalise = (value: string | null | undefined) =>
  String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The feedback form remains available through its launcher, but after a
 * successful submission the modal should get out of the customer's way.
 */
export const FeedbackSubmissionAutoClose = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith('/project/')) return;

    let closeTimer = 0;
    let handledMessage = '';

    const inspect = () => {
      const closeButton = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Close feedback"]',
      );
      if (!closeButton) return;

      const modalText = normalise(closeButton.closest('section')?.textContent);
      const successMessage = SUCCESS_MESSAGES.find((message) => modalText.includes(message));
      if (!successMessage || successMessage === handledMessage) return;

      handledMessage = successMessage;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => closeButton.click(), 900);
    };

    const observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    inspect();

    return () => {
      observer.disconnect();
      window.clearTimeout(closeTimer);
    };
  }, [pathname]);

  return null;
};