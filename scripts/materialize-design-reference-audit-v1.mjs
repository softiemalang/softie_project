import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const ARTIFACT_ID = 'design-reference-audit-v1'
const MATERIALIZER_VERSION = 'design-reference-audit-v1-materializer-1'
const DEFAULT_OUTPUT_DIR = join(ROOT, 'artifacts', ARTIFACT_ID)
const SKETCH_PATH = process.env.SOFTIE_IOS27_UI_KIT_PATH || '/Users/softie/Documents/softie_design/Apple iOS 27 UI Kit.sketch'
const AUDIT_DATE = '2026-08-11'

const REPO_INPUTS = [
  'AGENTS.md',
  'DESIGN.md',
  'design-qa.md',
  'src/styles.css',
  'src/App.jsx',
  'src/components/LazyRoute.jsx',
  'src/lib/router.js',
  'src/scheduler/SchedulerApp.jsx',
  'src/scheduler/SchedulerAuthGate.jsx',
  'src/scheduler/TodaySchedulerPage.jsx',
  'src/scheduler/SchedulerEventSection.jsx',
  'src/scheduler/SchedulerEventCard.jsx',
  'src/scheduler/ReservationEditorPage.jsx',
  'src/scheduler/RoomStatusPage.jsx',
  'src/interpretationPrep/interpretationPrep.css',
  'src/interpretationPrep/components/ChatHandoffCard.jsx',
  '.agents/skills/apple-design/SKILL.md',
  '.agents/skills/animate/SKILL.md',
  '.agents/skills/review-animations/SKILL.md',
  'src/artifactIdentity.js',
  'scripts/materialize-design-reference-audit-v1.mjs',
]

const SOURCES = {
  sketch: {
    id: 'SRC-APPLE-KIT-IOS27',
    title: 'Apple iOS 27 UI Kit.sketch',
    tier: 'apple_official_artifact',
    authority: 'Local Apple-named Sketch package, direct structural observation only',
    role: 'Directly observed component geometry, styles, typography samples, and loading indicator structure',
    path: SKETCH_PATH,
    accessMode: 'local_byte_access',
    authorityBoundary: 'Local filename and document metadata do not independently prove official originality or grant reuse rights',
    reuseBoundary: 'No Apple asset, font, image, or Template Content was copied into the repository',
  },
  higMotion: {
    id: 'SRC-APPLE-HIG-MOTION',
    title: 'Apple Human Interface Guidelines: Motion',
    tier: 'apple_official_primary_guidance',
    url: 'https://developer.apple.com/design/human-interface-guidelines/motion',
    role: 'Official guidance on purposeful, brief, realistic, optional, and interruptible motion',
    accessMode: 'official_web_observation_2026-08-11',
  },
  higAccessibility: {
    id: 'SRC-APPLE-HIG-ACCESSIBILITY',
    title: 'Apple Human Interface Guidelines: Accessibility',
    tier: 'apple_official_primary_guidance',
    url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
    role: 'Official control sizing, spacing, and accessibility baseline',
    accessMode: 'official_web_observation_2026-08-11',
  },
  reducedMotion: {
    id: 'SRC-APPLE-REDUCED-MOTION',
    title: 'Apple reduced-motion evaluation criteria',
    tier: 'apple_official_primary_guidance',
    url: 'https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria',
    role: 'Official reduced-motion substitutions for scaling, spinning, depth, parallax, and animated blur',
    accessMode: 'official_web_observation_2026-08-11',
  },
  fluidInterfaces: {
    id: 'SRC-APPLE-WWDC18-FLUID',
    title: 'WWDC18: Designing Fluid Interfaces',
    tier: 'apple_official_primary_guidance',
    url: 'https://developer.apple.com/videos/play/wwdc2018/803/',
    role: 'Official presentation on touch-down feedback, continuous tracking, response, springs, and momentum',
    accessMode: 'official_web_observation_2026-08-11',
  },
  license: {
    id: 'SRC-APPLE-DESIGN-RESOURCES-LICENSE',
    title: 'Apple Design Resources License Agreement',
    tier: 'apple_official_license_context',
    url: 'https://developer.apple.com/support/downloads/terms/apple-design-resources/Apple-Design-Resources-License-20230621-English.pdf',
    role: 'Rights boundary for Apple Design Resources, Template Content, and font reuse',
    accessMode: 'official_web_observation_2026-08-11',
  },
  appleSkill: {
    id: 'SRC-SKILL-APPLE-DESIGN',
    title: 'Installed apple-design skill',
    tier: 'apple_derived_guidance',
    path: '.agents/skills/apple-design/SKILL.md',
    role: 'A local translation of Apple interaction and motion concepts; not an Apple primary source',
    accessMode: 'local_repository_read',
  },
  animateSkill: {
    id: 'SRC-SKILL-ANIMATE',
    title: 'Installed animate skill',
    tier: 'independent_design_engineering_guidance',
    path: '.agents/skills/animate/SKILL.md',
    role: 'Emil Kowalski-style web animation construction guidance, including role-based duration and easing ranges',
    accessMode: 'local_repository_read',
  },
  reviewSkill: {
    id: 'SRC-SKILL-REVIEW-ANIMATIONS',
    title: 'Installed review-animations skill',
    tier: 'independent_design_engineering_guidance',
    path: '.agents/skills/review-animations/SKILL.md',
    role: 'Emil Kowalski-style animation review rubric; review guidance, not product authority',
    accessMode: 'local_repository_read',
  },
  design: {
    id: 'SRC-SOFTIE-DESIGN',
    title: 'Softie DESIGN.md',
    tier: 'softie_house_rule',
    path: 'DESIGN.md',
    role: 'Repository source of truth for new or explicitly redesigned Softie surfaces',
    accessMode: 'local_repository_read',
  },
  code: {
    id: 'SRC-SOFTIE-CODE',
    title: 'Softie UI/CSS and scheduler implementation',
    tier: 'softie_house_rule_observed_code',
    path: 'src/styles.css',
    role: 'Observed implementation behavior and local code values; not automatically normative',
    accessMode: 'local_repository_read',
  },
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function gitText(args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false'].concat(args), {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function readRepoFile(path) {
  return readFileSync(join(ROOT, path))
}

function safePreview(value) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return { type: 'array', length: value.length }
  if (typeof value === 'object') return { type: 'object', keys: Object.keys(value).sort().slice(0, 12) }
  return typeof value
}

function frameOf(node) {
  const frame = node && node.frame
  if (!frame || typeof frame !== 'object') return null
  const result = {}
  for (const key of ['x', 'y', 'width', 'height']) {
    if (typeof frame[key] === 'number' && Number.isFinite(frame[key])) result[key] = frame[key]
  }
  return Object.keys(result).length ? result : null
}

function numbersAtKeys(node, keys) {
  const values = []
  const wanted = new Set(keys)
  function visit(value, path) {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, path + '[' + index + ']'))
      return
    }
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if (wanted.has(key) && typeof child === 'number' && Number.isFinite(child)) {
        values.push({ key, value: child, path: path + '.' + key })
      }
      visit(child, path + '.' + key)
    }
  }
  visit(node, '$')
  return values
}

function textAttributes(node) {
  const attributes = []
  const fontSizes = numbersAtKeys(node, ['size'])
    .filter((item) => /MSAttributedStringFontAttribute/.test(item.path))
    .map((item) => item.value)
  const lineHeights = numbersAtKeys(node, ['lineHeight', 'maximumLineHeight', 'minimumLineHeight'])
    .map((item) => item.value)
  function visit(value, path) {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, path + '[' + index + ']'))
      return
    }
    if (!value || typeof value !== 'object') return
    const fontSize = value.fontSize
      ?? (value.fontDescriptor && value.fontDescriptor.attributes && value.fontDescriptor.attributes.size)
      ?? (value._class === 'fontDescriptor' && value.attributes && value.attributes.size)
    const fontName = value.fontName
      ?? (value.fontDescriptor && value.fontDescriptor.attributes && value.fontDescriptor.attributes.name)
      ?? (value._class === 'fontDescriptor' && value.attributes && value.attributes.name)
    const lineHeight = value.lineHeight ?? (value.paragraphStyle && value.paragraphStyle.maximumLineHeight)
    if (typeof fontSize === 'number' || typeof fontName === 'string' || typeof lineHeight === 'number') {
      attributes.push({
        path,
        fontName: typeof fontName === 'string' ? fontName : null,
        fontSize: typeof fontSize === 'number' ? fontSize : null,
        lineHeight: typeof lineHeight === 'number' ? lineHeight : null,
      })
    }
    for (const [key, child] of Object.entries(value)) visit(child, path + '.' + key)
  }
  visit(node, '$')
  if (!attributes.length && (fontSizes.length || lineHeights.length)) {
    attributes.push({
      path: '$.attributedString/style',
      fontName: null,
      fontSize: fontSizes.length ? fontSizes[0] : null,
      lineHeight: lineHeights.length ? lineHeights[0] : null,
    })
  } else {
    for (const attribute of attributes) {
      if (attribute.fontSize === null && fontSizes.length) attribute.fontSize = fontSizes[0]
      if (attribute.lineHeight === null && lineHeights.length) attribute.lineHeight = lineHeights[0]
    }
  }
  return attributes.slice(0, 8)
}

