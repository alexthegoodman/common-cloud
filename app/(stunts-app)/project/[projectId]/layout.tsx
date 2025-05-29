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
            label="Hub"
            icon="lightning"
            destination={`/project/${projectId}`}
          />
          <NavButton
            label="Video"
            icon="video"
            destination={`/project/${projectId}/videos`}
          />
          <NavButton
            label="Visual Docs"
            icon="file-cloud"
            destination={`/project/${projectId}/documents`}
          />
          {/* <NavButton
            label="Slides"
            icon="presentation"
            destination={`/project/${projectId}/slides`}
          />
          <NavButton
            label="Promos"
            icon="squares"
            destination={`/project/${projectId}/promos`}
          /> */}
          {/* <NavButton
            label="Market"
            icon="market"
            destination={`/project/${projectId}/market`}
          /> */}
          {/* <NavButton
            label="Books"
            icon="book"
            destination={`/project/${projectId}/books`}
          /> */}
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
