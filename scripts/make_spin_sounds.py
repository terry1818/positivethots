#!/usr/bin/env python3
"""Renders the daily spin wheel's sounds into src/assets/sounds/spin/.

Everything here is synthesised from scratch (no samples, nothing licensed): struck-bar tones for the
win phrases, a resonant wooden click for the pointer, filtered noise for the push, and one shared
room reverb so the set sounds like it was recorded in the same place.

Run from the repo root:  python3 scripts/make_spin_sounds.py     (needs numpy, scipy, ffmpeg)
"""
import os, subprocess, wave
import numpy as np
from scipy import signal

SR = 44100
OUT = "src/assets/sounds/spin"
rng = np.random.default_rng(20261124)  # fixed seed: the same files every run


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def fade(x, a=0.002, r=0.01):
    """Short raised-cosine fades so no file starts or ends on a click."""
    x = x.copy()
    na, nr = int(SR * a), int(SR * r)
    if na: x[:na] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, na))[:, None] if x.ndim == 2 else 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, na))
    if nr: x[-nr:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nr))[:, None] if x.ndim == 2 else 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nr))
    return x


def band(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x, axis=0)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x, axis=0)


def room(seconds, bright=6500, seed=1):
    """Stereo impulse response: a few early reflections, then a smooth decaying tail."""
    r = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n) / SR
    tail = r.standard_normal((n, 2)) * np.exp(-6.9 * t / seconds)[:, None]
    tail = highpass(lowpass(tail, bright), 220)
    tail[: int(SR * 0.012)] = 0  # pre-delay keeps the dry hit crisp
    for ms, g in ((17, 0.5), (29, 0.38), (43, 0.3), (61, 0.22)):
        i = int(SR * ms / 1000)
        tail[i, r.integers(0, 2)] += g
    return tail / np.sqrt((tail ** 2).sum(axis=0)).max()


def wet(dry, ir, amount):
    """Dry signal plus `amount` of reverb, padded so the tail is not cut off."""
    dry = np.pad(dry, ((0, len(ir)), (0, 0)))
    rev = np.stack([signal.fftconvolve(dry[:, c], ir[:, c])[: len(dry)] for c in (0, 1)], axis=1)
    return dry + amount * rev


