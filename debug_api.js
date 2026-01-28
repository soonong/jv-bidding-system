
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';

const BID_API_URL = 'http://bidding2.kr/api2/module/consortiumAPI/bidData_get.php?moduleKey=happy304';
const AGREEMENT_API_URL = 'https://file.bidding2.kr/api/ContractMaster/getGongListForSoon.php?moduleKey=happy304';

const desktopPath = 'C:/Users/imbid/Desktop';

// Helper to convert JSON array to CSV string
const toCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');

    const rows = data.map(obj => {
        return headers.map(header => {
            const val = obj[header];
            // Handle commas, quotes, and newlines in data
            if (typeof val === 'string') {
                const escaped = val.replace(/"/g, '""');
                if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
                    return `"${escaped}"`;
                }
                return escaped;
            }
            return val;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
};

async function run() {
    // Create an HTTPS agent that ignores SSL errors
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
        console.log("Fetching Bids from:", BID_API_URL);
        const bidRes = await axios.get(BID_API_URL);

        if (Array.isArray(bidRes.data)) {
            const csvData = toCSV(bidRes.data);
            // Add BOM for Excel UTF-8 compatibility
            const bom = '\ufeff';
            const filePath = path.join(desktopPath, 'bids.csv');
            await fs.writeFile(filePath, bom + csvData, 'utf8');
            console.log(`Saved Bids CSV to: ${filePath} (${bidRes.data.length} rows)`);
        } else {
            console.error("Bid data is not an array:", bidRes.data);
        }

        console.log("\nFetching Agreements from:", AGREEMENT_API_URL);
        // Use the agent to bypass SSL error
        const agreeRes = await axios.get(AGREEMENT_API_URL, { httpsAgent });

        if (Array.isArray(agreeRes.data)) {
            const csvData = toCSV(agreeRes.data);
            const bom = '\ufeff';
            const filePath = path.join(desktopPath, 'agreements.csv');
            await fs.writeFile(filePath, bom + csvData, 'utf8');
            console.log(`Saved Agreements CSV to: ${filePath} (${agreeRes.data.length} rows)`);
        } else {
            console.error("Agreement data is not an array:", agreeRes.data);
        }

    } catch (e) {
        console.error("Error during fetch:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", e.response.data);
        }
    }
}

run();
