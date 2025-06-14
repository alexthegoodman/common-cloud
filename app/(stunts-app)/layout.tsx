"use client";

import AppLayout from "@/components/AppLayout";
import { ClientOnly } from "@/components/ClientOnly";

export default function RootLayout({ children = null }) {
  return (
    <ClientOnly>
      <AppLayout>{children}</AppLayout>
    </ClientOnly>
  );
}
