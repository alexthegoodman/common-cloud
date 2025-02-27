"use client";

import { ClientOnly } from "@/components/ClientOnly";
import UserMenu from "@/components/mosaic/UserMenu";
import VideoPreview from "@/components/mosaic/VideoPreview";
import { getPublicProjects } from "@/fetchers/mosaic";
import useSWR from "swr";

export default function Page() {
  let {
    data: projects,
    isLoading,
    error,
  } = useSWR("projects", () => getPublicProjects());

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  if (!projects) {
    return <div>No projects found.</div>;
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-4">
      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-4">
          {/* Header Section */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Mosaic</h1>
            <div className="flex items-center">
              <div className="relative mr-4">
                <input
                  type="text"
                  placeholder="Search Mosaic..."
                  className="px-4 py-1 rounded-md border border-gray-300"
                />
              </div>
              <ClientOnly>
                <UserMenu />
              </ClientOnly>
            </div>
          </header>

          {/* Main Content */}
          <main>
            {/* Projects Section */}
            {projects.map((project, i) => {
              if (i === 0) {
                return (
                  <section key={"project" + i} className="mb-8">
                    <ClientOnly>
                      <VideoPreview project={project} />
                    </ClientOnly>
                    <h2 className="text-xl font-bold">
                      {project.project_name}
                    </h2>
                  </section>
                );
              } else {
                return (
                  <section key={"project" + i} className="w-96 mb-8">
                    <ClientOnly>
                      <VideoPreview project={project} />
                    </ClientOnly>
                    <h2 className="text-xl font-bold">
                      {project.project_name}
                    </h2>
                  </section>
                );
              }
            })}
          </main>
        </div>
      </div>
    </div>
  );
}
