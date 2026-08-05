'use client';

import { useEffect } from 'react';

const HEADING = 'What do you need done?';
const INTRO = 'Tell us in your own words. We’ll turn it into a clear project request and ask only the questions that matter.';
const FIELD_LABEL = 'Describe the job';

function applyCopy() {
  const openingSection = document.querySelector<HTMLElement>(
    "body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']",
  );
  if (!openingSection) return;

  const heading = openingSection.querySelector<HTMLHeadingElement>('h1');
  if (heading && heading.textContent !== HEADING) heading.textContent = HEADING;

  const intro = openingSection.querySelector<HTMLParagraphElement>('div:first-child > p');
  if (intro && intro.textContent !== INTRO) intro.textContent = INTRO;

  const label = openingSection.querySelector<HTMLElement>('div:nth-child(2) label > span');
  if (label && label.textContent !== FIELD_LABEL) label.textContent = FIELD_LABEL;
}

export const IntakeCopyPolish = () => {
  useEffect(() => {
    applyCopy();
    const observer = new MutationObserver(applyCopy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};
