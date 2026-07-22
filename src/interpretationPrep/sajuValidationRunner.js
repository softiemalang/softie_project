/**
 * Saju Validation Runner
 *
 * Pure functions to execute and compare Saju engine outputs against Golden Fixtures.
 */

import { SAJU_VALIDATION_FIXTURE_VERSION } from './fixtures/sajuValidationFixtures.js'

/**
 * Extracts a nested value from an object using a dot-path string (e.g. 'systems.saju.raw.dayMaster.stem')
 */
export function getNestedValue(obj, path) {
  if (!obj || typeof path !== 'string') return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

/**
 * Deeply compares actual and expected values, identifying mismatch reasons.
 * Returns { passed: boolean, reason: string | null }
 */
export function compareValues(actual, expected) {
  if (typeof actual !== typeof expected) {
    return {
      passed: false,
      reason: `type_mismatch (expected: ${typeof expected}, actual: ${typeof actual})`
    }
  }

  if (actual === null || expected === null) {
    if (actual === expected) return { passed: true, reason: null }
    return { passed: false, reason: 'value_mismatch (nullity mismatch)' }
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return { passed: false, reason: 'type_mismatch (expected array, actual non-array)' }
    }
    if (actual.length !== expected.length) {
      return { passed: false, reason: `array_length_mismatch (expected: ${expected.length}, actual: ${actual.length})` }
    }
    for (let i = 0; i < expected.length; i++) {
      const cmp = compareValues(actual[i], expected[i])
      if (!cmp.passed) {
        return { passed: false, reason: `array_element_mismatch at [${i}]: ${cmp.reason}` }
      }
    }
    return { passed: true, reason: null }
  }

  if (typeof expected === 'object') {
    const expectedKeys = Object.keys(expected)
    // Deep structural comparison
    for (const key of expectedKeys) {
      if (!(key in actual)) {
        return { passed: false, reason: `missing_field (${key})` }
      }
      const cmp = compareValues(actual[key], expected[key])
      if (!cmp.passed) {
        return { passed: false, reason: `nested_mismatch at .${key}: ${cmp.reason}` }
      }
    }
    return { passed: true, reason: null }
  }

  // Primitive value comparison
  if (actual !== expected) {
    return {
      passed: false,
      reason: `value_mismatch (expected: "${expected}", actual: "${actual}")`
    }
  }

  return { passed: true, reason: null }
}

/**
 * Validates a single Saju golden fixture against the computed result.
 */
