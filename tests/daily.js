// The daily puzzle: one deck a day, the same for everyone, first score kept,
// the streak, Past puzzles, the share text, and the URL each place has.
const { boot, bank, ok, hidden: isHidden } = require('./lib/harness');
const lvlOf = new Map([...bank.r, ...bank.k].map(x => [x.w, x.lvl]));
const REAL = new Set(bank.r.map(x => x.w));
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const daysAgo = n => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - n); };
const todayIso = isoOf(daysAgo(0));

// Plays whatever deck is on screen to the results, answering by the strategy given.
function play(els, strategy) {
  const dealt = [];
  for (let i = 0; i < 10; i++) {
    const w = els.acronym.textContent;
    dealt.push(w);
    els[strategy(REAL.has(w), i) ? 'btn-real' : 'btn-fake'].handlers.click();
    els['btn-next'].handlers.click();
  }
  return dealt;
}
const dealtWords = els => { const out = []; for (let i = 0; i < 10; i++) { out.push(els.acronym.textContent); els['btn-real'].handlers.click(); if (i < 9) els['btn-next'].handlers.click(); } return out; };

// ---------- the same seed gives the same deck ----------
{
  const a = boot({ search: '?daily=2026-03-04' }), b = boot({ search: '?daily=2026-03-04' });
  ok(!isHidden(a.els, 'game') && isHidden(a.els, 'start'), 'a linked day should open straight into its deck');
  ok(a.els['daily-text'].innerHTML === '<b>Daily No. 63</b> · ' + new Date(2026, 2, 4).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
     'the daily line should number the day of the year, got: ' + a.els['daily-text'].innerHTML);
  ok(a.location.url === '?daily=2026-03-04', 'the address should name the day, got ' + a.location.url);
  ok(!isHidden(a.els, 'go-past') && !isHidden(a.els, 'go-random') && isHidden(a.els, 'go-today'),
     'on a daily the links are Past puzzles and Random puzzles');
  const da = dealtWords(a.els), db = dealtWords(b.els);
  ok(da.join() === db.join(), 'the same day must deal the same ten in the same order:\n  ' + da + '\n  ' + db);
  ok(new Set(da).size === 10, 'ten distinct acronyms');
  const c = boot({ search: '?daily=2026-03-05' });
  ok(dealtWords(c.els).join() !== da.join(), 'a different day deals a different deck');
}

// ---------- the deck mixes the three levels, and the split still varies ----------
{
  const levels = new Set(), splits = new Set();
  for (let i = 1; i <= 20; i++) {
    const { els } = boot({ search: '?daily=2026-05-' + pad(i) });
    const dealt = dealtWords(els);
    dealt.forEach(w => levels.add(lvlOf.get(w)));
    splits.add(dealt.filter(w => REAL.has(w)).length);
  }
  ok(levels.size === 3, 'the daily should draw from all three levels, saw ' + [...levels]);
  ok(splits.size > 2, 'the real/fake split should still vary day to day, saw ' + [...splits]);
}

// ---------- no address at all is today's puzzle ----------
{
  const { els, location } = boot();
  ok(!isHidden(els, 'game'), 'the page should open on today\'s deck');
  ok(location.url === '?daily=' + todayIso, 'today\'s address should carry the date, got ' + location.url);
  const viaDate = boot({ search: '?daily=' + todayIso });
  ok(dealtWords(els).join() === dealtWords(viaDate.els).join(), 'the plain page and ?daily=<today> are the same deck');
}

