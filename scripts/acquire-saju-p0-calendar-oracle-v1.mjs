import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DEFAULT_OUTPUT = resolve(ROOT, 'artifacts/saju-p0-calendar-oracle-v1')
const DEFAULT_CAPTURE_DATE = '2026-08-09'

const KASI_MONTHS = [
  [1900, 2],
  [1951, 1],
  [1951, 5],
  [1960, 6],
  [1960, 7],
  [1984, 11],
  [1995, 1],
  [2023, 3],
  [2023, 4],
  [2025, 1],
  [2025, 10],
  [2026, 2],
  [2026, 4],
  [2031, 4],
  [2050, 12],
]

const SOLAR_TERM_NAMES = {
  285: '소한', 300: '대한', 315: '입춘', 330: '우수',
  345: '경칩', 0: '춘분', 15: '청명', 30: '곡우',
  45: '입하', 60: '소만', 75: '망종', 90: '하지',
  105: '소서', 120: '대서', 135: '입추', 150: '처서',
  165: '백로', 180: '추분', 195: '한로', 210: '상강',
  225: '입동', 240: '소설', 255: '대설', 270: '동지',
}
const BAZI_MONTH_BOUNDARY_LONGITUDES = new Set([315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285])

const SOURCE_DESCRIPTIONS = [
  {
    id: 'kasi-monthly-lunisolar',
    institution: '한국천문연구원 (KASI)',
    title: '월별 음양력',
    role: 'official_lunisolar_date_service',
    urls: ['https://astro.kasi.re.kr/life/pageView/5'],
    request: {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      fields: ['search_year', 'search_month', 'search_dp=1', 'search_check=G'],
    },
    meaning: 'Gregorian calendar date to Korean lunisolar date, leap-month marker, and displayed sexagenary date labels.',
    timeBasis: 'date-only civil calendar row; response does not state a time-of-day, timezone, or time scale for the row.',
    calendarDefinition: 'KASI page states Gregorian and Julian calendar views and a public input range of -59-02 through 2050-12.',
    coverage: { declaredServiceRange: '-59-02 through 2050-12', observedYears: [1900, 1951, 1960, 1984, 1995, 2023, 2025, 2026, 2031, 2050] },
    license: 'No blanket bulk-extraction or redistribution permission was established for the service; retain only derived research rows and response hashes.',
    independence: 'External institutional service; implementation/data lineage is not disclosed on the queried page, so it is an official observation source but not a qualified independent implementation.',
    semanticEquivalence: 'Lunar date and leap marker are equivalent to the date-only converter contract. Sexagenary month/year labels are not used as proof of an instant-sensitive Bazi boundary because the response has no time-of-day.',
  },
  {
    id: 'kasi-astronomical-almanac-2026',
    institution: '한국천문연구원 (KASI)',
    title: '한국천문연구원 2026년 역서',
    role: 'official_almanac_locator_and_rights_control',
    urls: [
      'https://www.kasi.re.kr/kor/publication/post/publication?clsf_cd=pub005',
      'https://www.kasi.re.kr/file/1762136558729_1.pdf',
    ],
    meaning: 'Official Korean astronomical almanac locator; the retrieved PDF is an image-based publication.',
    timeBasis: 'Almanac page identity is official; exact page-level event rows were not admitted to this corpus because the PDF has no text layer and its page notes prohibit unauthorized republication.',
    calendarDefinition: 'Annual Korean astronomical almanac with 24-term and calendar material.',
    coverage: { declaredYear: 2026, pageCount: 232 },
    license: 'The KASI almanac record states that only original images are provided and unauthorized reproduction/redistribution is not allowed; raw PDF is not stored in the repository artifact.',
    independence: 'Official national almanac; method lineage for the displayed page is not inferred from a catalog locator.',
    semanticEquivalence: 'Locator/authority evidence only in this work order; no machine comparison rows admitted.',
  },
  {
    id: 'kasi-astronomical-certificate-channel',
    institution: '한국천문연구원 (KASI)',
    title: '음양력 대조증명서 및 천문정보자료 신청',
    role: 'official_certificate_request_channel',
    urls: ['https://www.kasi.re.kr/kor/publication/pageView/131'],
    meaning: 'Official request channel for date-specific calendar and astronomical certificates.',
    timeBasis: 'Per-request output semantics and certificate metadata would need to be retained for a future admitted certificate packet.',
    calendarDefinition: 'Date-specific official evidence by request; not an openly downloadable bulk corpus.',
    coverage: { publicAccess: 'request_and_fee' },
    license: 'Request/reproduction conditions were not sufficient to admit a reusable bulk corpus in this pass.',
    independence: 'Official KASI certificate channel; no output was received in this work order.',
    semanticEquivalence: 'Potentially strong for exact requested rows, but oracle scope is insufficient without a received certificate and its method/time metadata.',
  },
  {
    id: 'hko-24-solar-terms-xml',
    institution: 'Hong Kong Observatory (HKO)',
    title: 'Date and Time of the 24 Solar Terms XML service',
    role: 'official_24_solar_term_event_service',
    urls: ['https://www.hko.gov.hk/en/gts/astronomy/Solar_Term.htm'],
    request: { method: 'GET', template: 'https://www.hko.gov.hk/en/gts/astronomy/data/files/24SolarTerms_{year}.xml' },
    meaning: 'Twenty-four solar-term event dates and displayed clock times; terms are 15-degree ecliptic longitude sectors.',
    timeBasis: 'Displayed Hong Kong Time (HKT, UTC+08:00); XML precision is one minute. HKO notes that the astronomical data are based on HM Nautical Almanac Office and USNO data.',
    calendarDefinition: 'HKO defines the 24 terms as 24 equal 15-degree ecliptic longitude sectors; the Bazi production boundary uses only the 12 30-degree month-entry longitudes.',
    coverage: { observedYears: [2026, 2027, 2028], observedRows: 72, publicServiceScope: 'current year and following two years on the page' },
    license: 'Public service/PDF access was confirmed, but a blanket raw-output redistribution license was not established; retain normalized rows and response hashes only.',
    independence: 'Independent endpoint and implementation from this repository. HKO is not independent of USNO/HMNAO for source-data lineage because HKO explicitly discloses that dependency.',
    semanticEquivalence: 'Event longitude and civil-time output are comparable to the repository apparent-geocentric solar-longitude root, but the HKO XML does not fully expose the repository frame/ephemeris/time-scale contract.',
  },
  {
    id: 'usno-seasons-api',
    institution: 'U.S. Naval Observatory Astronomical Applications Department',
    title: "Earth's Seasons API",
    role: 'official_equinox_solstice_control',
    urls: ['https://aa.usno.navy.mil/data/api.html', 'https://aa.usno.navy.mil/api/seasons?year={year}'],
    request: { method: 'GET', template: 'https://aa.usno.navy.mil/api/seasons?year={year}' },
    meaning: 'Equinox and solstice event times in UTC, with API version metadata.',
    timeBasis: 'UTC when tz is omitted; one-minute displayed precision.',
    calendarDefinition: 'Season events only; does not provide all 24 solar terms or lunar conversion.',
    coverage: { declaredYears: '1700-2100 inclusive', observedYears: [2026, 2027, 2028], observedRows: 12 },
    license: 'Public API access confirmed; specific redistribution terms for retained response data were not separately established.',
    independence: 'Independent endpoint from this repository, but same-family corroboration with HKO is limited because HKO explicitly cites USNO/HMNAO data.',
    semanticEquivalence: 'Equinox/solstice rows correspond to the 0/90/180/270 degree subset of HKO terms; they do not authorize extrapolation to the other 20 terms.',
  },
  {
    id: 'kriss-utc-kris-kst',
    institution: '한국표준과학연구원 (KRISS)',
    title: 'UTC(KRIS) and Korean Standard Time documentation',
    role: 'official_current_time_standard_authority',
    urls: ['https://www.kriss.re.kr/board.es?bid=0031&mid=a10603000000'],
    meaning: 'Official time-standard relationship: current KST is UTC+09:00 and UTC(KRIS) is maintained by KRISS.',
    timeBasis: 'UTC(KRIS), UTC, and current KST relationship; this is time-standard authority, not historical civil-time transition data.',
    calendarDefinition: 'No lunar or solar-term definition.',
    coverage: { scope: 'current standard-time relationship' },
    license: 'KRISS synchronization service has use restrictions; no bulk time-service reuse was admitted.',
    independence: 'Independent national time-standard authority, not an astrology-rule authority.',
    semanticEquivalence: 'Supports the current +09:00 conversion contract only; it does not settle pre-1961 Seoul offsets, DST rules, or 子時 policy.',
  },
  {
    id: 'iana-tzdb-2026c-asia-seoul',
    institution: 'Internet Assigned Numbers Authority (IANA) Time Zone Database',
    title: 'tzdb 2026c asia source',
    role: 'historical_civil_time_zone_rule_source',
    urls: ['https://data.iana.org/time-zones/tzdb-2026c/asia', 'https://data.iana.org/time-zones/tzdb-2026c/LICENSE'],
    meaning: 'Versioned Asia/Seoul historical standard offsets and ROK daylight-saving transition rules.',
    timeBasis: 'Local civil time transition rules, UTC offsets, and named DST transitions; not astronomical event time.',
    calendarDefinition: 'No lunar or solar-term definition.',
    coverage: { sourceRelease: '2026c', asiaSeoul: '1900 onward in the source lines; explicit ROK rules 1948-1960 and 1987-1988' },
    license: 'IANA tzdb LICENSE states that, unless specified otherwise, code and data are public domain; some code files are BSD-3-Clause. The asia data used here is treated as public-domain data under that file.',
    independence: 'Independent civil-time rule source from the repository and from KASI/HKO astronomical calculations; not independent of its own historical source citations.',
    semanticEquivalence: 'Directly equivalent to the civil timezone transition/status contract, not to the Saju school choice of solar time, day rollover, or 야자시.',
  },
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonical = value => `${JSON.stringify(sortKeys(value), null, 2)}\n`
const sortKeys = value => Array.isArray(value)
  ? value.map(sortKeys)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]))
    : value

function stripHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseKasiRows(html, requestedYear, requestedMonth) {
  const table = html.match(/<table[^>]*monthly_bg[^>]*>([\s\S]*?)<\/table>/i)?.[1]
  if (!table) throw new Error(`KASI monthly table missing for ${requestedYear}-${requestedMonth}`)
  const rows = []
  for (const match of table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(item => stripHtml(item[1]))
    if (cells.length < 5) continue
    const solar = cells[0].match(/^(\d{4})년\s*(\d{2})월\s*(\d{2})일$/)
    const lunar = cells[1].match(/^(\d{4})년\s*(윤)?(\d{2})월\s*(\d{2})일$/)
    if (!solar || !lunar) continue
    const ganji = cells[2]
    const yearGanji = ganji.match(/([^\s(]+)\([^)]*\)년/)?.[1] || null
    const monthGanji = ganji.match(/\)년\s+([^\s(]+)\([^)]*\)월/)?.[1] || null
    const dayGanji = ganji.match(/\)월\s+([^\s(]+)\([^)]*\)일/)?.[1]
      || ganji.match(/\)년\s+([^\s(]+)\([^)]*\)일/)?.[1]
      || null
    rows.push({
      id: `kasi-${solar[1]}-${solar[2]}-${solar[3]}`,
      solarDate: `${solar[1]}-${solar[2]}-${solar[3]}`,
      lunar: { year: Number(lunar[1]), month: Number(lunar[3]), day: Number(lunar[4]), isLeapMonth: Boolean(lunar[2]) },
      sexagenary: { year: yearGanji, month: monthGanji, day: dayGanji, raw: ganji },
      weekday: cells[3],
      julianDate: cells[4],
    })
  }
  const unique = [...new Map(rows.map(row => [row.solarDate, row])).values()]
  if (unique.length < 28) throw new Error(`KASI monthly table yielded too few rows for ${requestedYear}-${requestedMonth}: ${unique.length}`)
  return unique
}

