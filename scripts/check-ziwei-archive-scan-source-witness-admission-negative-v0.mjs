import { materializeArchiveScanSourceWitness } from './materialize-ziwei-archive-scan-source-witness-admission-v0.mjs'
import { checkArchiveScanSourceWitness } from './check-ziwei-archive-scan-source-witness-admission-v0.mjs'
const cases=[
 ['derived_pdf_selected',x=>{x.digitalWitness.source='derivative';x.digitalWitness.original=false}],
 ['hash_removed',x=>{x.digitalWitness.sha256=null}],
 ['page_count_removed',x=>{x.digitalWitness.pdfPageCount=218}],
 ['archive_access_as_license',x=>{x.identityLayers.rightsAccessStatus.freeRedistribution=true}],
 ['edition_inferred',x=>{x.identityLayers.bibliographicEditionIdentity.status='verified';x.identityLayers.bibliographicEditionIdentity.year=2021}],
 ['ocr_truth',x=>{x.digitalWitness.ocrUsedAsTruth=true}],
 ['range_gap',x=>{x.structuralRangeMap[1].pageStart=4}],
 ['range_overlap',x=>{x.structuralRangeMap[1].pageStart=1}],
 ['classical_commentary_mixed_admitted',x=>{x.contentClassAdmission.find(c=>c.contentClass==='classical_source_text').status='admitted'}],
 ['interpretive_verified_fact',x=>{x.contentClassAdmission.find(c=>c.contentClass==='interpretive_prose').verifiedFactAllowed=true}],
 ['pdf_in_git',x=>{x.digitalWitness.gitInclusion='allowed'}],
 ['nondeterministic_id',x=>{x.seedCandidates[0].seedId='random-'+Math.random()}],
 ['stable_claim_promotion',x=>{x.downstreamBoundaries.stableClaimCount=1}],
 ['grounding_promotion',x=>{x.downstreamBoundaries.grounding='ready'}],
 ['readiness_promotion',x=>{x.downstreamBoundaries.readiness='ready'}],
 ['activation_promotion',x=>{x.downstreamBoundaries.activation='active'}],
 ['seed_extraction',x=>{x.seedCandidates[0].extracted=true}]
]
const base=await materializeArchiveScanSourceWitness(); const findings=[]
for(const [name,mutate] of cases){const c=structuredClone(base);mutate(c);if(checkArchiveScanSourceWitness(c).length) findings.push(name)}
const result={pass:findings.length===cases.length,caseCount:cases.length,findings,expectedCases:cases.map(([n])=>n)};console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1
