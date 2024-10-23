import fs from 'fs';
import pdf from 'pdf-parse';
import { parse } from 'json2csv';
import { Transaction } from '../types/transaction';
import { NBEStatement } from '../types/nbeStatement';

interface TransactionAmounts {
    credit: number;
    debit: number;
    balance: number;
}

interface StatementPeriod {
    startDate: string;
    endDate: string;
}
export async function convertNBEStatementToCSV(filePath: string): Promise<string> {
    const statement = await parseNBEStatementPDF(filePath);
    const fields = ['transactionDate', 'valueDate', 'referenceNo', 'description', 'debit', 'credit', 'balance'];
    return parse(statement.transactions, { fields });
}

export async function parseNBEStatementPDF(filePath: string): Promise<NBEStatement> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return parseNBEStatementFromPDFText(data.text);
}

async function parseNBEStatementFromPDFText(pdfText: string): Promise<NBEStatement> {
    // Step 1: Remove new lines from the input text
    const cleanText = pdfText.replace(/\n/g, ' ').trim();

    // Step 2: Extract the date and time
    const dateTime = extractDateTime(cleanText);

    // Step 3: Extract the customer name
    const customerName = extractCustomerName(cleanText);

    // Step 4: Extract the account information
    const accountInfo = extractAccountInfo(cleanText);

    // Step 5: Extract the balance information
    const balanceInfo = extractBalanceInfo(cleanText);

    // Step 6: Extract the start and end dates of the statement period
    const statementPeriod = extractStatementPeriod(cleanText);

    // Step 7: Extract transactions
    const transactions = await parseTransactionsFromPDFText(cleanText, balanceInfo.openingBalance);

    const statementInfo: NBEStatement = {
        dateTime: dateTime,
        customerId: accountInfo.customerId,
        customerName: customerName,
        accountNumber: accountInfo.accountNumber,
        accountCurrency: balanceInfo.accountCurrency,
        openingBalance: balanceInfo.openingBalance,
        closingBalance: balanceInfo.closingBalance,
        fromDate: statementPeriod.startDate,
        toDate: statementPeriod.endDate,
        transactions: transactions
    };

    console.log(statementInfo);

    return statementInfo;
}

async function parseTransactionsFromPDFText(cleanText: string, openingBalance: number): Promise<Transaction[]> {
    // Step 1: Remove all new lines from the input text
    cleanText = cleanText.replace(/\n/g, ' ').trim();

    // Step 2: Remove everything before the first occurrence of "Transaction Date"
    cleanText = cleanText.substring(cleanText.indexOf("Transaction Date"));

    // Step 3: Remove page numbers (2 characters before "Transaction Date")
    cleanText = cleanText.replace(/(.{2})(?=.{2}Transaction Date)/g, '');

    // Step 4: Remove header rows
    cleanText = cleanText.replace(/Transaction Date.*?Balance/g, '');

    // Step 5: Split transactions based on date patterns
    let transactions: string[] = extractTransactions(cleanText);

    const bankTransactions: Transaction[] = [];

    // Reverse the transactions array and then map over it so that the opening balance is used when identifying if the transaction is a debit or credit
    let balance = openingBalance;
    transactions.reverse().forEach(transaction => {

        // Extract the value date and transaction date
        const valueAndTransactionDates = extractValueAndTransactionDates(transaction);

        // Extract the transaction amounts
        const amounts = extractTransactionAmounts(transaction, balance);


        // Remove the amounts from the transaction string
        transaction = transaction.replace(/[\d,]+(\.\d{2})/g, '').trim();

        // remove the transaction date and value date from the transaction string
        transaction = transaction.replace(/(\d{2}-\w{3,}-\d{4})/g, '').trim();

        // Assign the rest of the transaction string to the description
        const description = transaction;

        // Update the current balance
        balance = amounts.balance;

        const bankTransaction: Transaction = {
            transactionDate: valueAndTransactionDates.transactionDate,
            valueDate: valueAndTransactionDates.valueDate,
            referenceNo: '',
            description: description,
            debit: amounts.debit,
            credit: amounts.credit,
            balance: amounts.balance
        };

        bankTransactions.push(bankTransaction);
    });

    return bankTransactions;
}

/**
 * 
 * @param dateString string in the format DD-MMM-YYYY
 * @returns string in the format YYYY-MM-DD
 */
function convertToISO8601(dateString: string): string {
    // Split the input string into day, month, and year
    const [day, month, year] = dateString.split('-');

    // Map month strings to month numbers (1-indexed for ISO format)
    const monthMap: { [key: string]: string } = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    // Convert the day to 2 digits and map the month
    const monthNumber = monthMap[month];
    const dayPadded = day.padStart(2, '0'); // Ensures the day is 2 digits (e.g., '09' for 9)

    // Return the date in ISO 8601 format (YYYY-MM-DD)
    return `${year}-${monthNumber}-${dayPadded}`;
}

/**
 * 
 * @param cleanText statement text
 * @returns date and time of the statement
 */
