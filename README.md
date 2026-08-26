# 🔤 Acronumbskull

**Ten real acronyms. Some of the meanings are fake.**

Acronumbskull shows you an acronym and what it supposedly stands for. The acronym is
always genuine. The expansion underneath is the question: is that what those letters
actually stand for, or was it made up for this game? You decide **REAL** or **FAKE**.
Ten a game, one point each, score out of 10.

How many of the ten are genuine is random — every card flips its own coin, so a round
might hold three real expansions or eight, and counting won't help you. The invented
ones spell out the same letters, in the same cheating way real ones do, and sound like
the sort of thing a committee would have agreed. After each guess you get the truth,
plus a note — where the real expansion comes from, or what those letters really stand
for.

Some of them are harder than they look. NASA is the National Aeronautics and Space
*Administration*, not Agency. The FBI is Investigation, not Intelligence. ISO stands
for nothing at all. And WOMBAT really is Weapon Of Magnesium, Battalion, Anti-Tank,
however much it sounds like something invented for a quiz.

## Features

- 10 acronyms per game with a random real/fake split of the expansions, freshly
  shuffled.
- Three difficulty levels — Easy, Tricky and Fiendish — each with its own acronyms and
  its own invented expansions. Your choice is remembered.
- Instant reveal after each answer — **Correct** or **Wrong**, whether the meaning was
  real, and a note with the history, or with what those letters really stand for.
- Back and Forward buttons to step through the ones you have already answered.
- Score out of 10 with a rank and a copyable emoji result grid.
- A per-card recap where any row can be tapped open for the expansion, the note, the
  example sentence, the answer you gave, and a speaker to hear it again.
- Play again returns to the options, so difficulty and voice can be changed between
  games.
- Personal best saved per difficulty, and labelled with the level it was set at.
- A speaker button that reads the acronym aloud in a recorded British female voice —
  the same voice on every device, not the phone's robotic built-in one. Acronyms said
  as words are said as words; initialisms are spelled out.
- Four voices to choose from — Emma, Isabella, Alice and Lily. Tapping one plays an
  acronym in it, and the choice is remembered.
- Every real expansion comes with an example sentence, shown whether you got it right
  or not.
- Keyboard play: `←` real, `→` fake, `S` to hear it; once answered, the arrows move
  through your answers and `Enter` goes on.
- Light and dark themes, following whatever your phone is set to.
- No build step, no dependencies, no tracking.

The clips are rendered offline with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
(Apache-2.0) and shipped with the game, because device speech synthesis sounds
robotic on phones — iOS ships compact voices by default. If a clip will not play, the
browser's own synthesis takes over: the game asks for `en-GB` and works down a list of
the good British female voices that ship on common platforms, then any British voice
that is not obviously male, then any British voice at all. A device with no speech
support simply hides the button.

## Run it locally

It's a static site — serve the folder (the audio needs a server, so opening the file
directly will fall back to synthesis):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

This repo ships `.github/workflows/pages.yml`, which publishes the site on every push
to `main`. One-time setup: **Settings → Pages → Build and deployment → Source →
GitHub Actions**. The workflow tries to enable Pages itself and cannot — an automated
token is not allowed to — so the first run fails until a human clicks it. The site
then lives at `https://<your-username>.github.io/acronumbskull/`.

## Tests and audits

```sh
node tests/run-all.js                # eight suites, driving the real game logic
node tools/audit.js --dict dict.txt --ref acronyms-ref.csv    # fairness audit
node tools/screen.js --ref acronyms-ref.csv ZMP PLOD KESTREL  # screen candidates
```

The reference files are fetched, not committed:

```sh
curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
tr -d '\r' < words.txt > dict.txt
curl -sL -o acronyms-ref.csv https://raw.githubusercontent.com/krishnakt031990/Crawl-Wiki-For-Acronyms/master/AcronymsFile.csv
```

Run the suites after touching `index.html`, and the audit after touching
`acronyms.js`.

## Regenerating the audio

```sh
pip install kokoro-onnx soundfile lameenc mutagen
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 tools/make-audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
```

Existing clips are left alone, so adding entries only renders the new ones.

