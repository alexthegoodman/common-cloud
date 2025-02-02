"use client";

// NOTE: ClientOnly shouldn't be needed but Next.js requires because
// it does not stub / mock a local storage in SSR for some reason
// Local Storage is used by our current user hook
import { ClientOnly } from "@/components/ClientOnly";
import DashboardContent from "@/components/DashboardContent";

export default function Dashboard() {
  return (
    <ClientOnly>
      <DashboardContent />
    </ClientOnly>
  );
}
