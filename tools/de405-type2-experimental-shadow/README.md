# DE405 experimental Type-2 shadow runner

This diagnostic-only runner reads existing DE405 SPK Type-2 records through
CSPICE DAF APIs, evaluates each record with the isolated official-order
recurrence, and emits target/center chain shadow states. It does not call
high-level CSPICE state selection APIs and cannot affect production routing.
