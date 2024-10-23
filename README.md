
```markdown
# nbe-statement-csv

[![npm version](https://img.shields.io/npm/v/nbe-statement-csv)](https://www.npmjs.com/package/nbe-statement-csv)
[![License](https://img.shields.io/npm/l/nbe-statement-csv)](LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/yourusername/nbe-statement-csv/Node.js%20CI)](https://github.com/yourusername/nbe-statement-csv/actions)
[![Downloads](https://img.shields.io/npm/dt/nbe-statement-csv)](https://www.npmjs.com/package/nbe-statement-csv)

**nbe-statement-csv** is a simple and powerful library that helps you convert **National Bank of Egypt (NBE)** bank statements in PDF format into CSV files. This is particularly useful for managing your finances, tracking expenses, budgeting, and integrating NBE transactions into financial tools like Excel, Google Sheets, or personal finance applications.

## Features

- **PDF to CSV conversion**: Extracts transactions from NBE bank statements and exports them in CSV format.
- **Ready for Budgeting & Expense Tracking**: Makes it easy to track expenses and manage your financials by creating CSV files from your NBE statements.
- **Error Handling & Validation**: Provides defensive checks to ensure accurate data extraction. If the PDF structure changes or transactions are formatted incorrectly, the library will throw meaningful errors.
- **Open Source**: Free to use and open to contributions from the community.
  
## Installation

You can install `nbe-statement-csv` via npm:

```bash
npm install nbe-statement-csv
```

Or if you're using yarn:

```bash
yarn add nbe-statement-csv
```

## Usage

Here’s a basic example of how to use `nbe-statement-csv`:

```typescript
import { extractTransactionsFromPDF } from 'nbe-statement-csv';
import fs from 'fs';

// Read the PDF file
const pdfPath = '/path/to/your/nbe-statement.pdf';

extractTransactionsFromPDF(pdfPath)
  .then((csvData) => {
    // Save the CSV data to a file
    fs.writeFileSync('nbe-transactions.csv', csvData);
    console.log('CSV file created successfully!');
  })
  .catch((err) => {
    console.error('Error converting PDF to CSV:', err.message);
  });
```

### CSV Output Example

The library converts the transactions into a CSV format with the following structure:

```
transactionDate,valueDate,referenceNo,description,debit,credit,balance
30-September-2024,30-September-2024,179FTID242472788,outgoing transfer IPN network,1000.00,,22242.93
30-September-2024,30-September-2024,599ITEC242421OAJ,incoming ACH transfer,,-2362.50,32717.94
...
```

## Use Cases & Benefits

1. **Expense Tracking**: The CSV format allows you to import your NBE transactions into tools like Excel or Google Sheets, making it easier to categorize expenses and track your spending habits over time.
2. **Budgeting**: By regularly converting your bank statements into CSV, you can keep track of your budget more effectively and avoid overspending.
3. **Financial Analysis**: Import the CSV files into any personal finance application to analyze your financial trends and manage your savings, investments, and expenses.
4. **Automation**: For developers building financial management tools, `nbe-statement-csv` can be integrated into your workflow to automatically convert NBE statements and track users' financial data.

## Error Handling

`nbe-statement-csv` employs defensive programming techniques to ensure the integrity of the extracted data:

- If the PDF file does not contain the expected transaction format, it throws a `InvalidPDFFormatError`.
- If no transactions are found, or any required field (like transaction date, reference number, or balance) is missing, an error will be thrown.
- This ensures that any breaking changes in the NBE statement format will be immediately detected.

## Contributions

We welcome contributions from the community! Whether it's reporting an issue, suggesting new features, or submitting pull requests, we appreciate any form of involvement. Feel free to fork the project, create a branch, and submit a pull request.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, feel free to open an issue on the [GitHub repository](https://github.com/yourusername/nbe-statement-csv).

---

## Example Projects

If you have built any projects using `nbe-statement-csv`, we'd love to hear about it! You can open a pull request to include your project in this section and share your story with the community.

## Acknowledgments

Special thanks to all contributors and developers who have helped improve this library. We are also grateful for the feedback from users who continue to push for enhancements and new features.

---

### License: **MIT**
This open-source library is distributed under the MIT License, making it free for both personal and commercial use. You can modify, distribute, and use it in your projects without restrictions.

---

You now have a complete package that is easy to use, open-source, and beneficial to those looking to manage their NBE transactions efficiently. Let me know if you need more details!