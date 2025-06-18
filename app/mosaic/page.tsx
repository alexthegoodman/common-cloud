"use client";

import { useState } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import UserMenu from "@/components/mosaic/UserMenu";
import VideoPreview from "@/components/mosaic/VideoPreview";
import Pagination from "@/components/Pagination"; // Import the pagination component
import { getPublicProjects } from "@/fetchers/mosaic";
import useSWR from "swr";
import { DateTime } from "luxon";

export default function Page() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 3; // Items per page

  const {
    data: response,
    isLoading,
    error,
  } = useSWR(`projects-${currentPage}-${limit}`, () =>
    getPublicProjects(currentPage, limit)
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-4">
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>Loading projects...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-4">
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg font-semibold mb-2">
              Error loading projects
            </div>
            <div className="text-sm">Please try refreshing the page</div>
          </div>
        </div>
      </div>
    );
  }

  if (!response || !response.projects || response.projects.length === 0) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-4">
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">No projects found</div>
            <div className="text-sm text-gray-600">
              Check back later for new content
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { projects, pagination } = response;

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

          {/* Page Info */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {projects.length} of {pagination.totalCount} projects
            {pagination.totalPages > 1 && (
              <span>
                {" "}
                • Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            )}
          </div>

          {/* Main Content */}
          <main>
            {/* Projects Grid */}
            <div className="grid gap-6 mb-8">
              {projects.map((project, i) => {
                // First project on first page gets special treatment
                const isFirstProject = currentPage === 1 && i === 0;

                return (
                  <section
                    key={project.id || `project-${i}`}
                    className={isFirstProject ? "mb-8" : "w-96 mb-8"}
                  >
                    <ClientOnly>
                      <VideoPreview
                        project={{
                          project_id: project.id,
                          project_name: project.name,
                          video_data: project.fileData,
                          created: DateTime.fromISO(project.createdAt),
                          modified: DateTime.fromISO(project.createdAt),
                        }}
                      />
                    </ClientOnly>
                    <h2 className="text-xl font-bold mt-2">
                      {project.name || project.name}
                    </h2>
                  </section>
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
