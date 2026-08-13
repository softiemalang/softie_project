import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  checkHistoricalRepositoryBasis,
  canonicalStableArtifactJson,
} from '../src/artifactIdentity.js'
import * as v11 from './materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v12'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_anonymous_ssid_scan_and_rejected_false_positive_scans_derived_not_authoritative'
export const MATERIALIZER_VERSION = '12.0.0'
export const BASIS_HEAD = v11.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v11.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v11.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v11.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v12.md'
export const CHECKER_PATH = 'scripts/check-' + SCHEMA + '.mjs'
export const NEGATIVE_CHECKER_PATH = 'scripts/check-' + SCHEMA + '-negative-v0.mjs'

export const CANDIDATE_SSID = 'candidate-ssid-12392926-youyi-lu-anonymous-public-scan'
export const CANDIDATE_TIANYIGE = 'candidate-tianyige-0017417-chunzaitang-retained-section'
export const CANDIDATE_ZJSLIB = 'candidate-zjslib-fl-db-2452-chunzaitang-retained-section'
export const CANDIDATE_NDL_FALSE_POSITIVE = 'candidate-ndl-2545984-2545987-non-youyi-lu-manuscript-parts'
export const OBSERVATION_SSID = 'frontier-obs-ssid-12392926-youyi-lu-textual-surface'
export const OBSERVATION_TIANYIGE = 'frontier-obs-tianyige-0017417-retained-section-no-target'
export const OBSERVATION_ZJSLIB = 'frontier-obs-zjslib-fl-db-2452-retained-section-no-target'
export const OBSERVATION_NDL_FALSE_POSITIVE = 'frontier-obs-ndl-2545984-2545987-false-positive-review'

export const SSID_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:SSID-12392926_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E9%81%8A%E8%97%9D%E9%8C%84_%E8%97%9D%E4%B8%80-%E5%85%AD.pdf'
export const SSID_PDF_URL = 'https://upload.wikimedia.org/wikipedia/commons/b/b0/SSID-12392926_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E9%81%8A%E8%97%9D%E9%8C%84_%E8%97%9D%E4%B8%80-%E5%85%AD.pdf'
export const SSID_PDF_SHA256 = 'd80dc52b0a74650424397c0b5d21302532cf7473b5c059734128e2300b8275f3'
export const SSID_PDF_BYTES = 43189253
export const SSID_PDF_PAGES = 177
export const SSID_RENDER_VARIANT = 'pdftoppm override -scale-to 1400 -jpeg -jpegopt quality=82'
export const SSID_RENDER_SHA256_BY_PAGE = {
  1: '3b99b4ddff340bae09e420b8aec8d274ad9e904bcd535cce6a161713fbe008d5',
  130: '1b59a39e8286bfd8919714800fbc7dcce21609bff47ce78b9a5de980a7173ec8',
  131: '5daf87df93eef7da052e38743c416a203f63f36488467311cc11dcc66a8e6fca',
  165: '2e6af8e534a7fc9327c2768b0de687ff6fa526c189bd8dd75839bf15df696ea9',
  166: '2f91c8241efb89cc46eb58348a8412ccf9f08330b3538d58d91acc384dd57486',
  177: '946e35f584a5d535b5b8a76c6c4b7c4cb1c50666ec9812464171b48ccdb1e0b1',
}
export const SSID_RENDER_DIMENSIONS_BY_PAGE = {
  1: '783x1400',
  130: '788x1400',
  131: '788x1400',
  165: '788x1400',
  166: '788x1400',
  177: '788x1400',
}

export const TIANYIGE_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:Tianyige-330000-1705-0017417_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E5%8D%81%E4%B8%80%E7%A8%AE%EF%BC%89%E6%B8%85%E4%BF%9E%E6%A8%BE%E6%92%B0_%E6%B8%85%E5%90%8C%E6%B2%BB%E5%88%BB%E6%9C%AC.pdf'
export const TIANYIGE_PDF_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/70/Tianyige-330000-1705-0017417_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E5%8D%81%E4%B8%80%E7%A8%AE%EF%BC%89%E6%B8%85%E4%BF%9E%E6%A8%BE%E6%92%B0_%E6%B8%85%E5%90%8C%E6%B2%BB%E5%88%BB%E6%9C%AC.pdf'
export const TIANYIGE_PDF_SHA256 = 'b8d632caa8e0aa7ab61d2334e4eda578d4aa18c3ec963b7872966ca770ed2723'
export const TIANYIGE_PDF_BYTES = 15913649
export const TIANYIGE_PDF_PAGES = 54
export const TIANYIGE_RENDER_SHA256_BY_PAGE = {
  1: '609544b9a4278d7bb8e3145bb2bc41a40318a8ec614b531f8468db1373d22162',
  54: 'f58855459567f702272ba6060a5d78e9a06324162fd82cc96698805902270792',
}
export const TIANYIGE_RENDER_DIMENSIONS_BY_PAGE = { 1: '1400x1306', 54: '1400x1306' }

export const ZJSLIB_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:ZJSLib-FLDB-2452_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E4%B8%80%E7%A8%AE%EF%BC%89.pdf'
export const ZJSLIB_PDF_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/25/ZJSLib-FLDB-2452_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E4%B8%80%E7%A8%AE%EF%BC%89.pdf'
export const ZJSLIB_PDF_SHA256 = '8bbd8808fb3b85cc2f74ab39453cca90d22fffccd865ac82319a24185ed0b388'
export const ZJSLIB_PDF_BYTES = 26397994
export const ZJSLIB_PDF_PAGES = 54
export const ZJSLIB_RENDER_SHA256_BY_PAGE = {
  1: '89d996ecccc154a175e4db6be76252ceaa0f91c5b1650f3eb4d7fbfc5ae76482',
  14: 'cb630dd6ce13ecdcfe4dd4ababa74f82ad9e904bcd535cce6a161713fbe008d5',
  24: '76b4bc329886f1ba5767850afcc1a6932458f42b3c5529228c4026b591f24fc7',
  54: '825f7e5cfc79dc81ca5b89f1733b063e7c1e5c5c7dc53ce59c6b834487c48b32',
}
export const ZJSLIB_RENDER_DIMENSIONS_BY_PAGE = {
  1: '817x1400',
  14: '817x1400',
  24: '817x1400',
  54: '817x1400',
}

