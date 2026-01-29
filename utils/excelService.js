
// Function to parse the Agreement Status Excel (Existing)
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File is empty");

        const XLSX = window.XLSX;
        if (!XLSX) throw new Error("XLSX library not loaded");

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawData.length < 2) return resolve([]);

        const headers = rawData[0];
        const rows = rawData.slice(1);

        const projects = rows.map((row, index) => {
          const getValueByName = (headerNames) => {
            const names = Array.isArray(headerNames) ? headerNames : [headerNames];
            for (const name of names) {
              const idx = headers.findIndex(h => h && typeof h === 'string' && h.includes(name));
              if (idx !== -1) return (row[idx] || "");
            }
            return "";
          };

          const rawDate = row[10]; // Column K
          let parsedDate = null;

          if (rawDate) {
            if (typeof rawDate === 'number') {
              parsedDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
            } else {
              let str = String(rawDate).trim();
              const match = str.match(/^(\d{2})[\/.](\d{2})[\/.](\d{2})$/);
              if (match) {
                const year = parseInt(match[1], 10) + 2000;
                const month = parseInt(match[2], 10) - 1;
                const day = parseInt(match[3], 10);
                parsedDate = new Date(year, month, day);
              } else {
                let cleanDate = str.replace(/\./g, '-').replace(/\//g, '-');
                cleanDate = cleanDate.replace(/[^\d: -]/g, '').trim();
                const d = new Date(cleanDate);
                if (!isNaN(d.getTime())) parsedDate = d;
              }
            }
          }

          if (!parsedDate) {
            const fuzzyDateRaw = getValueByName(["협정마감일", "마감일"]);
            if (fuzzyDateRaw) {
              if (typeof fuzzyDateRaw === 'number') {
                parsedDate = new Date((fuzzyDateRaw - (25567 + 2)) * 86400 * 1000);
              } else {
                const d = new Date(String(fuzzyDateRaw));
                if (!isNaN(d.getTime())) parsedDate = d;
              }
            }
          }

          if (!parsedDate) parsedDate = new Date(); // Fallback

          const findRelativeCol = (startIdx, keyword, maxOffset = 8) => {
            for (let i = 1; i <= maxOffset; i++) {
              const h = headers[startIdx + i];
              if (h && typeof h === 'string') {
                const cleanH = h.replace(/\s+/g, "");
                if (cleanH.includes(keyword)) return startIdx + i;
              }
            }
            return -1;
          };

          const members = [];
          const memberIndices = headers
            .map((h, i) => {
              if (h && typeof h === 'string') {
                const cleanH = h.replace(/\s+/g, "");
                if (cleanH.includes("대표사") || cleanH.includes("대표업체") || cleanH.includes("구성사")) return i;
              }
              return -1;
            })
            .filter(i => i !== -1);

          memberIndices.forEach(idx => {
            const name = row[idx];
            if (name) {
              const statusIdx = findRelativeCol(idx, "최종제출");
              let rawStatus = "";
              if (statusIdx !== -1) {
                rawStatus = String(row[statusIdx] || "").trim();
              }
              let status = rawStatus;
              if (['o', 'O', '0', 'ㅇ', '○', 'OK', 'ok'].includes(rawStatus)) status = 'o';
              else if (['x', 'X', 'NO', 'no'].includes(rawStatus)) status = 'x';

              const contactIdx = findRelativeCol(idx, "카톡담당자", 15);
              const contact = contactIdx !== -1 ? String(row[contactIdx] || "").trim() : "";

              members.push({
                name: String(name),
                id: String(row[idx + 1] || ""),
                share: String(row[idx + 2] || ""),
                submissionStatus: status,
                contact: contact
              });
            }
          });

          const rawProjectName = row[6] || getValueByName(["공사명", "공고명"]);
          const projectName = String(rawProjectName || "").trim();
          const sharedRaw = getValueByName(["공유자", "컨소아티스트", "담당자", "참여자"]);
          const sharedWith = sharedRaw ? String(sharedRaw).split(/[,/|]+/).map(s => s.trim()) : [];

          if (!projectName) return null;

          return {
            id: `imported-${index}-${Date.now()}`,
            name: projectName,
            projectName: projectName,
            noticeNo: String(row[5] || getValueByName(["공고번호"])),
            noticeNumber: String(row[5] || getValueByName(["공고번호"])),
            client: String(row[7] || getValueByName(["발주처"])),
            location: String(row[8] || getValueByName(["지역"])),
            amount: String(row[9] || getValueByName(["기초금액"])),
            deadline: String(rawDate),
            representative: String(getValueByName(["대표사"])),
            members: members,
            status: 'pending',
            parsedDate: parsedDate,
            sharedWith: sharedWith
          };
        }).filter(p => p !== null);

        console.log(`Parsed ${projects.length} valid projects`);
        resolve(projects);

      } catch (err) {
        console.error("Excel Parse Error:", err);
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};

// Function to parse the Bid Notice List Excel (New)
// User specified: B=Name(1), D=Amount(3), H=Client(7), I=Location(8), J=Deadline(9)
export const parseBidNoticeExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File is empty");

        const XLSX = window.XLSX;
        if (!XLSX) throw new Error("XLSX library not loaded");

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawData.length < 2) return resolve([]);

        const headers = rawData[0];
        const rows = rawData.slice(1);

        const projects = rows.map((row, index) => {
          const getValueByName = (headerNames) => {
            const names = Array.isArray(headerNames) ? headerNames : [headerNames];
            for (const name of names) {
              const idx = headers.findIndex(h => h && typeof h === 'string' && h.includes(name));
              if (idx !== -1) return (row[idx] || "");
            }
            return "";
          };

          // Column J (Index 9) is Agreement Deadline
          const rawDate = row[9];
          let parsedDate = null;
          if (rawDate) {
            if (typeof rawDate === 'number') {
              parsedDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
            } else {
              let str = String(rawDate).trim();
              let cleanDate = str.replace(/\./g, '-').replace(/\//g, '-');
              const d = new Date(cleanDate);
              if (!isNaN(d.getTime())) parsedDate = d;
            }
          }
          if (!parsedDate) parsedDate = new Date(); // Fallback

          // Column B (Index 1) is Project Name
          const rawProjectName = row[1] || getValueByName(["공사명", "공고명"]);
          const projectName = String(rawProjectName || "").trim();

          if (!projectName) return null;

          return {
            id: `notice-${index}-${Date.now()}`,
            name: projectName,
            projectName: projectName,
            noticeNo: String(row[0]), // Strictly A(0)
            noticeNumber: String(row[0]), // Strictly A(0)
            client: String(row[7] || getValueByName(["발주처"])), // H(7)
            location: String(row[8] || getValueByName(["지역"])), // I(8)
            amount: String(row[3] || getValueByName(["기초금액"])), // D(3)
            deadline: String(rawDate),
            representative: "-",
            members: [], // No members in notice list
            status: 'pending',
            parsedDate: parsedDate,
            sharedWith: [] // Default empty sharedWith
          };
        }).filter(p => p !== null);

        console.log(`Parsed ${projects.length} bid notices`);
        resolve(projects);
      } catch (err) {
        console.error("Bid Notice Parse Error:", err);
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};
