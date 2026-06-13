// 사주 계산 엔진 (계산 코어 / Layer 1)
// 입력: 생년월일시(양력) + 출생지 경도(선택) → 사주팔자·오행분포·십신
// LLM 미사용. 결정론적 계산.

import {
  STEMS, STEMS_KO, BRANCHES, BRANCHES_KO,
  ELEMENTS, ELEMENTS_HJ,
  STEM_ELEMENT, STEM_YIN, BRANCH_ELEMENT, BRANCH_YIN,
  MONTH_STEM_START, HOUR_STEM_START,
  GANZHI_DAY_OFFSET, GANZHI_YEAR_ANCHOR,
} from "./constants.mjs";
import { dateToJD, gregorianToJDN, sunApparentLongitude, findSolarTermJD } from "./astronomy.mjs";

const mod = (n, m) => ((n % m) + m) % m;

function pillar(stemIdx, branchIdx) {
  return {
    stem: STEMS[stemIdx],
    stemKo: STEMS_KO[stemIdx],
    branch: BRANCHES[branchIdx],
    branchKo: BRANCHES_KO[branchIdx],
    ganji: STEMS[stemIdx] + BRANCHES[branchIdx],
    ganjiKo: STEMS_KO[stemIdx] + BRANCHES_KO[branchIdx],
    stemElement: ELEMENTS[STEM_ELEMENT[stemIdx]],
    branchElement: ELEMENTS[BRANCH_ELEMENT[branchIdx]],
    _stemIdx: stemIdx,
    _branchIdx: branchIdx,
  };
}

// 일간(dayStemIdx) 기준, 대상 오행/음양의 십신 명칭
function tenGod(dayStemIdx, targetElem, targetYin) {
  const de = STEM_ELEMENT[dayStemIdx];
  const dy = STEM_YIN[dayStemIdx];
  const same = targetYin === dy;
  let rel; // 0 비겁 1 식상 2 재성 3 관성 4 인성
  if (targetElem === de) rel = 0;
  else if ((de + 1) % 5 === targetElem) rel = 1;
  else if ((de + 2) % 5 === targetElem) rel = 2;
  else if ((de + 3) % 5 === targetElem) rel = 3;
  else rel = 4;
  const names = [
    same ? "비견" : "겁재",
    same ? "식신" : "상관",
    same ? "편재" : "정재",
    same ? "편관" : "정관",
    same ? "편인" : "정인",
  ];
  return names[rel];
}

/**
 * @param {object} birth
 * @param {number} birth.year  양력 연
 * @param {number} birth.month 양력 월 (1-12)
 * @param {number} birth.day   양력 일
 * @param {number} [birth.hour=12]   시 (0-23). 모르면 12로 두되 시주는 신뢰도 낮음
 * @param {number} [birth.minute=0]  분
 * @param {number} [birth.tzOffsetMinutes=540] 출생지 표준시 오프셋(분). 한국=540
 * @param {number} [birth.longitude] 출생지 경도(동경 +). 주면 진태양시 보정
 */
