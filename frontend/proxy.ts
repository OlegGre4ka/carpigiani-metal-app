import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlProxy = createMiddleware(routing);

// Hidden admin panel. Pages that work without logging in:
const ADMIN = "/fofkas-adminpanel";
const PUBLIC_ADMIN_PAGES = ["/login", "/forgot-password", "/reset-password", "/logout"];
// The old site showed 16 news per page
const OLD_NEWS_PER_PAGE = 16;

// The new address is built from the address the browser asked for (nextUrl), not from the
// server's own one: inside Docker the server sees itself as 0.0.0.0:3000, which does not open.
function goTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN || pathname.startsWith(`${ADMIN}/`)) {
    const page = pathname.slice(ADMIN.length) || "/";
    const loggedIn = request.cookies.has("access_token");

    // Not logged in: every admin page except the login forms opens the login page
    if (!loggedIn && !PUBLIC_ADMIN_PAGES.includes(page)) {
      return goTo(request, `${ADMIN}/login`);
    }
    // Already logged in: skip the login page
    if (loggedIn && page === "/login") {
      return goTo(request, ADMIN);
    }

    // Admin pages are never shown in Google. Not listed in robots.txt on purpose:
    // that file is public and would reveal the hidden address.
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Old pages of the list of news (16 per page): /news?start=16 → /news?page=2
  const start = request.nextUrl.searchParams.get("start");
  if (pathname === "/news" && start !== null) {
    const page = Math.floor(Number(start) / OLD_NEWS_PER_PAGE) + 1;
    const url = request.nextUrl.clone();
    url.search = Number.isInteger(page) && page > 1 ? `?page=${page}` : "";
    return NextResponse.redirect(url, 308);
  }

  // The public site: language from the address (/en = English)
  return intlProxy(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
