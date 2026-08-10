import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-p0-claim-source-identity-frontier-v1'
export const VERDICT = 'complete_ziwei_p0_claim_source_identity_frontier_exhausted_uncommitted'
export const EXPECTED_HEAD = '823a6a17dbdd4eee22685f053c6cffa3e79baefd'
export const MATERIALIZER_VERSION = '1.0.0'
export const MATERIALIZER_PATH = 'scripts/materialize-ziwei-p0-claim-source-identity-frontier-v1.mjs'
export const ARTIFACT_DIR = 'artifacts/ziwei-p0-claim-source-identity-frontier-v1'

const NANBEI_SHA = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const NANYANG_SHA = '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'
const NARA_V1_MANIFEST_SHA = '732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af'
const NARA_V2_MANIFEST_SHA = '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560'

const sourceInputs = [
  MATERIALIZER_PATH,
  'src/artifactIdentity.js',
  'src/ziwei/ziweiContract.js',
  'src/ziwei/palaceRelationRules.js',
  'src/ziwei/starPlacementRules.js',
  'src/ziwei/minorStarRules.js',
  'src/ziwei/transformationRules.js',
  'src/ziwei/lifeBodyPalaceRulerSourceEvidence.js',
  'src/ziwei/externalZiweiFixtures.js',
  'artifacts/tri-system-evidence-acquisition-field-kit-v1/complete.json',
  'artifacts/tri-system-p0-acquisition-priority-and-dossier-v1/complete.json',
  'artifacts/ziwei-readiness-baseline-v1/complete.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json',
  'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json',
  'artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json',
  'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
  'artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json',
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const canonicalJson = (value) => {
  const stable = (item) => Array.isArray(item)
    ? item.map(stable)
    : item && typeof item === 'object'
      ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, stable(item[key])]))
      : item
  return `${JSON.stringify(stable(value), null, 2)}\n`
}

const relationId = (claimId, sourceId) => `relation-${sha256(`${claimId}#${sourceId}`).slice(0, 16)}`

