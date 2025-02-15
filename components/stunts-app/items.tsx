"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateIcon } from "./icon";

export const ProjectItem = ({
  project_id,
  project_label,
  icon,
}: {
  project_id: string;
  project_label: string;
  icon: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const storedProject = JSON.parse(
    localStorage.getItem("stored-project") || "{}"
  );

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);

    localStorage.setItem("stored-project", JSON.stringify({ project_id }));

    router.push(`/project/${project_id}`);
    setLoading(false);
  };

  return (
    <button
      className="w-64 rounded-xl flex items-center justify-start py-2 bg-white
            border-b border-gray-200 hover:bg-gray-200 hover:cursor-pointer 
            active:bg-[#edda4] transition-colors"
      disabled={loading}
      onClick={handleSubmit}
    >
      <div className="w-6 h-6 text-black mr-2">
        <CreateIcon icon={icon} size="24px" />
      </div>
      <span>{project_label}</span>
    </button>
  );
};
