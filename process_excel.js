
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, 'list', '공동도급협정.xlsx');
const jsonPath = path.join(__dirname, 'db.json');

console.log(`Reading from: ${excelPath}`);

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array objects
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Map and filter data
    const processedData = rawData.map((row, index) => {
        // Extract basic fields
        const deadlineRaw = row['협정마감일'] ? String(row['협정마감일']).trim() : "";
        const projectName = row['공사명'] ? String(row['공사명']).trim() : "";
        const noticeNumber = row['공고번호'] ? String(row['공고번호']).trim() : "";
        const representative = row['대표사'] ? String(row['대표사']).trim() : "";
        const client = row['발주처'] ? String(row['발주처']).trim() : "";
        const location = row['지역제한'] ? String(row['지역제한']).trim() : "";
        const amount = row[' 기초금액 '] ? String(row[' 기초금액 ']).trim() : "";
        const artist = row['컨소아티스트'] ? String(row['컨소아티스트']).trim() : "";
        const sharedWith = artist ? [artist] : [];

        // Parse deadline
        let parsedDate = null;
        let dateStr = deadlineRaw;

        if (deadlineRaw) {
            const parts = deadlineRaw.split('/');
            if (parts.length === 3) {
                let year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                if (year < 100) year += 2000;

                parsedDate = new Date(year, month - 1, day);
                dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }

        // Determine status
        const today = new Date();
        let status = 'pending';
        if (parsedDate) {
            if (parsedDate < today) {
                status = 'completed';
            } else {
                status = 'ongoing';
            }
        }

        // Extract Members
        const members = [];

        // Helper to add member if name exists
        const addMember = (name, id, share, role, contact) => {
            if (name && String(name).trim() !== '') {
                members.push({
                    name: String(name).trim(),
                    id: String(id || '').trim(),
                    share: String(share || '').trim(),
                    role: role,
                    contact: String(contact || '').trim()
                });
            }
        };

        // 1. Representative
        addMember(row['대표사'], row['사업자등록번호'], row['지분율'], 'representative', row['카톡담당자']);

        // 2. Member 1
        addMember(row['구성사1'], row['사업자등록번호1'], row['지분율1'], 'member', row['카톡담당자1']);

        // 3. Member 2
        addMember(row['구성사2'], row['사업자등록번호2'], row['지분율2'], 'member', row['카톡담당자2']);

        // 4. Member 3
        addMember(row['구성사3'], row['사업자등록번호3'], row['지분율3'], 'member', row['카톡담당자3']);

        // 5. Member 4
        addMember(row['구성사4'], row['사업자등록번호4'], row['지분율4'], 'member', row['카톡담당자4']);

        // 6. Member 5 (Assuming keys like '분담사5' based on previous checks, fallback to standard naming if needed)
        // Based on previous logs: '분담사5', '사업자등록번호5', '지분율5'
        addMember(row['분담사5'], row['사업자등록번호5'], row['지분율5'], 'member', null);

        // 7. Member 6
        addMember(row['분담사6'], row['사업자등록번호6'], row['지분율6'], 'member', null);


        return {
            id: String(index),
            deadline: dateStr,
            projectName,
            noticeNumber,
            representative,
            client,
            location,
            amount,
            status,
            members,
            parsedDate,
            sharedWith,
        };
    }).filter(item => item.deadline && item.projectName);

    // Sort by deadline
    processedData.sort((a, b) => {
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
    });

    const finalData = processedData.map(({ parsedDate, ...rest }) => rest);

    fs.writeFileSync(jsonPath, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`Successfully processed ${finalData.length} records.`);

} catch (error) {
    console.error("Error processing Excel:", error);
    process.exit(1);
}