export function validateSingleFixture(fixture, prepareInterpretationDataFn) {
  if (!fixture || !fixture.id) {
    return {
      fixtureId: 'unknown',
      status: 'invalid_fixture',
      passed: false,
      total: 0,
      failed: 1,
      skipped: 0,
      mismatches: [{ path: 'root', expected: null, actual: null, reason: 'missing_fixture_metadata' }]
    }
  }

  const paths = fixture.expectedPaths || [];
  const hasExpectedError = fixture.expectedError && typeof fixture.expectedError.substring === 'string';

  // 0개 assertion fixture 차단 규칙 (Task 1)
  if (paths.length === 0 && !hasExpectedError) {
    return {
      fixtureId: fixture.id,
      title: fixture.title,
      category: fixture.category,
      verificationStatus: fixture.verificationStatus,
      status: 'invalid_fixture',
      passed: false,
      total: 0,
      failed: 1,
      skipped: 0,
      mismatches: [{
        path: 'root',
        expected: 'at_least_one_assertion',
        actual: 'empty_assertions',
        reason: 'no_assertions'
      }]
    };
  }

  try {
    // Execute the actual engine function
    const result = prepareInterpretationDataFn(fixture.input, {});

    // Case A: The engine returned a string warning instead of an object payload
    if (typeof result === 'string') {
      if (hasExpectedError) {
        const substring = fixture.expectedError.substring;
        if (result.includes(substring)) {
          // Exactly matches the expected warning message
          return {
            fixtureId: fixture.id,
            title: fixture.title,
            category: fixture.category,
            verificationStatus: fixture.verificationStatus,
            status: fixture.verificationStatus === 'pending_external_verification' ? 'pending' : 'passed',
            passed: fixture.verificationStatus !== 'pending_external_verification',
            total: 1,
            failed: 0,
            skipped: 0,
            mismatches: []
          };
        } else {
          // Warning returned but message didn't contain target substring
          return {
            fixtureId: fixture.id,
            title: fixture.title,
            category: fixture.category,
            verificationStatus: fixture.verificationStatus,
            status: 'failed',
            passed: false,
            total: 1,
            failed: 1,
            skipped: 0,
            mismatches: [{
              path: 'expected_error',
              expected: `Warning containing substring: "${substring}"`,
              actual: result,
              reason: 'error_substring_mismatch'
            }]
          };
        }
      } else {
        // Warning returned but no error was expected
        return {
          fixtureId: fixture.id,
          title: fixture.title,
          category: fixture.category,
          verificationStatus: fixture.verificationStatus,
          status: 'failed',
          passed: false,
          total: 1,
          failed: 1,
          skipped: 0,
          mismatches: [{
            path: 'input_validation',
            expected: 'valid_data_structure',
            actual: result,
            reason: 'rejected_with_string_warning'
          }]
        };
      }
    }

    // Case B: Engine executed and returned a normal data object
    if (hasExpectedError) {
      // An error was explicitly expected, but the engine succeeded. This is a failure.
      return {
        fixtureId: fixture.id,
        title: fixture.title,
        category: fixture.category,
        verificationStatus: fixture.verificationStatus,
        status: 'failed',
        passed: false,
        total: 1,
        failed: 1,
        skipped: 0,
        mismatches: [{
          path: 'expected_error',
          expected: `Exception or warning containing: "${fixture.expectedError.substring}"`,
          actual: 'normal_object_payload_returned',
          reason: 'expected_error_not_thrown'
        }]
      };
    }

    // Compare expected dot paths on successful execution
    const mismatches = [];

    for (const path of paths) {
      const expectedVal = fixture.expected[path];
      const actualVal = getNestedValue(result, path);

      if (actualVal === undefined) {
        mismatches.push({
          path,
          expected: expectedVal,
          actual: undefined,
          reason: 'missing_field'
        });
        continue;
      }

      const comparison = compareValues(actualVal, expectedVal);
      if (!comparison.passed) {
        mismatches.push({
          path,
          expected: expectedVal,
          actual: actualVal,
          reason: comparison.reason
        });
      }
    }

    const totalPaths = paths.length;
    const failedCount = mismatches.length;

    // Define final status. If pending_external_verification, always force 'pending' status
    const isPendingStatus = fixture.verificationStatus === 'pending_external_verification';
    const finalStatus = isPendingStatus ? 'pending' : (failedCount === 0 ? 'passed' : 'failed');
    const finalPassed = isPendingStatus ? false : (failedCount === 0);

    return {
      fixtureId: fixture.id,
      title: fixture.title,
      category: fixture.category,
      verificationStatus: fixture.verificationStatus,
      status: finalStatus,
      passed: finalPassed,
      total: totalPaths,
      failed: failedCount,
      skipped: 0,
      mismatches
    };

  } catch (error) {
    const errorMsg = error.message || '';
    if (hasExpectedError) {
      const substring = fixture.expectedError.substring;
      if (errorMsg.includes(substring)) {
        return {
          fixtureId: fixture.id,
          title: fixture.title,
          category: fixture.category,
          verificationStatus: fixture.verificationStatus,
          status: fixture.verificationStatus === 'pending_external_verification' ? 'pending' : 'passed',
          passed: fixture.verificationStatus !== 'pending_external_verification',
          total: 1,
          failed: 0,
          skipped: 0,
          mismatches: []
        };
      } else {
        return {
          fixtureId: fixture.id,
          title: fixture.title,
          category: fixture.category,
          verificationStatus: fixture.verificationStatus,
          status: 'failed',
          passed: false,
          total: 1,
          failed: 1,
          skipped: 0,
          mismatches: [{
            path: 'expected_error',
            expected: `Exception containing: "${substring}"`,
            actual: errorMsg,
            reason: 'exception_message_substring_mismatch'
          }]
        };
      }
    }

    // Unexpected runtime exception
    return {
      fixtureId: fixture.id,
      title: fixture.title,
      category: fixture.category,
      verificationStatus: fixture.verificationStatus,
      status: 'failed',
      passed: false,
      total: 1,
      failed: 1,
      skipped: 0,
      mismatches: [{
        path: 'runtime_error',
        expected: 'normal_execution',
        actual: errorMsg,
        reason: 'exception_thrown'
      }]
    };
  }
}

/**
 * Runs the entire Saju validation fixtures suite.
 */
