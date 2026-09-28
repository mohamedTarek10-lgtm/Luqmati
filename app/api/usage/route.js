import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    return NextResponse.json({ unlimited: true });
  } catch (err) {
    console.error("[Luqmati] Usage check error:", err);
    return NextResponse.json({ unlimited: true });
  }
}
