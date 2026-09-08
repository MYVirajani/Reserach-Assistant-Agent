import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic || typeof topic !== "string") {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/agent/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });

  if (!backendRes.ok || !backendRes.body) {
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }


  const reader = backendRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let report: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });


    const messages = buffer.split("\n\n");
    buffer = messages.pop() || ""; 

    for (const msg of messages) {
      const line = msg.replace(/^data: /, "").trim();
      if (!line) continue;

      try {
        const event = JSON.parse(line);
        if (event.type === "result") {
          report = event.report;
        }
      } catch {
        
      }
    }
  }

  if (!report) {
    return NextResponse.json(
      { error: "Agent did not return a report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ report });
}