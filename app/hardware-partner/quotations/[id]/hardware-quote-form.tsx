'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/services/supabase/client';
import styles from '../../../my-projects/workspace.module.css';

type Item = { id: string; description: string; quantity: number | null; unit: string | null; notes: string | null };
type LineState = { requestItemId: string; description: string; quantity: string; unit: string; brand: string; unitPrice: string; stockStatus: string; notes: string };

export function HardwareQuoteForm({
  requestId,
  partnerId,
  userId,
  items,
  existingQuoteId,
  existingDeliveryFee,
  existingNotes,
}: {
  requestId: string;
  partnerId: string;
  userId: string;
  items: Item[];
  existingQuoteId: string | null;
  existingDeliveryFee: number;
  existingNotes: string;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [lines, setLines] = useState<LineState[]>(items.map((item) => ({
    requestItemId: item.id,
    description: item.description,
    quantity: String(item.quantity ?? 1),
    unit: item.unit ?? 'item',
    brand: '',
    unitPrice: '',
    stockStatus: 'available',
    notes: item.notes ?? '',
  })));
  const [deliveryFee, setDeliveryFee] = useState(String(existingDeliveryFee || 0));
  const [notes, setNotes] = useState(existingNotes);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity || 0);
    const unit = Number(line.unitPrice || 0);
    return sum + (Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : 0);
  }, 0);
  const delivery = Number(deliveryFee || 0);
  const total = subtotal + (Number.isFinite(delivery) ? delivery : 0);

  const update = (index: number, patch: Partial<LineState>) => {
    setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  };

  const submit = async () => {
    setMessage('');
    if (lines.some((line) => !line.description.trim() || Number(line.quantity) <= 0 || Number(line.unitPrice) < 0)) {
      setMessage('Check each quantity and unit price before submitting.');
      return;
    }
    setWorking(true);

    const quotePayload = {
      request_id: requestId,
      partner_id: partnerId,
      submitted_by: userId,
      status: 'submitted',
      subtotal,
      delivery_fee: delivery,
      total,
      notes: notes.trim() || null,
    };

    const quoteResult = existingQuoteId
      ? await supabase.from('supplier_quotes').update(quotePayload).eq('id', existingQuoteId).select('id').single()
      : await supabase.from('supplier_quotes').insert(quotePayload).select('id').single();

    if (quoteResult.error || !quoteResult.data) {
      setWorking(false);
      setMessage(quoteResult.error?.message ?? 'Unable to save quotation.');
      return;
    }

    const quoteId = quoteResult.data.id;
    await supabase.from('supplier_quote_items').delete().eq('quote_id', quoteId);
    const { error: itemError } = await supabase.from('supplier_quote_items').insert(lines.map((line) => ({
      quote_id: quoteId,
      request_item_id: line.requestItemId,
      description: line.description.trim(),
      brand: line.brand.trim() || null,
      quantity: Number(line.quantity),
      unit: line.unit || null,
      unit_price: Number(line.unitPrice || 0),
      line_total: Number(line.quantity) * Number(line.unitPrice || 0),
      stock_status: line.stockStatus,
      notes: line.notes.trim() || null,
    })));

    if (itemError) {
      setWorking(false);
      setMessage(itemError.message);
      return;
    }

    await supabase.from('hardware_quote_invitations').update({
      status: 'quoted',
      responded_at: new Date().toISOString(),
    }).eq('request_id', requestId).eq('partner_id', partnerId);

    setWorking(false);
    setMessage('Quotation submitted successfully.');
    window.setTimeout(() => window.location.reload(), 700);
  };

  return (
    <div>
      <div className={styles.list}>
        {lines.map((line, index) => (
          <div key={line.requestItemId} className={styles.panel} style={{ marginBottom: 14 }}>
            <strong>{line.description}</strong>
            <small>{items[index]?.notes || 'Price the requested specification or note an alternative.'}</small>
            <div className={styles.form} style={{ marginTop: 14 }}>
              <div className={styles.formGrid}>
                <input className={styles.input} type="number" min="0.001" step="0.001" value={line.quantity} onChange={(e) => update(index, { quantity: e.target.value })} placeholder="Quantity" />
                <input className={styles.input} value={line.unit} onChange={(e) => update(index, { unit: e.target.value })} placeholder="Unit" />
              </div>
              <input className={styles.input} value={line.brand} onChange={(e) => update(index, { brand: e.target.value })} placeholder="Brand / product (optional)" />
              <input className={styles.input} type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => update(index, { unitPrice: e.target.value })} placeholder="Unit price (R)" />
              <select className={styles.input} value={line.stockStatus} onChange={(e) => update(index, { stockStatus: e.target.value })}>
                <option value="available">Available</option><option value="limited">Limited stock</option><option value="order_in">Order in</option><option value="unavailable">Unavailable</option>
              </select>
              <input className={styles.input} value={line.notes} onChange={(e) => update(index, { notes: e.target.value })} placeholder="Line note / alternative" />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.sidePanel} style={{ marginTop: 20 }}>
        <label>Delivery fee</label><input className={styles.input} type="number" min="0" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
        <label>Quotation note</label><textarea className={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Availability, lead time, collection or delivery terms" />
        <h2>Total: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(total)}</h2>
        <button className={styles.action} type="button" onClick={submit} disabled={working}>{working ? <Loader2 size={17} /> : <CheckCircle2 size={17} />} {working ? 'Submitting…' : 'Submit quotation'}</button>
        {message && <p className={styles.subtle} role="status">{message}</p>}
      </div>
    </div>
  );
}
