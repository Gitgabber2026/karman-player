import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["ru", "en"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return NextResponse.next();
  const accept = req.headers.get("accept-language") ?? "";
  // Основной язык — русский; английский выбирается, только если браузер не просит русский
  const locale = /\bru\b/i.test(accept) || !/\ben\b/i.test(accept) ? "ru" : "en";
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!api|_next|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\..*).*)"] };
