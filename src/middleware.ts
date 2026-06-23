import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/utils/supabase/supabase.middleware";

const LOGIN_PATH = "/auth/login";

function decodeJwtPayload(accessToken: string): Record<string, unknown> {
  const [, payload] = accessToken.split(".");
  if (!payload) return {};

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64)) as Record<string, unknown>;
}

function redirectToLogin(request: NextRequest, returnPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("redirectTo", returnPath);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = await createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request, pathname);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return redirectToLogin(request, pathname);
  }

  const appMetadata = decodeJwtPayload(session.access_token).app_metadata as
    | Record<string, unknown>
    | undefined;

  if (appMetadata?.is_admin !== true) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