const sourceInventory = [
  {
    sourceId: 'src-nanbei-pdf',
    label: '命-南北山人_紫微斗数全书.pdf',
    sourceKind: 'local_pdf_derivative',
    access: 'local_outside_repository',
    catalogIdentity: 'none_admitted; title and local file identity only',
    edition: 'Nanbei Shanren-labelled 219-page scan; edition/lineage unresolved',
    volumeFolioPage: '219-page PDF; direct observations at PDF pages 4, 7, 8, 11-13',
    actualByteSha256: NANBEI_SHA,
    pageCount: 219,
    directObservation: 'visual_page_review_recorded_in_predecessor_artifacts',
    lineage: 'unresolved_local_scan_lineage',
    independence: 'not_established',
    authority: 'source_presence_and_direct_observation_only; semantic_authority_not_established',
    reuseRights: 'not_admitted_to_repository; rights/lineage unclear',
    storedInGit: false,
    locatorRole: 'direct_observation_bounded',
  },
  {
    sourceId: 'src-nanyangtang-pdf',
    label: '新锓希夷陈先生紫微斗数全书…明代南阳堂刊本…pdf',
    sourceKind: 'local_pdf_derivative',
    access: 'local_outside_repository',
    catalogIdentity: 'metadata points to NARA F1000000000000101426; derivative provenance not byte-equivalent to public item proven here',
    edition: 'Ming Nanyangtang-labelled derivative; 7 juan / 528 PDF pages; exact scan lineage to each NARA item unresolved',
    volumeFolioPage: 'PDF pages 5, 145, 159-160, 167, 172, 175, 382-405 observed in predecessor artifacts',
    actualByteSha256: NANYANG_SHA,
    pageCount: 528,
    directObservation: 'visual_page_review_recorded_in_predecessor_artifacts',
    lineage: 'same_catalog_record_candidate_as_nara; not_independent',
    independence: 'not_independent_same_record_derivative_candidate',
    authority: 'institutional_catalog_link_only_for_derivative; semantic_authority_not_established',
    reuseRights: 'not_admitted_to_repository; derivative reuse rights unclear',
    storedInGit: false,
    locatorRole: 'direct_observation_bounded',
  },
  {
    sourceId: 'src-nara-record-f1000000000000101426',
    label: 'NARA catalog record F1000000000000101426',
    sourceKind: 'official_catalog_record',
    access: 'public_metadata',
    catalogIdentity: '内閣文庫 / 子060-0001; 選者陳搏（宋）/補訂者潘希尹（明）; 2 volumes; Ming printed edition; 7 juan',
    edition: 'catalogued Ming printed edition; physical volume/leaf correspondence remains to be bound to every claim',
    volumeFolioPage: 'catalog identity only; item IDs 4468520 and 4469314',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'record_parent_of_nara_items',
    independence: 'not_independent_parent_record',
    authority: 'institutional_catalog_identity; not semantic authority by itself',
    reuseRights: 'metadata states 公開 / CC0; image-level access/reuse is a separate question',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-nara-4468520',
    label: 'NARA IIIF item 4468520',
    sourceKind: 'official_iiif_item',
    access: 'public_iiif_metadata_and_image_endpoint; viewer limitations recorded separately',
    catalogIdentity: 'record F1000000000000101426; item 4468520; 129 canvases',
    edition: 'volume identity within the NARA two-volume record; exact printed volume/folio and cross-item lineage not fully resolved',
    volumeFolioPage: 'IIIF leaves 84-86, 87-88, 89-92 directly reviewed; 129 canvases total',
    actualByteSha256: null,
    pageCount: 129,
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json',
    manifestSha256: NARA_V1_MANIFEST_SHA,
    directObservation: 'visual_native_iiif_leaf_review_all_129_leaves_recorded_in_predecessor',
    lineage: 'same_record_as_nara_4469314',
    independence: 'not_independent_same_record_volume_pair',
    authority: 'institutional_item_identity_and_direct_observation_bounded; semantic_authority_not_established',
    reuseRights: 'public metadata/CC0 indication does not establish image reuse rights under viewer limitation',
    storedInGit: false,
    locatorRole: 'direct_observation_bounded',
  },
  {
    sourceId: 'src-nara-4469314',
    label: 'NARA IIIF item 4469314',
    sourceKind: 'official_iiif_item',
    access: 'public_iiif_metadata_and_image_endpoint; viewer limitations recorded separately',
    catalogIdentity: 'record F1000000000000101426; item 4469314; 137 canvases',
    edition: 'second item/volume within the same NARA two-volume record; exact printed volume/folio and cross-item lineage not fully resolved',
    volumeFolioPage: 'IIIF leaves 64-80 directly reviewed; 137 canvases total',
    actualByteSha256: null,
    pageCount: 137,
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json',
    manifestSha256: NARA_V2_MANIFEST_SHA,
    directObservation: 'visual_native_iiif_leaf_review_all_137_leaves_recorded_in_predecessor',
    lineage: 'same_record_as_nara_4468520',
    independence: 'not_independent_same_record_volume_pair',
    authority: 'institutional_item_identity_and_direct_observation_bounded; semantic_authority_not_established',
    reuseRights: 'public metadata/CC0 indication does not establish image reuse rights under viewer limitation',
    storedInGit: false,
    locatorRole: 'direct_observation_bounded',
  },
  {
    sourceId: 'src-toyo-1646',
    label: 'Toyo Bunko / AKS UCI RIKS+CRMA+KSM-WZ.0000.0000-20140423.TOYO_1646',
    sourceKind: 'official_digital_collection_manuscript_candidate',
    access: 'public_image_viewer_and_Korean_Academy_catalog',
    catalogIdentity: 'Toyo Bunko; VII-3-157; manuscript; 1 book / 100 leaves; 前間氏所藏 / 在山樓蒐書之一',
    edition: 'undated manuscript titled 新刊希夷陳先生紫微斗數全集; no colophon/edition date closed',
    volumeFolioPage: 'viewer image files 0001-0105; direct observations at 0001, 0003-0009, 0014-0018, 0085, 0088, 0100',
    actualByteSha256: null,
    pageCount: 105,
    imageUrlPattern: 'http://kostma.korea.ac.kr/data/des/RIKS%2BCRMA%2BKSM-WZ.0000.0000-20140423.TOYO_1646/IMG/TOYO_1646_001/{leaf4}.jpg',
    reviewedImageSha256: {
      '0001': '501490341c3c95533a900c5f3642208e029cb1aa7ada62859aa085940907e2e2',
      '0003': 'c80a3a73b8ce9f3cf9ace261acc0ebc367d019ac671569dc295752a058739ea6',
      '0004': 'f3cf2bd1b9e6b663417363130532b1de4c688e434f9e65c021a79ef34cb39b42',
      '0005': '0079a78503695db7392a7d3e493657cbdbe3978e2a37b5c28864b1ddc5cbd73d',
      '0006': '95670b53dbebfc7d6e249cd4797a8569c90dd282dd9a25e3044cda679cb9081f',
      '0007': '7b7885d713e9acfc450d8d6f16e02fd9e26e81f3578f08981606fdadeae580f7',
      '0008': '533ad5547ece951074f4e56f078fe16f58abff974c13879be39bff35471ad639',
      '0014': 'f20dbf5821dfc04c9acf5cccaf9a2e48102bf01362e08f6e35aa7ad0578b33f5',
      '0015': '5ff55d85b36ab4f1699662f42d1b5e1ef5bdff356c7e7dc2c6381db0c69ea081',
      '0016': '0e0f0cadfbceeceb317f92210116f54c80b8b6e74a729f92e7e39a162444bf76',
      '0017': '15b7f6b9a7956a3611c5a5243054dd01cd62ce540d19a28d6b6f8e92dcd6d52b',
      '0018': '29ba3d0b47f100bb39875ff00ba9788155382799d5eddfd6a2216823273b4907',
      '0085': '3f315cfc53f1a97417e7212e6c0cbbc6d01cf4831e3853e825969c2f75ae6e',
      '0088': 'faddc5476318e9e815f71e7956e3c6610c4768b22b4d7367be0678c9dc7a4d07',
      '0100': '94642024f3f58239fb771f49b1f94bb9ac58a03644a6e7918ce09a48c01f0dda',
    },
    directObservation: 'visual_direct_review_of_actual_public_jpeg_bytes; images kept outside_repository',
    lineage: 'distinct_physical_witness_candidate_from_nara; textual_lineage_unresolved',
    independence: 'independent_physical_witness_candidate_not_admitted_as_independent_oracle',
    authority: 'institutional_collection_identity_plus_direct_observation_bounded; edition_and_semantic_authority_unresolved',
    reuseRights: 'public viewer access observed; image reuse license not established; no image stored in Git',
    storedInGit: false,
    locatorRole: 'direct_observation_bounded',
  },
  {
    sourceId: 'src-toyo-80941-catalog',
    label: 'Toyo Bunko catalog result 80941',
    sourceKind: 'official_catalog_record',
    access: 'public_catalog',
    catalogIdentity: 'VII-3-157; 新刊希夷陳先生紫微斗數全集; 宋陳搏撰 / 白玉蟾增; 寫本',
    edition: 'catalog-only; physical linkage to UCI image record and exact manuscript identity not mechanically closed',
    volumeFolioPage: 'catalog record only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'same_shelfmark_group_as_toyo_80943; physical lineage unresolved',
    independence: 'not_established_catalog_only',
    authority: 'institutional_catalog_identity_only',
    reuseRights: 'catalog access does not establish image reuse rights',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-toyo-80943-catalog',
    label: 'Toyo Bunko catalog result 80943',
    sourceKind: 'official_catalog_record',
    access: 'public_catalog',
    catalogIdentity: 'VII-3-157; 新刊希夷陳先生紫微斗數全集不分卷; 宋陳摶撰 / 宋白玉蟾增; 鈔本',
    edition: 'catalog-only; relation to 80941 and UCI image record unresolved',
    volumeFolioPage: 'catalog record only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'same_shelfmark_group_as_toyo_80941; physical lineage unresolved',
    independence: 'not_established_catalog_only',
    authority: 'institutional_catalog_identity_only',
    reuseRights: 'catalog access does not establish image reuse rights',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-ctext',
    label: 'Chinese Text Project 紫微斗數全書 text/history page',
    sourceKind: 'transcription_and_text_locator',
    access: 'public_text',
    catalogIdentity: 'text/history locator; no immutable page-image edition admitted',
    edition: 'edition provenance insufficient for source identity',
    volumeFolioPage: 'web text sections only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'transcription_locator_only',
    lineage: 'unresolved',
    independence: 'not_established',
    authority: 'locator_only_not_direct_observation',
    reuseRights: 'not used as a repository source artifact',
    storedInGit: false,
    locatorRole: 'locator_only',
  },
  {
    sourceId: 'src-google-books',
    label: 'Google Books bibliographic record for 新鋟希夷陳先生紫微斗數全書',
    sourceKind: 'bibliographic_record',
    access: 'public_metadata',
    catalogIdentity: 'bibliographic record only; no admitted historical scan',
    edition: 'unresolved',
    volumeFolioPage: 'metadata only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'unresolved',
    independence: 'not_established',
    authority: 'bibliographic_locator_only',
    reuseRights: 'not used as a repository source artifact',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-ndl',
    label: 'National Diet Library search results',
    sourceKind: 'bibliographic_search',
    access: 'public_metadata_or_restricted_modern_item',
    catalogIdentity: 'modern editions/search results; no historical primary scan admitted',
    edition: 'not relevantly resolved for the target historical witness',
    volumeFolioPage: 'metadata only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'unresolved',
    independence: 'not_established',
    authority: 'catalog_locator_only',
    reuseRights: 'not used as a repository source artifact',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-ncl-digital-archives',
    label: 'Taiwan National Central Library / Digital Archives search results',
    sourceKind: 'bibliographic_search',
    access: 'public_metadata',
    catalogIdentity: 'modern/secondary metadata; no target historical primary scan admitted',
    edition: 'unresolved',
    volumeFolioPage: 'metadata only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'catalog_only',
    lineage: 'unresolved',
    independence: 'not_established',
    authority: 'catalog_locator_only',
    reuseRights: 'not used as a repository source artifact',
    storedInGit: false,
    locatorRole: 'catalog_only',
  },
  {
    sourceId: 'src-shidian-and-wikisource',
    label: 'Shidian Guji / Chinese Wikisource transcriptions',
    sourceKind: 'public_transcription',
    access: 'public_text',
    catalogIdentity: 'transcribed text/TOC; no immutable source image or edition authority admitted',
    edition: 'unresolved',
    volumeFolioPage: 'web chapters/sections only',
    actualByteSha256: null,
    pageCount: null,
    directObservation: 'transcription_locator_only',
    lineage: 'unresolved',
    independence: 'not_established',
    authority: 'locator_only_not_direct_observation',
    reuseRights: 'not used as a repository source artifact',
    storedInGit: false,
    locatorRole: 'locator_only',
  },
].sort((a, b) => a.sourceId.localeCompare(b.sourceId))

