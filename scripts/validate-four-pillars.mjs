import { calculateFourPillars, DEFAULT_SAJU_OPTIONS } from '../src/saju/engine/fourPillars.js';

// 카테고리 1: 완벽히 증명된 기준 케이스 (Known Fixtures)
// 1997-04-21 및 기준점(1970-01-01)과 같이 다른 모든 계산의 기초가 되는 앵커 데이터입니다.
const KNOWN_FIXTURES = [
  { date: '1997-04-21', time: '14:40', expected: '정축 갑진 계사 기미', desc: 'Baseline (Prompt Truth)' },
  { date: '1970-01-01', time: '12:00', expected: '기유 병자 신사 갑오', desc: 'Epoch Baseline 1970-01-01' },
  { date: '2024-02-10', time: '12:00', expected: '갑진 병인 갑진 경오', desc: '2024 Jiachen New Year' },
  { date: '2000-01-01', time: '12:00', expected: '기묘 병자 무오 무오', desc: 'Millennium start' }
];

// 카테고리 2: 엔진 내부 정합성 및 무결성 테스트 (Internal Consistency)
// 윤년, 월말월초 등에서 날짜가 하루씩 정확하게 전진하는지 (Day Index 오프셋 확인)
const INTERNAL_CONSISTENCY = [
  { date: '1996-02-29', time: '12:00', expected: '병자 경인 병신 갑오', desc: 'Leap Year: 1996-02-29' },
  { date: '2000-02-29', time: '12:00', expected: '경진 무인 정사 병오', desc: 'Leap Year: 2000-02-29' },
  { date: '2024-02-29', time: '12:00', expected: '갑진 병인 계해 무오', desc: 'Leap Year: 2024-02-29' }
];

// 카테고리 3: 학파/표준별 차이 케이스 (Standard-Difference)
// 30분 보정(23:30 자시 시작), 조자시/야자시 병합(일주 즉시 변경), 입춘 절입 시각 등에 의해 결과가 달라지는 케이스입니다.
const STANDARD_DIFFERENCE = [
  { date: '1997-04-21', time: '22:59', expected: '정축 갑진 계사 계해', desc: 'Before Zi hour boundary' },
  { date: '1997-04-21', time: '23:00', expected: '정축 갑진 계사 계해', desc: '23:00 (Standard: Hae hour, Alternative: Zi hour)' },
  { date: '1997-04-21', time: '23:30', expected: '정축 갑진 갑오 갑자', desc: '23:30 (Zi hour starts, Day rolls over to Gap-O)' },
  { date: '1997-04-22', time: '00:00', expected: '정축 갑진 갑오 갑자', desc: '00:00 (Zi hour, rolled over day)' },
  { date: '1997-04-22', time: '00:59', expected: '정축 갑진 갑오 갑자', desc: '00:59 (Zi hour)' },
  { date: '1997-04-22', time: '01:30', expected: '정축 갑진 갑오 을축', desc: '01:30 (Chou hour starts)' }
];

function formatPillars(p) {
  return `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`;
}

function runTests(categoryName, tests) {
  console.log(`\n=== ${categoryName} ===`);
  let passed = 0;
  let failed = 0;
  
  tests.forEach(tc => {
    const result = calculateFourPillars({ birthDate: tc.date, birthTime: tc.time });
    const actual = formatPillars(result);
    const isPass = actual === tc.expected;
    
    if (isPass) passed++;
    else failed++;
    
    console.log(`[${isPass ? 'PASS' : 'FAIL'}] ${tc.desc}`);
    console.log(`  Input: ${tc.date} ${tc.time}`);
    if (!isPass) {
      console.log(`  Expected: ${tc.expected}`);
      console.log(`  Actual  : ${actual}`);
    } else {
      console.log(`  Result  : ${actual}`);
    }
  });
  
  return { passed, failed, total: tests.length };
}

console.log('--- Four Pillars Engine Validation Report ---');
console.log('Standards Applied:');
console.log(JSON.stringify(DEFAULT_SAJU_OPTIONS, null, 2));

const knownRes = runTests('Category 1: Known Fixtures', KNOWN_FIXTURES);
const internalRes = runTests('Category 2: Internal Consistency', INTERNAL_CONSISTENCY);
const stdRes = runTests('Category 3: Standard-Difference (For Information)', STANDARD_DIFFERENCE);

console.log('\n=== Final Validation Summary ===');
console.log(`- Known Fixtures passed: ${knownRes.passed} / ${knownRes.total}`);
console.log(`- Internal Consistency passed: ${internalRes.passed} / ${internalRes.total}`);
console.log(`- Standard-Difference tests matching current rules: ${stdRes.passed} / ${stdRes.total}`);

if (knownRes.failed === 0 && internalRes.failed === 0) {
  console.log('\nConclusion:');
  console.log('✅ Known fixtures passed');
  console.log('✅ Internal consistency passed');
  console.log('⚠️ External reference verification required for edge minute solar term boundaries.');
  console.log('🟢 Safe for staging / pre-production testing.');
} else {
  console.log('\nConclusion:');
  console.log('❌ Validation failed. Engine requires adjustment before use.');
}
