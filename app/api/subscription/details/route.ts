import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus, // ACTIVE INACTIVE TRIALING PAST_DUE CANCELED UNPAID
      currentPeriodEnd: user.currentPeriodEnd,
      plan: {
        id: user.plan?.id,
        name: user.plan?.name,
        description: user.plan?.description,
      },
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
