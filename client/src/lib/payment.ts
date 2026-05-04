import type { PaymentMethodType } from '@/schemaValidations/order.schema';

const PAYMENT_METHOD_VI: Record<PaymentMethodType, string> = {
  Cash: 'Tiền mặt',
  'Credit Card': 'Thẻ tín dụng',
  'E-Wallet': 'Ví điện tử',
  'Bank Transfer': 'Chuyển khoản',
};

export function formatPaymentMethod(
  method: string | undefined,
  lang: string,
): string {
  if (!method) return '--';
  if (lang === 'vi') return PAYMENT_METHOD_VI[method as PaymentMethodType] ?? method;
  return method;
}
