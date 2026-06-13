// 사주 엔진 검증 스크립트:  node scripts/validate-saju.mjs
import { computeSaju } from "../lib/saju/engine.mjs";
import { findSolarTermJD } from "../lib/saju/astronomy.mjs";

let pass = 0, fail = 0;
function check(label, got, want) {
  const ok = got === want;
  console.log(`${ok ? "✅" : "❌"} ${label}: ${got}${ok ? "" : ` (기대: ${want})`}`);
  ok ? pass++ : fail++;
}

// --- 1) 연주: 알려진 사실로 검증 ---
// 2024년(입춘 이후)은 甲辰년
check("2024 연주(甲辰)", computeSaju({ year: 2024, month: 6, day: 1 }).pillars.year.ganji, "甲辰");
// 1984년은 甲子년 (60갑자 기준)
check("1984 연주(甲子)", computeSaju({ year: 1984, month: 6, day: 1 }).pillars.year.ganji, "甲子");
// 입춘 경계: 2024-01-20 은 아직 癸卯년 (입춘 전)
check("2024-01-20 연주(癸卯, 입춘전)", computeSaju({ year: 2024, month: 1, day: 20 }).pillars.year.ganji, "癸卯");

// --- 2) 절기 시각 sanity: 2024 입춘 ≈ 2/4 ---
const ipchun2024 = findSolarTermJD(315, 2460344); // 2024-02-03 근방 JD
const d = new Date((ipchun2024 - 2440587.5) * 86400000);
console.log(`ℹ️  2024 입춘(UT): ${d.toISOString().slice(0, 16)} (기대: 2024-02-04 근방)`);

// --- 3) 월주 오호둔 sanity: 甲년 寅월은 丙寅 ---
// 2024 甲辰년, 양력 2/15(입춘 후 寅월) → 월간 丙
const feb2024 = computeSaju({ year: 2024, month: 2, day: 15 });
check("2024-02-15 월주 천간(丙, 甲년 寅월)", feb2024.pillars.month.stem, "丙");
check("2024-02-15 월지(寅)", feb2024.pillars.month.branch, "寅");

// --- 4) 일주 앵커 검증: 2000-01-01 = 庚申(만세력 데이터) ---
const anchor = computeSaju({ year: 2000, month: 1, day: 1, hour: 0, minute: 30 });
check("2000-01-01 일주(庚申)", anchor.pillars.day.ganji, "庚申");
check("00:30 시지(子)", anchor.pillars.hour.branch, "子");
// 오자둔 sanity: 庚申일 子시 → 丙子 (乙庚→丙)
check("2000-01-01 00:30 시주(丙子)", anchor.pillars.hour.ganji, "丙子");

// --- 5) 전체 출력 데모 ---
console.log("\n--- 데모: 1990-05-15 08:30, 서울(경도 126.978) ---");
const demo = computeSaju({ year: 1990, month: 5, day: 15, hour: 8, minute: 30, longitude: 126.978 });
console.log("사주팔자:",
  demo.pillars.year.ganji, demo.pillars.month.ganji,
  demo.pillars.day.ganji, demo.pillars.hour.ganji);
console.log("일간(자아):", demo.dayMaster.stemKo, `(${demo.dayMaster.element}/${demo.dayMaster.yinYang})`);
console.log("오행분포:", demo.elements.map((e) => `${e.name}${e.count}`).join(" "));
console.log("십신:", demo.tenGods);

console.log(`\n결과: ${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
