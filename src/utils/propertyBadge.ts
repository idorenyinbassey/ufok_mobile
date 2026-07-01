export interface TransactionBadge {
  label: string;
  color: string;
}

const COLORS: Record<string, string> = {
  rent: '#2563eb',
  lease: '#f97316',
  sale: '#16a34a',
  shortlet: '#9333ea',
};

export function transactionBadge(transactionType?: string | null): TransactionBadge {
  return {
    label: transactionType ?? '',
    color: transactionType ? (COLORS[transactionType] ?? '#6b7280') : '#6b7280',
  };
}
