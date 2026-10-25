export function normalizeRwandaPhone(value: string): string | null {
  const digits = value.replace(/[\s().-]/g, '').replace(/^\+/, '');
  const normalized = digits.startsWith('0') ? '250' + digits.slice(1) : /^7\d{8}$/.test(digits) ? '250' + digits : digits;
  return /^2507\d{8}$/.test(normalized) ? '+' + normalized : null;
}
