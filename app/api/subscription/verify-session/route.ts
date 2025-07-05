import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Check if the session was paid
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Get the email from session metadata or customer email
    const email = session.metadata?.signup_email || session.customer_email;

    if (!email) {
      return NextResponse.json({ error: "Email not found in session" }, { status: 400 });
    }

    return NextResponse.json({ 
      email,
      sessionId: session.id,
      subscriptionId: session.subscription
    });
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}