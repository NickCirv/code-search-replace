# code-search-replace — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`bd9a537f07bf1a7449f08a222d0b7bd4c9d89770`](https://github.com/NickCirv/code-search-replace/commit/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770).
- Tree: `117868d0fd749a8e0990cc0b5dddd1639ece23cc`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/package.json) | Source declaration inspected; runtime unverified |
| Searches and replaces matching text across files with previews and local undo data. | [index.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/index.js) | Implementation interfaces inspected; behavior not executed |
| Literal/regex search; case and word controls; interactive review; dry-run diffs; local history and undo. | [index.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/index.js) | Source-backed scope, not a test result |
| Replacement and undo commands write files. Regex and glob handling use the tool's own parsers; preview the exact match set and keep version-control backups. | [index.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Replacement and undo commands write files. Regex and glob handling use the tool's own parsers; preview the exact match set and keep version-control backups.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/README.md) | `ea6914ae65b89bc22848f64fe8d1419857fa153356150970b7a3e348fb3aa2bd` | 2107 |
| [package.json](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/package.json) | `49d151b4e527b53adbe7ef65268adf1482eca9c310e6b8dbda5e071e738d108e` | 505 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/.github/workflows/ci.yml) | `e818f4e6bd805f798665dbbf04964d02f12fc59dd7f18903ad63d26d374ae3f0` | 380 |
| [index.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/index.js) | `917ddab624c121416ce32e4edfe92974fd1f93a92fe681aff69913379f54bafc` | 18790 |
| [test/smoke.test.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/test/smoke.test.js) | `31178f9e769b3cc662acbdb5a9984a51a26132adb2f1a6ecf1b6d94cc9470c1f` | 338 |
