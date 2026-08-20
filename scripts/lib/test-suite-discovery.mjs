import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const toPosix = value => value.split(sep).join('/')

export const ZIWEI_P0_HISTORICAL_TEST_FILES = Object.freeze([
  'ziweiP0PalaceBranchSlotCompositionV3.test.js',
  'ziweiP0PalaceBranchSlotCompositionV4.test.js',
  'ziweiP0PalaceBranchSlotCompositionV5.test.js',
  'ziweiP0PalaceBranchSlotCompositionV6.test.js',
  'ziweiP0PalaceBranchSlotCompositionV7.test.js',
  'ziweiP0PalaceBranchSlotCompositionV8.test.js',
  'ziweiP0PalaceBranchSlotCompositionV9.test.js',
  'ziweiP0PalaceBranchSlotCompositionV10.test.js',
  'ziweiP0PalaceBranchSlotCompositionV11.test.js',
  'ziweiP0PalaceBranchSlotCompositionV12.test.js',
  'ziweiP0PalaceBranchSlotCompositionV13.test.js',
  'ziweiP0PalaceBranchSlotCompositionV14.test.js',
  'ziweiP0PalaceBranchSlotCompositionV15.test.js',
])

export const SAJU_HISTORICAL_TEST_FILES = Object.freeze([
  'sajuFiveClassicsClaimAdjudicationHistorical.test.js',
  'sajuFiveClassicsClaimProvenanceClosureHistorical.test.js',
  'sajuFiveClassicsResearchContinuationHistorical.test.js',
  'sajuFiveClassicsTypedReadinessContractHistorical.test.js',
  'sajuGeminiWitnessDossierAdjudicationHistorical.test.js',
  'sajuLunaP0EvidenceAcquisitionV2Historical.test.js',
  'sajuFiveClassicsSourceIdentityFrontierHistorical.test.js',
  'sajuTimingAuthorityFrontierHistorical.test.js',
])

export const HISTORICAL_TEST_FILES = Object.freeze([
  ...ZIWEI_P0_HISTORICAL_TEST_FILES,
  ...SAJU_HISTORICAL_TEST_FILES,
])

export const SOURCE_TEST_FILES = Object.freeze([
  'sajuFiveClassicsClaimProvenanceClosure.test.js',
  'sajuFiveClassicsSourceIdentityFrontier.test.js',
  'sajuLocalSourceCorpusObservation.test.js',
  'ziweiArchiveScanSourceWitnessAdmission.test.js',
  'ziweiAuxiliaryStarPlacementCoreEvidence.test.js',
  'ziweiFiveElementBureauCleanRuleSeedPilot.test.js',
  'ziweiFiveElementBureauSeedAcceptance.test.js',
  'ziweiFourTransformationsSourceEvidence.test.js',
  'ziweiLifeBodyPalaceRulerSourceEvidence.test.js',
  'ziweiMajorStarSourceCorpusProvenance.test.js',
  'ziweiMingFourTransformationsSourceScope.test.js',
  'ziweiMingShenCleanRuleSeedPilot.test.js',
  'ziweiMingShenSeedAcceptance.test.js',
  'ziweiNaraIiifLeafmapSemanticWitness.test.js',
  'ziweiP0LocalFrontierReconciliation.test.js',
  'ziweiP0Toyo1646ExtendedObservation.test.js',
  'ziweiPalaceCoordinateSemanticIdentity.test.js',
  'ziweiPalaceSemanticSourceFrontier.test.js',
  'ziweiTianfuPlacementDiscrepancyAnalysis.test.js',
  'ziweiTianfuRepresentationSearch.test.js',
  'ziweiTianfuStarPlacementCleanRuleSeedPilot.test.js',
  'ziweiTraditionalSourceComparison.test.js',
  'ziweiTwelveMajorStarPlacementEvidence.test.js',
  'ziweiZiweiStarPlacementAcceptance.test.js',
  'ziweiZiweiStarPlacementCleanRuleSeedPilot.test.js',
  'ziweiZixingTianfuSourceChain.test.js',
])

export const TEST_PROFILES = Object.freeze(['default', 'source', 'historical', 'artifact', 'all'])

async function walk(directory, rootDirectory, excludedDirectory = null) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name)
    const relativePath = toPosix(relative(rootDirectory, absolutePath))
    if (entry.isDirectory()) {
      if (excludedDirectory && (relativePath === excludedDirectory || relativePath.startsWith(`${excludedDirectory}/`))) continue
      files.push(...await walk(absolutePath, rootDirectory, excludedDirectory))
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(relativePath)
    }
  }
  return files
}

export async function discoverDefaultTestFiles({ rootDirectory = 'test', excludedDirectory = 'de405-artifacts' } = {}) {
  return discoverTestProfileFiles('default', { rootDirectory, artifactDirectory: excludedDirectory })
}

export async function discoverArtifactTestFiles({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  return discoverTestProfileFiles('artifact', { rootDirectory, artifactDirectory })
}

export async function discoverSourceTestFiles({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  return discoverTestProfileFiles('source', { rootDirectory, artifactDirectory })
}

export async function discoverHistoricalTestFiles({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  return discoverTestProfileFiles('historical', { rootDirectory, artifactDirectory })
}

export async function discoverAllTestFiles({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  return discoverTestProfileFiles('all', { rootDirectory, artifactDirectory })
}

export async function discoverTestSuites({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  const files = (await walk(rootDirectory, rootDirectory)).sort((a, b) => a.localeCompare(b))
  const source = new Set(SOURCE_TEST_FILES)
  const historical = new Set(HISTORICAL_TEST_FILES)
  const artifactPrefix = `${artifactDirectory}/`
  const profiles = {
    default: files.filter(file => !source.has(file) && !historical.has(file) && !file.startsWith(artifactPrefix)),
    source: files.filter(file => source.has(file)),
    historical: files.filter(file => historical.has(file)),
    artifact: files.filter(file => file.startsWith(artifactPrefix)),
  }
  const assigned = [...profiles.default, ...profiles.source, ...profiles.historical, ...profiles.artifact]
  if (new Set(assigned).size !== assigned.length || assigned.length !== files.length) {
    throw new Error('test profile partition is not disjoint and complete')
  }
  const entries = Object.entries(profiles)
    .flatMap(([profile, profileFiles]) => profileFiles.map(file => ({ file, profile })))
    .sort((a, b) => a.file.localeCompare(b.file))
  return {
    ...profiles,
    all: files,
    entries,
  }
}

export async function discoverTestProfileFiles(profile, options = {}) {
  if (!TEST_PROFILES.includes(profile)) throw new Error(`unknown test profile: ${profile}`)
  const suites = await discoverTestSuites(options)
  const files = profile === 'all'
    ? suites.all
    : suites[profile]
  if (files.length === 0) throw new Error(`no ${profile} test files found under ${options.rootDirectory || 'test'}`)
  return files
}
