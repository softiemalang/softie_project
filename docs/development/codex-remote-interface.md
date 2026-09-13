# Codex Remote interface contract

The Mac checkout is the source of truth and the only remote-workflow
coordinator. The supported sequence is:

```text
remote:metadata -> remote:refresh -> remote:setup/status -> work
-> remote:verify -> remote:apply
```

The only public operations are the matching `npm run remote:*` scripts. The
Galaxy Tab worker may use the local project checkout for work, tests, builds,
and the dev server, but it is not granted Mac-wide SSH or shell access and
must not use `ssh`, `scp`, `sftp`, arbitrary remote commands, Mac absolute
paths, credentials, or operating state.

`remote:metadata` delivers only the sanitized repository-relative manifest.
`remote:refresh` creates an independent local-Git baseline. `remote:verify`
requires a committed target delta and successful source-local tests, build,
and dev-server checks. `remote:apply` accepts only the verified attestation;
source drift, dirty overlap, target drift, base mismatch, protected paths, and
conflicts fail closed.
