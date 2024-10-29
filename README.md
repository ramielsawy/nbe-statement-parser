# bank-pdf-statement-parser

[![npm version](https://img.shields.io/npm/v/nbe-statement-parser)](https://www.npmjs.com/package/nbe-statement-parser)
[![License](https://img.shields.io/npm/l/nbe-statement-parser)](LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/ramielsawy/nbe-statement-parser/Node.js%20CI)](https://github.com/ramielsawy/nbe-statement-parser/actions)
[![Downloads](https://img.shields.io/npm/dt/nbe-statement-parser)](https://www.npmjs.com/package/nbe-statement-parser)

A powerful library that helps you parse bank statements in PDF format into CSV or JSON formats. This tool is particularly useful for managing your finances, tracking expenses, budgeting, and integrating bank transactions into financial tools like Excel, Google Sheets, or personal finance applications.

## Features

- **PDF to CSV/JSON conversion**: Extracts transactions from bank statements and exports them in CSV or JSON format.
- **Detailed Statement Information**: Extracts additional information such as customer name, account number, statement period, and balance details.
- **Date Formatting**: Converts dates to ISO 8601 format for better compatibility with various systems.
- **Error Handling & Validation**: Provides defensive checks to ensure accurate data extraction. If the PDF structure changes or transactions are formatted incorrectly, the library will throw meaningful errors.
- **Open Source**: Free to use and open to contributions from the community.

## Installation

You can install the package via npm

## Usage

Here's a basic example of how to use the library:

```typescript
// Path to the PDF file you want to convert
const pdfFilePath = './statement.pdf';

// Parse the PDF and get the statement object
parseBankStatementPDF(pdfFilePath)
  .then((statement) => {
    console.log('Statement Information:', statement);
    
    // Convert to CSV
    return convertPDFStatementToCSV(pdfFilePath);
  })
  .then((csvData) => {
    // Save the CSV data to a file
    fs.writeFileSync('transactions.csv', csvData);
    console.log('CSV file created successfully!');
  })
  .catch((err) => {
    console.error('Error processing PDF:', err.message);
  });
```

### PDF Input Example

![PDF Input Example](https://github.com/ramielsawy/bank-pdf-statement-parser/blob/main/assets/pdf-input-example.png)

### CSV Output Example

The library converts the transactions into a CSV format with the following structure:

```
transactionDate,valueDate,referenceNo,description,debit,credit,balance
2024-09-30,2024-09-30,179FTID242472788,outgoing transfer IPN network,1000.00,,22242.93
2024-09-30,2024-09-30,599ITEC242421OAJ,incoming ACH transfer,,2362.50,32717.94
...
```

## API Reference

### `parseBankStatementPDF(filePath: string): Promise<BankStatement>`

Parses the bank statement PDF and returns a Promise that resolves to a `BankStatement` object containing all the extracted information.

### `convertPDFStatementToCSV(filePath: string): Promise<string>`

Converts the bank statement PDF to a CSV string. Returns a Promise that resolves to the CSV data as a string.

## Error Handling

The library employs defensive programming techniques to ensure the integrity of the extracted data:

- If the PDF file does not contain the expected transaction format, it throws an error.
- If no transactions are found, or any required field (like transaction date, reference number, or balance) is missing, an error will be thrown.
ß- This ensures that any breaking changes in the bank statement format will be immediately detected.

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`
5. Lint the code: `npm run lint`

## Contributing

We welcome contributions from the community! Whether it's reporting an issue, suggesting new features, or submitting pull requests, we appreciate any form of involvement.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, feel free to open an issue on the GitHub repository

---

## Acknowledgments

Special thanks to all contributors and developers who have helped improve this library. We are also grateful for the feedback from users who continue to push for enhancements and new features.