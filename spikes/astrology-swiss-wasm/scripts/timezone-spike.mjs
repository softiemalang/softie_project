import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const moduleSpecifier = process.env.TEMPORAL_POLYFILL_MODULE
if (!moduleSpecifier) {
  throw new Error('Set TEMPORAL_POLYFILL_MODULE to the pinned polyfill module URL')
}

const imported = await import(moduleSpecifier)
const Temporal = imported.Temporal || imported.default?.Temporal
if (!Temporal?.PlainDateTime) {
  throw new Error(`Temporal implementation unavailable from ${moduleSpecifier}`)
}

function samePlainDateTime(left, right) {
  return Temporal.PlainDateTime.compare(left, right) === 0
}

function resolveLocal(localDateTime, timeZone) {
  const plain = Temporal.PlainDateTime.from(localDateTime)
  const earlier = plain.toZonedDateTime(timeZone, { disambiguation: 'earlier' })
  const later = plain.toZonedDateTime(timeZone, { disambiguation: 'later' })
  const earlierRoundTrip = earlier.toPlainDateTime()
  const laterRoundTrip = later.toPlainDateTime()
  const sameInstant = earlier.epochNanoseconds === later.epochNanoseconds
  const earlierMatches = samePlainDateTime(plain, earlierRoundTrip)
  const laterMatches = samePlainDateTime(plain, laterRoundTrip)

  if (sameInstant && earlierMatches) {
    return {
      status: 'exact',
      candidates: [earlier.toInstant().toString()],
    }
  }
  if (earlierMatches && laterMatches) {
    return {
      status: 'overlap',
      candidates: [
        earlier.toInstant().toString(),
        later.toInstant().toString(),
      ],
    }
  }
  return {
    status: 'gap',
    candidates: [],
    rejectedEarlierMapping: earlier.toString(),
    rejectedLaterMapping: later.toString(),
  }
}

const cases = {
  exact: resolveLocal('2024-02-01T12:00:00', 'America/New_York'),
  springGap: resolveLocal('2024-03-10T02:30:00', 'America/New_York'),
  fallOverlap: resolveLocal('2024-11-03T01:30:00', 'America/New_York'),
  koreaDst1988: resolveLocal('1988-05-08T02:30:00', 'Asia/Seoul'),
}
const report = {
  implementation: moduleSpecifier,
  runtime: {
    node: process.version,
    icu: process.versions.icu,
    tz: process.versions.tz || null,
    nativeTemporal: typeof globalThis.Temporal !== 'undefined',
  },
  cases,
}
const reportPath = path.resolve(
  import.meta.dirname,
  '..',
  'reports',
  'timezone-spike.json',
)
fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))

if (cases.exact.status !== 'exact') process.exitCode = 1
if (cases.springGap.status !== 'gap') process.exitCode = 1
if (cases.fallOverlap.status !== 'overlap') process.exitCode = 1
if (cases.fallOverlap.candidates.length !== 2) process.exitCode = 1
