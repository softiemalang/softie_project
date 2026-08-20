import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_SANMING_1578_OFFICIAL_VIEWER_SCHEMA = 'saju-sanming-1578-official-viewer-adjudication-v1'
export const SAJU_SANMING_1578_OFFICIAL_VIEWER_VERSION = '1.0.0'
export const PREDECESSOR_ARTIFACT_PATH = 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'
export const PREDECESSOR_ARTIFACT_BYTE_SHA256 = '7c9bfec3cd2ed082d009c521c03658c8905b475f2f165d3cbcbdc78c0b3fd126'

export const NCL_06589_RECORD_SOURCE_ID = 'source.ncl.sanming-tonghui.1578.catalog-06589-rarecatx0136467'
export const NCL_06589_SCAN_SOURCE_ID = 'source.ncl.sanming-tonghui.1578.scan-06589'
export const NCL_06590_RECORD_SOURCE_ID = 'source.ncl.sanming-tonghui.1578.catalog-06590'

const NCL_RECORD_URL = 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=26447d6c7bce4f449022760431185858fDU3MDkwMg2.stq2HEhfWJC_eUYaQeBiD_PNb2MtZqMpJAZgsDYhhYk_&page=&sourceWhereString=&whereString=IChDcmVhdGVyX05hbWUgbGlrZSAnJeiQrOawkeiLsSUnIG9yIERvY3VtZW50X1dyaXRlciBsaWtlICAnJeiQrOawkeiLsSUnICkg0.kCozK1ger_VDKjWLmYeI3_nb0xMenmNBgvJUAAV7WaE_'
const NCL_VIEWER_URL = 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=26447d6c7bce4f449022760431185858fDU3MDkwMg2.stq2HEhfWJC_eUYaQeBiD_PNb2MtZqMpJAZgsDYhhYk_&image=1&page=&SourceID=1&HasImage='

const sha256 = value => createHash('sha256').update(value).digest('hex')
const contentHash = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}
const isHash = value => /^[0-9a-f]{64}$/.test(value || '')

const capture = ({ evidenceId, screenshotPath, sha256Value, byteLength, pixelWidth, pixelHeight, viewerPageIndex = null, role, directObservation, observedFragments = [] }) => ({
  evidenceId,
  sourceCategory: viewerPageIndex === null
    ? 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NCL_RECORD'
    : 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NCL_VIEWER',
  sourceId: NCL_06589_RECORD_SOURCE_ID,
  screenshotPath,
  sha256: sha256Value,
  byteLength,
  pixelWidth,
  pixelHeight,
  directVisualObservation: true,
  role,
  viewerPageIndex,
  viewerPageTotal: viewerPageIndex === null ? null : 1187,
  directObservation,
  observedFragments,
  underlyingOfficialPageBytesObtained: false,
  printedFolio: null,
  scopeBoundary: 'The capture admits only the visible NCL record or viewer surface. It does not establish raw official page bytes, printed folio, copy-level lineage, edition relation, or semantic authority.',
})

