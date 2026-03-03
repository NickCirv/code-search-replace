#!/usr/bin/env node
// code-search-replace (csr) — zero-dependency multi-file find and replace
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';
import os from 'os';

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  red:    s => `\x1b[31m${s}\x1b[0m`,
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  reset:  s => `\x1b[0m${s}\x1b[0m`,
};

const isTTY = process.stdout.isTTY;
const plain = s => s; // passthrough when colour unavailable
const col = k => isTTY ? C[k] : plain;

// ── Paths ─────────────────────────────────────────────────────────────────────
const BACKUP_DIR  = path.join(os.homedir(), '.csr-backups');
const HISTORY_FILE = path.join(os.homedir(), '.csr-history.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function readHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch { return []; }
}

function writeHistory(h) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function fileHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function backupFile(filePath, content) {
  ensureDir(BACKUP_DIR);
  const ts = Date.now();
  const hash = fileHash(content);
  const name = `${ts}-${hash}.bak`;
  const metaName = `${ts}-${hash}.meta.json`;
  fs.writeFileSync(path.join(BACKUP_DIR, name), content);
  fs.writeFileSync(path.join(BACKUP_DIR, metaName), JSON.stringify({ filePath, ts }));
  return name;
}

// ── Hand-rolled glob ──────────────────────────────────────────────────────────
function globToRegex(pattern) {
  // Split on glob special chars first, escape literals, then reassemble
  const parts = pattern.replace(/\\/g, '/').split(/(\*\*\/|\*\*|\*|\?)/);
  const regStr = parts.map((p, i) => {
    if (i % 2 === 0) {
      // literal segment — escape regex meta chars
      return p.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    // glob token
    switch (p) {
      case '**/': return '(?:.+/)?';
      case '**':  return '.*';
      case '*':   return '[^/]*';
      case '?':   return '[^/]';
      default:    return p;
    }
  }).join('');
  return new RegExp(`^${regStr}$`);
}

function walkDir(dir, files = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    // Skip hidden dirs and common noise
    if (e.isDirectory()) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      walkDir(full, files);
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function findFiles(globPattern, cwd = process.cwd()) {
  // Resolve symlinks so /tmp and /private/tmp match consistently on macOS
  const resolvedCwd = fs.realpathSync(cwd);
  if (!globPattern) return walkDir(resolvedCwd);
  const re = globToRegex(globPattern);
  return walkDir(resolvedCwd).filter(f => {
    const rel = path.relative(resolvedCwd, f).replace(/\\/g, '/');
    return re.test(rel);
  });
}

// ── Pattern building ──────────────────────────────────────────────────────────
function buildRegex(pattern, flags = {}) {
  const { regex: isRegex, ignoreCase, word } = flags;
  let src = isRegex ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (word) src = `\\b${src}\\b`;
  const f = 'g' + (ignoreCase ? 'i' : '');
  try { return new RegExp(src, f); }
  catch (e) {
    console.error(col('red')(`Invalid regex: ${e.message}`));
    process.exit(1);
  }
}

// ── Diff preview ──────────────────────────────────────────────────────────────
function diffLines(original, updated, filePath) {
  const oldLines = original.split('\n');
  const newLines = updated.split('\n');
  const out = [col('bold')(col('cyan')(filePath))];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let changes = 0;
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o !== n) {
      changes++;
      if (o !== undefined) out.push(col('red')(`- ${o}`));
      if (n !== undefined) out.push(col('green')(`+ ${n}`));
    }
  }
  return { output: out.join('\n'), changes };
}

// Highlight matches within a line
function highlightMatch(line, re) {
  return line.replace(re, m => col('yellow')(`[${m}]`));
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
function prompt(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, ans => { rl.close(); resolve(ans.trim().toLowerCase()); });
  });
}

// ── Core: apply replacements to a single file ─────────────────────────────────
function applyToFile(filePath, re, replacement) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch { return null; } // binary or unreadable

  // Skip files with null bytes (binary)
  if (content.includes('\0')) return null;

  const updated = content.replace(re, replacement);
  if (updated === content) return null; // no change

  return { original: content, updated };
}

