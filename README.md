<div align="center">

# code-search-replace

**Multi-file find & replace with regex, diff preview, and undo — zero dependencies**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/code-search-replace "pattern" "replacement" "**/*.js"
```

Or install globally for the `csr` shorthand:

```bash
npm install -g github:NickCirv/code-search-replace
```

## Usage

```bash
csr <pattern> <replacement> [glob]        # search & replace
csr --find <pattern> [glob]               # search only
csr --interactive <pattern> <rep> [glob]  # review file-by-file
csr undo                                  # undo last session
csr history                               # show replacement history
```

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

## What it does

Recursively scans your working directory (or a glob-targeted subset), shows a colour diff of every proposed change, and asks for confirmation before writing. Originals are backed up to `~/.csr-backups/` before each write so `csr undo` can restore the last session. Regex is auto-detected from the pattern, capture groups (`$1`, `$2`) work in the replacement string, and binary files are skipped automatically.

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
