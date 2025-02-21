"use client";

import { NavButton } from "@/components/stunts-app/items";
import { useParams } from "next/navigation";

export default function ProjectSettings({ children = null }) {
  const { projectId } = useParams();

  return (
    <>
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
