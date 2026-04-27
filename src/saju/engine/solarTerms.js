export function getSolarLongitude(jd) {
  const d = jd - 2451545.0; // Days since J2000.0
  let m = (357.5291 + 0.98560028 * d) % 360;
  if (m < 0) m += 360;
  const mRad = m * Math.PI / 180;
  const c = 1.9148 * Math.sin(mRad) + 0.0200 * Math.sin(2 * mRad) + 0.0003 * Math.sin(3 * mRad);
  let l = (280.4665 + 0.98564736 * d + c) % 360;
  if (l < 0) l += 360;
  return l;
}

export function getBaziYearAndMonth(year, month, day, hour, min) {
  // Convert KST to UTC by subtracting 9 hours
  const kstMs = Date.UTC(year, month - 1, day, hour - 9, min);
  const jd = (kstMs / 86400000) + 2440587.5;
  const l = getSolarLongitude(jd);
  
  let baziYear = year;
  // If date is in Jan/Feb and before Ipchun (315°), it belongs to previous Bazi year.
  if (month <= 2 && l < 315 && l > 270) {
    baziYear -= 1;
  }
  
  let monthIndex;
  if (l >= 315 && l < 345) monthIndex = 1;
  else if (l >= 345 || l < 15) monthIndex = 2; // Crosses 0°
  else if (l >= 15 && l < 45) monthIndex = 3;
  else if (l >= 45 && l < 75) monthIndex = 4;
  else if (l >= 75 && l < 105) monthIndex = 5;
  else if (l >= 105 && l < 135) monthIndex = 6;
  else if (l >= 135 && l < 165) monthIndex = 7;
  else if (l >= 165 && l < 195) monthIndex = 8;
  else if (l >= 195 && l < 225) monthIndex = 9;
  else if (l >= 225 && l < 255) monthIndex = 10;
  else if (l >= 255 && l < 285) monthIndex = 11;
  else monthIndex = 12; // 285 to 315
  
  return { baziYear, monthIndex };
}
