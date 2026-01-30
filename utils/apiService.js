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

        // 1. Index Bid Data by Notice Number
        const bidMap = new Map();
        rawBids.forEach((item) => {
            const noticeNo = String(item['공고번호'] || "").trim();
            if (!noticeNo) return;
            // Store the raw bid item first
            bidMap.set(noticeNo, item);
        });

        // 2. Process Agreements and create Project objects
        const projects = [];
        const processedNotices = new Set(); // Track which notices have at least one agreement

        if (Array.isArray(rawAgreements)) {
            rawAgreements.forEach((agreeItem, idx) => {
                const noticeNo = String(agreeItem['공고번호'] || "").trim();
                const rawBid = bidMap.get(noticeNo);

                // If we have bid data for this agreement
                if (rawBid) {
                    processedNotices.add(noticeNo);

                    // Create Base Project Object
                    const project = {
                        // Generate unique ID for this specific agreement (Consortium)
                        id: `${noticeNo}_${idx}`,
                        noticeNo: noticeNo,
                        noticeNumber: noticeNo,
                        name: stripHtml(rawBid['공사명'] || "제목 없음"),
                        projectName: stripHtml(rawBid['공사명'] || "제목 없음"),
                        client: rawBid['발주처'] || "미정",
                        location: rawBid['지역제한'] || "전국",
                        amount: rawBid['기초금액'] || "0",
                        price: rawBid['기초금액'] || "0",
                        deadline: rawBid['협정마감일'] || "",
                        parsedDate: rawBid['협정마감일'] ? new Date(rawBid['협정마감일']) : undefined,
                        bidDate: rawBid['입찰일'] || "",
                        projectType: "공동도급",
                        status: "공고중",
                        representative: "",
                        members: [],
                        memo: "",
                        sharedWith: [],
                        tags: []
                    };

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

                    // Extract Writer/Artist (Conso Artist)
                    // The correct field from API headers is '컨소아티스트'
                    const artist = agreeItem['컨소아티스트'] || agreeItem['작성자'] || agreeItem['담당자'] || "";
                    if (artist) {
                        project.sharedWith = [artist];
                    }

                    project.members = members;
                    projects.push(project);
                }
            });
        }

        // 3. Add Bids that had NO agreements (Orphans)
        bidMap.forEach((rawBid, noticeNo) => {
            if (!processedNotices.has(noticeNo)) {
                const project = {
                    id: noticeNo, // Use noticeNo as ID since it's the only one
                    noticeNo: noticeNo,
                    noticeNumber: noticeNo,
                    name: stripHtml(rawBid['공사명'] || "제목 없음"),
                    projectName: stripHtml(rawBid['공사명'] || "제목 없음"),
                    client: rawBid['발주처'] || "미정",
                    location: rawBid['지역제한'] || "전국",
                    amount: rawBid['기초금액'] || "0",
                    price: rawBid['기초금액'] || "0",
                    deadline: rawBid['협정마감일'] || "",
                    parsedDate: rawBid['협정마감일'] ? new Date(rawBid['협정마감일']) : undefined,
                    bidDate: rawBid['입찰일'] || "",
                    projectType: "공동도급",
                    status: "공고중",
                    representative: "미정",
                    members: [], // Empty members
                    memo: "",
                    sharedWith: [],
                    tags: []
                };
                projects.push(project);
            }
        });

        return projects;

    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
};
