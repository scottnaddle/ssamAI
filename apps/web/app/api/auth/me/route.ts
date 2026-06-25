import { NextRequest, NextResponse } from "next/server";
import { decodeJwtSubject, extractBearerToken } from "@/lib/librechat";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const claims = decodeJwtSubject(token);
  if (!claims || !claims.userId) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
  return NextResponse.json({
    id: claims.userId,
    username: claims.username,
    email: claims.email,
    name: claims.name ?? claims.username,
    role: claims.role,
  });
}
