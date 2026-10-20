'use client';

import { useState } from 'react';
import { BriefcaseBusiness, Loader2 } from 'lucide-react';

export function ActivateArtisanWorkspace() {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const activate = async () => {
    setError('');
    setWorking(true);
    const response = await fetch('/api/account/roles/artisan', { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setWorking(false);
      setError(result?.error ?? 'Unable to activate the workspace.');
      return;
    }
    window.location.reload();
  };

  return (
    <div>
      <button type="button" onClick={activate} disabled={working}>
        {working ? <Loader2 size={18} /> : <BriefcaseBusiness size={18} />}
        {working ? 'Activating…' : 'Activate Artisan Business Workspace'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
