import { getCustomFilters } from "@/lib/custom-filters";
import { NextResponse } from "next/server";

export async function GET() {
  const customFilters = getCustomFilters();
  return NextResponse.json({ customFilters });
}
