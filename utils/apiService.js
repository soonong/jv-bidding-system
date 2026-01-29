
import axios from 'axios';

// Base URLs
const RAW_BID_API = 'https://bidding2.kr/api2/module/consortiumAPI/bidData_get.php?moduleKey=happy304';
const RAW_AGREE_API = 'https://file.bidding2.kr/api/ContractMaster/getGongListForSoon.php?moduleKey=happy304';

// Helper to remove HTML tags
const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
};

export const fetchBiddingData = async () => {
    try {
       
        console.log("Fetching API Data...");

        const [bidRes, agreeRes] = await Promise.all([
            axios.get(RAW_BID_API),
            axios.get(RAW_AGREE_API)
        ]);

        let rawBids = bidRes.data;
        let rawAgreements = agreeRes.data;

        // Unwrap AllOrigins response if present
        if (rawBids && rawBids.contents) {
            try {
                const parsed = typeof rawBids.contents === 'string' ? JSON.parse(rawBids.contents) : rawBids.contents;
                rawBids = parsed;
            } catch (e) {
                console.warn("Failed to parse AllOrigins bid contents", e);
            }
        }

        if (rawAgreements && rawAgreements.contents) {
            try {
                const parsed = typeof rawAgreements.contents === 'string' ? JSON.parse(rawAgreements.contents) : rawAgreements.contents;
                rawAgreements = parsed;
            } catch (e) {
                console.warn("Failed to parse AllOrigins agreement contents", e);
            }
        }

        console.log("Raw Bids:", rawBids);
        console.log("Raw Agreements:", rawAgreements);

        if (!Array.isArray(rawBids)) {
            console.error("Bid Data is not an array", rawBids);
            return [];
        }

        // 1. Create Projects Map from Bid API
        // Key: gong_no (Notice Number)
        const projectMap = new Map();

        rawBids.forEach((item) => {
            const noticeNo = String(item['공고번호'] || "").trim();
            if (!noticeNo) return;

            const project = {
                id: noticeNo,
                noticeNo: noticeNo,
                noticeNumber: noticeNo, // Legacy support
                name: stripHtml(item['공사명'] || "제목 없음"),
                projectName: stripHtml(item['공사명'] || "제목 없음"), // Legacy support
                client: item['발주처'] || "미정",
                location: item['지역제한'] || "전국",
                amount: item['기초금액'] || "0",
                price: item['기초금액'] || "0", // Legacy support
                deadline: item['협정마감일'] || "",
                // Parse date for sorting if possible, otherwise rely on string
                parsedDate: item['협정마감일'] ? new Date(item['협정마감일']) : undefined,
                bidDate: item['입찰일'] || "",
                projectType: "공동도급", // Default
                status: "공고중",
                representative: "", // Will be filled by Agreement logic
                members: [],
                memo: "",
                sharedWith: [],
                tags: []
            };
            projectMap.set(noticeNo, project);
        });

        // 2. Populate Members from Agreement API
        if (Array.isArray(rawAgreements)) {
            rawAgreements.forEach((agreeItem) => {
                const noticeNo = String(agreeItem['공고번호'] || "").trim();
                const project = projectMap.get(noticeNo);

                if (project) {
                    const members = [];

                    // Check up to 4 members
                    for (let i = 1; i <= 4; i++) {
                        const nameKey = `구성사${i}`;
                        const bizNoKey = `사업자등록번호${i}`;
                        const ratioKey = `지분율${i}`;
                        const statusKey = `최종제출${i}`;

                        const name = agreeItem[nameKey];
                        if (name) {
                            const ratio = parseFloat(agreeItem[ratioKey] || "0");
                            // Determine status string
                            let status = agreeItem[statusKey] || "미제출";
                            // Simple mapping if needed, e.g. "O" -> "제출"
                            if (status === 'O') status = "제출";
                            if (status === 'X') status = "미제출";

                            members.push({
                                name: name,
                                businessNo: agreeItem[bizNoKey] || "",
                                role: "구성원",
                                shareRatio: ratio,
                                share: `${ratio}%`,
                                status: status,
                                submissionStatus: status
                            });
                        }
                    }

                    // Add Representative
                    const repName = agreeItem['대표사'];
                    if (repName) {
                        project.representative = repName;
                        if (!members.some(m => m.name === repName)) {
                            const ratio = parseFloat(agreeItem['지분율'] || "0");
                            let status = agreeItem['최종제출'] || "미제출";
                            if (status === 'O') status = "제출";
                            if (status === 'X') status = "미제출";

                            members.unshift({
                                name: repName,
                                businessNo: agreeItem['사업자등록번호'] || "",
                                role: "대표사",
                                shareRatio: ratio,
                                share: `${ratio}%`,
                                status: status,
                                submissionStatus: status
                            });
                        } else {
                            const member = members.find(m => m.name === repName);
                            if (member) member.role = "대표사";
                        }
                    }

                    project.members = members;
                }
            });
        }

        // 3. Convert Map to Array
        return Array.from(projectMap.values());

    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
};

export const fetchAndDownloadRawData = async () => {
    try {
        console.log("Downloading Raw API Data for Debugging...");

        const fetchSafe = async (url, label) => {
            try {
                const res = await axios.get(url);
                return { success: true, status: res.status, data: res.data };
            } catch (err) {
                console.error(`Failed to fetch ${label}:`, err);
                return {
                    success: false,
                    status: err.response?.status || 0,
                    error: err.response?.data || err.message,
                    headers: err.response?.headers
                };
            }
        };

        const bidRes = await fetchSafe(RAW_BID_API, "Bid Data");
        const agreeRes = await fetchSafe(RAW_AGREE_API, "Agreement Data");

        const debugData = {
            timestamp: new Date().toISOString(),
            bidApiUrl: RAW_BID_API,
            agreementApiUrl: RAW_AGREE_API,
            bidData: bidRes,
            agreementData: agreeRes
        };

        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `api_debug_dump_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Failed to download raw data", error);
        alert("원본 데이터 다운로드 실패 (콘솔 확인)");
        return false;
    }
};
