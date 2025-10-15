import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/register",
    "/auth/register-success",
    "/auth/pgp-login",
    "/api/auth/init-server-key",
    "/api/auth/register",
    "/api/auth/challenge",
    "/api/auth/verify",
    "/api/health/monero",
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow access to static files and public routes
  if (isPublicRoute || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // For protected routes, check for session cookie
  const sessionCookie = request.cookies.get("pgp-session")

  if (!sessionCookie) {
    // Redirect to login if no session
    const loginUrl = new URL("/auth/pgp-login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
