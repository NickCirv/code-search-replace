# code-search-replace — implementation reference

Source revision: `bd9a537f07bf1a7449f08a222d0b7bd4c9d89770`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/package.json) declares `index.js`. Node.js `>=20` and npm.

Executable mapping: `code-search-replace` → `./index.js`, `csr` → `./index.js`.

## Supported workflow

Literal/regex search; case and word controls; interactive review; dry-run diffs; local history and undo.

Replacement and undo commands write files. Regex and glob handling use the tool's own parsers; preview the exact match set and keep version-control backups.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

| Flag | Description |
|------|-------------|
| `--regex` | Treat pattern as regex (auto-detected from meta-chars) |
| `-i`, `--ignore-case` | Case-insensitive matching |
| `-w`, `--word` | Whole-word matching only |
| `--dry-run` | Show diff, exit without writing |
| `-y`, `--yes` | Apply without confirmation prompt |
| `--interactive` | Review and approve each file individually |
| `--find` | Search-only mode — print matches with context |
| `--context N` | Lines of context around matches (default: 2) |
| `--format json` | Output as JSON for programmatic use |

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/code-search-replace/blob/bd9a537f07bf1a7449f08a222d0b7bd4c9d89770/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
