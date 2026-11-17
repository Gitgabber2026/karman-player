import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-sm text-cyan">404 · off the map</div>
      <h1 className="mt-4 font-display text-4xl font-semibold">Этой точки нет на карте</h1>
      <p className="mt-3 text-ink-2">Страница не найдена или объект ещё не добавлен в атлас. / This place is not in the atlas.</p>
      <Link href="/" className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg hover:bg-acid">← Atlas</Link>
    </div>
  );
}
