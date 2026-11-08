import { joinGroup } from "@/lib/db/groups";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      inviteCode?: string;
      displayName?: string;
    };

    if (!body.inviteCode?.trim() || !body.displayName?.trim()) {
      return NextResponse.json(
        { error: "Kod och namn krävs" },
        { status: 400 },
      );
    }

    const result = await joinGroup({
      inviteCode: body.inviteCode,
      displayName: body.displayName,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    const status =
      message.includes("hittades") || message.includes("Ogiltig")
        ? 404
        : message.includes("redan")
          ? 409
          : message.includes("konfigurerat")
            ? 503
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
