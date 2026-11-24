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

export const ProjectIntakeEntryBridge = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const service = normalise(searchParams.get('service'));
    const providerName = normalise(searchParams.get('providerName'));
    const providerId = Number(searchParams.get('providerId'));
    const mode = normalise(searchParams.get('mode')).toLowerCase();
    const galleryMode = mode === 'gallery';
    const descriptionPrefill = normalise(searchParams.get('description'));

    let attempts = 0;
    const applyEntryContext = () => {
      const description = document.getElementById('job-description');
      if (!(description instanceof HTMLTextAreaElement)) return false;

      // Connect mode is hydrated by ProjectIntakeV2 from the saved estimate context.
      // Do not append a second service sentence or overwrite the imported brief here.
      if (mode !== 'connect' && !description.value.trim()) {
        const parts = [
          descriptionPrefill,
          providerName ? `I would like ${providerName} to be invited to respond to this job.` : '',
          service ? `Service requested: ${service}.` : '',
        ].filter(Boolean);
        if (parts.length) setControlledTextareaValue(description, `${parts.join(' ')} `);
      }

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-intake-composer-tools] button'));
      const cameraButton = document.querySelector<HTMLButtonElement>('[data-intake-photo-action="camera"]')
        || buttons.find((button) => button.textContent?.toLowerCase().includes('take photo'));
      const galleryButton = document.querySelector<HTMLButtonElement>('[data-intake-photo-action="gallery"]')
        || buttons.find((button) => button.textContent?.toLowerCase().includes('choose photo'));
      const preferredButton = galleryMode
        ? galleryButton
        : mode === 'photo'
          ? cameraButton
          : mode === 'voice'
            ? buttons.find((button) => button.textContent?.toLowerCase().includes('voice'))
            : null;

      // Keep a plain visit calm: do not open the keyboard or jump past the heading.
      if (!mode && !descriptionPrefill && !service && !providerName) return true;
      const target = preferredButton || description;
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      window.setTimeout(() => target.focus({ preventScroll: true }), 450);
      if (preferredButton) {
        preferredButton.dataset.entryRecommended = 'true';
        window.setTimeout(() => delete preferredButton.dataset.entryRecommended, 5000);
      }
      return true;
    };

    // A normal campaign visit needs no DOM polling or focus manipulation.
    // Keep the fetch bridge below active for all visits, including plain URLs.
    let timer: number | undefined;
    if (mode || descriptionPrefill || service || providerName) {
      timer = window.setInterval(() => {
        attempts += 1;
        if (applyEntryContext() || attempts > 30) window.clearInterval(timer);
      }, 120);
    }

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
