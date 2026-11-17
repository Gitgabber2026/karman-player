"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-sm text-danger">signal lost</div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Не удалось загрузить страницу</h1>
      <p className="mt-3 text-ink-2">Попробуйте ещё раз. / Something went wrong.</p>
      <button onClick={reset} className="mt-6 rounded-full border border-line-2 px-5 py-2.5 text-sm hover:border-cyan hover:text-cyan">Повторить / Retry</button>
    </div>
  );
}
