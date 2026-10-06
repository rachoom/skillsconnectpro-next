'use client';
import { useState } from 'react';
export default function ResponsiveAudit() {
  const [width, setWidth] = useState(360);
  const [route, setRoute] = useState('/');
  return <main style={{ padding: 16, background: '#eee', color: '#111', minHeight: '100vh' }}>
    <h1>Responsive verification</h1>
    <label>Width <select aria-label="Width" value={width} onChange={event => setWidth(Number(event.target.value))}>
      {[320,360,390,430,768,1024].map(value => <option key={value}>{value}</option>)}
    </select></label>{' '}
    <label>Page <select aria-label="Page" value={route} onChange={event => setRoute(event.target.value)}>
      {['/','/get-help','/browse-providers','/join','/admin-dashboard'].map(value => <option key={value}>{value}</option>)}
    </select></label>
    <iframe title="Site under test" src={route} style={{ display: 'block', width, height: 950, border: '1px solid #888', marginTop: 12 }} />
  </main>;
}