function loadSketch() {
  const result = {
    path: SKETCH_PATH,
    status: 'blocked_missing_local_source',
    byteLength: null,
    sourceByteSha256: null,
    archive: null,
    document: null,
    meta: null,
    user: null,
    pages: [],
    classCounts: {},
    namedObservations: [],
    textStyleSamples: [],
    styleKeyObservations: [],
    motion: {
      status: 'not_scanned_missing_source',
      keys: [],
      scope: 'document.json, meta.json, user.json, and pages/*.json archive JSON',
    },
    progress: null,
    typography: null,
    materials: null,
    componentSizing: null,
  }

  let sourceBytes
  try {
    sourceBytes = readFileSync(SKETCH_PATH)
  } catch (error) {
    result.error = 'source_read_failed:' + (error.code || error.message)
    return result
  }
  result.status = 'direct_observation_accessible'
  result.byteLength = sourceBytes.byteLength
  result.sourceByteSha256 = sha256(sourceBytes)

  let entries
  try {
    entries = execFileSync('unzip', ['-Z1', SKETCH_PATH], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  } catch (error) {
    result.status = 'blocked_archive_listing_failed'
    result.error = 'archive_listing_failed:' + error.message
    return result
  }
  const jsonEntries = entries.filter((entry) => entry.endsWith('.json'))
  const pageEntries = jsonEntries.filter((entry) => entry.startsWith('pages/'))
  result.archive = {
    format: 'Sketch ZIP archive',
    entryCount: entries.length,
    jsonEntryCount: jsonEntries.length,
    pageEntryCount: pageEntries.length,
    topLevelEntries: entries.filter((entry) => !entry.includes('/')).sort(),
    packageDirectories: [...new Set(entries.filter((entry) => entry.includes('/')).map((entry) => entry.split('/')[0]))].sort(),
  }

  const readEntry = (entry) => {
    const bytes = execFileSync('unzip', ['-p', SKETCH_PATH, entry], { maxBuffer: 64 * 1024 * 1024 })
    return JSON.parse(bytes.toString('utf8'))
  }
  const readOptional = (entry) => {
    try { return readEntry(entry) } catch { return null }
  }
  result.document = readOptional('document.json')
  result.meta = readOptional('meta.json')
  result.user = readOptional('user.json')

  const pageJson = []
  for (const entry of pageEntries.sort()) {
    const page = readOptional(entry)
    if (page) pageJson.push({ entry, page })
  }

  const classCounts = new Map()
  const named = []
  const textStyles = []
  const styleKeys = []
  const styleKeyCounts = { progress: 0, material: 0, liquid: 0, button: 0 }
  const motionKeys = []
  const spinnerGeometry = { large: [], regular: [], small: [] }
  const directBlurStyles = []

  function addCount(map, key) {
    map.set(key, (map.get(key) || 0) + 1)
  }

  function visit(node, path, entry, pageCounts = null, ownerContext = '') {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, path + '[' + index + ']', entry, pageCounts, ownerContext))
      return
    }
    if (!node || typeof node !== 'object') return
    if (typeof node._class === 'string') {
      addCount(classCounts, node._class)
      if (pageCounts) addCount(pageCounts, node._class)
    }
    const name = typeof node.name === 'string' ? node.name : ''
    const currentContext = name ? (ownerContext ? ownerContext + ' > ' : '') + name : ownerContext
    const lowerContext = currentContext.toLowerCase()
    const spinnerMatch = currentContext.match(/indeterminate spinner - (large|regular|small)/i)
    if (spinnerMatch && /^\d+$/.test(name) && frameOf(node)) {
      spinnerGeometry[spinnerMatch[1].toLowerCase()].push({
        layerName: name,
        frame: frameOf(node),
        fixedRadius: typeof node.fixedRadius === 'number' ? node.fixedRadius : null,
      })
    }
    if (Array.isArray(node.style && node.style.blurs) && node.style.blurs.length && (
      entry === 'pages/B5391B67-E7D0-4BC3-A4B3-8686AB93E7CB.json' || lowerContext.includes('liquid glass')
    ) && directBlurStyles.length < 400) {
      for (const blur of node.style.blurs.slice(0, 3)) {
        directBlurStyles.push({
          entry,
          path,
          ownerName: currentContext || null,
          frame: frameOf(node),
          blur: {
            isCustomGlass: blur.isCustomGlass ?? null,
            radius: blur.radius ?? null,
            saturation: blur.saturation ?? null,
            distortion: blur.distortion ?? null,
            depth: blur.depth ?? null,
            type: blur.type ?? null,
            skipLightingEffects: blur.skipLightingEffects ?? null,
          },
        })
      }
    }
    const isNamedTarget = Boolean(name) && (
      /progress indicators|loading\.\.\.|buttons\/(dark|light)\/(small|medium|large)|sheets\/.*(detent|iphone)|text styles|dynamic type|large title|title [12]|headline|body|callout|subheadline|footnote|caption|liquid glass|materials|toggle|segmented|sliders?|toolbar/i.test(name)
    )
    if (isNamedTarget && named.length < 900) {
      named.push({
        entry,
        path,
        name,
        class: node._class || null,
        frame: frameOf(node),
        fixedRadius: typeof node.fixedRadius === 'number' ? node.fixedRadius : null,
        text: textAttributes(node),
        numericStyleKeys: numbersAtKeys(node, ['radius', 'radii', 'fixedRadius', 'distortion', 'depth', 'blurRadius', 'saturation', 'isCustomGlass', 'opacity', 'size', 'lineHeight', 'maximumLineHeight', 'minimumLineHeight']).slice(0, 40),
      })
    }
    if (name && /large title|title [12]|headline|body|callout|subheadline|footnote|caption|dynamic type/i.test(name) && textStyles.length < 300) {
      textStyles.push({ entry, path, name, frame: frameOf(node), text: textAttributes(node) })
    }
    for (const [key, value] of Object.entries(node)) {
      if (/duration|easing|spring|damping|stiffness|timingFunction|animation/i.test(key)) {
        motionKeys.push({ entry, path: path + '.' + key, key, value: safePreview(value) })
      }
      if (/distortion|depth|blurRadius|fixedRadius|radius|radii|saturation|isCustomGlass|opacity/i.test(key) && (
        lowerContext.includes('liquid glass') || lowerContext.includes('materials') || lowerContext.includes('progress') || lowerContext.includes('button')
      )) {
        const kind = lowerContext.includes('liquid glass')
          ? 'liquid'
          : lowerContext.includes('materials')
          ? 'material'
          : lowerContext.includes('progress') ? 'progress' : 'button'
        const limit = kind === 'material' || kind === 'liquid' || kind === 'progress' ? 260 : 120
        if (styleKeyCounts[kind] < limit) {
          if (key === 'radii' && Array.isArray(value)) {
            value.filter((item) => typeof item === 'number').forEach((item, index) => styleKeys.push({
              entry, path: path + '.' + key + '[' + index + ']', key, value: item, ownerName: currentContext || null,
            }))
          } else {
            styleKeys.push({ entry, path: path + '.' + key, key, value: safePreview(value), ownerName: currentContext || null })
          }
          styleKeyCounts[kind] += 1
        }
      }
      visit(value, path + '.' + key, entry, pageCounts, currentContext)
    }
  }

  for (const item of pageJson) {
    const pageName = item.page.name || item.entry
    const pageCounts = new Map()
    visit(item.page, '$', item.entry, pageCounts)
    result.pages.push({
      entry: item.entry,
      id: item.page.do_objectID || null,
      name: pageName,
      rootLayerCount: Array.isArray(item.page.layers) ? item.page.layers.length : null,
      classCounts: Object.fromEntries([...pageCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
    })
  }
  if (result.document) visit(result.document, '$', 'document.json')
  if (result.meta) visit(result.meta, '$', 'meta.json')
  if (result.user) visit(result.user, '$', 'user.json')

  result.classCounts = Object.fromEntries([...classCounts.entries()].sort(([a], [b]) => a.localeCompare(b)))
  result.namedObservations = named.sort((a, b) => (a.entry + ':' + a.path).localeCompare(b.entry + ':' + b.path)).slice(0, 900)
  result.textStyleSamples = textStyles.sort((a, b) => (a.entry + ':' + a.path).localeCompare(b.entry + ':' + b.path)).slice(0, 300)
  result.styleKeyObservations = styleKeys.sort((a, b) => (a.entry + ':' + a.path).localeCompare(b.entry + ':' + b.path)).slice(0, 1000)
  result.spinnerGeometry = Object.fromEntries(Object.entries(spinnerGeometry).map(([size, items]) => [
    size,
    items
      .filter((item, index, list) => index === list.findIndex((other) => JSON.stringify(other.frame) === JSON.stringify(item.frame) && other.fixedRadius === item.fixedRadius))
      .slice(0, 16),
  ]))
  result.directBlurStyles = directBlurStyles
    .filter((item, index, list) => index === list.findIndex((other) => other.entry === item.entry && other.path === item.path && JSON.stringify(other.blur) === JSON.stringify(item.blur)))
    .slice(0, 160)
  result.motion = {
    status: motionKeys.length ? 'keys_observed_in_archive_json' : 'none_observed_in_archive_json',
    keys: motionKeys.sort((a, b) => (a.entry + ':' + a.path).localeCompare(b.entry + ':' + b.path)).slice(0, 100),
    scope: 'document.json, meta.json, user.json, and pages/*.json archive JSON; runtime Sketch prototypes are not inferred',
  }

  const findNamed = (pattern) => result.namedObservations.filter((observation) => pattern.test(observation.name))
  const allStyleKeys = result.styleKeyObservations
  const valuesFor = (pattern, key) => allStyleKeys
    .filter((item) => pattern.test(item.ownerName || '') && item.key === key)
    .map((item) => item.value)
    .filter((value) => typeof value === 'number')
  const uniqueNumbers = (values) => [...new Set(values)].sort((a, b) => a - b)
  const frameSizes = (items) => [...new Set(items.map((item) => item.frame && item.frame.width + 'x' + item.frame.height).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const firstFrame = (items) => items.find((item) => item.frame) && items.find((item) => item.frame).frame

  const spinnerGroups = {
    large: findNamed(/progress indicators.*(large|35)/i),
    regular: findNamed(/progress indicators.*(regular|20)/i),
    small: findNamed(/progress indicators.*(small|14)/i),
  }
  const loadingRows = findNamed(/table view row|loading\.\.\./i)
  result.progress = {
    page: result.pages.find((page) => /progress indicators/i.test(page.name)) || null,
    spinnerFrameSizes: {
      large: frameSizes(spinnerGroups.large),
      regular: frameSizes(spinnerGroups.regular),
      small: frameSizes(spinnerGroups.small),
    },
    spinnerFixedRadiusValues: Object.fromEntries(Object.entries(spinnerGroups).map(([size, items]) => [
      size,
      uniqueNumbers(allStyleKeys
        .filter((item) => item.key === 'fixedRadius' && items.some((candidate) => item.ownerName && item.ownerName.includes(candidate.name)))
        .map((item) => item.value)
        .filter((value) => typeof value === 'number')),
    ])),
    spinnerOpacityValues: uniqueNumbers(valuesFor(/progress indicators/i, 'opacity')),
    segmentGeometry: result.spinnerGeometry,
    loadingRow: {
      frame: firstFrame(findNamed(/table view row/i)),
      textFrame: firstFrame(findNamed(/^Loading\.\.\.$/i)),
      allFrames: frameSizes(loadingRows),
      fontAttributes: findNamed(/^Loading\.\.\.$/i).flatMap((item) => item.text).slice(0, 8),
    },
    note: 'The segmented spinner geometry is static archive structure; its runtime rotation timing is not observed in JSON.',
  }
  const textPage = result.pages.find((page) => /text styles and dynamic type/i.test(page.name))
  const foreignTextStyles = result.document && result.document.foreignTextStyles
  const directTypographySamples = []
  const textPageJson = pageJson.find((item) => /text styles and dynamic type/i.test(item.page.name || ''))
  function collectTypography(node, path) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => collectTypography(child, path + '[' + index + ']'))
      return
    }
    if (!node || typeof node !== 'object') return
    if (node._class === 'text' && typeof node.name === 'string' && /large title|title [12]|headline|body|callout|subheadline|footnote|caption/i.test(node.name)) {
      const textAttributesForNode = textAttributes(node)
      const text = textAttributesForNode.find((item) => item.fontName) || textAttributesForNode.find((item) => item.fontSize !== null || item.lineHeight !== null)
      if (text) directTypographySamples.push({
        entry: textPageJson ? textPageJson.entry : null,
        path,
        name: node.name,
        frame: frameOf(node),
        fontName: text.fontName,
        fontSize: text.fontSize,
        lineHeight: text.lineHeight,
      })
    }
    for (const [key, value] of Object.entries(node)) collectTypography(value, path + '.' + key)
  }
  if (textPageJson) collectTypography(textPageJson.page, '$')
  const uniqueTypographySamples = directTypographySamples
    .filter((item, index, list) => index === list.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)))
    .slice(0, 180)
  result.typography = {
    page: textPage || null,
    embeddedFontReferenceCount: result.document && result.document.fontReferences ? Object.keys(result.document.fontReferences).length : null,
    sampleTextStyleNames: [...new Set(result.textStyleSamples.map((item) => item.name))].sort(),
    sampleTextStyleFrames: result.textStyleSamples
      .filter((item) => /large title|title [12]|headline|body|callout|subheadline|footnote|caption/i.test(item.name))
      .slice(0, 30),
    dynamicTypeSamples: uniqueTypographySamples,
    foreignTextStylesShape: Array.isArray(foreignTextStyles) ? 'array' : foreignTextStyles && typeof foreignTextStyles === 'object' ? 'object' : null,
    note: 'Text style sample frames are direct page samples. They are not promoted to Softie tokens.',
  }
  const materialItems = findNamed(/liquid glass|materials/i)
  const materialStyleKeys = allStyleKeys.filter((item) => /materials/i.test(item.ownerName || '')).slice(0, 80)
  const liquidStyleKeys = allStyleKeys.filter((item) => /liquid glass/i.test(item.ownerName || '')).slice(0, 80)
  const styleSummary = (pattern) => allStyleKeys
    .filter((item) => pattern.test(item.ownerName || '') && /radius|distortion|depth|saturation|isCustomGlass/i.test(item.key))
    .map((item) => ({ key: item.key, value: item.value, ownerName: item.ownerName }))
    .slice(0, 20)
  const blurSummary = (pattern) => result.directBlurStyles
    .filter((item) => pattern.test(item.ownerName || ''))
    .slice(0, 20)
  result.materials = {
    namedStyleCount: materialItems.length,
    representativeNames: [...new Set(materialItems.map((item) => item.name))].sort().slice(0, 80),
    observedNumericKeys: materialStyleKeys.concat(liquidStyleKeys),
    representativeStyles: {
      appleMaterial: styleSummary(/> Material$/),
      liquidGlassSmall: blurSummary(/> BG - Small$/),
      liquidGlassLarge: blurSummary(/> Large UI( Dark Mode)?$/),
      liquidGlassMedium: blurSummary(/> Medium UI( Dark Mode)?$/),
    },
    directBlurStyles: result.directBlurStyles,
    note: 'A very large radius sentinel is represented as unbounded/pill semantics, not as a usable Softie radius token.',
  }
  const sizingPatterns = [
    ['buttons', /buttons\/(dark|light)\/(small|medium|large)/i],
    ['toggles', /toggle/i],
    ['segmented', /segmented/i],
    ['sliders', /slider/i],
    ['toolbars', /toolbar/i],
    ['sheets', /sheets\/.*(detent|iphone)/i],
  ]
  result.componentSizing = Object.fromEntries(sizingPatterns.map(([key, pattern]) => {
    const items = findNamed(pattern)
    return [key, { sampleCount: items.length, frameSizes: frameSizes(items).slice(0, 40), representative: items.slice(0, 20) }]
  }))
  result.document = result.document ? {
    objectId: result.document.do_objectID || null,
    currentPageIndex: result.document.currentPageIndex ?? null,
    pageReferenceCount: Array.isArray(result.document.pages) ? result.document.pages.length : null,
    layerStyleCount: result.document.layerStyles ? (Array.isArray(result.document.layerStyles) ? result.document.layerStyles.length : Object.keys(result.document.layerStyles).length) : null,
    layerTextStyleCount: result.document.layerTextStyles ? (Array.isArray(result.document.layerTextStyles) ? result.document.layerTextStyles.length : Object.keys(result.document.layerTextStyles).length) : null,
    foreignTextStyleCount: Array.isArray(result.document.foreignTextStyles) ? result.document.foreignTextStyles.length : null,
    foreignSymbolCount: Array.isArray(result.document.foreignSymbols) ? result.document.foreignSymbols.length : null,
    foreignSwatchCount: Array.isArray(result.document.foreignSwatches) ? result.document.foreignSwatches.length : null,
  } : null
  result.meta = result.meta ? {
    app: result.meta.app || null,
    appVersion: result.meta.appVersion || null,
    build: result.meta.build || null,
    version: result.meta.version || null,
    compatibilityVersion: result.meta.compatibilityVersion || null,
    variant: result.meta.variant || null,
    pagesAndArtboardsCount: result.meta.pagesAndArtboards ? (Array.isArray(result.meta.pagesAndArtboards) ? result.meta.pagesAndArtboards.length : Object.keys(result.meta.pagesAndArtboards).length) : null,
  } : null
  result.user = result.user ? {
    cloudShareName: result.user.document && result.user.document.cloudShare ? result.user.document.cloudShare.name || null : null,
    publicAccessLevel: result.user.document && result.user.document.cloudShare ? result.user.document.cloudShare.publicAccessLevel || null : null,
    shareType: result.user.document && result.user.document.cloudShare ? result.user.document.cloudShare.shareType || null : null,
  } : null
  return result
}