const observation = (observationId, sourceId, locator, surface, detail, imageSha256 = null) => ({
  observationId,
  sourceId,
  locator,
  printedFolio: null,
  directObservationStatus: 'visual_page_review',
  observationMode: 'actual_page_or_leaf_image_review; not OCR authority',
  surface,
  detail,
  imageSha256,
  transcriptionRole: 'locator_only',
  semanticScope: 'bounded_surface_only; no complete production palace mapping inferred',
})

const observations = [
  observation('obs-nanbei-p4', 'src-nanbei-pdf', 'PDF p.4', 'branch/trigram diagram', 'Branch glyphs and diagram surface observed; does not identify production palace names or ordinal.', 'predecessor_artifact_hash_4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'),
  observation('obs-nanbei-p7', 'src-nanbei-pdf', 'PDF p.7', '12-cell diagram', 'Twelve-cell diagram surface observed; mapping to production palace enum is not shown as complete.', 'predecessor_artifact_hash_4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'),
  observation('obs-nanbei-p8', 'src-nanbei-pdf', 'PDF p.8', '命/身 traversal wording', '寅起月 and 命逆/身順 traversal wording observed; semantic palace-name mapping remains open.', 'predecessor_artifact_hash_4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'),
  observation('obs-nanbei-p11-13', 'src-nanbei-pdf', 'PDF pp.11-13', 'star placement tables', 'Coordinate/star table surfaces observed for the local numeric comparison; direct source rule identity per star is not closed.', 'predecessor_artifact_hash_4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'),
  observation('obs-nanyang-p5', 'src-nanyangtang-pdf', 'PDF p.5', 'table-of-contents headings', '安命主/安身主 headings observed; headings alone do not establish edition or all rule rows.', 'predecessor_artifact_hash_04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'),
  observation('obs-nanyang-p145', 'src-nanyangtang-pdf', 'PDF p.145', '命/身 example', '安身命例 direct rule/example surface observed.', 'predecessor_artifact_hash_04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'),
  observation('obs-nanyang-p159-160', 'src-nanyangtang-pdf', 'PDF pp.159-160', '命主/身主 tables', 'Direct table surfaces observed for 命主 and 身主; derivative remains same-record candidate, not independent.', 'predecessor_artifact_hash_04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'),
  observation('obs-nara-v1-84-86', 'src-nara-4468520', 'IIIF leaves 84-86', '五行局/branch/day grids', 'Direct native images show bureau and branch/day grids, without a complete 12-palace name/ordinal legend.'),
  observation('obs-nara-v1-87-88', 'src-nara-4468520', 'IIIF leaves 87-88', '安天府圖 and 四化 table surface', '安天府圖, branch columns, and 祿/科/權/忌 surface observed; no complete semantic production coordinate frame.'),
  observation('obs-nara-v1-89-92', 'src-nara-4468520', 'IIIF leaves 89-92', 'rules/examples', 'Rule and example prose/tables observed; not a complete source/edition/claim binding for every occurrence.'),
  observation('obs-nara-v2-64-80', 'src-nara-4469314', 'IIIF leaves 64-80', 'repeated chart grids', 'Repeated 命之 chart/example grids observed; examples do not establish a complete name-to-branch-to-ordinal mapping.'),
  observation('obs-toyo-0001', 'src-toyo-1646', 'viewer image 0001', 'cover/shelfmark', 'VII-3-157 and 前間氏所藏 markings observed; anchors collection identity, not date or edition authority.', '501490341c3c95533a900c5f3642208e029cb1aa7ada62859aa085940907e2e2'),
  observation('obs-toyo-0003', 'src-toyo-1646', 'viewer image 0003', 'holding/page marks', 'Inside-page text and holding marks directly observed.', 'c80a3a73b8ce9f3cf9ace261acc0ebc367d019ac671569dc295752a058739ea6'),
  observation('obs-toyo-0004', 'src-toyo-1646', 'viewer image 0004', 'major/auxiliary star vocabulary', '紫微, 天府, 天相, 天梁, 天機, 天同, 天才, 天壽 and 安天府/左右輔弼-related vocabulary directly observed; no full placement table bound.', 'f3cf2bd1b9e6b663417363130532b1de4c688e434f9e65c021a79ef34cb39b42'),
  observation('obs-toyo-0005', 'src-toyo-1646', 'viewer image 0005', 'branch/day/bureau rules', 'Direct rule prose and branch/day/element surface observed; not a complete palace semantic map.', '0079a78503695db7392a7d3e493657cbdbe3978e2a37b5c28864b1ddc5cbd73d'),
  observation('obs-toyo-0006', 'src-toyo-1646', 'viewer image 0006', '五行局 grids', '水二局, 金四局, 木三局, 土五局, 火六局 headings and branch/day grids directly observed.', '95670b53dbebfc7d6e249cd4797a8569c90dd282dd9a25e3044cda679cb9081f'),
  observation('obs-toyo-0007', 'src-toyo-1646', 'viewer image 0007', '身命 diagram', '身命 heading, 寅起正月, 命逆, 身順, and a 12-cell relation surface directly observed; complete palace-name/ordinal mapping absent.', '7b7885d713e9acfc450d8d6f16e02fd9e26e81f3578f08981606fdadeae580f7'),
  observation('obs-toyo-0008', 'src-toyo-1646', 'viewer image 0008', '安天府/star tables', '安天府-related placement prose/table and chart examples directly observed; convention authority unresolved.', '533ad5547ece951074f4e56f078fe16f58abff974c13879be39bff35471ad639'),
  observation('obs-toyo-0014', 'src-toyo-1646', 'viewer image 0014', 'star/formula rules', 'Direct formula and life/body-related prose observed; row-level edition/lineage binding remains unresolved.', 'f20dbf5821dfc04c9acf5cccaf9a2e48102bf01362e08f6e35aa7ad0578b33f5'),
  observation('obs-toyo-0015', 'src-toyo-1646', 'viewer image 0015', '命宮/論命 context', '命宮 and 論命 context directly observed; not a complete twelve-palace legend.', '5ff55d85b36ab4f1699662f42d1b5e1ef5bdff356c7e7dc2c6381db0c69ea081'),
  observation('obs-toyo-0016', 'src-toyo-1646', 'viewer image 0016', '命宮 interpretation context', '一命宮 and related interpretation context directly observed; interpretation authority is not admitted.', '0e0f0cadfbceeceb317f92210116f54c80b8b6e74a729f92e7e39a162444bf76'),
  observation('obs-toyo-0017', 'src-toyo-1646', 'viewer image 0017', '十二宮/limits context', '十二宮 and limits context directly observed; no complete production enum binding.', '15b7f6b9a7956a3611c5a5243054dd01cd62ce540d19a28d6b6f8e92dcd6d52b'),
  observation('obs-toyo-0018', 'src-toyo-1646', 'viewer image 0018', '四化 vocabulary/table surface', '十二宮 and 化祿/化權/化科/化忌 vocabulary directly observed; no complete 10-stem x 4 table identity established.', '29ba3d0b47f100bb39875ff00ba9788155382799d5eddfd6a2216823273b4907'),
  observation('obs-toyo-0085', 'src-toyo-1646', 'viewer image 0085', '命之 chart example', 'Chart example with 命 and palace labels/stars directly observed; example is not a complete semantic legend.', '3f315cfc53f1a97417e7212e6c0cbbc6d01cf4831e3853e825969c2f75ae6e'),
  observation('obs-toyo-0088', 'src-toyo-1646', 'viewer image 0088', '命之 chart example', 'Chart example with 命, 兄弟, 夫妻 and stars directly observed; no full branch/ordinal binding.', 'faddc5476318e9e815f71e7956e3c6610c4768b22b4d7367be0678c9dc7a4d07'),
  observation('obs-toyo-0100', 'src-toyo-1646', 'viewer image 0100', '命之 chart example', 'Chart example directly observed; remains an example rather than an exhaustive source identity witness.', '94642024f3f58239fb771f49b1f94bb9ac58a03644a6e7918ce09a48c01f0dda'),
]

