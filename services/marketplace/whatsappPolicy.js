export function normaliseWhatsAppRecipient(phone, defaultCountryCode = '27') {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `${defaultCountryCode}${digits.slice(1)}`;
  return digits;
}

export function isPlausibleWhatsAppRecipient(phone) {
  const digits = normaliseWhatsAppRecipient(phone);
  return digits.length >= 10 && digits.length <= 15;
}