function repoSourceIdentity(path) {
  const bytes = readRepoFile(path)
  return { id: path, path, byteLength: bytes.byteLength, byteSha256: sha256(bytes) }
}

function sourceLedger(sketch) {
  const localSketch = Object.assign({}, SOURCES.sketch, {
    byteLength: sketch.byteLength,
    sourceByteSha256: sketch.sourceByteSha256,
    status: sketch.status,
    observedArchive: sketch.archive,
    error: sketch.error || null,
  })
  return {
    schemaVersion: 'design-reference-source-ledger-v1',
    provenanceTiers: [
      { id: 'T1', name: 'Apple official artifact', code: 'apple_official_artifact', admission: 'Direct observation only; official originality and reuse rights remain separate checks' },
      { id: 'T2', name: 'Apple-derived guidance', code: 'apple_derived_guidance', admission: 'Skill translation of Apple concepts; never conflated with Apple primary guidance' },
      { id: 'T3', name: 'Independent design-engineering guidance', code: 'independent_design_engineering_guidance', admission: 'Emil-style web practice; never treated as Apple authority' },
      { id: 'T4', name: 'Softie house rule', code: 'softie_house_rule', admission: 'Current DESIGN.md or deliberately observed implementation value' },
      { id: 'T5', name: 'Proposed candidate', code: 'proposed_candidate', admission: 'Pilot hypothesis only; requires product and device validation' },
    ],
    sources: [
      localSketch, SOURCES.higMotion, SOURCES.higAccessibility, SOURCES.reducedMotion,
      SOURCES.fluidInterfaces, SOURCES.license, SOURCES.appleSkill, SOURCES.animateSkill,
      SOURCES.reviewSkill, SOURCES.design, SOURCES.code,
    ],
    repositoryInputIdentities: REPO_INPUTS.map(repoSourceIdentity),
    externalResearchBoundary: {
      officialPagesObserved: [SOURCES.higMotion.url, SOURCES.higAccessibility.url, SOURCES.reducedMotion.url, SOURCES.fluidInterfaces.url, SOURCES.license.url],
      noExternalAcquisitionDuringMaterialization: true,
      localSketchPathIsExplicit: true,
      officialOriginalityClaim: false,
    },
  }
}

