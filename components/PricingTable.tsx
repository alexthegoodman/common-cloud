import React, { useEffect } from "react";

const StripePricingTable = ({ referenceId = null }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return React.createElement("stripe-pricing-table", {
    "pricing-table-id": process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID,
    "publishable-key": process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // TODO: client-reference-id
    "client-reference-id": referenceId,
  });
};

export default function PricingTable({ referenceId = null }) {
  return (
    <section>
      <StripePricingTable referenceId={referenceId} />
    </section>
  );
}
