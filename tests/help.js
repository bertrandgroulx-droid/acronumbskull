// How to play: shown once on a first visit, then only when asked.
const { boot, ok } = require('./lib/harness');
const store = {};
let { els } = boot({ store });
ok(els.help.open === true, 'a first visit opens the rules');
els['btn-help-close'].handlers.click();
ok(els.help.open === false, 'Got it closes them');
ok(store['acronumbskull:help-seen'] === 'true', 'and remembers that they were read');
({ els } = boot({ store }));
ok(els.help.open === false, 'a second visit does not open them');
els['go-help'].handlers.click({ preventDefault() {} });
ok(els.help.open === true, 'the How to play link opens them');
console.log('all how-to-play checks passed');