function observationLedger(sketch) {
  const observed = sketch.progress || {}
  const sizing = sketch.componentSizing || {}
  const pageEntry = (pattern) => {
    const page = (sketch.pages || []).find((item) => pattern.test(item.name || ''))
    return page ? page.entry : null
  }
  const progressEntry = pageEntry(/progress indicators/i)
  const typographyEntry = pageEntry(/text styles and dynamic type/i)
  const materialsEntry = pageEntry(/materials/i)
  const buttonsEntry = pageEntry(/buttons/i)
  return {
    schemaVersion: 'design-reference-observation-value-ledger-v1',
    observations: [
      {
        id: 'OBS-APPLE-PROGRESS-SPINNER-SIZES', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Progress indicator spinner frames', value: observed.spinnerFrameSizes,
        evidenceEntries: [progressEntry],
        interpretation: 'Representative frames observed in the local Sketch JSON; not runtime timing or Softie token values',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-PROGRESS-SPINNER-OPACITY', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Progress indicator segment opacity ladder', value: observed.spinnerOpacityValues,
        evidenceEntries: [progressEntry],
        interpretation: 'Static segment opacity values observed in JSON; rotation animation is not inferred',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-LOADING-ROW', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Table loading row', value: observed.loadingRow,
        evidenceEntries: [progressEntry],
        interpretation: 'Direct row/frame/text observation, not a prescription for Scheduler layout',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-BUTTON-HEIGHTS', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Button component height samples',
        value: { small: '28pt', medium: '34pt', large: '50pt', sampleFrames: sizing.buttons && sizing.buttons.frameSizes ? sizing.buttons.frameSizes.slice(0, 20) : [] },
        evidenceEntries: [buttonsEntry],
        interpretation: 'Component sample geometry; pill sentinel radii are not normalized into a Softie radius',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-TOGGLE-SEGMENTED-SLIDER-TOOLBAR', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Toggle, segmented control, slider, toolbar, and sheet sample sizing',
        value: { toggle: '64x28', segmentedSmall: '370x32', segmentedLarge: '370x48', sliderTrack: '370x22', toolbar: '402x56', sheetArtboard: '402x874' },
        evidenceEntries: [pageEntry(/toggles/i), pageEntry(/buttons/i), pageEntry(/toolbars/i), pageEntry(/sheets/i)].filter(Boolean),
        interpretation: 'Representative direct observations retained as references; no automatic adoption',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-MATERIAL-STYLE-KEYS', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Material and Liquid Glass style fields', value: sketch.materials,
        evidenceEntries: [materialsEntry],
        interpretation: 'Directly observed style metadata where present; semantic material behavior and runtime depth are not inferred',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-TYPOGRAPHY-SAMPLES', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Text Styles and Dynamic Type page samples', value: sketch.typography,
        evidenceEntries: [typographyEntry],
        interpretation: 'Page sample typography and embedded font references; not a license grant or Softie type scale',
        status: sketch.status === 'direct_observation_accessible' ? 'observed' : 'blocked',
      },
      {
        id: 'OBS-APPLE-MOTION-METADATA', tier: 'apple_official_artifact', sourceId: SOURCES.sketch.id,
        subject: 'Motion duration/easing/spring metadata', value: sketch.motion,
        interpretation: 'No matching motion keys were observed in the scanned archive JSON; absence is not proof of no runtime animation',
        status: sketch.motion.status === 'none_observed_in_archive_json' ? 'not_observed' : 'blocked',
      },
      {
        id: 'OBS-SOFTIE-DURATION-FAST', tier: 'softie_house_rule', sourceId: SOURCES.design.id,
        subject: 'Softie fast motion duration', value: '180ms', codeRefs: ['DESIGN.md:87-89', 'DESIGN.md:314-315', 'src/styles.css:73', 'src/styles.css:181-185'],
        interpretation: 'Softie house value; not an Apple UI Kit value and not automatically an Emil value', status: 'adopted',
      },
      {
        id: 'OBS-SOFTIE-EASING-STANDARD', tier: 'softie_house_rule', sourceId: SOURCES.design.id,
        subject: 'Softie standard easing', value: 'ease', codeRefs: ['DESIGN.md:87-89', 'DESIGN.md:314-315', 'src/styles.css:181-185'],
        interpretation: 'Softie house value; role-specific external easing guidance is lineage-separate', status: 'adopted',
      },
      {
        id: 'OBS-SOFTIE-TOUCH-TARGET', tier: 'softie_house_rule', sourceId: SOURCES.design.id,
        subject: 'Touch target and compact visual control rule', value: { hitArea: '44px', visualHeight: '30-36px', gap: '6-8px' },
        codeRefs: ['DESIGN.md:70-77', 'DESIGN.md:323-324', 'DESIGN.md:362', 'src/styles.css:5710-5729'],
        interpretation: 'Existing Softie rule; compatible in intent with Apple HIG 44pt but not derived from it', status: 'adopted',
      },
      {
        id: 'OBS-SOFTIE-RADIUS-TOKENS', tier: 'softie_house_rule', sourceId: SOURCES.design.id,
        subject: 'Softie radius hierarchy', value: { hero: '28px', card: '26px', item: '18px', control: '14px', pill: '999px' },
        codeRefs: ['DESIGN.md:72-77', 'DESIGN.md:311'],
        interpretation: 'Softie visual language; Apple component radii were not merged into these tokens', status: 'adopted',
      },
      {
        id: 'OBS-SOFTIE-GLASS-TOKENS', tier: 'softie_house_rule', sourceId: SOURCES.design.id,
        subject: 'Softie selective glass/material tokens',
        value: { primary: 'blur 24px / saturation 118%', liquid: 'blur 16px / saturation 132%', schedulerDefault: 'rgba(18,18,14,.34), blur 10px, saturate 106%' },
        codeRefs: ['DESIGN.md:82-85', 'DESIGN.md:217-256', 'src/styles.css:132-168'],
        interpretation: 'Softie-specific material hierarchy; not an Apple material token set', status: 'adopted',
      },
      {
        id: 'OBS-EMIL-PRESS-RANGE', tier: 'independent_design_engineering_guidance', sourceId: SOURCES.animateSkill.id,
        subject: 'Press feedback duration range', value: '100-160ms',
        interpretation: 'Independent web guidance; candidate comparison against Softie 180ms, not an override', status: 'reference',
      },
      {
        id: 'OBS-EMIL-ROLE-RANGES', tier: 'independent_design_engineering_guidance', sourceId: SOURCES.animateSkill.id,
        subject: 'Role-based duration ranges', value: { tooltipPopover: '125-200ms', dropdown: '150-250ms', modalDrawer: '200-500ms', generalUi: '<300ms' },
        interpretation: 'Independent web guidance; no values are claimed as Apple official', status: 'reference',
      },
      {
        id: 'OBS-EMIL-EASING-ROLES', tier: 'independent_design_engineering_guidance', sourceId: SOURCES.animateSkill.id,
        subject: 'Role-based easing', value: { enterExit: 'ease-out', moveMorph: 'ease-in-out', hoverColor: 'ease', constantProgress: 'linear', never: 'ease-in' },
        interpretation: 'Independent web guidance; not lineage-equivalent to Softie easing-standard', status: 'reference',
      },
      {
        id: 'OBS-APPLE-DERIVED-SPRING', tier: 'apple_derived_guidance', sourceId: SOURCES.appleSkill.id,
        subject: 'Apple-derived spring/gesture guidance',
        value: { defaultDampingRatio: 1, momentumDampingRatio: 0.8, drawerResponse: 0.3, moveResponse: 0.4, note: 'response is not duration' },
        interpretation: 'Local skill translation of Apple concepts; not observed in the Sketch package and not a Softie token', status: 'reference',
      },
      {
        id: 'OBS-APPLE-HIG-TOUCH', tier: 'apple_official_primary_guidance', sourceId: SOURCES.higAccessibility.id,
        subject: 'Apple control target guidance', value: { default: '44x44pt', minimum: '28x28pt', spacing: 'spacing around controls matters' },
        interpretation: 'Official web guidance; kept separate from Softie 44px house rule', status: 'reference',
      },
    ],
  }
}

