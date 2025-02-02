"use client";

import PricingTable from "@/components/PricingTable";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function DashboardContent() {
  const { data } = useCurrentUser();

  console.info("data", data);

  return (
    <div>
      <h1>Welcome, {data?.email}</h1>
      <p>
        You are almost ready to use Stunts! Stunts is your pathway to rapid
        video creation using your own content. With Stunts generative keyframe
        animations, you can save hours on manual animating.
      </p>
      {data?.subscriptionStatus === "ACTIVE" ||
      data?.subscriptionStatus === "TRIALING" ? (
        <p>Download to get started</p>
      ) : (
        <>
          <p>Subscribe to get started</p>
          <PricingTable />
        </>
      )}
    </div>
  );
}
