import { convertNBEStatementToCSV } from './parseNBEStatement';
import fs from 'fs';

// Path to the PDF file you want to convert
const pdfFilePath = './statement.pdf';  // Update this with your PDF file path

// Output path for the CSV file
const outputCsvPath = './nbe-transactions.csv';

async function run() {
    // Extract transactions and convert to CSV
    const csvData = await convertNBEStatementToCSV(pdfFilePath);

    // Save the CSV data to a file
    fs.writeFileSync(outputCsvPath, csvData);

    console.log(`CSV file created successfully at ${outputCsvPath}`);
  
}

// Run the function
run();