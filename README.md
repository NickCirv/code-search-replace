# code-search-replace

> Powerful multi-file find and replace with regex, preview, and undo — better than sed for code refactoring.

Zero external dependencies. Pure Node.js ES modules. Node 18+.

## Install

```bash
npm install -g code-search-replace
```

Or run directly:

```bash
npx code-search-replace "pattern" "replacement" "**/*.js"
```

Both `csr` and `code-search-replace` are registered as CLI commands.

## Usage

```
csr <pattern> <replacement> [glob]   Search and replace
csr --find <pattern> [glob]          Search only (no replace)
csr --interactive <pat> <rep> [glob] Review file-by-file
csr undo                             Undo last replacement
csr history                          Show replacement history
```

## Options

| Flag | Description |
|------|-------------|
| `--regex` | Treat pattern as regex (auto-detected from pattern content) |
| `-i`, `--ignore-case` | Case-insensitive matching |
| `-w`, `--word` | Whole-word matching only |
| `--dry-run` | Show diff, exit without writing |
| `-y`, `--yes` | Apply without confirmation prompt |
| `--interactive` | Review and approve each file individually |
| `--find` | Search only — print matches with context lines |
| `--context N` | Lines of context around matches (default: 2) |
| `--format json` | Output as JSON for programmatic use |

## Examples

### Basic replacement (all files)
```bash
csr "oldFunc" "newFunc"
```

### Target specific files with glob
```bash
csr "oldFunc" "newFunc" "src/**/*.js"
```

### Rename file extensions using capture groups
```bash
csr "(\w+)\.js" "$1.ts" "**/*.js"
```

### Case-insensitive, dry run preview
```bash
csr "error" "err" --ignore-case --dry-run
```

### Search only — find TODOs in TypeScript files
```bash
csr --find "TODO" "**/*.ts"
```

### Interactive — review each file before applying
```bash
csr --interactive "foo" "bar" "lib/**/*.js"
```

### Apply without confirmation
```bash
csr "console.log" "logger.debug" "src/**/*.ts" --yes
```

### Undo last session
```bash
csr undo
```

### View history
```bash
csr history
```

### JSON output for scripting
```bash
csr "foo" "bar" "**/*.js" --dry-run --format json
```

## How it works

- **Glob**: hand-rolled recursive scanner — converts `**/*.js` to a regex and walks the directory tree, skipping `node_modules` and hidden directories.
- **Preview**: diff-style output per file with `-old` (red) and `+new` (green) lines before any write.
- **Backups**: original file content is saved to `~/.csr-backups/<timestamp>-<hash>.bak` before each write.
- **History**: last 50 sessions stored in `~/.csr-history.json`.
- **Undo**: reads the most recent backup set and restores each file.
- **Regex**: auto-detected when the pattern contains regex meta-characters (`\`, `^`, `$`, `*`, `+`, `?`, `{`, `}`, `[`, `]`, `|`, `(`, `)`). Override with `--regex`.
- **Capture groups**: standard JS replace — `$1`, `$2`, etc. work in the replacement string.

## Safety

- Binary files (containing null bytes) are automatically skipped.
- `--dry-run` never writes anything.
- Default `--preview` mode always shows a diff and asks for confirmation before writing.
- Backups are kept indefinitely in `~/.csr-backups/`.

## License

MIT
