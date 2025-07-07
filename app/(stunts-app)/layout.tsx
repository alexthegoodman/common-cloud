"use client";

import AppLayout from "@/components/AppLayout";
import { ClientOnly } from "@/components/ClientOnly";
import { LogRocketProvider } from "@/components/LogRocketProvider";

export default function RootLayout({ children = null }) {
  return (
    <LogRocketProvider>
      <ClientOnly>
        <AppLayout>{children}</AppLayout>
      </ClientOnly>
    </LogRocketProvider>
  );
}
