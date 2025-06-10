"use client";

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
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  plan: CurrentPlan;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string;
}

const getCurrentUser = async (token: string) => {
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
  const [jwtData, saveJwtData] = useLocalStorage<JwtData | null>(
    "jwtData",
    null
  );

  const { data, isLoading, error } = useSWR("currentUser", () =>
    getCurrentUser(jwtData?.token ? jwtData?.token : "")
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
