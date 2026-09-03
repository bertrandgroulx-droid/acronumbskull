#!/usr/bin/env python3
"""The Acronumbskull mark: a stylised A in the Fauxcabulary family.

The family look is a bright azure glyph on a near-black ground, built from flat-cut
blocks, with one arm of the letter broken into two small detached squares —
Fauxcabulary's F carries its middle arm that way. This A does the same with its
crossbar: solid legs and a flat apex, and the bar that crosses them is two loose
squares. At icon sizes below about 24px the two squares read as a single bar, which
is the right thing to happen: the A still reads.

Geometry is computed rather than eyeballed. The A's counter is a triangle that widens
towards the feet, so the crossbar squares are sized to the width available at their
own height, with even clearance from both legs.

    python3 make.py            # writes the svgs and the png set
"""
import subprocess, sys, os

INK   = "#0e1016"      # near-black, as the family ground
BLUE  = "#5aa9ff"      # the game's own accent
R     = 2.2            # corner rounding, in glyph units (100-unit box)

TOP, BOT   = 6, 94     # cap height, baseline
T          = 17        # stroke weight
APEX       = 50        # centre line
FOOT_OUT   = 1.5       # outer edge of each foot: a wide stance opens the counter
BAR_TOP    = 60        # crossbar, top edge
CLEAR      = 3         # clearance between a crossbar square and a leg

def counter_edges(y):
    """Inner edges of the two legs at height y — the sides of the A's counter."""
    t = (y - TOP) / (BOT - TOP)
    left  = (APEX + T / 2) + ((FOOT_OUT + T) - (APEX + T / 2)) * t
    right = (APEX - T / 2) + ((100 - FOOT_OUT - T) - (APEX - T / 2)) * t
    return left, right

def glyph():
    leg_r = (f'M{APEX - T / 2:g} {TOP} H{APEX + T / 2:g} L{100 - FOOT_OUT:g} {BOT} '
             f'H{100 - FOOT_OUT - T:g} Z')
    leg_l = (f'M{APEX - T / 2:g} {TOP} H{APEX + T / 2:g} L{FOOT_OUT + T:g} {BOT} '
             f'H{FOOT_OUT:g} Z')
    left, right = counter_edges(BAR_TOP)          # narrowest point of the bar's span
    sq = (right - left - 3 * CLEAR) / 2
    x1 = left + CLEAR
    x2 = x1 + sq + CLEAR
    return (f'<path d="{leg_l}"/><path d="{leg_r}"/>'
            f'<rect x="{x1:g}" y="{BAR_TOP}" width="{sq:g}" height="{sq:g}" rx="{R}"/>'
            f'<rect x="{x2:g}" y="{BAR_TOP}" width="{sq:g}" height="{sq:g}" rx="{R}"/>')

def alt_glyph():
    """The alternate: a flat-topped A, crossbar cut in two against the stems."""
    lx, rx = 8, 100 - 8 - T
    inner = (lx + T, rx)
    span = inner[1] - inner[0]
    sq = (span - CLEAR) / 2
    return "".join([
        f'<rect x="{lx}" y="{TOP}" width="{T}" height="{BOT - TOP}" rx="{R}"/>',
        f'<rect x="{rx}" y="{TOP}" width="{T}" height="{BOT - TOP}" rx="{R}"/>',
        f'<rect x="{lx}" y="{TOP}" width="{100 - 2 * lx}" height="{T}" rx="{R}"/>',
        f'<rect x="{inner[0]:g}" y="{BAR_TOP - 8}" width="{sq:g}" height="{T}" rx="{R}"/>',
        f'<rect x="{inner[0] + sq + CLEAR:g}" y="{BAR_TOP - 8}" width="{sq:g}" height="{T}" rx="{R}"/>',
    ])

def svg(size=512, shape="squircle", pad=0.18, mark=glyph, ground=INK):
    off, scale = size * pad, size * (1 - 2 * pad) / 100
    rx = {"squircle": size * 0.2237, "square": 0}.get(shape)
    bg = (f'<rect width="{size}" height="{size}" rx="{rx:g}" fill="{ground}"/>' if rx is not None
          else f'<circle cx="{size / 2:g}" cy="{size / 2:g}" r="{size / 2:g}" fill="{ground}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
            f'width="{size}" height="{size}">{bg}'
            f'<g transform="translate({off:g} {off:g}) scale({scale:g})" fill="{BLUE}">'
            f'{mark()}</g></svg>')

# What each file is for. iOS and Android apply their own mask, so what they get is a
# plain square, full bleed — rounding it ourselves would show as a dark halo inside
# their mask. The squircle is for the browser tab and anywhere the file is shown as-is.
FILES = {
    "icon.svg":           dict(size=512, shape="squircle"),
    "icon-round.svg":     dict(size=512, shape="circle"),
    "icon-square.svg":    dict(size=512, shape="square"),
    "icon-maskable.svg":  dict(size=512, shape="square", pad=0.27),  # Android safe zone
    "icon-alt.svg":       dict(size=512, shape="squircle", mark=alt_glyph),
}

if __name__ == "__main__":
    for name, kw in FILES.items():
        open(name, "w").write(svg(**kw))
    print("wrote " + ", ".join(FILES))