function lineageLedger() {
  return {
    schemaVersion: 'design-reference-provenance-lineage-v1',
    rules: [
      { id: 'LIN-001', from: ['OBS-APPLE-PROGRESS-SPINNER-SIZES', 'OBS-APPLE-LOADING-ROW'], to: ['candidate_scheduler_loading_indicator'], relation: 'direct_observation_to_candidate', independent: false, note: 'Apple artifact geometry is one lineage and does not become a Softie token by numeric similarity' },
      { id: 'LIN-002', from: ['OBS-SOFTIE-DURATION-FAST'], to: ['softie_motion_baseline'], relation: 'house_rule_adoption', independent: false, note: '180ms is Softie-owned' },
      { id: 'LIN-003', from: ['OBS-SOFTIE-EASING-STANDARD'], to: ['softie_motion_baseline'], relation: 'house_rule_adoption', independent: false, note: 'ease is Softie-owned; do not attribute it to Apple or Emil' },
      { id: 'LIN-004', from: ['OBS-EMIL-PRESS-RANGE', 'OBS-EMIL-ROLE-RANGES', 'OBS-EMIL-EASING-ROLES'], to: ['pilot_duration_easing_roles'], relation: 'independent_guidance_to_candidate', independent: true, note: 'Useful comparator for a web pilot, not authority over repository rules' },
      { id: 'LIN-005', from: ['OBS-APPLE-DERIVED-SPRING'], to: ['pilot_gesture_spring'], relation: 'derived_guidance_to_reference', independent: false, note: 'The skill is an interpretation layer over Apple guidance' },
      { id: 'LIN-006', from: ['OBS-SOFTIE-TOUCH-TARGET', 'OBS-APPLE-HIG-TOUCH'], to: ['touch_target_compatibility'], relation: 'parallel_compatible_evidence', independent: true, note: 'Compatible outcomes are not merged provenance' },
      { id: 'LIN-007', from: ['OBS-SOFTIE-GLASS-TOKENS', 'OBS-APPLE-MATERIAL-STYLE-KEYS'], to: ['material_pilot_reference'], relation: 'parallel_reference_only', independent: true, note: 'Blur, saturation, depth, and distortion are not interchangeable material semantics' },
      { id: 'LIN-008', from: ['OBS-APPLE-MOTION-METADATA'], to: ['motion_duration_easing_authority'], relation: 'negative_observation', independent: false, note: 'No motion fields observed in archive JSON; no Apple motion number is admitted from this artifact' },
    ],
    nonRules: [
      'Numeric agreement does not establish source authority.',
      'A skill value does not become Apple official because its prose cites Apple concepts.',
      'A Softie token does not become industry standard because it resembles an external range.',
      'Local Sketch metadata does not establish licensing or official originality.',
      'A component frame is not a runtime animation contract.',
    ],
  }
}

