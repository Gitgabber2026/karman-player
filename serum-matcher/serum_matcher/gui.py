"""Window: drop a sample, get similar Serum presets."""
from __future__ import annotations

import json
import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from .cli import DEFAULT_INDEX, _note_name

try:  # optional: real drag & drop from Explorer/Finder
    from tkinterdnd2 import DND_FILES, TkinterDnD
except Exception:  # pragma: no cover
    TkinterDnD = None

CONFIG = Path.home() / "SerumMatcher" / "config.json"


def _load_cfg() -> dict:
    try:
        return json.loads(CONFIG.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_cfg(cfg: dict) -> None:
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding="utf-8")


def play(path: str) -> None:
    if not path or not Path(path).exists():
        return
    if sys.platform.startswith("win"):
        if path.lower().endswith(".wav"):
            import winsound
            winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        else:
            os.startfile(path)  # type: ignore[attr-defined]
    elif sys.platform == "darwin":
        subprocess.Popen(["afplay", path])
    else:
        for player in (["paplay", path], ["aplay", "-q", path], ["xdg-open", path]):
            try:
                subprocess.Popen(player)
                return
            except FileNotFoundError:
                continue


def reveal(path: str) -> None:
    if sys.platform.startswith("win"):
        subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
    elif sys.platform == "darwin":
        subprocess.Popen(["open", "-R", path])
    else:
        subprocess.Popen(["xdg-open", str(Path(path).parent)])


