#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SOURCES = [
  {
    dir: path.join(__dirname, '../src/components'),
    testsDir: path.join(__dirname, '../tests/accessibility/components'),
    skipDirs: [],
    label: 'components',
  },
  {
    dir: path.join(__dirname, '../src/screens'),
    testsDir: path.join(__dirname, '../tests/accessibility/screens'),
    skipDirs: [],
    label: 'screen',
  },
];

function collectTsxFiles(dir, skipDirs) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) continue;
      results.push(...collectTsxFiles(path.join(dir, entry.name), skipDirs));
    } else if (entry.name.endsWith('.tsx')) {
      results.push({
        name: path.basename(entry.name, '.tsx'),
        fullPath: path.join(dir, entry.name),
      });
    }
  }
  return results;
}

let totalCount = 0;
const missing = [];

for (const source of SOURCES) {
  const files = collectTsxFiles(source.dir, source.skipDirs);
  totalCount += files.length;
  const subfolder = source.label === 'screen' ? 'screens' : 'components';
  for (const file of files) {
    const expectedTest = path.join(source.testsDir, `${file.name}.test.tsx`);
    if (!fs.existsSync(expectedTest)) {
      missing.push(
        `  MISSING [${source.label}]: tests/accessibility/${subfolder}/${file.name}.test.tsx  (source: ${path.relative(path.join(__dirname, '..'), file.fullPath)})`,
      );
    }
  }
}

if (missing.length > 0) {
  console.error(
    `\nAccessibility coverage FAILED. ${missing.length} file(s) without accessibility tests:\n`,
  );
  missing.forEach((m) => console.error(m));
  console.error('\nAdd the missing files and run again.\n');
  process.exit(1);
}

console.log(
  `Accessibility coverage OK. The ${totalCount} components and screens have their accessibility tests.`,
);
