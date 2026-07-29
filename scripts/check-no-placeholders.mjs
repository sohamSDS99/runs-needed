#!/usr/bin/env node
/**
 * Hard gate: no TBD, TODO, FIXME, XXX, "to be determined", or lorem-ipsum
 * placeholder text anywhere in the specification documents.
 *
 * Code spans are stripped before scanning, because several acceptance criteria
 * legitimately *assert against* those words inside a shell command, and a
 * naive grep would flag the guard as the defect it exists to prevent.
 *
 * The three proposed product names in PRD.md are the only sanctioned
 * open decision, and they are named rather than marked, so nothing is exempted.
 *
 * Usage: node scripts/check-no-placeholders.mjs
 */
import { readFileSync } from 'node:fs';

const FILES = [
  'PRD.md',
  'STATS_SPEC.md',
  'TEST_FIXTURES.md',
  'CLAUDE_CODE_TASKS.md',
  'ITERATION_LOG.md',
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
];

const BANNED = /\b(TBD|TODO|FIXME|XXX|lorem ipsum|to be determined|coming soon|fill this in)\b/gi;

let failures = 0;

for (const file of FILES) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`MISSING  ${file}`);
    failures += 1;
    continue;
  }

  // Strip fenced blocks and inline code, preserving line numbering.
  const stripped = text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));

  const lines = stripped.split('\n');
  lines.forEach((line, i) => {
    for (const hit of line.matchAll(BANNED)) {
      console.error(`${file}:${i + 1}  ${hit[0]}`);
      failures += 1;
    }
  });
}

if (failures > 0) {
  console.error(`\nFAIL - ${failures} placeholder marker(s) found in prose`);
  process.exit(1);
}
console.log(`PASS - ${FILES.length} documents scanned, no placeholder markers in prose`);
