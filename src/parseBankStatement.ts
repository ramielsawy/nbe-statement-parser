import fs from 'fs';
import pdf from 'pdf-parse';
import { parse } from 'json2csv';
import { Transaction } from './types/transaction';
import { BankStatement } from './types/bankStatement';

const DATE_PATTERN_WITH_SPACES = /(\d{2})-\s*(\w{3,})-(\d{4})/g;
const DATE_PATTERN = /(\d{2}-\w{3,}-\d{4})/g;

interface TransactionAmounts {
    credit: number;
    debit: number;
    balance: number;
}

interface StatementPeriod {
    startDate: string;
    endDate: string;
}

/**
 * 
 * @param filePath path to the  PDF statement file
 * @returns CSV string of the transactions
 */
export async function convertPDFStatementToCSV(filePath: string): Promise<string> {
    const statement = await parseBankStatementPDF(filePath);
    const fields = ['transactionDate', 'valueDate', 'referenceNo', 'description', 'debit', 'credit', 'balance'];
    return parse(statement.transactions, { fields });
}

/**
 * 
 * @param filePath path to the bank statement PDF file
 * @returns BankStatement object which contains the statement information and the transactions
 */
export async function parseBankStatementPDF(filePath: string): Promise<BankStatement> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return parseBankStatementFromPDFText(data.text);
}

/**
 * 
 * @param pdfText text extracted from the PDF
 * @returns BankStatement object which contains the statement information and the transactions
 */
async function parseBankStatementFromPDFText(pdfText: string): Promise<BankStatement> {
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

    const statementInfo: BankStatement = {
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

/**
 * 
 * @param cleanText text extracted from the PDF
 * @param openingBalance opening balance of the account
 * @returns array of transactions
 */
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
        transaction = transaction.replace(DATE_PATTERN_WITH_SPACES, '');

        // Assign the rest of the transaction string to the description
        // TODO: Add reference number extraction
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
 * Converts a date string from DD-MMM-YYYY format to ISO 8601 (YYYY-MM-DD) format.
 * @param dateString - The date string in DD-MMM-YYYY format.
 * @returns The date string in YYYY-MM-DD format.
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
 * Extracts the date and time from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns The date and time of the statement as a Date object.
 * @throws {Error} If the date and time are not found in the statement.
 */
function extractDateTime(cleanText: string): Date {
    const dateTimeMatch = cleanText.match(/as of (\d{2} \w+ \d{4} \d{2}:\d{2}:\d{2} GMT \+\d{4})/);
    if (dateTimeMatch) {
        return new Date(dateTimeMatch[1]);
    }
    throw new Error("Date and time not found in the statement.");
}

/**
 * Extracts the customer name from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns The customer name.
 * @throws {Error} If the customer name is not found in the statement.
 */
function extractCustomerName(cleanText: string): string {
    const customerNameMatch = cleanText.match(/\d{2}:\d{2}:\d{2} GMT \+\d{4}\s+(.*?)\s*:\s*Customer Name/);
    if (customerNameMatch) {
        return customerNameMatch[1].trim();
    }
    throw new Error("Customer name not found in the statement.");
}

/**
 * Extracts the account information from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns An object containing the customer ID and account number.
 * @throws {Error} If the customer ID and account number cannot be extracted.
 */
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

/**
 * Extracts the balance information from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns An object containing the account currency, opening balance, and closing balance.
 * @throws {Error} If the balance information cannot be extracted.
 */
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

/**
 * Extracts the statement period from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns An object containing the start and end dates of the statement period.
 * @throws {Error} If both from and to dates cannot be extracted.
 */
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

/**
 * Extracts individual transactions from the statement text.
 * @param cleanText - The cleaned text of the bank statement.
 * @returns An array of transaction strings.
 */
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

/**
 * Extracts the transaction date and value date from a transaction string.
 * @param transaction - The transaction string.
 * @returns An object containing the transaction date and value date.
 * @throws {Error} If the dates cannot be extracted from the transaction string.
 */
function extractValueAndTransactionDates(transaction: string): { transactionDate: string, valueDate: string } {
    // Normalize the date format to ensure it's in the format DD-MMM-YYYY
    transaction = transaction.replace(DATE_PATTERN_WITH_SPACES, '$1-$2-$3');

    const dates = transaction.match(DATE_PATTERN);

    if (dates && dates.length == 2) {
        return {
            transactionDate: convertToISO8601(dates[0]),
            valueDate: convertToISO8601(dates[1])
        };
    } else {
        throw new Error(`Failed to extract dates from transaction: ${transaction}`);
    }
}

/**
 * Extracts the transaction amounts from a transaction string.
 * @param transaction - The transaction string.
 * @param previousBalance - The balance before this transaction.
 * @returns An object containing the credit, debit, and new balance amounts, or null if extraction fails.
 * @throws {Error} If the transaction amounts cannot be extracted.
 */
function extractTransactionAmounts(transaction: string, previousBalance: number): TransactionAmounts {
    const lastDotIndex = transaction.lastIndexOf('.');
    if (lastDotIndex === -1) {
        throw new Error(`Failed to extract balance amount from transaction: ${transaction}`);
    }

    const secondLastDotIndex = transaction.lastIndexOf('.', lastDotIndex - 1);
    if (secondLastDotIndex === -1) {
        throw new Error(`Failed to extract transaction amount from transaction: ${transaction}`);
    }

    let transactionAmountStart = secondLastDotIndex - 1;
    while (transactionAmountStart >= 0 && /[\d,]/.test(transaction[transactionAmountStart])) {
        transactionAmountStart--;
    }
    // Move back to the first digit or comma
    transactionAmountStart++;

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
