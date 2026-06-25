import { NextRequest, NextResponse } from "next/server";
import { proxyAuth } from "@/lib/librechat";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyAuth(req, "logout");
}
