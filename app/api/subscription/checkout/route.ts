import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

    // Check if this is an authenticated user or signup flow
    const token = req.headers.get("Authorization")?.split(" ")[1];
    let user = null;

    if (token) {
      // Existing authenticated user flow
      const decoded = verifyJWT(token) as { userId: string; email: string };
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (!email) {
      // No token and no email provided
      return NextResponse.json({ error: "Email is required for signup" }, { status: 400 });
    }

    // Validate the price ID exists in your plans
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [{ stripePriceId: priceId }, { stripeDevPriceId: priceId }],
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user?.stripeCustomerId || undefined,
      customer_email: user?.stripeCustomerId ? undefined : (user?.email || email),
      client_reference_id: user?.id || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/register`,
      billing_address_collection: "required",
      metadata: {
        signup_email: email || "",
        is_signup: user ? "false" : "true",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