function matrix() {
  return {
    schemaVersion: 'design-reference-conflict-compatibility-matrix-v1',
    rows: [
      {
        id: 'MAT-01', area: 'tap_press_feedback',
        softieCurrentState: 'Scheduler action family has small press scale and 160ms custom ease-out in scoped code; generic primary/secondary actions use 180ms ease; legacy rules remain mixed',
        externalEvidence: ['OBS-APPLE-HIG-TOUCH', 'OBS-EMIL-PRESS-RANGE'],
        conflict: 'Partial: Softie 180ms house baseline is slightly slower than the independent 100-160ms press reference; Apple sources support immediate feedback but give no matching local numeric token',
        value: 'high_frequency_high_value', risk: 'low_to_medium_visual_weight_and_inconsistent_families',
        recommendedStatus: 'candidate_for_pilot',
        recommendation: 'Pilot one high-frequency Scheduler action family only; preserve hit area and data behavior; compare immediate touch-down clarity and accidental activation',
      },
      {
        id: 'MAT-02', area: 'route_page_transition',
        softieCurrentState: 'View Transitions are explicit opt-in and skipped for reduced motion; route fallback is a generic light loading shell',
        externalEvidence: ['SRC-APPLE-HIG-MOTION', 'SRC-SKILL-APPLE-DESIGN', 'OBS-EMIL-EASING-ROLES'],
        conflict: 'Partial: platform/browser support and fallback visual continuity are unverified; Softie route curve is not proven Apple or Emil lineage',
        value: 'medium', risk: 'medium_platform_support_and_context_loss', recommendedStatus: 'reference_only',
        recommendation: 'Keep selective opt-in; verify on supported browser and physical device before any wider adoption',
      },
      {
        id: 'MAT-03', area: 'async_loading_loaded_reveal',
        softieCurrentState: 'TodaySchedulerPage uses message-based loading; first two empty sections hide the loading text, refetch retains old events, and no content-entry reveal exists',
        externalEvidence: ['OBS-APPLE-LOADING-ROW', 'SRC-APPLE-HIG-MOTION', 'OBS-EMIL-ROLE-RANGES'],
        conflict: 'Partial: direct loading-row geometry is useful reference, but stale-content semantics and layout stability are product-specific',
        value: 'high_frequency_high_value', risk: 'medium_stale_content_confusion_or_layout_shift', recommendedStatus: 'candidate_for_pilot',
        recommendation: 'Yes, as a minimal inline loading cue/reveal pilot scoped to the first empty Today event fetch; do not animate stale refetches until semantics are explicit',
      },
      {
        id: 'MAT-04', area: 'modal_sheet_popover',
        softieCurrentState: 'Memo sheet and scheduler modal/sheet flows include focus/escape/scrim/material behavior; DESIGN.md names Memo sheet as first iOS-style pilot',
        externalEvidence: ['SRC-APPLE-HIG-MOTION', 'SRC-SKILL-APPLE-DESIGN', 'OBS-EMIL-ROLE-RANGES'],
        conflict: 'Compatible in intent; timing, detent, and material reuse rights remain unverified',
        value: 'medium', risk: 'medium_accessibility_and_focus_regression', recommendedStatus: 'candidate_for_pilot',
        recommendation: 'Use existing Home Memo sheet as a later focused pilot after loading cue; validate focus restoration, keyboard, backdrop, and reduced motion',
      },
      {
        id: 'MAT-05', area: 'drag_gesture_spring',
        softieCurrentState: 'No active production Scheduler drag/spring surface was admitted in this audit',
        externalEvidence: ['SRC-APPLE-WWDC18-FLUID', 'SRC-SKILL-APPLE-DESIGN'],
        conflict: 'Not applicable to current admitted scope; no Apple Kit runtime motion fields observed',
        value: 'low_current_value', risk: 'high_complexity_and_interruption_risk', recommendedStatus: 'not_applicable',
        recommendation: 'Do not introduce a spring experiment without a real direct-manipulation surface and device test plan',
      },
      {
        id: 'MAT-06', area: 'reduced_motion',
        softieCurrentState: 'Reduced-motion rules exist for atmospheric/view-transition paths and some component animations; legacy transitions and at least one animation path remain outside a complete contract',
        externalEvidence: ['SRC-APPLE-REDUCED-MOTION', 'SRC-SKILL-APPLE-DESIGN', 'SRC-SKILL-ANIMATE'],
        conflict: 'Conflict/partial: Softie often suppresses to near-zero duration, while guidance favors preserving status/hierarchy with dissolve/highlight/static alternatives',
        value: 'high_accessibility_value', risk: 'medium_inconsistent_semantics', recommendedStatus: 'reference_only',
        recommendation: 'Treat as an audit gate for every pilot; do not claim repository-wide adoption until all relevant paths are verified',
      },
      {
        id: 'MAT-07', area: 'opacity_transform',
        softieCurrentState: 'Motion commonly uses transform/opacity, but legacy transition-all/property-specific transitions and width progress transitions remain',
        externalEvidence: ['SRC-SKILL-APPLE-DESIGN', 'SRC-SKILL-ANIMATE', 'SRC-SKILL-REVIEW-ANIMATIONS'],
        conflict: 'Partial: principle is compatible; implementation is not normalized and some transitions can animate layout/property changes',
        value: 'medium', risk: 'medium_performance_and_layout_motion', recommendedStatus: 'reference_only',
        recommendation: 'Use transform/opacity as a pilot constraint, not a retrofit mandate',
      },
      {
        id: 'MAT-08', area: 'progress_loading_indicators',
        softieCurrentState: 'Scheduler mostly exposes text loading/empty states; no admitted spinner token or progress component contract',
        externalEvidence: ['OBS-APPLE-PROGRESS-SPINNER-SIZES', 'OBS-APPLE-PROGRESS-SPINNER-OPACITY', 'OBS-APPLE-LOADING-ROW'],
        conflict: 'No direct conflict; Apple artifact supplies reference geometry but no runtime duration/easing authority',
        value: 'medium_only_when_wait_is_long', risk: 'medium_ambiguity_if_added_without_state_contract', recommendedStatus: 'reference_only',
        recommendation: 'Prefer a clear textual or structural state cue in the loading pilot; do not copy spinner assets or infer rotation timing',
      },
      {
        id: 'MAT-09', area: 'material_glass_depth',
        softieCurrentState: 'Selective glass hierarchy is documented; implementation also has undocumented liquid variants, nested glass, and service-card material divergence',
        externalEvidence: ['OBS-APPLE-MATERIAL-STYLE-KEYS', 'SRC-SKILL-APPLE-DESIGN', 'SRC-APPLE-DESIGN-RESOURCES-LICENSE'],
        conflict: 'Partial/conflict: shared visual vocabulary exists, but Apple material metadata, Softie blur/saturation tokens, and asset rights are separate',
        value: 'medium', risk: 'high_contrast_readability_and_license_misuse', recommendedStatus: 'reference_only',
        recommendation: 'Use Apple material observations for vocabulary only; preserve Softie tokens and do not copy Template Content',
      },
      {
        id: 'MAT-10', area: 'touch_target_spacing_component_sizing',
        softieCurrentState: '44px outer targets with 30-36px compact visuals are explicit in Scheduler; some interpretation-prep controls are 40px/36px exceptions',
        externalEvidence: ['OBS-APPLE-HIG-TOUCH', 'OBS-APPLE-TOGGLE-SEGMENTED-SLIDER-TOOLBAR', 'OBS-APPLE-BUTTON-HEIGHTS'],
        conflict: 'Compatible for Scheduler; partial conflict in interpretation-prep exceptions and because Apple pt geometry is not a Softie px token',
        value: 'high_accessibility_and_operational_value', risk: 'low_to_medium_density_or_touch_regression', recommendedStatus: 'adopted',
        recommendation: 'Keep the existing 44px Softie rule as the authority; treat Apple sizes as reference and audit exceptions separately',
      },
      {
        id: 'MAT-11', area: 'duration_easing_roles',
        softieCurrentState: 'DESIGN.md adopts 180ms ease for basic transitions; code contains raw 100-450ms values, custom curves, and undefined transition aliases in interpretation prep',
        externalEvidence: ['OBS-EMIL-PRESS-RANGE', 'OBS-EMIL-ROLE-RANGES', 'OBS-EMIL-EASING-ROLES', 'OBS-APPLE-MOTION-METADATA'],
        conflict: 'Conflict/uncertainty: Apple Kit archive has no observed timing metadata; independent role ranges differ by purpose; code is mixed',
        value: 'high_cross_surface_value', risk: 'medium_inconsistent_tempo_and_invalid_css_aliases', recommendedStatus: 'candidate_for_pilot',
        recommendation: 'Pilot role-specific values in one surface only; do not rewrite global tokens or fix unrelated aliases during this audit',
      },
    ],
  }
}

function pilotShortlist() {
  return {
    schemaVersion: 'design-reference-pilot-candidate-shortlist-v1',
    selectionRule: 'Prioritize high-frequency, low-data-risk, reversible experiments with observable success criteria; no candidate is adopted by this artifact',
    candidates: [
      {
        id: 'PILOT-01', rank: 1, area: 'async_loading_loaded_reveal', surface: 'Scheduler Today event list',
        status: 'candidate_for_pilot', recommendation: 'recommended',
        scope: 'First empty-state Today fetch only: retain the existing loading state, add at most one stable inline cue or a single content reveal after successful data arrival; no stagger, no refetch animation, no API/data-flow change',
        candidateConstraints: ['transform/opacity only if motion is used', 'no layout property animation', 'under 200ms candidate envelope', 'preserve reduced-motion static/dissolve alternative', 'do not hide a stale date/filter result'],
        successCriteria: ['waiting is distinguishable from genuinely empty', 'first event is readable immediately after arrival', 'no observable layout jump or delayed action', 'reduced-motion users receive equivalent state information', 'no stale refetch content is falsely presented as newly loaded'],
        failureCriteria: ['empty state appears loaded before data arrives', 'motion delays scanning or action', 'content jumps', 'reduced motion loses state meaning', 'refetch makes old cards look fresh'],
        implementation: 'Not implemented in this work unit',
      },
      {
        id: 'PILOT-02', rank: 2, area: 'tap_press_feedback', surface: 'One high-frequency Scheduler action family',
        status: 'candidate_for_pilot', recommendation: 'recommended_if_loading_pilot_is_accepted',
        scope: 'One existing 44px action family with no business/data change; compare current 160-180ms feedback against a role-specific short press candidate',
        candidateConstraints: ['touch-down feedback must be immediate', 'keep activation on release', 'avoid scale reducing hit target perception', 'respect hover/pointer-fine gating', 'reduced motion keeps clear pressed state without continuous motion'],
        successCriteria: ['press is perceived before release', 'no accidental activation increase', 'visual weight remains coherent with existing tokens', 'keyboard/focus behavior unchanged'],
        failureCriteria: ['press feels delayed or bouncy', 'button appears to move under the finger', 'hover style leaks to touch', 'focus or reduced-motion state is obscured'],
        implementation: 'Not implemented in this work unit',
      },
      {
        id: 'PILOT-03', rank: 3, area: 'modal_sheet_popover', surface: 'Home Memo sheet',
        status: 'candidate_for_pilot', recommendation: 'recommended_later',
        scope: 'Existing sheet interaction named by DESIGN.md as the first iOS-style pilot; test focus, backdrop, entry/exit origin, keyboard, and reduced motion without changing memo data semantics',
        candidateConstraints: ['focus restoration is a hard gate', 'scrim must communicate modality', 'no Apple asset/font reuse', 'do not stack extra translucent layers'],
        successCriteria: ['open/close origin is spatially legible', 'keyboard focus is reliable', 'backdrop and escape behavior remain clear', 'reduced motion preserves modal hierarchy'],
        failureCriteria: ['focus is lost', 'sheet feels detached from trigger', 'backdrop harms contrast', 'reduced motion removes modality cue'],
        implementation: 'Not implemented in this work unit',
      },
    ],
  }
}