export const NDL_PARTS = [
  {
    part: '1',
    pid: '2545984',
    ndlUrl: 'https://ndlsearch.ndl.go.jp/books/R100000039-I2545984',
    commonsUrl: 'https://commons.wikimedia.org/wiki/File:NDL2545984_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E7%A8%BF%E6%9C%AC.(1).pdf',
    title: '春在堂襍文三編卷3',
    sha256: '5598019f7bb1241b1977d181e0d6e73b1e8b2a01c4689f59d5d890cd728e47f0',
    bytes: 120504276,
    pages: 52,
    renderSha256ByPage: { 1: 'f4a78933337de2a0cc1d4a891f7273e62c5b82b0b89d739471d630b5f358ad38', 2: '33fe2a18e59c69ba90a5377f229ebe668ef08a373b0592c7a9943deaaa6a1ca3' },
    renderDimensionsByPage: { 1: '1400x1301', 2: '1400x1301' },
  },
  {
    part: '2',
    pid: '2545985',
    ndlUrl: 'https://ndlsearch.ndl.go.jp/books/R100000039-I2545985',
    commonsUrl: 'https://commons.wikimedia.org/wiki/File:NDL2545985_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E7%A8%BF%E6%9C%AC.(2).pdf',
    title: '春在堂詩編卷9',
    sha256: '995e5d31f10dfc5854e4ed5944424f9a6edbd3cd9113c44332e785da840fc741',
    bytes: 71603842,
    pages: 32,
    renderSha256ByPage: { 1: 'e4b6330b8fd312a3d98ff3979493a389c55523b8c6ce023844dfbfbe14529faa', 2: '280acd2853d9f3beeec303a566e9a4e364b2ceb6013a29c22c6a8429aa3eb829' },
    renderDimensionsByPage: { 1: '1400x1327', 2: '1400x1327' },
  },
  {
    part: '3',
    pid: '2545986',
    ndlUrl: 'https://ndlsearch.ndl.go.jp/books/R100000039-I2545986',
    commonsUrl: 'https://commons.wikimedia.org/wiki/File:NDL2545986_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E7%A8%BF%E6%9C%AC.(3).pdf',
    title: '春在堂隨筆卷7',
    sha256: 'df0174804899a6f7b23001c15d500260f6f8ac06dfa19d3ebaf08cb02711c4ec',
    bytes: 184788054,
    pages: 79,
    renderSha256ByPage: { 1: 'a8e5ed0f2f3764ce8be6840ac2d3565d988e172e6f490207ebb9fd782e444e89', 2: '0201316ac954a0b7b58a2bed307d2ea1cca2963d7edb5026182d9797f2cff057' },
    renderDimensionsByPage: { 1: '1400x1311', 2: '1400x1311' },
  },
  {
    part: '4',
    pid: '2545987',
    ndlUrl: 'https://ndlsearch.ndl.go.jp/books/R100000039-I2545987',
    commonsUrl: 'https://commons.wikimedia.org/wiki/File:NDL2545987_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E7%A8%BF%E6%9C%AC.(4).pdf',
    title: '春在堂尺牘卷5',
    sha256: '06a5ab97a82a95aa46acbc86309d4c6b7644afb981627d09e35b085bb8778f0a',
    bytes: 78892690,
    pages: 35,
    renderSha256ByPage: { 1: '6673c5a5694fd2d159b371528694f0db49983a89f5060a41ed268ad174d8a80f', 2: '854b4e11e24b29c662bbb7b15b879690a912957909ec996e2360b743a3ad7c75' },
    renderDimensionsByPage: { 1: '1400x1314', 2: '1400x1314' },
  },
]

