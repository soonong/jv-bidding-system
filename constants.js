
// Helper to create date for current year/month
const getDate = (day) => {
  const d = new Date();
  d.setDate(day);
  return d;
};

export const MOCK_PROJECTS = [
  {
    id: "1",
    projectName: "2025년도 한전 신재생 연계용 ESS 구축사업",
    name: "2025년도 한전 신재생 연계용 ESS 구축사업",
    noticeNumber: "2025-10293",
    noticeNo: "2025-10293",
    client: "한국전력공사",
    location: "전국",
    amount: "450억원",
    deadline: "2025-06-15",
    representative: "현대일렉트릭",
    status: 'ongoing',
    parsedDate: new Date("2025-06-15"),
    members: [
      { name: "현대일렉트릭", share: "60%", submissionStatus: "o" },
      { name: "LG에너지솔루션", share: "30%", submissionStatus: "o" },
      { name: "우리회사", share: "10%", submissionStatus: "x" }
    ]
  },
  {
    id: "2",
    projectName: "서울시 스마트시티 IoT 인프라 확충",
    name: "서울시 스마트시티 IoT 인프라 확충",
    noticeNumber: "2025-10294",
    noticeNo: "2025-10294",
    client: "서울특별시청",
    location: "서울",
    amount: "120억원",
    deadline: "2025-06-18",
    representative: "삼성SDS",
    status: 'pending',
    parsedDate: new Date("2025-06-18"),
    members: [
      { name: "삼성SDS", share: "50%", submissionStatus: "o" },
      { name: "우리회사", share: "20%", submissionStatus: "o" },
      { name: "중소기업A", share: "30%", submissionStatus: "x" }
    ]
  },
  {
    id: "3",
    projectName: "부산항만공사 차세대 물류시스템 구축",
    name: "부산항만공사 차세대 물류시스템 구축",
    noticeNumber: "2025-10295",
    noticeNo: "2025-10295",
    client: "부산항만공사",
    location: "부산",
    amount: "200억원",
    deadline: "2025-06-20",
    representative: "LG CNS",
    status: 'ongoing',
    parsedDate: new Date("2025-06-20"),
    members: [
      { name: "LG CNS", share: "51%", submissionStatus: "o" },
      { name: "우리회사", share: "49%", submissionStatus: "x" }
    ]
  },
  {
    id: "4",
    projectName: "세종 정부청사 네트워크 고도화 사업",
    name: "세종 정부청사 네트워크 고도화 사업",
    noticeNumber: "2025-10296",
    noticeNo: "2025-10296",
    client: "행정안전부",
    location: "세종",
    amount: "80억원",
    deadline: "2025-07-02",
    representative: "SK브로드밴드",
    status: 'completed',
    parsedDate: new Date("2025-07-02"),
    members: [
      { name: "SK브로드밴드", share: "60%", submissionStatus: "o" },
      { name: "우리회사", share: "40%", submissionStatus: "o" }
    ]
  },
  {
    id: "5",
    projectName: "인천국제공항 제2터미널 보안시스템 개선",
    name: "인천국제공항 제2터미널 보안시스템 개선",
    noticeNumber: "2025-10297",
    noticeNo: "2025-10297",
    client: "인천국제공항철도",
    location: "인천",
    amount: "150억원",
    deadline: "2025-07-10",
    representative: "한화시스템",
    status: 'ongoing',
    parsedDate: new Date("2025-07-10"),
    members: [
      { name: "한화시스템", share: "70%", submissionStatus: "o" },
      { name: "우리회사", share: "30%", submissionStatus: "x" }
    ]
  }
];
