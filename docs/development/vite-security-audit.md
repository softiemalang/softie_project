# Vite security and minimum upgrade-path audit

## 판정

`complete_vite_security_upgrade_audit_uncommitted`

이 문서는 2026-08-01 KST에 source HEAD `c4b3578e0946c454b78fdcb59d499cdd971eeae0`에서 수행한 읽기 중심 감사 결과다. root 의존성은 변경하지 않았고, 후보 설치는 `/tmp/softie-vite-audit.BVS8P9`의 git-tracked snapshot에서만 수행했다.

## 기준점과 현재 구조

- branch: `main`; `origin/main...main`: `0 0`
- Node `v22.20.0`; npm `10.9.3`; OSV-Scanner `2.4.0`
- declared Vite: `^5.4.10`; installed/locked Vite: `5.4.21` (direct devDependency)
- declared `@vitejs/plugin-react`: `^4.3.4`; installed/locked: `4.7.0`
- exact minimum plugin-react tested separately: `4.3.4`
- plugin-react 4.3.4 peer: `vite ^4.2.0 || ^5.0.0 || ^6.0.0`
- installed plugin-react 4.7.0 peer: `vite ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`
- Rollup `4.60.2`; esbuild `0.21.5`; `@rollup/wasm-node` `4.60.2`
- `postinstall`: `node scripts/patch-rollup-native.mjs`
- Vite requires Rollup `^4.20.0`; Vite 6/7 candidates continued to use Rollup, not Rolldown.

## 현재 finding 집계

The first baseline summary saying “Vite high 4” was not a count of four Vite advisories. The current npm audit has three direct Vite advisory records (one moderate, one high, plus one moderate transitive `esbuild` record under Vite); OSV groups aliases separately. The distinct Vite-related advisory groups identified from current OSV/npm metadata are:

