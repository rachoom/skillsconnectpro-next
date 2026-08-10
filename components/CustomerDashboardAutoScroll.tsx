'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type ScrollTarget = {
  key: string;
  container: HTMLElement;
  focusTarget: HTMLElement | null;
};

const normaliseText = (value: string | null | undefined) =>
  String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

function matchingElement(text: string): HTMLElement | null {
  const expected = normaliseText(text);
  const candidates = document.querySelectorAll<HTMLElement>(
    'button, a, h1, h2, h3, p, span, [role="status"], [role="alert"]',
  );

  for (const candidate of candidates) {
    const candidateText = normaliseText(candidate.textContent);
    if (candidateText === expected || candidateText.includes(expected)) return candidate;
  }

  return null;
}

function cardFor(element: HTMLElement): HTMLElement {
  return (
    element.closest<HTMLElement>('section, article, [role="dialog"]') ||
    element.closest<HTMLElement>('div.rounded-3xl, div.rounded-2xl') ||
    element
  );
}

function headingInside(container: HTMLElement): string {
  const heading = container.querySelector<HTMLElement>('h1, h2, h3');
  return normaliseText(heading?.textContent) || 'project-update';
}

function findTarget(): ScrollTarget | null {
  const customerConfirmation = matchingElement('Your confirmation is required');
  if (customerConfirmation) {
    const container = cardFor(customerConfirmation);
    const confirmButton = Array.from(container.querySelectorAll<HTMLElement>('button')).find(
      (button) => normaliseText(button.textContent).includes('confirm job complete'),
    ) ?? null;

    return {
      key: `completion-confirmation:${headingInside(container)}`,
      container,
      focusTarget: confirmButton,
    };
  }

  const confirmConnect = matchingElement('Confirm & connect');
  if (confirmConnect) {
    const container = cardFor(confirmConnect);
    return {
      key: `provider-selected:${headingInside(container)}`,
      container,
      focusTarget: confirmConnect,
    };
  }

  const connected = matchingElement('You are connected');
  if (connected) {
    const container = cardFor(connected);
    const contactAction = container.querySelector<HTMLElement>('a, button');
    return {
      key: `provider-connected:${headingInside(container)}`,
      container,
      focusTarget: contactAction,
    };
  }

  const problemReview = matchingElement('This job needs review');
  if (problemReview) {
    const container = cardFor(problemReview);
    return {
      key: 'job-needs-review',
      container,
      focusTarget: container.querySelector<HTMLElement>('button, a'),
    };
  }

  return null;
}

function scrollToTarget(target: ScrollTarget) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = Math.max(
    0,
    window.scrollY + target.container.getBoundingClientRect().top - 24,
  );

  window.scrollTo({
    top,
    behavior: reducedMotion ? 'auto' : 'smooth',
  });

  window.setTimeout(() => {
    const focusElement = target.focusTarget || target.container;
    if (!focusElement.hasAttribute('tabindex') && focusElement === target.container) {
      focusElement.setAttribute('tabindex', '-1');
    }
    focusElement.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 450);
}

/**
 * Guides customers to the next important action after asynchronous dashboard
 * changes. It intentionally ignores ordinary 15-second data refreshes and only
 * scrolls when a new meaningful state appears.
 */
export const CustomerDashboardAutoScroll = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith('/project/')) return;

    const seenTargets = new Set<string>();
    let frame = 0;
    let timer = 0;

    const initialTarget = findTarget();
    if (initialTarget) seenTargets.add(initialTarget.key);

    const inspect = () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          const target = findTarget();
          if (!target || seenTargets.has(target.key)) return;
          seenTargets.add(target.key);
          scrollToTarget(target);
        }, 120);
      });
    };

    const observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener('customer-dashboard-updated', inspect);

    return () => {
      observer.disconnect();
      window.removeEventListener('customer-dashboard-updated', inspect);
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
};
