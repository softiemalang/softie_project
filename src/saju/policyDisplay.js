import {
  normalizeSajuPolicyContractForConsumer,
  SAJU_POLICY_KEYS,
} from './engine/sajuPolicyContract.js'

const POLICY_LABELS = {
  yearBoundaryPolicy: 'Year boundary',
  monthBoundaryPolicy: 'Month boundary',
  dayBoundaryPolicy: 'Day/子時 boundary',
  hourTimeBasisPolicy: 'Hour time basis',
  qiyunConversionPolicy: '起運 conversion',
}

export function getSajuPolicyBoundaries(snapshot, report) {
  const computed = snapshot?.computed_data || {}
  const reportContent = report?.report_content &&
    typeof report.report_content === 'object' &&
    !Array.isArray(report.report_content)
    ? report.report_content
    : {}
  const reportHasPolicyBoundary = Boolean(
    report && Object.prototype.hasOwnProperty.call(report, 'report_content'),
  )
  const policySource = reportHasPolicyBoundary ? reportContent : computed

  return {
    policyContract: normalizeSajuPolicyContractForConsumer(
      policySource.policyContract,
    ),
    natalPolicyContract: normalizeSajuPolicyContractForConsumer(
      policySource.natalPolicyContract,
    ),
  }
}

export function formatSajuPolicyBoundary(policyContract, natalPolicyContract = null) {
  const formatSelections = (contract) => SAJU_POLICY_KEYS
    .map((key) => {
      const policy = contract.policies[key]
      return `${POLICY_LABELS[key] || key}=${policy.status === 'SELECTED' ? policy.value : 'UNKNOWN'}`
    })
    .join(', ')
  const selections = formatSelections(policyContract)
  const natalBoundary = natalPolicyContract
    ? `; natalStatus=${natalPolicyContract.status}; natalHistoricalAuthority=${natalPolicyContract.historicalAuthority}; natalHistoricalFact=${natalPolicyContract.historicalFact}; natalImplementationPolicy=${natalPolicyContract.implementationPolicy}; natalReadiness=${natalPolicyContract.readinessStatus}; natalActivation=${natalPolicyContract.activationStatus}; natalSelections=[${formatSelections(natalPolicyContract)}]`
    : ''

  return `status=${policyContract.status}; historicalAuthority=${policyContract.historicalAuthority}; historicalFact=${policyContract.historicalFact}; implementationPolicy=${policyContract.implementationPolicy}; readiness=${policyContract.readinessStatus}; activation=${policyContract.activationStatus}; selections=[${selections}]${natalBoundary}`
}