// ---------- finishing today saves a record; the first score is the one kept ----------
{
  const store = {};
  let { els } = boot({ store });
  const dealt = play(els, isReal => isReal);          // a perfect ten
  ok(!isHidden(els, 'results'), 'the deck ends on the results');
  ok(els.final.textContent === 10, 'score shown, got ' + els.final.textContent);
  const rec = JSON.parse(store['acronumbskull:daily:' + todayIso]);
  ok(rec.score === 10 && rec.max === 10, 'the record should hold score and max: ' + JSON.stringify(rec));
  ok(rec.results.length === 10 && rec.results.every(r => r === 1), 'results are one number per card');
  ok(rec.recap.length === 10 && rec.recap.every((r, i) => r[0] === dealt[i] && r[1] === 1), 'the recap holds the words with right/wrong');
  ok(typeof rec.at === 'number', 'the record is stamped');
  ok(els.saved.textContent === 'Saved as your score for today.', 'first finish says saved, got: ' + els.saved.textContent);
  ok(els.saved.classList.contains('good') && !isHidden(els, 'saved'), 'the saved line is shown as good news');
  ok(isHidden(els, 'streak'), 'one day is not a streak');
  ok(els.rank.textContent === 'Acronymist', 'the game keeps its own rank line');
  ok(els.split.textContent.startsWith('This deck held '), 'the daily split names no level, got: ' + els.split.textContent);
  ok(!isHidden(els, 'btn-again') && isHidden(els, 'btn-today'), 'a daily result offers Play it again');
  ok(els['btn-random'].textContent === 'Play random puzzles', 'and Play random puzzles');
  ok(isHidden(els, 'best-line-2'), 'a daily result does not show the random bests');
  ok(store['acronumbskull:bests'] === undefined, 'a daily score must not touch the Random bests');

  // play it again, badly: the shown score is the replay's, the record is untouched
  els['btn-again'].handlers.click();
  ok(!isHidden(els, 'game'), 'Play it again deals the same day again');
  const again = play(els, isReal => !isReal);
  ok(again.join() === dealt.join(), 'the replay is the same deck');
  ok(els.final.textContent === 0, 'the replay shows its own score');
  ok(JSON.parse(store['acronumbskull:daily:' + todayIso]).score === 10, 'the first score is the one kept');
  ok(els.saved.textContent === 'Your first score for this puzzle is the one that is kept.', 'the replay says so, got: ' + els.saved.textContent);
  ok(!els.saved.classList.contains('good'), 'and not as good news');

  // a reload lands on the results, showing the kept score
  ({ els } = boot({ store }));
  ok(!isHidden(els, 'results') && isHidden(els, 'game'), 'a played day reopens on its results');
  ok(els.final.textContent === 10, 'with the kept score, got ' + els.final.textContent);
  ok(els.recap.innerHTML.split('<li>').length - 1 === 10, 'the recap is rebuilt from the record');
  ok(els.recap.innerHTML.includes(dealt[0]), 'with the words that were dealt');
  ok(els.saved.textContent === 'Your first score for this puzzle is the one that is kept.', 'reopened results name the rule');
  ok(els['daily-text'].innerHTML.startsWith('<b>Daily No. '), 'the daily line is set on reopened results');
}

// ---------- the streak ----------
{
  const rec = { score: 5, max: 10, results: [1,0,1,0,1,0,1,0,1,0], recap: [], at: 1 };
  let store = {
    ['acronumbskull:daily:' + isoOf(daysAgo(1))]: JSON.stringify(rec),
    ['acronumbskull:daily:' + isoOf(daysAgo(2))]: JSON.stringify(rec)
  };
  let { els } = boot({ store });
  ok(!isHidden(els, 'game'), 'a streak ending yesterday still opens today\'s deck');
  play(els, isReal => isReal);
  ok(els.streak.textContent === '3 days in a row' && !isHidden(els, 'streak'), 'today joins the two days before: ' + els.streak.textContent);

  // a gap breaks it
  store = { ['acronumbskull:daily:' + isoOf(daysAgo(2))]: JSON.stringify(rec) };
  ({ els } = boot({ store }));
  play(els, isReal => isReal);
  ok(isHidden(els, 'streak'), 'a day missed means no streak line, got: ' + els.streak.textContent);

  // a past day played late is not a run
  store = { ['acronumbskull:daily:' + isoOf(daysAgo(1))]: JSON.stringify(rec) };
  ({ els } = boot({ store, search: '?daily=' + isoOf(daysAgo(2)) }));
  play(els, isReal => isReal);
  ok(isHidden(els, 'streak'), 'a past day shows no streak');
  ok(els.saved.textContent === 'Saved as your score for this day.', 'a past day saves "this day", got: ' + els.saved.textContent);
}

