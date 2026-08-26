#!/usr/bin/env node
// Runs every suite in this directory. `node tests/run-all.js`
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const suites = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'run-all.js')
  .sort();

let failed = 0;
for (const suite of suites) {
  process.stdout.write('  ' + suite.replace('.js', '').padEnd(10));
  try {
    execFileSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'pipe' });
    console.log('pass');
  } catch (err) {
    failed++;
    console.log('FAIL');
    console.log('    ' + String(err.stderr || err).split('\n').filter(l => l.includes('FAIL:') || l.includes('Error')).slice(0, 2).join('\n    '));
  }
}
console.log(failed ? `\n${failed} suite(s) failed` : `\nall ${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