export const INPUT_PATHS = [...new Set([
  ...v11.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
  CHECKER_PATH,
  NEGATIVE_CHECKER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v11.canonicalJson

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  const generated = v11.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v11_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v11_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v11.SCHEMA, 'unexpected_v11_schema')
  requireValue(JSON.stringify(generated.artifact.graphImpact.successor) === JSON.stringify({ claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }), 'unexpected_v11_graph_counts')
  return { generated, stored, storedEvidence }
}

function scanCandidate({ candidateId, decision, sourceKind, sourceIdentity, locators, directReading, bindingMatrix, lineage, doesNotEstablish, directObservationStatus = 'direct_visual_original_scan_review_not_ocr' }) {
  return {
    candidateId,
    decision,
    directObservationStatus,
    directVisualReview: true,
    doesNotEnterGraph: true,
    sourceKind,
    sourceIdentity,
    locators,
    directReading,
    rawVisibleText: [],
    bindingMatrix: { ...bindingMatrix, fullBinding: false },
    lineage,
    doesNotEstablish,
  }
}

function ssidCandidate() {
  return scanCandidate({
    candidateId: CANDIDATE_SSID,
    decision: 'held_outside_graph_anonymous_ssid_scan_target_textual_surface_no_four_field_binding',
    sourceKind: 'direct_public_commons_scan_source_metadata_blank',
    sourceIdentity: {
      title: '春在堂全書 遊藝錄 藝一-六',
      sourceMetadataStatus: 'blank_on_Commons_file_page',
      coverText: '春在堂全書 第十一冊',
      authorIdentity: 'not_established_from_source_metadata',
      edition: 'not_established',
      publicationDate: null,
      holding: 'public Commons derivative attributed only to SSID-12392926 file naming',
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
    },
    locators: {
      commonsUrl: SSID_COMMONS_URL,
      pdfUrl: SSID_PDF_URL,
      sourcePdfSha256: SSID_PDF_SHA256,
      sourcePdfBytes: SSID_PDF_BYTES,
      sourcePdfPages: SSID_PDF_PAGES,
      directVisualReviewPages: [1, 130, 131, 132, 165, 166, 177],
      renderVariant: SSID_RENDER_VARIANT,
      renderedFileSha256ByPage: SSID_RENDER_SHA256_BY_PAGE,
      renderedDimensionsByPage: SSID_RENDER_DIMENSIONS_BY_PAGE,
      sourceBytesStoredInGit: false,
    },
    directReading: [
      'The 177-page PDF was directly rendered and reviewed. The cover visibly reads 春在堂全書 第十一冊, but the file page supplies no authoritative holding, edition, or publication metadata.',
      'Pages 130-165 visibly contain 紫微斗數篇 material, named-palace and 命/身宮 text, branch/rule and star/table surfaces, including 安天府圖-related material. The direct pages are vertical text and ruled/table columns, not a single perimeter chart frame.',
      'Pages 166-177 continue into 相宅篇 and the end of 游藝錄五 before 游藝錄六; the reviewed tail adds no complete named-palace-to-physical-slot frame.',
      'The scan is useful direct textual-surface evidence, but source identity, edition lineage, independence from the existing Zhejiang/NLC/CADAL path, and a production ordinal remain unresolved.',
    ],
    bindingMatrix: {
      branchToken: 'partial_direct_textual_rule_and_table',
      palaceName: 'partial_direct_named_palace_sequence',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'partial_direct',
    },
    lineage: {
      sourceIdentityEstablished: false,
      independentPhysicalWitness: false,
      publicationDateEstablished: false,
      relationToExistingYouyiLuScans: 'unresolved_same-copy-or-related-reprint-not-closed',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'source_identity_or_edition_lineage',
      'independent_historical_witness',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_compass_direction',
      'single_frame_four_field_binding',
      'semantic_authority',
      '1871_page_level_lineage',
    ],
  })
}

function tianyigeCandidate() {
  return scanCandidate({
    candidateId: CANDIDATE_TIANYIGE,
    decision: 'held_outside_graph_tianyige_retained_section_reviewed_target_chapter_absent',
    sourceKind: 'direct_tianyige_scan_retained_section_target_absent',
    sourceIdentity: {
      title: '春在堂全書（存十一種）',
      author: '清俞樾撰',
      edition: '清同治刻本',
      sourceInstitution: '天一閣博物館',
      catalogIdentifier: '330000-1705-0017417',
      sourceAuthority: 'catalog_identity_only_for_retained_item',
      semanticAuthority: 'not_established',
    },
    locators: {
      commonsUrl: TIANYIGE_COMMONS_URL,
      pdfUrl: TIANYIGE_PDF_URL,
      sourcePdfSha256: TIANYIGE_PDF_SHA256,
      sourcePdfBytes: TIANYIGE_PDF_BYTES,
      sourcePdfPages: TIANYIGE_PDF_PAGES,
      directVisualReviewPages: [1, 54],
      reviewedPageRange: 'p1-p54 retained scan sequence',
      renderVariant: SSID_RENDER_VARIANT,
      renderedFileSha256ByPage: TIANYIGE_RENDER_SHA256_BY_PAGE,
      renderedDimensionsByPage: TIANYIGE_RENDER_DIMENSIONS_BY_PAGE,
      sourceBytesStoredInGit: false,
    },
    directReading: [
      'The 54-page PDF is a genuine old-book scan and its Commons metadata describes a 清同治刻本 retained collection.',
      'The directly reviewed retained pages show 錄要, 校勘記, catalog/index, errata, and other 春在堂 material; the target 游藝錄五/紫微斗數篇 chapter is not present in this 54-page scan.',
      'Because the target chapter is absent from the acquired retained section, this item cannot witness the requested palace-coordinate binding even though its catalog edition metadata is historically relevant.',
    ],
    bindingMatrix: {
      branchToken: 'not_observed_in_target_section',
      palaceName: 'not_observed_in_target_section',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'not_observed',
    },
    lineage: {
      sourceIdentityEstablished: true,
      independentPhysicalWitness: false,
      targetChapterPresent: false,
      publicationDateEstablished: true,
      relationToExistingYouyiLuScans: 'target-chapter-identity-not-testable-from-retained-section',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'target 游藝錄 紫微斗數篇 page witness',
      'palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_direction',
      'independent_target_chapter_witness',
      'semantic_authority',
    ],
  })
}

function zjslibCandidate() {
  return scanCandidate({
    candidateId: CANDIDATE_ZJSLIB,
    decision: 'held_outside_graph_zhuji_retained_section_reviewed_target_chapter_absent',
    sourceKind: 'direct_zhuji_library_scan_retained_section_target_absent',
    sourceIdentity: {
      title: '春在堂全書（存一種）',
      edition: '清光緒二十五年刻本',
      publicationDate: '光緒二十五年 [1899]',
      sourceInstitution: '諸暨市圖書館',
      catalogIdentifier: 'ZJSLib-FLDB-2452',
      callNumber: '乙61',
      sourceAuthority: 'catalog_identity_only_for_retained_item',
      semanticAuthority: 'not_established',
    },
    locators: {
      commonsUrl: ZJSLIB_COMMONS_URL,
      pdfUrl: ZJSLIB_PDF_URL,
      sourcePdfSha256: ZJSLIB_PDF_SHA256,
      sourcePdfBytes: ZJSLIB_PDF_BYTES,
      sourcePdfPages: ZJSLIB_PDF_PAGES,
      directVisualReviewPages: [1, 14, 24, 54],
      reviewedPageRange: 'p1-p54 retained scan sequence',
      renderVariant: SSID_RENDER_VARIANT,
      renderedFileSha256ByPage: ZJSLIB_RENDER_SHA256_BY_PAGE,
      renderedDimensionsByPage: ZJSLIB_RENDER_DIMENSIONS_BY_PAGE,
      sourceBytesStoredInGit: false,
    },
    directReading: [
      'The 54-page PDF is a watermarked library scan with 諸暨圖書館 marks, calligraphic/title surfaces, and other retained 春在堂 material.',
      'The directly reviewed sequence does not contain the target 游藝錄五/紫微斗數篇 chapter or a four-field chart; the item therefore remains a retained-section candidate rather than a target witness.',
      'The 光緒二十五年 catalog metadata is not silently promoted to a page-level target identity or semantic authority.',
    ],
    bindingMatrix: {
      branchToken: 'not_observed_in_target_section',
      palaceName: 'not_observed_in_target_section',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'not_observed',
    },
    lineage: {
      sourceIdentityEstablished: true,
      independentPhysicalWitness: false,
      targetChapterPresent: false,
      publicationDateEstablished: true,
      relationToExistingYouyiLuScans: 'target-chapter-identity-not-testable-from-retained-section',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'target 游藝錄 紫微斗數篇 page witness',
      'palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_direction',
      'independent_target_chapter_witness',
      'semantic_authority',
    ],
  })
}

function ndlFalsePositiveCandidate() {
  return scanCandidate({
    candidateId: CANDIDATE_NDL_FALSE_POSITIVE,
    decision: 'held_outside_graph_ndl_public_scan_false_positive_different_manuscript_parts_not_target_1871_witness',
    sourceKind: 'direct_ndl_manuscript_scan_false_positive_group',
    sourceIdentity: {
      title: '春在堂全書稿本',
      author: '(清) 兪樾 撰',
      actualNdlBibId: '000007637582',
      actualCallNumber: 'WA37-5',
      targetNdlPid: '2606209',
      targetRecordMatch: false,
      sourceMetadataStatus: 'direct_NDL/Commons_part_metadata_reviewed',
      sourceAuthority: 'catalog_identity_for_different_manuscript_parts_only',
      semanticAuthority: 'not_established',
    },
    locators: {
      directVisualReviewPagesByPart: Object.fromEntries(NDL_PARTS.map(part => [part.part, [1, 2]])),
      parts: NDL_PARTS.map(part => ({
        part: part.part,
        pid: part.pid,
        ndlUrl: part.ndlUrl,
        commonsUrl: part.commonsUrl,
        title: part.title,
        sourcePdfSha256: part.sha256,
        sourcePdfBytes: part.bytes,
        sourcePdfPages: part.pages,
        renderVariant: SSID_RENDER_VARIANT,
        renderedFileSha256ByPage: part.renderSha256ByPage,
        renderedDimensionsByPage: part.renderDimensionsByPage,
      })),
      sourceBytesStoredInGit: false,
    },
    directReading: [
      'The four downloaded NDL/Commons PDFs were directly opened and rendered at pages 1-2. They are modern NDL digitization photographs with NDL labels/calibration surfaces, not the 1871 游藝錄 target section.',
      'The parts identify 春在堂襍文三編卷3, 春在堂詩編卷9, 春在堂隨筆卷7, and 春在堂尺牘卷5 under NDLBibID 000007637582; they do not match NDL PID 2606209 or contain the reviewed 游藝錄/紫微斗數篇.',
      'This is a resolved acquisition false positive: the bytes are real direct scans, but they cannot be promoted to the 1871 target witness or to any palace-coordinate graph relation.',
    ],
    bindingMatrix: {
      branchToken: 'not_observed_in_non_target_parts',
      palaceName: 'not_observed_in_non_target_parts',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'not_observed',
    },
    lineage: {
      sourceIdentityEstablished: true,
      independentPhysicalWitness: false,
      targetChapterPresent: false,
      targetNdlRecordMatch: false,
      publicationDateEstablished: false,
      relationTo1871YouyiLu: 'false_positive_different_manuscript_parts',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'NDL PID 2606209 page identity',
      '1871 游藝錄 page witness',
      '1871 to 1883 textual or block lineage',
      'palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_direction',
      'semantic_authority',
    ],
  })
}

function frontierObservation(candidate, observationId, directVisualFindings) {
  return {
    observationId,
    candidateId: candidate.candidateId,
    directVisualFindings,
    fourFieldBinding: candidate.bindingMatrix,
    locator: candidate.locators,
    graphAdmission: false,
    sourceAdmission: false,
    semanticAuthority: false,
    readinessImpact: 'none; existing readiness remains not_safe_to_start',
    directObservationStatus: candidate.directObservationStatus,
  }
}

function newCandidates() {
  return [ssidCandidate(), tianyigeCandidate(), zjslibCandidate(), ndlFalsePositiveCandidate()]
}

function updateFrontier(previous, candidates, observations) {
  const frontier = clone(previous.lineageAssessment.researchFrontier)
  frontier.schemaVersion = SCHEMA + '-research-frontier-v0'
  frontier.status = 'anonymous_ssid_target_scan_and_tianyige_zhuji_ndl_false_positive_review_no_graph_admission'
  frontier.researchSessionDate = '2026-08-13'
  frontier.candidates = [...clone(frontier.candidates), ...candidates]
  frontier.frontierOnlySources = unique([...(frontier.frontierOnlySources || []), ...candidates.map(item => item.candidateId)])
  frontier.frontierOnlyObservations = [...(frontier.frontierOnlyObservations || []), ...observations]
  frontier.admissionBoundary = `${frontier.admissionBoundary}; v12 directly reviews the anonymous SSID target scan and three additional scan routes. SSID supplies target textual/rule surfaces but no source identity, independent lineage, physical slot, or production ordinal; Tianyige and Zhuji retained sections lack the target chapter; NDL 2545984-2545987 are direct false-positive manuscript parts distinct from PID 2606209. None enters the graph.`
  frontier.graphImpact = {
    ...clone(frontier.graphImpact),
    claimsAdded: 0,
    sourcesAdded: [],
    observationsAdded: [],
    relationsAdded: [],
    blockersClosed: [],
    independentPhysicalWitnessesAdmitted: 0,
  }
  return frontier
}

function updateEvidence(previous, frontier, candidates, observations) {
  const evidence = clone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'v12 directly reviews an anonymous SSID scan containing the target 紫微斗數篇 textual surface, two retained 春在堂 scan candidates without the target chapter, and four NDL/Commons manuscript-part PDFs that are direct false positives for the 1871 PID route. Direct scan bytes and rendered page hashes establish observation identity only; they do not establish source authority, independent witness status, palace-name to physical slot, production ordinal, semantic authority, readiness, or activation.'
  evidence.researchFrontier = frontier
  evidence.frontierOnlyObservations = frontier.frontierOnlyObservations
  evidence.heldOutDirectScanReview = {
    ...clone(previous.evidence.heldOutDirectScanReview),
    candidateIds: [...(previous.evidence.heldOutDirectScanReview?.candidateIds || []), ...candidates.map(item => item.candidateId)],
    candidates: [...(previous.evidence.heldOutDirectScanReview?.candidates || []), ...candidates],
    graphAdmission: 'none',
    independentWitnessesAdmitted: 0,
    fullBindingCount: 0,
    falsePositiveReview: {
      candidateId: CANDIDATE_NDL_FALSE_POSITIVE,
      targetNdlPid: '2606209',
      actualNdlBibId: '000007637582',
      targetSectionPresent: false,
      targetRecordMatch: false,
    },
  }
  evidence.v12DirectScanReview = {
    candidateIds: candidates.map(item => item.candidateId),
    observationIds: observations.map(item => item.observationId),
    graphAdmission: false,
    independentWitnessesAdmitted: 0,
    fullBindingCount: 0,
    sourceAuthorityPromoted: false,
    semanticAuthorityPromoted: false,
  }
  evidence.earlierEdition1871Recheck = {
    ...clone(previous.evidence.earlierEdition1871Recheck),
    pageBytesObtained: false,
    textualLineageClosed: false,
    directCandidateReview: {
      ssidTargetTextBytes: true,
      historical1871TargetBytes: false,
      tianyigeTargetChapterPresent: false,
      zjslibTargetChapterPresent: false,
      ndlFalsePositiveTargetRecordMatch: false,
      candidateIds: candidates.map(item => item.candidateId),
    },
    graphAdmission: false,
  }
  evidence.reportedNonObservations = unique([
    ...(evidence.reportedNonObservations || []),
    'The SSID scan directly contains 紫微斗數篇 text and named-palace/rule/table surfaces, but no reviewed page supplies a single physical chart frame binding palace name, branch, slot, and ordinal.',
    'The SSID Commons file page has blank source metadata; its cover label is not an edition or 1871 lineage proof, and independence from existing Zhejiang/NLC/CADAL scans remains unresolved.',
    'The Tianyige 54-page retained scan was directly reviewed as old-book material, but the retained pages do not contain 游藝錄五/紫微斗數篇.',
    'The Zhuji 54-page retained scan was directly reviewed, but the retained pages do not contain 游藝錄五/紫微斗數篇.',
    'NDL 2545984-2545987 direct scans are 春在堂襍文三編卷3, 春在堂詩編卷9, 春在堂隨筆卷7, and 春在堂尺牘卷5 under NDLBibID 000007637582; they are not NDL PID 2606209 and are not 1871 游藝錄 page bytes.',
    'No v12 direct scan closes source identity, independent witness status, physical chart slot, production ordinal, semantic authority, or readiness.',
  ])
  return evidence
}

function frontierBindingRow(candidate, role) {
  return {
    candidateId: candidate.candidateId,
    role,
    sourceAdmission: false,
    independentHistoricalWitness: false,
    branchToken: candidate.bindingMatrix.branchToken,
    palaceName: candidate.bindingMatrix.palaceName,
    physicalSlot: candidate.bindingMatrix.physicalSlot,
    ordinalDirection: candidate.bindingMatrix.ordinalDirection,
    workedExample: candidate.bindingMatrix.workedExample,
    fullBinding: false,
    productionOrdinal: false,
    semanticAuthority: false,
  }
}

function updateBindingMatrix(previous, candidates) {
  const matrix = clone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.researchFrontierBoundary = {
    ...clone(matrix.researchFrontierBoundary),
    reviewedCandidateCount: (matrix.researchFrontierBoundary?.reviewedCandidateCount || 0) + candidates.length,
    heldOutDirectScanCandidateCount: 6,
    sameRecordFollowupCount: matrix.researchFrontierBoundary?.sameRecordFollowupCount || 1,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    status: 'anonymous_target_scan_and_false_positive_scans_no_new_graph_admission',
  }
  matrix.frontierOnlyBindingRows = [
    ...(matrix.frontierOnlyBindingRows || []),
    frontierBindingRow(candidates[0], 'held_out_anonymous_target_scan_textual_rule_surface'),
    frontierBindingRow(candidates[1], 'held_out_tianyige_retained_section_target_absent'),
    frontierBindingRow(candidates[2], 'held_out_zhuji_retained_section_target_absent'),
    frontierBindingRow(candidates[3], 'held_out_ndl_false_positive_non_target_manuscript_parts'),
  ]
  matrix.composition.additionalDirectWitnessLimitations = [
    ...clone(matrix.composition.additionalDirectWitnessLimitations),
    'v12 SSID p130-p165 directly adds target textual/rule/table surfaces, but no reviewed frame binds named palaces to physical slots or a production ordinal and source independence is unresolved.',
    'v12 Tianyige and Zhuji retained scans lack the target 游藝錄紫微斗數篇 section; their catalog edition metadata is not a target page witness.',
    'v12 NDL 2545984-2545987 are direct scans of different 春在堂 manuscript parts and do not match NDL PID 2606209.',
  ]
  matrix.composition.unprovenJoinPremises = unique([
    ...clone(matrix.composition.unprovenJoinPremises),
    'The anonymous SSID target scan is independent of the existing Zhejiang/NLC/CADAL scan family and shares its coordinate frame.',
    'The SSID textual palace/rule/table sequence supplies a physical chart slot or production ordinal not visible in the reviewed pages.',
    'Tianyige or Zhuji retained-section metadata can substitute for absent target chapter page bytes.',
    'NDL 2545984-2545987 can be identified with NDL PID 2606209 despite their distinct NDLBibID and part titles.',
  ])
  return matrix
}

function updateLineage(previous, frontier, candidates) {
  const lineage = clone(previous.lineageAssessment)
  lineage.schemaVersion = SCHEMA + '-lineage-v0'
  lineage.researchFrontier = frontier
  lineage.frontierLineageAssessments = [
    ...(lineage.frontierLineageAssessments || []),
    { candidateId: CANDIDATE_SSID, independentPhysicalWitness: false, publicationDateEstablished: false, relationToExistingGraph: 'unresolved', targetTextualSurface: true, semanticAuthority: 'not_established', graphAdmission: false },
    { candidateId: CANDIDATE_TIANYIGE, independentPhysicalWitness: false, targetChapterPresent: false, publicationDateEstablished: true, relationToExistingGraph: 'target-section-absent', semanticAuthority: 'not_established', graphAdmission: false },
    { candidateId: CANDIDATE_ZJSLIB, independentPhysicalWitness: false, targetChapterPresent: false, publicationDateEstablished: true, relationToExistingGraph: 'target-section-absent', semanticAuthority: 'not_established', graphAdmission: false },
    { candidateId: CANDIDATE_NDL_FALSE_POSITIVE, independentPhysicalWitness: false, targetChapterPresent: false, targetNdlRecordMatch: false, actualNdlBibId: '000007637582', semanticAuthority: 'not_established', graphAdmission: false },
  ]
  lineage.sourceIdentityStatus = `${previous.lineageAssessment.sourceIdentityStatus}; v12 adds a direct anonymous SSID target scan without source metadata, two retained-section scans without the target chapter, and an NDL false-positive group whose NDLBibID differs from PID 2606209`
  lineage.independenceStatus = 'No v12 candidate is admitted as an independent target witness: SSID source identity and relation to existing scans are unresolved; Tianyige and Zhuji retained sections lack the target chapter; NDL 2545984-2545987 are different manuscript parts under NDLBibID 000007637582.'
  lineage.independentWitnessStatus = 'not_admitted'
  lineage.physicalWitnessCandidatesAdded = clone(previous.lineageAssessment.physicalWitnessCandidatesAdded)
  lineage.frontierCandidateReview = {
    ...clone(previous.lineageAssessment.frontierCandidateReview),
    candidateIds: unique([...(previous.lineageAssessment.frontierCandidateReview?.candidateIds || []), ...candidates.map(item => item.candidateId)]),
    directReview: true,
    graphAdmission: false,
    fullBindingCount: 0,
    independentWitnessCount: 0,
    publicationDateResolvedCount: 0,
    targetSectionPresentCount: 1,
    falsePositiveCount: 1,
  }
  lineage.earlierEdition1871 = {
    ...clone(previous.lineageAssessment.earlierEdition1871),
    textualLineageClosed: false,
    catalogFormatComparisonDirectBytes: false,
    v12DirectCandidateReview: {
      ssidTargetScanReviewed: true,
      historical1871ScanObtained: false,
      tianyigeTargetChapterPresent: false,
      zjslibTargetChapterPresent: false,
      ndlFalsePositiveTargetRecordMatch: false,
    },
  }
  return lineage
}

function updateFieldKit(previous, evidencePath) {
  const fieldKit = clone(previous.fieldKitImpact)
  fieldKit.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKit.targetReassessment = fieldKit.targetReassessment.map(item => {
    if (item.targetId === 'acq-distinct-witness-identity-lineage') {
      return { ...item, newEvidenceRole: 'v12 directly reviews an anonymous SSID target scan, two retained-section scans without the target chapter, and NDL false-positive manuscript parts; no distinct target-witness identity or lineage is closed', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    }
    if (item.targetId === 'acq-palace-semantic-map-and-coordinate-witness') {
      return { ...item, newEvidenceRole: 'SSID adds direct named-palace/rule/table text but no physical slot or ordinal; Tianyige/Zhuji omit the target and NDL parts are false positives, so the complete coordinate witness remains action_required', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    }
    if (item.targetId === 'acq-tianfu-anchor-direction-adjudicator') {
      return { ...item, newEvidenceRole: 'SSID includes direct target Tianfu-related text/table surfaces, but no single frame adjudicates physical slot, production ordinal, or semantic authority', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    }
    return item
  })
  fieldKit.heldEvidenceUpdate = 'v12 records one anonymous target scan and three rejected scan routes. The target scan remains source/lineage unresolved and lacks a four-field frame; the two retained sections omit the target chapter; the NDL group is a direct false positive. No source identity, palace-to-slot, ordinal, semantic authority, readiness, or activation gate closes.'
  fieldKit.evidenceObservationIds = unique([...(fieldKit.evidenceObservationIds || []), OBSERVATION_SSID, OBSERVATION_TIANYIGE, OBSERVATION_ZJSLIB, OBSERVATION_NDL_FALSE_POSITIVE])
  fieldKit.researchFrontier = {
    ...fieldKit.researchFrontier,
    evidenceRefs: unique([...(fieldKit.researchFrontier?.evidenceRefs || []), evidencePath]),
    reviewedCandidateCount: (fieldKit.researchFrontier?.reviewedCandidateCount || 0) + 4,
    heldOutDirectScanCandidateCount: 6,
    sameRecordFollowupCount: fieldKit.researchFrontier?.sameRecordFollowupCount || 1,
    admittedCandidateCount: 0,
    graphAdmittedFrontierCandidateCount: fieldKit.researchFrontier?.graphAdmittedFrontierCandidateCount || 0,
    status: 'anonymous_target_scan_and_false_positive_scans_no_new_graph_admission',
  }
  fieldKit.semanticTargetStillOpen = true
  fieldKit.sourceIdentityTargetStillActionRequired = true
  fieldKit.rightsTargetStillHumanPolicyReview = true
  return fieldKit
}

function buildArtifact(root = ROOT, { mode = 'exact' } = {}) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), 'missing_input:' + path)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'composition_requires_main')
  if (mode === 'exact') {
    requireValue(repo.currentHead === BASIS_HEAD, 'composition_basis_must_be_current_head')
    requireValue(repo.originMainHead === BASIS_HEAD, 'composition_origin_must_match_basis_head')
  } else if (mode === 'historical_reference') {
    const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
    requireValue(historical.errors.length === 0, 'historical_reference_basis_invalid:' + historical.errors.join(','))
  } else {
    requireValue(false, 'unsupported_materialization_mode:' + mode)
  }

  const predecessor = predecessorInput(root, { mode })
  const previous = predecessor.generated.artifact
  const candidates = newCandidates()
  const observations = [
    frontierObservation(candidates[0], OBSERVATION_SSID, ['SSID p1, p130-p165, and p166-p177 were directly rendered/reviewed. The target 紫微斗數篇 text and named-palace/rule/table surfaces are visible, but no single frame binds physical slot and ordinal.']),
    frontierObservation(candidates[1], OBSERVATION_TIANYIGE, ['The 54-page Tianyige retained scan was directly reviewed; its retained catalog/校勘/other 春在堂 pages do not contain the target 游藝錄紫微斗數篇 chapter.']),
    frontierObservation(candidates[2], OBSERVATION_ZJSLIB, ['The 54-page Zhuji retained scan was directly reviewed; its retained pages do not contain the target 游藝錄紫微斗數篇 chapter.']),
    frontierObservation(candidates[3], OBSERVATION_NDL_FALSE_POSITIVE, ['NDL/Commons 2545984-2545987 pages 1-2 were directly reviewed. They are distinct manuscript parts under NDLBibID 000007637582, not PID 2606209 and not the target 游藝錄 witness.']),
  ]
  const frontier = updateFrontier(previous, candidates, observations)
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const evidence = updateEvidence(previous, frontier, candidates, observations)
  const bindingMatrix = updateBindingMatrix(previous, candidates)
  const lineageAssessment = updateLineage(previous, frontier, candidates)
  const fieldKitImpact = updateFieldKit(previous, evidencePath)
  const previousGraph = previous.graphImpact.successor
  const protectedAsset = clone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')
  const blockerStatusCounts = clone(previous.graphImpact.blockerStatusCounts)

  const completeBase = {
    ...clone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive direct review of an anonymous SSID target scan plus Tianyige/Zhuji retained sections and NDL false-positive manuscript parts; no graph, source, semantic, readiness, or activation promotion',
      heldOutResearchCandidateCount: (previous.scope.heldOutResearchCandidateCount || 0) + 4,
      researchCandidatesAdmitted: previous.scope.researchCandidatesAdmitted,
      sameRecordFollowupReviewPerformed: true,
      heldOutDirectScanReviewPerformed: true,
      heldOutDirectScanCandidateCount: 6,
      externalDirectScanReviewPerformed: true,
      historical1871ScanObtained: false,
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
    },
    predecessorChain: [
      ...clone(previous.predecessorChain),
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...clone(previous.sourceLineage),
      researchFrontierOnlySources: unique([...(previous.sourceLineage.researchFrontierOnlySources || []), ...candidates.map(item => item.candidateId)]),
      sameRecordFollowupCandidate: previous.sourceLineage.sameRecordFollowupCandidate,
      independentPhysicalWitnessesAdmitted: 0,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      independenceStatus: lineageAssessment.independenceStatus,
      sourceIdentityStatus: lineageAssessment.sourceIdentityStatus,
    },
    evidence,
    observations: clone(previous.observations),
    relations: clone(previous.relations),
    claimReconciliation: clone(previous.claimReconciliation),
    blockerReassessment: clone(previous.blockerReassessment),
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    graphImpact: {
      predecessor: clone(previousGraph),
      additive: { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 },
      successor: clone(previousGraph),
      claimsAdded: 0,
      sourcesAdded: [],
      physicalWitnessesAdded: [],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds: [],
      addedRelationIds: [],
      blockersClosed: [],
      blockersStillOpen: clone(previous.graphImpact.blockersStillOpen),
      blockerStatusCounts,
      researchFrontier: {
        ...clone(previous.graphImpact.researchFrontier),
        sourcesAdded: [],
        observationsAdded: [],
        relationsAdded: [],
        blockersClosed: [],
        claimsAdded: 0,
        independentPhysicalWitnessesAdmitted: 0,
      },
    },
    claimImpact: {
      ...clone(previous.claimImpact),
      claimsAdded: 0,
      claimsPromoted: 0,
      directSemanticClaimSupportAdded: [],
      researchFrontierClaimsAdded: 0,
      researchFrontierSemanticSupportAdded: 0,
      semanticAuthorityCount: 0,
      boundary: 'v12 records a directly reviewed anonymous target scan and explicit false-positive scan routes outside the semantic graph. SSID textual/rule/table surfaces do not establish a single-frame palace-name ↔ branch ↔ physical-slot ↔ production-ordinal binding; the retained-section and NDL routes do not supply target pages.',
    },
    blockerImpact: {
      ...clone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...clone(previous.blockerImpact.resolvedSubBoundaries),
        'SSID p130-p165 directly confirms a target 紫微斗數篇 textual/rule/table surface, while the physical-slot and production-ordinal join remains unobserved and source independence remains unresolved',
        'Tianyige and Zhuji scan candidates were directly checked and their retained sections do not contain the target chapter',
        'NDL 2545984-2545987 were directly checked as false positives: distinct NDLBibID 000007637582 manuscript parts, not PID 2606209 or target 1871 游藝錄 pages',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    readinessImpact: {
      ...clone(previous.readinessImpact),
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
    },
    preservation: {
      ...clone(previous.preservation),
      predecessorArtifactsRewritten: false,
      historicalPredecessorBytesRewritten: false,
      existingFieldKitRewritten: false,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      sourceBytesAcquiredOutsideRepo: true,
      externalWebSourceBytesStoredInGit: false,
      materializerNetworkUsed: false,
      protectedAsset,
      productionChanged: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
    },
    deterministicContract: {
      ...clone(previous.deterministicContract),
      sourceBytes: 'v12 records fixed SSID, Tianyige, Zhuji, and NDL source-PDF SHA-256 identities plus selected fixed rendered-page hashes. Materialization performs no network acquisition and treats OCR/text extraction as locator-only.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings are fixed evidence metadata and OCR/text extraction is locator-only',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'promoting the anonymous SSID scan into an independently lineaged source or semantic authority because it contains 紫微斗數篇 text',
        'treating SSID named-palace/rule/table text as a physical chart slot, production ordinal, or compass direction',
        'treating the Tianyige 清同治刻本 metadata as target chapter page evidence when the retained scan lacks 游藝錄紫微斗數篇',
        'treating the Zhuji 清光緒二十五年刻本 metadata as target chapter page evidence when the retained scan lacks 游藝錄紫微斗數篇',
        'treating NDL 2545984-2545987 as NDL PID 2606209 or as a 1871 游藝錄 scan despite distinct NDLBibID and part titles',
        'promoting any v12 held-out candidate into graph sources, observations, relations, claims, readiness, or activation',
      ]),
    },
    materializer: MATERIALIZER_PATH,
    checker: CHECKER_PATH,
    negativeChecker: NEGATIVE_CHECKER_PATH,
  }
  delete completeBase.artifactIdentity
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASIS_HEAD,
    inputs: INPUT_PATHS,
  }))
  const files = {
    'evidence.json': evidence,
    'binding-matrix.json': bindingMatrix,
    'lineage-assessment.json': lineageAssessment,
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertainty: artifact.lineageAssessment,
    },
    'field-kit-impact.json': {
      schemaVersion: SCHEMA + '-field-kit-v0',
      ...fieldKitImpact,
      closureBoundary: {
        sourceIdentityTarget: 'action_required',
        palaceSemanticTarget: 'action_required',
        productionOrdinalTarget: 'not_established',
        imageReuseTarget: 'human_policy_review',
        researchFrontierAdmission: 'held_outside_graph_anonymous_target_scan_retained_section_reviews_and_ndl_false_positive',
      },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT, options = {}) { return buildArtifact(root, options) }

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const { artifact, files } = buildArtifact(ROOT, options)
  const targetPath = resolve(target)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(path + '.integrity.json', canonicalJson({
      schemaVersion: SCHEMA + '-integrity-v0',
      path: relative(ROOT, path),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
    return sha256(body)
  }
  const completeSha256 = await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) {
    const path = resolve(directory, name)
    outputs[name] = path
    await writeJson(path, value)
  }
  return { artifact, files, outputs, targetPath, completeSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materializeBundle(resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({
    target: result.targetPath,
    schema: SCHEMA,
    verdict: VERDICT,
    basisHead: BASIS_HEAD,
    predecessorSchema: v11.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    graphAdditive: result.artifact.graphImpact.additive,
    heldOutCandidateIds: [CANDIDATE_SSID, CANDIDATE_TIANYIGE, CANDIDATE_ZJSLIB, CANDIDATE_NDL_FALSE_POSITIVE],
    heldOutDirectScanCandidateCount: result.artifact.scope.heldOutDirectScanCandidateCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