export function runSajuValidationSuite(fixtures, prepareInterpretationDataFn) {
  const results = fixtures.map(f => validateSingleFixture(f, prepareInterpretationDataFn))

  // Aggregate statistics
  const summary = {
    fixtureVersion: SAJU_VALIDATION_FIXTURE_VERSION,
    generatedAt: new Date().toISOString(),
    statistics: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      invalid: results.filter(r => r.status === 'invalid_fixture').length,
      verified: {
        total: results.filter(r => r.verificationStatus === 'verified').length,
        passed: results.filter(r => r.verificationStatus === 'verified' && r.status === 'passed').length,
        failed: results.filter(r => r.verificationStatus === 'verified' && r.status === 'failed').length
      },
      regressionOnly: {
        total: results.filter(r => r.verificationStatus === 'regression_only').length,
        passed: results.filter(r => r.verificationStatus === 'regression_only' && r.status === 'passed').length,
        failed: results.filter(r => r.verificationStatus === 'regression_only' && r.status === 'failed').length
      }
    },
    categoryStats: {},
    results
  }

  // Calculate category statistics
  for (const res of results) {
    const cat = res.category || 'unknown'
    if (!summary.categoryStats[cat]) {
      summary.categoryStats[cat] = { total: 0, passed: 0, failed: 0, pending: 0, invalid: 0 }
    }
    summary.categoryStats[cat].total++
    if (res.status === 'passed') summary.categoryStats[cat].passed++
    if (res.status === 'failed') summary.categoryStats[cat].failed++
    if (res.status === 'pending') summary.categoryStats[cat].pending++
    if (res.status === 'invalid_fixture') summary.categoryStats[cat].invalid++
  }

  return summary
}

/**
 * Generates a developer-facing Markdown validation report.
 */
export function buildValidationReport(summary) {
  const lines = []
  lines.push(`# Saju Engine Integration Validation Report`)
  lines.push(`* **Generated At**: ${summary.generatedAt}`)
  lines.push(`* **Fixture Version**: ${summary.fixtureVersion}`)
  lines.push(`\n## Summary Statistics`)
  lines.push(`| Status Category | Total | Passed | Failed | Pending/Invalid |`)
  lines.push(`| :--- | :---: | :---: | :---: | :---: |`)
  lines.push(`| **Overall Fixtures** | ${summary.statistics.total} | ${summary.statistics.passed} | ${summary.statistics.failed} | ${summary.statistics.pending + summary.statistics.invalid} |`)
  lines.push(`| **Verified (Golden)** | ${summary.statistics.verified.total} | ${summary.statistics.verified.passed} | ${summary.statistics.verified.failed} | - |`)
  lines.push(`| **Regression Only** | ${summary.statistics.regressionOnly.total} | ${summary.statistics.regressionOnly.passed} | ${summary.statistics.regressionOnly.failed} | - |`)

  lines.push(`\n## Category Breakdown`)
  lines.push(`| Category | Total | Passed | Failed | Pending | Invalid |`)
  lines.push(`| :--- | :---: | :---: | :---: | :---: | :---: |`)
  for (const [cat, stat] of Object.entries(summary.categoryStats)) {
    const invalidCount = stat.invalid || 0;
    lines.push(`| \`${cat}\` | ${stat.total} | ${stat.passed} | ${stat.failed} | ${stat.pending} | ${invalidCount} |`)
  }

  lines.push(`\n## Detailed Test Case Results`)
  for (const res of summary.results) {
    const statusIcon = res.status === 'passed' ? '✅' : res.status === 'pending' ? '⏳' : res.status === 'invalid_fixture' ? '⚠️' : '❌'
    lines.push(`### ${statusIcon} [${(res.verificationStatus || 'INVALID').toUpperCase()}] ${res.title || 'Invalid Fixture'} (\`${res.fixtureId}\`)`)
    lines.push(`* **Category**: \`${res.category || 'unknown'}\``)
    lines.push(`* **Status**: **${res.status.toUpperCase()}** (Passed Paths: ${res.total - res.failed}/${res.total})`)

    if (res.mismatches && res.mismatches.length > 0) {
      lines.push(`\n#### Mismatches Detail:`)
      lines.push(`| Path | Expected | Actual | Reason |`)
      lines.push(`| :--- | :--- | :--- | :--- |`)
      for (const mis of res.mismatches) {
        lines.push(`| \`${mis.path}\` | \`${JSON.stringify(mis.expected)}\` | \`${JSON.stringify(mis.actual)}\` | *${mis.reason}* |`)
      }
    }
    lines.push(`\n---`)
  }

  return lines.join('\n')
}