## Adding acronyms

All the content is in `acronyms.js` — two arrays, `REAL_ACRONYMS` and
`FAKE_ACRONYMS`, 109 entries each. Every entry in **both** arrays is a genuine
acronym; the difference is the expansion. Each level holds between 68 and 76 entries,
which is about seven games before one comes round again. Each entry looks like this:

```js
{
  w: "posslq",
  say: "possel cue",
  cat: "government",
  def: "person of the opposite sex sharing living quarters",
  note: "Real. The US Census Bureau coined it in the 1970s to count couples who would not call themselves one.",
  ex: "For one census the country was full of <em>POSSLQs</em>, and then the form changed.",
  lvl: 3
}
```

and its opposite number, an entry in `FAKE_ACRONYMS`, like this:

```js
{
  w: "nasa",
  say: "nassa",
  cat: "space",
  def: "National Aeronautics and Space Agency",
  note: "Fake. NASA stands for National Aeronautics and Space Administration — <em>administration</em>. It is a civilian agency of government, but the A is for Administration.",
  lvl: 1
}
```

- `w` is the acronym, lowercase — it is displayed in capitals and it names the audio
  file, so it has to be plain letters.
- `say` is what the speech renderer is handed. SCUBA is a word and is read as one;
  PDF has to arrive as `"P D F"` or the model tries to pronounce it. A bare `A` is
  read as the article, so the letter A is written `A-`.
- `cat` is the field printed on the card.
- `def` is the expansion the player is judging: the real one in `REAL_ACRONYMS`, an
  invented one in `FAKE_ACRONYMS`.
- `note` gives the game away afterwards. On a fake it has to say what the letters
  really stand for — that is the whole payoff of the round.
- `ex` belongs on real entries only — it is what makes the example sentence appear,
  so a fake entry must not have one.
- `lvl` is the difficulty: 1 Easy, 2 Tricky, 3 Fiendish.

The game works out real vs. fake from which array the entry is in, so there is no flag
to get wrong. By convention a real note opens "Real" and a fake one opens "Fake".

### An invented expansion still has to spell the acronym

`tools/audit.js` checks every fake expansion against its own letters and refuses any
that does not produce them, because an expansion that does not spell the acronym is
not a wrong answer, it is a typo. Two real entries fail this check on purpose and are
listed rather than flagged: PELICAN, whose "pedestrian light controlled" was
retro-fitted to a bird's name and never quite lined up, and YUPPIE, which is "young
urban professional" plus a suffix nobody voted on.

### Screen the pairing before you write the expansion

This is the rule that costs the most time and saves the game. Almost every short
letter string stands for several things, so the question is never "does this acronym
exist" — it does — but "is the meaning I am about to invent already one of its
meanings?" If it is, the entry is not a fake at all, and the player who knows it is
marked wrong for being right.

`tools/screen.js` prints everything the reference list already knows a candidate
stands for. Anything it does not know still needs a web check, because the list holds
a few thousand acronyms and not all of their meanings. Screening for this bank threw
out about one pairing in six:

| pairing | intended expansion | why it went in the bin |
|---|---|---|
| MPEG | motion picture experts group | the reference list gives Motion Pictures (Coding) Experts Group — the same thing |
| FIDO | fog intensive dispersal operation | the RAF's own later reading was "Fog, Intensive Dispersal Of" |
| ALGOL | algebraic oriented language | Britannica lists it as an alternative name for the language |
| SABRE | Semi-Automatic Booking and Reservation Environment | the real one is given as both Business Research and Business Reservations Environment; too close to either |
| CINCPAC | Commander in Chief, Pacific Command | that *is* CINCPAC. The Fleet version is CINCPACFLT |
| STRATCOM | Strategic Communications Command | the US Army Strategic Communications Command was exactly that, 1964–73 |
| NICE | National Institute for Clinical Excellence | its own former name |
| CERN | Centre Européen pour la Recherche Nucléaire | a genuine historical variant of Conseil |
| PASCAL | primary algorithmic scientific commercial application language | an existing backronym, and the language is named after Blaise Pascal |
| TEMPEST | anything at all | the NSA's own backronym already spells it |
| SOS, WI-FI, SCRAM, POSH | anything at all | famous backronyms: the "invented" answer is the one everybody has already heard |