// ── Subcommand: search & replace ──────────────────────────────────────────────
async function runReplace(args) {
  const {
    pattern, replacement, globPattern,
    dryRun, yes, preview, interactive,
    regex: isRegex, ignoreCase, word,
    format
  } = args;

  const re = buildRegex(pattern, { regex: isRegex, ignoreCase, word });
  const files = findFiles(globPattern);

  if (files.length === 0) {
    console.log(col('yellow')('No files matched.'));
    return;
  }

  // Collect changes
  const changes = [];
  for (const f of files) {
    const result = applyToFile(f, re, replacement);
    if (result) changes.push({ file: f, ...result });
  }

  if (changes.length === 0) {
    console.log(col('dim')('No matches found.'));
    return;
  }

  const totalMatches = changes.reduce((n, c) => {
    const m = c.original.match(re);
    return n + (m ? m.length : 0);
  }, 0);

  // JSON output
  if (format === 'json') {
    const out = changes.map(c => ({
      file: c.file,
      matchCount: (c.original.match(re) || []).length,
      preview: c.updated.slice(0, 200),
    }));
    console.log(JSON.stringify({ files: out.length, matches: totalMatches }, null, 2));
    if (dryRun) return;
  }

  // Dry-run: just report
  if (dryRun) {
    for (const c of changes) {
      const { output } = diffLines(c.original, c.updated, c.file);
      console.log(output);
    }
    console.log(col('bold')(`\nDry run — ${changes.length} file(s), ${totalMatches} match(es). No changes written.`));
    return;
  }

  // Interactive mode: review file by file
  if (interactive) {
    let applied = 0;
    for (const c of changes) {
      const { output } = diffLines(c.original, c.updated, c.file);
      console.log('\n' + output);
      const ans = await prompt(col('cyan')('Apply this file? [y]es / [s]kip / [q]uit: '));
      if (ans === 'q' || ans === 'quit') { console.log('Aborted.'); break; }
      if (ans === 'y' || ans === 'yes' || ans === '') {
        const bak = backupFile(c.file, c.original);
        fs.writeFileSync(c.file, c.updated);
        recordHistory({ pattern, replacement, file: c.file, bak });
        applied++;
        console.log(col('green')(`  Saved.`));
      } else {
        console.log(col('dim')('  Skipped.'));
      }
    }
    console.log(col('bold')(`\nDone — ${applied}/${changes.length} file(s) updated.`));
    return;
  }

  // Preview (default) or --yes
  if (!yes) {
    for (const c of changes) {
      const { output } = diffLines(c.original, c.updated, c.file);
      console.log('\n' + output);
    }
    console.log(col('bold')(`\n${changes.length} file(s), ${totalMatches} match(es) will be updated.`));
    const ans = await prompt(col('cyan')('Apply? [y/N]: '));
    if (ans !== 'y' && ans !== 'yes') { console.log('Aborted.'); return; }
  }

  // Write
  let written = 0;
  const sessionBackups = [];
  for (const c of changes) {
    const bak = backupFile(c.file, c.original);
    sessionBackups.push({ file: c.file, bak });
    fs.writeFileSync(c.file, c.updated);
    written++;
  }
  recordHistory({ pattern, replacement, files: sessionBackups, ts: Date.now() });
  console.log(col('green')(`\n${written} file(s) updated, ${totalMatches} replacement(s) made.`));
}

// ── Subcommand: find only ─────────────────────────────────────────────────────
function runFind(args) {
  const { pattern, globPattern, regex: isRegex, ignoreCase, word, context: ctxLines = 2 } = args;
  const re = buildRegex(pattern, { regex: isRegex, ignoreCase, word });
  const files = findFiles(globPattern);

  let totalMatches = 0;
  let filesWithMatches = 0;

  for (const f of files) {
    let content;
    try { content = fs.readFileSync(f, 'utf8'); }
    catch { continue; }
    if (content.includes('\0')) continue;

    const lines = content.split('\n');
    const matchLines = [];
    lines.forEach((line, i) => {
      if (re.test(line)) matchLines.push(i);
      re.lastIndex = 0;
    });

    if (matchLines.length === 0) continue;

    filesWithMatches++;
    console.log(col('bold')(col('cyan')(f)));

    const shown = new Set();
    for (const li of matchLines) {
      totalMatches++;
      const start = Math.max(0, li - ctxLines);
      const end = Math.min(lines.length - 1, li + ctxLines);
      for (let i = start; i <= end; i++) {
        if (!shown.has(i)) {
          shown.add(i);
          const prefix = col('dim')(`${String(i + 1).padStart(4)}: `);
          const lineOut = i === li ? highlightMatch(lines[i], re) : col('dim')(lines[i]);
          console.log(prefix + lineOut);
          re.lastIndex = 0;
        }
      }
    }
    console.log('');
  }

  console.log(col('bold')(`${totalMatches} match(es) in ${filesWithMatches} file(s).`));
}

// ── History ───────────────────────────────────────────────────────────────────
function recordHistory(entry) {
  const h = readHistory();
  h.push({ ...entry, ts: entry.ts || Date.now() });
  if (h.length > 50) h.splice(0, h.length - 50);
  writeHistory(h);
}

function runHistory() {
  const h = readHistory();
  if (h.length === 0) { console.log(col('dim')('No history.')); return; }
  h.slice().reverse().forEach((e, i) => {
    const d = new Date(e.ts).toLocaleString();
    const files = e.files ? e.files.map(f => f.file) : [e.file];
    console.log(col('bold')(`[${h.length - i}] ${d}`));
    console.log(`  pattern:     ${col('yellow')(e.pattern)}`);
    console.log(`  replacement: ${col('green')(e.replacement)}`);
    console.log(`  files:       ${files.join(', ')}`);
  });
}

