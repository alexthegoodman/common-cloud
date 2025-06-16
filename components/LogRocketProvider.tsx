"use client";

import LogRocket from "logrocket";
import { useEffect } from "react";

export function LogRocketProvider({
  children = null,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID!); // Replace with your actual LogRocket app ID

      // Optional: Identify users
      // LogRocket.identify('user-id', {
      //   name: 'User Name',
      //   email: 'user@example.com',
      // })
    }
  }, []);

  return <>{children}</>;
}
