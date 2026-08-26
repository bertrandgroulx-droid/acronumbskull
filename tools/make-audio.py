#!/usr/bin/env python3
"""Generate one spoken clip per acronym in acronyms.js.

The browser's own speech synthesis sounds robotic on most phones — iOS ships
"compact" voices by default — so the game ships its own audio instead. This
renders every acronym with Kokoro (Apache-2.0) in a British female voice and
writes audio/<voice>/<acronym>.mp3.

Each entry carries two strings. `w` is the acronym, and names the file. `say`
is what the renderer is actually given: SCUBA is a word and is read as one,
while PDF has to arrive as "P D F" or the model tries to pronounce it.

Setup:
    pip install kokoro-onnx soundfile lameenc
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Usage:
    python3 tools/make-audio.py [--model PATH] [--voices PATH] [--only ACRONYM ...]

Existing clips are left alone, so adding entries only renders the new ones.
"""

import argparse, os, re, sys
import numpy as np
import soundfile as sf
import lameenc
from kokoro_onnx import Kokoro

VOICES = {            # the British female voices the game offers
    "emma": "bf_emma",
    "isabella": "bf_isabella",
    "alice": "bf_alice",
    "lily": "bf_lily",
}
SPEED = 0.9           # a shade slow: these are unfamiliar strings
BITRATE = 64          # mono, plenty for a single spoken word

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def entries_from_bank():
    """[(acronym, what to say)] in bank order."""
    src = open(os.path.join(ROOT, "acronyms.js"), encoding="utf-8").read()
    return re.findall(r'\{ w: "([^"]+)", say: "([^"]+)"', src)


def trim_silence(audio, sr, threshold=0.01, pad_ms=60):
    """Kokoro leaves a beat of silence at each end; drop most of it."""
    loud = np.where(np.abs(audio) > threshold)[0]
    if len(loud) == 0:
        return audio
    pad = int(sr * pad_ms / 1000)
    return audio[max(0, loud[0] - pad):min(len(audio), loud[-1] + pad)]


def to_mp3(audio, sr, path):
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    with open(path, "wb") as fh:
        fh.write(enc.encode(pcm.tobytes()) + enc.flush())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="kokoro.onnx")
    ap.add_argument("--voices", default="voices.bin")
    ap.add_argument("--voice", default="all", choices=list(VOICES) + ["all"],
                    help="which voice to render (default: all of them)")
    ap.add_argument("--out", default=os.path.join(ROOT, "audio"))
    ap.add_argument("--only", nargs="*", help="render just these acronyms")
    ap.add_argument("--force", action="store_true", help="re-render clips that already exist")
    args = ap.parse_args()

    entries = entries_from_bank()
    if args.only:
        wanted = set(args.only)
        entries = [e for e in entries if e[0] in wanted]
    kokoro = Kokoro(args.model, args.voices)
    chosen = list(VOICES) if args.voice == "all" else [args.voice]

    for name in chosen:
        # Each voice gets its own directory: audio/<voice>/<word>.mp3
        out_dir = os.path.join(args.out, name)
        os.makedirs(out_dir, exist_ok=True)
        made = skipped = 0
        for i, (acronym, spoken) in enumerate(entries, 1):
            if not re.fullmatch(r"[a-z]+", acronym):
                print(f"  skipping {acronym!r}: not plain lowercase", file=sys.stderr)
                continue
            path = os.path.join(out_dir, acronym + ".mp3")
            if os.path.exists(path) and not args.force:
                skipped += 1
                continue
            # No full stop: sentence-final punctuation makes the model release the last
            # consonant into an extra syllable — "haboob" comes out as "haboob-eh".
            audio, sr = kokoro.create(spoken, voice=VOICES[name], speed=SPEED, lang="en-gb")
            to_mp3(trim_silence(audio, sr), sr, path)
            made += 1
            if made % 50 == 0:
                print(f"  {name}: {i}/{len(entries)}…", flush=True)
        print(f"{name}: {made} rendered, {skipped} already present, in {out_dir}", flush=True)


if __name__ == "__main__":
    main()