export function computeSaju(birth) {
  const {
    year, month, day,
    hour = 12, minute = 0,
    tzOffsetMinutes = 540,
    longitude = null,
  } = birth;

  // --- UT 시각 & JD (태양황경/절기용) ---
  const utMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetMinutes * 60000;
  const birthJD = dateToJD(new Date(utMs));

  // --- 연주(年柱): 입춘 경계로 사주년 결정 ---
  // 해당 양력년 2/4 근방의 입춘(황경 315°) 시각과 비교
  const ipchunApproxJD = dateToJD(new Date(Date.UTC(year, 1, 4)));
  const ipchunJD = findSolarTermJD(315, ipchunApproxJD);
  const sajuYear = birthJD < ipchunJD ? year - 1 : year;
  const yearIdx = mod(sajuYear - GANZHI_YEAR_ANCHOR, 60);
  const yearStemIdx = mod(yearIdx, 10);
  const yearPillar = pillar(yearStemIdx, mod(yearIdx, 12));

  // --- 월주(月柱): 출생 시 태양황경 → 절기월 ---
  const lon = sunApparentLongitude(birthJD);
  const monthPos = Math.floor(mod(lon - 315, 360) / 30); // 0=寅월 ... 11=丑월
  const monthBranchIdx = mod(2 + monthPos, 12); // 寅=2
  const monthStemIdx = mod(MONTH_STEM_START[yearStemIdx % 5] + monthPos, 10);
  const monthPillar = pillar(monthStemIdx, monthBranchIdx);

  // --- 일주(日柱): 양력 civil date 기준 60갑자 ---
  const jdn = gregorianToJDN(year, month, day);
  const dayIdx = mod(jdn + GANZHI_DAY_OFFSET, 60);
  const dayStemIdx = mod(dayIdx, 10);
  const dayPillar = pillar(dayStemIdx, mod(dayIdx, 12));

  // --- 시주(時柱): (진태양시 보정 선택) ---
  let solarMinutes = hour * 60 + minute;
  let trueSolarApplied = false;
  if (longitude != null) {
    // 표준시 자오선 대비 경도차 4분/도 보정 (균시차는 v1 생략)
    const tzMeridian = (tzOffsetMinutes / 60) * 15;
    solarMinutes += (longitude - tzMeridian) * 4;
    trueSolarApplied = true;
  }
  solarMinutes = mod(solarMinutes, 1440);
  const hourBranchIdx = Math.floor(mod(solarMinutes + 60, 1440) / 120) % 12; // 子=0(23~01시)
  const hourStemIdx = mod(HOUR_STEM_START[dayStemIdx % 5] + hourBranchIdx, 10);
  const hourPillar = pillar(hourStemIdx, hourBranchIdx);

  // --- 오행 분포 (천간4 + 지지4) ---
  const elementCount = [0, 0, 0, 0, 0];
  for (const p of [yearPillar, monthPillar, dayPillar, hourPillar]) {
    elementCount[STEM_ELEMENT[p._stemIdx]]++;
    elementCount[BRANCH_ELEMENT[p._branchIdx]]++;
  }
  const maxC = Math.max(...elementCount);
  const elements = ELEMENTS.map((name, i) => ({
    name, hanja: ELEMENTS_HJ[i], count: elementCount[i],
    excess: elementCount[i] >= 3, absent: elementCount[i] === 0,
    dominant: elementCount[i] === maxC && maxC > 0,
  }));

  // --- 십신 (일간 제외 천간 + 4지지) ---
  const tenGods = {};
  const others = [
    ["연간", yearStemIdx, false], ["월간", monthStemIdx, false], ["시간", hourStemIdx, false],
  ];
  for (const [pos, sIdx] of others) {
    tenGods[pos] = tenGod(dayStemIdx, STEM_ELEMENT[sIdx], STEM_YIN[sIdx]);
  }
  const branchPos = ["연지", "월지", "일지", "시지"];
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach((p, i) => {
    tenGods[branchPos[i]] = tenGod(dayStemIdx, BRANCH_ELEMENT[p._branchIdx], BRANCH_YIN[p._branchIdx]);
  });

  return {
    input: { year, month, day, hour, minute, tzOffsetMinutes, longitude, trueSolarApplied },
    sajuYear,
    pillars: {
      year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar,
    },
    dayMaster: { // 일간 = 자아의 핵심
      stem: dayPillar.stem, stemKo: dayPillar.stemKo,
      element: ELEMENTS[STEM_ELEMENT[dayStemIdx]],
      yinYang: STEM_YIN[dayStemIdx] === 0 ? "양" : "음",
    },
    elements,
    tenGods,
    meta: {
      sunLongitude: Number(lon.toFixed(3)),
      note: "일주 앵커(2000-01-07=甲子)는 운영 전 교차검증 권장. 시주는 진태양시 보정 시 longitude 입력.",
    },
  };
}
