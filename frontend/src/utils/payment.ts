const PAYMENT_METHOD_VI: Record<string, string> = {
  Cash: 'Tiền mặt',
  'Credit Card': 'Thẻ tín dụng',
  'E-Wallet': 'Ví điện tử',
  'Bank Transfer': 'Chuyển khoản',
};

/**
 * Returns a localised label for a payment method string.
 * Falls back to the raw value (or '--') when the method is unknown.
 */
export function formatPaymentMethod(
  method: string | undefined,
  lang: string,
): string {
  if (!method) return '--';
  if (lang === 'vi') return PAYMENT_METHOD_VI[method] ?? method;
  return method;
}
