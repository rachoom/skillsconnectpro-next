'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function setControlledTextareaValue(element: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

const normalise = (value: string | null | undefined) =>
  String(value || '').replace(/\s+/g, ' ').trim();

/**
 * Bridges homepage/provider discovery routes into the guided intake without
 * duplicating the intake engine. It also routes assessment calls through the
 * current primary-service taxonomy so Mechanics is treated as a first-class
 * category while legacy Building/Carpentry requests fall back safely to the
 * General Contractor lane.
 */
export const ProjectIntakeEntryBridge = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const service = normalise(searchParams.get('service'));
    const providerName = normalise(searchParams.get('providerName'));
    const providerId = Number(searchParams.get('providerId'));
    const mode = normalise(searchParams.get('mode')).toLowerCase();

    let attempts = 0;
    const applyEntryContext = () => {
      const description = document.getElementById('job-description');
      if (!(description instanceof HTMLTextAreaElement)) return false;

      if (!description.value.trim()) {
        const parts = [
          providerName ? `I would like ${providerName} to be invited to respond to this job.` : '',
          service ? `I need help with ${service.toLowerCase()}.` : '',
        ].filter(Boolean);
        if (parts.length) setControlledTextareaValue(description, `${parts.join(' ')} `);
      }

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
      const preferredButton = mode === 'photo'
        ? buttons.find((button) => button.textContent?.toLowerCase().includes('add a photograph'))
        : mode === 'voice'
          ? buttons.find((button) => button.textContent?.toLowerCase().includes('speak instead'))
          : null;

      const target = preferredButton || description;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => target.focus({ preventScroll: true }), 450);
      if (preferredButton) {
        preferredButton.dataset.entryRecommended = 'true';
        window.setTimeout(() => delete preferredButton.dataset.entryRecommended, 5000);
      }
      return true;
    };

    const timer = window.setInterval(() => {
      attempts += 1;
      if (applyEntryContext() || attempts > 30) window.clearInterval(timer);
    }, 120);

    const originalFetch = window.fetch.bind(window);
    const bridgedFetch: typeof window.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/api/project-intake/assess-v2')) {
        return originalFetch(url.replace('/api/project-intake/assess-v2', '/api/project-intake/assess-v3'), init);
      }

      if (
        url.includes('/api/project-intake/assess')
        && !url.includes('/api/project-intake/assess-v3')
      ) {
        return originalFetch(url.replace('/api/project-intake/assess', '/api/project-intake/assess-v3'), init);
      }

      if (
        Number.isInteger(providerId)
        && providerId > 0
        && url.includes('/api/projects/intake')
        && typeof init?.body === 'string'
      ) {
        try {
          const payload = JSON.parse(init.body) as Record<string, unknown>;
          return originalFetch(input, {
            ...init,
            body: JSON.stringify({
              ...payload,
              preferredProviderId: providerId,
              preferredProviderName: providerName || null,
            }),
          });
        } catch {
          // Leave the original request untouched if the body is not JSON.
        }
      }

      return originalFetch(input, init);
    };

    window.fetch = bridgedFetch;
    return () => {
      window.clearInterval(timer);
      if (window.fetch === bridgedFetch) window.fetch = originalFetch;
    };
  }, [searchParams]);

  return null;
};
