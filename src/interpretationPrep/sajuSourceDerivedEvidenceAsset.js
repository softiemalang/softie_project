import { SAJU_LOCAL_SOURCE_CORPUS_ROOT } from './sajuLocalSourceCorpusEvidence.js'

export const SAJU_SOURCE_DERIVED_EVIDENCE_SCHEMA = 'saju-source-derived-evidence-v1'
export const SAJU_SOURCE_DERIVED_EVIDENCE_VERSION = '1.0.0'

export const SAJU_SOURCE_DERIVED_ASSET_PATH = `${
  'artifacts/saju-source-derived-evidence-v1/assets/'
}ziping-zhenquan-pdf-page-002-rendered-evidence.jpg`
export const SAJU_LEGACY_ROOT_ASSET_PATH = '-.jpg'

export const SAJU_SOURCE_PDF_FILE_NAME = '子平真诠-沈孝瞻原著.pdf'
export const SAJU_SOURCE_PDF_PATH = `${SAJU_LOCAL_SOURCE_CORPUS_ROOT}/${SAJU_SOURCE_PDF_FILE_NAME}`
export const SAJU_SOURCE_ID = 'saju-source-ziping-zhenquan'

export const SAJU_SOURCE_PDF_IDENTITY = Object.freeze({
  fileName: SAJU_SOURCE_PDF_FILE_NAME,
  path: SAJU_SOURCE_PDF_PATH,
  pageCount: 27,
  byteLength: 580320,
  sha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
  repositoryStorage: 'external_canonical_source; not copied into repository',
})

export const SAJU_SOURCE_RENDER_SPEC = Object.freeze({
  renderer: 'pdftoppm',
  rendererVersion: '26.05.0',
  pdfPage: 2,
  outputFormat: 'jpeg',
  outputFileName: 'ziping-zhenquan-pdf-page-002-rendered-evidence.jpg',
  scaleTo: 1400,
  command: Object.freeze([
    'pdftoppm',
    '-f',
    '2',
    '-l',
    '2',
    '-scale-to',
    '1400',
    '-jpeg',
    '-singlefile',
    '<source-pdf>',
    '<output-prefix>',
  ]),
  commandTemplate: 'pdftoppm -f 2 -l 2 -scale-to 1400 -jpeg -singlefile <source-pdf> <output-prefix>',
  byteIdentitySensitivity: 'JPEG bytes are pinned to Poppler 26.05.0; any other renderer/version requires fresh byte-identity verification.',
})

export const SAJU_SOURCE_DERIVED_ASSET_IDENTITY = Object.freeze({
  assetId: 'saju-source-derived-evidence.ziping-zhenquan.pdf-page-002',
  path: SAJU_SOURCE_DERIVED_ASSET_PATH,
  kind: 'source_derived_rendered_evidence',
  sourceId: SAJU_SOURCE_ID,
  sourcePdfPage: 2,
  pixelWidth: 990,
  pixelHeight: 1400,
  byteLength: 214374,
  sha256: '26896bdc877cd977a5e2e88abc1d7409d021a0ee1ffaacd708ad1dd3f987843f',
  mimeType: 'image/jpeg',
  format: 'JPEG',
})

export function canonicalSajuSourceDerivedAssetPath(root) {
  return `${root.replace(/\/$/, '')}/${SAJU_SOURCE_DERIVED_ASSET_PATH}`
}

export function migrateSajuLegacyAssetPath(path) {
  return path === SAJU_LEGACY_ROOT_ASSET_PATH ? SAJU_SOURCE_DERIVED_ASSET_PATH : path
}
