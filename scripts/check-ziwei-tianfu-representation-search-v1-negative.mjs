import { buildArtifact } from './materialize-ziwei-tianfu-representation-search-v1.mjs'
import { checkRepresentationSearchArtifact } from './check-ziwei-tianfu-representation-search-v1.mjs'

const { artifact } = await buildArtifact()
const mutation = structuredClone(artifact)
mutation.search.exactFitIds = mutation.search.exactFitIds.filter(id => id !== 'affine-same-rotation-06')
const failures = await checkRepresentationSearchArtifact(mutation)
console.log(JSON.stringify({ detected: failures.includes('search_coverage_or_exact_fit') || failures.includes('materialized_content'), failures }, null, 2))
if (!failures.includes('search_coverage_or_exact_fit') && !failures.includes('materialized_content')) process.exitCode = 1
