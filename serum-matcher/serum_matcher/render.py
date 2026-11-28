"""Builds the index: renders every Serum preset through the real plugin
(or reads ready-made audio files) and stores their fingerprints."""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Callable, Iterable

import numpy as np

from .features import SR, analyze, load_audio, prepare
from .library import PresetIndex

PRESET_EXT = {".fxp"}
AUDIO_EXT = {".wav", ".aif", ".aiff", ".flac", ".ogg", ".mp3"}

DEFAULT_NOTES = (36, 48, 60, 72)   # C1, C2, C3, C4 in Serum/Ableton naming (C3 = 60)
VELOCITY = 100
HOLD_SEC = 1.5
SLOT_SEC = 4.0                     # one note per slot; the rest is release/tail
PREROLL_SEC = 0.5
PREVIEW_SR = 22050
PREVIEW_NOTE = 60

Progress = Callable[[int, int, str], None]


def common_serum_paths() -> list[str]:
    if sys.platform.startswith("win"):
        pf = os.environ.get("ProgramFiles", r"C:\Program Files")
        roots = [rf"{pf}\VSTPlugins", rf"{pf}\Steinberg\VSTPlugins", rf"{pf}\Common Files\VST2",
                 rf"{pf}\Common Files\Steinberg\VST2", rf"{pf}\VstPlugins\Xfer", rf"{pf}\Image-Line\FL Studio 21\Plugins\VST",
                 rf"{pf}\Image-Line\FL Studio 2024\Plugins\VST"]
        names = ["Serum_x64.dll", "Serum.dll", r"Xfer\Serum_x64.dll"]
    elif sys.platform == "darwin":
        roots = ["/Library/Audio/Plug-Ins/VST", os.path.expanduser("~/Library/Audio/Plug-Ins/VST")]
        names = ["Serum.vst"]
    else:
        roots, names = [], []
    return [str(Path(r) / n) for r in roots for n in names if (Path(r) / n).exists()]


def common_preset_dirs() -> list[str]:
    home = Path.home()
    cands = [home / "Documents" / "Xfer" / "Serum Presets" / "Presets",
             Path("/Library/Audio/Presets/Xfer Records/Serum Presets/Presets")]
    return [str(p) for p in cands if p.exists()]


def find_files(root: str, exts: set[str]) -> list[Path]:
    root_p = Path(root)
    return sorted(p for p in root_p.rglob("*") if p.suffix.lower() in exts and p.is_file())


def category_of(path: Path, root: str) -> str:
    rel = path.relative_to(root).parent
    return str(rel).replace("\\", "/") if str(rel) != "." else ""


def _save_preview(audio: np.ndarray, path: Path) -> None:
    import soundfile as sf
    from scipy.signal import resample_poly

    path.parent.mkdir(parents=True, exist_ok=True)
    mono = audio.mean(axis=0) if audio.ndim == 2 else audio
    mono = resample_poly(mono, PREVIEW_SR, SR)
    peak = np.max(np.abs(mono))
    if peak > 0:
        mono = mono / peak * 0.9
    sf.write(str(path), mono.astype(np.float32), PREVIEW_SR, subtype="PCM_16")


class SerumRenderer:
    """Loads Serum (VST2) once through DawDreamer and plays notes for each preset."""

    def __init__(self, plugin_path: str, notes: Iterable[int] = DEFAULT_NOTES):
        try:
            import dawdreamer as dd
        except ImportError as e:
            raise RuntimeError("Не установлен dawdreamer: pip install dawdreamer") from e
        if not Path(plugin_path).exists():
            raise FileNotFoundError(f"Не найден плагин Serum: {plugin_path}")
        self.notes = list(notes)
        self.engine = dd.RenderEngine(SR, 512)
        self.synth = self.engine.make_plugin_processor("serum", str(plugin_path))
        self.engine.load_graph([(self.synth, [])])

    def render(self, preset: str) -> np.ndarray:
        """Returns stereo audio (2, n): every note in its own slot."""
        if not self.synth.load_preset(str(Path(preset).resolve())):
            raise RuntimeError("плагин не принял пресет")
        self.synth.clear_midi()
        for i, note in enumerate(self.notes):
            self.synth.add_midi_note(note, VELOCITY, PREROLL_SEC + i * SLOT_SEC, HOLD_SEC)
        self.engine.render(PREROLL_SEC + len(self.notes) * SLOT_SEC)
        return np.asarray(self.engine.get_audio(), dtype=np.float32)

    def split(self, audio: np.ndarray) -> list[tuple[int, np.ndarray]]:
        out = []
        for i, note in enumerate(self.notes):
            a = int((PREROLL_SEC + i * SLOT_SEC) * SR)
            b = int((PREROLL_SEC + (i + 1) * SLOT_SEC) * SR)
            out.append((note, audio[:, a:b]))
        return out


