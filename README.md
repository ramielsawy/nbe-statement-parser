# nbe-statement-parser

[![npm version](https://img.shields.io/npm/v/nbe-statement-parser)](https://www.npmjs.com/package/nbe-statement-parser)
[![License](https://img.shields.io/npm/l/nbe-statement-parser)](LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/yourusername/nbe-statement-parser/Node.js%20CI)](https://github.com/yourusername/nbe-statement-parser/actions)
[![Downloads](https://img.shields.io/npm/dt/nbe-statement-parser)](https://www.npmjs.com/package/nbe-statement-parser)

**nbe-statement-parser** is a powerful library that helps you parse **National Bank of Egypt (NBE)** bank statements in PDF format into CSV or JSON formats. This is particularly useful for managing your finances, tracking expenses, budgeting, and integrating NBE transactions into financial tools like Excel, Google Sheets, or personal finance applications.

## Features

- **PDF to CSV/JSON conversion**: Extracts transactions from NBE bank statements and exports them in CSV or JSON format.
- **Detailed Statement Information**: Extracts additional information such as customer name, account number, statement period, and balance details.
- **Date Formatting**: Converts dates to ISO 8601 format for better compatibility with various systems.
- **Error Handling & Validation**: Provides defensive checks to ensure accurate data extraction. If the PDF structure changes or transactions are formatted incorrectly, the library will throw meaningful errors.
- **Open Source**: Free to use and open to contributions from the community.

## Installation

You can install `nbe-statement-parser` via npm:

```bash
npm install nbe-statement-parser
```

Or if you're using yarn:

```bash
yarn add nbe-statement-parser
```

## Usage

Here's a basic example of how to use `nbe-statement-parser`:

```typescript
import { parseNBEStatementPDF, convertNBEStatementToCSV } from 'nbe-statement-parser';
import fs from 'fs';

// Path to the PDF file you want to convert
const pdfFilePath = './statement.pdf';

// Parse the PDF and get the statement object
parseNBEStatementPDF(pdfFilePath)
  .then((statement) => {
    console.log('Statement Information:', statement);
    
    // Convert to CSV
    return convertNBEStatementToCSV(pdfFilePath);
  })
  .then((csvData) => {
    // Save the CSV data to a file
    fs.writeFileSync('nbe-transactions.csv', csvData);
    console.log('CSV file created successfully!');
  })
  .catch((err) => {
    console.error('Error processing PDF:', err.message);
  });
```

### CSV Output Example

The library converts the transactions into a CSV format with the following structure:

```
transactionDate,valueDate,referenceNo,description,debit,credit,balance
2024-09-30,2024-09-30,179FTID242472788,outgoing transfer IPN network,1000.00,,22242.93
2024-09-30,2024-09-30,599ITEC242421OAJ,incoming ACH transfer,,2362.50,32717.94
...
```

## API Reference

### `parseNBEStatementPDF(filePath: string): Promise<NBEStatement>`

Parses the NBE statement PDF and returns a Promise that resolves to an `NBEStatement` object containing all the extracted information.

### `convertNBEStatementToCSV(filePath: string): Promise<string>`

Converts the NBE statement PDF to a CSV string. Returns a Promise that resolves to the CSV data as a string.

## Error Handling

`nbe-statement-parser` employs defensive programming techniques to ensure the integrity of the extracted data:

- If the PDF file does not contain the expected transaction format, it throws an error.
- If no transactions are found, or any required field (like transaction date, reference number, or balance) is missing, an error will be thrown.
- This ensures that any breaking changes in the NBE statement format will be immediately detected.

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