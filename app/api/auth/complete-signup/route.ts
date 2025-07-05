import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { email, password, sessionId } = await req.json();

    if (!email || !password || !sessionId) {
      return NextResponse.json(
        { error: "Email, password, and session ID are required" },
        { status: 400 }
      );
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Invalid or unpaid session" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const customer = await stripe.customers.retrieve(
      session.customer as string
    );

    // Create user with subscription
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "New User", // Default name, can be updated later
        stripeCustomerId: session.customer as string,
        subscriptionId: session.subscription as string,
        subscriptionStatus: "ACTIVE",
        // currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Generate JWT token
    const jwtData = {
      userId: user.id,
      email: user.email,
      token: signJWT({ userId: user.id, email: user.email }).token,
    };

    return NextResponse.json({
      message: "Account created successfully",
      jwtData,
    });
  } catch (error) {
    console.error("Complete signup failed:", error);
    return NextResponse.json(
      { error: "Failed to complete signup" },
      { status: 500 }
    );
  }
}
