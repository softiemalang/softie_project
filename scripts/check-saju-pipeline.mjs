import { generateNatalSnapshot, generateDailySnapshot } from '../src/saju/interpreter/preprocessor.js';
import { derivePillars } from '../src/saju/engine/core.js';

console.log('--- Staging Pipeline Check ---');

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.log(`[FAIL] ${testName}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual  : ${actual}`);
    failed++;
  }
}

// 1. Verify derivePillars outputs correctly
const pillars = derivePillars('1997-04-21', '14:40');
const formattedPillars = `${pillars.year.stem}${pillars.year.branch} ${pillars.month.stem}${pillars.month.branch} ${pillars.day.stem}${pillars.day.branch} ${pillars.hour.stem}${pillars.hour.branch}`;
assertEqual(formattedPillars, '정축 갑진 계사 기미', 'derivePillars returns expected exact saju for 1997-04-21 14:40');

// 2. Verify generateNatalSnapshot
const profile = {
  birth_date: '1997-04-21',
  birth_time: '14:40'
};
const natalSnapshot = generateNatalSnapshot(profile);
assertEqual(`${natalSnapshot.year_stem}${natalSnapshot.year_branch}`, '정축', 'Natal Snapshot Year Pillar');
assertEqual(`${natalSnapshot.month_stem}${natalSnapshot.month_branch}`, '갑진', 'Natal Snapshot Month Pillar');
assertEqual(`${natalSnapshot.day_stem}${natalSnapshot.day_branch}`, '계사', 'Natal Snapshot Day Pillar');
assertEqual(`${natalSnapshot.hour_stem}${natalSnapshot.hour_branch}`, '기미', 'Natal Snapshot Hour Pillar');
assertEqual(natalSnapshot.day_master, '계', 'Natal Snapshot Day Master is correctly extracted');

// 3. Verify generateDailySnapshot
const targetDateStr = '2026-04-27'; // Random test date
const dailySnapshot = generateDailySnapshot(natalSnapshot, targetDateStr);
const expectedDailyPillars = derivePillars(targetDateStr, '12:00');
assertEqual(dailySnapshot.daily_stem, expectedDailyPillars.day.stem, 'Daily Snapshot Stem dynamically generated');
assertEqual(dailySnapshot.daily_branch, expectedDailyPillars.day.branch, 'Daily Snapshot Branch dynamically generated');
console.log(`  [INFO] The daily pillar used for ${targetDateStr} is ${dailySnapshot.daily_stem}${dailySnapshot.daily_branch}. Dummy '무진' is no longer hardcoded.`);

console.log('------------------------------');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

if (failed === 0) {
  console.log('✅ Pipeline staging check passed successfully.');
} else {
  console.log('❌ Pipeline staging check failed. Please review.');
}