function parseHkoTerms(xml, year) {
  const matches = [...xml.matchAll(/<Data><M>(\d{2})<\/M><D>(\d{2})<\/D><hm>(\d{2}):(\d{2})<\/hm><\/Data>/g)]
  if (matches.length !== 24) throw new Error(`HKO solar-term XML yielded ${matches.length} rows for ${year}`)
  return matches.map(([, month, day, hour, minute], index) => {
    const longitudeDegrees = (285 + index * 15) % 360
    const utcMs = Date.UTC(year, Number(month) - 1, Number(day), Number(hour) - 8, Number(minute))
    return {
      id: `hko-${year}-${String(index + 1).padStart(2, '0')}`,
      year,
      termIndex: index + 1,
      termName: SOLAR_TERM_NAMES[longitudeDegrees],
      longitudeDegrees,
      kind: BAZI_MONTH_BOUNDARY_LONGITUDES.has(longitudeDegrees) ? 'month_entry_term' : 'intermediate_term',
      hktDateTime: `${year}-${month}-${day} ${hour}:${minute}`,
      utcIso: new Date(utcMs).toISOString(),
      displayPrecision: 'minute',
      timezone: 'Asia/Hong_Kong',
      utcOffsetMinutes: 480,
    }
  })
}

function parseUsnoSeasons(json, year) {
  const data = Array.isArray(json.data) ? json.data : []
  return data
    .filter(item => item.phenom === 'Equinox' || item.phenom === 'Solstice')
    .map((item, index) => {
      const utcMs = Date.UTC(item.year, item.month - 1, item.day, Number(item.time.slice(0, 2)), Number(item.time.slice(3, 5)))
      const longitudeDegrees = ({
        '3-20': 0, '3-21': 0, '6-20': 90, '6-21': 90,
        '9-22': 180, '9-23': 180, '12-21': 270, '12-22': 270,
      })[`${item.month}-${item.day}`]
      return {
        id: `usno-${year}-${String(index + 1).padStart(2, '0')}`,
        year,
        phenomenon: item.phenom,
        month: item.month,
        day: item.day,
        utcTime: item.time,
        utcIso: new Date(utcMs).toISOString(),
        longitudeDegrees: longitudeDegrees ?? null,
        displayPrecision: 'minute',
        timezone: 'UTC',
        apiVersion: json.apiversion,
      }
    })
}

