"""The menu's sound: howling wind, thunder on every strike, and an original music-box lullaby
whose pitch wavers, all exactly one loop long and seamless.

Everything is built on a circular buffer: noise is shaped by filtering in the frequency domain,
thunder tails and the reverb wrap round from the end to the start, and every modulation runs a
whole number of cycles per loop. So the last sample runs straight into the first.

    python3 tools/audio.py export/menu-sound.wav
"""
import sys
import wave
import numpy as np

SR = 44100
LOOP = 12.0
N = int(SR * LOOP)
rng = np.random.default_rng(13)
t = np.arange(N) / SR
u = t / LOOP


def shaped_noise(lo, hi, tilt=0.0, channels=2):
    """Loopable noise between lo and hi Hz; tilt < 0 darkens it (brown-ish)."""
    out = []
    f = np.fft.rfftfreq(N, 1 / SR)
    for _ in range(channels):
        spec = np.fft.rfft(rng.normal(size=N))
        gain = ((f > lo) & (f < hi)).astype(float)
        gain *= np.where(f > 0, (np.maximum(f, 1) / 100.0) ** tilt, 0)
        # soft band edges
        gain *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4) * 1 / (1 + (f / hi) ** 4)
        x = np.fft.irfft(spec * gain, n=N)
        out.append(x / (np.abs(x).max() + 1e-9))
    return np.stack(out, axis=1)


def place(buf, sig, start):
    """Add a mono or stereo signal into the loop at 'start' seconds, wrapping past the end."""
    s = int(start * SR) % N
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    n = len(sig)
    end = s + n
    if end <= N:
        buf[s:end] += sig
    else:
        buf[s:] += sig[:N - s]
        rest = sig[N - s:]
        while len(rest):
            k = min(len(rest), N)
            buf[:k] += rest[:k]
            rest = rest[k:]


def wind():
    howl = shaped_noise(180, 900, tilt=-0.6)
    body = shaped_noise(40, 400, tilt=-1.2)
    hiss = shaped_noise(1500, 7000, tilt=-0.3)
    swell = 0.55 + 0.25 * np.sin(2 * np.pi * 2 * u + 0.4) + 0.2 * np.sin(2 * np.pi * 5 * u + 1.7)
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 3 * u + 2.2) ** 2
    # a whistling, wavering tone riding the howl
    pitch = 520 + 90 * np.sin(2 * np.pi * 1 * u) + 40 * np.sin(2 * np.pi * 4 * u + 1)
    phase = 2 * np.pi * np.cumsum(pitch) / SR
    phase -= (phase[-1] + 2 * np.pi * pitch[-1] / SR) * u   # close the phase over the loop
    whistle = np.sin(phase) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * u + 0.5)) * 0.18
    w = (howl * 0.55 + body * 0.6 + hiss * 0.12) * (swell * gust)[:, None]
    w += np.stack([whistle, np.roll(whistle, 900)], axis=1)
    return w


def thunder(strength, distance):
    """A crack, then a long rumble; far strikes are softer, duller and later."""
    dur = 3.5 + 1.5 * strength
    n = int(dur * SR)
    tt = np.arange(n) / SR
    crack_n = rng.normal(size=n)
    k = np.ones(3) / 3
    crack = np.convolve(crack_n, k, 'same') * np.exp(-tt / (0.05 + 0.04 * strength)) * (1 - distance)
    # rumble: dark noise, several rolling swells
    spec = np.fft.rfft(rng.normal(size=n))
    f = np.fft.rfftfreq(n, 1 / SR)
    cutoff = 140 + 260 * (1 - distance)
    spec *= 1 / (1 + (f / cutoff) ** 3) * (f > 25)
    rumble = np.fft.irfft(spec, n=n)
    rumble /= np.abs(rumble).max() + 1e-9
    roll = np.exp(-tt / (0.45 + 0.75 * strength)) * (0.6 + 0.4 * np.abs(np.sin(tt * (3 + 2 * rng.random()))))
    attack = np.minimum(1, tt / (0.04 + 0.25 * distance))
    sig = (crack * 1.1 + rumble * roll * attack * 1.2) * strength ** 1.5
    pan = rng.uniform(-0.4, 0.4)
    return np.stack([sig * (1 - pan), sig * (1 + pan)], axis=1) * 0.5


