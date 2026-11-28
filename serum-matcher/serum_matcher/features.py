"""Audio analysis: turns a sound into a fixed-length timbre fingerprint.

The fingerprint is split into named groups so that matching can weight them
separately (e.g. the overtone profile matters more than the LFO rate).
Every value is scaled to roughly the 0..1 range.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.fft import dct
from scipy.signal import resample_poly

SR = 44100
N_FFT = 4096
HOP = 1024
ANALYSIS_SEC = 1.45   # stays inside the rendered note (held 1.5 s), so release length does not matter
N_HARMONICS = 24
N_MELS = 40
N_MFCC = 13
ENV_TIMES = (0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0, 1.2, 1.4)
N_BRIGHT_SEG = 8
MOD_BANDS = ((0.5, 2.0), (2.0, 5.0), (5.0, 10.0), (10.0, 20.0))

# name -> length. Order defines the layout of the feature vector.
GROUPS: dict[str, int] = {
    "harmonics": N_HARMONICS,          # overtone profile relative to f0 (pitch-invariant)
    "spectrum": N_MELS,                # average spectral shape
    "mfcc": 2 * (N_MFCC - 1),          # timbre texture (mean + std)
    "envelope": len(ENV_TIMES) + 1,    # loudness over time + attack time
    "brightness": N_BRIGHT_SEG + 1,    # filter movement over time
    "noise": 4,                        # flatness, harmonicity, rolloff, bandwidth
    "modulation": 2 * len(MOD_BANDS),  # LFO-like wobble of level and brightness
}
FEATURE_DIM = sum(GROUPS.values())


def group_slices() -> dict[str, slice]:
    out, pos = {}, 0
    for name, n in GROUPS.items():
        out[name] = slice(pos, pos + n)
        pos += n
    return out


@dataclass
class Analysis:
    features: np.ndarray        # (FEATURE_DIM,)
    f0: float | None            # Hz, None when the sound has no clear pitch
    silent: bool = False

    @property
    def midi(self) -> float | None:
        return None if self.f0 is None else 69 + 12 * np.log2(self.f0 / 440.0)


# ---------------------------------------------------------------- loading

def load_audio(path: str) -> np.ndarray:
    import soundfile as sf

    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return prepare(data, sr)


def prepare(data: np.ndarray, sr: int) -> np.ndarray:
    """Any (n,) / (n, ch) / (ch, n) array at any rate -> mono float32 at SR."""
    data = np.asarray(data, dtype=np.float32)
    if data.ndim == 2:
        if data.shape[0] <= 8 and data.shape[1] > data.shape[0]:
            data = data.T
        data = data.mean(axis=1)
    if sr != SR:
        g = np.gcd(int(sr), SR)
        data = resample_poly(data, SR // g, int(sr) // g).astype(np.float32)
    return data


# ---------------------------------------------------------------- helpers

def _mel_filterbank() -> np.ndarray:
    def hz2mel(f):
        return 2595 * np.log10(1 + f / 700)

    def mel2hz(m):
        return 700 * (10 ** (m / 2595) - 1)

    freqs = np.fft.rfftfreq(N_FFT, 1 / SR)
    pts = mel2hz(np.linspace(hz2mel(30), hz2mel(16000), N_MELS + 2))
    fb = np.zeros((N_MELS, len(freqs)), dtype=np.float32)
    for i in range(N_MELS):
        lo, c, hi = pts[i], pts[i + 1], pts[i + 2]
        up = (freqs - lo) / (c - lo)
        down = (hi - freqs) / (hi - c)
        fb[i] = np.maximum(0, np.minimum(up, down))
        fb[i] /= max(fb[i].sum(), 1e-9)
    return fb


_MEL_FB = _mel_filterbank()
_FREQS = np.fft.rfftfreq(N_FFT, 1 / SR)
_WINDOW = np.hanning(N_FFT).astype(np.float32)


def _stft_mag(x: np.ndarray) -> np.ndarray:
    n_frames = 1 + max(0, len(x) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    frames = x[idx] * _WINDOW
    return np.abs(np.fft.rfft(frames, axis=1)).astype(np.float32)


def estimate_f0(x: np.ndarray, fmin: float = 30.0, fmax: float = 2000.0) -> float | None:
    """YIN pitch estimate taken as the median over the loud part of the sound."""
    w = 4096
    if len(x) < 2 * w:
        return None
    rms = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, len(x) - w, w // 2)])
    if rms.max() <= 0:
        return None
    starts = [i * (w // 2) for i, r in enumerate(rms) if r > rms.max() * 0.3][:12]
    tau_min, tau_max = int(SR / fmax), min(int(SR / fmin), w // 2)
    estimates, quality = [], []
    for s in starts:
        frame = x[s:s + w].astype(np.float64)
        if len(frame) < w:
            continue
        # YIN difference d(tau) = sum_{j<h} (x_j - x_{j+tau})^2, h = w/2
        h = w // 2
        r = np.fft.irfft(np.fft.rfft(frame, 2 * w) * np.conj(np.fft.rfft(frame[:h], 2 * w)))[: h + 1]
        csum = np.concatenate(([0.0], np.cumsum(frame ** 2)))
        taus = np.arange(h + 1)
        d = csum[h] + (csum[taus + h] - csum[taus]) - 2 * r
        d[0] = 0
        cmnd = d[1:] * np.arange(1, len(d)) / np.maximum(np.cumsum(d[1:]), 1e-12)
        cmnd = np.concatenate(([1.0], cmnd))
        seg = cmnd[tau_min:tau_max]
        below = np.where(seg < 0.15)[0]
        if len(below):
            t = below[0]
            while t + 1 < len(seg) and seg[t + 1] < seg[t]:
                t += 1
        else:
            t = int(np.argmin(seg))
        q = seg[t]
        tau = t + tau_min
        if 1 <= tau < len(cmnd) - 1:  # parabolic interpolation
            a, b, c = cmnd[tau - 1], cmnd[tau], cmnd[tau + 1]
            den = a - 2 * b + c
            tau = tau + (0.5 * (a - c) / den if abs(den) > 1e-12 else 0)
        estimates.append(SR / tau)
        quality.append(q)
    if not estimates or np.median(quality) > 0.35:
        return None
    return float(np.median(estimates))


def _band_energy(sig: np.ndarray, frame_rate: float) -> np.ndarray:
    sig = sig - np.linspace(sig[0], sig[-1], len(sig))  # remove slow trend
    if len(sig) < 8 or np.allclose(sig, 0):
        return np.zeros(len(MOD_BANDS))
    spec = np.abs(np.fft.rfft(sig * np.hanning(len(sig)), 4 * len(sig)))
    freqs = np.fft.rfftfreq(4 * len(sig), 1 / frame_rate)
    out = []
    for lo, hi in MOD_BANDS:
        m = (freqs >= lo) & (freqs < hi)
        out.append(spec[m].max() if m.any() else 0.0)
    return np.array(out) / len(sig)


# ---------------------------------------------------------------- main API

def analyze(x: np.ndarray, f0_hint: float | None = None) -> Analysis:
    """Analyse a mono signal at SR. Leading silence is skipped automatically."""
    x = np.asarray(x, dtype=np.float32)
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    if peak < 1e-4:
        return Analysis(np.zeros(FEATURE_DIM, np.float32), None, silent=True)
    x = x / peak

    # start at the onset (first sample above -40 dB)
    onset = int(np.argmax(np.abs(x) > 0.01))
    onset = max(0, onset - 64)
    n = int(ANALYSIS_SEC * SR)
    seg = x[onset:onset + n]
    seg = np.pad(seg, (0, n + N_FFT - len(seg)))

    f0 = f0_hint if f0_hint else estimate_f0(seg[:n])

    mag = _stft_mag(seg)                        # (frames, bins)
    power = mag ** 2
    frame_rms = np.sqrt(power.sum(axis=1)) + 1e-12
    frame_db = 20 * np.log10(frame_rms / frame_rms.max())
    loud = frame_db > -30
    frame_rate = SR / HOP
    times = np.arange(len(mag)) * HOP / SR + N_FFT / 2 / SR

    # --- harmonics: overtone levels relative to the loudest one
    avg = mag[loud].mean(axis=0)
    harm = np.zeros(N_HARMONICS)
    if f0:
        for k in range(1, N_HARMONICS + 1):
            fk = k * f0
            if fk >= SR / 2 - 100:
                break
            band = (_FREQS >= fk * 0.97) & (_FREQS <= fk * 1.03)
            if not band.any():
                band = np.argmin(np.abs(_FREQS - fk))
            harm[k - 1] = avg[band].max()
        hdb = 20 * np.log10(harm / max(harm.max(), 1e-12) + 1e-6)
        harm = np.clip(hdb, -60, 0) / 60 + 1

    # --- spectral shape (mel)
    mel_frames = power[loud] @ _MEL_FB.T + 1e-12
    mel_avg_db = 10 * np.log10(mel_frames.mean(axis=0))
    spectrum = np.clip(mel_avg_db - mel_avg_db.max(), -80, 0) / 80 + 1

    # --- MFCC mean/std
    log_mel = 10 * np.log10(mel_frames)
    mfcc = dct(log_mel, type=2, norm="ortho", axis=1)[:, 1:N_MFCC]
    mfcc_feat = np.concatenate([mfcc.mean(axis=0) / 40, mfcc.std(axis=0) / 20])

    # --- amplitude envelope
    env = np.interp(ENV_TIMES, times, np.clip(frame_db, -60, 0)) / 60 + 1
    abs_env = np.abs(seg[:n])
    hop_s = 64
    fine = np.array([abs_env[i:i + hop_s].max() for i in range(0, min(len(abs_env), SR), hop_s)])
    attack_idx = int(np.argmax(fine >= 0.7 * fine.max()))
    attack_sec = attack_idx * hop_s / SR
    attack = np.clip(np.log10(attack_sec + 1e-3) + 3, 0, 3) / 3  # 1 ms .. 1 s
    envelope = np.concatenate([env, [attack]])

    # --- brightness (spectral centroid) over time
    centroid = (power * _FREQS).sum(axis=1) / (power.sum(axis=1) + 1e-12)
    log_cent = np.clip(np.log2(np.maximum(centroid, 20) / 20) / 10, 0, 1.2)
    seg_edges = np.linspace(0, ANALYSIS_SEC, N_BRIGHT_SEG + 1)
    traj = []
    for a, b in zip(seg_edges[:-1], seg_edges[1:]):
        m = (times >= a) & (times < b) & loud
        traj.append(np.average(log_cent[m], weights=frame_rms[m]) if m.any() else np.nan)
    traj = np.array(traj)
    mean_bright = np.nanmean(traj) if np.isfinite(traj).any() else 0.0
    traj = np.where(np.isfinite(traj), traj, mean_bright)
    brightness = np.concatenate([[mean_bright], (traj - mean_bright) * 4])

    # --- noisiness
    p = power[loud] + 1e-12
    flatness = np.exp(np.log(p).mean(axis=1)) / p.mean(axis=1)
    flat = float(np.clip(np.mean(flatness) * 4, 0, 1))
    if f0:
        harmonic_bins = np.zeros_like(_FREQS, dtype=bool)
        for k in range(1, int((SR / 2) / f0)):
            harmonic_bins |= np.abs(_FREQS - k * f0) <= max(f0 * 0.04, 2 * SR / N_FFT)
        harmonicity = float((power[loud][:, harmonic_bins].sum()) / power[loud].sum())
    else:
        harmonicity = 0.0
    cum = np.cumsum(avg ** 2)
    rolloff = _FREQS[np.searchsorted(cum, 0.85 * cum[-1])]
    roll = np.clip(np.log2(max(rolloff, 20) / 20) / 10, 0, 1)
    c_avg = (avg ** 2 * _FREQS).sum() / ((avg ** 2).sum() + 1e-12)
    bw = np.sqrt((avg ** 2 * (_FREQS - c_avg) ** 2).sum() / ((avg ** 2).sum() + 1e-12))
    bandwidth = np.clip(np.log2(max(bw, 20) / 20) / 10, 0, 1)
    noise = np.array([flat, harmonicity, roll, bandwidth])

    # --- modulation: wobble of level and brightness in the sustained part
    sustain = (times > 0.25) & (times < ANALYSIS_SEC)
    mod_level = _band_energy(np.clip(frame_db[sustain], -60, 0) / 60, frame_rate) * 8
    mod_bright = _band_energy(log_cent[sustain], frame_rate) * 8
    modulation = np.clip(np.concatenate([mod_level, mod_bright]), 0, 1)

    feats = np.concatenate([harm, spectrum, mfcc_feat, envelope, brightness, noise, modulation])
    assert feats.shape == (FEATURE_DIM,), feats.shape
    return Analysis(np.nan_to_num(feats).astype(np.float32), f0)


def analyze_file(path: str) -> Analysis:
    return analyze(load_audio(path))
