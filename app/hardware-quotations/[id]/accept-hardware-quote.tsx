'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export function AcceptHardwareQuoteButton({ quoteId }: { quoteId: string }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setWorking(true);
    setError('');
    const response = await fetch(`/api/hardware/quotes/${quoteId}/accept`, { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setWorking(false);
      setError(result?.error ?? 'Unable to select quotation.');
      return;
    }
    window.location.reload();
  };

  return (
    <div>
      <button type="button" onClick={accept} disabled={working}>
        {working ? <Loader2 size={16} /> : <Check size={16} />} {working ? 'Selecting…' : 'Select quote'}
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
