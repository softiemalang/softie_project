# DE405 experimental Type-2 evaluator

This is a project-owned, source-informed experimental implementation of the
Type-2 Chebyshev record evaluation contract. It accepts one record payload and
one ET and evaluates the six state components. It does not select kernels,
segments, records, bodies, routes, or composition operations.

The implementation was informed by the public mathematical contract and
parity-validated evidence for the official evaluator. No CSPICE source or
comments are copied, and the binary has no CSPICE runtime dependency. This is
not represented as clean-room or production-approved; separate provenance,
licensing, and scientific review are required before any production use.
