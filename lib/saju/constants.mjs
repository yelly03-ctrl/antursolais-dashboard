// 사주 계산용 기본 상수 테이블
// element index: 0=목(木) 1=화(火) 2=토(土) 3=금(金) 4=수(水)
// yin index: 0=양(陽,+) 1=음(陰,-)

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const STEMS_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const BRANCHES_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

export const ELEMENTS = ["목", "화", "토", "금", "수"];
export const ELEMENTS_HJ = ["木", "火", "土", "金", "水"];

// 천간 → 오행 / 음양
export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 갑을=목 병정=화 무기=토 경신=금 임계=수
export const STEM_YIN = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];      // 갑=양 을=음 ...

// 지지 → 오행 / 음양 (지지 자체의 음양; 십신 약식 계산용)
// 子수 丑토 寅목 卯목 辰토 巳화 午화 未토 申금 酉금 戌토 亥수
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
export const BRANCH_YIN = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

// 오호둔(五虎遁): 연간 → 寅월(첫 절기월)의 천간 인덱스
// 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
export const MONTH_STEM_START = [2, 4, 6, 8, 0]; // index = yearStem % 5

// 오자둔(五鼠遁): 일간 → 子시의 천간 인덱스
// 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬
export const HOUR_STEM_START = [0, 2, 4, 6, 8]; // index = dayStem % 5

// 60갑자 기준일 오프셋: 2000-01-01(양력) = 庚申(경신)일 로 앵커링(만세력 데이터 기준).
// dayIndex = (정수JDN + 51) % 60, 0 = 甲子
//   jdn(2000-01-01)=2451545, %60=5, (5+51)%60=56=庚申 ✓
// ⚠️ 운영 전 권위 있는 만세력으로 본인 일주 한 번 더 교차검증 권장.
export const GANZHI_DAY_OFFSET = 51;

// 1984년 = 甲子년 (60갑자 연 기준)
export const GANZHI_YEAR_ANCHOR = 1984;
