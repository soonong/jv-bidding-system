import axios from 'axios';
import { BidProject, CompanyMember } from '../types';

// Interface for Bid Data API (List of Projects)
// Estimated structure based on query params: moduleKey=happy304
interface ApiBidItem {
    gong_no: string;        // 공고번호 (Key)
    gong_name: string;      // 공사명
    balju: string;          // 발주처
    local_limit: string;    // 지역제한
    price: string;          // 기초금액
    end_date: string;       // 협정마감일 (YYYY-MM-DD HH:mm:ss)
    my_com_name?: string;   // 대표사? (Likely user's company or leader)
    [key: string]: any;     // Allow flexibility
}

// Interface for Agreement Data API (List of Participating Members)
interface ApiAgreementItem {
    gong_no: string;        // Link to Bid ( 공고번호 )
    com_name: string;       // 업체명
    com_no?: string;        // 사업자번호 (ID)
    stake?: string;         // 지분율
    user_name?: string;     // 담당자 (Kakao Contact)
    status?: string;        // 상태 (제출여부 등, e.g. 'Y', 'N', 'Done')
    is_master?: string;     // 대표사 여부 ('Y' / 'N')
    hp?: string;            // Phone
    [key: string]: any;
}

// Use proxy paths for local development to bypass CORS
// In production, these should be handled by the backend or the same domain.
const IS_DEV = import.meta.env.DEV;

// Base URLs for the actual APIs
const RAW_BID_API = 'https://bidding2.kr/api2/module/consortiumAPI/bidData_get.php?moduleKey=happy304';
const RAW_AGREE_API = 'https://file.bidding2.kr/api/ContractMaster/getGongListForSoon.php?moduleKey=happy304';

// Helper to fetch with failover proxies (Production only)
// Tries multiple high-quality CORS proxies to ensure success
// Helper to fetch with failover proxies (Production only)
// Tries multiple high-quality CORS proxies to ensure success
const fetchWithFailover = async (rawUrl: string) => {
    if (IS_DEV) {
        // Dev: Route to Vite proxy based on URL content
        if (rawUrl.includes('bidData')) return axios.get('/api/bidding/api2/module/consortiumAPI/bidData_get.php?moduleKey=happy304');
        return axios.get('/api/file/api/ContractMaster/getGongListForSoon.php?moduleKey=happy304');
    }

    // Prod: Try sequentially
    const proxies = [
        // 1. AllOrigins (Most common)
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        // 2. CodeTabs
        (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        // 3. CorsProxy.io (Sometimes works)
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        // 4. Cors.lol (Another option)
        (u: string) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`
    ];

    let lastError;
    for (const p of proxies) {
        try {
            const proxyUrl = p(rawUrl);
            // Increased timeout to 30s as target API is slow
            const res = await axios.get(proxyUrl, { timeout: 30000 });
            if (res.status === 200) return res;
        } catch (e: any) {
            console.warn(`Proxy attempt failed:`, e.message);
            lastError = e;
        }
    }
    throw lastError || new Error("All proxies failed after multiple attempts.");
};

// Internal Types
interface ApiBidData {
    '공고번호': string;
    '공사명': string;
    '발주처': string;
    '지역제한': string;
    '기초금액': string;
    '협정마감일': string;
    '입찰일': string; // Bid Date
    // Add other fields if needed, but these are core
}

interface ApiAgreementData {
    '공고번호': string;
    '공사명': string;
    '대표사': string;
    '사업자등록번호': string;
    '지분율': string;
    '최종제출': string;

    // Member 1
    '구성사1': string;
    '사업자등록번호1': string;
    '지분율1': string;
    '최종제출1': string;

    // Member 2
    '구성사2': string;
    '사업자등록번호2': string;
    '지분율2': string;
    '최종제출2': string;

    // Member 3
    '구성사3': string;
    '사업자등록번호3': string;
    '지분율3': string;
    '최종제출3': string;

    // Member 4
    '구성사4': string;
    '사업자등록번호4': string;
    '지분율4': string;
    '최종제출4': string;

    // Additional generic fields
    [key: string]: string | undefined;
}

// Helper to remove HTML tags if present (sometimes API returns formatted strings)
const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
};

export const fetchBiddingData = async (): Promise<BidProject[]> => {
    try {
        console.log("Fetching API Data...");

        const [bidRes, agreeRes] = await Promise.all([
            fetchWithFailover(RAW_BID_API),
            fetchWithFailover(RAW_AGREE_API)
        ]);

        let rawBids: any = bidRes.data;
        let rawAgreements: any = agreeRes.data;

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
        const projectMap = new Map<string, BidProject>();

        rawBids.forEach((item) => {
            const noticeNo = String(item['공고번호'] || "").trim();
            if (!noticeNo) return;

            const project: BidProject = {
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
                    const members: CompanyMember[] = [];

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

    } catch (error: any) {
        console.error("API Fetch Error:", error);

        // Log detailed proxy error if available
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
            // If the proxy returned a specific error message, throw that
            if (error.response.data && error.response.data.message) {
                throw new Error(`Proxy Error: ${error.response.data.message}`);
            }
        }

        throw error; // Re-throw to handle in UI
    }
};

export const fetchAndDownloadRawData = async () => {
    try {
        console.log("Downloading Raw API Data for Debugging...");

        // Use separate try-catch for individual requests via helper
        const fetchSafe = async (url: string, label: string) => {
            try {
                const res = await fetchWithFailover(url);
                return { success: true, status: res.status, data: res.data };
            } catch (err: any) {
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