class App:
    def __init__(self, index_dir: str):
        self.index_dir = index_dir
        self.root = TkinterDnD.Tk() if TkinterDnD else tk.Tk()
        self.root.title("Serum Matcher — поиск похожих пресетов")
        self.root.geometry("820x640")
        self.root.minsize(600, 480)
        self.cfg = _load_cfg()
        self.q: queue.Queue = queue.Queue()
        self.index = None
        self.sample: str | None = None
        self.results = []
        self.stop_flag = False
        self.busy = False
        self._build()
        self._load_index()
        self.root.after(100, self._poll)

    # ------------------------------------------------------------ layout
    def _build(self) -> None:
        pad = {"padx": 8, "pady": 4}
        top = ttk.LabelFrame(self.root, text="Библиотека")
        top.pack(fill="x", **pad)
        top.columnconfigure(1, weight=1)

        from .render import common_preset_dirs, common_serum_paths
        self.serum_var = tk.StringVar(value=self.cfg.get("serum") or next(iter(common_serum_paths()), ""))
        self.presets_var = tk.StringVar(value=self.cfg.get("presets") or next(iter(common_preset_dirs()), ""))

        ttk.Label(top, text="Serum (VST2):").grid(row=0, column=0, sticky="w", **pad)
        ttk.Entry(top, textvariable=self.serum_var).grid(row=0, column=1, sticky="ew", **pad)
        ttk.Button(top, text="…", width=3, command=self._pick_serum).grid(row=0, column=2, **pad)
        ttk.Label(top, text="Папка пресетов:").grid(row=1, column=0, sticky="w", **pad)
        ttk.Entry(top, textvariable=self.presets_var).grid(row=1, column=1, sticky="ew", **pad)
        ttk.Button(top, text="…", width=3, command=self._pick_presets).grid(row=1, column=2, **pad)

        row = ttk.Frame(top)
        row.grid(row=2, column=0, columnspan=3, sticky="ew", **pad)
        self.index_btn = ttk.Button(row, text="Построить / обновить индекс", command=self._start_index)
        self.index_btn.pack(side="left")
        ttk.Button(row, text="Из папки с аудио…", command=self._start_index_audio).pack(side="left", padx=6)
        self.progress = ttk.Progressbar(row, mode="determinate")
        self.progress.pack(side="left", fill="x", expand=True, padx=6)
        self.status = tk.StringVar()
        ttk.Label(top, textvariable=self.status, foreground="#555").grid(row=3, column=0, columnspan=3, sticky="w", **pad)

        hint = "Перетащите сэмпл сюда\nили нажмите, чтобы выбрать файл"
        if not TkinterDnD:
            hint = "Нажмите, чтобы выбрать сэмпл\n(для перетаскивания: pip install tkinterdnd2)"
        self.drop = tk.Label(self.root, text=hint, relief="groove", bd=2, height=5,
                             font=("Segoe UI", 13), bg="#eef0ff", fg="#3a3a7a", cursor="hand2")
        self.drop.pack(fill="x", **pad)
        self.drop.bind("<Button-1>", lambda e: self._pick_sample())
        if TkinterDnD:
            self.drop.drop_target_register(DND_FILES)
            self.drop.dnd_bind("<<Drop>>", self._on_drop)
            self.drop.dnd_bind("<<DragEnter>>", lambda e: self.drop.configure(bg="#d8dcff"))
            self.drop.dnd_bind("<<DragLeave>>", lambda e: self.drop.configure(bg="#eef0ff"))

        mid = ttk.Frame(self.root)
        mid.pack(fill="both", expand=True, **pad)
        cols = ("n", "name", "sim", "note", "cat")
        self.tree = ttk.Treeview(mid, columns=cols, show="headings", selectmode="browse")
        for c, title, w, anchor in [("n", "#", 40, "e"), ("name", "Пресет", 280, "w"),
                                    ("sim", "Сходство", 90, "e"), ("note", "Нота", 60, "center"),
                                    ("cat", "Папка", 260, "w")]:
            self.tree.heading(c, text=title)
            self.tree.column(c, width=w, anchor=anchor, stretch=c in ("name", "cat"))
        sb = ttk.Scrollbar(mid, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")
        self.tree.bind("<Double-1>", lambda e: self._play_selected())
        self.tree.bind("<Return>", lambda e: self._play_selected())

        bottom = ttk.Frame(self.root)
        bottom.pack(fill="x", **pad)
        ttk.Button(bottom, text="▶ Превью пресета", command=self._play_selected).pack(side="left")
        ttk.Button(bottom, text="▶ Сэмпл", command=lambda: play(self.sample or "")).pack(side="left", padx=6)
        ttk.Button(bottom, text="Показать .fxp в папке", command=self._reveal_selected).pack(side="left")
        self.top_var = tk.IntVar(value=30)
        ttk.Spinbox(bottom, from_=5, to=200, width=5, textvariable=self.top_var,
                    command=self._rematch).pack(side="right", padx=4)
        ttk.Label(bottom, text="Показать:").pack(side="right")

    # ------------------------------------------------------------ index
    def _load_index(self) -> None:
        from .library import PresetIndex
        try:
            self.index = PresetIndex.load(self.index_dir)
        except Exception as e:
            self.index = None
            self.status.set(str(e))
            return
        n = len(self.index)
        self.status.set(f"В индексе {n} пресетов." if n else
                        "Индекс пуст: укажите Serum и папку пресетов и нажмите «Построить индекс».")

    def _pick_serum(self) -> None:
        ft = [("VST2 плагин", "*.dll *.vst"), ("Все файлы", "*.*")]
        p = filedialog.askopenfilename(title="Serum_x64.dll", filetypes=ft)
        if p:
            self.serum_var.set(p)

    def _pick_presets(self) -> None:
        p = filedialog.askdirectory(title="Папка с пресетами Serum")
        if p:
            self.presets_var.set(p)

    def _run_bg(self, fn, done_msg: str) -> None:
        self.busy, self.stop_flag = True, False
        self.index_btn.configure(text="Стоп", command=self._stop)

        def progress(i, n, name):
            self.q.put(("progress", i, n, name))

        def work():
            try:
                fn(progress)
                self.q.put(("index_done", done_msg))
            except Exception as e:
                self.q.put(("error", f"Ошибка индексации: {e}"))
        threading.Thread(target=work, daemon=True).start()

    def _start_index(self) -> None:
        if self.busy:
            return
        serum, presets = self.serum_var.get().strip(), self.presets_var.get().strip()
        if not Path(serum).exists():
            messagebox.showerror("Serum", "Укажите файл плагина Serum (VST2: Serum_x64.dll).")
            return
        if not Path(presets).is_dir():
            messagebox.showerror("Пресеты", "Укажите папку с пресетами Serum (.fxp).")
            return
        self.cfg.update(serum=serum, presets=presets)
        _save_cfg(self.cfg)
        self.busy, self.stop_flag, self.restarts = True, False, 0
        self.index_btn.configure(text="Стоп", command=self._stop)
        args = ["--index", self.index_dir, "--progress-lines", "index", "--presets", presets, "--serum", serum]
        threading.Thread(target=self._run_child, args=(args,), daemon=True).start()

    def _run_child(self, args: list[str]) -> None:
        """Serum runs in a separate process: a preset that crashes the plugin
        cannot take the window down, and the run resumes past that preset."""
        env = dict(os.environ, PYTHONIOENCODING="utf-8")
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        cwd = str(Path(__file__).resolve().parents[1])
        while True:
            self.proc = subprocess.Popen([sys.executable, "-m", "serum_matcher", *args], cwd=cwd, env=env,
                                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                         encoding="utf-8", errors="replace", creationflags=flags)
            tail: list[str] = []
            for line in self.proc.stdout:
                parts = line.rstrip("\n").split("\t")
                if parts[0] == "PROGRESS" and len(parts) == 4:
                    self.q.put(("progress", int(parts[1]), int(parts[2]), parts[3]))
                elif line.strip():
                    tail = (tail + [line.strip()])[-8:]
            code = self.proc.wait()
            if self.stop_flag:
                # killed on purpose: the preset being rendered is not a crasher
                (Path(self.index_dir) / "_current.txt").unlink(missing_ok=True)
                self.q.put(("index_done", "Остановлено."))
                return
            if code == 0:
                self.q.put(("index_done", "Индекс построен."))
                return
            crashed_now = (Path(self.index_dir) / "_current.txt").exists()
            self.restarts += 1
            if not crashed_now or self.restarts > 50:
                self.q.put(("error", "Индексация прервалась:\n" + "\n".join(tail)))
                return
            self.q.put(("progress_note", "Serum упал на пресете — пропускаю его и продолжаю…"))

    def _start_index_audio(self) -> None:
        if self.busy:
            return
        d = filedialog.askdirectory(title="Папка с отрендеренными пресетами (1 файл = 1 пресет)")
        if not d:
            return
        from .render import index_audio
        self._run_bg(lambda pr: index_audio(d, self.index_dir, progress=pr,
                                            should_stop=lambda: self.stop_flag), "Индекс построен.")

    def _stop(self) -> None:
        self.stop_flag = True
        proc = getattr(self, "proc", None)
        if proc and proc.poll() is None:
            proc.terminate()
        self.status.set("Останавливаю… (уже обработанное сохранится)")

    # ------------------------------------------------------------ matching
    def _on_drop(self, event) -> None:
        self.drop.configure(bg="#eef0ff")
        files = self.root.tk.splitlist(event.data)
        if files:
            self._match(files[0])

    def _pick_sample(self) -> None:
        ft = [("Аудио", "*.wav *.aif *.aiff *.flac *.mp3 *.ogg"), ("Все файлы", "*.*")]
        p = filedialog.askopenfilename(title="Сэмпл", filetypes=ft)
        if p:
            self._match(p)

    def _rematch(self) -> None:
        if self.sample:
            self._match(self.sample)

    def _match(self, path: str) -> None:
        if not self.index or not len(self.index):
            messagebox.showinfo("Индекс пуст", "Сначала постройте индекс пресетов.")
            return
        self.sample = path
        self.drop.configure(text=f"{Path(path).name}\nанализ…")
        top = int(self.top_var.get() or 30)

        def work():
            try:
                from .features import analyze_file
                q = analyze_file(path)
                res = self.index.search(q, top=top)
                self.q.put(("results", path, q, res))
            except Exception as e:
                self.q.put(("error", f"Не удалось обработать сэмпл: {e}"))
        threading.Thread(target=work, daemon=True).start()

    def _selected(self):
        sel = self.tree.selection()
        return self.results[int(sel[0])] if sel else None

    def _play_selected(self) -> None:
        m = self._selected()
        if m:
            play(m.preview or "")

    def _reveal_selected(self) -> None:
        m = self._selected()
        if m:
            reveal(m.path)

    # ------------------------------------------------------------ events
    def _poll(self) -> None:
        try:
            while True:
                msg = self.q.get_nowait()
                kind = msg[0]
                if kind == "progress":
                    _, i, n, name = msg
                    self.progress.configure(maximum=n, value=i)
                    self.status.set(f"[{i}/{n}] {name}")
                elif kind == "progress_note":
                    self.status.set(msg[1])
                elif kind == "index_done":
                    self.busy = False
                    self.index_btn.configure(text="Построить / обновить индекс", command=self._start_index)
                    self._load_index()
                    if msg[1] == "Остановлено.":
                        self.status.set(self.status.get() + "  Остановлено — нажмите кнопку ещё раз, чтобы продолжить.")
                    errs = self.index.meta.get("errors", []) if self.index else []
                    if errs:
                        self.status.set(self.status.get() + f"  Пропущено: {len(errs)} (FX/битые пресеты).")
                elif kind == "results":
                    _, path, q, res = msg
                    self.results = res
                    pitch = _note_name(q.midi) if q.f0 else "без высоты"
                    self.drop.configure(text=f"{Path(path).name}   ·   {pitch}\n"
                                             "перетащите другой сэмпл, чтобы искать снова")
                    self.tree.delete(*self.tree.get_children())
                    for i, m in enumerate(res):
                        self.tree.insert("", "end", iid=str(i), values=(
                            i + 1, m.name, f"{m.similarity:.0f}%", _note_name(m.note), m.category))
                    if res:
                        self.tree.selection_set("0")
                        self.tree.focus("0")
                elif kind == "error":
                    self.busy = False
                    self.index_btn.configure(text="Построить / обновить индекс", command=self._start_index)
                    self.drop.configure(text="Перетащите сэмпл сюда\nили нажмите, чтобы выбрать файл")
                    messagebox.showerror("Ошибка", msg[1])
        except queue.Empty:
            pass
        self.root.after(100, self._poll)

    def run(self) -> None:
        self.root.mainloop()


def run(index_dir: str = DEFAULT_INDEX) -> None:
    App(index_dir).run()
