#!/usr/bin/env node
/* Screen candidate acronyms BEFORE writing expansions for them.
 *
 * Rule 1 of the recipe: verify the invented ones too. With words the danger is
 * that an invention turns out to be a real word. With acronyms it is worse —
 * almost every short letter string stands for *something*, so the question is
 * not "does this string exist" but "does the meaning I am about to invent
 * collide with a meaning it already has".
 *
 * So this prints, for each candidate, everything the reference list already
 * knows it stands for. Read them. If your intended expansion is one of them,
 * or close enough that a knowledgeable player would call it real, drop the
 * candidate. Anything the list does not know still needs a web check before it
 * earns an expansion — the list holds a few thousand acronyms, not all of them.
 *
 *   curl -sL -o acronyms-ref.csv \
 *     https://raw.githubusercontent.com/krishnakt031990/Crawl-Wiki-For-Acronyms/master/AcronymsFile.csv
 *   curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
 *   tr -d '\r' < words.txt > dict.txt
 *   node tools/screen.js --ref acronyms-ref.csv --dict dict.txt SNARK PLOD KESTREL
 *
 * With no candidates on the command line it screens every invented acronym
 * already in the bank, which is the check to run before a release.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const arg = name => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };
const flags = new Set(['--ref', '--dict']);
const positional = process.argv.slice(2).filter((a, i, all) =>
  !flags.has(a) && !flags.has(all[i - 1]) && !a.startsWith('--'));

const refPath = arg('--ref');
const ref = new Map();
if (refPath && fs.existsSync(refPath)) {
  fs.readFileSync(refPath, 'utf8').split('\n').forEach(line => {
    const at = line.indexOf(' - ');
    if (at === -1) return;
    const key = line.slice(0, at).trim().toLowerCase();
    const meaning = line.slice(at + 3).trim();
    if (!key || !meaning) return;
    if (!ref.has(key)) ref.set(key, []);
    ref.get(key).push(meaning);
  });
}

const dictPath = arg('--dict');
const dict = dictPath && fs.existsSync(dictPath)
  ? new Set(fs.readFileSync(dictPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean))
  : null;

let candidates = positional.map(s => s.toLowerCase());
if (!candidates.length) {
  const bank = new Function(fs.readFileSync(path.join(ROOT, 'acronyms.js'), 'utf8') +
    '; return {real: REAL_ACRONYMS, fake: FAKE_ACRONYMS};')();
  candidates = bank.fake.map(x => x.w);
  console.log(`screening the ${candidates.length} invented acronyms in the bank\n`);
}

if (!ref.size) console.log('(no --ref list loaded — only the word-shape check will run)\n');

let known = 0;
candidates.forEach(w => {
  const meanings = ref.get(w) || [];
  const shape = dict ? (dict.has(w) ? '  [spells an English word]' : '') : '';
  if (meanings.length) {
    known++;
    console.log(`${w.toUpperCase()}${shape}`);
    meanings.forEach(m => console.log('    already stands for: ' + m));
  } else {
    console.log(`${w.toUpperCase()}${shape}  — not in the reference list (still web-check it)`);
  }
});
console.log(`\n${known} of ${candidates.length} candidates already stand for something in the list`);