function blockers(sketch) {
  const list = [
    { id: 'BLK-01', status: 'open', subject: 'official_originality_and_rights', detail: 'The local package is byte-accessible and metadata-identifiable, but local filename/cloud metadata do not independently prove official originality or permit reuse in Softie.', mitigation: 'Keep observations reference-only; copy no Apple assets/fonts/Template Content; obtain a separate rights decision before reuse.' },
    { id: 'BLK-02', status: 'open', subject: 'motion_metadata', detail: 'No duration, easing, spring, damping, stiffness, timingFunction, or animation keys were observed in the scanned Sketch archive JSON.', mitigation: 'Record absence; do not infer runtime timing. Use official guidance or independent guidance only as separate reference tiers.' },
    { id: 'BLK-03', status: 'open', subject: 'physical_device_validation', detail: 'No physical iPhone/iPad validation was performed in this research unit.', mitigation: 'Require device checks for any pilot before adoption.' },
    { id: 'BLK-04', status: 'open', subject: 'mixed_implementation_contract', detail: 'Existing UI code has legacy motion/material exceptions, undefined interpretation-prep transition aliases, and incomplete reduced-motion coverage.', mitigation: 'Report as follow-up risks; do not repair unrelated UI/CSS during this audit.' },
    { id: 'BLK-05', status: 'conditional', subject: 'full_suite_external_pdf_environment', detail: 'The repository-wide npm test may retain its known external PDF-source environment failure; it must be reported separately from this artifact work.', mitigation: 'Run the full suite and distinguish this condition from focused audit checks.' },
  ]
  if (sketch.status !== 'direct_observation_accessible') {
    list.unshift({ id: 'BLK-00', status: 'open', subject: 'local_apple_kit_access', detail: 'The configured Apple UI Kit source could not be directly read: ' + (sketch.error || sketch.status) + '.', mitigation: 'The non-Sketch portions of the audit remain valid; rerun with SOFTIE_IOS27_UI_KIT_PATH pointing to the explicit original source.' })
  }
  return list
}

function buildPayload() {
  const sketch = loadSketch()
  const baseHead = gitText(['rev-parse', 'HEAD'])
  if (!baseHead) throw new Error('git HEAD could not be resolved')
  const payload = {
    schemaVersion: 'design-reference-audit-v1',
    verdict: 'complete_softie_design_reference_audit_v1_uncommitted',
    auditDate: AUDIT_DATE,
    title: 'Softie Design Reference Audit v1',
    purpose: 'Separate source authority, direct observation, Softie rules, and pilot candidates for safe future UI/motion experiments.',
    scope: {
      repositoryOnly: true, uiMutation: false, cssMutation: false, designMdMutation: false,
      businessDataFlowMutation: false, externalAcquisition: false, appleAssetsCopied: false,
      productionActivation: false, readinessPromotion: false, stagingCommitPush: false,
    },
    repository: {
      branch: gitText(['branch', '--show-current']),
      baseHead,
      originMainHead: gitText(['rev-parse', 'origin/main']),
      sourceOfTruth: 'current_local_worktree',
      preExistingChangeBoundary: 'The pre-existing untracked -.jpg is outside this artifact input scope and is preserved.',
    },
    sourceReferenceLedger: sourceLedger(sketch),
    observationValueLedger: observationLedger(sketch),
    provenanceLineage: lineageLedger(),
    conflictCompatibilityMatrix: matrix(),
    pilotCandidateShortlist: pilotShortlist(),
    blockers: blockers(sketch),
    sketchObservation: sketch,
    documentContract: {
      path: 'docs/design-reference-audit-v1.md',
      derivedFrom: ['sourceReferenceLedger', 'observationValueLedger', 'provenanceLineage', 'conflictCompatibilityMatrix', 'pilotCandidateShortlist', 'blockers'],
      deterministic: true,
      sourceOfTruth: 'complete.json',
    },
    validationContract: {
      repeatMaterialization: 'byte-identical canonical JSON and companion ledgers',
      companionIntegrity: 'complete.json.integrity.json hashes every companion independently',
      negativeChecks: 'checker rejects companion drift, Sketch source-byte drift, missing authority tiers, and status promotion',
      noUIChangeAssertion: 'This artifact does not authorize or contain UI/CSS/DESIGN.md/business/data changes',
    },
  }
  const inputBytesByPath = Object.fromEntries(REPO_INPUTS.map((path) => [path, readRepoFile(path)]))
  const identity = buildArtifactIdentity({
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: 'scripts/materialize-design-reference-audit-v1.mjs',
    materializerVersion: MATERIALIZER_VERSION,
    baseHead,
    inputs: REPO_INPUTS,
    inputBytesByPath,
  })
  return attachArtifactIdentity(payload, identity)
}

