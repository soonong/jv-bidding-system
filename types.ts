export interface CompanyMember {
  name: string;
  id?: string; // Optional now
  businessNo?: string; // New: Business License No
  role?: string; // New: "대표사", "구성원"
  share: string; // Display string e.g. "51%"
  shareRatio?: number; // Numeric value
  contact?: string;
  submissionStatus?: string; // 최종제출 (o, x, empty)
  status?: string; // Alias for submissionStatus
}

export interface BidProject {
  id: string;

  // Core Identifiers
  noticeNo: string; // New preferred key
  noticeNumber?: string; // Legacy alias

  name: string; // New preferred key
  projectName?: string; // Legacy alias

  client: string; // 발주처
  location: string; // 지역제한
  amount: string; // 기초금액 (display string)
  price?: string; // Legacy alias

  deadline: string; // 협정마감일 string
  parsedDate?: Date; // For sorting/calendar

  bidDate?: string; // 입찰일

  representative: string; // 대표사 name

  members: CompanyMember[];

  projectType?: string; // "공동도급" etc
  status: string; // "공고중", "pending", "ongoing", etc.

  memo?: string;
  tags?: string[];
  sharedWith?: string[];
}


export interface CalendarDay {
  date: number;
  fullDate: Date;
  isCurrentMonth: boolean;
  projects: BidProject[];
}