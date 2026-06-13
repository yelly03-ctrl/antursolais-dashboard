// 천문 계산: 율리우스일(JD), 태양 황경, 절기 시각
// 정확도: Meeus "Astronomical Algorithms" 저정밀 태양식(~0.01°).
// 절기 시각은 분 단위까지 충분히 정확 (ΔT 무시 오차 ~1분 이내).

const D2R = Math.PI / 180;
const mod360 = (x) => ((x % 360) + 360) % 360;

// JS Date(UTC 기준 ms) → 율리우스일(JD, UT)
export function dateToJD(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// 양력 Y/M/D → 정수 JDN (Fliegel & Van Flandern). 일주(日柱) 계산용.
export function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

// 태양의 겉보기 황경(degree), 입력 JD는 UT 기준
export function sunApparentLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = D2R * M;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(D2R * omega);
  return mod360(lambda);
}

// 태양 황경이 targetLon(도)이 되는 JD를 approxJD 근방(±15일)에서 이분법으로 탐색
export function findSolarTermJD(targetLon, approxJD) {
  // 황경 차이를 (-180, 180] 부호값으로 변환 (절기 부근에서 0을 증가방향으로 통과)
  const g = (jd) => (((sunApparentLongitude(jd) - targetLon + 540) % 360) - 180);
  let lo = approxJD - 15;
  let hi = approxJD + 15;
  let glo = g(lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const gm = g(mid);
    if (glo * gm <= 0) {
      hi = mid;
    } else {
      lo = mid;
      glo = gm;
    }
  }
  return (lo + hi) / 2;
}