async function fetchBytes(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  return { bytes, text: bytes.toString('utf8'), sha256: sha256(bytes), byteLength: bytes.length }
}

async function buildInputs({ capturedAt, outputDir }) {
  const captures = []
  const kasiRows = []
  for (const [year, month] of KASI_MONTHS) {
    const body = new URLSearchParams({ search_year: String(year), search_month: String(month).padStart(2, '0'), search_dp: '1', search_check: 'G' })
    const result = await fetchBytes('https://astro.kasi.re.kr/life/pageView/5', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    const rows = parseKasiRows(result.text, year, month)
    kasiRows.push(...rows)
    captures.push({
      sourceId: 'kasi-monthly-lunisolar',
      request: { method: 'POST', url: 'https://astro.kasi.re.kr/life/pageView/5', body: body.toString() },
      response: { byteLength: result.byteLength, sha256: result.sha256, parsedRowCount: rows.length },
    })
  }

  const hkoRows = []
  for (const year of [2026, 2027, 2028]) {
    const url = `https://www.hko.gov.hk/en/gts/astronomy/data/files/24SolarTerms_${year}.xml`
    const result = await fetchBytes(url)
    const rows = parseHkoTerms(result.text, year)
    hkoRows.push(...rows)
    captures.push({ sourceId: 'hko-24-solar-terms-xml', request: { method: 'GET', url }, response: { byteLength: result.byteLength, sha256: result.sha256, parsedRowCount: rows.length } })
  }

  const usnoRows = []
  for (const year of [2026, 2027, 2028]) {
    const url = `https://aa.usno.navy.mil/api/seasons?year=${year}`
    const result = await fetchBytes(url)
    const json = JSON.parse(result.text)
    const rows = parseUsnoSeasons(json, year)
    usnoRows.push(...rows)
    captures.push({ sourceId: 'usno-seasons-api', request: { method: 'GET', url }, response: { byteLength: result.byteLength, sha256: result.sha256, apiVersion: json.apiversion, parsedRowCount: rows.length } })
  }

  const ianaUrl = 'https://data.iana.org/time-zones/tzdb-2026c/asia'
  const iana = await fetchBytes(ianaUrl)
  const ianaLines = iana.text.split('\n').filter(line => /Rule\s+ROK\s+(1948|1949|1950|1951|1955|1956|1957|1987|1988)|Zone\s+Asia\/Seoul|\s+8:30\s+-\s+KST\s+1912|\s+8:30\s+ROK\s+K%sT\s+1961/.test(line))
  captures.push({ sourceId: 'iana-tzdb-2026c-asia-seoul', request: { method: 'GET', url: ianaUrl }, response: { byteLength: iana.byteLength, sha256: iana.sha256, selectedLineCount: ianaLines.length, selectedLines: ianaLines } })

  for (const url of ['https://www.kasi.re.kr/kor/publication/post/publication?clsf_cd=pub005', 'https://www.kasi.re.kr/kor/publication/pageView/131', 'https://www.kriss.re.kr/board.es?bid=0031&mid=a10603000000']) {
    const result = await fetchBytes(url)
    captures.push({ sourceId: url.includes('kriss') ? 'kriss-utc-kris-kst' : url.includes('pageView/131') ? 'kasi-astronomical-certificate-channel' : 'kasi-astronomical-almanac-2026', request: { method: 'GET', url }, response: { byteLength: result.byteLength, sha256: result.sha256, rawRetained: false } })
  }
  const almanac = await fetchBytes('https://www.kasi.re.kr/file/1762136558729_1.pdf')
  captures.push({ sourceId: 'kasi-astronomical-almanac-2026', request: { method: 'GET', url: 'https://www.kasi.re.kr/file/1762136558729_1.pdf' }, response: { byteLength: almanac.byteLength, sha256: almanac.sha256, mimeType: 'application/pdf', pageCount: 232, rawRetained: false, visualObservation: 'cover and PDF metadata inspected; no text-layer rows admitted' } })

  const baselinePaths = [
    '-.jpg',
    'artifacts/saju-claim-provenance-v0.json',
    'artifacts/saju-readiness-grounding-v0.json',
    'artifacts/saju-v1-local-frontier-v0/complete.json',
    'src/saju/engine/fourPillars.js',
    'src/saju/engine/solarTerms.js',
    'src/interpretationPrep/lunarConverter.js',
    'src/interpretationPrep/sajuAdapter.js',
    'src/saju/engine/externalValidationFixtures.js',
  ]
  const baselineHashes = []
  for (const path of baselinePaths) {
    const bytes = await readFile(resolve(ROOT, path))
    baselineHashes.push({ path, byteLength: bytes.length, sha256: sha256(bytes) })
  }

  const sourceInventory = {
    schemaVersion: 'saju-p0-calendar-oracle-source-inventory-v1',
    capturedAt,
    sources: SOURCE_DESCRIPTIONS,
    captures,
    protectedBaseline: baselineHashes,
    rawRetentionPolicy: 'Actual response byte hashes and derived rows are retained. KASI almanac raw PDF and all raw HTML/XML/API response bodies are not copied into the repository; source URLs, request identity, response hashes, parsed rows and rights limits remain separate.',
  }

  const corpus = {
    schemaVersion: 'saju-p0-calendar-oracle-corpus-v1',
    capturedAt,
    contract: {
      timezone: 'Asia/Seoul',
      currentKstOffsetMinutes: 540,
      lunarComparison: 'date-only solar2lunar output: year/month/day/leap marker',
      dayPillarComparison: 'calculateFourPillars at 12:00 Asia/Seoul against KASI displayed sexagenary day only',
      solarTermComparison: '12 month-entry longitudes at 315 + n*30 degrees; 12 intermediate terms are retained as explicit scope controls',
      solarTermSourceDisplayPrecisionSeconds: 60,
      solarTermDeclaredEngineToleranceMinutes: 20,
      timezoneComparison: 'IANA civil-time transition/status cases; pre-1961 engine fail-closed status is preserved as a semantic scope gap, not treated as a numeric correction.',
      categories: ['exact_match', 'within_defined_tolerance', 'semantic_mismatch', 'oracle_scope_insufficient', 'authority_unresolved'],
    },
    kasiRows,
    hkoRows,
    usnoRows,
    timezoneRows: [
      { id: 'tz-rok-1951-dst-start', date: '1951-05-06', localTime: '00:30', oracle: { kind: 'dst_gap', utcOffsetBeforeMinutes: 540, utcOffsetAfterMinutes: 600, sourceRule: 'ROK 1951 only May 6 0:00 1:00 D' }, expectedEngine: 'historical_offset_unverified' },
      { id: 'tz-seoul-1954-offset-change', date: '1954-03-21', localTime: '12:00', oracle: { kind: 'standard_offset_change', utcOffsetBeforeMinutes: 540, utcOffsetAfterMinutes: 510, sourceRule: 'Asia/Seoul 9:00 -> 8:30 on 1954-03-21' }, expectedEngine: 'historical_offset_unverified' },
      { id: 'tz-rok-1987-dst-start-gap', date: '1987-05-10', localTime: '02:30', oracle: { kind: 'dst_gap', utcOffsetBeforeMinutes: 540, utcOffsetAfterMinutes: 600, sourceRule: 'ROK 1987 1988 May Sun>=8 2:00 1:00 D' }, expectedEngine: 'dst_nonexistent_local_time' },
      { id: 'tz-rok-1987-dst-end-overlap', date: '1987-10-11', localTime: '02:30', oracle: { kind: 'dst_overlap', utcOffsetBeforeMinutes: 600, utcOffsetAfterMinutes: 540, sourceRule: 'ROK 1987 1988 Oct Sun>=8 3:00 0 S' }, expectedEngine: 'dst_ambiguous_local_time' },
      { id: 'tz-rok-1988-dst-start-gap', date: '1988-05-08', localTime: '02:30', oracle: { kind: 'dst_gap', utcOffsetBeforeMinutes: 540, utcOffsetAfterMinutes: 600, sourceRule: 'ROK 1987 1988 May Sun>=8 2:00 1:00 D' }, expectedEngine: 'dst_nonexistent_local_time' },
      { id: 'tz-rok-1988-dst-end-overlap', date: '1988-10-09', localTime: '02:30', oracle: { kind: 'dst_overlap', utcOffsetBeforeMinutes: 600, utcOffsetAfterMinutes: 540, sourceRule: 'ROK 1987 1988 Oct Sun>=8 3:00 0 S' }, expectedEngine: 'dst_ambiguous_local_time' },
      { id: 'tz-seoul-current-standard-kst', date: '2026-08-10', localTime: '12:00', oracle: { kind: 'standard_time', utcOffsetMinutes: 540, sourceRule: 'KRISS current KST = UTC+9; IANA Asia/Seoul no ROK DST after 1988' }, expectedEngine: 'normal_standard_time' },
    ],
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(resolve(outputDir, 'sourceInventory.json'), canonical(sourceInventory))
  await writeFile(resolve(outputDir, 'corpus.json'), canonical(corpus))
  process.stdout.write(JSON.stringify({ outputDir, sourceCount: sourceInventory.sources.length, captureCount: captures.length, kasiRowCount: kasiRows.length, hkoRowCount: hkoRows.length, usnoRowCount: usnoRows.length, timezoneRowCount: corpus.timezoneRows.length }, null, 2) + '\n')
}

const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--')) args.set(process.argv[index].slice(2), process.argv[index + 1] || true)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const capturedAt = String(args.get('captured-at') || DEFAULT_CAPTURE_DATE)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)) throw new Error('--captured-at must be YYYY-MM-DD')
  const outputDir = resolve(String(args.get('output') || DEFAULT_OUTPUT))
  await buildInputs({ capturedAt, outputDir })
}
