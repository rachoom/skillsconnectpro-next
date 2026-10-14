import { createHash } from 'node:crypto';

export type PayfastMode = 'sandbox' | 'live';
export type PayfastFieldValue = string | number | boolean | undefined | null;
export type PayfastFields = Record<string, string>;

const LIVE_PROCESS_URL = 'https://www.payfast.co.za/eng/process';
const SANDBOX_PROCESS_URL = 'https://sandbox.payfast.co.za/eng/process';
const LIVE_VALIDATE_URL = 'https://www.payfast.co.za/eng/query/validate';
const SANDBOX_VALIDATE_URL = 'https://sandbox.payfast.co.za/eng/query/validate';

export function getPayfastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();
  const passphrase = process.env.PAYFAST_PASSPHRASE?.trim();
  if (!merchantId || !merchantKey || !passphrase) {
    throw new Error('Payfast is not configured yet. Add the merchant ID, merchant key and passphrase as server-side environment variables.');
  }
  if (!/^[A-Za-z0-9_\-/]{1,32}$/.test(passphrase)) {
    throw new Error('PAYFAST_PASSPHRASE must match the Payfast Dashboard passphrase and use only letters, numbers, hyphen, underscore or slash.');
  }
  const mode: PayfastMode = process.env.PAYFAST_MODE === 'live' ? 'live' : 'sandbox';
  return {
    merchantId, merchantKey, passphrase, mode,
    processUrl: mode === 'live' ? LIVE_PROCESS_URL : SANDBOX_PROCESS_URL,
    validateUrl: mode === 'live' ? LIVE_VALIDATE_URL : SANDBOX_VALIDATE_URL,
  };
}

function formEncode(value: string): string {
  return new URLSearchParams({ value: value.trim() }).toString().slice('value='.length);
}

/** Payfast signs fields in form insertion order, not alphabetical API order. */
export function payfastParamString(fields: Record<string, PayfastFieldValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    const normalisedValue = value === undefined || value === null ? '' : String(value).trim();
    if (!normalisedValue) continue;
    params.append(key, normalisedValue);
  }
  return params.toString();
}

export function payfastSignature(fields: Record<string, PayfastFieldValue>, passphrase: string): string {
  const parameterString = payfastParamString(fields);
  const salt = `passphrase=${formEncode(passphrase)}`;
  return createHash('md5').update(parameterString ? `${parameterString}&${salt}` : salt).digest('hex');
}

export function secureEqualHex(left: string | null | undefined, right: string): boolean {
  if (!left || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export function normalisePayfastFields(fields: Record<string, PayfastFieldValue>): PayfastFields {
  return Object.fromEntries(Object.entries(fields)
    .map(([key, value]) => [key, value === undefined || value === null ? '' : String(value).trim()])
    .filter(([, value]) => value !== ''));
}
