import fs from 'fs';
import pdf from 'pdf-parse';
import { parse } from 'json2csv';
import { Transaction } from '../types/transaction';
import { NBEStatement } from '../types/nbeStatement';
import { InvalidPDFFormatError } from './errors';

async function parseNBEStatementFromPDFText(pdfText: string): Promise<NBEStatement> {

    // Step 1: Remove all new lines from the input text
    let cleanText = pdfText.replace(/\n/g, ' ').trim();

    console.log(cleanText);
    // Extract statement information
    const statementInfo: NBEStatement = {
        dateTime: new Date(),
        customerId: '',
        customerName: '',
        accountNumber: '',
        accountCurrency: '',
        openingBalance: 0,
        closingBalance: 0,
        fromDate: '',
        toDate: '',
        transactions: []
    };

    // Extract date and time
    const dateTimeMatch = cleanText.match(/as of (\d{2} \w+ \d{4} \d{2}:\d{2}:\d{2} GMT \+\d{4})/);
    if (dateTimeMatch) {
        statementInfo.dateTime = new Date(dateTimeMatch[1]);
    }

    // Extract customer name
    const customerNameMatch = cleanText.match(/\d{2}:\d{2}:\d{2} GMT \+\d{4}\s+(.*?)\s*:\s*Customer Name/);
    if (customerNameMatch) {
        statementInfo.customerName = customerNameMatch[1].trim();
    } else {
        console.warn("Customer name not found in the statement.");
    }

    // Extract account number (19 digits before the currency) and customer ID
    const accountInfoMatch = cleanText.match(/To Date.*?(\d+).*?(\d{19})\s*(?:EGP|USD|EUR|GBP)/);
    if (accountInfoMatch) {
        statementInfo.customerId = accountInfoMatch[1];
        statementInfo.accountNumber = accountInfoMatch[2];
    } else {
        console.warn("Could not extract customer ID and account number.");
    }

    // Extract currency, opening balance, and closing balance
    const balanceMatch = cleanText.match(/Opening Balance.*?(\w{3})([\d,]+\.\d{2})([\d,]+\.\d{2})/);
    if (balanceMatch) {
        statementInfo.accountCurrency = balanceMatch[1];
        statementInfo.openingBalance = parseFloat(balanceMatch[2].replace(/,/g, ''));
        statementInfo.closingBalance = parseFloat(balanceMatch[3].replace(/,/g, ''));
    }

    // Extract from date and to date
    const datePattern = /(\d{1,2}-\s*[A-Za-z]+\s*-\s*\d{4})/g;
    const dates = cleanText.match(datePattern);

    if (dates && dates.length >= 2) {
        statementInfo.fromDate = convertToISO8601(dates[0].replace(/\s+/g, ''));
        statementInfo.toDate = convertToISO8601(dates[1].replace(/\s+/g, ''));
    } else {
        console.warn("Could not extract both from and to dates.");
    }

    // Log extracted dates for debugging
    console.log("Extracted from date:", statementInfo.fromDate);
    console.log("Extracted to date:", statementInfo.toDate);

    console.log(statementInfo);
    // Extract transactions (using the existing logic)
    statementInfo.transactions = await parseTransactionsFromPDFText(cleanText, statementInfo.openingBalance);

    return statementInfo;
}

async function parseTransactionsFromPDFText(cleanText: string, balance: number): Promise<Transaction[]> {
    // Step 1: Remove all new lines from the input text
    cleanText = cleanText.replace(/\n/g, ' ').trim();

    // Step 2: Remove everything before the first occurrence of "Transaction Date"
    cleanText = cleanText.substring(cleanText.indexOf("Transaction Date"));

    // Step 3: Remove page numbers (2 characters before "Transaction Date")
    cleanText = cleanText.replace(/(.{2})(?=.{2}Transaction Date)/g, '');

    // Step 4: Remove header rows
    cleanText = cleanText.replace(/Transaction Date.*?Balance/g, '');

    // Step 5: Split transactions based on date patterns
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


    const bankTransactions: Transaction[] = [];

    // Reverse the transactions array and then map over it
    transactions.reverse().forEach(transaction => {
        // Initialize bankTransaction with all required properties
        let bankTransaction: Transaction = {
            transactionDate: '',
            valueDate: '',
            referenceNo: '',
            description: '',
            debit: 0,
            credit: 0,
            balance: 0
        };

        // Normalize date formats by removing extra spaces and ensuring correct format
        transaction = transaction.replace(/(\d{2})-\s*(\w{3,})-(\d{4})/g, '$1-$2-$3');
        setTimeout(() => {

        }, 1000);
        // Extract the two dates
        const dateRegex = /(\d{2}-\w{3,}-\d{4})/g;
        const dates = transaction.match(dateRegex);

        if (dates && dates.length == 2) {
            bankTransaction.transactionDate = convertToISO8601(dates[0]);
            bankTransaction.valueDate = convertToISO8601(dates[1]);

            // Remove the extracted dates from the transaction string
            transaction = transaction.replace(dateRegex, '').trim();
        } else {
            console.error('Failed to extract dates from transaction:', transaction);
        }

        const lastDotIndex = transaction.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            const secondLastDotIndex = transaction.lastIndexOf('.', lastDotIndex - 1);

            if (secondLastDotIndex !== -1) {
                let transactionAmountStart = secondLastDotIndex - 1;
                while (transactionAmountStart >= 0 && /[\d,]/.test(transaction[transactionAmountStart])) {
                    transactionAmountStart--;
                }
                transactionAmountStart++; // Move back to the first digit or comma

                const transactionAmount = transaction.substring(transactionAmountStart, secondLastDotIndex + 3);
                const balanceAmount = transaction.substring(secondLastDotIndex + 3);

                // Parse the amounts as numbers
                const parsedTransactionAmount = parseFloat(transactionAmount.replace(/,/g, ''));
                bankTransaction.balance = parseFloat(balanceAmount.replace(/,/g, ''));

                // Determine if it's a debit or credit transaction
                if (bankTransaction.balance < balance) {
                    bankTransaction.debit = parsedTransactionAmount;
                    bankTransaction.credit = 0;
                } else if (bankTransaction.balance > balance) {
                    bankTransaction.debit = 0;
                    bankTransaction.credit = parsedTransactionAmount;
                }

                balance = bankTransaction.balance;

                // Remove the amounts from the transaction string
                transaction = transaction.substring(0, transactionAmountStart).trim();

                // Assign the updated transaction string to the description
                bankTransaction.description = transaction;
            }
        }

        bankTransactions.push(bankTransaction);
    });

    return bankTransactions;
}

export async function parseNBEStatementPDF(filePath: string): Promise<NBEStatement> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return parseNBEStatementFromPDFText(data.text);
}

export async function convertNBEStatementToCSV(filePath: string): Promise<string> {
    const statement = await parseNBEStatementPDF(filePath);
    const fields = ['transactionDate', 'valueDate', 'referenceNo', 'description', 'debit', 'credit', 'balance'];
    return parse(statement.transactions, { fields });
}

/**
 * 
 * @param dateString 
 * @returns 
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
