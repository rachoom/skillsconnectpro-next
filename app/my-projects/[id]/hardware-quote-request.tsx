'use client';

import { useState } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';

export function HardwareQuoteRequestButton({ projectId, defaultArea }: { projectId: string; defaultArea: string }) {
  const [area, setArea] = useState(defaultArea);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const requestQuotes = async () => {
    setError('');
    setWorking(true);
    const response = await fetch('/api/hardware/quote-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId, deliveryArea: area, notes }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setWorking(false);
      setError(result?.error ?? 'Unable to request quotations.');
      return;
    }
    window.location.href = `/hardware-quotations/${result.id}`;
  };

  return (
    <div>
      <label htmlFor="hardware-delivery-area">Delivery area</label>
      <input id="hardware-delivery-area" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Suburb or town" />
      <label htmlFor="hardware-notes">Supplier notes</label>
      <textarea id="hardware-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Brand preferences, delivery notes or alternatives allowed" />
      <button type="button" onClick={requestQuotes} disabled={working || !area.trim()}>
        {working ? <Loader2 size={18} /> : <PackageSearch size={18} />}
        {working ? 'Sending request…' : 'Get hardware quotations'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