// ---------- Past puzzles ----------
{
  const store = { ['acronumbskull:daily:' + isoOf(daysAgo(3))]: JSON.stringify({ score: 7, max: 10, results: [], recap: [], at: 1 }) };
  const { els, location } = boot({ store, search: '?past' });
  ok(!isHidden(els, 'past') && isHidden(els, 'game'), '?past opens the list');
  ok(location.url === '?past', 'and keeps that address');
  ok(els['daily-text'].innerHTML === '<b>Past puzzles</b> · the previous 100 days', 'the line says what the list is');
  ok(!isHidden(els, 'go-today') && !isHidden(els, 'go-random') && isHidden(els, 'go-past'), 'with links to today and random');
  const rows = els['past-list'].innerHTML.split('<li>').slice(1);
  ok(rows.length === 101, 'today plus the previous 100 days, got ' + rows.length);
  ok(rows[0].includes('class="today"') && rows[0].includes('>Today, '), 'today is marked');
  ok(rows[0].includes('>Not played<'), 'an unplayed day says so');
  ok(rows[3].includes('class="s done">7 / 10<'), 'a played day shows its kept score: ' + rows[3]);
  ok(rows[0].includes('data-daily="' + todayIso + '"'), 'each row names its day');
  // tapping a day opens it: the played one on its results, an unplayed one on its deck
  const tap = iso => els['past-list'].handlers.click({ target: { closest: () => ({ getAttribute: () => iso }) }, preventDefault() {} });
  tap(isoOf(daysAgo(3)));
  ok(!isHidden(els, 'results') && els.final.textContent === 7, 'a played day opens on its results');
  els['btn-past'].handlers.click();
  ok(!isHidden(els, 'past'), 'Past puzzles from the results goes back to the list');
  tap(isoOf(daysAgo(5)));
  ok(!isHidden(els, 'game') && location.url === '?daily=' + isoOf(daysAgo(5)), 'an unplayed day opens on its deck');
  // a day in the future, or nonsense, falls back to the list
  const future = boot({ search: '?daily=' + isoOf(daysAgo(-1)) });
  ok(!isHidden(future.els, 'past'), 'tomorrow is not available yet');
  ok(!isHidden(boot({ search: '?daily=not-a-date' }).els, 'past'), 'a bad date goes to the list');
}

// ---------- Random puzzles ----------
{
  const { els, location, store } = boot({ search: '?practice' });
  ok(!isHidden(els, 'start') && isHidden(els, 'game'), '?practice opens the level picker');
  ok(els['daily-text'].innerHTML === '<b>Random puzzles</b>', 'the line reads Random puzzles');
  ok(!isHidden(els, 'go-today') && !isHidden(els, 'go-past') && isHidden(els, 'go-random'), 'with links to today and past');
  els['btn-start'].handlers.click();
  play(els, isReal => isReal);
  ok(location.url === '?practice', 'a random result keeps the practice address');
  ok(Object.keys(store).some(k => k.startsWith('acronumbskull:daily:')) === false, 'a random game writes no daily record');
  ok(JSON.parse(store['acronumbskull:bests'])['2'] === 10, 'but does set the personal best');
  els['btn-today'].handlers.click();
  ok(!isHidden(els, 'game') && location.url === '?daily=' + todayIso, 'Today\'s puzzle from a random result opens today');
  // and from a daily, the Random puzzles link goes to the picker
  els['go-random'].handlers.click({ preventDefault() {} });
  ok(!isHidden(els, 'start') && location.url === '?practice', 'Random puzzles opens the picker');
}

// ---------- share text ----------
// The kit decides how to share (navigator.share, else the clipboard). Loaded as a
// module here it sees Node's own navigator, which can do neither, so it reports a
// failure and the game falls back to a prompt — which is what the harness captures.
{
  const { els, copied } = boot();
  const meta = require('../shozbot-daily.js').create({ game: 'acronumbskull' }).todayMeta();
  play(els, (isReal, i) => (i % 3 === 0 ? !isReal : isReal));   // wrong on cards 1, 4, 7, 10
  els['btn-share'].handlers.click();
  setTimeout(() => {
    const want = 'Acronumbskull No. ' + meta.number + ' · ' + meta.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      '\n6/10 ⬜🟩🟩⬜🟩🟩⬜🟩🟩⬜\nhttps://shozbot.com/acronumbskull/';
    ok(copied[0] === want, 'share text should be the kit\'s, got:\n' + copied[0] + '\nwanted:\n' + want);
    // a random game shares as random puzzles
    const r = boot({ search: '?practice' });
    r.els['btn-start'].handlers.click();
    play(r.els, isReal => isReal);
    r.els['btn-share'].handlers.click();
    setTimeout(() => {
      ok(r.copied[0] === 'Acronumbskull random puzzles\n10/10 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\nhttps://shozbot.com/acronumbskull/',
         'random share text, got:\n' + r.copied[0]);
      console.log('all daily checks passed');
    }, 10);
  }, 10);
}
