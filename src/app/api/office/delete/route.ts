import { currentSession } from "@/lib/server/admin-auth";
import { remove } from "@/lib/server/booking-store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await currentSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  let body: { reference?: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const { reference } = body;
  if (!reference || typeof reference !== "string") {
    return new NextResponse("Missing reference", { status: 400 });
  }

  await remove(reference);
  return NextResponse.json({ success: true });
}
