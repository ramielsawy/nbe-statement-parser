import { Transaction } from './transaction';

export type BankStatement = {
  dateTime: Date;
  customerId: string;
  customerName: string;
  accountNumber: string;
  accountCurrency: string;
  openingBalance: number;
  closingBalance: number;
  fromDate: string;
  toDate: string;
  transactions: Transaction[];
};
