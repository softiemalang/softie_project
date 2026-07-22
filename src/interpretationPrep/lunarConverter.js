/**
 * lunarConverter.js
 * 1900-2100 음력-양력 정밀 상호 변환기 (ESM)
 * 
 * solarlunar.js 데이터베이스를 기반으로 구축되었으며, KASI(한국천문연구원)의 공식 음양력 자료 제공 범위(1951-2050년) 내이지만, 로컬 테이블 자체의 전수 검증 대조 fixture는 수립 전입니다.
 */

export const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
];

export const solarMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 음력 한 해의 일수를 구함 (윤달이 있을 경우 윤달의 일수도 합산)
 */
export function lYearDays(y) {
  let sum = 348;
  const info = lunarInfo[y - 1900];
  sum += info & 0x8000 ? 1 : 0;
  sum += info & 0x4000 ? 1 : 0;
  sum += info & 0x2000 ? 1 : 0;
  sum += info & 0x1000 ? 1 : 0;
  sum += info & 0x0800 ? 1 : 0;
  sum += info & 0x0400 ? 1 : 0;
  sum += info & 0x0200 ? 1 : 0;
  sum += info & 0x0100 ? 1 : 0;
  sum += info & 0x0080 ? 1 : 0;
  sum += info & 0x0040 ? 1 : 0;
  sum += info & 0x0020 ? 1 : 0;
  sum += info & 0x0010 ? 1 : 0;
  return sum + leapDays(y);
}

/**
 * 음력 y년에 윤달이 속하는 월을 반환 (0이면 윤달 없음)
 */
export function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf;
}

/**
 * 음력 y년에 윤달의 일수를 반환 (29 또는 30, 없으면 0)
 */
export function leapDays(y) {
  if (leapMonth(y)) {
    return lunarInfo[y - 1900] & 0x10000 ? 30 : 29;
  }
  return 0;
}

/**
 * 음력 y년 m월의 일수를 반환 (대월 30, 소월 29)
 */
export function monthDays(y, m) {
  if (m > 12 || m < 1) {
    return -1;
  }
  return lunarInfo[y - 1900] & (0x10000 >> m) ? 30 : 29;
}

/**
 * 양력 y년 m월의 일수를 반환
 */
export function solarDays(y, m) {
  if (m > 12 || m < 1) {
    return -1;
  }
  const ms = m - 1;
  if (ms === 1) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  } else {
    return solarMonth[ms];
  }
}

/**
 * 양력 -> 음력 변환
 */
export function solar2lunar(y, m, d) {
  y = Number(y);
  m = Number(m);
  d = Number(d);

  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return -1;
  }
  if (y < 1900 || y > 2100) {
    return -1;
  }
  if (y === 1900 && m === 1 && d < 31) {
    return -1;
  }
  if (m < 1 || m > 12) {
    return -1;
  }
  const maxDay = solarDays(y, m);
  if (d < 1 || d > maxDay) {
    return -1;
  }

  const objDate = new Date(y, parseInt(m) - 1, d);
  y = objDate.getFullYear();
  m = objDate.getMonth() + 1;
  d = objDate.getDate();

  let offset = (Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()) - Date.UTC(1900, 0, 31)) / 86400000;

  let i, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }

  const finalYear = i;
  const year = finalYear;
  const lMonth = leapMonth(finalYear);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (lMonth > 0 && i === lMonth + 1 && isLeap === false) {
      --i;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }
    if (isLeap === true && i === lMonth + 1) {
      isLeap = false;
    }
    offset -= temp;
  }

  if (offset === 0 && lMonth > 0 && i === lMonth + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) {
    offset += temp;
    --i;
  }

  const month = i;
  const day = offset + 1;

  return {
    lYear: year,
    lMonth: month,
    lDay: day,
    isLeap
  };
}

/**
 * 음력 -> 양력 변환
 */
export function lunar2solar(y, m, d, isLeapMonth) {
  y = Number(y);
  m = Number(m);
  d = Number(d);
  isLeapMonth = Boolean(isLeapMonth);

  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return -1;
  }

  const lMonth = leapMonth(y);
  if (isLeapMonth && lMonth !== m) {
    return -1;
  }
  if ((y === 2100 && m === 12 && d > 1) || (y === 1900 && m === 1 && d < 31)) {
    return -1;
  }

  const dayLimit = isLeapMonth ? leapDays(y) : monthDays(y, m);
  if (y < 1900 || y > 2100 || d > dayLimit || d < 1) {
    return -1;
  }

  let offset = 0;
  for (let i = 1900; i < y; i++) {
    offset += lYearDays(i);
  }
  let leap = 0, isAdd = false;
  for (let i = 1; i < m; i++) {
    leap = leapMonth(y);
    if (!isAdd) {
      if (leap <= i && leap > 0) {
        offset += leapDays(y);
        isAdd = true;
      }
    }
    offset += monthDays(y, i);
  }
  if (isLeapMonth) {
    offset += monthDays(y, m);
  }

  const stmap = Date.UTC(1900, 1, 30, 0, 0, 0);
  const calObj = new Date((offset + d - 31) * 86400000 + stmap);
  const cY = calObj.getUTCFullYear();
  const cM = calObj.getUTCMonth() + 1;
  const cD = calObj.getUTCDate();

  return {
    solarYear: cY,
    solarMonth: cM,
    solarDay: cD,
    solarDate: `${cY}-${String(cM).padStart(2, '0')}-${String(cD).padStart(2, '0')}`
  };
}
