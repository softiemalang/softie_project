import { resolvePdfSourcePath, resolvePdfSourcePathSync } from '../../scripts/lib/pdf-source-resolver.mjs'

export const getTestPdfSourcePath = sourceId => resolvePdfSourcePathSync(sourceId, { argv: [] })
export const resolveTestPdfSourcePath = (sourceId, options = {}) => resolvePdfSourcePath(sourceId, { argv: [], ...options })
