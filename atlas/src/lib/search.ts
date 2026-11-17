/**
 * Нормализация для поиска: регистр, диакритика, транслитерация кириллицы
 * и «фонетический ключ», который сближает варианты написания
 * (Бергхайн → berghain, Карл Кокс → carl cox, Трезор → tresor).
 */
const RU: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // грузинский алфавит (для названий тбилисских клубов)
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

export function transliterate(s: string): string {
  let out = "";
  for (const ch of s.toLowerCase()) out += RU[ch] ?? ch;
  return out;
}

export function normalize(s: string): string {
  return transliterate(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[&+]/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Фонетический ключ: устойчив к типичным расхождениям латиницы и транслита. */
export function phonetic(s: string): string {
  return normalize(s)
    .replace(/dzh/g, "j")
    .replace(/zh/g, "j")
    .replace(/kh/g, "h")
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/x/g, "ks")
    .replace(/[cq]/g, "k")
    .replace(/w/g, "v")
    .replace(/z/g, "s")
    .replace(/y/g, "i")
    .replace(/ee/g, "i")
    .replace(/(.)\1+/g, "$1");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Оценка совпадения запроса с набором названий (0 — нет совпадения). */
export function matchScore(query: string, names: string[]): number {
  const qn = normalize(query);
  const qp = phonetic(query);
  if (!qn) return 0;
  let best = 0;
  for (const name of names) {
    const n = normalize(name);
    const p = phonetic(name);
    if (!n) continue;
    let score = 0;
    if (n === qn || p === qp) score = 100;
    else if (n.startsWith(qn) || p.startsWith(qp)) score = 80;
    else if (n.split(" ").some((w) => w.startsWith(qn)) || p.split(" ").some((w) => w.startsWith(qp))) score = 65;
    else if (n.includes(qn) || p.includes(qp)) score = 45;
    else if (qp.length >= 4) {
      const words = p.split(" ");
      const limit = qp.length >= 8 ? 2 : 1;
      const candidates = [p, ...words, ...words.map((w) => w.slice(0, qp.length))];
      if (candidates.some((c) => Math.abs(c.length - qp.length) <= limit && levenshtein(c, qp) <= limit)) score = 25;
    }
    if (score > best) best = score;
    if (best === 100) break;
  }
  return best;
}
