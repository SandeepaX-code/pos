import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const adminRoles = new Set(["superAdmin", "admin"]);

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminApiRoute = request.nextUrl.pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!adminRoles.has(String(token.role ?? ""))) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