export const NCL_06589_SCREENSHOT_EVIDENCE = Object.freeze([
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-record-screenshot-2026-08-20',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.46.35.png',
    sha256Value: 'a95e4dfa617ff1d4953317aa1ad3e86d24146806979375a330feb93df0eacd0a',
    byteLength: 1767819,
    pixelWidth: 2408,
    pixelHeight: 2076,
    role: 'item_identity_record',
    directObservation: 'The official NCL record visibly reports 三命通會十二卷, (明)萬民英(撰), 明萬曆戊寅(六年, 1578)刊本, 12冊, 線裝, 匡21.4 x 14.7公分, 書號 06589, 索書號 306.5 06589, and 登錄號 rarecatx0136467, with 國家圖書館 as holder.',
    observedFragments: ['三命通會十二卷', '明萬曆戊寅(六年, 1578)刊本', '06589', '306.5 06589', 'rarecatx0136467', '12冊', '線裝'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-2-item-label',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.01.01.png',
    sha256Value: '23701e17a30240ccc2920a3df730e44c974eb90a76679fc4138caa7e7eb6ca36',
    byteLength: 2653902,
    pixelWidth: 2426,
    pixelHeight: 1344,
    viewerPageIndex: 2,
    role: 'item_label_and_record_binding',
    directObservation: 'The official viewer surface visibly reports page 2/1187, keeps the 06589 title/edition/call-number/holder metadata in the left panel, and shows the NCL-watermarked scan surface with an internal handwritten label 007583. This is a bounded intra-viewer pairing; it does not identify 007583 as the 06589 accession or close copy lineage.',
    observedFragments: ['2/1187', '三命通會十二卷', '明萬曆戊寅(六年, 1578)刊本', '06589', '306.5 06589', '國家圖書館', '007583'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-146',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.43.17.png',
    sha256Value: 'ab56c6c20325eb7ffc625151ddea0d1a76204f2de7d1556ab32c6683ac3df68f',
    byteLength: 3511338,
    pixelWidth: 2526,
    pixelHeight: 1678,
    viewerPageIndex: 146,
    role: 'adjacent_viewer_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 146/1187 and shows the same NCL-watermarked bound-volume image sequence used as context for the target spread.',
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-147',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.43.02.png',
    sha256Value: 'af821ab630a963f9cb76d348aa050ee8d76b40a77d7404d23a819418badde23a',
    byteLength: 3469079,
    pixelWidth: 2410,
    pixelHeight: 1678,
    viewerPageIndex: 147,
    role: 'adjacent_viewer_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 147/1187 and supplies adjacent bound-spread context; no printed folio is visible.',
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-148',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.42.53.png',
    sha256Value: '1837664a1323aae6243f0bc6e1d6382905856713a7e576fa00b3e8cf1209fb8c',
    byteLength: 3486452,
    pixelWidth: 2478,
    pixelHeight: 1696,
    viewerPageIndex: 148,
    role: 'adjacent_viewer_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 148/1187 and supplies the immediately preceding bound-spread context; no printed folio is visible.',
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.42.39.png',
    sha256Value: '8d5f1958df9782c1294e95c01efcef1ac82b97a0fc909e3d44107001ee30bbc6',
    byteLength: 3512023,
    pixelWidth: 2512,
    pixelHeight: 1710,
    viewerPageIndex: 149,
    role: 'adjacent_viewer_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 149/1187 and supplies the immediately preceding bound-spread context; no printed folio is visible.',
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-150',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.40.23.png',
    sha256Value: '3dc930670c79b839752d8b1e8814a84bd0665752d1eade12c651f3c1d7864158',
    byteLength: 3332139,
    pixelWidth: 2512,
    pixelHeight: 1420,
    viewerPageIndex: 150,
    role: 'target_viewer_page',
    directObservation: 'The official viewer surface visibly reports page 150/1187. The bound spread visibly carries 論大運 material, including the 折除以三日為年 timing discussion, direction passages, and 立春 example context.',
    observedFragments: ['論大運', '折除以三日為年', '陽男陰女', '陰男陽女', '立春'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-151',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 7.43.29.png',
    sha256Value: 'ce78bff6bb2355189df641331d08f7a906c363135e445e94faf09697dc1894c3',
    byteLength: 3433598,
    pixelWidth: 2418,
    pixelHeight: 1658,
    viewerPageIndex: 151,
    role: 'target_viewer_page',
    directObservation: 'The official viewer surface visibly reports page 151/1187 and continues the 論大運 timing discussion, including the 三日而成一歲-style conversion/progression passage.',
    observedFragments: ['論大運', '三日而成一歲'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-3-item-context',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.06.19.png',
    sha256Value: '6425eee6f27ce4435793634e378a234f806a748c5264f548225cf89bdba1b1aa',
    byteLength: 2995043,
    pixelWidth: 2344,
    pixelHeight: 1228,
    viewerPageIndex: 3,
    role: 'item_identity_viewer_context',
    directObservation: 'The official viewer surface visibly reports page 3/1187 and repeats the 06589 title, author, recorded edition, call number, and holder in the left record panel. The scan surface is NCL-watermarked; no printed folio or copy-lineage statement is visible.',
    observedFragments: ['3/1187', '三命通會十二卷', '明萬曆戊寅(六年, 1578)刊本', '06589', '306.5 06589', '國家圖書館'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-7-front-matter-sequence',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.07.04.png',
    sha256Value: '37e7af5b0a8b254cbc2cddfd9f9950bd80741535b2a714abfb42852c0ab618e5',
    byteLength: 3100674,
    pixelWidth: 2350,
    pixelHeight: 1200,
    viewerPageIndex: 7,
    role: 'front_matter_volume_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 7/1187. Its outline shows 卷首 pages followed by 第1卷 through 第12卷, while the scan surface shows the bound volume front-matter/chart context. This establishes only viewer outline context, not printed folio or copy lineage.',
    observedFragments: ['7/1187', '卷首', '第1卷', '第2卷', '第12卷', '三命通會'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-99-volume-2-cover',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.10.07.png',
    sha256Value: '59051548f2cec9ac818992d96ed94df0bf2417fe250f18b9245d9503babb6f2c',
    byteLength: 2039210,
    pixelWidth: 2504,
    pixelHeight: 1304,
    viewerPageIndex: 99,
    role: 'volume_2_pre_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 99/1187 and shows the 第2卷 outline context immediately after the preceding volume tree. The scan surface is a dark bound-cover/cover-leaf image; no printed folio is visible.',
    observedFragments: ['99/1187', '第1卷', '第2卷'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-100-volume-2-opening',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.10.32.png',
    sha256Value: 'f93461419f5f734c6849e87bbc3122eeb5ad8f7e137a14e45c1a7794c836d0e8',
    byteLength: 2826366,
    pixelWidth: 2368,
    pixelHeight: 1306,
    viewerPageIndex: 100,
    role: 'volume_2_opening_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 100/1187 and shows 第2卷 pages in the outline. The scan surface is an unprinted/blank opening image with the NCL watermark; it does not expose a printed folio.',
    observedFragments: ['100/1187', '第2卷', '第1頁'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-100-volume-tree',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.11.00.png',
    sha256Value: '654502b1c6afbc61574089a7093440f1e07a5a55e78cc705b39b317c1c084418',
    byteLength: 2473644,
    pixelWidth: 2506,
    pixelHeight: 1310,
    viewerPageIndex: 100,
    role: 'volume_2_outline_context',
    directObservation: 'A second official viewer capture of page 100/1187 visibly exposes the expanded 卷首, 第1卷, and 第2卷 outline around the same blank opening surface. It is retained as corroborating viewer UI context only, not as a second physical witness.',
    observedFragments: ['100/1187', '卷首', '第1卷', '第2卷'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-101-volume-2-start',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.08.05.png',
    sha256Value: 'bae8469729b18cb05d55fda41983d2ffd11ef3ba9559373fac596ff06204c8f8',
    byteLength: 3105934,
    pixelWidth: 2548,
    pixelHeight: 1326,
    viewerPageIndex: 101,
    role: 'volume_2_start_boundary_context',
    directObservation: 'The official viewer surface visibly reports page 101/1187, with 第2卷 / 第1頁 in the outline and the visible printed title 三命通會卷之二 on the scan surface. This is a bounded viewer-volume start observation; the visible title is not a printed folio number and does not identify a physical copy lineage.',
    observedFragments: ['101/1187', '第2卷', '第1頁', '三命通會卷之二'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-187-volume-2-end',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.08.52.png',
    sha256Value: 'f1b9dd6d96e750d24cc739a7c979151de9d7c4f42251024cc03cd8bc6b3f2280',
    byteLength: 3211472,
    pixelWidth: 2412,
    pixelHeight: 1338,
    viewerPageIndex: 187,
    role: 'volume_2_end_boundary_context',
    directObservation: 'The official viewer surface visibly reports page 187/1187, shows 第2卷 pages 76–92 followed by 第3卷 in the outline, and visibly carries the printed end marker 三命通會卷之二終. This bounds the viewer sequence only; it does not expose a printed folio number for p.150–151 or close copy lineage.',
    observedFragments: ['187/1187', '第2卷', '第92頁', '第3卷', '三命通會卷之二終'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-188-post-volume-2',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.09.01.png',
    sha256Value: 'a29b83e5871fbc54d0e77ea508e48986d7026b7af9e3ee8743dce07a7ee82906',
    byteLength: 2929434,
    pixelWidth: 2384,
    pixelHeight: 1368,
    viewerPageIndex: 188,
    role: 'post_volume_2_sequence_context',
    directObservation: 'The official viewer surface visibly reports page 188/1187 immediately after the p.187 volume-end context; the scan surface is a blank/watermarked leaf and the outline advances beyond the 第2卷 page list. It supplies ordinal continuation context only.',
    observedFragments: ['188/1187', '第2卷', '第3卷'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-1184-late-volume-context',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.11.37.png',
    sha256Value: '9dc70392002d72930bc3e8bfd7ae39ff0673b0c1f3277efd3f6423bd20c08030',
    byteLength: 3278552,
    pixelWidth: 2390,
    pixelHeight: 1276,
    viewerPageIndex: 1184,
    role: 'late_volume_navigation_context',
    directObservation: 'The official viewer surface visibly reports page 1184/1187 and shows a late page range in the outline with an NCL-watermarked text leaf. This unrelated late-volume capture is retained only to document the supplied viewer navigation context; it does not bear on the p.150–151 folio or lineage gates.',
    observedFragments: ['1184/1187'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-1185-late-volume-context',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.11.28.png',
    sha256Value: 'fc831b06db3264a639ad743e2e75c027cc64d3fcf79c9cc4343438d3448859c2',
    byteLength: 2958369,
    pixelWidth: 2520,
    pixelHeight: 1248,
    viewerPageIndex: 1185,
    role: 'late_volume_end_context',
    directObservation: 'The official viewer surface visibly reports page 1185/1187 and shows the same late page-range navigation with an NCL-watermarked ruled/blank leaf. It is unrelated to the target section and cannot close any target folio or copy-lineage gate.',
    observedFragments: ['1185/1187'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-150-folio-context-2026-08-20',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.20.01.png',
    sha256Value: 'ba1e2aa538f5778c00698e51380442620c1110deccb5f480703fb8897bfc7a15',
    byteLength: 3294991,
    pixelWidth: 2364,
    pixelHeight: 1326,
    viewerPageIndex: 150,
    role: 'printed_folio_readability_context',
    directObservation: 'The official viewer surface visibly reports page 150/1187 and supplies a wider direct view of the target spread. No printed 葉次 is readable in this context capture; it is not a printed-folio proof.',
    observedFragments: ['150/1187', '論大運', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-1',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.24.39.png',
    sha256Value: '94a34de9e0291ee4b6dfa1da17793d4ec0ef534c20cedacfbaa3e521f6679cf1',
    byteLength: 3165221,
    pixelWidth: 2358,
    pixelHeight: 1222,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 149/1187 and directly magnifies the page edge/版心/魚尾 region. 葉次 remains unreadable.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-2',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.24.31.png',
    sha256Value: '5812d24f72a8a5efe64bcd71528e6709efbd3e7963715c5a0b495243dbb4c91f',
    byteLength: 3010589,
    pixelWidth: 2322,
    pixelHeight: 1210,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 149/1187 and directly magnifies the page edge/版心/魚尾 region. 葉次 remains unreadable.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-3',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.24.22.png',
    sha256Value: 'dc328af52d67019d2247fc2378c0926fa8f905c1f149a3596047704d2fa1ea4d',
    byteLength: 3052750,
    pixelWidth: 2386,
    pixelHeight: 1228,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 149/1187 and directly magnifies the lower page edge/版心/魚尾 region. 葉次 remains unreadable.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-4',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.24.17.png',
    sha256Value: '8f6a257c77bb41f03c926ace0b54cde21db05352fcb0fb29262c92c9e86eb374',
    byteLength: 3194224,
    pixelWidth: 2306,
    pixelHeight: 1278,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 149/1187 and directly magnifies the 版心/魚尾 region beside the page text. 葉次 remains unreadable.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-5',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.19.54.png',
    sha256Value: '6372ef707c3a8db31834f3ff0a572b22e530e83a6056bdc7084b27423d8c82cd',
    byteLength: 448908,
    pixelWidth: 258,
    pixelHeight: 898,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'This direct crop of the official viewer p.149/1187 版心/魚尾 and page-edge region remains insufficient to read 葉次.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-6',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.19.41.png',
    sha256Value: 'a3661250be1239658b1e04428ae1f353da65f49af1f1e3d7970014cc7cce0b8c',
    byteLength: 425433,
    pixelWidth: 268,
    pixelHeight: 874,
    viewerPageIndex: 149,
    role: 'printed_folio_readability_detail',
    directObservation: 'This direct crop of the official viewer p.149/1187 版心/魚尾 and page-edge region remains insufficient to read 葉次.',
    observedFragments: ['149/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-151-folio-detail-2026-08-20-1',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.24.53.png',
    sha256Value: '6b661f5e321be327315ff374df2a51c182fce1571c5411e6044d613f5bba66b1',
    byteLength: 3275295,
    pixelWidth: 2400,
    pixelHeight: 1288,
    viewerPageIndex: 151,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 151/1187 and directly magnifies the page edge/版心/魚尾 region. 葉次 remains unreadable.',
    observedFragments: ['151/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
  capture({
    evidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-151-folio-detail-2026-08-20-2',
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 8.25.00.png',
    sha256Value: '3d88de2530007dc5fb4c14302561ea5cf623809be766f47b82617087674d9eb9',
    byteLength: 3219893,
    pixelWidth: 2446,
    pixelHeight: 1288,
    viewerPageIndex: 151,
    role: 'printed_folio_readability_detail',
    directObservation: 'The official viewer surface visibly reports page 151/1187 and directly magnifies the page edge/版心/魚尾 region. 葉次 remains unreadable.',
    observedFragments: ['151/1187', '版心', '魚尾', '葉次不可判讀'],
  }),
])

const FOLIO_READABILITY_EVIDENCE_IDS = Object.freeze([
  'ev.sanming-1578.ncl-06589-viewer-page-150-folio-context-2026-08-20',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-1',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-2',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-3',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-4',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-5',
  'ev.sanming-1578.ncl-06589-viewer-page-149-folio-detail-2026-08-20-6',
  'ev.sanming-1578.ncl-06589-viewer-page-151-folio-detail-2026-08-20-1',
  'ev.sanming-1578.ncl-06589-viewer-page-151-folio-detail-2026-08-20-2',
])

const targetPage = (viewerPageIndex, evidenceId, observedFragments, directObservation) => ({
  viewerPageIndex,
  viewerPageTotal: 1187,
  evidenceId,
  sourceId: NCL_06589_RECORD_SOURCE_ID,
  heading: viewerPageIndex === 150 ? '三命通會卷之二 / 論大運' : '三命通會卷之二 / 論大運 (continuation)',
  directObservation,
  observedFragments,
  printedFolio: null,
  printedFolioStatus: 'unresolved_not_visible_in_capture',
  officialPageBytesObtained: false,
  screenshotBytesObserved: true,
  viewerToPhysicalCopyBinding: 'bounded_record_and_viewer_capture_context_only',
  semanticAuthority: 'identity_and_locator_only',
  productionAuthority: false,
  existingMirrorCandidate: {
    sourceId: NCL_06589_SCAN_SOURCE_ID,
    scanLeaf: viewerPageIndex,
    comparisonStatus: 'section_and_phrase_correspondence_only',
    byteIdentityClosed: false,
    reason: 'The official viewer reports 1187 pages while the existing Commons mirror object has 1000 pages; no official page bytes or derivation manifest ties the two indices byte-for-byte.',
  },
})

const predecessorReference = predecessor => ({
  artifactPath: PREDECESSOR_ARTIFACT_PATH,
  schemaVersion: predecessor?.schemaVersion || null,
  version: predecessor?.version || null,
  basisHead: predecessor?.basisHead || null,
  contentSha256: predecessor?.contentSha256 || null,
  artifactPayloadSha256: predecessor?.artifactIdentity?.artifactPayloadSha256 || null,
  artifactByteSha256: PREDECESSOR_ARTIFACT_BYTE_SHA256,
  blockerStatusBefore: 'open',
  preserved: true,
})

const claimReconciliation = relationId => ({
  relationId,
  statusBefore: 'direct_primary_page_locator_unpromoted',
  statusAfter: 'direct_primary_page_locator_unpromoted',
  editionRelationBefore: 'unresolved',
  editionRelationAfter: 'unresolved',
  semanticEquivalenceBefore: 'not_established',
  semanticEquivalenceAfter: 'not_established',
  addedEvidenceRefs: [
    'ev.sanming-1578.ncl-06589-record-screenshot-2026-08-20',
    'ev.sanming-1578.ncl-06589-viewer-page-150',
    'ev.sanming-1578.ncl-06589-viewer-page-151',
  ],
  promotion: { ready: false, status: 'blocked' },
  scopeDelta: 'The official viewer captures add a bounded first-party viewer observation for the 06589 record and p.150–151. They do not change the relation status, edition relation, semantic equivalence, or implementation authority.',
})

export function contentSha256(artifact) {
  return contentHash(artifact)
}

export function buildSajuSanming1578OfficialViewerAdjudication({ basisHead, predecessor } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('Sanming 1578 adjudication requires a valid basis HEAD')
  if (!predecessor?.schemaVersion || predecessor.schemaVersion !== 'saju-five-classics-source-identity-frontier-v0') throw new Error('Sanming 1578 adjudication requires the source-identity v0 predecessor')

  const targetPages = [
    targetPage(150, 'ev.sanming-1578.ncl-06589-viewer-page-150', ['論大運', '折除以三日為年', '陽男陰女', '陰男陽女', '立春'], 'The official viewer capture directly shows the target section and timing/direction context at viewer index 150/1187.'),
    targetPage(151, 'ev.sanming-1578.ncl-06589-viewer-page-151', ['論大運', '三日而成一歲'], 'The official viewer capture directly shows the continuation of the target section at viewer index 151/1187.'),
  ]
  const claims = [
    claimReconciliation('relation.dayun-direction'),
    claimReconciliation('relation.three-days-one-year-start-age'),
    claimReconciliation('relation.dayun-progression'),
  ]

  const artifact = {
    schemaVersion: SAJU_SANMING_1578_OFFICIAL_VIEWER_SCHEMA,
    version: SAJU_SANMING_1578_OFFICIAL_VIEWER_VERSION,
    basisHead,
    predecessor: predecessorReference(predecessor),
    scope: {
      objective: 'Reassess the Sanming 1578 provenance blocker using the first-party NCL 06589 item record capture and official viewer captures for p.150–151, while preserving the v0 source frontier and all unresolved copy/folio/lineage gates.',
      sourceOfTruth: 'The supplied NCL record and viewer screenshots are admitted as bounded visual observations at their visible record and viewer-page boundaries. The v0 source-identity artifact remains the historical baseline for prior mirror scans, catalog records, and blocker state.',
      directInspectionCompleted: ['NCL 06589 record capture', 'official viewer p.2–3 item-label and record context', 'official viewer p.7 front-matter volume outline', 'official viewer p.99–101 第2卷 opening sequence', 'official viewer p.146–149 sequence context', 'official viewer p.150 target page', 'official viewer p.151 target page', 'official viewer p.149–151 direct 版心/魚尾 inspection for 葉次', 'official viewer p.187–188 第2卷 end sequence', 'official viewer p.1184–1185 late navigation context'],
      comparisonCompleted: ['official viewer p.150–151 versus existing NCL-06589 mirror leaf 150–151 locator observations', 'official viewer total page index versus existing mirror PDF page count', 'official viewer p.101–187 第2卷 ordinal boundary versus target p.150–151', 'official viewer p.149–151 high-magnification 版心/魚尾 inspection versus the printed-folio gate'],
      prohibited: [
        'screenshot-to-official-page-byte identity',
        'viewer page index to printed folio inference',
        'viewer capture to copy-level lineage promotion',
        '06589 to 06590 collapse',
        'same section or phrase to same plate or transmission',
        'direct page observation to semantic authority',
        'direct page observation to production activation',
      ],
    },
    evidencePolicy: {
      directCapture: 'bounded_direct_visual_observation',
      underlyingOfficialPageBytes: 'required_for_byte_level_witness_identity',
      printedFolio: 'must be visibly printed or institutionally crosswalked; viewer UI index is not a printed folio',
      copyLineage: 'requires first-party accession/copy evidence or page-level physical collation',
      mirror: 'existing Commons scan remains a locator and comparison object; no new independent witness is counted',
      ocr: 'locator_only',
      noWholeVolumeNegative: true,
    },
    candidateBoundary: {
      importedAsCanonicalEvidence: false,
      candidateTranscriptionImported: false,
      existingMirrorPromoted: false,
      claimPromotion: false,
    },
    firstPartyItem: {
      sourceId: NCL_06589_RECORD_SOURCE_ID,
      recordUrl: NCL_RECORD_URL,
      viewerUrl: NCL_VIEWER_URL,
      recordIdentityStatus: 'first_party_catalog_identity_observed',
      catalogFields: {
        title: '三命通會十二卷',
        author: '(明)萬民英(撰)',
        recordedEdition: '明萬曆戊寅(六年, 1578)刊本',
        carrier: '12冊',
        binding: '線裝',
        dimensions: '匡21.4 x 14.7公分',
        bookNumber: '06589',
        callNumber: '306.5 06589',
        catalogRegistrationLabel: '登錄號',
        catalogRegistrationValue: 'rarecatx0136467',
        holder: '國家圖書館',
      },
      physicalCopyIdentityStatus: 'unresolved',
      copyLevelLineageStatus: 'unresolved',
      internalScanLabel: '007583',
      internalScanLabelStatus: 'directly_observed_under_06589_viewer_record',
      internalScanLabelToCatalogMapping: 'unresolved',
      recordedDateIsPhysicalProductionDate: false,
      screenshotEvidenceId: 'ev.sanming-1578.ncl-06589-record-screenshot-2026-08-20',
      itemLabelScreenshotEvidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-2-item-label',
    },
    evidence: NCL_06589_SCREENSHOT_EVIDENCE.map(item => structuredClone(item)),
    targetPageReconciliation: {
      status: 'bounded_first_party_viewer_capture_not_raw_witness_bytes',
      viewerUrl: NCL_VIEWER_URL,
      officialViewerPageTotal: 1187,
      targetPages,
      adjacentViewerPages: [146, 147, 148, 149],
      identityContextViewerPages: [2, 3],
      volumeSequenceContextViewerPages: [7, 99, 100, 101, 187, 188, 1184, 1185],
      targetPageCount: targetPages.length,
      sequenceContextPageCount: 4,
      identityContextPageCount: 2,
      volumeSequenceContextCaptureCount: 9,
      folioReadabilityViewerPages: [149, 150, 151],
      folioReadabilityCaptureCount: FOLIO_READABILITY_EVIDENCE_IDS.length,
      folioReadabilityAssessment: {
        status: 'unresolved_not_legible_after_direct_magnification',
        targetField: '葉次',
        inspectedFeatures: ['版心', '魚尾'],
        inspectedViewerPageIndices: [149, 150, 151],
        evidenceIds: [...FOLIO_READABILITY_EVIDENCE_IDS],
        directInspectionCompleted: true,
        leafSequenceReadable: false,
        printedFolioClosed: false,
        statement: 'The supplied captures directly magnify the 版心/魚尾 and page-edge regions around viewer p.149–151, but 葉次 remains unreadable. The viewer indices remain digital locators only.',
      },
      firstPartyViewerTargetObserved: true,
      viewerVolumeContext: {
        volumeLabel: '第2卷',
        startViewerPageIndex: 101,
        startEvidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-101-volume-2-start',
        endViewerPageIndex: 187,
        endEvidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-187-volume-2-end',
        postEndViewerPageIndex: 188,
        postEndEvidenceId: 'ev.sanming-1578.ncl-06589-viewer-page-188-post-volume-2',
        targetViewerPageIndices: [150, 151],
        targetWithinViewerOrdinalRange: true,
        status: 'bounded_viewer_sequence_only',
        printedFolioClosed: false,
        physicalVolumeIdentityClosed: false,
        copyLineageClosed: false,
        statement: 'The supplied viewer captures show 第2卷 beginning at viewer index 101, an explicit 第2卷終 marker at viewer index 187, and post-boundary context at 188; target viewer indices 150–151 fall within that ordinal range. This does not supply printed folio numbers or a physical-copy/scan-lineage bridge.',
      },
      viewerRecordInternalLabelPairing: {
        viewerPageIndex: 2,
        label: '007583',
        recordBookNumber: '06589',
        recordCallNumber: '306.5 06589',
        status: 'bounded_intra_viewer_pairing',
        catalogMappingClosed: false,
        copyLineageClosed: false,
      },
      officialPageBytesObtained: false,
      screenshotBytesObserved: true,
      printedFolioClosed: false,
      copyLineageClosed: false,
      semanticAuthority: 'not_established',
      productionAuthority: false,
      pageIndexComparison: {
        officialViewerPageTotal: 1187,
        existingCommonsMirrorPageCount: 1000,
        candidateMirrorLeaves: [150, 151],
        status: 'section_and_phrase_correspondence_only',
        byteIdentityClosed: false,
        independentWitnessCountDelta: 0,
        reason: 'Different page totals and absent original viewer bytes/derivation metadata prevent a byte-level or leaf-level identity claim.',
      },
      noWholeVolumeNegative: true,
    },
    blockerReassessment: {
      predecessorBlockerId: 'blocker.sanming-1578-page-access',
      predecessorStatus: 'open',
      statusAfter: 'open_narrowed',
      delta: [
        {
          gate: 'first_party_viewer_target_capture',
          before: 'v0 recorded the public viewer as CAPTCHA-gated with no first-party target page observation',
          after: 'bounded user-supplied captures directly show the official viewer p.150/1187 and p.151/1187 target surfaces',
          promoted: false,
        },
        {
          gate: 'viewer_record_to_internal_scan_label_pairing',
          before: 'v0 retained 007583 only as a mirror leaf-2 observation and did not have an official viewer capture',
          after: 'official viewer p.2 now visibly places internal label 007583 under the 06589 / 306.5 06589 record panel',
          promoted: false,
        },
        {
          gate: 'first_party_viewer_volume_sequence',
          before: 'v0 had no supplied official viewer sequence boundary around target p.150–151',
          after: 'official viewer captures bound 第2卷 from viewer p.101 through the visible p.187 end marker, with p.188 post-boundary context; target p.150–151 are ordinally inside that range',
          promoted: false,
        },
        {
          gate: 'official_target_page_bytes',
          before: 'unresolved',
          after: 'unresolved_screenshot_only',
          promoted: false,
        },
        {
          gate: 'printed_folio',
          before: 'unresolved',
          after: 'unresolved_not_legible_after_direct_magnification',
          promoted: false,
        },
        {
          gate: 'printed_folio_readability_inspection',
          before: 'not_recorded',
          after: 'direct_版心_魚尾_inspection_but_葉次_unreadable',
          promoted: false,
        },
        {
          gate: 'copy_level_lineage',
          before: 'unresolved',
          after: 'unresolved',
          promoted: false,
        },
        {
          gate: '06589_to_06590_relation',
          before: 'unresolved_identifier_conflict',
          after: 'unresolved_identifier_conflict',
          promoted: false,
        },
      ],
      remainingStatement: 'The official viewer captures reduce only the access-observation part of the blocker and add a bounded 007583-to-06589 viewer-context pairing plus a bounded 第2卷 ordinal sequence around target p.150–151. Direct 版心/魚尾 inspection was attempted, but 葉次 remains unreadable. Raw page bytes, printed folio, copy-level lineage, 007583 catalog mapping, 06589/06590 relation, local-to-physical relation, edition collation, and semantic authority remain blocking.',
      remainingBlockers: [
        'raw_official_target_page_bytes_not_obtained',
        'printed_folio_not_observed_or_legible',
        'copy_level_lineage_not_closed',
        'internal_label_to_catalog_mapping_unresolved',
        '06589_06590_relation_unresolved',
        'local_to_physical_item_unresolved',
        'cross_edition_collation_unresolved',
      ],
    },
    sourceClaimReconciliation: {
      claims,
      statusMutation: false,
      semanticEquivalenceMutation: false,
      canonicalTransmissionEdgeCountBefore: 0,
      canonicalTransmissionEdgeCountAfter: 0,
      note: 'The direct viewer pages add evidence references to existing timing locators but do not promote or rewrite any v0 claim relation.',
    },
    lineageGraph: {
      inheritedFromPredecessor: PREDECESSOR_ARTIFACT_PATH,
      newCanonicalEdges: [],
      newIndependentWitnesses: [],
      physicalIndependenceClosed: false,
      textualIndependenceClosed: false,
      printedFolioCrosswalkClosed: false,
      copyLineageClosed: false,
      policy: 'The viewer capture is not counted as a second physical or textual witness. The mirror candidate and 06590 records remain separate and unresolved.',
    },
    blockers: [
      { blockerId: 'blocker.sanming-1578-page-access', status: 'open_narrowed', blocking: true, scope: '三命通會', statement: 'Official NCL 06589 viewer p.150–151 is directly observed, and the supplied viewer sequence bounds those indices within the visible 第2卷 start/end context. The captures still do not provide original page bytes, printed folio, or copy-level lineage. The existing 06589 mirror and 06590 records remain unresolved candidates.', nextCheckableFrontier: 'Obtain authorized official page-image/PDF bytes or a first-party derivation/folio bridge; do not bypass CAPTCHA.' },
      { blockerId: 'blocker.sanming-1578-printed-folio', status: 'open', blocking: true, scope: 'NCL 06589 p.150–151', statement: 'Viewer indices 150/1187 and 151/1187 are digital viewer positions. The supplied captures directly inspect the 版心/魚尾 and page-edge regions around p.149–151, but 葉次 remains unreadable and no institutional printed-folio crosswalk is supplied.', nextCheckableFrontier: 'Obtain first-party printed-folio metadata/crosswalk or an authorized higher-resolution/raw page representation that makes 葉次 directly legible.' },
      { blockerId: 'blocker.sanming-1578-copy-lineage', status: 'open', blocking: true, scope: 'NCL 06589', statement: 'The official viewer p.2 now pairs the visible internal label 007583 with the 06589 record panel, but the screenshot does not prove that 007583 is the catalog accession, nor close the physical copy, scan derivation, or copy-specific provenance.', nextCheckableFrontier: 'Obtain first-party accession/copy evidence or an authorized scan manifest that maps 007583 to 06589.' },
      { blockerId: 'blocker.sanming-1578-06589-06590-relation', status: 'open', blocking: true, scope: 'NCL 06589 / 06590', statement: 'The 06589 record and the distinct 06590 record remain separate catalog identities. Shared 1578 bibliographic fields and viewer screenshots do not prove they are the same physical item or edition-level transmission.', nextCheckableFrontier: 'Obtain accession/folio evidence or direct page/colophon collation for both records.' },
      { blockerId: 'blocker.sanming-1578-local-lineage', status: 'open', blocking: true, scope: 'local 三命通會 PDF', statement: 'The official viewer pages do not establish a local-PDF-to-06589 physical or textual transmission path.', nextCheckableFrontier: 'Perform direct page and printed-folio collation after the 06589 item/scan chain is closed.' },
      { blockerId: 'blocker.sanming-1578-semantic-authority', status: 'open', blocking: true, scope: '論大運 timing claims', statement: 'The pages are direct source-specific locators only. They do not establish semantic equivalence, a complete calculation rule, or production authority.', nextCheckableFrontier: 'Close copy/edition/folio gates and independently reconcile the complete timing rule before any promotion.' },
    ],
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'Only a bounded official-viewer screenshot frontier was added; printed folio, raw bytes, copy lineage, edition relation, semantic authority, and local transmission remain unresolved.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      printedFolioPromoted: false,
      copyLineagePromoted: false,
      editionRelationPromoted: false,
      independencePromoted: false,
      semanticAuthorityChanged: false,
      productionChanged: false,
      blockingEdges: ['official-page-bytes', 'printed-folio', 'copy-lineage', '06589-06590-relation', 'local-to-physical', 'edition-collation', 'semantic-authority'],
    },
    summary: {
      firstPartyRecordIdentityObserved: true,
      firstPartyViewerTargetObserved: true,
      screenshotEvidenceCount: NCL_06589_SCREENSHOT_EVIDENCE.length,
      targetPageCount: targetPages.length,
      sequenceContextPageCount: 4,
      identityContextPageCount: 2,
      volumeSequenceContextCaptureCount: 9,
      folioReadabilityViewerPages: [149, 150, 151],
      folioReadabilityCaptureCount: FOLIO_READABILITY_EVIDENCE_IDS.length,
      folioReadabilityResult: 'unresolved_not_legible_after_direct_magnification',
      leafSequenceReadable: false,
      boundedViewerVolumeSequenceObserved: true,
      officialViewerPageTotal: 1187,
      existingMirrorPageCount: 1000,
      officialPageBytesObtained: false,
      printedFolioClosed: false,
      copyLineageClosed: false,
      internalScanLabelObserved: true,
      viewerRecordInternalLabelPairing: 'bounded_intra_viewer_pairing',
      canonicalTransmissionEdgeCount: 0,
      blockerStatus: 'open_narrowed',
      promotionCount: 0,
    },
    contentSha256: null,
  }

  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuSanming1578OfficialViewerAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_SANMING_1578_OFFICIAL_VIEWER_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_SANMING_1578_OFFICIAL_VIEWER_VERSION) fail('version')
  if (artifact.predecessor?.artifactPath !== PREDECESSOR_ARTIFACT_PATH || artifact.predecessor?.artifactByteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || artifact.predecessor?.preserved !== true) fail('predecessor_boundary')
  if (artifact.firstPartyItem?.recordIdentityStatus !== 'first_party_catalog_identity_observed' || artifact.firstPartyItem?.physicalCopyIdentityStatus !== 'unresolved' || artifact.firstPartyItem?.copyLevelLineageStatus !== 'unresolved' || artifact.firstPartyItem?.internalScanLabel !== '007583' || artifact.firstPartyItem?.internalScanLabelToCatalogMapping !== 'unresolved') fail('item_identity_scope')
  if (artifact.targetPageReconciliation?.officialViewerPageTotal !== 1187 || artifact.targetPageReconciliation?.targetPageCount !== 2 || artifact.targetPageReconciliation?.firstPartyViewerTargetObserved !== true) fail('target_page_scope')
  if (artifact.targetPageReconciliation?.officialPageBytesObtained !== false || artifact.targetPageReconciliation?.printedFolioClosed !== false || artifact.targetPageReconciliation?.copyLineageClosed !== false) fail('target_page_boundary')
  const viewerVolumeContext = artifact.targetPageReconciliation?.viewerVolumeContext
  if (artifact.targetPageReconciliation?.identityContextViewerPages?.join(',') !== '2,3' || artifact.targetPageReconciliation?.volumeSequenceContextViewerPages?.join(',') !== '7,99,100,101,187,188,1184,1185' || artifact.targetPageReconciliation?.identityContextPageCount !== 2 || artifact.targetPageReconciliation?.volumeSequenceContextCaptureCount !== 9) fail('viewer_context_inventory')
  const folioReadabilityAssessment = artifact.targetPageReconciliation?.folioReadabilityAssessment
  if (artifact.targetPageReconciliation?.folioReadabilityViewerPages?.join(',') !== '149,150,151' || artifact.targetPageReconciliation?.folioReadabilityCaptureCount !== FOLIO_READABILITY_EVIDENCE_IDS.length || folioReadabilityAssessment?.status !== 'unresolved_not_legible_after_direct_magnification' || folioReadabilityAssessment?.targetField !== '葉次' || folioReadabilityAssessment?.inspectedFeatures?.join(',') !== '版心,魚尾' || folioReadabilityAssessment?.inspectedViewerPageIndices?.join(',') !== '149,150,151' || folioReadabilityAssessment?.evidenceIds?.join(',') !== FOLIO_READABILITY_EVIDENCE_IDS.join(',') || folioReadabilityAssessment?.directInspectionCompleted !== true || folioReadabilityAssessment?.leafSequenceReadable !== false || folioReadabilityAssessment?.printedFolioClosed !== false) fail('folio_readability_boundary')
  if (viewerVolumeContext?.volumeLabel !== '第2卷' || viewerVolumeContext?.startViewerPageIndex !== 101 || viewerVolumeContext?.endViewerPageIndex !== 187 || viewerVolumeContext?.postEndViewerPageIndex !== 188 || viewerVolumeContext?.targetWithinViewerOrdinalRange !== true || viewerVolumeContext?.status !== 'bounded_viewer_sequence_only' || viewerVolumeContext?.printedFolioClosed !== false || viewerVolumeContext?.physicalVolumeIdentityClosed !== false || viewerVolumeContext?.copyLineageClosed !== false) fail('viewer_volume_boundary')
  if (artifact.targetPageReconciliation?.pageIndexComparison?.officialViewerPageTotal !== 1187 || artifact.targetPageReconciliation?.pageIndexComparison?.existingCommonsMirrorPageCount !== 1000 || artifact.targetPageReconciliation?.pageIndexComparison?.byteIdentityClosed !== false) fail('mirror_comparison_boundary')
  if (!Array.isArray(artifact.evidence) || artifact.evidence.length !== NCL_06589_SCREENSHOT_EVIDENCE.length) fail('evidence_count')
  for (const expected of NCL_06589_SCREENSHOT_EVIDENCE) {
    const found = artifact.evidence?.find(item => item.evidenceId === expected.evidenceId)
    if (!found || found.sha256 !== expected.sha256 || !isHash(found.sha256) || found.directVisualObservation !== true || found.underlyingOfficialPageBytesObtained !== false || found.printedFolio !== null) fail(`evidence_boundary:${expected.evidenceId}`)
  }
  const itemLabelCapture = artifact.evidence?.find(item => item.evidenceId === 'ev.sanming-1578.ncl-06589-viewer-page-2-item-label')
  if (!itemLabelCapture || itemLabelCapture.viewerPageIndex !== 2 || !itemLabelCapture.observedFragments.includes('007583')) fail('item_label_capture_scope')
  for (const page of artifact.targetPageReconciliation?.targetPages || []) {
    if (![150, 151].includes(page.viewerPageIndex) || page.viewerPageTotal !== 1187 || page.printedFolio !== null || page.officialPageBytesObtained !== false || page.existingMirrorCandidate?.byteIdentityClosed !== false) fail(`target_page_boundary:${page.viewerPageIndex}`)
  }
  if (artifact.targetPageReconciliation?.viewerRecordInternalLabelPairing?.status !== 'bounded_intra_viewer_pairing' || artifact.targetPageReconciliation?.viewerRecordInternalLabelPairing?.catalogMappingClosed !== false || artifact.targetPageReconciliation?.viewerRecordInternalLabelPairing?.copyLineageClosed !== false) fail('item_label_boundary')
  if (artifact.blockerReassessment?.statusAfter !== 'open_narrowed' || artifact.blockerReassessment?.predecessorStatus !== 'open') fail('blocker_reassessment_status')
  if (artifact.sourceClaimReconciliation?.statusMutation !== false || artifact.sourceClaimReconciliation?.semanticEquivalenceMutation !== false) fail('claim_mutation')
  if (artifact.lineageGraph?.newCanonicalEdges?.length !== 0 || artifact.lineageGraph?.newIndependentWitnesses?.length !== 0 || artifact.lineageGraph?.printedFolioCrosswalkClosed !== false || artifact.lineageGraph?.copyLineageClosed !== false) fail('lineage_promotion')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.printedFolioPromoted !== false || artifact.promotion?.copyLineagePromoted !== false || artifact.promotion?.editionRelationPromoted !== false || artifact.promotion?.independencePromoted !== false) fail('promotion_side_effect')
  if (artifact.summary?.officialPageBytesObtained !== false || artifact.summary?.printedFolioClosed !== false || artifact.summary?.copyLineageClosed !== false || artifact.summary?.internalScanLabelObserved !== true || artifact.summary?.viewerRecordInternalLabelPairing !== 'bounded_intra_viewer_pairing' || artifact.summary?.volumeSequenceContextCaptureCount !== 9 || artifact.summary?.folioReadabilityViewerPages?.join(',') !== '149,150,151' || artifact.summary?.folioReadabilityCaptureCount !== FOLIO_READABILITY_EVIDENCE_IDS.length || artifact.summary?.folioReadabilityResult !== 'unresolved_not_legible_after_direct_magnification' || artifact.summary?.leafSequenceReadable !== false || artifact.summary?.boundedViewerVolumeSequenceObserved !== true || artifact.summary?.promotionCount !== 0) fail('summary_boundary')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}
