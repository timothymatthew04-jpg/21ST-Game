#!/usr/bin/env python3
"""The sound for the Ang Tanglaw reveal, timed to tools/render.py.

    python3 tools/audio.py export/ang-tanglaw.wav

A fuse fizzes and rises as the spark climbs the torch; the flame catches with a soft whoomp and a
low boom, then crackles quietly on. A warm D chord swells under the light and opens from sus2 to
major as the name lands; the letters of TANGLAW ring in as a rising run, air sweeps with the sheen,
and a bell sounds as the phoenix's eye catches the light. Everything is synthesised here.

Needs numpy and scipy.
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

from render import (ANG_START, DURATION, GLINT_LEN, GLINT_START, IGNITE, SPARK_ON, SWEEP_LEN,
                    SWEEP_START, TANGLAW_START)

SR = 48000
N = int(DURATION * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(5)


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=-1)


def noise(n=N):
    return rng.standard_normal(n)


def curve(points):
    """Piecewise-linear envelope through (time, level) points."""
    ts, vs = zip(*points)
    return np.interp(T, ts, vs)


def bank(x, cutoffs, path, kind='lowpass'):
    """A filter that moves: crossfade copies of x filtered at fixed cutoffs, following path (Hz)."""
    copies = [filt(x, kind, f) for f in cutoffs]
    pos = np.interp(np.log(np.clip(path, cutoffs[0], cutoffs[-1])), np.log(cutoffs), np.arange(len(cutoffs)))
    out = np.zeros_like(x)
    for i, c in enumerate(copies):
        out += c * np.clip(1 - np.abs(pos - i), 0, 1)
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
        n = int(SR * 0.04)
        i = int(t * SR)
        if i + n >= N:
            break
        tau = rng.uniform(*decay)
        pop = noise(n) * np.exp(-np.arange(n) / SR / tau) * rng.uniform(0.3, 1.0) ** 2
        out[:, i:i + n] += pan(pop, rng.uniform(-0.6, 0.6))
    return filt(out, 'bandpass', band) * level


def tone(freq, partials, decays, amps, start, attack=0.003):
    """A struck tone: partials (ratios) each decaying at its own rate."""
    t = np.clip(T - start, 0, None)
    on = T >= start
    out = np.zeros(N)
    for r, d, a in zip(partials, decays, amps):
        out += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d)
    return out * on * np.clip(t / attack, 0, 1)


def reverb(x, seconds=2.6, decay=0.5, predelay=0.018):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-tt / decay)
    ir = filt(filt(ir, 'lowpass', 5500), 'highpass', 150)
    ir = np.concatenate([np.zeros((2, int(predelay * SR))), ir], axis=1)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return np.stack([fftconvolve(x[c], ir[c])[:N] for c in range(2)])


def main(path):
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))
    after = np.clip(T - IGNITE, 0, None)
    hit = T >= IGNITE

    # --- the spark climbing: a fizzing fuse and an airy rise that cuts at the impact
    climb = np.clip((T - SPARK_ON) / (IGNITE - SPARK_ON), 0, 1) * (T < IGNITE)
    fuse = crackles(SPARK_ON, IGNITE, lambda t: 70 + 160 * (t - SPARK_ON), (2500, 9000), 0.16, (0.0008, 0.003))
    dry += fuse * np.clip((T - SPARK_ON) / 0.15, 0, 1)
    air = bank(noise(), [300, 600, 1200, 2400, 4800], 350 * 12 ** climb, 'lowpass')
    cut = np.clip((IGNITE - T) / 0.012, 0, 1)
    rise = air * climb ** 2.2 * 0.22 * cut
    dry += pan(rise, 0)
    wet += pan(rise, 0) * 0.5
    swell = np.sin(2 * np.pi * np.cumsum(38 + 18 * climb) / SR) * climb ** 3 * 0.12 * cut
    dry += pan(swell, 0)

    # --- ignition: a click, a low boom falling in pitch, and a whoomp of air
    click = noise() * np.exp(-after / 0.0025) * hit
    dry += pan(filt(click, 'bandpass', (200, 4000)) * 0.35, 0)
    boom_f = 34 + 38 * np.exp(-after / 0.18)
    boom = np.sin(2 * np.pi * np.cumsum(boom_f) / SR) * np.exp(-after / 0.75) * hit
    boom *= np.clip(after / 0.004, 0, 1)
    boom = np.tanh(boom * 1.6) / np.tanh(1.6)
    dry += pan(boom * 0.62, 0)
    wet += pan(boom * 0.12, 0)
    whoomp_path = 300 + 6500 * np.exp(-after / 0.22)
    whoomp = bank(noise(), [250, 500, 1000, 2000, 4000, 7000], whoomp_path, 'lowpass')
    whoomp *= np.exp(-after / 0.42) * np.clip(after / 0.012, 0, 1) * hit
    dry += np.stack([whoomp, np.roll(whoomp, 240)]) * 0.5
    wet += pan(whoomp * 0.3, 0)
    dry += crackles(IGNITE, IGNITE + 0.9, lambda t: 260 * np.exp(-(t - IGNITE) / 0.25) + 5, (2000, 10000), 0.3)

    # --- the fire burns on: a low rumble and the odd crackle
    bed_env = np.clip(after / 0.6, 0, 1) * hit * np.clip((DURATION - T) / 1.0, 0, 1)
    rumble = filt(np.cumsum(noise()), 'bandpass', (60, 420))
    rumble *= 0.07 / np.abs(rumble).max() * (0.8 + 0.2 * np.sin(2 * np.pi * 0.43 * T)) * bed_env
    dry += np.stack([rumble, np.roll(rumble, 480)])
    dry += crackles(IGNITE + 0.6, DURATION, 9, (900, 6500), 0.12, (0.003, 0.012)) * bed_env

    # --- a warm chord: D sus2, opening to D major as the name lands
    notes = {146.83: 1.0, 220.0: 0.8, 293.66: 0.7, 440.0: 0.45, 587.33: 0.18}
    third = np.clip((T - (TANGLAW_START + 0.25)) / 0.7, 0, 1)
    pad = np.zeros(N)
    for f, a in list(notes.items()) + [(329.63, 'sus'), (369.99, 'maj')]:
        level = 0.55 * (1 - third) if a == 'sus' else 0.55 * third if a == 'maj' else a
        for det in (-0.004, 0.0, 0.0045):
            ph = 2 * np.pi * f * (1 + det) * T + rng.uniform(0, 6.3)
            wave_ = sum(np.sin(ph * k) * np.exp(-k / 2.6) / k for k in range(1, 9))
            pad += wave_ * level / 3
    pad_env = curve([(0, 0), (IGNITE + 0.05, 0), (IGNITE + 1.8, 0.75), (ANG_START + 0.8, 1.0),
                     (DURATION - 1.4, 0.95), (DURATION, 0)]) ** 1.6
    pad = filt(pad, "lowpass", 2200) * pad_env * 0.095
    shimmer = 0.5 + 0.5 * np.sin(2 * np.pi * 0.18 * T)
    dry += np.stack([pad * (0.9 + 0.1 * shimmer), pad * (1.0 - 0.1 * shimmer)])
    wet += np.stack([pad, pad]) * 0.8

    # --- ANG drifts in on a breath of air, from the left
    breath = filt(noise(), 'bandpass', (900, 5000))
    breath_env = np.exp(-((T - (ANG_START + 0.35)) / 0.32) ** 2)
    sig = breath * breath_env * 0.07
    dry += pan(sig, -0.45)
    wet += pan(sig, -0.45) * 0.6

    # --- TANGLAW: each letter rings in as it lands, rising left to right
    run = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51]
    for j, f in enumerate(run):
        land = TANGLAW_START + 0.06 * j + 0.2
        note = tone(f, [1, 2.0, 3.98], [0.32, 0.12, 0.05], [1, 0.22, 0.07], land) * 0.085
        p = -0.55 + 1.1 * j / 6
        dry += pan(note, p)
        wet += pan(note, p) * 0.9

    # --- the sheen: air sweeping left to right, and a bell for the phoenix's eye
    sweep_u = np.clip((T - SWEEP_START) / SWEEP_LEN, 0, 1)
    sheen = filt(noise(), 'bandpass', (4500, 12000)) * np.sin(np.pi * sweep_u) ** 2 * 0.05
    dry += pan(sheen, -0.7 + 1.4 * sweep_u)
    wet += pan(sheen, 0) * 0.5
    ting_at = GLINT_START + GLINT_LEN / 2 - 0.05
    ting = tone(1760.0, [1, 2.76, 5.40, 8.93], [1.6, 0.8, 0.35, 0.18], [1, 0.38, 0.14, 0.05], ting_at) * 0.09
    ting += tone(880.0, [1, 2.0], [1.9, 0.6], [1, 0.2], ting_at) * 0.045
    dry += pan(ting, 0.35)
    wet += pan(ting, 0.35) * 1.1

    mix = dry + reverb(wet) * 0.55
    mix = filt(mix, 'highpass', 28)
    mix *= np.clip((DURATION - T) / 0.6, 0, 1) ** 2
    mix = np.tanh(mix * 1.2) / 1.2
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
