"use client";

import PricingTable from "@/components/PricingTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { WindowsLogo } from "@phosphor-icons/react";

export default function DashboardContent() {
  const { data } = useCurrentUser();

  console.info("data", data);

  return (
    <div className="container mx-auto px-4 pt-8 pb-8 flex flex-col gap-4">
      <div className="flex flex-col gap-4 max-w-[600px] w-full">
        <h1>Welcome, {data?.email}</h1>

        <img src="/screen1.png" />

        <p>
          You are almost ready to use Stunts! Stunts is your pathway to rapid
          video creation using your own content. With Stunts generative keyframe
          animations, you can save hours on manual animating.
        </p>
      </div>

      {data?.subscriptionStatus === "ACTIVE" ||
      data?.subscriptionStatus === "TRIALING" ? (
        <>
          <p>Download to get started</p>
          <a
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center justify-center w-[280px] text-center"
            href="https://bunny.net"
            download={true}
          >
            Download for Windows <WindowsLogo className="ml-2" />
          </a>
        </>
      ) : (
        <>
          <p>Subscribe to get started</p>
          <PricingTable />
        </>
      )}
    </div>
  );
}
