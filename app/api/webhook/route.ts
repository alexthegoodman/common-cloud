import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const fulfillOrder = async (session: Stripe.Checkout.Session) => {
  const userId = session.client_reference_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!userId || typeof customerId !== "string") {
    console.error("fulfillOrder", "userId or customerId not found");
    return;
  }

  console.info("fulfillOrder", userId, customerId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeCustomerId: customerId,
      // subscription: "STANDARD",
      // frequency: "MONTHLY",
    },
  });
};

const updateSubscriptionStatus = async (
  customerId: string,
  subscriptionData: {
    subscriptionId?: string | null;
    subscriptionStatus?:
      | "ACTIVE"
      | "INACTIVE"
      | "TRIALING"
      | "PAST_DUE"
      | "CANCELED"
      | "UNPAID";
    currentPeriodEnd?: Date | null;
    planId?: string | null;
    cancelAtPeriodEnd?: boolean;
    trialEndsAt?: Date | null;
  }
) => {
  // Check if user exists first
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.log("User not found for customer:", customerId);
    return;
  }

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: subscriptionData,
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const header = await headers();
    const signature = header.get("stripe-signature")!;

    console.info("begin stripe handler");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        console.info("checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid") {
          await fulfillOrder(session);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        console.info("checkout.session.async_payment_succeeded");
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillOrder(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        console.error("checkout.session.async_payment_failed");
        // Handle failed payment if needed
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0].price.id;

        // Find the corresponding plan
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

        // Map Stripe status to your enum
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

        await updateSubscriptionStatus(subscription.customer as string, {
          subscriptionId: subscription.id,
          subscriptionStatus: statusMap[subscription.status],
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          planId: plan.id,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await updateSubscriptionStatus(subscription.customer as string, {
          subscriptionStatus: "CANCELED",
          subscriptionId: null,
          planId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await updateSubscriptionStatus(invoice.customer as string, {
            subscriptionStatus: "ACTIVE",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await updateSubscriptionStatus(invoice.customer as string, {
            subscriptionStatus: "PAST_DUE",
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

export const config = {
  api: {
    bodyParser: false,
  },
};