| Advisory | Alias/CVE | Affected Vite range | Fixed version | Conditions and applicability |
|---|---|---|---|---|
| [GHSA-4w7w-66w2-5vf9](https://github.com/vitejs/vite/security/advisories/GHSA-4w7w-66w2-5vf9) | CVE-2026-39365 | `<=6.4.1` (also affected 7.x/8.x ranges) | 6.4.2; 7.3.2; 8.0.5 | Network-exposed dev server and predictable valid `.map` outside the project. Current Vite 5.4.21 is in the published range, but repository exposure is not evidenced. |
| [GHSA-fx2h-pf6j-xcff](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff) | CVE not listed in npm audit metadata | `<=6.4.2` (also affected 7.x/8.x ranges) | 6.4.3; 7.3.5; 8.0.16 | Network-exposed dev server, Windows, and sensitive file inside an allowed directory; NTFS ADS/8.3 path bypass. Current macOS execution is not the affected platform, but Windows support is not evidenced. |
| [GHSA-v6wh-96g9-6wx3](https://github.com/vitejs/launch-editor/security/advisories/GHSA-v6wh-96g9-6wx3) | CVE-2026-53632 | Vite `<6.4.3`, 7.0.0–7.3.4, 8.0.0–8.0.15 | 6.4.3; 7.3.5; 8.0.16 | Windows UNC path handling can trigger NTLMv2 disclosure when the editor-launch path is attacker-influenced. Current macOS path is not the affected platform; Windows support is not evidenced. |
| [GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99) | none | esbuild `<=0.24.2` | 0.25.0 | This is the Vite-linked transitive dev-server/CORS finding. Current esbuild `0.21.5` is affected; Vite 6.4.3 installs 0.25.12 and Vite 7.3.6 installs 0.28.1. |

The prior Vite-specific advisories GHSA-356w-63v5-8wf4, GHSA-g4jq-h2w9-997c, and GHSA-93m4-6634-74q7 are already fixed in Vite 5.4.21. They do not explain the current finding set.

## Exposure audit

- `vite.config.js` only declares the React plugin. No `server.host`, `server.fs`, `server.proxy`, `server.cors`, `allowedHosts`, HMR, or preview override is present.
- No repository evidence was found for `--host`, `0.0.0.0`, LAN/Tailscale binding, tunnel use, or Vite dev server as a production service.
- Development documentation references loopback URLs; the audit smoke tests explicitly used `127.0.0.1`.
- Production is a Vercel static build path (`vite build` output), not `vite dev` or `vite preview`.
- Current execution environment is macOS. Windows support is `not_evidenced`; therefore Windows-only findings are not proven reachable, not declared harmless.
- Overall: `applicable_condition_not_evidenced`; local-only mitigation is to keep dev/preview servers loopback-only. This does not replace the dependency upgrade because future `--host` use would restore reachability.

## Version and candidate evaluation

npm registry metadata on 2026-08-01 reported Vite 5 latest `5.4.21`, Vite 6 latest `6.4.3`, Vite 7 latest `7.3.6`, and Vite 8 latest `8.2.0`. Node 22.20.0 satisfies all tested candidate engines. The original candidates used the lockfile-resolved `@vitejs/plugin-react@4.7.0`; a follow-up exact-minimum snapshot also verified `vite@6.4.3 + @vitejs/plugin-react@4.3.4` with peer resolution, build, and loopback smoke. Vite 8 requires a plugin-react 6-era peer path and was not selected because it is a larger migration.

| Candidate | Install/peer | Vite findings | Other findings | Bundler/patch | Tests/build/smoke | Decision |
|---|---|---:|---:|---|---|---|
| A: Vite 6.4.3 | pass with plugin-react 4.7.0; exact 4.3.4 follow-up also pass | 0 | 3 groups: Babel low, PostCSS high, ws high | Rollup 4.60.2; patch pass twice, idempotent | 4.7.0 snapshot: properties 3/3; build and loopback pass. Exact 4.3.4 snapshot: build and loopback pass. Full tests 281/302 in tracked-only snapshots because DE405/native artifacts are absent; artifact test blocked for same reason. | Minimum safe candidate and recommendation |
| C: Vite 7.3.6 | pass; plugin-react 4.7.0 compatible | 0 | same 3 groups | Rollup 4.60.2; patch pass twice, idempotent | properties 3/3; build pass; loopback pass. Full tests 281/302 and artifact test blocked by absent untracked DE405/native artifacts. | Viable longer-term reference, not minimum change |

Candidate B was omitted because Vite 6.4.3 is already the latest stable Vite 6 release. Vite 8.2.0 was not installed: it is a larger Rolldown migration and would require retiring/reworking the Rollup-native fallback assumption and moving to a newer plugin-react peer path.

## Minimum safe path

No published Vite 5 version removes all current Vite findings: Vite 5.4.21 remains below the 6.4.3 fixes for the current advisory set. The smallest validated safe major is therefore Vite `6.4.3`.

Recommended follow-up implementation scope:

1. Update the direct Vite devDependency and lockfile to exact `6.4.3` in a separate work order.
2. Keep `@vitejs/plugin-react` on the existing declared `^4.3.4` line; no plugin-react package.json change is required. Both the lockfile-resolved 4.7.0 and exact 4.3.4 were validated with Vite 6.4.3.
3. Keep the Rollup fallback package and postinstall patch for Vite 6; candidate testing showed the Rollup native file and patch contract remain present and idempotent.
4. Re-run the root test suite with the existing untracked DE405/native artifacts present, then run OSV/npm audit and loopback smoke.

Expected root dependency changes are limited to `package.json` and `package-lock.json`. No Vite config, production code, or test-code change is indicated by this audit.

## Validation record

Root baseline: `npm run audit:security` failed only because the first sandbox run could not resolve `api.osv.dev`; the escalated re-run completed with OSV status 1 for 5 total package groups, including 3 Vite-linked groups. `npm audit --json` completed with status 1 and 5 total groups: 1 low, 1 moderate, 3 high. Dependency-cruiser exited 0 with existing informational orphan reports; Knip exited 0 with existing unused/import/export reports; property tests passed 3; default tests passed 302; DE405 artifact tests passed 25; root build passed; root `diff --check` is required after this document is added.

Candidate installs used `--ignore-scripts`; manual patch execution was run twice per candidate. Candidate OSV/npm audits had zero Vite findings and retained the same three non-Vite groups. No `npm audit fix`, force, legacy-peer-deps, override, or root install was used.

## Scope and preservation

Only `docs/development/vite-security-audit.md` is an intended root change. `package.json`, `package-lock.json`, `vite.config.js`, `scripts/patch-rollup-native.mjs`, production code, tests, root `node_modules`, and the pre-existing DE405/native untracked artifacts were not modified. No stage, commit, push, deploy, branch change, or remote database action was performed.

### Sources

- OSV and npm audit JSON captured locally on 2026-08-01 in `/tmp/softie-vite-osv-current.json` and `/tmp/softie-vite-npm-audit.json`.
- Official GitHub/Vite advisories linked in the table above.
- npm registry metadata queried on 2026-08-01 for Vite 5–8 releases, engines, and plugin-react peer ranges.
