"""Preset index: stores fingerprints of every preset and finds the closest ones.

Each preset can have several fingerprints (one per rendered note). When a
sample is matched, the fingerprint rendered nearest to the sample's pitch is
used, so a C1 bass is compared with how the preset sounds low, not high.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from .features import FEATURE_DIM, GROUPS, Analysis, group_slices

INDEX_VERSION = 2

# how much each aspect of the sound counts when comparing
DEFAULT_WEIGHTS = {
    "harmonics": 1.2,
    "spectrum": 1.0,
    "mfcc": 0.8,
    "envelope": 1.0,
    "brightness": 0.7,
    "noise": 0.6,
    "modulation": 0.4,
}
MIN_SCALE = 0.05


@dataclass
class Match:
    name: str
    path: str
    category: str
    distance: float
    similarity: float           # 0..100, for display only
    note: float | None          # MIDI note of the fingerprint that matched
    preview: str | None
    group_distances: dict[str, float] = field(default_factory=dict)


class PresetIndex:
    def __init__(self) -> None:
        self.entries: list[dict] = []    # name, path, category, mtime, preview
        self.feats = np.zeros((0, FEATURE_DIM), np.float32)
        self.owner = np.zeros(0, np.int32)    # row -> entry index
        self.midi = np.zeros(0, np.float32)   # row -> MIDI note (nan = no pitch)
        self.meta: dict = {}

    # ------------------------------------------------------------ building
    def add(self, name: str, path: str, category: str, analyses: list[tuple[float | None, Analysis]],
            preview: str | None = None, mtime: float | None = None) -> bool:
        rows = [(note, a) for note, a in analyses if not a.silent]
        if not rows:
            return False
        self.remove(path)
        idx = len(self.entries)
        self.entries.append({"name": name, "path": str(path), "category": category,
                             "mtime": mtime, "preview": preview})
        self.feats = np.vstack([self.feats] + [a.features[None] for _, a in rows])
        self.owner = np.concatenate([self.owner, np.full(len(rows), idx, np.int32)])
        # the pitch actually heard (a preset may be shifted by octaves); nan = no clear pitch
        notes = [a.midi if a.midi is not None else np.nan for _, a in rows]
        self.midi = np.concatenate([self.midi, np.array(notes, np.float32)])
        return True

    def remove(self, path: str) -> None:
        hits = [i for i, e in enumerate(self.entries) if e["path"] == str(path)]
        for i in reversed(hits):
            keep = self.owner != i
            self.feats, self.midi, owner = self.feats[keep], self.midi[keep], self.owner[keep]
            self.owner = np.where(owner > i, owner - 1, owner).astype(np.int32)
            del self.entries[i]

    def is_current(self, path: str, mtime: float) -> bool:
        return any(e["path"] == str(path) and e.get("mtime") == mtime for e in self.entries)

    def __len__(self) -> int:
        return len(self.entries)

    # ------------------------------------------------------------ persistence
    def save(self, directory: str | os.PathLike) -> None:
        d = Path(directory)
        d.mkdir(parents=True, exist_ok=True)
        tmp = d / "features.tmp.npz"
        np.savez_compressed(tmp, feats=self.feats, owner=self.owner, midi=self.midi)
        os.replace(tmp, d / "features.npz")
        meta = dict(self.meta, version=INDEX_VERSION, feature_dim=FEATURE_DIM, entries=self.entries)
        tmpj = d / "index.tmp.json"
        tmpj.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmpj, d / "index.json")

    @classmethod
    def load(cls, directory: str | os.PathLike) -> "PresetIndex":
        d = Path(directory)
        idx = cls()
        if not (d / "index.json").exists():
            return idx
        meta = json.loads((d / "index.json").read_text(encoding="utf-8"))
        if meta.get("version") != INDEX_VERSION or meta.get("feature_dim") != FEATURE_DIM:
            raise RuntimeError("Индекс создан другой версией программы — постройте его заново.")
        idx.entries = meta.pop("entries")
        idx.meta = meta
        z = np.load(d / "features.npz")
        idx.feats, idx.owner, idx.midi = z["feats"], z["owner"], z["midi"]
        return idx

    # ------------------------------------------------------------ matching
    def _scales(self) -> np.ndarray:
        if len(self.feats) < 2:
            return np.full(FEATURE_DIM, 0.2, np.float32)
        return np.maximum(self.feats.std(axis=0), MIN_SCALE)

    def search(self, query: Analysis, top: int = 20, weights: dict[str, float] | None = None,
               categories: list[str] | None = None) -> list[Match]:
        if not len(self.entries):
            return []
        if query.silent:
            raise ValueError("Сэмпл пустой или слишком тихий.")
        w = dict(DEFAULT_WEIGHTS, **(weights or {}))
        scales = self._scales()
        diff = (self.feats - query.features[None]) / scales[None]
        sl = group_slices()

        # per-group RMS distance, so long groups don't dominate short ones
        gd = {g: np.sqrt(np.mean(diff[:, s] ** 2, axis=1)) for g, s in sl.items()}
        row_pitched = np.isfinite(self.midi)
        harm_ok = row_pitched & (query.f0 is not None)
        total = np.zeros(len(self.feats))
        wsum = np.zeros(len(self.feats))
        for g in GROUPS:
            wg = np.full(len(self.feats), w.get(g, 0.0))
            if g == "harmonics":
                wg = np.where(harm_ok, wg, 0.0)
            total += wg * gd[g]
            wsum += wg
        dist = total / np.maximum(wsum, 1e-9)
        # an unpitched sample shouldn't match a clearly pitched preset (and vice versa)
        dist += np.where(row_pitched != (query.f0 is not None), 0.3, 0.0)

        # choose, for every preset, the fingerprint rendered closest to the sample pitch
        qmidi = query.midi
        best: dict[int, int] = {}
        for row in range(len(self.feats)):
            e = int(self.owner[row])
            if e not in best:
                best[e] = row
                continue
            cur = best[e]
            if qmidi is not None and np.isfinite(self.midi[row]) and np.isfinite(self.midi[cur]):
                dr, dc = abs(self.midi[row] - qmidi), abs(self.midi[cur] - qmidi)
                if dr < dc - 0.5 or (abs(dr - dc) <= 0.5 and dist[row] < dist[cur]):
                    best[e] = row
            elif dist[row] < dist[cur]:
                best[e] = row

        results = []
        for e, row in best.items():
            entry = self.entries[e]
            if categories and entry["category"] not in categories:
                continue
            d = float(dist[row])
            results.append(Match(
                name=entry["name"], path=entry["path"], category=entry["category"],
                distance=d, similarity=float(100 * np.exp(-d / 1.5)),
                note=None if not np.isfinite(self.midi[row]) else float(self.midi[row]),
                preview=entry.get("preview"),
                group_distances={g: float(gd[g][row]) for g in GROUPS},
            ))
        results.sort(key=lambda m: m.distance)
        return results[:top]
