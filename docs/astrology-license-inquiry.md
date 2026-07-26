# Astrodienst License Inquiry Draft

Status: **draft only — not sent**
Intended recipient: `webmaster@astro.ch`, as listed in the official Swiss
Ephemeris licensing instructions.

## Email draft

**Subject:** Clarification request: Professional License for browser WebAssembly deployment

Dear Astrodienst licensing team,

We are evaluating the Swiss Ephemeris Professional License for one software
project. The project is a web application deployed through Vercel. It prepares
calculation evidence for a user to copy into a separate chat experience; it
does not itself generate astrological interpretations.

Our proposed architecture compiles the official Swiss Ephemeris C Core into a
small WebAssembly module. The browser would load the `.wasm`, JavaScript glue,
and the required Swiss Ephemeris data files as static Vercel assets, then run
the calculations locally. The official Swiss source and generated artifacts
would not be committed to our public source repository; they would be produced
in a controlled build process.

Before purchasing and deploying, could you please confirm the following points
in writing?

1. Does the Professional License permit compiling the Swiss Ephemeris C Core
   to WebAssembly and distributing it for execution in end users' browsers?
2. May the generated `.wasm` and JavaScript glue files be served as static
   assets by Vercel?
3. May the required Swiss Ephemeris data files be included in the same web
   deployment artifact and served to the browser?
4. Is this allowed when users can access those WASM or data assets through
   browser developer tools or their direct asset URLs?
5. Is a service that provides calculations only, while the user performs
   interpretation in a separate chat service, within the same licensed project
   scope?
6. Can Preview, Staging, and Production domains for this single project be
   covered by one Professional License?
7. May we keep the original Swiss source and generated artifacts out of the
   public source repository and use them only in an internal build process?
8. May our minimal WebAssembly binding code remain under our own project
   license if it does not modify the Swiss C Core?
9. Would a future mobile application or additional domain using the same
   engine require a separate license or contract amendment?
10. Before the license is signed and paid, may we build and use artifacts only
    for local and non-public technical evaluation?
11. Which exact Swiss Ephemeris versions and data files are covered by the
    current Professional License?
12. What obligations apply to already deployed artifacts when the licensed
    service ends or the contract otherwise terminates?

Please also let us know whether there are any project, product, domain,
developer-count, deployment-count, or redistribution restrictions not stated
in the June 2026 public contract.

Thank you for helping us confirm the correct licensing path before any public
deployment.

Kind regards,

[Name / legal entity]

[Address]

[Email]

## Answer record

| Question | Answer | Evidence/date | Gate effect |
|---|---|---|---|
| Browser WASM | pending | — | must be explicit yes |
| Vercel `.wasm`/Glue | pending | — | must be explicit yes |
| Ephemeris data files | pending | — | must be explicit yes |
| Direct asset access | pending | — | must not prohibit intended transport |
| Calculation-only product | pending | — | project scope must include it |
| Preview/Staging/Production | pending | — | environments must be covered |
| Internal build/public repo exclusion | pending | — | build plan must be accepted |
| Project-owned Binding | pending | — | ownership/terms must be clear |
| Mobile/additional domain | pending | — | records future expansion rule |
| Pre-contract local evaluation | pending | — | records Spike boundary |
| Covered version/data | pending | — | pins contract provenance |
| End-of-service duties | pending | — | records artifact retirement rule |

## Gate rules

- `browserWasmRedistributionConfirmed: pass` only after a written answer clearly
  permits the proposed browser delivery.
- `ephemerisDataRedistributionConfirmed: pass` only after required data files
  and direct browser access are explicitly covered.
- `professionalLicenseScopeConfirmed: pass` only after project, environment,
  version, and build-repository scope are clear and the required contract is
  effective.
- A conditional, ambiguous, or verbal-only answer remains `pending`.
- A prohibition on browser WASM or required data distribution triggers
  `alternative_required` for the current architecture.
