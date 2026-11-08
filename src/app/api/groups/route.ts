import { createGroup } from "@/lib/db/groups";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      organizerName?: string;
      name?: string;
    };

    if (!body.organizerName?.trim()) {
      return NextResponse.json(
        { error: "Organisatörens namn krävs" },
        { status: 400 },
      );
    }

    const result = await createGroup({
      organizerName: body.organizerName,
      name: body.name,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    const status = message.includes("konfigurerat") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