def index_serum(preset_dir: str, plugin_path: str, index_dir: str, notes=DEFAULT_NOTES,
                previews: bool = True, progress: Progress | None = None,
                should_stop: Callable[[], bool] = lambda: False, renderer=None) -> PresetIndex:
    files = find_files(preset_dir, PRESET_EXT)
    if not files:
        raise FileNotFoundError(f"В папке нет пресетов .fxp: {preset_dir}")
    index = PresetIndex.load(index_dir)
    index.meta.update(mode="serum", preset_dir=str(preset_dir), plugin=str(plugin_path), notes=list(notes))
    # A preset that crashes the plugin kills the whole process. Before each render
    # its path is written to _current.txt; if that file survives, the previous run
    # died on it, and it is skipped from now on.
    idir = Path(index_dir)
    idir.mkdir(parents=True, exist_ok=True)
    current, crashed_file = idir / "_current.txt", idir / "crashed.txt"
    crashed = set(crashed_file.read_text(encoding="utf-8").splitlines()) if crashed_file.exists() else set()
    if current.exists():
        crashed.add(current.read_text(encoding="utf-8").strip())
        crashed_file.write_text("\n".join(sorted(crashed)), encoding="utf-8")
        current.unlink()
    errors = [(c, "падение Serum на этом пресете") for c in sorted(crashed) if c]
    renderer = renderer or SerumRenderer(plugin_path, notes)
    last_save = time.time()
    for n, f in enumerate(files, 1):
        if should_stop():
            break
        mtime = f.stat().st_mtime
        if progress:
            progress(n, len(files), f.stem)
        if index.is_current(str(f), mtime) or str(f) in crashed:
            continue
        current.write_text(str(f), encoding="utf-8")
        try:
            audio = renderer.render(str(f))
            analyses = []
            preview = None
            for note, part in renderer.split(audio):
                analyses.append((float(note), analyze(prepare(part, SR))))
                if previews and note == min(renderer.notes, key=lambda m: abs(m - PREVIEW_NOTE)):
                    preview = Path(index_dir) / "previews" / category_of(f, preset_dir) / (f.stem + ".wav")
                    _save_preview(part[:, : int(3 * SR)], preview)
            if not index.add(f.stem, str(f), category_of(f, preset_dir), analyses,
                             str(preview) if preview else None, mtime):
                errors.append((str(f), "тишина (FX-пресет или нужен вход)"))
        except Exception as e:  # one broken preset must not stop a 5000-preset run
            errors.append((str(f), str(e)))
        current.unlink(missing_ok=True)
        if time.time() - last_save > 30:
            index.save(index_dir)
            last_save = time.time()
    index.meta["errors"] = errors
    index.save(index_dir)
    return index


def index_audio(audio_dir: str, index_dir: str, progress: Progress | None = None,
                should_stop: Callable[[], bool] = lambda: False) -> PresetIndex:
    """Index a folder of audio files (one note per file, named after the preset)."""
    files = find_files(audio_dir, AUDIO_EXT)
    if not files:
        raise FileNotFoundError(f"В папке нет аудиофайлов: {audio_dir}")
    index = PresetIndex.load(index_dir)
    index.meta.update(mode="audio", audio_dir=str(audio_dir))
    errors = []
    for n, f in enumerate(files, 1):
        if should_stop():
            break
        if progress:
            progress(n, len(files), f.stem)
        mtime = f.stat().st_mtime
        if index.is_current(str(f), mtime):
            continue
        try:
            a = analyze(load_audio(str(f)))
            if not index.add(f.stem, str(f), category_of(f, audio_dir), [(None, a)], str(f), mtime):
                errors.append((str(f), "тишина"))
        except Exception as e:
            errors.append((str(f), str(e)))
    index.meta["errors"] = errors
    index.save(index_dir)
    return index
