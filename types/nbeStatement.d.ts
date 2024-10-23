import { Transaction } from './transaction';

export type NBEStatement = {
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
