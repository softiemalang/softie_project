# Codex Desktop Remote SSH workflow

`tools/codex-remote-workflow.mjs` is the Mac-side, fail-closed bridge for the
local `softie_project` checkout and the Galaxy Tab Remote SSH checkout.

The Mac checkout remains the source of truth. The bridge reuses the active
`development-console` snapshot boundary: `.git`, generated directories,
credentials, `.env*`, SSH material, symlinks, binary files, and oversized files
are excluded or rejected. It never reads or changes the tab-worker credential
directory or operating-state directory.

The bridge is a Mac coordinator interface, not a general SSH proxy. Its only
public operations are `metadata`, `refresh`, `setup`, `status`, `verify`, and
`apply`; the package scripts are the supported names. The entrypoint is
Mac-only, fixes the source, target, private state directory, SSH alias, and
metadata destination, and rejects path/host/state/boundary overrides. A Tab
Codex may work inside the local target checkout, but must not open a Mac shell
or use `ssh`, `scp`, `sftp`, arbitrary remote commands, Mac absolute paths,
credentials, or operating state.

## Repeatable cycle

Run these commands from the Mac checkout (or from a Codex Desktop Remote SSH
terminal attached to the Mac):

```text
npm run remote:metadata
npm run remote:refresh
npm run remote:setup
# Use npm run remote:status for a read-only phase/guard check when needed.
# Work on the Galaxy Tab checkout and make local commits there.
npm run remote:verify
npm run remote:apply -- --dry-run
npm run remote:apply
```

`refresh` captures the current Mac working tree under the existing snapshot
exclusion boundary, transfers it through the `tab-worker` SSH alias, performs a
tar round-trip check, and atomically installs a clean local-Git baseline at
`/data/data/com.termux/files/home/codex-remote-development/softie_project`.
The target has no Git remote. Its prior clean baseline is retained in a
recoverable quarantine directory on the same parent filesystem.

`setup` runs only on the Galaxy Tab and installs the project dependencies.
`verify` requires committed target changes on top of the recorded baseline,
then runs `npm run test:source-local`, `npm run build`, and a loopback Vite
dev-server smoke check. It archives only the verified target delta and records
hashes, modes, paths, and the validation result in the private Mac workflow
state at:

```text
/Users/hangyukim/.local/share/tab-worker-mac/remote-development/softie_project
```

`apply --dry-run` repeats the remote attestation and Mac conflict checks. The
real `apply` writes only the verified changed paths, never stages or commits on
the Mac, and preserves unrelated dirty/untracked paths. It aborts without
writing if the Mac HEAD, branch, index, working-tree snapshot, or any affected
base path changed. It also aborts if the target is dirty, has a remote, its
baseline/attestation differs, or a protected path appears. A crash during
apply leaves an `applying`/`apply_recovery_required` record rather than guessing
or overwriting state.

`metadata` writes the sanitized manifest to the fixed parent-level target path
`/data/data/com.termux/files/home/codex-remote-development/mac-softie-candidates.manifest.json`.
Each item contains only a repository-relative path, existence, Git
classification, mode, size, hash when safe, and snapshot-exclusion reason. It
contains no Mac absolute path, file content, credential, or operating-state
data. The Mac workflow state records only the source fingerprint, manifest
hash, scope, and delivery time; it does not store the manifest contents.
`refresh` requires that admission to match the current source fingerprint.
The portable snapshot allowlist is an exact reviewed set; it does not make the
general exclusion boundary mutable from the Tab.

The default verification profile intentionally does not run the repository's
full historical `npm test` profile. That profile depends on excluded evidence
assets and Mac Git history that are not part of the safe independent target
baseline; those checks remain separately reportable and are not silently
replaced by synthetic inputs.

Use `npm run remote:status` to inspect the recorded phase, Mac guard, target
HEAD, and verification attestation without modifying either checkout.
