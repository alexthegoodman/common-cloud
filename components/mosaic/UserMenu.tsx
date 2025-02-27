"use client";

import useCurrentUser from "@/hooks/useCurrentUser";

export default function UserMenu() {
  const { data } = useCurrentUser();

  return (
    <div className="flex items-center ">
      <span className="w-32 truncate mr-2">{data?.email}</span>
      <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
    </div>
  );
}
