#!/usr/bin/env node
/* Screen a candidate acronym BEFORE writing a false expansion for it.
 *
 * Every acronym in this game is genuine; what gets invented is the expansion.
 * That makes rule 1 of the recipe — verify the invented ones too — a question
 * about meanings rather than strings: almost every short letter string stands
 * for several things, and if the expansion you are about to invent is one of
 * them, you have written a real entry into the fake array and a player who
 * knows it will be marked wrong for being right.
 *
 * So this prints, for each candidate, everything the reference list already
 * knows it stands for. Read them before you write anything. Drop the pairing if
 * your intended expansion is one of them, or close enough that a knowledgeable
 * player would call it real; an acronym meaning something else entirely is
 * exactly what you want. Anything the list does not know still needs a web
 * check — the list holds a few thousand acronyms, not all of them, and the
 * check that matters is "is this already what it stands for anywhere".
 *
 *   curl -sL -o acronyms-ref.csv \
 *     https://raw.githubusercontent.com/krishnakt031990/Crawl-Wiki-For-Acronyms/master/AcronymsFile.csv
 *   curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
 *   tr -d '\r' < words.txt > dict.txt
 *   node tools/screen.js --ref acronyms-ref.csv --dict dict.txt NASA GCHQ TACAMO
 *
 * With no candidates on the command line it screens every acronym in the fake
 * half of the bank, which is the check to run before a release.
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
