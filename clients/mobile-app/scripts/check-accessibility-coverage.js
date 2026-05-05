#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const accessibilityTestsDir = path.join(__dirname, '../tests/accessibility');
const SKIP_DIRS = ['auth', 'booking'];

function collectComponents(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectComponents(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.tsx')) {
      results.push({
        name: path.basename(entry.name, '.tsx'),
        fullPath: path.join(dir, entry.name),
      });
    }
  }
  return results;
}

const components = collectComponents(componentsDir).filter((c) => {
  const rel = path.relative(componentsDir, c.fullPath);
  return !SKIP_DIRS.some((skip) => rel.startsWith(skip + path.sep));
});

const missing = components.filter(
  (c) => !fs.existsSync(path.join(accessibilityTestsDir, `${c.name}.test.tsx`)),
);

if (missing.length > 0) {
  console.error(
    `\nAccessibility coverage FAILED. ${missing.length} componente(s) sin test de accesibilidad:\n`,
  );
  missing.forEach((c) =>
    console.error(
      `  FALTA: tests/accessibility/${c.name}.test.tsx  (fuente: ${path.relative(path.join(__dirname, '..'), c.fullPath)})`,
    ),
  );
  console.error('\nAgrega los archivos faltantes y vuelve a ejecutar.\n');
  process.exit(1);
}

console.log(
  `Accessibility coverage OK. Los ${components.length} componentes tienen su test de accesibilidad.`,
);
