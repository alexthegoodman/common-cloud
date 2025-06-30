"use client";

import { AuthToken } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";

export interface CurrentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  stripeDevPriceId: string;
  features: string[];
}
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userLanguage: string;
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  plan: CurrentPlan;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string;
  role: string; // USER, ADMIN, etc.
}

export const getCurrentUser = async (token: string) => {
  console.info("fetching current user");

  const res = await fetch("/api/auth/current-user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });

  const json: CurrentUser = await res.json();

  return json;
};

export type JwtData = {
  token: string;
  expiry: number;
};

export default function useCurrentUser() {
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const { data, isLoading, error } = useSWR("currentUser", () =>
    getCurrentUser(authToken?.token ? authToken?.token : "")
  );

  //   useEffect(() => {
  //     if (jwtData?.token) {
  //       mutate("currentUser", () => getCurrentUser(jwtData?.token));
  //     }
  //   }, [jwtData]);

  return {
    data,
  };
}
