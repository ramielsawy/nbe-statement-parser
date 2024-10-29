import path from 'path';
import { parseBankStatementPDF, convertPDFStatementToCSV } from '../src/parseBankStatement';
import dotenv from 'dotenv';
dotenv.config();

describe('NBE Statement Parser', () => {
    const testPDFPath = path.join(__dirname, 'statement.pdf');

    describe('parseNBEStatementPDF', () => {
        it('should parse PDF statement correctly', async () => {
            const statement = await parseBankStatementPDF(testPDFPath);

            // Basic structure checks
            expect(statement).toBeDefined();
            expect(statement.customerName).toBeDefined();
            expect(statement.accountNumber).toBeDefined();
            expect(statement.transactions).toBeInstanceOf(Array);

            // Validate date formats
            expect(statement.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(statement.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            // Validate numeric values
            expect(typeof statement.openingBalance).toBe('number');
            expect(typeof statement.closingBalance).toBe('number');

            // Validate transactions
            if (statement.transactions.length > 0) {
                const firstTransaction = statement.transactions[0];
                expect(firstTransaction).toHaveProperty('transactionDate');
                expect(firstTransaction).toHaveProperty('valueDate');
                expect(firstTransaction).toHaveProperty('description');
                expect(firstTransaction).toHaveProperty('debit');
                expect(firstTransaction).toHaveProperty('credit');
                expect(firstTransaction).toHaveProperty('balance');
                
                // Validate specific transaction format
                expect(firstTransaction.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(firstTransaction.valueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(typeof firstTransaction.debit).toBe('number');
                expect(typeof firstTransaction.credit).toBe('number');
                expect(typeof firstTransaction.balance).toBe('number');
            }
        });

        it('should correctly parse the first transaction', async () => {
            const statement = await parseBankStatementPDF(testPDFPath);
            const firstTransaction = statement.transactions[0];

            expect(firstTransaction).toEqual({
                transactionDate: process.env.TEST_TRANSACTION_DATE,
                valueDate: process.env.TEST_VALUE_DATE,
                referenceNo: process.env.TEST_REFERENCE_NO,
                description: process.env.TEST_DESCRIPTION,
                debit: parseFloat(process.env.TEST_DEBIT!),
                credit: parseFloat(process.env.TEST_CREDIT!),
                balance: parseFloat(process.env.TEST_BALANCE!)
            });
        });
    });

    describe('convertNBEStatementToCSV', () => {
        it('should convert PDF statement to CSV format', async () => {
            const csv = await convertPDFStatementToCSV(testPDFPath);

            // Basic CSV structure checks
            expect(csv).toBeDefined();
            expect(typeof csv).toBe('string');
            expect(csv.length).toBeGreaterThan(0);

            // Check CSV headers (with quotes)
            const expectedHeaders = '"transactionDate","valueDate","referenceNo","description","debit","credit","balance"';
            expect(csv.startsWith(expectedHeaders)).toBeTruthy();

            // Check if CSV has data rows
            const rows = csv.split('\n');
            expect(rows.length).toBeGreaterThan(1);

            // Validate first data row format
            if (rows.length > 1) {
                const firstDataRow = rows[1];
                expect(firstDataRow).toMatch(/^"\d{4}-\d{2}-\d{2}","[^"]+","[^"]*","[^"]+",\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?$/);
            }

            // Validate numeric values in CSV
            const sampleRow = rows[1].split(',');
            expect(parseFloat(sampleRow[4]) || parseFloat(sampleRow[5])).toBeGreaterThan(0); // Either debit or credit should be > 0
            expect(parseFloat(sampleRow[6])).toBeGreaterThan(0); // Balance should be > 0
        });
    });

    describe('Error handling', () => {
        it('should throw error for non-existent file', async () => {
            const nonExistentPath = 'non-existent.pdf';
            await expect(parseBankStatementPDF(nonExistentPath)).rejects.toThrow();
        });

        it('should throw error for invalid PDF', async () => {
            // Create a test file path to a text file with .pdf extension
            const invalidPDFPath = path.join(__dirname, 'invalid.pdf');
            await expect(parseBankStatementPDF(invalidPDFPath)).rejects.toThrow();
        });
    });
}); 