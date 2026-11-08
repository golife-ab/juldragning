import { getGroupSnapshot } from "@/lib/db/groups";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: RouteCtx) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    const snapshot = await getGroupSnapshot(code, participantId);

    return NextResponse.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    const status = message.includes("hittades") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
