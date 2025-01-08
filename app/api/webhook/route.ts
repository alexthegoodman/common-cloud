import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const header = await headers();
    const signature = header.get("stripe-signature")!;

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Should run before customer.subscription.created
        // If this is a new subscription, update the user with the customer ID
        if (session.customer && session.client_reference_id) {
          await prisma.user.update({
            where: { id: session.client_reference_id },
            data: {
              stripeCustomerId: session.customer as string,
            },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0].price.id;

        // Find the corresponding plan in your database
        const plan = await prisma.plan.findFirst({
          where: {
            OR: [{ stripePriceId: priceId }, { stripeDevPriceId: priceId }],
          },
        });

        if (!plan) {
          console.error("Plan not found for price ID:", priceId);
          return NextResponse.json(
            { error: "Plan not found" },
            { status: 400 }
          );
        }

        // Map Stripe status to your SubscriptionStatus enum
        const statusMap: Record<
          Stripe.Subscription.Status,
          | "ACTIVE"
          | "INACTIVE"
          | "TRIALING"
          | "PAST_DUE"
          | "CANCELED"
          | "UNPAID"
        > = {
          active: "ACTIVE",
          canceled: "CANCELED",
          incomplete: "INACTIVE",
          incomplete_expired: "INACTIVE",
          past_due: "PAST_DUE",
          trialing: "TRIALING",
          unpaid: "UNPAID",
          paused: "INACTIVE",
        };

        // Update user subscription details
        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionId: subscription.id,
            subscriptionStatus: statusMap[subscription.status],
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            planId: plan.id,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionStatus: "CANCELED",
            subscriptionId: null,
            planId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEndsAt: null,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await prisma.user.update({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              subscriptionStatus: "ACTIVE",
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await prisma.user.update({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              subscriptionStatus: "PAST_DUE",
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Configure the webhook handler to accept raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
