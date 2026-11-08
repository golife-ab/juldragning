import { runDraw } from "@/lib/db/groups";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: RouteCtx) {
  try {
    const { code } = await params;
    const body = (await request.json()) as { participantId?: string };

    if (!body.participantId) {
      return NextResponse.json(
        { error: "participantId krävs" },
        { status: 400 },
      );
    }

    const snapshot = await runDraw(code, body.participantId);
    return NextResponse.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    let status = 500;
    if (message.includes("organisatören")) status = 403;
    if (message.includes("redan")) status = 409;
    if (message.includes("Minst tre")) status = 400;
    return NextResponse.json({ error: message }, { status });
  }
}