def music_box():
    # D minor, a slow waltz: 6 bars of 3 beats at 90 bpm fill the 12-second loop exactly
    beat = LOOP / 18
    A4 = 440.0
    note = lambda name: A4 * 2 ** ({'A3': -12, 'Bb3': -11, 'C#4': -8, 'D4': -7, 'E4': -5, 'F4': -4, 'G4': -2,
                                    'A4': 0, 'Bb4': 1, 'C#5': 4, 'D5': 5, 'E5': 7, 'F5': 8, 'G5': 10, 'A5': 12}[name] / 12)
    melody = [  # (beat, note, length in beats)
        (0, 'A4', 1), (1, 'D5', 1), (2, 'F5', 1),
        (3, 'E5', 2), (5, 'C#5', 1),
        (6, 'D5', 1), (7, 'A4', 1), (8, 'F4', 1),
        (9, 'G4', 2), (11, 'E4', 1),
        (12, 'F4', 1), (13, 'Bb4', 1), (14, 'A4', 1),
        (15, 'C#5', 1.5), (16.5, 'D5', 1.5),
    ]
    bass = [(0, 'D4'), (3, 'A3'), (6, 'D4'), (9, 'C#4'), (12, 'Bb3'), (15, 'A3')]
    out = np.zeros((N, 2))
    # the warped-record waver: pitch drifts a few cents, slowly
    wobble = 2 ** ((9 * np.sin(2 * np.pi * 2 * u) + 4 * np.sin(2 * np.pi * 7 * u + 1)) / 1200)

    def tine(freq, start, gain, decay):
        n = int(4.5 * SR)
        i0 = int(start * SR)
        idx = (np.arange(n) + i0) % N
        tt = np.arange(n) / SR
        ph = 2 * np.pi * freq * np.cumsum(wobble[idx]) / SR
        env = np.minimum(1, tt / 0.004) * np.exp(-tt / decay)
        tone = (np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-tt / (decay * 0.4))
                + 0.18 * np.sin(3.01 * ph) * np.exp(-tt / (decay * 0.25)) + 0.08 * np.sin(5.4 * ph) * np.exp(-tt / 0.08))
        place(out, tone * env * gain, start)

    for b, name, _ in melody:
        tine(note(name), b * beat, 0.32, 1.6)
        tine(note(name) * 2, b * beat + 0.002, 0.05, 0.7)   # a faint octave shimmer
    for b, name in bass:
        tine(note(name) / 2, b * beat, 0.16, 2.6)
    return out


def reverb(x, seconds=3.2, mix=0.42):
    """Circular convolution with a decaying noise tail: a big, cold room that wraps round the loop."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.normal(size=n) * np.exp(-tt / (seconds / 6.5))
        ir[:int(0.02 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        h = np.zeros(N)
        h[:n] = ir
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch]) * np.fft.rfft(h), n=N)
    return x * (1 - mix) + out * mix * 2.2


def main(path):
    mix = np.zeros((N, 2))
    mix += wind() * 0.11
    mix += reverb(music_box(), 3.5, 0.5) * 0.3
    # thunder, matched to the strikes in js/fx.js (t, strength, distance, delay after the flash)
    storms = [(0.3, 0.55, 0.6, 0.35), (2.3, 0.75, 0.3, 0.12), (4.3, 0.7, 0.4, 0.2),
              (6.3, 1.0, 0.0, 0.03), (8.3, 0.4, 0.8, 0.6), (10.3, 0.8, 0.3, 0.12)]
    th = np.zeros((N, 2))
    for when, strength, dist, delay in storms:
        place(th, thunder(strength, dist), when + delay)
    mix += reverb(th, 2.5, 0.3) * 1.5
    # gentle limiting, then normalise
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= 0.89 / np.abs(mix).max()
    data = (mix * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print('wrote', path, f'{LOOP}s')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'export/menu-sound.wav')
