"use client";

import PricingTable from "@/components/PricingTable";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function Dashboard() {
  const { data } = useCurrentUser();

  console.info("data", data);

  return (
    <div>
      <h1>Dashboard</h1>
      {data?.email}
      {data?.subscriptionStatus === "ACTIVE" ||
      data?.subscriptionStatus === "TRIALING" ? (
        <p>Download to get started</p>
      ) : (
        <>
          <p>Subscribe to get started</p>
          <PricingTable referenceId={data?.id} />
        </>
      )}
    </div>
  );
}