const claim = (claimId, family, label, sourceIds, observationIds, relationStatus, notes, status = 'direct_observation_bounded') => ({
  claimId,
  family,
  label,
  sourceIds: [...sourceIds],
  observationIds: [...observationIds],
  sourceIdentity: sourceIds.length ? 'row-level_source_identity_not_fully_closed' : 'unsupported_source_identity',
  editionLineage: 'must not merge same-record scans; independent physical witness candidates remain separate',
  leafPageBinding: observationIds.length ? 'direct leaf/page locator exists for bounded surface; complete claim binding absent' : 'no admitted direct leaf/page witness',
  directObservation: observationIds.length ? 'present_but_bounded' : 'absent',
  independence: sourceIds.includes('src-toyo-1646') ? 'Toyo is independent_physical_witness_candidate; NARA pair/local derivative remain non-independent' : 'not_established_or_same_lineage_only',
  authority: 'institutional/catalog identity and direct observation do not by themselves establish semantic/source authority',
  claimRelation: relationStatus,
  status,
  notes,
  readinessImpact: 'readiness_remains_not_safe_to_start; no interpretation or activation promotion',
})

const claims = [
  claim('claim-palace-name-branch-ordinal', 'palace_semantics', '12 palace names ↔ source branch glyphs ↔ production ordinal/physical slot', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646'], ['obs-nanbei-p7', 'obs-nanbei-p8', 'obs-nara-v1-84-86', 'obs-nara-v1-89-92', 'obs-nara-v2-64-80', 'obs-toyo-0007', 'obs-toyo-0015', 'obs-toyo-0017', 'obs-toyo-0085', 'obs-toyo-0088'], 'direct_observation_supports_partial_diagram_and_chart_surface_only', 'No witness closes all 12 names, branch glyphs, physical slots, ordinal, base direction, and production enum in one readable source context.'),
  claim('claim-ming-shen-coordinate-frame', 'palace_semantics', '命宮/身宮 traversal and coordinate frame', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-toyo-1646'], ['obs-nanbei-p8', 'obs-nanyang-p145', 'obs-nanyang-p159-160', 'obs-toyo-0007', 'obs-toyo-0014'], 'direct_observation_supports_traversal_surface_not_semantic_coordinate_identity', '寅起正月, 命逆, 身順 and related tables are observed, but the semantic map to production palace names/ordinal remains unresolved.'),
  claim('claim-12-palace-diagram-semantics', 'palace_semantics', 'complete 12-palace diagram with names, branches, slots, and direction', ['src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646'], ['obs-nara-v1-87-88', 'obs-nara-v1-89-92', 'obs-nara-v2-64-80', 'obs-toyo-0017', 'obs-toyo-0085', 'obs-toyo-0088'], 'does_not_close_complete_semantic_diagram', 'Observed charts are examples or partial tables; no complete admissible semantic legend was found.'),
  ...[
    ['ziwei', '紫微'], ['tianji', '天機'], ['taiyang', '太陽'], ['wugu', '武曲'], ['tiandong', '天同'], ['lianzhen', '廉貞'],
    ['tianfu', '天府'], ['taiyin', '太陰'], ['tanlang', '貪狼'], ['jumen', '巨門'], ['tianxiang', '天相'], ['tianliang', '天梁'],
    ['qisha', '七殺'], ['pojun', '破軍'],
  ].map(([id, name]) => claim(`claim-major-star-placement-${id}`, 'major_star_placement', `${name} placement`, ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646'], ['obs-nanbei-p11-13', 'obs-nara-v1-84-86', 'obs-nara-v1-89-92', 'obs-nara-v2-64-80', 'obs-toyo-0004', 'obs-toyo-0008', 'obs-toyo-0085', 'obs-toyo-0088'], 'direct_observation_supports_numeric_or_star_surface_only', `${name} is present in the local/visual source surface or chart context, but a row-level original-text placement rule with resolved edition, page/folio, and semantic coordinate authority is not admitted.`)),
  claim('claim-tianfu-anchor-direction', 'tianfu_convention', 'Tianfu anchor/base direction', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-toyo-1646'], ['obs-nanbei-p11-13', 'obs-nara-v1-87-88', 'obs-toyo-0004', 'obs-toyo-0008'], 'direct_observation_supports_tianfu_surface_but_not_unique_convention', 'Both legacy and source-aligned code modes remain; observed 安天府 surfaces do not adjudicate the production anchor without a complete semantic coordinate frame.'),
  claim('claim-tianfu-placement', 'tianfu_convention', 'Tianfu placement relation', ['src-nanbei-pdf', 'src-nara-4468520', 'src-toyo-1646'], ['obs-nanbei-p11-13', 'obs-nara-v1-87-88', 'obs-toyo-0008'], 'numeric_relation_or_formula_surface_only', '150/150 rotation/coordinate agreement is retained as deterministic representation evidence only; it is not source or semantic authority.'),
  claim('claim-tianfu-rotation06-semantic', 'tianfu_convention', 'rotation-06 semantic/source authority', ['src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646'], ['obs-nara-v1-87-88', 'obs-nara-v2-64-80', 'obs-toyo-0008'], 'representation_only_not_semantic_authority', 'rotation-06 is explicitly kept separate from source identity, semantic palace meaning, readiness, and activation.', 'representation_only'),
  claim('claim-auxiliary-star-placement-six-lucky', 'auxiliary_stars', '六吉星 placement', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-toyo-1646'], ['obs-nanbei-p11-13', 'obs-nanyang-p159-160', 'obs-toyo-0004', 'obs-toyo-0014'], 'direct_observation_supports_auxiliary_vocabulary_not_full_rule_witness', 'The Toyo pages directly show auxiliary-star vocabulary such as 左右輔弼, but do not close every placement function and identity.'),
  claim('claim-auxiliary-star-placement-core', 'auxiliary_stars', 'core auxiliary-star resolver rules', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-toyo-1646'], ['obs-nanbei-p11-13', 'obs-toyo-0004', 'obs-toyo-0014'], 'local_rule_and_source_surface_not_semantic_authority', 'Existing comparable rows and source surfaces remain evidence-limited; no rule promotion occurs.'),
  claim('claim-four-transformations-10x4', 'four_transformations', '10 heavenly stems × 四化 mapping', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-toyo-1646'], ['obs-nara-v1-87-88', 'obs-toyo-0018'], 'direct_observation_supports_four_transform_vocabulary_not_complete_10x4_table', '祿/權/科/忌 and 化祿/化權/化科/化忌 are visible, but no complete source-identified 10×4 table with edition/leaf/context was admitted.'),
  ...[
    ['lu', '化祿'], ['quan', '化權'], ['ke', '化科'], ['ji', '化忌'],
  ].map(([id, name]) => claim(`claim-four-transform-${id}`, 'four_transformations', name, ['src-nara-4468520', 'src-toyo-1646'], ['obs-nara-v1-87-88', 'obs-toyo-0018'], 'direct_observation_supports_label_surface_only', `${name} label is directly observed, but label occurrence is not a complete stem-by-stem source rule.`)),
  claim('claim-life-body-palace-ruler', 'life_body_rulers', '命主/身主 and life/body ruler tables', ['src-nanyangtang-pdf', 'src-toyo-1646'], ['obs-nanyang-p5', 'obs-nanyang-p145', 'obs-nanyang-p159-160', 'obs-toyo-0007', 'obs-toyo-0014'], 'direct_observation_supports_selected_rule_rows_only', 'Selected direct pages exist, but source/edition identity and full row-level closure remain incomplete.'),
  claim('claim-life-body-ruler-24-ambiguous-rows', 'life_body_rulers', '24 ambiguous life/body ruler rows', ['src-nanyangtang-pdf', 'src-toyo-1646'], ['obs-nanyang-p159-160', 'obs-toyo-0014'], 'unresolved_row_level_source_identity', 'The existing 120/144 comparable boundary is preserved; 24 ambiguous rows remain blocked.'),
  claim('claim-ziwei-input-calendar-time', 'calendar_input', 'calendar/time source identity used before Ziwei calculation', ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-ctext'], ['obs-nanbei-p8', 'obs-nanyang-p145'], 'unsupported_external_source_identity', 'Local execution and source prose do not establish an independent calendar/time edition or oracle identity.', 'unsupported'),
]

const observationsById = new Map(observations.map((item) => [item.observationId, item]))
const sourcesById = new Map(sourceInventory.map((item) => [item.sourceId, item]))

const relations = claims.flatMap((item) => item.sourceIds.map((sourceId) => {
  const source = sourcesById.get(sourceId)
  const observationIds = item.observationIds.filter((id) => observationsById.get(id)?.sourceId === sourceId)
  return {
    relationId: relationId(item.claimId, sourceId),
    claimId: item.claimId,
    sourceId,
    observationIds,
    relationStatus: item.claimRelation,
    sourceIdentityStatus: source?.directObservation === 'catalog_only' || source?.directObservation === 'transcription_locator_only' ? 'catalog_or_locator_only' : 'identity_not_fully_closed',
    editionLineage: source?.lineage,
    independence: source?.independence,
    authority: source?.authority,
    directObservation: observationIds.length > 0 ? 'yes_bounded' : source?.directObservation === 'catalog_only' || source?.directObservation === 'transcription_locator_only' ? 'no_catalog_or_locator_only' : 'no_matching_selected_observation',
    promotion: 'not_admitted_to_stable_claim_or_readiness',
  }
})).sort((a, b) => a.relationId.localeCompare(b.relationId))

const blockers = [
  ['blocker-source-identity-unresolved', 'blocked', 'Every occurrence still needs exact edition/lineage, volume/folio/page or leaf, actual retrieval bytes where applicable, and a claim-boundary decision. Toyo adds a distinct physical candidate but does not close its date/lineage/authority.'],
  ['blocker-palace-semantic-identity', 'blocked', 'No public witness reviewed provides one complete readable map of all 12 names, branch glyphs, physical slots, ordinal, base direction, and production enum.'],
  ['blocker-direct-rule-absent', 'blocked', 'The 14 major-star source surfaces and charts do not supply an admitted row-level original-text placement rule for every star with closed identity and semantics.'],
  ['blocker-tianfu-raw-formula-contradiction', 'blocked', 'Legacy and source-aligned Tianfu conventions remain in code; observed 安天府 surfaces do not uniquely adjudicate the production convention.'],
  ['blocker-tianfu-rotation06-semantic-authority', 'blocked', 'rotation-06 numeric relation is representation-only and never source/semantic authority.'],
  ['blocker-auxiliary-star-source-witness', 'blocked', 'Auxiliary-star vocabulary and selected tables are visible, but a complete independently identified rule witness is absent.'],
  ['blocker-four-transform-source-witness', 'blocked', '四化 labels are directly visible, but a complete 10-stem × 4 source table with edition/leaf/context and authority is absent.'],
  ['blocker-life-body-ruler-source-legibility', 'blocked', 'Selected 命主/身主 pages are direct observations; 24 ambiguous rows and source identity remain unresolved.'],
  ['blocker-independent-external-oracle', 'blocked', 'No independently reproduced external calculation/oracle with exact source identity and settings is admitted.'],
  ['blocker-calendar-time-source-identity', 'blocked', 'Calendar/time source identity is not closed for the input boundary and is not promoted by local execution.'],
  ['blocker-image-reuse-rights', 'needs_human_review', 'NARA metadata/public viewer and Toyo/AKS public images were inspected read-only; image reuse/license permission is not treated as repository inclusion authority.'],
].map(([id, status, reason]) => ({ id, status, reason, requiredForPromotion: true, resolution: 'preserve unresolved until exact requested human/collection evidence is supplied' }))

const publicFrontier = [
  { id: 'frontier-nara', target: 'official NARA record, two IIIF items, all leaves', result: 'exhausted_at_current_public_access', sourceIds: ['src-nara-record-f1000000000000101426', 'src-nara-4468520', 'src-nara-4469314'], independentWitness: false, reason: 'same catalog record; 0 complete semantic bindings in predecessor concordance' },
  { id: 'frontier-local-nanyang', target: 'local Nanyangtang derivative and existing concordance', result: 'exhausted_at_current_local_evidence', sourceIds: ['src-nanyangtang-pdf'], independentWitness: false, reason: 'same-record derivative candidate; direct pages remain bounded' },
  { id: 'frontier-nanbei', target: 'local Nanbei scan', result: 'exhausted_at_current_local_evidence', sourceIds: ['src-nanbei-pdf'], independentWitness: false, reason: 'title/byte identity exists, edition/lineage/semantic map does not' },
  { id: 'frontier-toyo-aks', target: 'official Toyo Bunko / AKS UCI TOYO_1646 manuscript images', result: 'candidate_found_but_authority_unresolved', sourceIds: ['src-toyo-1646', 'src-toyo-80941-catalog', 'src-toyo-80943-catalog'], independentWitness: 'physical_candidate_only', reason: '1-book/100-leaf undated manuscript is distinct from NARA record; exact lineage/date/rights unresolved' },
  { id: 'frontier-text-and-catalog', target: 'CText, Google Books, Shidian, Wikisource, NDL, Taiwan digital archives', result: 'exhausted_as_locator_only', sourceIds: ['src-ctext', 'src-google-books', 'src-shidian-and-wikisource', 'src-ndl', 'src-ncl-digital-archives'], independentWitness: false, reason: 'no admitted immutable historical scan with resolved identity' },
]

const requiredFamilies = ['palace_semantics', 'major_star_placement', 'tianfu_convention', 'auxiliary_stars', 'four_transformations', 'life_body_rulers', 'calendar_input']

const researchUnits = [
  {
    unitId: 'unit-palace-semantic-identity',
    family: 'palace_semantics',
    claimIds: claims.filter((item) => item.family === 'palace_semantics').map((item) => item.claimId),
    investigation: 'Nanbei/Nanyangtang local pages, NARA two-item IIIF leaf review, and Toyo/AKS chart pages were compared.',
    sourceIdentity: 'NARA catalog/item identities and Toyo collection identity are recorded; local derivative and manuscript edition lineage remain unresolved.',
    directObservation: 'p.4/p.7/p.8/p.11-13, NARA 84-92/64-80, Toyo 0007/0015/0017/0085/0088 directly reviewed.',
    lineageIndependence: 'NARA pair and Nanyang derivative are not independent; Toyo is a distinct physical candidate only.',
    claimRelation: 'partial diagram/chart surface; complete 12-way semantic mapping not established.',
    deterministicChecks: ['claim-source matrix', 'observation hash/locator rows', 'same-record independence negative mutation'],
    impact: 'blocker-palace-semantic-identity remains blocked; readiness unchanged',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-major-star-placement',
    family: 'major_star_placement',
    claimIds: claims.filter((item) => item.family === 'major_star_placement').map((item) => item.claimId),
    investigation: '14-star local source tables, NARA grids/examples, and Toyo star/chart pages were reconciled against existing numeric comparison evidence.',
    sourceIdentity: 'Source surfaces are located, but row-level original-text rule identity/edition/folio is not closed for every star.',
    directObservation: 'Nanbei 11-13, NARA 84-86/89-92, NARA v2 64-80, Toyo 0004/0008/0085/0088 directly reviewed.',
    lineageIndependence: 'Local/NARA family is not independent; Toyo remains a candidate physical witness.',
    claimRelation: 'numeric/star surface only; no stable semantic placement claim.',
    deterministicChecks: ['14-row claim coverage', 'existing major-star readiness checker', 'unsupported/direct-rule blocker preservation'],
    impact: 'blocker-direct-rule-absent remains blocked; no major-star readiness promotion',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-tianfu-convention',
    family: 'tianfu_convention',
    claimIds: claims.filter((item) => item.family === 'tianfu_convention').map((item) => item.claimId),
    investigation: 'Legacy/source-aligned formulas, NARA 安天府圖/table surfaces, and Toyo 安天府 pages were compared.',
    sourceIdentity: 'Direct source surfaces exist, but no independent edition closes the anchor/direction convention.',
    directObservation: 'Nanbei 11-13, NARA 87-88, NARA v2 64-80, Toyo 0004/0008 directly reviewed.',
    lineageIndependence: 'Same-record NARA pair is non-independent; Toyo is distinct physical candidate with unresolved textual lineage.',
    claimRelation: 'formula/representation relation only; rotation-06 is not semantic authority.',
    deterministicChecks: ['Tianfu convention checker', 'rotation-06 negative mutation', 'relation artifact'],
    impact: 'blocker-tianfu-raw-formula-contradiction and blocker-tianfu-rotation06-semantic-authority remain blocked',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-auxiliary-stars',
    family: 'auxiliary_stars',
    claimIds: claims.filter((item) => item.family === 'auxiliary_stars').map((item) => item.claimId),
    investigation: 'Existing auxiliary resolver/source rows were compared with Nanbei/Nanyangtang and Toyo auxiliary vocabulary/table surfaces.',
    sourceIdentity: 'Selected vocabulary is directly observed; full independently identified placement-rule witness is absent.',
    directObservation: 'Nanbei 11-13, Nanyang 159-160, Toyo 0004/0014 directly reviewed.',
    lineageIndependence: 'Local/Nanyang/NARA lineage is not independent; Toyo is candidate only.',
    claimRelation: 'auxiliary vocabulary/table surface; not full rule authority.',
    deterministicChecks: ['auxiliary source evidence checker', 'claim rows', 'unsupported blocker ledger'],
    impact: 'blocker-auxiliary-star-source-witness remains blocked',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-four-transformations',
    family: 'four_transformations',
    claimIds: claims.filter((item) => item.family === 'four_transformations').map((item) => item.claimId),
    investigation: 'Existing 10x4 resolver/source scope was compared with NARA 四化 and Toyo 化祿/化權/化科/化忌 page surfaces.',
    sourceIdentity: 'Label/table surfaces are located; complete 10-stem x 4 source table identity and edition authority are absent.',
    directObservation: 'NARA 87-88 and Toyo 0018 directly reviewed.',
    lineageIndependence: 'NARA pair is same-record; Toyo is a distinct physical candidate only.',
    claimRelation: 'label surface only; no 10x4 source claim promoted.',
    deterministicChecks: ['four-transformations checker', '5-row coverage', 'unsupported/negative mutation'],
    impact: 'blocker-four-transform-source-witness remains blocked',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-life-body-rulers',
    family: 'life_body_rulers',
    claimIds: claims.filter((item) => item.family === 'life_body_rulers').map((item) => item.claimId),
    investigation: 'Nanyangtang selected direct pages and Toyo life/body-related pages were compared with the existing 120/144 boundary.',
    sourceIdentity: 'Selected page identity/derivative lineage is recorded; 24 ambiguous rows remain unresolved.',
    directObservation: 'Nanyang 5/145/159-160 and Toyo 0007/0014 directly reviewed.',
    lineageIndependence: 'Nanyang is same-record derivative candidate; Toyo distinct physical candidate only.',
    claimRelation: 'selected rule rows only; ambiguous rows not promoted.',
    deterministicChecks: ['life/body checker', '24-row blocker preservation', 'claim-source relation rows'],
    impact: 'blocker-life-body-ruler-source-legibility remains blocked',
    status: 'frontier_exhausted_unresolved',
  },
  {
    unitId: 'unit-calendar-input',
    family: 'calendar_input',
    claimIds: claims.filter((item) => item.family === 'calendar_input').map((item) => item.claimId),
    investigation: 'Local calendar execution and public text/catalog locators were reviewed as input provenance, not as an external oracle.',
    sourceIdentity: 'No exact external calendar edition/retrieval byte/oracle settings were admitted.',
    directObservation: 'Nanbei/Nanyang traversal-related pages are not a calendar oracle; text pages remain locator-only.',
    lineageIndependence: 'No independent external oracle identity established.',
    claimRelation: 'unsupported external source identity; local execution remains calculation fact only.',
    deterministicChecks: ['source identity blocker ledger', 'calendar input claim row', 'no-readiness-promotion invariant'],
    impact: 'blocker-calendar-time-source-identity and blocker-independent-external-oracle remain blocked',
    status: 'frontier_exhausted_unresolved',
  },
]

function distribution(items, key) {
  return Object.fromEntries([...new Set(items.map((item) => item[key]))].sort().map((value) => [value, items.filter((item) => item[key] === value).length]))
}

function currentRepository(root) {
  const git = (args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
  return { branch: git(['branch', '--show-current']), currentHead: git(['rev-parse', 'HEAD']), originMainHead: git(['rev-parse', 'origin/main']) }
}

export function buildBundle(root = resolve(new URL('..', import.meta.url).pathname), { repositoryOverride = {} } = {}) {
  const repository = { ...currentRepository(root), ...repositoryOverride }
  const sources = sourceInventory
  const claimSourceMatrix = claims
  const sourceLineageInventory = { sources, lineageRules: [
    { rule: 'same_scan_or_mirror', admission: 'not_independent', appliesTo: ['src-nanyangtang-pdf', 'src-nara-4468520', 'src-nara-4469314'] },
    { rule: 'same_catalog_record', admission: 'not_independent', appliesTo: ['src-nara-4468520', 'src-nara-4469314', 'src-nanyangtang-pdf'] },
    { rule: 'distinct_physical_witness_without_lineage_adjudication', admission: 'independent_physical_witness_candidate_only', appliesTo: ['src-toyo-1646'] },
    { rule: 'title_match_or_transcription', admission: 'not_source_identity', appliesTo: ['src-ctext', 'src-google-books', 'src-shidian-and-wikisource'] },
  ], sourceDistribution: distribution(sources, 'directObservation'), lineageDistribution: distribution(sources, 'independence') }
  const observationArtifact = { observations, observationPolicy: {
    directObservation: 'actual page/leaf image was visually reviewed; page/leaf locator and byte hash are retained where available',
    ocrAndTranscription: 'locator_only_not_direct_observation',
    externalImageStorage: 'external_temp_only_not_in_git',
    sourceBytes: 'actual PDF/JPEG hashes are recorded; hash agreement does not establish semantic authority',
  } }
  const relationArtifact = { relations, relationPolicy: {
    claimSourceAxis: 'claim ↔ source ↔ edition/lineage ↔ leaf/page ↔ direct observation ↔ independence ↔ authority',
    mergePolicy: 'same source/mirror/record never double-counted; title match never merges',
    promotionPolicy: 'partial/direct/numeric evidence cannot promote stable claim, semantic authority, readiness, interpretation, or activation',
  } }
  const blockerArtifact = { blockers, blockerPolicy: {
    statusMeaning: 'blocked and needs_human_review remain unresolved; no unsupported row is silently omitted',
    frontierConclusion: 'publicly resolvable source/witness frontier was exhausted at the access boundaries recorded here',
  } }
  const completeBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: repository.currentHead,
    observedHead: repository.currentHead,
    expectedHead: EXPECTED_HEAD,
    originMainHead: repository.originMainHead,
    branch: repository.branch,
    scope: 'read_only_exhaustive_ziwei_p0_claim_source_identity_audit_and_public_witness_frontier',
    companionFiles: ['claim-source-matrix.json', 'source-lineage-inventory.json', 'observations.json', 'relations.json', 'blockers.json'],
    coverage: {
      targetP0: ['ZIWEI-P0-CLAIM-SOURCE-IDENTITY', 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS', 'ZIWEI-P0-TIANFU-CONVENTION'],
      targetP1IncludedForClaimCoverage: ['ZIWEI-P1-FOUR-TRANSFORMATIONS', 'ZIWEI-P1-LIFE-BODY-LEGIBILITY'],
      requiredFamilies,
      claimCount: claimSourceMatrix.length,
      sourceCount: sources.length,
      observationCount: observations.length,
      relationCount: relations.length,
      blockerCount: blockers.length,
      researchUnitCount: researchUnits.length,
      claimStatusDistribution: distribution(claimSourceMatrix, 'status'),
      sourceObservationDistribution: distribution(sources, 'directObservation'),
      relationStatusDistribution: distribution(relations, 'relationStatus'),
      allRequiredFamiliesCovered: requiredFamilies.every((family) => claimSourceMatrix.some((item) => item.family === family)),
    },
    sourceFrontier: {
      publicCandidatesSearched: publicFrontier,
      conclusion: 'complete_publicly_resolvable_source_identity_witness_frontier_at_current_access_boundary',
      newWitness: 'src-toyo-1646 is a distinct physical witness candidate with direct image observations; it does not close edition/lineage/semantic authority',
      noRepositorySourceAcquisition: true,
    },
    claimBoundary: {
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      interpretationEligibleClaimCount: 0,
      productionActivationCount: 0,
      unresolvedClaimCount: claimSourceMatrix.length,
      unsupportedPreserved: true,
      directObservationIsNotSourceAuthority: true,
      catalogOnlyIsNotDirectObservation: true,
      sameLineageIsNotIndependent: true,
      numericRelationIsNotSemanticAuthority: true,
      rotation06: 'representation_only',
    },
    readinessImpact: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      existingReadinessArtifactsModified: false,
      existingProductionArtifactsModified: false,
      existingClaimBoundariesPromoted: false,
    },
    protectedChanges: {
      calculationModified: false,
      sourceResolverModified: false,
      readinessModified: false,
      productionModified: false,
      publicContractModified: false,
      activationModified: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
      preservedUntracked: ['-.jpg'],
      sourcePdfOrImageStoredInGit: false,
    },
    claimSourceMatrix,
    researchUnits,
    sourceLineageSummary: { sameRecordPairs: [['src-nara-4468520', 'src-nara-4469314'], ['src-nanyangtang-pdf', 'src-nara-4468520'], ['src-nanyangtang-pdf', 'src-nara-4469314']], independentWitnessCandidates: ['src-toyo-1646'], independentWitnessesAdmitted: [] },
    historicalContract: { expectedBaseHead: EXPECTED_HEAD, currentAndOriginVerifiedAtMaterialization: repository.currentHead === EXPECTED_HEAD && repository.originMainHead === EXPECTED_HEAD, descendantBasisReplayAllowed: true, preexistingArtifactsAreInputsNotRewritten: true },
    deterministicContract: { timestamps: 'forbidden', network: 'forbidden_during_materialization', arrayOrder: 'declaration order then stable relationId order', objectOrder: 'canonical lexicographic JSON', actualBytes: 'source/image hashes only; no automatic acquisition or repository storage', generatedAt: 'forbidden', includedCommit: null },
    blockerSummary: { unresolved: blockers.filter((item) => item.status === 'blocked').map((item) => item.id), needsHumanReview: blockers.filter((item) => item.status === 'needs_human_review').map((item) => item.id) },
    nextHumanEvidence: [
      'An institution-supplied or rights-cleared original scan/leaf set with explicit edition, date, volume, folio, colophon, and reuse permission.',
      'One complete readable diagram/table that binds all 12 palace names, branch glyphs, physical slots, ordinal, base direction, and the production coordinate convention.',
      'A source-identified Tianfu anchor/direction rule and one independently identified edition that adjudicates legacy vs source_aligned.',
      'Complete source-identified 14-star placement rules, auxiliary-star rows, and 10-stem × 4 transformation table with leaf/page context.',
      'Independent reproduction/oracle identity and exact calendar/time input source for any future readiness admission.',
    ],
    publicSourceUrls: {
      naraRecord: 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html',
      naraViewer: 'https://www.digital.archives.go.jp/img/1078787',
      toyoCatalog: 'https://www.toyo-bunko.org/open/KansekiAllQueryResult.php?ORDERBY1=&UNIT=20&andor=1&bKanjiSeiki=&iPage=4048&iTotal=86958&navizonestart=405&searchtype=keyword&sw1=',
      aksCatalog: 'https://kostma.aks.ac.kr/dataSearch/dataSearchList.aspx',
      aksViewer: 'http://kostma.korea.ac.kr/viewer/viewerDes?uci=RIKS%2BCRMA%2BKSM-WZ.0000.0000-20140423.TOYO_1646',
      ctext: 'https://ctext.org/wiki.pl?if=gb&res=979714',
      googleBooks: 'https://books.google.com/books/about/%E6%96%B0%E9%8B%9F%E5%B8%8C%E5%A4%B7%E9%99%B3%E5%85%88%E7%94%9F%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8.html?id=kxdy0QEACAAJ',
    },
    materializer: MATERIALIZER_PATH,
    checker: 'scripts/check-ziwei-p0-claim-source-identity-frontier-v1.mjs',
    negativeChecker: 'scripts/check-ziwei-p0-claim-source-identity-frontier-negative-v1.mjs',
  }
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: repository.currentHead, inputs: sourceInputs }))
  return { artifact, files: { 'claim-source-matrix.json': claimSourceMatrix, 'source-lineage-inventory.json': sourceLineageInventory, 'observations.json': observationArtifact, 'relations.json': relationArtifact, 'blockers.json': blockerArtifact } }
}

export async function materializeBundle(target = `${ARTIFACT_DIR}/complete.json`) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const targetPath = resolve(root, target)
  const directory = dirname(targetPath)
  const { artifact, files } = await buildBundle(root)
  await mkdir(directory, { recursive: true })
  const writeJson = async (path, value) => {
    const body = canonicalJson(value)
    await writeFile(path, body)
    await writeFile(`${path}.integrity.json`, canonicalJson({ schemaVersion: SCHEMA, path: relative(root, path), byteSha256: sha256(Buffer.from(body)), byteScope: 'UTF-8 JSON bytes including final LF' }))
  }
  await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) await writeJson(resolve(directory, name), value)
  return { artifact, files, targetPath }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materializeBundle(process.argv[2] || `${ARTIFACT_DIR}/complete.json`)
  console.log(JSON.stringify({ schema: SCHEMA, verdict: result.artifact.verdictToken, target: result.targetPath, claimCount: result.artifact.coverage.claimCount, sourceCount: result.artifact.coverage.sourceCount, observationCount: result.artifact.coverage.observationCount, relationCount: result.artifact.coverage.relationCount, blockerCount: result.artifact.coverage.blockerCount }, null, 2))
}
