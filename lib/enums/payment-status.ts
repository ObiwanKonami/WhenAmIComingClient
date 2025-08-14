export type PaymentStatusNum = 0 | 1 | 2 | 3 | 4;
export type PaymentStatusLabel = 'Paid' | 'Pending' | 'Cancelled' | 'Refunded' | 'Failed';

export const PAYMENT_STATUS_NUM: Record<PaymentStatusLabel, PaymentStatusNum> = {
  Pending: 0,
  Paid:    1,
  Failed:  2,
  Cancelled: 3,
  Refunded:  4,
};

// Tersten label’a ihtiyaç olursa:
export const PAYMENT_STATUS_LABEL: Record<PaymentStatusNum, PaymentStatusLabel> = {
  0: 'Pending',
  1: 'Paid',
  2: 'Failed',
  3: 'Cancelled',
  4: 'Refunded',
};
