import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin"],
  ADMIN: ["/admin"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
  PARENT: ["/parent"],
  ACCOUNTANT: ["/accountant"],
  RECEPTIONIST: ["/receptionist"],
  LIBRARIAN: ["/librarian"],
  EXAM_CONTROLLER: ["/exam-controller"],
  STORE_MANAGER: ["/store"],
  HOSTEL_WARDEN: ["/hostel"],
  DRIVER: ["/transport"],
};

const publicPaths = ["/login", "/register", "/api/auth", "/_next", "/favicon", "/unauthorized"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read session from cookie (JWT)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)"],
};