// ── Undo ──────────────────────────────────────────────────────────────────────
function runUndo() {
  const h = readHistory();
  if (h.length === 0) { console.log(col('dim')('Nothing to undo.')); return; }
  const last = h[h.length - 1];
  const entries = last.files || [{ file: last.file, bak: last.bak }];
  let restored = 0;
  for (const { file, bak } of entries) {
    const bakPath = path.join(BACKUP_DIR, bak);
    if (!fs.existsSync(bakPath)) {
      console.warn(col('yellow')(`  Backup not found: ${bak}`));
      continue;
    }
    const original = fs.readFileSync(bakPath, 'utf8');
    fs.writeFileSync(file, original);
    console.log(col('green')(`  Restored: ${file}`));
    restored++;
  }
  h.pop();
  writeHistory(h);
  console.log(col('bold')(`Undo complete — ${restored} file(s) restored.`));
}

// ── Arg parser ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    subcommand: null,
    pattern: null,
    replacement: null,
    globPattern: null,
    regex: false,
    ignoreCase: false,
    word: false,
    preview: true,
    dryRun: false,
    yes: false,
    interactive: false,
    find: false,
    format: null,
    context: 2,
  };

  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--regex':     args.regex = true; break;
      case '-i': case '--ignore-case': args.ignoreCase = true; break;
      case '-w': case '--word': args.word = true; break;
      case '--dry-run':   args.dryRun = true; break;
      case '-y': case '--yes': args.yes = true; break;
      case '--interactive': args.interactive = true; break;
      case '--format':    args.format = argv[++i]; break;
      case '--context':   args.context = parseInt(argv[++i], 10) || 2; break;
      case '--find':      args.find = true; break;
      case 'undo':        args.subcommand = 'undo'; break;
      case 'history':     args.subcommand = 'history'; break;
      case '--help': case '-h': args.subcommand = 'help'; break;
      case '--version': case '-v': args.subcommand = 'version'; break;
      default:
        if (!a.startsWith('-')) positional.push(a);
    }
  }

  if (!args.subcommand) {
    if (args.find) {
      args.subcommand = 'find';
      [args.pattern, args.globPattern] = positional;
    } else if (args.interactive && positional.length === 0) {
      args.subcommand = 'interactive-noop';
    } else {
      args.subcommand = 'replace';
      [args.pattern, args.replacement, args.globPattern] = positional;
    }
  }

  return args;
}

// ── Help ──────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
${col('bold')('code-search-replace')} (csr) — zero-dependency multi-file find and replace

${col('bold')('USAGE')}
  csr <pattern> <replacement> [glob]   Search and replace
  csr --find <pattern> [glob]          Search only (no replace)
  csr --interactive <pat> <rep> [glob] Review file-by-file
  csr undo                             Undo last replacement
  csr history                          Show replacement history

${col('bold')('OPTIONS')}
  --regex           Treat pattern as regex (auto-detected when / chars used)
  -i, --ignore-case Case-insensitive matching
  -w, --word        Whole-word matching only
  --dry-run         Show diff, exit without writing
  -y, --yes         Apply without confirmation prompt
  --preview         Show diff before applying (default: on)
  --interactive     Review and approve each file individually
  --find            Search only mode — print matches with context
  --context N       Lines of context around matches (default: 2)
  --format json     Output as JSON (for programmatic use)
  -h, --help        Show this help
  -v, --version     Show version

${col('bold')('EXAMPLES')}
  csr "oldFunc" "newFunc"                      # all files
  csr "oldFunc" "newFunc" "src/**/*.js"        # JS files under src/
  csr "(\\w+)\\.js" "$1.ts" "**/*.js"          # rename extensions
  csr --find "TODO" "**/*.ts"                  # find TODOs in TypeScript
  csr "error" "err" --ignore-case --dry-run    # preview, case-insensitive
  csr --interactive "foo" "bar" "lib/**/*.js"  # interactive file-by-file

${col('bold')('BACKUPS')}
  Originals saved to ~/.csr-backups/ before each write.
  Use ${col('cyan')('csr undo')} to restore the last session.
`);
}

// ── Auto-detect regex ─────────────────────────────────────────────────────────
function autoDetectRegex(pattern) {
  // If the pattern contains regex meta-chars (excluding simple dots), treat as regex
  return /[\\^$*+?{}[\]|()]/.test(pattern);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  // Auto-detect regex from pattern
  if (args.pattern && !args.regex) {
    args.regex = autoDetectRegex(args.pattern);
  }

  switch (args.subcommand) {
    case 'help':
      showHelp();
      break;

    case 'version':
      console.log('1.0.0');
      break;

    case 'undo':
      runUndo();
      break;

    case 'history':
      runHistory();
      break;

    case 'find':
      if (!args.pattern) {
        console.error(col('red')('Error: --find requires a pattern'));
        process.exit(1);
      }
      runFind(args);
      break;

    case 'replace':
      if (!args.pattern) {
        showHelp();
        break;
      }
      if (args.replacement === undefined || args.replacement === null) {
        console.error(col('red')('Error: replacement argument required'));
        process.exit(1);
      }
      await runReplace(args);
      break;

    default:
      showHelp();
  }
}

main().catch(e => {
  console.error(col('red')(`Fatal: ${e.message}`));
  process.exit(1);
});
