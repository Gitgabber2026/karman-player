"""End-to-end test with a fake synth standing in for Serum.

Each fake ".fxp" holds synth parameters; the fake renderer plays them like
SerumRenderer would. Then every preset is played at an unindexed pitch with
small random changes, and the matcher must find it.

Run:  python -m pytest tests  (or: python tests/test_matching.py)
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from serum_matcher.features import SR, analyze  # noqa: E402
from serum_matcher.library import PresetIndex  # noqa: E402
from serum_matcher.render import index_serum  # noqa: E402

WAVES = ["saw", "square", "sine", "tri"]


def synth(p: dict, midi: float, dur: float = 4.0, hold: float = 1.5, rng=None) -> np.ndarray:
    rng = rng or np.random.default_rng(0)
    t = np.arange(int(dur * SR)) / SR
    f0 = 440 * 2 ** ((midi + 12 * p.get("octave", 0) - 69) / 12)
    a, d, s, r = p["attack"], p["decay"], p["sustain"], p["release"]
    env = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-3)))
    env = np.where(t > hold, env[min(int(hold * SR), len(t) - 1)] * np.exp(-(t - hold) / max(r, 1e-3)), env)
    fenv = np.exp(-t / p["fdecay"])
    lfo = 1 + p["lfo_depth"] * np.sin(2 * np.pi * p["lfo_rate"] * t)
    cutoff = np.maximum(p["cutoff"] * (1 + p["famount"] * fenv) * lfo, 50)
    out = np.zeros_like(t)
    voices = p["voices"]
    for v in range(voices):
        det = 1 + (p["detune"] * (v - (voices - 1) / 2) / max(voices - 1, 1) if voices > 1 else 0)
        fv = f0 * det
        phase0 = rng.uniform(0, 2 * np.pi)
        for k in range(1, min(80, int(SR / 2 / fv))):
            w = p["wave"]
            if w == "saw":
                amp = 1 / k
            elif w == "square":
                amp = (1 / k) if k % 2 else 0
            elif w == "tri":
                amp = (1 / k ** 2) if k % 2 else 0
            else:
                amp = 1.0 if k == 1 else 0
            if amp == 0:
                continue
            lp = 1 / np.sqrt(1 + (k * fv / cutoff) ** (2 * p["slope"]))
            out += amp * lp * np.sin(2 * np.pi * k * fv * t + phase0 * k)
    out /= voices
    if p["noise"] > 0:
        out += p["noise"] * rng.standard_normal(len(t)) * 0.3
    out *= env
    return np.stack([out, out]).astype(np.float32) * 0.3


def random_preset(rng) -> dict:
    return {
        "wave": WAVES[rng.integers(len(WAVES))],
        "octave": int(rng.choice([-1, 0, 0, 0, 1])),
        "attack": float(rng.choice([0.002, 0.01, 0.08, 0.4])),
        "decay": float(rng.choice([0.08, 0.25, 0.8, 3.0])),
        "sustain": float(rng.choice([0.0, 0.3, 0.8, 1.0])),
        "release": float(rng.choice([0.05, 0.3, 1.0])),
        "cutoff": float(rng.choice([300, 900, 2500, 8000])),
        "famount": float(rng.choice([0, 0, 3, 10])),
        "fdecay": float(rng.choice([0.1, 0.4, 1.0])),
        "slope": int(rng.choice([1, 2, 4])),
        "lfo_rate": float(rng.choice([0.0, 2.0, 6.0])),
        "lfo_depth": float(rng.choice([0.0, 0.0, 0.5])),
        "voices": int(rng.choice([1, 1, 3, 5])),
        "detune": float(rng.choice([0.005, 0.02])),
        "noise": float(rng.choice([0, 0, 0.05, 0.4])),
    }


class FakeRenderer:
    def __init__(self, notes):
        self.notes = list(notes)

    def render(self, preset):
        p = json.loads(Path(preset).read_text())
        return np.concatenate([np.zeros((2, int(0.5 * SR)), np.float32)] +
                              [synth(p, n) for n in self.notes], axis=1)

    def split(self, audio):
        out = []
        for i, n in enumerate(self.notes):
            a = int((0.5 + 4 * i) * SR)
            out.append((n, audio[:, a:a + 4 * SR]))
        return out


def build(tmp: Path, n_presets: int, seed: int = 1):
    rng = np.random.default_rng(seed)
    pdir = tmp / "Presets"
    presets = {}
    for i in range(n_presets):
        p = random_preset(rng)
        cat = ["Bass", "Lead", "Pad", "Pluck"][i % 4]
        f = pdir / cat / f"P{i:03d}_{p['wave']}.fxp"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(p))
        presets[f.stem] = p
    idx = index_serum(str(pdir), "fake", str(tmp / "index"), notes=(36, 48, 60, 72),
                      previews=True, renderer=FakeRenderer((36, 48, 60, 72)))
    return presets, idx


def test_finds_preset_at_other_pitch():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        presets, idx = build(tmp, 40)
        assert len(idx) == 40
        idx = PresetIndex.load(tmp / "index")      # round-trip through disk
        rng = np.random.default_rng(7)
        top1 = top5 = 0
        for name, p in presets.items():
            q = dict(p)
            q["cutoff"] *= rng.uniform(0.85, 1.15)  # "similar", not identical
            q["decay"] *= rng.uniform(0.85, 1.15)
            midi = int(rng.choice([41, 45, 52, 55, 63]))  # notes that were never rendered
            audio = synth(q, midi, dur=3.0, hold=2.0, rng=rng)[0]
            res = idx.search(analyze(audio), top=5)
            names = [m.name for m in res]
            top1 += names[0] == name
            top5 += name in names
        print(f"top-1 {top1}/{len(presets)}, top-5 {top5}/{len(presets)}")
        assert top1 >= 0.7 * len(presets)
        assert top5 >= 0.9 * len(presets)


def test_incremental_reindex_skips_unchanged():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        build(tmp, 4)
        calls = []

        class Counting(FakeRenderer):
            def render(self, preset):
                calls.append(preset)
                return super().render(preset)
        index_serum(str(tmp / "Presets"), "fake", str(tmp / "index"), notes=(36, 48, 60, 72),
                    renderer=Counting((36, 48, 60, 72)))
        assert calls == []


def test_preset_that_crashed_serum_is_skipped():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        build(tmp, 3)
        bad = sorted((tmp / "Presets").rglob("*.fxp"))[0]
        bad.write_text(bad.read_text() + " ")          # changed -> would be re-rendered
        (tmp / "index" / "_current.txt").write_text(str(bad))  # ...but it crashed last time
        idx = index_serum(str(tmp / "Presets"), "fake", str(tmp / "index"), notes=(48,),
                          renderer=FakeRenderer((48,)))
        assert any(p == str(bad) for p, _ in idx.meta["errors"])
        assert not (tmp / "index" / "_current.txt").exists()


if __name__ == "__main__":
    test_preset_that_crashed_serum_is_skipped()
    test_finds_preset_at_other_pitch()
    test_incremental_reindex_skips_unchanged()
    print("ok")
