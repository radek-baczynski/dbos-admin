import { NextResponse } from "next/server";

export async function GET() {
  const required = Boolean(process.env.ADMIN_SECRET);
  return NextResponse.json({ authRequired: required });
}
