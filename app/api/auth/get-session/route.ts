import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";

export const runtime = "nodejs";

// Called by BA's client-side useSession() hook to hydrate session state.
export async function GET() {
  const result = await getServerSession();
  if (!result) return NextResponse.json(null);
  return NextResponse.json({
    user: result.user,
    session: { id: result.sessionId },
  });
}
