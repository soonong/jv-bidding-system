import axios from 'axios';

const BID_API = 'https://bidding2.kr/api2/module/consortiumAPI/bidData_get.php?moduleKey=happy304';
const AGREE_API = 'https://file.bidding2.kr/api/ContractMaster/getGongListForSoon.php?moduleKey=happy304';

async function testConnection() {
    console.log("Testing API connectivity from Node (no CORS)...");
    
    try {
        console.log(`Fetching ${BID_API}...`);
        const res1 = await axios.get(BID_API);
        console.log(`Bid API Status: ${res1.status}`);
        console.log(`Bid API Data Length: ${JSON.stringify(res1.data).length}`);
    } catch (e) {
        console.error("Bid API Failed:", e.message);
        if (e.response) console.error("Status:", e.response.status);
    }

    try {
        console.log(`Fetching ${AGREE_API}...`);
        const res2 = await axios.get(AGREE_API);
        console.log(`Agree API Status: ${res2.status}`);
        console.log(`Agree API Data Length: ${JSON.stringify(res2.data).length}`);
    } catch (e) {
        console.error("Agree API Failed:", e.message);
        if (e.response) console.error("Status:", e.response.status);
    }
}

testConnection();
