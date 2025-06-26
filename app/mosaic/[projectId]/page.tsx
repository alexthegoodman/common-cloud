"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientOnly } from "@/components/ClientOnly";
import UserMenu from "@/components/mosaic/UserMenu";
import VideoPreview from "@/components/mosaic/VideoPreview";
import { getPublicProject, SingleProjectResponse } from "@/fetchers/mosaic";
import { DateTime } from "luxon";
import Link from "next/link";

// interface VideoPageProps {
//   params: {
//     projectId: string;
//   };
// }

export default function VideoPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<SingleProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        try {
          setIsLoading(true);
          const projectResponse = await getPublicProject(projectId as string);
          setProject(projectResponse);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load project"
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>Loading video...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gray-100 min-h-screen">
          <header className="flex justify-between items-center mb-8 pt-4">
            <div className="flex items-center">
              <Link
                href="/mosaic"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Mosaic
              </Link>
              <h1 className="text-2xl font-bold">Video Not Found</h1>
            </div>
            <ClientOnly>
              <UserMenu />
            </ClientOnly>
          </header>
          <div className="flex items-center justify-center py-16">
            <div className="text-center text-red-600">
              <div className="text-lg font-semibold mb-2">
                {error || "Video not found"}
              </div>
              <div className="text-sm mb-4">
                This video may have been removed or made private
              </div>
              <Link
                href="/mosaic"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Browse Other Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { project: projectData } = project;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-4">
      <div className="bg-gray-100 min-h-screen">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center">
            <Link
              href="/mosaic"
              className="text-blue-600 hover:text-blue-800 mr-4"
            >
              ← Back to Mosaic
            </Link>
            <h1 className="text-2xl font-bold">
              {projectData.name || "Untitled Video"}
            </h1>
          </div>
          <ClientOnly>
            <UserMenu />
          </ClientOnly>
        </header>

        {/* Main Content */}
        <main>
          {/* Video Player Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <ClientOnly>
              <VideoPreview
                project={{
                  project_id: projectData.id,
                  project_name: projectData.name,
                  video_data: projectData.fileData,
                  created: DateTime.fromISO(projectData.createdAt),
                  modified: DateTime.fromISO(projectData.updatedAt),
                }}
              />
            </ClientOnly>

            {/* Video Info */}
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-2">
                {projectData.name || "Untitled Video"}
              </h2>

              <div className="flex items-center text-gray-600 text-sm mb-4">
                <span className="mr-4">By {projectData.author}</span>
                <span>
                  Created {DateTime.fromISO(projectData.createdAt).toRelative()}
                </span>
              </div>

              {/* Video Stats/Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {projectData.fileData?.sequences?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sequences</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {projectData.fileData?.settings?.dimensions?.width || 0} x{" "}
                    {projectData.fileData?.settings?.dimensions?.height || 0}
                  </div>
                  <div className="text-sm text-gray-600">Resolution</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {DateTime.fromISO(projectData.updatedAt).toRelative()}
                  </div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Videos / Back to Gallery */}
          <div className="text-center">
            <Link
              href="/mosaic"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore More Videos
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
