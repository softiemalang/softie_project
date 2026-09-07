# Saju P1 read-only handoff

`saju-p1-read-only-handoff-v1` is the smallest boundary for reading an
already-authoritative user calculation before the admitted `간여지동` rule is
evaluated. It is a projection only. It does not call the Saju engine, rebuild a
pillar from database columns, load a source, create a claim, ask for
reflection, compare lenses, or change readiness/activation.

The authenticated API entry point is
`getSajuP1ReadOnlyHandoff(profileId)` in `src/saju/api.js`. It uses the existing
`getNatalSnapshot(profileId)` query and therefore keeps the existing Supabase
owner/RLS boundary. The returned value is produced by the pure
`buildSajuP1ReadOnlyHandoff(payload)` projector in
`src/saju/p1ReadOnlyHandoff.js`.

## Authoritative input envelope

The projector reads only an explicit raw root and an explicit reference root.
Accepted raw roots are:

- `payload.raw`
- `payload.authoritativePayload.raw`
- `payload.authoritative.raw`
- `payload.natal_data.raw`
- `payload.computed_data.raw`

The raw root must contain `/raw/pillars/day` and an authoritative candidate
set (`raw.candidates`, `raw.candidateSet.candidates`, `raw.candidate`, or
`raw.pillars.day.candidate`; object-valued day candidates are also accepted).
A candidate object must expose an existing `candidateId` or `id` and a
resolved status (`calculated`, `resolved`, or `verified`).
The day field itself must have `status: calculated`, exactly one
`candidates` value, and a non-empty `referenceValue`. The candidate set must
also contain exactly one entry. If an upstream `stateContract` is present,
its calculation status must be `calculated` and verification status must be
`verified`.

Reference metadata may be supplied in the canonical `p1ReadOnlyRefs` shape:

```json
{
  "p1ReadOnlyRefs": {
    "calculation": {
      "inputRefIds": ["..."],
      "resultRefIds": ["..."]
    },
    "policy": { "refIds": ["..."] },
    "upstream": {
      "calculationRefIds": ["..."],
      "historicalAuthorityRefIds": ["..."],
      "upstreamBoundaryRefIds": ["..."]
    }
  }
}
```

`authoritativeRefs`, `refs.p1ReadOnly`, and a contract-style `refs` array
with the existing calculation/policy/upstream roles are accepted as explicit
equivalents. Reference entries are reduced to their existing IDs; an entry
with a non-`resolved` resolution, a wrong role/axis, a duplicate ID, or an
invalid ID makes that group unresolved. No reference is invented.

## Output fields

The closed output contains only:

```text
schemaVersion
handoffVersion
status                  ready | unresolved
calculation.day.status
calculation.day.candidateId
calculation.day.candidateCount
calculation.day.candidateStatus
calculation.day.candidateValues
calculation.day.referenceValue
calculation.day.referencePath
refs.calculation.inputRefIds
refs.calculation.resultRefIds
refs.calculation.policyRefIds
refs.upstream.calculationRefIds
refs.upstream.historicalAuthorityRefIds
refs.upstream.upstreamBoundaryRefIds
gate.predicateEligible
gate.reasonCodes
```

The projector never copies `input`, `birthDate`, `birthTime`, profile
identifiers, full candidate records, or other raw payload fields. `ready`
means only that the minimal predicate input is present and unambiguous; it is
not a rule match, a truth score, a personal-validity result, a claim, or an
activation decision. A consumer may read the fixed day path from this output
and apply the separately registered rule later.

## Fail-closed behavior

The result is `unresolved` with `predicateEligible: false` when the payload or
raw day is absent, the day status is not `calculated`, the day candidate list
is not exactly one, the candidate identity/status/count is not resolved, an
explicit parent state is not verified, or any calculation/policy/upstream
reference group is missing or invalid. A shared day value never collapses a
multi-candidate set. Existing snapshot columns such as `day_stem` and
`day_branch` are not fallback inputs, so legacy snapshots without the raw
path remain unresolved.

`checkSajuP1ReadOnlyHandoff` validates the closed projection locally. It has no
I/O and its result does not promote calculation authority, historical
authority, personal validity, readiness, or activation.
