import { currentSession } from "@/lib/server/admin-auth";
import { remove } from "@/lib/server/booking-store";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
  console.log("Delete request received for reference:", reference);
  
  if (!reference || typeof reference !== "string") {
    console.log("Missing or invalid reference");
    return new NextResponse("Missing reference", { status: 400 });
  }

  try {
    await remove(reference);
    console.log("Successfully removed:", reference);
    revalidatePath("/office");
  } catch (error) {
    console.error("Error in remove:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
