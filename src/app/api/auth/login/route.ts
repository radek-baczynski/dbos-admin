import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "dbos_admin_auth";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Login is not configured" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const submitted = typeof body.secret === "string" ? body.secret : "";

  if (submitted !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
