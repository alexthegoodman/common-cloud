"use client";

import TranslationProvider from "@/components/TranslationProvider";
import { AuthToken } from "@/fetchers/projects";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { useLocalStorage } from "@uidotdev/usehooks";
import useSWR from "swr";

function AppInnerLayout({
  authToken = null,
  children = null,
}: {
  authToken: AuthToken | null;
  children: any;
}) {
  const { data, isLoading, error } = useSWR("currentUser", () =>
    getCurrentUser(authToken?.token ? authToken?.token : "")
  );

  if (!data || isLoading) {
    return <>Loading user data...</>;
  }

  if (error) {
    return <>Error loading user data...</>;
  }

  console.info("chosen language", data?.userLanguage);

  return (
    <TranslationProvider language={data?.userLanguage}>
      {children}
    </TranslationProvider>
  );
}

export default function AppLayout({ children = null }) {
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  if (!authToken?.token) {
    return <>Authenticating...</>;
  }

  return <AppInnerLayout authToken={authToken}>{children}</AppInnerLayout>;
}
