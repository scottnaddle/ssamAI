import { NextResponse } from "next/server";
import { SKILL_DEFS } from "@/lib/skill-defs";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ skills: SKILL_DEFS });
}