
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'list', '공동도급협정.xlsx');
console.log('Reading file:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read first 5 rows to understand the structure
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: false });
    console.log('Sheet Name:', sheetName);
    console.log('Headers (Row 1):', data[0]);
    console.log('First Row Data:', data[1]);

} catch (error) {
    console.error("Error reading Excel file:", error);
}
