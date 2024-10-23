import { Transaction } from './transaction';

export type NBEStatement = {
  dateTime: Date;
  customerId: string;
  customerName: string;
  accountNumber: string;
  accountCurrency: string;
  openingBalance: number;
  closingBalance: number;
  statementFromDate: string;
  statementToDate: string;
  transactions: Transaction[];
};
