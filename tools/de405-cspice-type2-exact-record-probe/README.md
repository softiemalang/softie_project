# DE405 CSPICE Type-2 exact-record probe

This probe links the local CSPICE N0067 low-level f2c symbols `spkr02_` and `spke02_`. It opens the kernel read-only, validates the requested segment identity, uses an interior ET to make the official `spkr02_` reader return the requested one-based record, and then evaluates that exact returned payload at the evidence query ET with `spke02_`.

The reader-selection ET and the evaluator query ET are recorded separately. The probe never invokes `spkez_c`, `spkezr_c`, a project evaluator, a production selector, a candidate search, or a brute-force scan. It does not expose or infer a high-level CSPICE selected record, segment, route, or accumulator order.
