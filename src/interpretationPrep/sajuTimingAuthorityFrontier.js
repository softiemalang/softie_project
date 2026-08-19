import { createHash } from 'node:crypto'

export const SAJU_TIMING_AUTHORITY_FRONTIER_SCHEMA = 'saju-timing-authority-frontier-v0'
export const SAJU_TIMING_AUTHORITY_FRONTIER_VERSION = '0.1.0'
export const SAJU_TIMING_RAW_TEXT_CONSUMPTION = 'raw_text_not_verified_fact_or_interpretation'

export const TIMING_FRONTIER_IDS = Object.freeze([
  'year-month-boundary',
  'zi-day-boundary',
  'true-solar-location',
  'dayun-direction-start-age',
])

export const TIMING_CLAIM_STATUSES = Object.freeze([
  'scoped_modern_convention',
  'scoped_transmitted_rule',
  'conflicting_lineage_unresolved',
  'astronomy_method_only',
  'implementation_policy_source_unresolved',
])

export const TIMING_INDEPENDENCE_STATUSES = Object.freeze([
  'partial',
  'method_only',
  'not_established',
])

export const TIMING_CONFIDENCE_LEVELS = Object.freeze([
  'scoped',
  'unresolved',
])

export const TIMING_AUTHORITY_STATUSES = Object.freeze([
  'authority_supported',
  'lineage_specific',
  'modern_policy',
  'conflicting_authority',
  'insufficient_evidence',
  'unsupported',
])

export const TIMING_SOURCES = Object.freeze([
  {
    sourceId: 'source.yuanhai-zi-ping.web-witness',
    title: '渊海子平',
    sourceClass: 'classical_text_web_witness',
    authorityScope: 'classical 子平 text witness for seasonal/month-command language and day-master framing',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/zh-hans/淵海子平大全',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'unresolved_web_transmission',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.sanming-tonghui.web-witness',
    title: '三命通會 卷二',
    sourceClass: 'classical_text_web_witness',
    authorityScope: 'classical/late transmitted witness for month-stem derivation and 大運 direction/start-age text',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/wiki/三命通會/卷二',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'unresolved_web_transmission',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.gujin-tushu-wuhu-web-witness',
    title: '欽定古今圖書集成 歲功典 干支部',
    sourceClass: 'later_compendium_web_witness',
    authorityScope: 'later compendium witness for the 五虎遁 formula; page is explicitly unproofed',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/wiki/Page:Gujin_Tushu_Jicheng,_Volume_476_(1700-1725).djvu/97',
    locatorPolicy: 'scan page and HTML line numbers',
    editionIdentity: 'unresolved_scan_transmission',
    sourceIdentityStatus: 'identified_page_unproofed',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.xintangshu-calendar.web-witness',
    title: '新唐書 卷二十五 志第十五 歷一',
    sourceClass: 'historical_calendar_primary_witness',
    authorityScope: 'historical calendar-system evidence for 子半/子初/子正 discussion; not a Saju prescription',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/zh-hans/新唐書/卷025',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'identified_work_web_witness',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.lelue-biaowei.web-witness',
    title: '樂律表微 四庫全書本 卷三',
    sourceClass: 'later_literary_time_boundary_witness',
    authorityScope: 'later music-theory text quoting a 子初/子正 split; not an identified Saju rule source',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/wiki/樂律表微_(四庫全書本)/卷3',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'identified_siku_web_witness',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.tianjing-huowen.web-witness',
    title: '天經或問 四庫全書本 卷三',
    sourceClass: 'later_astronomical_time_witness',
    authorityScope: 'later astronomical text describing the start/end inside 子時; not an identified Saju rule source',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/wiki/天經或問_(四庫全書本)/卷3',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'identified_siku_web_witness',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.ditian-sui-chanwei.web-witness',
    title: '滴天髓闡微',
    sourceClass: 'later_interpretive_classical_witness',
    authorityScope: 'late interpretive witness for intra-hour seasonal use and locality language; it does not prescribe a day-pillar rollover',
    publisher: 'Wikisource',
    url: 'https://zh.wikisource.org/zh-hans/滴天髓闡微',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'unresolved_commentary_transmission',
    sourceIdentityStatus: 'identified_web_witness_edition_unresolved',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.cma-ganzhi-calendar-explainer',
    title: '立春是属相的分界线吗？',
    sourceClass: 'modern_official_calendar_explainer',
    authorityScope: 'modern official explanation of the 干支历/立春 convention; not classical Saju semantic authority',
    publisher: '中国气象局 / 中国气象报',
    url: 'https://www.cma.gov.cn/kppd/kppdsytj/201602/t20160205-303710.html',
    locatorPolicy: 'article text and paragraph position',
    editionIdentity: 'identified_official_web_article',
    sourceIdentityStatus: 'identified_official_web_witness',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.usno-equation-of-time',
    title: 'The Equation of Time',
    sourceClass: 'astronomy_authority',
    authorityScope: 'astronomical definitions of apparent/mean solar time, longitude, civil time, and equation of time',
    publisher: 'U.S. Naval Observatory',
    url: 'https://aa.usno.navy.mil/faq/eqtime',
    locatorPolicy: 'HTML line numbers from the retrieved page',
    editionIdentity: 'identified_official_web_page',
    sourceIdentityStatus: 'identified_official_web_witness',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.noaa-solar-equations',
    title: 'General Solar Position Calculations',
    sourceClass: 'astronomy_method_authority',
    authorityScope: 'equation-of-time and true-solar-time calculation formula; not a Saju policy source',
    publisher: 'NOAA Global Monitoring Division',
    url: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF',
    locatorPolicy: 'PDF page and line labels from the retrieved document',
    editionIdentity: 'identified_official_web_pdf',
    sourceIdentityStatus: 'identified_official_web_witness',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.iana-tz-theory',
    title: 'Theory and pragmatics of the tz code and data',
    sourceClass: 'civil_time_database_authority',
    authorityScope: 'historical civil-time and timezone-data scope/limitations; not a Saju policy source',
    publisher: 'IANA',
    url: 'https://www.iana.org/time-zones/theory',
    locatorPolicy: 'HTML section and paragraph position',
    editionIdentity: 'identified_official_web_page',
    sourceIdentityStatus: 'identified_official_web_witness',
    externalByteHashStatus: 'not_observed',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.local-saju-classics-grounding-artifact',
    title: 'Local Saju five-classics grounding artifact',
    sourceClass: 'repository_provenance_artifact',
    authorityScope: 'local PDF byte identities and locator observations; no claim promotion or semantic authority',
    path: 'artifacts/saju-five-classics-grounding-v0/complete.json',
    locatorPolicy: 'artifact researchUnit/observation references',
    editionIdentity: 'unresolved_local_pdf_editions',
    sourceIdentityStatus: 'artifact_identity_preserved_semantic_authority_unresolved',
    externalByteHashStatus: 'artifact_byte_hash_recorded_by_existing_checker',
    retrievedOn: '2026-08-14',
  },
  {
    sourceId: 'source.nlc.yuanhai-ziping.1926.v1',
    title: '淵海子平 子平真詮 第1卷',
    sourceClass: 'institutional_direct_scan_mirror',
    authorityScope: 'institutionally identified 1926 scan witness for a clause-level 大運 conversion passage; no exact first-start algorithm is admitted',
    publisher: 'National Library of China (NLC)',
    url: 'https://commons.wikimedia.org/wiki/File:NLC416-13jh002326-46442_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE_%E7%AC%AC1%E5%8D%B7.pdf',
    locatorPolicy: 'PDF page and printed folio from a direct rendered scan review',
    editionIdentity: '民國十五年[1926]文明書局印行; 秦慎安校勘; combined-title scan',
    sourceIdentityStatus: 'identified_1926_scan_item_candidate',
    externalByteHashStatus: 'scratch_sha256_observed_not_retained',
    retrievedOn: '2026-08-16',
  },
])

