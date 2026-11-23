export type AccountType = 'bank' | 'cash' | 'upi' | 'card' | 'wallet';
export type TxType = 'income' | 'expense' | 'transfer';
export type CategoryKind = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  color: string;
  archived: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
}

export interface Recurring {
  id: string;
  title: string;
  type: CategoryKind;
  amount: number;
  account_id: string;
  category_id: string | null;
  frequency: Frequency;
  next_date: string;
  auto_add: boolean;
  remind: boolean;
  active: boolean;
}

export interface Loan {
  id: string;
  person: string;
  direction: 'lent' | 'borrowed';
  amount: number;
  date: string;
  due_date: string | null;
  note: string;
  settled: boolean;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  date: string;
  note: string;
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'bank', label: 'Bank', icon: 'bank' },
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'upi', label: 'UPI', icon: 'cellphone' },
  { value: 'card', label: 'Credit card', icon: 'credit-card' },
  { value: 'wallet', label: 'Wallet', icon: 'wallet' },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salary', kind: 'income', icon: 'briefcase', color: '#10B981' },
  { name: 'Business', kind: 'income', icon: 'store', color: '#14B8A6' },
  { name: 'Interest', kind: 'income', icon: 'percent', color: '#22C55E' },
  { name: 'Gift', kind: 'income', icon: 'gift', color: '#84CC16' },
  { name: 'Other income', kind: 'income', icon: 'plus-circle', color: '#0EA5E9' },
  { name: 'Food & Groceries', kind: 'expense', icon: 'food', color: '#F97316' },
  { name: 'Rent', kind: 'expense', icon: 'home', color: '#EF4444' },
  { name: 'Bills & Utilities', kind: 'expense', icon: 'flash', color: '#EAB308' },
  { name: 'Fuel & Transport', kind: 'expense', icon: 'gas-station', color: '#8B5CF6' },
  { name: 'Shopping', kind: 'expense', icon: 'shopping', color: '#EC4899' },
  { name: 'Medical', kind: 'expense', icon: 'medical-bag', color: '#DC2626' },
  { name: 'Education', kind: 'expense', icon: 'school', color: '#3B82F6' },
  { name: 'EMI & Loans', kind: 'expense', icon: 'bank-transfer', color: '#6366F1' },
  { name: 'Entertainment', kind: 'expense', icon: 'movie', color: '#D946EF' },
  { name: 'Other expense', kind: 'expense', icon: 'dots-horizontal', color: '#64748B' },
];
