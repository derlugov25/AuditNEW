import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Report } from "@/components/pdf/Report";
import { calculateScore } from "@/lib/scoring";
import { buildAccelerators, buildProtectors } from "@/lib/insights";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as { answers?: Partial<Answers> };
    const answers: Answers = { ...INITIAL_ANSWERS, ...(payload.answers ?? {}) };

    if (!answers.age || !answers.goal) {
      return new Response(JSON.stringify({ error: "Incomplete answers" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const score = calculateScore(answers);
    const accelerators = buildAccelerators(answers, score);
    const protectors = buildProtectors(score);

    const element = React.createElement(Report, {
      answers,
      score,
      accelerators,
      protectors,
    }) as unknown as Parameters<typeof renderToBuffer>[0];

    const pdfBuffer = await renderToBuffer(element);
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength,
    ) as ArrayBuffer;

    const fileBase = (answers.name ?? "report").toString().trim() || "report";
    const asciiSafe = fileBase.replace(/[^A-Za-z0-9_-]+/g, "_") || "report";
    const utf8Filename = encodeURIComponent(`Longy-audit-${fileBase}.pdf`);

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Longy-audit-${asciiSafe}.pdf"; filename*=UTF-8''${utf8Filename}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF generation failed", e);
    return new Response(JSON.stringify({ error: "PDF generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
