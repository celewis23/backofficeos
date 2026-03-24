import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/inngest",
  "/book",
  "/portal",
  "/onboarding",
  "/_next",
  "/favicon.ico",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