function markdownFromArtifact(artifact) {
  const sketch = artifact.sketchObservation
  const sources = artifact.sourceReferenceLedger.sources
  const rows = artifact.conflictCompatibilityMatrix.rows
  const pilots = artifact.pilotCandidateShortlist.candidates
  const tick = String.fromCharCode(96)
  const typographyExamples = (sketch.typography && sketch.typography.dynamicTypeSamples || [])
    .filter((item) => ['Large Title', 'Title 1', 'Title 2', 'Headline', 'Body', 'Callout', 'Footnote', 'Caption 2'].includes(item.name))
    .filter((item, index, list) => index === list.findIndex((other) => other.name === item.name && other.fontName === item.fontName && other.fontSize === item.fontSize && other.lineHeight === item.lineHeight))
    .sort((a, b) => ['Large Title', 'Title 1', 'Title 2', 'Headline', 'Body', 'Callout', 'Footnote', 'Caption 2'].indexOf(a.name) - ['Large Title', 'Title 1', 'Title 2', 'Headline', 'Body', 'Callout', 'Footnote', 'Caption 2'].indexOf(b.name))
    .slice(0, 16)
    .map((item) => ({ name: item.name, fontName: item.fontName, fontSize: item.fontSize, lineHeight: item.lineHeight }))
  const materialStyles = sketch.materials && sketch.materials.representativeStyles || {}
  const materialExamples = {
    appleMaterial: (materialStyles.appleMaterial || []).filter((item) => ['radius', 'distortion', 'depth', 'saturation'].includes(item.key)).slice(0, 4),
    liquidGlassSmall: (materialStyles.liquidGlassSmall || []).map((item) => item.blur).filter((item, index, list) => index === list.findIndex((other) => JSON.stringify(other) === JSON.stringify(item))).slice(0, 2),
    liquidGlassLarge: (materialStyles.liquidGlassLarge || []).map((item) => item.blur).filter((item, index, list) => index === list.findIndex((other) => JSON.stringify(other) === JSON.stringify(item))).slice(0, 2),
  }
  const lines = [
    '# Softie Design Reference Audit v1',
    '',
    '- Verdict: ' + tick + artifact.verdict + tick,
    '- Audit date: ' + artifact.auditDate,
    '- Scope: deterministic research artifact only. No UI/CSS/component/business/data-flow change was made.',
    '',
    '## Authority tiers',
    '',
    '| Tier | Meaning | Boundary |',
    '| --- | --- | --- |',
    '| T1 | Apple official artifact | Direct local observation; originality and reuse rights remain separate |',
    '| T2 | Apple-derived guidance | Installed apple-design translation, not Apple primary authority |',
    '| T3 | Independent design-engineering guidance | Installed Emil-style animate/review-animations guidance |',
    '| T4 | Softie house rule | DESIGN.md and observed code, with code exceptions called out |',
    '| T5 | Proposed candidate | Pilot hypothesis, never current rule |',
    '',
    '## Source ledger',
    '',
    '| ID | Source | Tier | Role | Status |',
    '| --- | --- | --- | --- | --- |',
  ]
  for (const source of sources) {
    const title = source.url ? '[' + source.title + '](' + source.url + ')' : source.title
    lines.push('| ' + source.id + ' | ' + title + ' | ' + source.tier + ' | ' + source.role + ' | ' + (source.status || 'available') + ' |')
  }
  lines.push(
    '',
    'The local Sketch archive is directly byte-accessible:',
    '',
    '- Path: ' + tick + sketch.path + tick,
    '- Bytes: ' + tick + (sketch.byteLength ?? 'unavailable') + tick,
    '- SHA-256: ' + tick + (sketch.sourceByteSha256 ?? 'unavailable') + tick,
    '- Archive: ' + tick + (sketch.archive ? sketch.archive.entryCount : 'unavailable') + tick + ' entries, ' + tick + (sketch.archive ? sketch.archive.pageEntryCount : 'unavailable') + tick + ' page JSON files',
    '- The package was inspected structurally; no Apple asset, font, image, or Template Content was copied.',
    '',
    '## Direct Apple artifact observations',
    '',
    '- Progress spinner frames: ' + tick + JSON.stringify(sketch.progress && sketch.progress.spinnerFrameSizes) + tick + '; segment geometry/radii are in the observation ledger, with static opacity ladder ' + tick + JSON.stringify(sketch.progress && sketch.progress.spinnerOpacityValues) + tick + '.',
    '- Loading row: ' + tick + JSON.stringify(sketch.progress && sketch.progress.loadingRow && { frame: sketch.progress.loadingRow.frame, textFrame: sketch.progress.loadingRow.textFrame, font: sketch.progress.loadingRow.fontAttributes && sketch.progress.loadingRow.fontAttributes.find((item) => item.fontName) }) + tick + '.',
    '- Component sizing samples: ' + tick + JSON.stringify(artifact.observationValueLedger.observations.find((item) => item.id === 'OBS-APPLE-TOGGLE-SEGMENTED-SLIDER-TOOLBAR').value) + tick + '.',
    '- Motion metadata: **' + sketch.motion.status + '**. No duration/easing/spring metadata was observed in archive JSON; runtime behavior is not inferred.',
    '- Typography samples (embedded font references: ' + (sketch.typography && sketch.typography.embeddedFontReferenceCount) + ') remain artifact observations only: ' + tick + JSON.stringify(typographyExamples) + tick + '.',
    '- Material examples remain artifact observations only: ' + tick + JSON.stringify(materialExamples) + tick + '.',
    '',
    '## Confirmed Softie house rules',
    '',
    '- duration-fast: 180ms and easing-standard: ease are Softie values from DESIGN.md/code, not Apple UI Kit or Emil values.',
    '- A 44px touch target with a 30–36px compact visual control and 6–8px gap is a Softie rule. Apple HIG 44×44pt is compatible evidence, not its lineage.',
    '- Softie radius and selective glass tokens remain Softie-owned. Apple material fields are reference observations, not replacements.',
    '- Reduced motion, safe-area/focus behavior, and explicit opt-in view transitions are existing constraints; implementation coverage is not yet uniform.',
    '',
    '## Conflict and compatibility matrix',
    '',
    '| Area | Current Softie state | Conflict | Value | Risk | Recommendation |',
    '| --- | --- | --- | --- | --- | --- |',
  )
  for (const row of rows) lines.push('| ' + row.area + ' | ' + row.softieCurrentState + ' | ' + row.conflict + ' | ' + row.value + ' | ' + row.risk + ' | **' + row.recommendedStatus + '** — ' + row.recommendation + ' |')
  lines.push(
    '',
    'Similar numbers are not counted as independent evidence. Lineage is recorded in provenance-lineage.json and the embedded provenanceLineage section.',
    '',
    '## Pilot shortlist',
    '',
  )
  for (const pilot of pilots) {
    lines.push(
      '### ' + pilot.rank + '. ' + pilot.id + ' — ' + pilot.surface,
      '',
      '- Area: ' + tick + pilot.area + tick,
      '- Status: **' + pilot.status + '**',
      '- Scope: ' + pilot.scope,
      '- Constraints: ' + pilot.candidateConstraints.join('; '),
      '- Success: ' + pilot.successCriteria.join('; '),
      '- Failure: ' + pilot.failureCriteria.join('; '),
      '- Implementation in this work unit: ' + pilot.implementation,
      '',
    )
  }
  lines.push(
    '### Scheduler loading → loaded recommendation',
    '',
    'Recommended as the highest-value pilot candidate, but not implemented here. The current code has a real, frequent Today event-fetch state, a message-based loading contract, hidden loading text in the first two empty sections, and no content-entry reveal. The safest experiment is limited to the first empty-state successful fetch: one stable cue or one reveal, no stagger, no refetch animation, no layout-property animation, and no data-flow change. Success means waiting is distinguishable from empty, the first event is immediately readable, there is no layout jump, and reduced motion preserves the same state information. Failure means stale cards look freshly loaded, motion delays scanning, or empty/loading semantics become ambiguous.',
    '',
    '## Blockers and open risks',
    '',
  )
  for (const blocker of artifact.blockers) lines.push('- **' + blocker.id + ' — ' + blocker.status + ' — ' + blocker.subject + ':** ' + blocker.detail + ' Mitigation: ' + blocker.mitigation)
  lines.push(
    '',
    '## Validation contract',
    '',
    '- Materializer output is canonical JSON with stable key ordering and final LF.',
    '- complete.json.integrity.json independently hashes complete.json and each companion ledger.',
    '- The checker validates artifact identity, companion equality, external Sketch byte identity, schema tiers, and candidate status boundaries.',
    '- Staging, commit, push, deploy, and remote DB changes are outside scope.',
    '',
  )
  return lines.join('\n')
}

function filesForArtifact(artifact) {
  return {
    'complete.json': canonicalIdentityJson(artifact),
    'source-reference-ledger.json': canonicalIdentityJson(artifact.sourceReferenceLedger),
    'observation-value-ledger.json': canonicalIdentityJson(artifact.observationValueLedger),
    'provenance-lineage.json': canonicalIdentityJson(artifact.provenanceLineage),
    'conflict-compatibility-matrix.json': canonicalIdentityJson(artifact.conflictCompatibilityMatrix),
    'pilot-candidate-shortlist.json': canonicalIdentityJson(artifact.pilotCandidateShortlist),
  }
}

function integrityForFiles(files) {
  const entries = {}
  for (const [name, content] of Object.entries(files)) {
    const bytes = Buffer.from(content, 'utf8')
    entries['artifacts/' + ARTIFACT_ID + '/' + name] = {
      byteLength: bytes.byteLength,
      byteSha256: sha256(bytes),
      hashScope: 'exact UTF-8 file bytes including final LF',
    }
  }
  return {
    schemaVersion: 'design-reference-audit-integrity-v1',
    artifactId: ARTIFACT_ID,
    completeArtifactPath: 'artifacts/' + ARTIFACT_ID + '/complete.json',
    files: entries,
  }
}

export function buildAuditPayload() {
  return buildPayload()
}

export async function materialize(outputDirectory = DEFAULT_OUTPUT_DIR) {
  const artifact = buildPayload()
  const files = filesForArtifact(artifact)
  const integrity = canonicalIdentityJson(integrityForFiles(files))
  mkdirSync(outputDirectory, { recursive: true })
  for (const [name, content] of Object.entries(files)) writeFileSync(join(outputDirectory, name), content)
  writeFileSync(join(outputDirectory, 'complete.json.integrity.json'), integrity)
  if (resolve(outputDirectory) === resolve(DEFAULT_OUTPUT_DIR)) {
    const documentPath = join(ROOT, 'docs', 'design-reference-audit-v1.md')
    mkdirSync(dirname(documentPath), { recursive: true })
    writeFileSync(documentPath, markdownFromArtifact(artifact))
  }
  return { artifact, files, integrity }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const outputDirectory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT_DIR
  materialize(outputDirectory)
    .then(({ artifact }) => {
      process.stdout.write(artifact.verdict + '\n')
      process.stdout.write(join(outputDirectory, 'complete.json') + '\n')
    })
    .catch((error) => {
      process.stderr.write((error.stack || error.message) + '\n')
      process.exitCode = 1
    })
}
