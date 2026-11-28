"""Command line: build the index and match samples."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

DEFAULT_INDEX = str(Path.home() / "SerumMatcher" / "index")


LINE_PROGRESS = False   # --progress-lines: one parseable line per preset (used by the GUI)


def _progress(i: int, n: int, name: str) -> None:
    if LINE_PROGRESS:
        print(f"PROGRESS\t{i}\t{n}\t{name}", flush=True)
        return
    sys.stdout.write(f"\r[{i}/{n}] {name[:60]:<60}")
    sys.stdout.flush()


def _note_name(midi: float | None) -> str:
    if midi is None:
        return "—"
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    m = int(round(midi))
    return f"{names[m % 12]}{m // 12 - 2}"   # Serum/Ableton naming: 60 = C3


def cmd_index(a) -> None:
    from .render import common_preset_dirs, common_serum_paths, index_serum

    serum = a.serum or next(iter(common_serum_paths()), None)
    presets = a.presets or next(iter(common_preset_dirs()), None)
    if not serum:
        sys.exit("Укажите путь к Serum: --serum \"C:\\Program Files\\VSTPlugins\\Serum_x64.dll\"")
    if not presets:
        sys.exit("Укажите папку пресетов: --presets \"...\\Serum Presets\\Presets\"")
    notes = [int(n) for n in a.notes.split(",")]
    print(f"Serum:    {serum}\nПресеты:  {presets}\nИндекс:   {a.index}\nНоты:     {notes}")
    idx = index_serum(presets, serum, a.index, notes, previews=not a.no_previews, progress=_progress)
    _report(idx)


def cmd_index_audio(a) -> None:
    from .render import index_audio

    idx = index_audio(a.audio, a.index, progress=_progress)
    _report(idx)


def _report(idx) -> None:
    print(f"\nГотово: в индексе {len(idx)} пресетов.")
    errs = idx.meta.get("errors", [])
    if errs:
        print(f"Пропущено {len(errs)}:")
        for path, why in errs[:20]:
            print(f"  {Path(path).name}: {why}")


def cmd_match(a) -> None:
    from .features import analyze_file
    from .library import PresetIndex

    idx = PresetIndex.load(a.index)
    if not len(idx):
        sys.exit(f"Индекс пуст ({a.index}). Сначала выполните: index")
    q = analyze_file(a.sample)
    print(f"Сэмпл: {Path(a.sample).name}   нота: {_note_name(q.midi)}"
          f"{'' if q.f0 else '  (без явной высоты — шум/перкуссия)'}\n")
    res = idx.search(q, top=a.top, categories=a.category)
    w = max([len(m.name) for m in res] + [10])
    print(f"{'#':>3}  {'Пресет':<{w}}  {'Сходство':>8}  Папка")
    for i, m in enumerate(res, 1):
        print(f"{i:>3}  {m.name:<{w}}  {m.similarity:7.1f}%  {m.category}")
    if a.explain and res:
        print("\nРасхождение по аспектам (меньше = ближе):")
        for m in res[:5]:
            parts = ", ".join(f"{g} {d:.2f}" for g, d in m.group_distances.items())
            print(f"  {m.name}: {parts}")


def main(argv=None) -> None:
    p = argparse.ArgumentParser(prog="serum-matcher",
                                description="Ищет в вашей библиотеке Serum пресеты, похожие на сэмпл.")
    p.add_argument("--index", default=DEFAULT_INDEX, help=f"папка индекса (по умолчанию {DEFAULT_INDEX})")
    p.add_argument("--progress-lines", action="store_true", help=argparse.SUPPRESS)
    sub = p.add_subparsers(dest="cmd")

    s = sub.add_parser("index", help="отрендерить пресеты Serum и построить индекс")
    s.add_argument("--presets", help="папка с .fxp (подпапки тоже)")
    s.add_argument("--serum", help="путь к Serum VST2 (Serum_x64.dll / Serum.vst)")
    s.add_argument("--notes", default="36,48,60,72", help="MIDI-ноты для рендера (60 = C3)")
    s.add_argument("--no-previews", action="store_true", help="не сохранять превью для прослушивания")
    s.set_defaults(func=cmd_index)

    s = sub.add_parser("index-audio", help="построить индекс из готовых аудио (1 файл = 1 пресет)")
    s.add_argument("audio")
    s.set_defaults(func=cmd_index_audio)

    s = sub.add_parser("match", help="найти похожие пресеты")
    s.add_argument("sample")
    s.add_argument("--top", type=int, default=20)
    s.add_argument("--category", action="append", help="искать только в этой папке (можно несколько)")
    s.add_argument("--explain", action="store_true", help="показать, чем отличаются лучшие")
    s.set_defaults(func=cmd_match)

    s = sub.add_parser("gui", help="окно с перетаскиванием сэмпла")
    s.set_defaults(func=lambda a: __import__("serum_matcher.gui", fromlist=["run"]).run(a.index))

    args = p.parse_args(argv)
    global LINE_PROGRESS
    LINE_PROGRESS = args.progress_lines
    if not args.cmd:
        from .gui import run
        run(args.index)
        return
    args.func(args)


if __name__ == "__main__":
    main()
