#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const namespace = 'ziwei-system-evidence-readiness-coverage-map-v0'
const outDir = resolve(root, 'artifacts', namespace)
const completePath = resolve(outDir, 'complete.json')
const integrityPath = resolve(outDir, 'complete.json.integrity.json')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const jsonHash = value => sha256(Buffer.from(JSON.stringify(value)))
const fileHash = relative => sha256(readFileSync(resolve(root, relative)))
const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

const ref = (path, role) => ({ path, role, sha256: fileHash(path) })
const existingArtifact = path => ref(path, 'existing_artifact_authoritative_reference')
const production = path => ref(path, 'production_code_actual_bytes')
const testRef = path => ref(path, 'deterministic_test_or_fixture_actual_bytes')

const domains = [
  { id:'input-calendar-time', label:'음력·시각 입력과 경계', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/ziweiResolver.js','src/ziwei/ziweiContract.js'], tests:['test/ziweiResolver.test.js','test/ziweiCoreContract.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:[], blocker:'blocker-calendar-time-source-identity', impact:'음력 변환·윤달·자시 경계가 이후 모든 계산 입력을 막는다.' },
  { id:'ming-shen', label:'명궁·신궁', implementation:'verified_within_scope', source:'direct_within_scope', claimProvenance:'complete_within_scope', readiness:'blocked', code:['src/ziwei/ziweiResolver.js','src/ziwei/mingShenCleanRuleSeedPilot.js'], tests:['test/ziweiMingShenCleanRuleSeedPilot.test.js','test/ziweiMingShenSeedAcceptance.test.js','test/ziweiResolver.test.js'], artifacts:['artifacts/ziwei-ming-shen-seed-acceptance-v0/complete.json','artifacts/ziwei-ming-shen-clean-rule-seed-pilot-v0/complete.json'], dependsOn:['input-calendar-time'], blocker:'blocker-calendar-time-source-identity', impact:'명반 좌표의 출발점이며 오행국·궁 포국에 fan-out된다.' },
  { id:'five-element-bureau', label:'오행국', implementation:'verified_within_scope', source:'direct_within_scope', claimProvenance:'complete_within_scope', readiness:'blocked', code:['src/ziwei/fiveElementResolver.js','src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'], tests:['test/ziweiFiveElementBureauCleanRuleSeedPilot.test.js','test/ziweiFiveElementBureauSeedAcceptance.test.js','test/ziweiResolver.test.js'], artifacts:['artifacts/ziwei-five-element-bureau-clean-rule-seed-acceptance-v0/complete.json','artifacts/ziwei-five-element-bureau-clean-rule-seed-pilot-v0/complete.json'], dependsOn:['ming-shen'], blocker:'blocker-calendar-time-source-identity', impact:'자미 배치의 bureau/day 입력을 제공한다.' },
  { id:'palace-layout', label:'12궁·궁간·궁 포국', implementation:'present_unverified', source:'unresolved', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/ziweiContract.js','src/ziwei/ziweiPalaceContext.js','src/ziwei/palaceRelationRules.js'], tests:['test/ziweiContract.test.js','test/ziweiCoreContract.test.js','test/ziweiPipeline.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['ming-shen'], blocker:'blocker-palace-semantic-identity', impact:'좌표 토큰을 궁 의미로 읽는 downstream 경계가 막힌다.' },
  { id:'ziwei-tianfu-placement', label:'자미·천부 placement chain', implementation:'verified_within_scope', source:'direct_within_scope', claimProvenance:'complete_within_scope', readiness:'blocked', code:['src/ziwei/starPlacementRules.js','src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js','src/ziwei/tianfuStarPlacementCleanRuleSeedPilot.js','src/ziwei/tianfuPlacementDiscrepancyRelations.js'], tests:['test/ziweiZiweiStarPlacementCleanRuleSeedPilot.test.js','test/ziweiZiweiStarPlacementAcceptance.test.js','test/ziweiTianfuStarPlacementCleanRuleSeedPilot.test.js','test/ziweiTianfuConventionProvenance.test.js','test/ziweiZixingTianfuSourceChain.test.js'], artifacts:['artifacts/ziwei-zixing-tianfu-source-chain-v0/complete.json','artifacts/ziwei-tianfu-convention-provenance-v0/complete.json','artifacts/ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0/complete.json'], dependsOn:['five-element-bureau','palace-layout'], blocker:'blocker-palace-semantic-identity', impact:'14주성 계열의 coordinate-to-palace 승격을 막는다.' },
  { id:'fourteen-major-stars', label:'14주성 reconciliation', implementation:'verified_within_scope', source:'partial', claimProvenance:'complete_within_scope', readiness:'blocked', code:['src/ziwei/starResolver.js','src/ziwei/starPlacementRules.js'], tests:['test/ziweiMajorStarClaimReadinessReconciliation.test.js','test/ziweiMajorStarCoordinateProvenance.test.js','test/ziweiMajorStarSourceCorpusProvenance.test.js'], artifacts:['artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json','artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json','artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json'], dependsOn:['ziwei-tianfu-placement','palace-layout'], blocker:'blocker-palace-semantic-identity', impact:'봉인된 reconciliation은 authoritative evidence로 연결되며 재판정하지 않는다.' },
  { id:'four-transformations', label:'사화', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/transformationRules.js','src/ziwei/transformationResolver.js'], tests:['test/transformationAndMinor.test.js','test/ziweiCoreContract.test.js','test/ziweiPipeline.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['fourteen-major-stars'], blocker:'blocker-four-transform-source-witness', impact:'연도 천간→주성 사화의 독립 근거가 없으면 해석 payload로 갈 수 없다.' },
  { id:'minor-stars', label:'보조성·6길성', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/minorStarRules.js','src/ziwei/minorStarResolver.js'], tests:['test/transformationAndMinor.test.js','test/ziweiCoreContract.test.js','test/ziweiQualityBenchmark.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['ming-shen','input-calendar-time'], blocker:'blocker-minor-star-source-witness', impact:'보조성 결과는 계산되지만 source identity와 외부 oracle이 없다.' },
  { id:'palace-relations', label:'대궁·삼방사정·topic 관계', implementation:'present_unverified', source:'unresolved', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/palaceRelationRules.js','src/ziwei/ziweiPalaceContext.js'], tests:['test/ziweiPipeline.test.js','test/ziweiContract.test.js','test/ziweiPromptSafetyContract.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['palace-layout','fourteen-major-stars','minor-stars','four-transformations'], blocker:'blocker-palace-semantic-identity', impact:'관계 구조는 계산되지만 의미 claim으로 승격되지 않는다.' },
  { id:'decade-year-fortune', label:'대운·세운·운 시계열', implementation:'absent', source:'absent', claimProvenance:'absent', readiness:'research_only', code:['src/ziwei/ziweiContract.js'], tests:['test/ziweiContract.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['input-calendar-time','palace-layout'], blocker:'blocker-timing-domain-absent', impact:'자미두수 시간축은 production 계산 범위 밖이며 구현을 임의 추가하지 않는다.' },
  { id:'fixture-external-validation', label:'fixture·외부 대조', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/externalZiweiFixtures.js'], tests:['test/ziweiFixtureReconciliation.test.js','test/ziweiQualityBenchmark.test.js','test/externalValidationRunner.test.js'], artifacts:['artifacts/ziwei-fixture-reconciliation-v1/complete.json','artifacts/ziwei-readiness-baseline-v1/complete.json'], dependsOn:['fourteen-major-stars','four-transformations','minor-stars'], blocker:'blocker-external-oracle-identity', impact:'observed match는 independent verification이 아니다.' },
  { id:'source-claim-provenance', label:'source identity·claim provenance', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/cleanRuleCorpusSourceSelection.js'], tests:['test/ziweiOccurrenceProvenance.test.js','test/ziweiSourceIdentityClaimBoundaryAudit.test.js','test/ziweiReadinessAdmissionBlockerAudit.test.js'], artifacts:['artifacts/ziwei-occurrence-level-provenance-v0/complete.json','artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json','artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json'], dependsOn:['fixture-external-validation'], blocker:'blocker-source-identity-unresolved', impact:'raw occurrence와 stable claim의 경계를 보존하며 grounding을 막는다.' },
  { id:'readiness-activation-boundary', label:'readiness·grounding·activation', implementation:'present_unverified', source:'partial', claimProvenance:'partial', readiness:'blocked', code:['src/ziwei/ziweiContract.js','src/interpretationPrep/ziweiPromptAdapter.js'], tests:['test/ziweiReadinessBaseline.test.js','test/ziweiPromptSafetyContract.test.js','test/ziweiStructuralAdmissionGuardPilot.test.js'], artifacts:['artifacts/ziwei-readiness-baseline-v1/complete.json','artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json','artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/layeredReadiness.json'], dependsOn:['source-claim-provenance','palace-relations'], blocker:'blocker-source-identity-unresolved', impact:'계산 결과가 있어도 interpretation/activation은 blocked로 유지된다.' }
]

const blockers = [
  { id:'blocker-calendar-time-source-identity', priority:'P0', title:'음력·윤달·자시 입력 source identity/독립 대조 부재', affectedDomains:['input-calendar-time','ming-shen','five-element-bureau'], resolution:'입력 변환 규칙과 경계의 immutable source witness 및 independent oracle', sourcePaths:['src/ziwei/ziweiResolver.js','src/ziwei/ziweiContract.js'] },
  { id:'blocker-palace-semantic-identity', priority:'P0', title:'branch/ordinal 좌표와 궁 의미의 authoritative mapping 부재', affectedDomains:['palace-layout','ziwei-tianfu-placement','fourteen-major-stars','palace-relations'], resolution:'source와 production 양쪽에 동일한 branch·궁 label·ordinal mapping을 직접 증거화', sourcePaths:['src/ziwei/ziweiContract.js','artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json'] },
  { id:'blocker-source-identity-unresolved', priority:'P0', title:'occurrence source identity와 stable claim boundary 미해결', affectedDomains:['source-claim-provenance','readiness-activation-boundary'], resolution:'scan/page/folio/edition/hash와 occurrence-level provenance를 claim gate에 연결', sourcePaths:['src/ziwei/cleanRuleCorpusSourceSelection.js','artifacts/ziwei-occurrence-level-provenance-v0/complete.json'] },
  { id:'blocker-external-oracle-identity', priority:'P1', title:'외부 fixture의 독립 oracle/source identity 부재', affectedDomains:['fixture-external-validation'], resolution:'판본·원문·촬영 byte와 evaluator independence를 확보', sourcePaths:['src/ziwei/externalZiweiFixtures.js','artifacts/ziwei-fixture-reconciliation-v1/complete.json'] },
  { id:'blocker-four-transform-source-witness', priority:'P1', title:'사화 표의 직접 source witness 부재', affectedDomains:['four-transformations'], resolution:'10 천간×4 사화 표의 page/folio/table witness', sourcePaths:['src/ziwei/transformationRules.js'] },
  { id:'blocker-minor-star-source-witness', priority:'P1', title:'6길성·보조성 규칙의 직접 source witness 부재', affectedDomains:['minor-stars'], resolution:'각 보조성 규칙표와 입력 경계의 page/folio witness', sourcePaths:['src/ziwei/minorStarRules.js'] },
  { id:'blocker-timing-domain-absent', priority:'P2', title:'대운·세운 계산 구현·fixture·외부 대조 부재', affectedDomains:['decade-year-fortune'], resolution:'정의된 production contract, fixture, independent oracle이 모두 필요', sourcePaths:['src/ziwei/ziweiContract.js'] }
]

const backlog = [
  { id:'backlog-p0-palace-identity', priority:'P0', blockerId:'blocker-palace-semantic-identity', dependsOn:['blocker-calendar-time-source-identity'], rationale:'fan-out 4개 domain과 14주성 의미 승격을 막으며 safety boundary가 높다.', nextUnit:'궁 label/ordinal/branch shared mapping witness' },
  { id:'backlog-p0-source-claim-boundary', priority:'P0', blockerId:'blocker-source-identity-unresolved', dependsOn:['blocker-external-oracle-identity'], rationale:'모든 source-backed claim과 activation gate의 공통 기반이다.', nextUnit:'occurrence identity와 claim boundary audit 재검토' },
  { id:'backlog-p1-external-oracle', priority:'P1', blockerId:'blocker-external-oracle-identity', dependsOn:['backlog-p0-source-claim-boundary'], rationale:'새 판본/원문 확보로 직접 해소 가능하며 fixture domain을 unblock한다.', nextUnit:'외부 chart/table oracle source acquisition' },
  { id:'backlog-p1-four-transform', priority:'P1', blockerId:'blocker-four-transform-source-witness', dependsOn:['backlog-p0-source-claim-boundary'], rationale:'규칙표 원문 확보로 직접 해소 가능하다.', nextUnit:'사화 표 witness' },
  { id:'backlog-p1-minor-stars', priority:'P1', blockerId:'blocker-minor-star-source-witness', dependsOn:['backlog-p0-source-claim-boundary'], rationale:'보조성 규칙표 원문 확보로 직접 해소 가능하다.', nextUnit:'6길성 규칙 witness' },
  { id:'backlog-p2-timing', priority:'P2', blockerId:'blocker-timing-domain-absent', dependsOn:['backlog-p0-palace-identity'], rationale:'구현·fixture·외부 대조가 모두 필요하며 source-only로 끝나지 않는다.', nextUnit:'대운·세운 contract decision point' },
  { id:'backlog-deferred-production-selection', priority:'Deferred', blockerId:'blocker-palace-semantic-identity', dependsOn:['backlog-p0-palace-identity'], rationale:'production 선택·계약 변경이 필요하므로 자료 조사와 분리한다.', nextUnit:'명시적 production decision 이후' }
]

const acquisition = [
  { id:'acq-palace-identity', backlogId:'backlog-p0-palace-identity', targetClaim:'claim-palace-coordinate-semantic-identity', rules:'12궁 명칭·궁순·branch/ordinal 대응과 명궁·신궁 표시 도식', keywords:['紫微斗數 十二宮 宮位 地支','命宮 身宮 十二宮 表','자미두수 12궁 궁위 지지'], evidence:'동일 판본의 원문 page/folio 촬영 또는 무손실 scan crop; transcription은 exploration_only_not_canonical', minimumScope:'mapping을 완전히 보여주는 연속 leaf와 앞뒤 판본/서지 page', metadata:'title, edition/print year, repository/call number, page/folio, scan settings, file SHA-256', accept:'glyph/layout/table boundary가 판독되고 source identity와 actual bytes가 보존됨', reject:'preview-only, catalog-only, OCR-only, source identity 추정, mapping 일부만 보이는 crop' },
  { id:'acq-external-oracle', backlogId:'backlog-p1-external-oracle', targetClaim:'claim-external-fixture-independent-oracle', rules:'chart/table expected outputs와 source method disclosure', keywords:['紫微斗數 命盤 表格 起紫微 安天府','紫微斗數 四化 六吉星 表','자미두수 명반 자미 천부 사화 보조성'], evidence:'원문 table/chart scan과 독립 evaluator가 재현할 수 있는 sourceRefs', minimumScope:'각 expected field를 포함한 전체 표/명반 1개와 경계 사례', metadata:'판본·소장처·folio/page·촬영일·render/crop·hash', accept:'production과 분리된 evaluator가 동일 input/output을 재현', reject:'동일 lineage의 중복 웹 전사, 수동 입력만, hash/folio 없는 이미지' },
  { id:'acq-four-transform', backlogId:'backlog-p1-four-transform', targetClaim:'claim-four-transformations-source-rule', rules:'10 천간별 화록·화권·화과·화기의 40 cell 표', keywords:['紫微斗數 四化表 十天干','四化 甲 廉貞 破軍 武曲 太陽','자미두수 사화 표 천간'], evidence:'표 전체가 보이는 immutable scan/photo와 cell locator', minimumScope:'표 제목/범위와 10행×4열 전체 및 판본 metadata', metadata:'title, edition, page/folio, scan resolution, file SHA-256', accept:'40 cell과 star glyph를 직접 확인 가능', reject:'일부 천간·요약 블로그·OCR만' },
  { id:'acq-minor-stars', backlogId:'backlog-p1-minor-stars', targetClaim:'claim-minor-star-rules', rules:'6길성 및 각 입력(년간·월·시지)별 배치 규칙표', keywords:['紫微斗數 六吉星 安左輔 右弼 文昌 文曲 天魁 天鉞','자미두수 6길성 배치 표'], evidence:'각 규칙과 경계가 함께 보이는 원문 scan/photo', minimumScope:'6성 전체와 입력축 설명을 포함한 연속 page/folio 범위', metadata:'판본·page/folio·촬영/render·hash', accept:'입력 domain과 출력 branch를 source에서 직접 연결', reject:'star name list only, 독립 source identity 없는 전사' }
]

const sourcePaths = [...new Set(domains.flatMap(d => [...d.code, ...d.tests, ...d.artifacts]))]
const protectedPaths = [...new Set([
  ...sourcePaths,
  ...domains.flatMap(d => d.code),
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/claimLedger.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/layeredReadiness.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/blockerRegistry.json'
])].filter(p => existsSync(resolve(root, p)))

const evidence = protectedPaths.map(path => ({ id:`evidence-${sha256(Buffer.from(path)).slice(0,16)}`, ...ref(path, 'inventory_actual_byte_reference') }))
const evidenceByPath = new Map(evidence.map(x => [x.path, x.id]))
for (const blocker of blockers) blocker.sourceRefs = blocker.sourcePaths.map(path => evidenceByPath.get(path)).filter(Boolean)
const claims = domains.map(d => ({ id:`claim-${d.id}`, domainId:d.id, target:d.label, sourceRefs:[...new Set([...d.code,...d.artifacts].filter(p=>existsSync(resolve(root,p))).map(p=>evidenceByPath.get(p)))], readiness:d.readiness, bounded:'coverage inventory only; no semantic truth promotion' }))
const graphNodes = [
  ...domains.map(d=>({id:`domain-${d.id}`,kind:'domain'})),
  ...claims.map(c=>({id:c.id,kind:'claim'})),
  ...evidence.map(e=>({id:e.id,kind:'evidence'})),
  ...blockers.map(b=>({id:b.id,kind:'blocker'})),
  ...backlog.map(b=>({id:b.id,kind:'backlog'}))
]
const graphEdges = [
  ...domains.flatMap(d=>[
    ...d.dependsOn.map(x=>({from:`domain-${x}`,to:`domain-${d.id}`,type:'dependency'})),
    {from:`domain-${d.id}`,to:`claim-${d.id}`,type:'has_claim'},
    ...d.code.map(p=>({from:`domain-${d.id}`,to:evidenceByPath.get(p),type:'implemented_by'})).filter(e=>e.to),
    ...d.tests.map(p=>({from:`domain-${d.id}`,to:evidenceByPath.get(p),type:'tested_by'})).filter(e=>e.to),
    ...d.artifacts.map(p=>({from:`claim-${d.id}`,to:evidenceByPath.get(p),type:'authoritative_artifact'})).filter(e=>e.to),
    {from:`domain-${d.id}`,to:d.blocker,type:'blocked_by'}
  ]),
  ...backlog.flatMap(b=>b.dependsOn.map(x=>({from:x,to:b.id,type:'backlog_dependency'}))),
  ...backlog.map(b=>({from:b.blockerId,to:b.id,type:'backlog_resolution'}))
]

const complete = {
  namespace, schema:'ziwei-system-evidence-readiness-coverage-map-v0', version:'0.1.0', basisHead:head,
  scope:{externalSearch:false,newSourceAdoption:false,productionMutation:false,readinessMutation:false,protectedNamespace:'ziwei-major-star-claim-readiness-reconciliation-v0'},
  statusVocabulary:{implementation:['absent','present_unverified','verified_within_scope'],source:['absent','unresolved','partial','direct_within_scope'],claimProvenance:['absent','partial','complete_within_scope'],readiness:['research_only','blocked','eligible_within_declared_scope']},
  counts:{domains:domains.length,claims:claims.length,evidence:evidence.length,blockers:blockers.length,backlog:backlog.length,graphNodes:graphNodes.length,graphEdges:graphEdges.length,acquisitionPlans:acquisition.length},
  domains, claims, evidence, blockers, backlog, acquisition, graph:{nodes:graphNodes,edges:graphEdges},
  authoritativeLinks:{majorStarReconciliation:'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json',tianfuConvention:'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',sourceIdentityAudit:'artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json'},
  protectedActualBytes:Object.fromEntries(protectedPaths.map(path=>[path,fileHash(path)])),
  handoff:{coverage:'13 domains; implementation present/verified only within local declared scope; source and claim provenance remain partial/unresolved in most domains; readiness is blocked or research_only.',largestBlocker:'blocker-palace-semantic-identity plus blocker-source-identity-unresolved',nextThree:['궁 coordinate-semantic identity witness','occurrence source identity/claim boundary audit','외부 독립 oracle 및 사화/보조성 source witness'],sourceNeededWhen:'P0 identity/claim boundary is reviewed and a user-sourced immutable scan can satisfy the acquisition acceptance criteria.',verdict:'complete_ziwei_system_evidence_readiness_coverage_map_uncommitted'},
  negativeContract:{mutations:['domain implementation status','backlog priority','graph dependency','claim sourceRefs','domain readiness'],expected:'checker rejects every mutation'}
}

mkdirSync(outDir,{recursive:true})
const serialized = `${JSON.stringify(complete,null,2)}\n`
writeFileSync(completePath,serialized)
writeFileSync(integrityPath,`${JSON.stringify({path:'complete.json',sha256:sha256(Buffer.from(serialized)),basisHead:head},null,2)}\n`)
console.log(`materialized ${namespace}: ${jsonHash(complete)}`)
