import { getParticipantAssignment } from "@/lib/db/groups";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteCtx) {
  try {
    const { id } = await params;
    const result = await getParticipantAssignment(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    const status = message.includes("hittades") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
