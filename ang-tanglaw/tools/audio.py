#!/usr/bin/env python3
"""The sound for the Ang Tanglaw reveal, timed to tools/render.py.

    python3 tools/audio.py export/ang-tanglaw.wav

A hit launches the comet, which roars and rises up the torch into a boom as the flame erupts; the
phoenix's eye opens with a metallic shing. Taiko drums drive the pull-back, a blade swishes TANGLAW
open, ANG lands on three toms, and a riser and a drum roll pile into the lockup: a sub drop, a
crash and a brassy D chord that holds, with the fire roaring under it, until a last hit ends it.
Everything is synthesised here.

Needs numpy and scipy.
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

from render import (ANG_START, BUTTON, DURATION, EYE_FLARE, IGNITE, LAUNCH, LOCK, SLASH, SLASH_LEN,
                    SWEEP_LEN, SWEEP_START, TWINKLE, ang_landing)

SR = 48000
N = int(DURATION * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(5)


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=-1)


def noise(n=N):
    return rng.standard_normal(n)


def since(t0):
    return np.clip(T - t0, 0, None)


def gate(t0):
    return (T >= t0).astype(float)


def bank(x, cutoffs, path, kind='lowpass'):
    """A filter that moves: crossfade copies of x filtered at fixed cutoffs, following path (Hz)."""
    pos = np.interp(np.log(np.clip(path, cutoffs[0], cutoffs[-1])), np.log(cutoffs), np.arange(len(cutoffs)))
    out = np.zeros_like(x)
    for i, f in enumerate(cutoffs):
        out += filt(x, kind, f) * np.clip(1 - np.abs(pos - i), 0, 1)
    return out


def pan(x, p):
    """Equal-power pan, p from -1 (left) to 1 (right); p may vary in time."""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def crackles(t0, t1, rate, band, level, decay=(0.002, 0.009)):
    """Random short pops between t0 and t1; rate may be a function of time."""
    out = np.zeros((2, N))
    t = t0
    while True:
        r = rate(t) if callable(rate) else rate
        t += rng.exponential(1 / max(r, 1e-3))
        if t >= t1:
            break
        n, i = int(SR * 0.04), int(t * SR)
        if i + n >= N:
            break
        pop = noise(n) * np.exp(-np.arange(n) / SR / rng.uniform(*decay)) * rng.uniform(0.3, 1.0) ** 2
        out[:, i:i + n] += pan(pop, rng.uniform(-0.7, 0.7))
    return filt(out, 'bandpass', band) * level


def tone(freq, partials, decays, amps, start, attack=0.002):
    """A struck tone: partials (ratios) each decaying at its own rate."""
    t = since(start)
    out = np.zeros(N)
    for r, d, a in zip(partials, decays, amps):
        out += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d)
    return out * gate(start) * np.clip(t / attack, 0, 1)


def drum(t0, size=1.0, pitch=1.0):
    """A taiko-like hit: a pitch-dropping body, the skin, and a stick click."""
    t = since(t0)
    f = (55 + 95 * np.exp(-t / 0.03)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.32 * size)) * np.clip(t / 0.002, 0, 1)
    skin = filt(noise(), 'bandpass', (180 * pitch, 1800)) * np.exp(-t / 0.045)
    click = filt(noise(), 'highpass', 2500) * np.exp(-t / 0.004)
    return (np.tanh(body * 1.5) * 0.9 + skin * 0.35 + click * 0.15) * gate(t0) * size


def boom(t0, length=1.0, f0=62, f1=30):
    """A sub drop."""
    t = since(t0)
    f = f1 + (f0 - f1) * np.exp(-t / 0.2)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / length) * np.clip(t / 0.004, 0, 1) * gate(t0)
    return np.tanh(x * 1.8) / np.tanh(1.8)


def whoomp(t0, length=0.45):
    """A rush of air, bright at first then dark."""
    t = since(t0)
    x = bank(noise(), [250, 500, 1000, 2000, 4000, 8000], 280 + 8500 * np.exp(-t / 0.18))
    return x * np.exp(-t / length) * np.clip(t / 0.01, 0, 1) * gate(t0)


def shing(t0, base=2200.0, length=1.0):
    """A metallic ring with a bright transient."""
    ring = tone(base, [1, 2.32, 4.25, 6.63], [length, length * 0.55, length * 0.3, length * 0.15], [1, 0.5, 0.25, 0.1], t0)
    t = since(t0)
    zing = filt(noise(), 'highpass', 5000) * np.exp(-t / 0.05) * gate(t0)
    return ring * 0.6 + zing * 0.4


def saw(freq):
    phase = np.cumsum(np.broadcast_to(freq, (N,))) / SR
    return 2 * (phase % 1.0) - 1


def braam(t0, notes, length=4.0, bright=1.0):
    """A brassy chord: detuned saws through a filter that opens on the hit and slowly closes."""
    t = since(t0)
    x = np.zeros(N)
    for f, a in notes:
        for det in (-0.006, 0.0, 0.007):
            x += saw(f * (1 + det)) * a / 3
    path = 700 + 3800 * bright * np.exp(-t / 0.35) + 500 * np.exp(-t / 2.5)
    x = bank(x, [250, 500, 1000, 2000, 4000], path)
    env = np.clip(t / 0.02, 0, 1) * (0.55 + 0.45 * np.exp(-t / 0.6)) * np.exp(-t / length)
    return np.tanh(x * env * gate(t0) * 1.4)


def riser(t0, t1, f0=400, f1=9000):
    """Noise and a gliding tone climbing into t1, cut there."""
    u = np.clip((T - t0) / (t1 - t0), 0, 1) * (T < t1)
    air = bank(noise(), [400, 800, 1600, 3200, 6400, 9000], f0 * (f1 / f0) ** u) * u ** 2.5
    pitch = 146.83 * 2 ** (u ** 1.5)
    tonal = filt(saw(pitch), 'lowpass', 2500) * u ** 3
    cut = np.clip((t1 - T) / 0.008, 0, 1)
    return (air * 0.8 + tonal * 0.25) * cut


def reverb(x, seconds=2.4, decay=0.45, predelay=0.015):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-tt / decay)
    ir = filt(filt(ir, 'lowpass', 6000), 'highpass', 150)
    ir = np.concatenate([np.zeros((2, int(predelay * SR))), ir], axis=1)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return np.stack([fftconvolve(x[c], ir[c])[:N] for c in range(2)])


D2, A2, D3, A3, D4, FS4, A4 = 73.42, 110.0, 146.83, 220.0, 293.66, 369.99, 440.0


def main(path):
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))

    def add(sig, level, p=0.0, send=0.3):
        s = pan(sig, p) if sig.ndim == 1 else sig
        dry[:] += s * level
        wet[:] += s * level * send

    # --- a sucked-in breath, then the launch
    u = np.clip(T / LAUNCH, 0, 1) * (T < LAUNCH)
    add(bank(noise(), [500, 1000, 2000, 4000], 500 * 8 ** u) * u ** 3 * np.clip((LAUNCH - T) / 0.006, 0, 1), 0.35)
    add(drum(LAUNCH, 0.8), 0.55, 0, 0.25)
    add(boom(LAUNCH, 0.3, 80, 45), 0.35)

    # --- the comet roars up the torch, fizzing, into the impact
    climb = np.clip((T - LAUNCH) / (IGNITE - LAUNCH), 0, 1) * (T < IGNITE)
    cut = np.clip((IGNITE - T) / 0.008, 0, 1)
    roar = bank(noise(), [300, 600, 1200, 2400, 4800, 8000], 400 * 18 ** climb) * (0.45 + 0.55 * climb ** 1.3) * (T >= LAUNCH)
    add(roar * cut, 0.6, 0, 0.2)
    add(crackles(LAUNCH, IGNITE, lambda t: 150 + 400 * (t - LAUNCH), (2500, 10000), 0.3, (0.0008, 0.003)), 1.0)
    add(filt(saw(D2 * 2 ** (climb * 1.0)), 'lowpass', 900) * climb ** 2 * cut, 0.2)

    # --- the flame erupts
    add(boom(IGNITE, 0.9, 64, 31), 0.9)
    add(drum(IGNITE, 1.3, 0.85), 0.6, 0, 0.35)
    w = whoomp(IGNITE, 0.5)
    add(np.stack([w, np.roll(w, 260)]), 0.55, 0, 0.35)
    add(crackles(IGNITE, IGNITE + 1.0, lambda t: 300 * np.exp(-(t - IGNITE) / 0.3) + 10, (1800, 11000), 0.38), 1.0)

    # --- the fire roars on to the end
    t = since(IGNITE)
    bed = filt(np.cumsum(noise()), 'bandpass', (60, 600))
    bed = bed / np.abs(bed).max() * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * T))
    hiss = filt(noise(), 'bandpass', (900, 4500)) * 0.12
    swell = np.clip(t / 0.25, 0, 1) * gate(IGNITE) * (0.75 + 0.35 * np.exp(-t / 0.8))
    add(np.stack([bed + hiss, np.roll(bed, 480) + np.roll(hiss, 240)]) * swell, 0.16, 0, 0.1)
    add(crackles(IGNITE + 0.8, DURATION, 16, (800, 7000), 0.17, (0.003, 0.012)), 1.0)

    # --- the phoenix opens its eye
    add(shing(EYE_FLARE, 2200, 1.1), 0.26, 0.35, 0.8)

    # --- drums drive the pull back, the blade cuts TANGLAW open, ANG lands
    for t0, s, pch in ((1.55, 0.8, 1.0), (1.95, 0.85, 1.0), (2.25, 0.6, 1.15), (2.42, 0.7, 1.1)):
        add(drum(t0, s, pch), 0.5, 0, 0.35)
    add(drum(SLASH, 1.1, 0.95), 0.55, 0, 0.35)
    add(boom(SLASH, 0.5, 70, 38), 0.45)
    blade = np.clip((T - SLASH) / SLASH_LEN, 0, 1)
    swish = bank(noise(), [1500, 3000, 6000, 10000], 1500 * 6 ** blade, 'highpass')
    swish *= np.sin(np.pi * np.clip((T - SLASH + 0.05) / (SLASH_LEN + 0.15), 0, 1)) ** 2
    add(pan(swish, -0.8 + 1.6 * blade), 0.32, 0, 0.4)
    add(shing(SLASH + 0.02, 1500, 0.8), 0.18, -0.3, 0.7)
    for j in range(3):
        add(drum(ang_landing(j), 0.55, 1.5 + 0.12 * j), 0.45, -0.5 + 0.12 * j, 0.3)

    # --- the sheen, a riser and a roll piling into the lockup
    sheen = filt(noise(), 'bandpass', (5000, 12000)) * np.sin(np.pi * np.clip((T - SWEEP_START) / SWEEP_LEN, 0, 1)) ** 2
    add(pan(sheen, -0.7 + 1.4 * np.clip((T - SWEEP_START) / SWEEP_LEN, 0, 1)), 0.06, 0, 0.5)
    add(riser(ANG_START + 0.3, LOCK), 0.45, 0, 0.3)
    for t0, s in ((3.45, 0.45), (3.65, 0.5), (3.80, 0.55), (3.90, 0.6), (3.97, 0.65), (4.02, 0.7), (4.06, 0.75)):
        add(drum(t0, s, 1.25), 0.6, 0, 0.3)

    # --- the lockup: everything lands, and the chord holds to the end
    add(boom(LOCK, 1.5, 58, 27), 1.0)
    add(drum(LOCK, 1.5, 0.8), 0.7, 0, 0.4)
    chord = [(D2, 1.0), (A2, 0.8), (D3, 0.75), (A3, 0.45), (D4, 0.4), (FS4, 0.3), (A4, 0.2)]
    b = braam(LOCK, chord, 4.5)
    add(np.stack([b, np.roll(b, 300)]), 0.42, 0, 0.35)
    crash = filt(noise(2 * N).reshape(2, N), 'highpass', 4000) * np.exp(-since(LOCK) / 1.3) * gate(LOCK)
    add(crash, 0.16, 0, 0.5)
    w = whoomp(LOCK, 0.6)
    add(np.stack([w, np.roll(w, 200)]), 0.4, 0, 0.3)
    add(shing(LOCK, 2600, 1.5), 0.24, 0.35, 0.9)
    add(shing(TWINKLE, 3100, 0.7), 0.08, 0.35, 0.9)

    # --- one last hit to end on
    add(boom(BUTTON, 0.7, 60, 30), 0.85)
    add(drum(BUTTON, 1.3, 0.85), 0.65, 0, 0.35)
    b = braam(BUTTON, chord, 2.0, 1.2)
    add(np.stack([b, np.roll(b, 300)]), 0.36, 0, 0.3)
    add(shing(BUTTON, 2600, 1.0), 0.2, 0.35, 0.8)
    crash = filt(noise(2 * N).reshape(2, N), 'highpass', 4500) * np.exp(-since(BUTTON) / 0.8) * gate(BUTTON)
    add(crash, 0.12, 0, 0.5)

    mix = dry + reverb(wet) * 0.6
    mix = filt(mix, 'highpass', 25)
    mix = np.tanh(mix * 1.6) / 1.6            # glue it together, and loud
    mix *= np.clip((DURATION - T) / 0.06, 0, 1)
    mix *= 10 ** (-1 / 20) / np.abs(mix).max()
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', path)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'export/ang-tanglaw.wav')