export const TIMING_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.yuanhai.seasonal-month-command',
    sourceId: 'source.yuanhai-zi-ping.web-witness',
    frontierId: 'year-month-boundary',
    locator: { kind: 'html_lines', value: '246-272' },
    rawText: { text: '立春念三丙火用，馀日甲木旺提纲。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The web witness lists 立春 and subsequent solar-term day ranges in a seasonal/month-command song.',
    normalizedRule: 'Solar-term timing is relevant to month-command/seasonal scope; this locator does not by itself state the year-pillar rollover instant.',
    scopeBoundary: 'seasonal/month-command text witness only; edition identity and exact Saju year-boundary authority unresolved',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'not_promoted', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.yuanhai.month-from-year',
    sourceId: 'source.yuanhai-zi-ping.web-witness',
    frontierId: 'year-month-boundary',
    locator: { kind: 'html_lines', value: '296-304' },
    rawText: { text: '以日为主，年为本，月为提纲。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The witness distinguishes year as root and month as the governing outline in its four-pillar framing.',
    normalizedRule: 'Year/month positions have distinct roles; this is not an exact prescription for 立春, 節, or month-stem calculation.',
    scopeBoundary: 'structural framing only; no exact boundary or stem-transition authority promoted',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'not_promoted', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.sanming.month-stem-five-tiger',
    sourceId: 'source.sanming-tonghui.web-witness',
    frontierId: 'year-month-boundary',
    locator: { kind: 'html_lines', value: '266-276' },
    rawText: { text: '甲己之年，正月起丙寅。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The witness states that month is derived from year and gives the 五虎遁 sequence, including 甲己 years starting 丙寅.',
    normalizedRule: 'Month stem/branch progression is keyed to the year stem through the 五虎遁 relation and then proceeds through the months.',
    scopeBoundary: 'transmitted rule witness; exact edition lineage and whether the modern implementation scope is equivalent remain unresolved',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'not_promoted', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.gujin.five-tiger-formula',
    sourceId: 'source.gujin-tushu-wuhu-web-witness',
    frontierId: 'year-month-boundary',
    locator: { kind: 'scan_page_html_lines', value: 'page 97; lines 115,176-188' },
    rawText: { text: '甲己之年丙作首', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'An unproofed compendium page records the compact 五虎遁 formula and explicitly labels the page as not proofread.',
    normalizedRule: 'The formula corroborates a year-stem-to-month-stem mapping as a later transmission, but cannot close source authority.',
    scopeBoundary: 'later compendium and unproofed scan; corroboration only, not independent semantic authority',
    admission: { sourceIdentity: 'identified_page_unproofed', claimVerification: 'not_promoted', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.cma.ipchun-year-convention',
    sourceId: 'source.cma-ganzhi-calendar-explainer',
    frontierId: 'year-month-boundary',
    locator: { kind: 'article_paragraphs', value: 'article body; paragraphs defining 干支历 and 立春' },
    rawText: { text: '干支历严格地以立春作为一年的开始', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The modern official explainer says the 干支历 uses the solar position, identifies 315° for 立春, and treats the exact 立春 moment as the year boundary.',
    normalizedRule: 'Modern official convention: year rollover is the exact 立春 instant rather than lunar New Year.',
    scopeBoundary: 'modern official calendar explanation; it does not establish classical 子平 semantic authority or settle every historical lineage',
    admission: { sourceIdentity: 'identified_official_web_witness', claimVerification: 'scoped_only', semanticAuthority: 'modern_convention_not_classical_authority' },
  },
  {
    observationId: 'obs.xintang.zi-half-calendar',
    sourceId: 'source.xintangshu-calendar.web-witness',
    frontierId: 'zi-day-boundary',
    locator: { kind: 'html_lines', value: '118-129' },
    rawText: { text: '命辰起子半；古历分日，起于子半。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The historical calendar discussion records a 子半 convention and contrasts 子初 with 子半 in a calendar dispute.',
    normalizedRule: 'Historical calendar systems include a 子半/子初 distinction; this is evidence about calendar timekeeping, not a direct Saju day-pillar rule.',
    scopeBoundary: 'historical calendar authority only; no direct 四柱 day-pillar rollover prescription',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'calendar_scope_not_saju_authority' },
  },
  {
    observationId: 'obs.lelue.zi-first-second-quarter',
    sourceId: 'source.lelue-biaowei.web-witness',
    frontierId: 'zi-day-boundary',
    locator: { kind: 'html_lines', value: '146-148' },
    rawText: { text: '子时初四刻属前一日 正四刻属后日', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'A later Siku text, while discussing musical律 and citing Zhu Xi, describes the first/final quarters of 子時 as belonging to adjacent days.',
    normalizedRule: 'A 子正 split can assign the first half of 子時 to the preceding day and the second half to the following day.',
    scopeBoundary: 'later music-theory transmission; not a direct identified Saju day-pillar prescription',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.tianjing.zi-midpoint-day-start',
    sourceId: 'source.tianjing-huowen.web-witness',
    frontierId: 'zi-day-boundary',
    locator: { kind: 'html_lines', value: '176-177' },
    rawText: { text: '子对中正初之刻为本日始时', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The astronomical text locates the beginning of the day at the first quarter of 子正 and the end at late 子時.',
    normalizedRule: 'A civil-midnight/子正 day boundary is one attested later timekeeping convention, while the late 子時 remains attached to the prior day.',
    scopeBoundary: 'later astronomical timekeeping witness; it does not identify the authoritative Saju lineage for day-pillars',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.ditian.early-night-zi',
    sourceId: 'source.ditian-sui-chanwei.web-witness',
    frontierId: 'zi-day-boundary',
    locator: { kind: 'html_lines', value: '2555-2562' },
    rawText: { text: '子时前三刻，三分壬水用事；后四亥，七分癸水用事。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The commentary divides 子時 into earlier/later intra-hour use and explicitly names the earlier portion 夜子时; it also mentions locality differences.',
    normalizedRule: 'Early/late 子時 is a lineage-specific intra-hour subperiod convention, not proof that the day pillar must roll at 23:00 or 00:00.',
    scopeBoundary: 'late interpretive commentary; exact day-pillar rollover and location correction remain unstated',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.usno.local-apparent-solar-time',
    sourceId: 'source.usno-equation-of-time',
    frontierId: 'true-solar-location',
    locator: { kind: 'html_lines', value: '49-71,74-92' },
    rawText: { text: 'apparent solar time is different for every longitude', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'USNO distinguishes apparent and mean solar time, states that local apparent solar time depends on longitude, and separates civil time from local solar time.',
    normalizedRule: 'Astronomical local apparent solar time requires observer longitude plus the date-dependent equation of time; civil time is only an approximation at the zone meridian without daylight time.',
    scopeBoundary: 'astronomy definition and method only; no Saju authority claim',
    admission: { sourceIdentity: 'identified_official_web_witness', claimVerification: 'scoped_only', semanticAuthority: 'astronomy_authority_not_saju_authority' },
  },
  {
    observationId: 'obs.usno.equation-of-time-definition',
    sourceId: 'source.usno-equation-of-time',
    frontierId: 'true-solar-location',
    locator: { kind: 'html_lines', value: '49-51' },
    rawText: { text: 'apparent solar time minus mean solar time', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'USNO defines the equation of time as the difference between apparent solar time and mean solar time.',
    normalizedRule: 'Equation of time is a date-dependent astronomical term distinct from the longitude correction and civil timezone offset.',
    scopeBoundary: 'astronomy definition and method only; no Saju authority claim',
    admission: { sourceIdentity: 'identified_official_web_witness', claimVerification: 'scoped_only', semanticAuthority: 'astronomy_authority_not_saju_authority' },
  },
  {
    observationId: 'obs.noaa.true-solar-time-formula',
    sourceId: 'source.noaa-solar-equations',
    frontierId: 'true-solar-location',
    locator: { kind: 'pdf_lines', value: 'page 0; lines 15-21' },
    rawText: { text: 'time_offset = eqtime + 4*longitude – 60*timezone', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'NOAA provides the equation-of-time, longitude, timezone, and true-solar-time formula used for an astronomical clock correction.',
    normalizedRule: 'The implementation can calculate an apparent-solar correction from equation of time, longitude, and civil timezone offset.',
    scopeBoundary: 'formula authority only; the policy that Saju must use this correction is unresolved',
    admission: { sourceIdentity: 'identified_official_web_witness', claimVerification: 'scoped_only', semanticAuthority: 'astronomy_authority_not_saju_authority' },
  },
  {
    observationId: 'obs.iana.historical-civil-time-scope',
    sourceId: 'source.iana-tz-theory',
    frontierId: 'true-solar-location',
    locator: { kind: 'html_sections', value: 'Scope of the tz database; Accuracy of the tz database' },
    rawText: { text: 'attempts to record the history and predicted future of civil time scales', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'IANA describes timezone data as a record of civil-time history but warns that pre-1970 coverage is incomplete and not authoritative for all past times.',
    normalizedRule: 'Historical birth-time conversion needs a location-specific civil-time rule and must expose pre-standard-time uncertainty rather than silently treating a modern offset as historical truth.',
    scopeBoundary: 'civil-time data boundary; no Saju semantic authority',
    admission: { sourceIdentity: 'identified_official_web_witness', claimVerification: 'scoped_only', semanticAuthority: 'civil_time_authority_not_saju_authority' },
  },
  {
    observationId: 'obs.local.frontier-preserves-timing-gap',
    sourceId: 'source.local-saju-classics-grounding-artifact',
    frontierId: 'true-solar-location',
    locator: { kind: 'artifact_refs', value: 'saju-five-classics-grounding-v0 source observations and admission boundary' },
    rawText: { text: 'external source identity and claim-level semantic authority remain unresolved', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The existing local provenance artifact preserves byte-hashed PDF identities and explicitly keeps source identity, claim verification, and semantic authority separate.',
    normalizedRule: 'Local PDF observations can preserve a research frontier but cannot promote the four timing policies without an identified, independently checked source lineage.',
    scopeBoundary: 'repository provenance boundary; this is not an independent classical authority',
    admission: { sourceIdentity: 'artifact_identity_preserved_semantic_authority_unresolved', claimVerification: 'not_promoted', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.sanming.dayun-forward-direction',
    sourceId: 'source.sanming-tonghui.web-witness',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'html_lines', value: '300-305' },
    rawText: { text: '阳男阴女，大运以生日后未来节气日时为数，顺而行之；', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The witness assigns forward 大運 movement to yang-year males and yin-year females and counts from the future solar-term date/time.',
    normalizedRule: 'For a forward case, use the next relevant 節 and move the 大運 sequence forward.',
    scopeBoundary: 'transmitted 大運 rule witness; exact edition and implementation equivalence remain unresolved',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.sanming.dayun-backward-direction',
    sourceId: 'source.sanming-tonghui.web-witness',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'html_lines', value: '300-305' },
    rawText: { text: '阴男阳女，以生日前过去节气日时为数，逆而行之。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The witness assigns backward 大運 movement to yin-year males and yang-year females and counts from the past solar-term date/time.',
    normalizedRule: 'For a backward case, use the previous relevant 節 and move the 大運 sequence backward.',
    scopeBoundary: 'transmitted 大運 rule witness; exact edition and implementation equivalence remain unresolved',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.sanming.dayun-distance-conversion',
    sourceId: 'source.sanming-tonghui.web-witness',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'html_lines', value: '300-305' },
    rawText: { text: '古人以大运则一辰十岁，折除以三日为年者何？', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The witness explains the traditional symbolic conversion as one 辰/ten years and three elapsed days/one year.',
    normalizedRule: 'Use the three-days-to-one-year conversion family, while keeping time granularity, rounding, and calendar arithmetic as separate unresolved policy details.',
    scopeBoundary: 'transmitted conversion explanation; exact arithmetic equivalence to the repository implementation remains unresolved',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.sanming.dayun-start-example',
    sourceId: 'source.sanming-tonghui.web-witness',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'html_lines', value: '300-305' },
    rawText: { text: '计六百三十日，乃一岁奇九月之大运；起于丁丑。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The worked example converts the counted interval into a first 大運 age and names the first period pillar as 丁丑.',
    normalizedRule: 'A first 大運 start date/pillar is derived from the birth-to-term interval and the month-pillar sequence, but the exact calendar-date reconstruction remains unresolved.',
    scopeBoundary: 'worked example within a transmitted 大運 witness; not an edition-stable universal arithmetic contract',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.nlc.yuanhai.qilu-conversion-1926',
    sourceId: 'source.nlc.yuanhai-ziping.1926.v1',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'attached_pdf_scan', value: 'NLC416-13jh002326-46442 PDF pages 79–80 / printed folios 三三–三四', sourceByteSha256: '96bc14ccb8fd6f90fb5ec33784846a9067f2cad45ab9730f12bdf9846ea7c265', sourceByteLength: 2690379 },
    rawText: { text: '播四時以為年；運行則一辰十載；折除乃三日為年。', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'Direct visual review of the attached NLC 1926 scan records a 珞琚子消息賦 passage on printed folios 三三–三四 containing the three-days/one-year and one-辰/ten-years clause family.',
    normalizedRule: 'The passage is clause-level corroboration for a three-days-to-one-year conversion family; it does not specify the repository exact first-start age/date, rounding order, fractional-age decomposition, or calendar clamping.',
    scopeBoundary: 'clause-level corroboration only; no exact first-start age/date/rounding/clamping or semantic authority',
    admission: { sourceIdentity: 'identified_1926_scan_item_candidate', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
  {
    observationId: 'obs.yuanhai.dayun-month-progression',
    sourceId: 'source.yuanhai-zi-ping.web-witness',
    frontierId: 'dayun-direction-start-age',
    locator: { kind: 'html_lines', value: '348-364' },
    rawText: { text: '今运就月上起', isVerifiedFact: false, consumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION },
    observedFact: 'The text says 大運 is started from the month position and illustrates successive period-pillar transitions, while warning that examples are not to be applied mechanically.',
    normalizedRule: 'The first 大運 pillar is stepped from the natal month pillar in the selected direction, then advances by one pillar per ten-year period.',
    scopeBoundary: 'classical text witness for month-based progression; exact first-start-date arithmetic is not supplied here',
    admission: { sourceIdentity: 'identified_web_witness_edition_unresolved', claimVerification: 'scoped_only', semanticAuthority: 'not_established' },
  },
])

export const TIMING_IMPLEMENTATION_REFERENCES = Object.freeze([
  { refId: 'impl.solar-terms.boundaries', path: 'src/saju/engine/solarTerms.js', lineStart: 4, lineEnd: 115, observedPolicy: 'Meeus/NOAA apparent solar longitude; 12 30-degree month boundaries; 315-degree 立春 year rollover; KST-only conversion; 20-minute uncertainty flag' },
  { refId: 'impl.four-pillars.month-stem', path: 'src/saju/engine/fourPillars.js', lineStart: 77, lineEnd: 92, observedPolicy: 'year pillar from baziYear; month branch from monthIndex; month stem from year-stem offset' },
  { refId: 'impl.four-pillars.zi-day', path: 'src/saju/engine/fourPillars.js', lineStart: 99, lineEnd: 134, observedPolicy: 'solar-midnight-split-zi default; optional zi-start/rollDayAtZiHour branch; corrected solar date shifts day index' },
  { refId: 'impl.four-pillars.solar-correction', path: 'src/saju/engine/fourPillars.js', lineStart: 7, lineEnd: 27, observedPolicy: 'Asia/Seoul, standard meridian 135 degrees, default longitude fallback and apparent-solar profile' },
  { refId: 'impl.solar-time.equation', path: 'src/saju/engine/solarTime.js', lineStart: 1, lineEnd: 33, observedPolicy: 'NOAA fractional-year equation of time' },
  { refId: 'impl.adapter.location-history', path: 'src/interpretationPrep/sajuAdapter.js', lineStart: 30, lineEnd: 72, observedPolicy: 'domestic location candidates and pre-1961-08-10 historical timezone verification boundary' },
  { refId: 'impl.adapter.location-probe', path: 'src/interpretationPrep/sajuAdapter.js', lineStart: 671, lineEnd: 695, observedPolicy: 'Korean reference-city longitude candidates can change core pillars and require verification' },
  { refId: 'impl.timing.dayun', path: 'src/interpretationPrep/sajuTimingRules.js', lineStart: 137, lineEnd: 190, observedPolicy: 'distanceMinutes/12 symbolic days; round; 360-day year and 30-day month decomposition; year-stem polarity/gender direction; adjacent boundary; month-pillar stepping' },
  { refId: 'impl.timing.boundary-solver', path: 'src/saju/engine/solarTerms.js', lineStart: 118, lineEnd: 149, observedPolicy: 'numerical adjacent Bazi month-boundary solver for forward/backward 大運 distance' },
])

const TIMING_CLAIM_DEFINITIONS = [
  {
    claimId: 'claim.year-rollover-立春',
    frontierId: 'year-month-boundary',
    proposition: 'Year pillar rollover is assigned at the exact 立春 instant rather than lunar New Year.',
    normalizedRule: 'Use the solar longitude 315-degree boundary as the year transition, with a date/time boundary rather than a date-only approximation.',
    status: 'scoped_modern_convention',
    independence: { status: 'partial', basis: 'modern official calendar witness plus classical seasonal witness; no edition-stable classical Saju year-boundary witness' },
    confidence: { level: 'scoped', basis: 'the exact 立春 convention is directly observed in the modern official source, while classical semantic authority remains unresolved' },
    authorityStatus: 'modern_policy',
    sourceObservationIds: ['obs.cma.ipchun-year-convention', 'obs.yuanhai.seasonal-month-command'],
    implementationRefIds: ['impl.solar-terms.boundaries', 'impl.four-pillars.month-stem'],
    competingPolicies: ['lunar_new_year_rollover', 'date_only_立春_rollover', 'historical_lineage_not_yet_identified'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.classical-explicit-year-boundary'],
  },
  {
    claimId: 'claim.month-branch-節-boundary',
    frontierId: 'year-month-boundary',
    proposition: 'Month branch changes at the solar-term 節 boundary, using the twelve 30-degree month-entry points.',
    normalizedRule: 'Partition the solar year at the twelve month-entry solar longitudes beginning with 315 degrees; the exact boundary instant controls the month branch.',
    status: 'implementation_policy_source_unresolved',
    independence: { status: 'partial', basis: 'seasonal classical witness and modern solar-calendar witness are distinct scopes, but edition independence and Saju semantic authority are unresolved' },
    confidence: { level: 'unresolved', basis: 'seasonal/month-command language and modern convention are observed, but an explicit Saju month-rollover prescription is not admitted' },
    authorityStatus: 'insufficient_evidence',
    sourceObservationIds: ['obs.yuanhai.seasonal-month-command', 'obs.cma.ipchun-year-convention'],
    implementationRefIds: ['impl.solar-terms.boundaries'],
    competingPolicies: ['lunar_month_boundary', 'date_only_solar_term_boundary', '中氣_or_non-節_month_policy'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.independent-calendar-corpus'],
  },
  {
    claimId: 'claim.month-stem-五虎遁',
    frontierId: 'year-month-boundary',
    proposition: 'Month stem is derived from the year stem by the 五虎遁 rule and then advanced with the month branch.',
    normalizedRule: 'Apply the year-stem keyed month-stem start and advance the stem with the month index; do not infer the mapping from output coincidence alone.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: '三命通会 witness and a later unproofed compendium witness record the same formula family; transmission independence is not established' },
    confidence: { level: 'scoped', basis: 'the 五虎遁 relation is textually observed, but edition identity and implementation equivalence remain unresolved' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.sanming.month-stem-five-tiger', 'obs.gujin.five-tiger-formula'],
    implementationRefIds: ['impl.four-pillars.month-stem'],
    competingPolicies: ['alternate_month-stem_transmission', 'source-edition-specific_variant'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity'],
  },
  {
    claimId: 'claim.day-boundary-zi-variants',
    frontierId: 'zi-day-boundary',
    proposition: 'The day boundary in 子時 has multiple attested variants: 子半, 子初, 子正, and split early/night 子時.',
    normalizedRule: 'Keep civil midnight/子正, 子初/23:00, 子半, and early/night split as separate candidate policies until a declared Saju lineage resolves them.',
    status: 'conflicting_lineage_unresolved',
    independence: { status: 'not_established', basis: 'the witnesses span historical calendar, later music theory, later astronomy, and later commentary rather than one independently verified Saju lineage' },
    confidence: { level: 'unresolved', basis: 'the source landscape is observed, but it does not adjudicate one day-pillar rollover convention' },
    authorityStatus: 'conflicting_authority',
    sourceObservationIds: ['obs.xintang.zi-half-calendar', 'obs.lelue.zi-first-second-quarter', 'obs.tianjing.zi-midpoint-day-start', 'obs.ditian.early-night-zi'],
    implementationRefIds: ['impl.four-pillars.zi-day'],
    competingPolicies: ['civil_midnight_or_子正', '子初_at_23_00', '子半', '早子_夜子_split'],
    unresolvedBlockerIds: ['blocker.zi-lineage-conflict', 'blocker.classical-edition-identity'],
  },
  {
    claimId: 'claim.day-boundary-saju-authority',
    frontierId: 'zi-day-boundary',
    proposition: 'The observed source set does not yet establish which 子時 boundary an authoritative Saju lineage requires for the day pillar.',
    normalizedRule: 'Do not promote the repository default or the alternative option to classical authority; preserve the selected boundary as implementation policy.',
    status: 'implementation_policy_source_unresolved',
    independence: { status: 'not_established', basis: 'the admitted source set contains no direct, edition-stable Saju day-pillar rollover prescription' },
    confidence: { level: 'unresolved', basis: 'the implementation default is a policy choice, not a source-verified conclusion' },
    authorityStatus: 'insufficient_evidence',
    sourceObservationIds: ['obs.xintang.zi-half-calendar', 'obs.lelue.zi-first-second-quarter', 'obs.ditian.early-night-zi', 'obs.local.frontier-preserves-timing-gap'],
    implementationRefIds: ['impl.four-pillars.zi-day'],
    competingPolicies: ['repository_default_solar_midnight_split', 'legacy_zi_start_option', 'source_lineage_to_be_selected'],
    unresolvedBlockerIds: ['blocker.zi-lineage-conflict', 'blocker.classical-explicit-day-rollover'],
  },
  {
    claimId: 'claim.longitude-correction',
    frontierId: 'true-solar-location',
    proposition: 'Local apparent solar time changes with observer longitude relative to the civil-time zone meridian.',
    normalizedRule: 'Apply the longitude difference from the civil zone meridian as a solar-time correction after resolving the civil-time instant.',
    status: 'astronomy_method_only',
    independence: { status: 'method_only', basis: 'USNO definitions and NOAA formula are independent astronomy authorities, not Saju semantic witnesses' },
    confidence: { level: 'scoped', basis: 'the longitude method is explicit and deterministic, while its Saju policy requirement is separate and unresolved' },
    authorityStatus: 'modern_policy',
    sourceObservationIds: ['obs.usno.local-apparent-solar-time', 'obs.noaa.true-solar-time-formula'],
    implementationRefIds: ['impl.four-pillars.solar-correction'],
    competingPolicies: ['civil_time_only', 'zone_meridian_only', 'longitude_corrected_solar_time'],
    unresolvedBlockerIds: ['blocker.saju-solar-time-authority'],
  },
  {
    claimId: 'claim.equation-of-time',
    frontierId: 'true-solar-location',
    proposition: 'The equation of time is a date-dependent difference between apparent solar time and mean/civil clock time.',
    normalizedRule: 'Apply the date-dependent equation-of-time term as a separate correction from longitude and timezone offset.',
    status: 'astronomy_method_only',
    independence: { status: 'method_only', basis: 'USNO defines the apparent/mean distinction and NOAA gives the deterministic equation term; neither is Saju semantic authority' },
    confidence: { level: 'scoped', basis: 'the astronomical calculation is directly specified, but Saju adoption is not source-authorized' },
    authorityStatus: 'modern_policy',
    sourceObservationIds: ['obs.usno.equation-of-time-definition', 'obs.noaa.true-solar-time-formula'],
    implementationRefIds: ['impl.four-pillars.solar-correction', 'impl.solar-time.equation'],
    competingPolicies: ['no_equation_of_time', 'mean_solar_only', 'apparent_solar_with_equation_of_time'],
    unresolvedBlockerIds: ['blocker.saju-solar-time-authority'],
  },
  {
    claimId: 'claim.local-apparent-solar-time',
    frontierId: 'true-solar-location',
    proposition: 'Local apparent solar time is distinct from civil time and is the composed result of location, equation of time, and civil-time resolution.',
    normalizedRule: 'Compose the resolved historical civil instant, longitude correction, and equation-of-time term before applying any Saju hour/day boundary policy.',
    status: 'astronomy_method_only',
    independence: { status: 'method_only', basis: 'USNO and NOAA provide independent astronomy definitions/methods, not a Saju semantic requirement' },
    confidence: { level: 'scoped', basis: 'the composition is astronomically deterministic, while whether Saju requires it remains unresolved' },
    authorityStatus: 'modern_policy',
    sourceObservationIds: ['obs.usno.local-apparent-solar-time', 'obs.usno.equation-of-time-definition', 'obs.noaa.true-solar-time-formula'],
    implementationRefIds: ['impl.four-pillars.solar-correction', 'impl.solar-time.equation'],
    competingPolicies: ['civil_time_only', 'mean_solar_time_only', 'local_apparent_solar_time'],
    unresolvedBlockerIds: ['blocker.saju-solar-time-authority'],
  },
  {
    claimId: 'claim.saju-requires-true-solar-time',
    frontierId: 'true-solar-location',
    proposition: 'An explicit authoritative Saju source requiring longitude plus equation-of-time correction has not been located in the admitted source set.',
    normalizedRule: 'Treat true-solar correction as a repository/astronomy-backed policy, not as a source-authorized Saju requirement.',
    status: 'implementation_policy_source_unresolved',
    independence: { status: 'not_established', basis: 'no admitted classical or authoritative Saju witness requiring longitude plus equation-of-time correction was located' },
    confidence: { level: 'unresolved', basis: 'negative source finding is bounded to the admitted corpus and cannot prove universal absence' },
    authorityStatus: 'insufficient_evidence',
    sourceObservationIds: ['obs.usno.local-apparent-solar-time', 'obs.usno.equation-of-time-definition', 'obs.noaa.true-solar-time-formula', 'obs.local.frontier-preserves-timing-gap'],
    implementationRefIds: ['impl.four-pillars.solar-correction', 'impl.solar-time.equation'],
    competingPolicies: ['source_required_true_solar_time', 'source_required_mean_solar_time', 'civil_time_policy'],
    unresolvedBlockerIds: ['blocker.saju-solar-time-authority', 'blocker.classical-edition-identity'],
  },
  {
    claimId: 'claim.historical-timezone-location',
    frontierId: 'true-solar-location',
    proposition: 'Historical civil timezone, birth location/longitude, and local-time uncertainty are separate input and verification requirements.',
    normalizedRule: 'Resolve historical civil time and location before applying solar correction; expose unresolved pre-standard-time history rather than silently using modern KST.',
    status: 'astronomy_method_only',
    independence: { status: 'method_only', basis: 'USNO local-solar definitions and IANA civil-time scope are distinct authorities, but neither supplies Saju semantic policy' },
    confidence: { level: 'scoped', basis: 'the input and historical-time requirements are methodically supported, while the Saju-specific requirement remains unresolved' },
    authorityStatus: 'modern_policy',
    sourceObservationIds: ['obs.usno.local-apparent-solar-time', 'obs.iana.historical-civil-time-scope', 'obs.local.frontier-preserves-timing-gap'],
    implementationRefIds: ['impl.adapter.location-history', 'impl.adapter.location-probe', 'impl.four-pillars.solar-correction'],
    competingPolicies: ['fixed_Asia_Seoul_KST', 'historical_location_specific_civil_time', 'user_supplied_offset_without_history'],
    unresolvedBlockerIds: ['blocker.historical-civil-time', 'blocker.saju-solar-time-authority'],
  },
  {
    claimId: 'claim.dayun-direction',
    frontierId: 'dayun-direction-start-age',
    proposition: '大運 direction is forward for yang-year male or yin-year female and backward for yin-year male or yang-year female in the observed transmission.',
    normalizedRule: 'Select next or previous 節 using year-stem yin/yang and gender, then step the month-pillar sequence in that direction.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: 'one transmitted classical web witness explicitly states the direction rule; edition-stable independent confirmation is absent' },
    confidence: { level: 'scoped', basis: 'the rule is directly observed in the witness but not promoted beyond its lineage scope' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.sanming.dayun-forward-direction', 'obs.sanming.dayun-backward-direction'],
    implementationRefIds: ['impl.timing.dayun', 'impl.timing.boundary-solver'],
    competingPolicies: ['day_polarity_direction', 'year_pillar_polarity_direction', 'gender_independent_direction'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.dayun-exact-procedure'],
  },
  {
    claimId: 'claim.dayun-start-boundary-distance',
    frontierId: 'dayun-direction-start-age',
    proposition: '大運 direction counts the birth-to-next/previous solar-term day/time distance selected by the gender/year-polarity rule.',
    normalizedRule: 'For forward cases count from birth to the next relevant 節; for backward cases count from birth to the prior relevant 節, preserving date and time rather than date-only distance.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: 'the direction witnesses explicitly select future/past solar-term date/time, but edition-stable independent confirmation is absent' },
    confidence: { level: 'scoped', basis: 'the next/previous term and date/time counting rule are directly observed, while exact 節 class and arithmetic remain unresolved' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.sanming.dayun-forward-direction', 'obs.sanming.dayun-backward-direction'],
    implementationRefIds: ['impl.timing.dayun', 'impl.timing.boundary-solver'],
    competingPolicies: ['next_previous_節', 'next_previous_中氣', 'day_only_distance', 'day_and_time_distance'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.dayun-exact-procedure'],
  },
  {
    claimId: 'claim.dayun-start-age-conversion',
    frontierId: 'dayun-direction-start-age',
    proposition: 'The transmitted 大運 conversion maps the counted interval into symbolic years/months/days.',
    normalizedRule: 'Use the three-days-to-one-year conversion family and retain the repository’s 1 day = 4 months and 2 hours = 10 days decomposition as implementation detail pending exact source-equivalence verification.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: 'the conversion explanation is directly observed in one transmitted witness; exact arithmetic and edition-stable independent confirmation are absent' },
    confidence: { level: 'scoped', basis: 'the three-days-to-one-year relation is explicit, while rounding order and fractional calendar arithmetic remain unresolved' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.sanming.dayun-distance-conversion', 'obs.nlc.yuanhai.qilu-conversion-1926'],
    implementationRefIds: ['impl.timing.dayun'],
    competingPolicies: ['three_days_one_year', 'day_only_fractional_year', 'round_before_conversion', 'fractional_calendar_age'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.dayun-exact-procedure'],
  },
  {
    claimId: 'claim.dayun-first-start-date',
    frontierId: 'dayun-direction-start-age',
    proposition: 'The first 大運 start age/date and first period pillar are derived from the counted birth-to-term interval.',
    normalizedRule: 'Apply the selected conversion to the exact interval, add the resulting age to the birth instant/date, and seed the first period from the month-pillar progression; the worked example names 丁丑 as the first pillar.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: 'one transmitted worked example links counted interval, converted age, and first pillar; universal arithmetic equivalence is not independently established' },
    confidence: { level: 'scoped', basis: 'the example is textually observed, but the repository’s exact first calendar date has not been proven equivalent' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.sanming.dayun-distance-conversion', 'obs.sanming.dayun-start-example'],
    implementationRefIds: ['impl.timing.dayun', 'impl.timing.boundary-solver'],
    competingPolicies: ['add_converted_age_to_birth_date', 'calendar_reconstruction_from_example', 'fractional_start_date'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.dayun-exact-procedure'],
  },
  {
    claimId: 'claim.dayun-cycle-progression',
    frontierId: 'dayun-direction-start-age',
    proposition: 'After the first start date, 大運 progresses from the natal month pillar by one sexagenary pillar per ten-year period.',
    normalizedRule: 'Use the month pillar as the sequence seed, step ±1 per cycle, and calculate each ten-year interval from the first start date.',
    status: 'scoped_transmitted_rule',
    independence: { status: 'partial', basis: '渊海子平 and 三命通会 witnesses support month-based direction/progression, but transmission independence and exact procedure are unresolved' },
    confidence: { level: 'scoped', basis: 'month-pillar seeding and progression are observed within the cited textual scopes, not as a universally verified calculation contract' },
    authorityStatus: 'lineage_specific',
    sourceObservationIds: ['obs.yuanhai.dayun-month-progression', 'obs.sanming.dayun-forward-direction', 'obs.sanming.dayun-backward-direction'],
    implementationRefIds: ['impl.timing.dayun'],
    competingPolicies: ['month_pillar_seed', 'year_pillar_seed', 'source-specific_cycle_step'],
    unresolvedBlockerIds: ['blocker.classical-edition-identity', 'blocker.dayun-exact-procedure'],
  },
]

const sourceById = new Map(TIMING_SOURCES.map(source => [source.sourceId, source]))
const observationById = new Map(TIMING_OBSERVATIONS.map(observation => [observation.observationId, observation]))

const buildClaimEvidence = claim => claim.sourceObservationIds.map(observationId => {
  const observation = observationById.get(observationId)
  const source = sourceById.get(observation?.sourceId)
  if (!observation || !source) throw new Error(`missing source observation for ${claim.claimId}:${observationId}`)
  return {
    observationId,
    source: {
      sourceId: source.sourceId,
      title: source.title,
      url: source.url || null,
      path: source.path || null,
    },
    locator: observation.locator,
    rawEvidence: observation.rawText,
    normalizedMeaning: observation.normalizedRule,
    scopeBoundary: observation.scopeBoundary,
  }
})

export const TIMING_CLAIMS = Object.freeze(TIMING_CLAIM_DEFINITIONS.map(claim => ({
  ...claim,
  evidence: buildClaimEvidence(claim),
})))

export function buildTimingAuthoritySummary() {
  const byStatus = status => TIMING_CLAIMS.filter(claim => claim.authorityStatus === status).map(claim => claim.claimId).sort()
  return {
    closedAuthorityClaimIds: byStatus('authority_supported'),
    lineageSpecificClaimIds: byStatus('lineage_specific'),
    modernPolicyClaimIds: byStatus('modern_policy'),
    conflictingAuthorityClaimIds: byStatus('conflicting_authority'),
    insufficientEvidenceClaimIds: byStatus('insufficient_evidence'),
    unsupportedClaimIds: byStatus('unsupported'),
  }
}

export const TIMING_RELATIONS = Object.freeze([
  { relationId: 'rel.cma-supports-modern-ipchun', relationType: 'scoped_support', fromId: 'obs.cma.ipchun-year-convention', toId: 'claim.year-rollover-立春', basis: 'modern official convention matches the repository 315-degree boundary but is not classical Saju authority' },
  { relationId: 'rel.yuanhai-seasonal-limits-year-rollover', relationType: 'scope_limit', fromId: 'obs.yuanhai.seasonal-month-command', toId: 'claim.year-rollover-立春', basis: 'the observed seasonal song does not state the exact year-pillar rollover policy' },
  { relationId: 'rel.month-stem-two-witnesses', relationType: 'corroboration', fromId: 'obs.sanming.month-stem-five-tiger', toId: 'claim.month-stem-五虎遁', basis: 'the later compendium records the same family of year-stem keyed formula, but its page is unproofed' },
  { relationId: 'rel.zi-calendar-conflict', relationType: 'conflict', fromId: 'obs.xintang.zi-half-calendar', toId: 'claim.day-boundary-zi-variants', basis: '子半/子初 historical calendar discussion does not uniquely select a Saju day-pillar boundary' },
  { relationId: 'rel.zi-later-split', relationType: 'scoped_support', fromId: 'obs.lelue.zi-first-second-quarter', toId: 'claim.day-boundary-zi-variants', basis: 'later text records a first/final-quarter split across adjacent days' },
  { relationId: 'rel.zi-night-lineage', relationType: 'scoped_support', fromId: 'obs.ditian.early-night-zi', toId: 'claim.day-boundary-zi-variants', basis: 'later commentary names 夜子时 but does not prescribe day-pillar rollover' },
  { relationId: 'rel.zi-authority-blocked', relationType: 'blocks_promotion', fromId: 'claim.day-boundary-zi-variants', toId: 'claim.day-boundary-saju-authority', basis: 'multiple source scopes are observed without a single admitted Saju lineage' },
  { relationId: 'rel.usno-longitude', relationType: 'method_support', fromId: 'obs.usno.local-apparent-solar-time', toId: 'claim.longitude-correction', basis: 'USNO states that apparent solar time varies with longitude' },
  { relationId: 'rel.noaa-longitude', relationType: 'implementation_mapping', fromId: 'obs.noaa.true-solar-time-formula', toId: 'claim.longitude-correction', basis: 'NOAA includes the longitude term in the deterministic time-offset formula' },
  { relationId: 'rel.usno-equation', relationType: 'method_support', fromId: 'obs.usno.equation-of-time-definition', toId: 'claim.equation-of-time', basis: 'USNO defines equation of time as apparent solar time minus mean solar time' },
  { relationId: 'rel.noaa-equation', relationType: 'implementation_mapping', fromId: 'obs.noaa.true-solar-time-formula', toId: 'claim.equation-of-time', basis: 'NOAA includes eqtime as a separate term in the true-solar-time formula' },
  { relationId: 'rel.usno-noaa-astronomy', relationType: 'method_support', fromId: 'obs.usno.local-apparent-solar-time', toId: 'claim.local-apparent-solar-time', basis: 'USNO defines the concepts; NOAA supplies a deterministic calculation formula' },
  { relationId: 'rel.noaa-implementation', relationType: 'implementation_mapping', fromId: 'obs.noaa.true-solar-time-formula', toId: 'claim.local-apparent-solar-time', basis: 'the formula composes equation-of-time, longitude, timezone, and civil clock fields' },
  { relationId: 'rel.astronomy-not-saju-authority', relationType: 'scope_limit', fromId: 'claim.local-apparent-solar-time', toId: 'claim.saju-requires-true-solar-time', basis: 'astronomy method validity does not prove a Saju semantic requirement' },
  { relationId: 'rel.iana-historical-limit', relationType: 'scope_support', fromId: 'obs.iana.historical-civil-time-scope', toId: 'claim.historical-timezone-location', basis: 'historical civil-time data has explicit coverage and authority limitations' },
  { relationId: 'rel.dayun-source-forward', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-forward-direction', toId: 'claim.dayun-direction', basis: 'the observed text explicitly couples yang-year male/yin-year female with future-term counting and forward movement' },
  { relationId: 'rel.dayun-source-backward', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-backward-direction', toId: 'claim.dayun-direction', basis: 'the observed text explicitly couples yin-year male/yang-year female with past-term counting and backward movement' },
  { relationId: 'rel.dayun-source-distance-forward', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-forward-direction', toId: 'claim.dayun-start-boundary-distance', basis: 'forward cases count the birth-to-future solar-term date/time interval' },
  { relationId: 'rel.dayun-source-distance-backward', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-backward-direction', toId: 'claim.dayun-start-boundary-distance', basis: 'backward cases count the birth-to-past solar-term date/time interval' },
  { relationId: 'rel.dayun-source-conversion', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-distance-conversion', toId: 'claim.dayun-start-age-conversion', basis: 'the observed text states the one-辰/ten-year and three-days/one-year conversion family' },
  { relationId: 'rel.nlc-yuanhai-conversion-scope', relationType: 'scope_support', fromId: 'obs.nlc.yuanhai.qilu-conversion-1926', toId: 'claim.dayun-start-age-conversion', basis: 'NLC 46442 PDF pages 79–80 directly expose the same clause family, but the observation remains clause-level and does not close exact first-start arithmetic' },
  { relationId: 'rel.dayun-source-example', relationType: 'scoped_support', fromId: 'obs.sanming.dayun-start-example', toId: 'claim.dayun-first-start-date', basis: 'the worked example names the converted first period and its 丁丑 seed' },
  { relationId: 'rel.dayun-example-conversion', relationType: 'implementation_mapping', fromId: 'obs.sanming.dayun-distance-conversion', toId: 'claim.dayun-first-start-date', basis: 'the first-start example depends on the preceding symbolic conversion' },
  { relationId: 'rel.dayun-month-seed', relationType: 'scoped_support', fromId: 'obs.yuanhai.dayun-month-progression', toId: 'claim.dayun-cycle-progression', basis: 'the observed text says the 大運 sequence starts from the month position' },
  { relationId: 'rel.local-artifact-preserves-gaps', relationType: 'scope_limit', fromId: 'obs.local.frontier-preserves-timing-gap', toId: 'claim.saju-requires-true-solar-time', basis: 'the existing repository frontier preserves unresolved source identity and semantic authority' },
])

export const TIMING_BLOCKERS = Object.freeze([
  { blockerId: 'blocker.classical-edition-identity', status: 'open', blocking: true, description: 'Web witnesses and local PDF artifacts do not yet establish a byte-identified, edition-stable classical transmission for each timing rule.', impact: 'source authority and semantic promotion remain blocked' },
  { blockerId: 'blocker.classical-explicit-year-boundary', status: 'open', blocking: true, description: 'The observed classical locators do not explicitly bind the Saju year pillar to the exact 立春 instant; the strongest direct statement is a modern official convention.', impact: 'year-rollover authority remains scoped, not classical-verified' },
  { blockerId: 'blocker.independent-calendar-corpus', status: 'open', blocking: true, description: 'The current admitted corpus does not independently adjudicate every instant-sensitive year/month boundary across the intended historical range.', impact: 'boundary correctness cannot be generalized from scoped matches' },
  { blockerId: 'blocker.zi-lineage-conflict', status: 'open', blocking: true, description: '子半, 子初, 子正, and early/night 子時 evidence comes from different calendar, astronomical, and later interpretive scopes without a declared authoritative Saju lineage.', impact: 'day-pillar rollover and 早子/夜子 policy remain unresolved' },
  { blockerId: 'blocker.classical-explicit-day-rollover', status: 'open', blocking: true, description: 'The observed 子時 passages describe time subdivisions but do not establish one source-authorized Saju day-pillar rollover rule.', impact: 'default implementation boundary cannot be promoted' },
  { blockerId: 'blocker.saju-solar-time-authority', status: 'open', blocking: true, description: 'USNO/NOAA establish astronomical conversion, but an admitted classical or authoritative Saju source requiring longitude plus equation-of-time correction was not located.', impact: 'true-solar correction remains an implementation policy' },
  { blockerId: 'blocker.historical-civil-time', status: 'open', blocking: true, description: 'Historical civil-time and timezone data are location-specific and incomplete before modern standardization; current runtime is Asia/Seoul-only with a pre-1961 verification boundary.', impact: 'historical birth instants can remain unverified' },
  { blockerId: 'blocker.dayun-exact-procedure', status: 'open', blocking: true, description: 'The observed 大運 text does not settle every implementation detail: exact 節 class, hour counting granularity, rounding order, fractional-age arithmetic, and calendar clamping.', impact: 'direction/source family is scoped, but exact start date equivalence is not proven' },
])

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]))
}

export const canonicalSajuTimingAuthorityJson = (value) => `${JSON.stringify(sortKeys(value), null, 2)}\n`

export const sajuTimingAuthorityContentSha256 = (value) => {
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return createHash('sha256').update(canonicalSajuTimingAuthorityJson(copy)).digest('hex')
}

const ids = (records, key) => records.map(record => record[key])

export function buildSajuTimingAuthorityFrontier({ basisHead } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('basisHead is required')
  const payload = {
    schemaVersion: SAJU_TIMING_AUTHORITY_FRONTIER_SCHEMA,
    frontierVersion: SAJU_TIMING_AUTHORITY_FRONTIER_VERSION,
    verdictToken: 'partial_saju_timing_authority_frontier_advanced_uncommitted',
    system: 'saju',
    basisHead,
    scope: {
      sourceFirst: true,
      externalWebWitnessesRecorded: true,
      externalSourceByteHashesObserved: false,
      localArtifactByteIdentitiesReused: true,
      runtimeMutation: false,
      implementationTuning: false,
      interpretationGeneration: false,
      claimPromotion: false,
      readinessMutation: false,
      activationMutation: false,
      historicalArtifactRewrite: false,
    },
    sourcePolicy: {
      rawTextConsumption: SAJU_TIMING_RAW_TEXT_CONSUMPTION,
      rawTextIsVerifiedFact: false,
      externalWebWitnessesAre: 'locators_and_short_raw_snippets_only',
      classicalSemanticAuthority: 'not_established',
      calculationFactSource: 'repository_implementation_refs_only',
      sourceLineageAndSemanticAuthorityAreSeparate: true,
    },
    frontiers: TIMING_FRONTIER_IDS.map(frontierId => ({
      frontierId,
      status: 'blocked_source_authority_unresolved',
      claimIds: TIMING_CLAIMS.filter(claim => claim.frontierId === frontierId).map(claim => claim.claimId),
      observationIds: TIMING_OBSERVATIONS.filter(observation => observation.frontierId === frontierId).map(observation => observation.observationId),
      requiredDecision: frontierId === 'year-month-boundary'
        ? 'year rollover, 節 month rollover, and month-stem lineage'
        : frontierId === 'zi-day-boundary'
          ? 'day rollover and early/night 子時 lineage'
          : frontierId === 'true-solar-location'
            ? 'Saju-specific true-solar requirement and historical location/time policy'
            : 'direction, exact distance conversion, first start date, and period progression',
    })),
    sources: TIMING_SOURCES,
    observations: TIMING_OBSERVATIONS,
    claims: TIMING_CLAIMS,
    authoritySummary: buildTimingAuthoritySummary(),
    relations: TIMING_RELATIONS,
    blockers: TIMING_BLOCKERS,
    implementation: {
      references: TIMING_IMPLEMENTATION_REFERENCES,
      mappingStatus: 'observed_implementation_only_source_semantic_authority_unresolved',
      noRuntimeChangesInThisFrontier: true,
    },
    readiness: {
      status: 'blocked',
      availableForInterpretation: false,
      semanticAuthority: 'not_established',
      activation: 'blocked',
      reason: 'timing frontiers are source-observed and implementation-mapped but not claim-level or semantic-authority verified',
    },
    frontierConclusion: {
      sourceObservationsAreCompleteForThisPass: true,
      sourceAuthorityComplete: false,
      claimLevelVerificationComplete: false,
      semanticAuthorityComplete: false,
      readinessComplete: false,
      activationAllowed: false,
      unresolvedBlockerIds: TIMING_BLOCKERS.map(blocker => blocker.blockerId),
      nextAuthorizedFrontier: 'edition-stable primary source acquisition and independent boundary corpus before any rule promotion',
    },
    inventory: {
      sourceCount: TIMING_SOURCES.length,
      observationCount: TIMING_OBSERVATIONS.length,
      claimCount: TIMING_CLAIMS.length,
      relationCount: TIMING_RELATIONS.length,
      blockerCount: TIMING_BLOCKERS.length,
      implementationReferenceCount: TIMING_IMPLEMENTATION_REFERENCES.length,
      sourceIds: ids(TIMING_SOURCES, 'sourceId').sort(),
      observationIds: ids(TIMING_OBSERVATIONS, 'observationId').sort(),
      claimIds: ids(TIMING_CLAIMS, 'claimId').sort(),
    },
  }
  return { ...payload, contentSha256: sajuTimingAuthorityContentSha256(payload) }
}

export function checkSajuTimingAuthorityFrontier(candidate) {
  const errors = []
  if (candidate?.schemaVersion !== SAJU_TIMING_AUTHORITY_FRONTIER_SCHEMA || candidate?.frontierVersion !== SAJU_TIMING_AUTHORITY_FRONTIER_VERSION) errors.push('schema/version mismatch')
  if (candidate?.verdictToken !== 'partial_saju_timing_authority_frontier_advanced_uncommitted') errors.push('verdict boundary changed')
  if (sajuTimingAuthorityContentSha256(candidate) !== candidate?.contentSha256) errors.push('content hash mismatch')
  const scope = candidate?.scope || {}
  for (const key of ['sourceFirst', 'externalWebWitnessesRecorded', 'localArtifactByteIdentitiesReused']) if (scope[key] !== true) errors.push(`scope:${key}`)
  for (const key of ['externalSourceByteHashesObserved', 'runtimeMutation', 'implementationTuning', 'interpretationGeneration', 'claimPromotion', 'readinessMutation', 'activationMutation', 'historicalArtifactRewrite']) if (scope[key] !== false) errors.push(`scope:${key}`)
  if (candidate?.sourcePolicy?.rawTextIsVerifiedFact !== false || candidate?.sourcePolicy?.classicalSemanticAuthority !== 'not_established' || candidate?.sourcePolicy?.sourceLineageAndSemanticAuthorityAreSeparate !== true) errors.push('source policy promoted')
  if (canonicalSajuTimingAuthorityJson(candidate?.sources) !== canonicalSajuTimingAuthorityJson(TIMING_SOURCES)) errors.push('source inventory drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.observations) !== canonicalSajuTimingAuthorityJson(TIMING_OBSERVATIONS)) errors.push('observation inventory drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.claims) !== canonicalSajuTimingAuthorityJson(TIMING_CLAIMS)) errors.push('claim inventory drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.authoritySummary) !== canonicalSajuTimingAuthorityJson(buildTimingAuthoritySummary())) errors.push('authority summary drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.relations) !== canonicalSajuTimingAuthorityJson(TIMING_RELATIONS)) errors.push('relation inventory drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.blockers) !== canonicalSajuTimingAuthorityJson(TIMING_BLOCKERS)) errors.push('blocker inventory drift')
  if (canonicalSajuTimingAuthorityJson(candidate?.implementation?.references) !== canonicalSajuTimingAuthorityJson(TIMING_IMPLEMENTATION_REFERENCES)) errors.push('implementation reference drift')
  if (candidate?.readiness?.status !== 'blocked' || candidate?.readiness?.availableForInterpretation !== false || candidate?.readiness?.semanticAuthority !== 'not_established' || candidate?.readiness?.activation !== 'blocked') errors.push('readiness or activation promoted')
  const sourceIds = new Set(TIMING_SOURCES.map(source => source.sourceId))
  const observationIds = new Set(TIMING_OBSERVATIONS.map(observation => observation.observationId))
  const claimIds = new Set(TIMING_CLAIMS.map(claim => claim.claimId))
  const implementationRefIds = new Set(TIMING_IMPLEMENTATION_REFERENCES.map(reference => reference.refId))
  const blockerIds = new Set(TIMING_BLOCKERS.map(blocker => blocker.blockerId))
  for (const observation of candidate?.observations || []) {
    if (!sourceIds.has(observation.sourceId) || !TIMING_FRONTIER_IDS.includes(observation.frontierId)) errors.push(`observation reference:${observation.observationId}`)
    if (observation.rawText?.isVerifiedFact !== false || observation.rawText?.consumption !== SAJU_TIMING_RAW_TEXT_CONSUMPTION) errors.push(`raw text promotion:${observation.observationId}`)
    if (observation.admission?.claimVerification === 'verified' || observation.admission?.semanticAuthority === 'verified') errors.push(`observation admission promotion:${observation.observationId}`)
  }
  for (const claim of candidate?.claims || []) {
    if (!TIMING_CLAIM_STATUSES.includes(claim.status)) errors.push(`claim status:${claim.claimId}`)
    if (!TIMING_FRONTIER_IDS.includes(claim.frontierId) || claim.sourceObservationIds?.some(id => !observationIds.has(id)) || claim.implementationRefIds?.some(id => !implementationRefIds.has(id)) || claim.unresolvedBlockerIds?.some(id => !blockerIds.has(id))) errors.push(`claim references:${claim.claimId}`)
    if (!TIMING_INDEPENDENCE_STATUSES.includes(claim.independence?.status) || typeof claim.independence?.basis !== 'string' || !claim.independence.basis) errors.push(`claim independence:${claim.claimId}`)
    if (!TIMING_CONFIDENCE_LEVELS.includes(claim.confidence?.level) || typeof claim.confidence?.basis !== 'string' || !claim.confidence.basis) errors.push(`claim confidence:${claim.claimId}`)
    if (!TIMING_AUTHORITY_STATUSES.includes(claim.authorityStatus)) errors.push(`claim authority status:${claim.claimId}`)
    if (claim.authorityStatus === 'authority_supported') errors.push(`authority promotion:${claim.claimId}`)
    const expectedClaim = TIMING_CLAIMS.find(expected => expected.claimId === claim.claimId)
    if (!Array.isArray(claim.evidence) || claim.evidence.length !== claim.sourceObservationIds?.length || !expectedClaim || canonicalSajuTimingAuthorityJson(claim.evidence) !== canonicalSajuTimingAuthorityJson(expectedClaim.evidence)) errors.push(`claim evidence:${claim.claimId}`)
    if (claim.status === 'scoped_modern_convention' && claim.claimId !== 'claim.year-rollover-立春') errors.push(`unexpected modern status:${claim.claimId}`)
    if (!claim.competingPolicies?.length || !claim.unresolvedBlockerIds?.length) errors.push(`claim boundary missing:${claim.claimId}`)
  }
  for (const relation of candidate?.relations || []) {
    if (!['scoped_support', 'scope_limit', 'corroboration', 'conflict', 'blocks_promotion', 'method_support', 'implementation_mapping', 'scope_support'].includes(relation.relationType)) errors.push(`relation type:${relation.relationId}`)
    if (!observationIds.has(relation.fromId) && !claimIds.has(relation.fromId)) errors.push(`relation from:${relation.relationId}`)
    if (!observationIds.has(relation.toId) && !claimIds.has(relation.toId)) errors.push(`relation to:${relation.relationId}`)
  }
  const nlcConversionObservation = candidate?.observations?.find(observation => observation.observationId === 'obs.nlc.yuanhai.qilu-conversion-1926')
  if (nlcConversionObservation && (nlcConversionObservation.scopeBoundary !== 'clause-level corroboration only; no exact first-start age/date/rounding/clamping or semantic authority' || nlcConversionObservation.admission?.semanticAuthority === 'verified')) errors.push('nlc_yuanhai_conversion_scope_promoted')
  const firstStartClaim = candidate?.claims?.find(claim => claim.claimId === 'claim.dayun-first-start-date')
  if (firstStartClaim?.sourceObservationIds?.includes('obs.nlc.yuanhai.qilu-conversion-1926')) errors.push('nlc_yuanhai_conversion_promoted_to_exact_first_start')
  if ((candidate?.blockers || []).some(blocker => blocker.status !== 'open' || blocker.blocking !== true)) errors.push('blocker closed or non-blocking')
  if (candidate?.frontierConclusion?.sourceAuthorityComplete !== false || candidate?.frontierConclusion?.claimLevelVerificationComplete !== false || candidate?.frontierConclusion?.semanticAuthorityComplete !== false || candidate?.frontierConclusion?.readinessComplete !== false || candidate?.frontierConclusion?.activationAllowed !== false) errors.push('frontier conclusion promoted')
  if (candidate?.inventory?.sourceCount !== TIMING_SOURCES.length || candidate?.inventory?.observationCount !== TIMING_OBSERVATIONS.length || candidate?.inventory?.claimCount !== TIMING_CLAIMS.length || candidate?.inventory?.relationCount !== TIMING_RELATIONS.length || candidate?.inventory?.blockerCount !== TIMING_BLOCKERS.length) errors.push('inventory count mismatch')
  if (canonicalSajuTimingAuthorityJson(candidate?.inventory?.sourceIds) !== canonicalSajuTimingAuthorityJson(ids(TIMING_SOURCES, 'sourceId').sort())) errors.push('source inventory index mismatch')
  if (canonicalSajuTimingAuthorityJson(candidate?.inventory?.observationIds) !== canonicalSajuTimingAuthorityJson(ids(TIMING_OBSERVATIONS, 'observationId').sort())) errors.push('observation inventory index mismatch')
  if (canonicalSajuTimingAuthorityJson(candidate?.inventory?.claimIds) !== canonicalSajuTimingAuthorityJson(ids(TIMING_CLAIMS, 'claimId').sort())) errors.push('claim inventory index mismatch')
  return [...new Set(errors)].sort()
}
