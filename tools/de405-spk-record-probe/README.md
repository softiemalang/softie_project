# DE405 project-owned SPK record probe

This diagnostic program reads the DE405 BSP through CSPICE N0067 DAF APIs only. It traverses and unpacks segment summaries with DAF, reads Type 2 records with `dafgda_c`, selects records with the project-defined half-open directory rule (the last record includes its final endpoint), evaluates the documented Chebyshev recurrence in this source, and composes descriptor center chains in this source.

It intentionally does not call CSPICE SPK state/selection APIs. In particular, it does not link to or call `spkez_c`, `spkezr_c`, `spkgeo_c`, `spkgps_c`, or `spkpvn_c`. Its selected record is a project-owned reconstruction, not an assertion about CSPICE's unexposed internal selected marker.

Build with `npm run build:de405:spk-record-probe`. Evaluate JSONL with `--evaluate-batch --spk <kernel> --input-jsonl <input> --output-jsonl <output>`.
