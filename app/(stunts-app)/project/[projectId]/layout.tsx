"use client";

import { NavButton } from "@/components/stunts-app/items";
import { useParams } from "next/navigation";

import { Toaster } from "react-hot-toast";

export default function ProjectSettings({ children = null }) {
  const { projectId } = useParams();

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      <div className="flex flex-row p-4">
        <div className="flex flex-col gap-4 mr-4">
          <NavButton
            label="Motion"
            icon="motion-arrow"
            destination={`/project/${projectId}`}
          />
          <NavButton
            label="Settings"
            icon="gear"
            destination={`/project/${projectId}/settings`}
          />
        </div>
        {children}
      </div>
    </>
  );
}