def stereo(mono, pan=0.0):
    """Equal-power pan, -1 left to +1 right."""
    a = (pan + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def place(mix, part, at):
    i = int(SR * at)
    need = i + len(part)
    if need > len(mix):
        mix = np.pad(mix, ((0, need - len(mix)), (0, 0)))
    mix[i:need] += part
    return mix


# ── Instruments ──────────────────────────────────────────────────────────────

# A struck metal bar (glockenspiel / celesta): the overtones are not whole multiples, which is what
# makes it read as a real bell and not a beep. (ratio, level, seconds to fade by 60 dB)
BAR = ((0.5, 0.16, 0.45), (1.0, 1.0, 1.15), (2.0, 0.30, 0.70), (2.756, 0.26, 0.48), (5.404, 0.12, 0.26), (8.933, 0.05, 0.14))


def bar(freq, dur=1.3, level=1.0, pan=0.0, hard=1.0):
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    for cents, side in ((-4, -0.35), (4, 0.35)):  # two slightly detuned strikes, spread left and right
        f = freq * 2 ** (cents / 1200)
        v = np.zeros(len(t))
        for ratio, amp, t60 in BAR:
            if f * ratio > 16000: continue
            scale = (880 / f) ** 0.25  # high notes ring a little shorter, like the real thing
            v += amp * (hard if ratio > 1 else 1) * np.sin(2 * np.pi * f * ratio * t + rng.uniform(0, 0.4)) * np.exp(-6.9 * t / (t60 * scale))
        out += stereo(v, np.clip(pan + side, -1, 1)) * 0.5
    # the mallet: a few milliseconds of filtered noise at the start
    n = int(SR * 0.012)
    click = band(rng.standard_normal(n), 2500, 7000) * np.exp(-np.arange(n) / (SR * 0.0025))
    out[:n] += stereo(click, pan) * 0.10 * hard
    return fade(out * level, 0.0015, 0.05)


def pad(freqs, dur, level=1.0):
    """Soft held chord under the bells, for warmth."""
    t = t_axis(dur)
    env = np.minimum(t / 0.05, 1) * np.exp(-3.2 * t / dur)
    out = np.zeros((len(t), 2))
    for k, f in enumerate(freqs):
        for det, side in ((-6, -0.6), (6, 0.6)):
            ff = f * 2 ** (det / 1200)
            v = np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(2 * np.pi * 2 * ff * t) + 0.08 * np.sin(2 * np.pi * 3 * ff * t)
            out += stereo(v * env, side)
    return fade(lowpass(out, 3200) * level / (2 * len(freqs)), 0.005, 0.1)


def brass(freqs, dur, level=1.0):
    """A rounded horn-like stab for the top prize: a saw wave whose brightness opens then closes."""
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    for k, f in enumerate(freqs):
        saw = np.zeros(len(t))
        for h in range(1, 22):
            if f * h > 9000: break
            saw += np.sin(2 * np.pi * f * h * t + 0.02 * h) / h
        # brightness envelope done with two filters cross-faded over time
        bright, dull = lowpass(saw, 3800), lowpass(saw, 900)
        mixenv = np.exp(-t / 0.22)
        v = (bright * mixenv + dull * (1 - mixenv)) * np.minimum(t / 0.025, 1) * np.exp(-2.6 * t / dur)
        out += stereo(v, (-0.5, 0.5, -0.2, 0.2, 0, 0)[k % 6])
    return fade(out * level / len(freqs), 0.004, 0.12)


def sparkle(dur, scale, level=1.0, density=22):
    """Tiny high bells scattered left and right."""
    out = np.zeros((int(SR * dur), 2))
    for _ in range(int(density * dur)):
        at = rng.uniform(0, dur * 0.8) ** 1.0
        note = bar(rng.choice(scale) * rng.choice((2, 4)), 0.35, level * rng.uniform(0.25, 0.7) * (1 - at / dur), rng.uniform(-0.9, 0.9), hard=0.6)
        out = place(out, note, at)
    return out


def swell(dur, level=1.0):
    """Air rushing up into the big chord."""
    t = t_axis(dur)
    n = highpass(rng.standard_normal((len(t), 2)), 3500)
    env = (t / dur) ** 2.5
    return fade(n * env[:, None] * level, 0.01, 0.015)


def thump(level=1.0):
    t = t_axis(0.35)
    f = 52 + 70 * np.exp(-t / 0.03)
    v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    return fade(stereo(v, 0) * level, 0.001, 0.05)


def tick(variant):
    """The pointer hitting a peg: a short filtered-noise knock ringing a small wooden body."""
    dur = 0.11
    t = t_axis(dur)
    shift = (1.0, 0.955, 1.045)[variant]
    modes = ((930, 1.0, 0.050), (1710, 0.75, 0.034), (2640, 0.55, 0.024), (3900, 0.34, 0.016), (5600, 0.2, 0.010), (410, 0.5, 0.045))
    v = np.zeros(len(t))
    for f, amp, t60 in modes:
        v += amp * rng.uniform(0.85, 1.15) * np.sin(2 * np.pi * f * shift * rng.uniform(0.985, 1.015) * t + rng.uniform(0, np.pi)) * np.exp(-6.9 * t / t60)
    n = int(SR * 0.004)
    knock = band(rng.standard_normal(n), 1800, 9000) * np.exp(-np.arange(n) / (SR * 0.0009))
    v[:n] += knock * 1.6
    v = highpass(v, 250)
    return fade(v, 0.0004, 0.02)


def whoosh():
    """The push: a short breath of air rising, with a soft low knock as the wheel lets go. Kept dark and
    brief on purpose; a long bright hiss is what makes a whoosh sound cheap."""
    dur = 0.42
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    # slide a band-pass upward by cross-fading a bank of fixed bands
    centres = np.geomspace(260, 2100, 8)
    pos = np.clip(t / 0.26, 0, 1) ** 0.8 * (len(centres) - 1)
    for k, c in enumerate(centres):
        w = np.clip(1 - np.abs(pos - k), 0, 1)
        out += band(n, c / 1.25, c * 1.25) * w
    env = np.sin(np.pi * np.clip(t / 0.36, 0, 1)) ** 2
    out = lowpass(out * env, 4200)
    low = np.sin(2 * np.pi * np.cumsum(62 + 60 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.07) * np.minimum(t / 0.004, 1)
    return fade(stereo(out * 0.55, 0) + stereo(low * 0.5, 0), 0.004, 0.05)


# ── The win phrases ──────────────────────────────────────────────────────────
C5, D5, E5, G5, A5 = 523.25, 587.33, 659.25, 783.99, 880.0
C6, E6, G6, C7 = 1046.5, 1318.5, 1567.98, 2093.0
G4 = 392.0
PENTA = (C6, 1174.66, E6, G6, 1760.0)


def win(rarity):
    mix = np.zeros((int(SR * 0.1), 2))
    if rarity == "common":      # two bright notes: "ding-ding"
        mix = place(mix, bar(G5, 0.9, 0.8, -0.15), 0.0)
        mix = place(mix, bar(C6, 1.2, 1.0, 0.15), 0.12)
        mix = place(mix, pad((C5,), 0.9, 0.5), 0.12)
        tail, amount = 1.1, 0.20
    elif rarity == "uncommon":  # three rising notes landing on a chord
        for i, f in enumerate((E5, G5, C6)):
            mix = place(mix, bar(f, 1.0 + 0.2 * i, 0.75 + 0.12 * i, (-0.3, 0.0, 0.3)[i]), 0.095 * i)
        mix = place(mix, bar(E6, 1.1, 0.45, 0.4), 0.19)
        mix = place(mix, pad((C5, E5, G5), 1.2, 0.8), 0.19)
        tail, amount = 1.3, 0.22
    elif rarity == "rare":      # a quick run up, a full chord, and sparkle
        for i, f in enumerate((C5, E5, G5, C6, E6)):
            mix = place(mix, bar(f, 1.0, 0.6 + 0.09 * i, -0.4 + 0.2 * i), 0.07 * i)
        for f, p in ((C6, -0.3), (E6, 0.0), (G6, 0.3)):
            mix = place(mix, bar(f, 1.5, 0.8, p), 0.37)
        mix = place(mix, pad((C5, E5, G5, C6), 1.6, 1.0), 0.37)
        mix = place(mix, sparkle(1.1, PENTA, 0.5), 0.45)
        tail, amount = 1.6, 0.26
    else:                       # top prize: air rushes in, horns and bells hit together, then answer an octave up
        mix = place(mix, swell(0.32, 0.16), 0.0)
        for i, f in enumerate((G4, C5, E5, G5, C6)):
            mix = place(mix, bar(f, 0.9, 0.55 + 0.08 * i, -0.4 + 0.2 * i), 0.06 + 0.055 * i)
        hit = 0.36
        mix = place(mix, thump(0.7), hit)
        mix = place(mix, brass((C5 / 2, G4, C5, E5, G5), 1.5, 1.5), hit)
        for f, p in ((C5, -0.5), (E5, -0.2), (G5, 0.2), (C6, 0.5), (E6, 0.0)):
            mix = place(mix, bar(f, 1.8, 0.7, p), hit)
        mix = place(mix, brass((C5, E5, G5, C6), 1.3, 1.1), hit + 0.34)
        for f, p in ((C6, -0.4), (E6, 0.0), (G6, 0.4), (C7, 0.0)):
            mix = place(mix, bar(f, 1.9, 0.75, p), hit + 0.34)
        mix = place(mix, pad((C5 / 2, C5, E5, G5), 2.2, 1.2), hit)
        mix = place(mix, sparkle(1.7, PENTA, 0.55, density=26), hit + 0.1)
        tail, amount = 1.9, 0.28
    return wet(mix, room(tail, seed=7), amount)


def master(x, peak_db):
    x = x - x.mean(axis=0)
    x = np.tanh(x / np.abs(x).max() * 1.6) / np.tanh(1.6)  # gentle saturation glues the layers together
    return x / np.abs(x).max() * 10 ** (peak_db / 20)


def trim_tail(x, floor_db=-66):
    env = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    keep = np.nonzero(env > 10 ** (floor_db / 20) * env.max())[0]
    x = x[: keep[-1] + int(SR * 0.03)]
    return fade(x, 0, 0.03)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else 2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def write_mp3(path, x, kbps=128):
    tmp = path + ".tmp.wav"
    write_wav(tmp, x)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", path], check=True)
    os.remove(tmp)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    small = room(0.22, bright=5000, seed=3)
    for i in range(3):
        dry = stereo(tick(i), 0)
        x = master(wet(dry, small, 0.10), -3).mean(axis=1)  # mono: it is panned in the app
        write_wav(f"{OUT}/tick-{i + 1}.wav", trim_tail(x, -60))
    write_mp3(f"{OUT}/start.mp3", trim_tail(master(wet(whoosh(), room(0.45, bright=4000, seed=5), 0.12), -6)), 112)
    for rarity in ("common", "uncommon", "rare", "very_rare"):
        write_mp3(f"{OUT}/win-{rarity.replace('_', '-')}.mp3", trim_tail(master(win(rarity), -1.5)), 128)
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(f"{OUT}/{f}"), "bytes")
