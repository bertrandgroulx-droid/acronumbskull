// The share icon in the daily line: a dated link whenever a specific day's deck
// is on screen (in play or on its results), the plain address on random puzzles
// and the Past list; always the shozbot.com address from the canonical link.
// On a phone it goes to the share sheet with a title; on a laptop it is copied
// and a toast says so; with neither, the toast shows the link itself.
const { boot, ok, hidden: isHidden } = require('./lib/harness');
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = new Date();
const todayIso = isoOf(today);
const todayNo = require('../shozbot-daily.js').create({ game: 'acronumbskull' }).todayMeta().number;
const HOME = 'https://shozbot.com/acronumbskull/';

// a phone: the share sheet gets a title and the link
function sheet(opts) {
  const shared = [];
  const out = boot(Object.assign({ navigator: { share: p => { shared.push(p); return Promise.resolve(); } } }, opts));
  out.share = () => { out.els['share-link'].handlers.click(); return shared[shared.length - 1]; };
  return out;
}
const play = els => { for (let i = 0; i < 10; i++) { els['btn-real'].handlers.click(); els['btn-next'].handlers.click(); } };

// ---------- a specific day's deck is linked by date ----------
{
  const a = sheet({ search: '?daily=2026-03-04' });
  ok(!isHidden(a.els, 'game'), 'a linked day opens on its deck');
  let got = a.share();
  ok(got.url === HOME + '?daily=2026-03-04', 'a past day in play links by date, got ' + got.url);
  ok(got.title === 'Acronumbskull · Daily No. 63', 'with the day number as its title, got ' + got.title);
  ok(a.els['share-link'].getAttribute('aria-label') === 'Share a link to this puzzle', 'the icon says what it shares');
  play(a.els);
  ok(!isHidden(a.els, 'results'), 'the deck ends on its results');
  got = a.share();
  ok(got.url === HOME + '?daily=2026-03-04' && got.title === 'Acronumbskull · Daily No. 63', 'its results share the same dated link, got ' + got.url);

  // today, reached with no address at all
  const t = sheet();
  got = t.share();
  ok(got.url === HOME + '?daily=' + todayIso, 'today\'s deck links by date too, got ' + got.url);
  ok(got.title === 'Acronumbskull · Daily No. ' + todayNo, 'with today\'s number, got ' + got.title);

  // a played day reopened on its results
  const store = { ['acronumbskull:daily:2026-03-04']: JSON.stringify({ score: 7, max: 10, results: [], recap: [], at: 1 }) };
  const r = sheet({ store, search: '?daily=2026-03-04' });
  ok(!isHidden(r.els, 'results'), 'a played day reopens on its results');
  got = r.share();
  ok(got.url === HOME + '?daily=2026-03-04' && got.title === 'Acronumbskull · Daily No. 63', 'and shares its dated link, got ' + got.url);
}

// ---------- everywhere else, the plain address ----------
{
  const p = sheet({ search: '?practice' });
  let got = p.share();
  ok(got.url === HOME && got.title === 'Acronumbskull', 'the level picker shares the plain address, got ' + got.url + ' / ' + got.title);
  ok(p.els['share-link'].getAttribute('aria-label') === 'Share a link to Acronumbskull', 'and the icon says so');
  p.els['btn-start'].handlers.click();
  got = p.share();
  ok(got.url === HOME, 'a random deck in play shares the plain address, got ' + got.url);
  play(p.els);
  got = p.share();
  ok(got.url === HOME && got.title === 'Acronumbskull', 'and so do its results, got ' + got.url);
  ok(!got.url.includes('practice'), 'no random-puzzle seed or state in the link');

  const l = sheet({ search: '?past' });
  got = l.share();
  ok(got.url === HOME && got.title === 'Acronumbskull', 'the Past list shares the plain address, got ' + got.url);

  // from a daily, going to the list drops the date; coming back to a day picks it up
  const d = sheet({ search: '?daily=2026-03-04' });
  d.els['go-past'].handlers.click({ preventDefault() {} });
  ok(d.share().url === HOME, 'Past puzzles from a daily shares the plain address');
  d.els['past-list'].handlers.click({ target: { closest: () => ({ getAttribute: () => '2026-03-05' }) }, preventDefault() {} });
  ok(d.share().url === HOME + '?daily=2026-03-05', 'a day tapped in the list shares that day');
  d.els['go-random'].handlers.click({ preventDefault() {} });
  ok(d.share().url === HOME, 'Random puzzles shares the plain address');
  d.els['go-today'].handlers.click({ preventDefault() {} });
  ok(d.share().url === HOME + '?daily=' + todayIso, 'Today\'s puzzle shares today');
}

// ---------- the link comes from the canonical tag, never the address bar ----------
{
  const s = sheet({ search: '?daily=2026-03-04' });
  s.location.origin = 'https://bertrandgroulx-droid.github.io'; s.location.pathname = '/acronumbskull/';
  ok(s.share().url.startsWith('https://shozbot.com/acronumbskull/'), 'the link is the shozbot.com address whatever the page was served from');
}

// ---------- a laptop: copied, with a toast ----------
{
  const written = [];
  const { els } = boot({ search: '?daily=2026-03-04', navigator: { clipboard: { writeText: t => { written.push(t); return Promise.resolve(); } } } });
  ok(!els['share-toast'], 'the toast is not touched until the icon is tapped');   // the stub is made on first use
  els['share-link'].handlers.click();
  ok(written[0] === HOME + '?daily=2026-03-04', 'the link goes to the clipboard, got ' + written[0]);
  setTimeout(() => {
    ok(!isHidden(els, 'share-toast') && els['share-toast'].textContent === 'Link copied', 'a toast says Link copied, got: ' + els['share-toast'].textContent);
    setTimeout(() => {
      ok(isHidden(els, 'share-toast'), 'and goes away on its own');

      // a clipboard that refuses, or no clipboard at all: the toast shows the link to copy by hand
      const refused = boot({ search: '?practice', navigator: { clipboard: { writeText: () => Promise.reject(new Error('denied')) } } });
      refused.els['share-link'].handlers.click();
      setTimeout(() => {
        ok(refused.els['share-toast'].textContent === HOME && !isHidden(refused.els, 'share-toast'), 'a refused clipboard shows the link itself, got: ' + refused.els['share-toast'].textContent);
        const bare = boot({ search: '?daily=2026-03-04' });   // Node's navigator stub here has neither
        bare.els['share-link'].handlers.click();
        ok(bare.els['share-toast'].textContent === HOME + '?daily=2026-03-04' && !isHidden(bare.els, 'share-toast'), 'with no clipboard the toast shows the link, got: ' + bare.els['share-toast'].textContent);
        console.log('all share-link checks passed');
      }, 10);
    }, 2000);
  }, 10);
}
