// transaction.d.ts

export interface Transaction {
    transactionDate: string;    // The date of the transaction
    valueDate: string;          // The value date of the transaction
    referenceNo: string;      // The transaction reference number (e.g., "179FTID242472788")
    description: string;      // A brief description of the transaction (e.g., "outgoing transfer IPN network")
    debit: number;
    credit: number;
    balance: number;
}