The last two rows are the trap worth naming. A **backronym** — an expansion invented
after the fact and repeated ever since — is the one kind of fake expansion that must
not go in, because half the players have already met it and will call it real, and
they are not wrong to. ISO, SIGSALY and TESCO are in the bank precisely because their
notes can say *this stands for nothing at all*, which is a better answer than a
backronym.

An acronym that means something *else* is fine, and in fact keeps the game fair: a
player who knows FOB is free on board will correctly reject "freight on board". What
is not fine is an invention that is already the answer.

### The expansions have to cheat at the same rate

Real acronyms cheat. RADAR skips the "and". MODEM takes three letters out of
"modulator". GESTAPO takes two out of each of *Geheime Staatspolizei*. AWOL fishes the
O out of the middle of "withOut". An invented bank where every letter is neatly the
first letter of its own word is a bank a player can spot without reading anything.

`tools/audit.js` measures how the letters are taken on each side — one letter per word,
small words skipped, two-or-more letters from a word, letters taken from inside a word
— and the two halves now agree within six points on every one of them.

### So does everything else you can see without thinking

The same rule as the parent project: **any surface feature a player can see without
engaging with the meaning has to appear at close to the same rate on both sides.** Now
that both halves are genuine acronyms, some of the old leaks close by themselves and a
new one opens:

- **Familiarity.** The leak that replaces the old length problem. If the fakes hang on
  obscure acronyms and the reals on household ones, the acronym alone decides the
  round and the expansion is decoration. The audit uses the reference list as a rough
  proxy: 50% of the real half is in it against 49% of the fake half.
- **Capitalisation.** The one that leaked hardest this time. Inventing an expansion
  pulls you towards a tidy capitalised organisation — Agency, Council, Association,
  Command — while real expansions are as often three lowercase words. The first draft
  carried a proper noun in 56% of fakes against 32% of reals, a 24-point tell in the
  shape of the line. Fixed by swapping a dozen organisation fakes for lowercase
  technical ones: CAT, PET, RICE, FAST, BRAT, FLOPS, CMOS, SAD, ADSL, PCR, SITREP.
- **Word shape.** 52% of the real half spells an English word against 41% of the fake
  half, which needed five deliberate swaps to bring inside the tolerance.
- **Length.** Matched to within 0.2 letters per level, deliberately — level 1 averages
  just under four letters a side, level 3 just under six.
- **Vowels and initialisms.** Vowel-less strings (16% real, 12% fake) and acronyms
  read out as letters (29% real, 26% fake) both have to be split down the middle, or
  "it's spelled out, so it's real" becomes a strategy.
- **Expansion length and commas.** Real expansions are shorter than they look, because
  of the cheating above. Matched now within half a word at every level.
- **Field.** The field is printed on the card, so a field that is 90% real is a free
  answer. Space started at 78% fake and telecoms at 13%, both fixed by moving satellite
  entries to the field they actually belong to rather than to the one that sounded
  best.

Every one of these was introduced by habit rather than decision, and every one was
found by the audit rather than by thinking. Run it after each batch.

### Keep the fields balanced

No single subject should dominate. Military and computing are the largest at around
15% of the bank each, then government and medicine. When a field starts to feel
repetitive in play, trim it and widen the rest rather than adding more of the same.

## Built from a recipe

`RECIPE.md` is the brief this was built from — a self-contained guide to making a
real-or-fake guessing game in this shape, carried over from
[Fauxcabulary](https://github.com/bertrandgroulx-droid/fauxcabulary), which does the
same trick with obscure words. The mechanics here are Fauxcabulary's, debugged; what
is new is the content, the acronym-specific audits above, and the screening step.

## Ideas for later

- Widen the bank further — seventy per level is seven games, and it wants to be twenty.
- Daily challenge: the same ten for everyone, seeded by the date.
- A mode where the acronym is real but the expansion may not be.
- Streaks, and a stats screen behind the personal best.
