"use client";

import useCurrentUser from "@/hooks/useCurrentUser";

export default function Dashboard() {
  const { data } = useCurrentUser();

  console.info("data", data);

  return (
    <div>
      <h1>Dashboard</h1>
      {data?.email}
      {data?.subscriptionStatus !== "ACTIVE" ||
      data?.subscriptionStatus !== "TRIALING" ? (
        <p>Subscribe to get started</p>
      ) : (
        <p>Download to get started</p>
      )}
    </div>
  );
}