function extractDateTime(cleanText: string): Date {
    const dateTimeMatch = cleanText.match(/as of (\d{2} \w+ \d{4} \d{2}:\d{2}:\d{2} GMT \+\d{4})/);
    if (dateTimeMatch) {
        return new Date(dateTimeMatch[1]);
    }
    throw new Error("Date and time not found in the statement.");
}

/**
 * 
 * @param cleanText statement text
 * @returns customer name
 */
function extractCustomerName(cleanText: string): string {
    const customerNameMatch = cleanText.match(/\d{2}:\d{2}:\d{2} GMT \+\d{4}\s+(.*?)\s*:\s*Customer Name/);
    if (customerNameMatch) {
        return customerNameMatch[1].trim();
    }
    throw new Error("Customer name not found in the statement.");
}

function extractAccountInfo(cleanText: string): { customerId: string; accountNumber: string } {
    const accountInfoMatch = cleanText.match(/To Date.*?(\d+).*?(\d{19})\s*(EGP|USD|EUR|GBP)/);
    if (accountInfoMatch) {
        return {
            customerId: accountInfoMatch[1],
            accountNumber: accountInfoMatch[2]
        };
    }
    throw new Error("Could not extract customer ID and account number.");
}

function extractBalanceInfo(cleanText: string): { accountCurrency: string; openingBalance: number; closingBalance: number } {
    const balanceMatch = cleanText.match(/Opening Balance.*?(\w{3})([\d,]+\.\d{2})([\d,]+\.\d{2})/);
    if (balanceMatch) {
        return {
            accountCurrency: balanceMatch[1],
            openingBalance: parseFloat(balanceMatch[2].replace(/,/g, '')),
            closingBalance: parseFloat(balanceMatch[3].replace(/,/g, ''))
        };
    }
    throw new Error("Could not extract balance information.");
}

function extractStatementPeriod(cleanText: string): StatementPeriod {
    const datePattern = /(\d{1,2}-\s*[A-Za-z]+\s*-\s*\d{4})/g;
    const dates = cleanText.match(datePattern);

    if (dates && dates.length >= 2) {
        return {
            startDate: convertToISO8601(dates[0].replace(/\s+/g, '')),
            endDate: convertToISO8601(dates[1].replace(/\s+/g, ''))
        };
    }
    throw new Error("Could not extract both from and to dates.");
}

function extractTransactions(cleanText: string): string[] {
    const transactionRegex = /(\d{2}-\s?\w{3,}-\d{4})\s*(\d{2}-\s?\w{3,}-\d{4}|\d{2}-\w+-\d{4})/g;
    let match;
    let transactions: string[] = [];
    let lastIndex = 0;

    while ((match = transactionRegex.exec(cleanText)) !== null) {
        const transactionLine = cleanText.slice(lastIndex, match.index).trim();
        if (transactionLine) {
            transactions.push(transactionLine);
        }
        lastIndex = match.index;
    }

    // Add the last transaction
    const lastTransaction = cleanText.slice(lastIndex).trim();
    if (lastTransaction) {
        transactions.push(lastTransaction);
    }

    return transactions;
}

function extractValueAndTransactionDates(transaction: string): { transactionDate: string, valueDate: string } {
    // Normalize the date format to ensure it's in the format DD-MMM-YYYY
    transaction = transaction.replace(/(\d{2})-\s*(\w{3,})-(\d{4})/g, '$1-$2-$3');

    const dateRegex = /(\d{2}-\w{3,}-\d{4})/g;
    const dates = transaction.match(dateRegex);

    if (dates && dates.length == 2) {
        return {
            transactionDate: convertToISO8601(dates[0]),
            valueDate: convertToISO8601(dates[1])
        };
    } else {
        throw new Error(`Failed to extract dates from transaction: ${transaction}`);
    }
}

function extractTransactionAmounts(transaction: string, previousBalance: number): TransactionAmounts | null {
    const lastDotIndex = transaction.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const secondLastDotIndex = transaction.lastIndexOf('.', lastDotIndex - 1);
    if (secondLastDotIndex === -1) return null;

    let transactionAmountStart = secondLastDotIndex - 1;
    while (transactionAmountStart >= 0 && /[\d,]/.test(transaction[transactionAmountStart])) {
        transactionAmountStart--;
    }
    transactionAmountStart++; // Move back to the first digit or comma

    const transactionAmount = transaction.substring(transactionAmountStart, secondLastDotIndex + 3);
    const balanceAmount = transaction.substring(secondLastDotIndex + 3);

    // Parse the amounts as numbers
    const parsedTransactionAmount = parseFloat(transactionAmount.replace(/,/g, ''));
    const balance = parseFloat(balanceAmount.replace(/,/g, ''));

    if (isNaN(parsedTransactionAmount) || isNaN(balance)) {
        throw new Error(`Failed to extract transaction amounts from transaction: ${transaction}`);
    }

    // Determine if it's a debit or credit transaction
    let credit = 0;
    let debit = 0;

    if (balance < previousBalance) {
        debit = parsedTransactionAmount;
    } else if (balance > previousBalance) {
        credit = parsedTransactionAmount;
    }

    return { credit, debit, balance };
}

