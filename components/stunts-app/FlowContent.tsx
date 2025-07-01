"use client";

import {
  useState,
  useRef,
  ChangeEvent,
  DragEventHandler,
  useMemo,
  useEffect,
} from "react";
import { Spinner } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { IFlowContent, scrapeLink, updateFlowContent } from "@/fetchers/flows";
import {
  AuthToken,
  resizeVideo,
  saveImage,
  UploadResponse,
} from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { AnalyzeLink } from "./AnalyzeLink";
import { DataInterface } from "@/def/ai";
import { fileToBlob } from "@/engine/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { upload } from "@vercel/blob/client";
import { getFlow, FlowData } from "@/fetchers/flows";
import useSWR from "swr";

export default function FlowContent({
  flowId = null,
  projectId = null,
}: {
  flowId: string | null;
  projectId: string | null;
}) {
  const { t } = useTranslation("flow");

  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  // State for file upload
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State for link inputs
  const [links, setLinks] = useState(["", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState([false, false, false]);
  const [linkData, setLinkData] = useState<DataInterface[]>([]);
  const [loading, setLoading] = useState(false);

  // State for flow data and image generation
  // const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<File[]>([]);

  // // Load flow data on component mount
  // useEffect(() => {
  //   const loadFlowData = async () => {
  //     if (flowId && authToken) {
  //       try {
  //         const response = await getFlow(authToken, flowId);
  //         if (response) {
  //           setFlowData(response.flow);
  //         }
  //       } catch (error) {
  //         console.error("Failed to load flow data:", error);
  //       }
  //     }
  //   };

  //   loadFlowData();
  // }, [flowId, authToken]);

  let {
    data: flowResponse,
    isLoading,
    error,
  } = useSWR("flow" + flowId, () => getFlow(authToken, flowId as string));

  const flowData = flowResponse?.flow as FlowData | null;

  // Auto-generate images when files change and we have flow data
  useEffect(() => {
    if (
      flowData?.prompt &&
      files.length > 0 &&
      files.length < 5 &&
      !isGeneratingImages
    ) {
      autoGenerateImages(files.length);
    }
  }, [files.length, flowData?.prompt]);

  const videoCount = useMemo(
    () => files.filter((file) => file.type.includes("video/")).length,
    [files]
  );
  const imageCount = useMemo(
    () =>
      files.filter((file) => file.type.includes("image/")).length +
      generatedImages.length,
    [files, generatedImages]
  );
  // const requirementsMet = videoCount >= 1 && imageCount >= 4;
  const totalFiles = files.length + generatedImages.length;
  const requirementsMet = totalFiles >= 4; // At least 4 files total (uploaded + generated)

  // Handle file drop
  const handleDrop: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (!e.dataTransfer) {
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  // Handle file input change
  const handleFileInputChange = (e: any) => {
    const selectedFiles = Array.from(e.target.files) as File[];
    handleFiles(selectedFiles);
  };

  // Process files
  const handleFiles = (selectedFiles: File[]) => {
    // Filter for accepted file types
    const validFiles = selectedFiles.filter((file) => {
      const fileType = file.type;
      return (
        fileType.includes("image/") ||
        fileType.includes("video/") ||
        fileType === "text/plain" ||
        fileType === "application/pdf" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });

    if (validFiles.length > 6) {
      toast.error(t("You can only upload up to 6 files"));
    } else {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  // Handle drag events
  const handleDragOver: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle click on upload area
  const handleUploadClick = () => {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.click();
  };

  // Handle removing a file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle removing a generated image
  const removeGeneratedImage = (index: number) => {
    setGeneratedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-generate images to fill up to 5 total files
  const autoGenerateImages = async (uploadedFilesCount: number) => {
    if (!flowData?.prompt || isGeneratingImages) {
      return;
    }

    const neededImages = Math.max(0, 5 - uploadedFilesCount);

    if (neededImages === 0) {
      return;
    }

    setIsGeneratingImages(true);

    try {
      const response = await fetch("/api/image/generate-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: flowData.prompt,
          count: neededImages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate images");
      }

      const data = await response.json();

      // Convert base64 images to File objects
      const newImages: File[] = [];
      for (const imageData of data.images) {
        const binaryString = atob(imageData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "image/jpeg" });
        const file = new File(
          [blob],
          `generated-${Date.now()}-${imageData.index}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        newImages.push(file);
      }

      setGeneratedImages(newImages);
      toast.success(
        `Generated ${newImages.length} images to complete your collection!`
      );
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error(error.message || "Failed to generate images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Handle link input change
  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  // Get file type icon/preview
  const getFilePreview = (file: File) => {
    if (file.type.includes("image/")) {
      return (
        <div className="h-16 w-16 relative">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="h-full w-full object-cover rounded"
          />
        </div>
      );
    } else if (file.type.includes("video/")) {
      return (
        <div className="h-16 w-16 relative">
          <video
            id={
              "video-" +
              file.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
            }
            src={URL.createObjectURL(file)}
            className="h-full w-full object-cover rounded"
            muted
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 rounded flex items-center justify-center">
            <div className="text-white text-xs font-bold">VIDEO</div>
          </div>
        </div>
      );
    } else if (file.type === "application/pdf") {
      return (
        <div className="h-16 w-16 bg-red-100 rounded flex items-center justify-center text-red-500 font-bold">
          PDF
        </div>
      );
    } else if (file.type === "text/plain") {
      return (
        <div className="h-16 w-16 bg-blue-100 rounded flex items-center justify-center text-blue-500 font-bold">
          TXT
        </div>
      );
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return (
        <div className="h-16 w-16 bg-blue-100 rounded flex items-center justify-center text-blue-700 font-bold">
          DOCX
        </div>
      );
    }
  };

  const continueHandler = async () => {
    if (!authToken || !flowId) {
      return;
    }

    if (!requirementsMet) {
      toast.error(t("Please upload 1 video and 4 images to continue"));
      return;
    }

    // TODO: update flow with files and link data
    setLoading(true);

    let flowContent: IFlowContent = {
      files: [],
      links: [],
    };

    // add files (both uploaded and generated) to flow's content object
    const allFiles = [...files, ...generatedImages];
    for (let file of allFiles) {
      let blob = await fileToBlob(file);

      if (!blob) {
        return;
      }

      try {
        let response;

        if (file.type.includes("video/")) {
          // send File to resizeVideo function
          const resizedVideoBlob = await resizeVideo(file);

          // Use Vercel blob client-side upload for videos
          const newBlob = await upload(file.name, resizedVideoBlob, {
            access: "public",
            handleUploadUrl: "/api/video/upload",
            clientPayload: JSON.stringify({
              token: authToken.token,
            }),
          });

          let realId =
            "video-" +
            file.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-");
          let realVideo = document.getElementById(realId) as HTMLVideoElement;
          let width = 100;
          let height = 100;
          if (realVideo) {
            width = realVideo.videoWidth;
            height = realVideo.videoHeight;
          }

          response = {
            url: newBlob.url,
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
            dimensions: { width, height },
          };
        } else if (file.type.includes("image/")) {
          // Use Vercel blob client-side upload for images
          const newBlob = await upload(file.name, blob, {
            access: "public",
            handleUploadUrl: "/api/image/upload",
            clientPayload: JSON.stringify({
              token: authToken.token,
            }),
          });

          // Get image dimensions from the DOM if available
          const imgElement = document.querySelector(
            `img[src*="${file.name}"]`
          ) as HTMLImageElement;
          let width = 100;
          let height = 100;
          if (
            imgElement &&
            imgElement.naturalWidth &&
            imgElement.naturalHeight
          ) {
            width = imgElement.naturalWidth;
            height = imgElement.naturalHeight;
          }

          response = {
            url: newBlob.url,
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
            dimensions: { width, height },
          };
        } else {
          // Use existing saveImage for other file types (text, PDF, DOCX)
          response = await saveImage(authToken.token, file.name, blob);
        }

        if (response) {
          flowContent.files.push(response);
        }
      } catch (error: any) {
        console.error("add file error", error);
        toast.error(error.message || "An error occurred");
      }
    }

    // add links to flow's content object
    for (let link of linkData) {
      flowContent.links.push(link);
    }

    await updateFlowContent(authToken.token, flowId, flowContent);

    router.push(`/project/${projectId}/flows/${flowId}/questions`);

    setLoading(false);
  };

  return (
    <>
      <div className="max-w-[1200px] flex flex-col md:flex-row gap-4 mx-auto p-6">
        {/* <h1 className="text-3xl font-bold mb-8">File Upload & Link Analyzer</h1> */}

        {/* File Upload Section */}
        <div className="w-full max-w-[600px] mb-10">
          <h2 className="text-xl font-semibold mb-2">{t("Upload Files")}</h2>
          <div className="mb-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-blue-800 font-medium">
                  {t(
                    "Upload your files - we'll automatically generate additional images based on your prompt to reach 5 total files"
                  )}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              multiple
              accept="image/*,video/*,.txt,.pdf,.docx"
            />
            <div className="text-gray-500">
              <p className="font-medium mb-1">
                {t("Drag and drop files here or click to browse")}
              </p>
              <p className="text-sm">
                {t(
                  "Upload any combination of images, videos, or documents. AI will fill the rest to reach 5 files total."
                )}
              </p>
            </div>
          </div>

          {/* Auto-generation Status */}
          {isGeneratingImages && (
            <div className="mt-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg" role="status" aria-live="polite">
                <div className="flex items-center space-x-2">
                  <Spinner className="w-5 h-5 text-blue-600 animate-spin" aria-hidden="true" />
                  <span className="text-blue-800 font-medium">
                    {t("Generating images based on your prompt")}...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2 text-purple-800">
                {t("AI Generated Images")} ({generatedImages.length})
              </h3>
              <div className="space-y-3">
                {generatedImages.map((file, index) => (
                  <div
                    key={`generated-${index}`}
                    className="flex items-center p-3 border border-purple-200 rounded-lg bg-purple-50"
                  >
                    <div className="h-16 w-16 relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover rounded"
                      />
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-1 rounded">
                        AI
                      </div>
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-purple-600">
                        {(file.size / 1024).toFixed(1)} KB - AI Generated
                      </p>
                    </div>
                    <button
                      onClick={() => removeGeneratedImage(index)}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      {t("Remove")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Requirements Status */}
          {(files.length > 0 || generatedImages.length > 0) && (
            <div className="mt-6">
              <div className="mb-4">
                {(() => {
                  // const videoCount = files.filter(file => file.type.includes("video/")).length;
                  // const imageCount = files.filter(file => file.type.includes("image/")).length;
                  // const requirementsMet = videoCount >= 1 && imageCount >= 4;

                  return (
                    <div
                      className={`p-3 rounded-lg border ${
                        requirementsMet
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-yellow-50 border-yellow-200 text-yellow-800"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="text-sm font-medium">
                        {t("Files Status")}: {files.length} uploaded,{" "}
                        {generatedImages.length} AI generated ({totalFiles}{" "}
                        total)
                        {requirementsMet
                          ? ` - ${t("Requirements met!")}`
                          : ` - ${t("Need")} ${Math.max(0, 4 - totalFiles)} ${t(
                              "more files"
                            )}`}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <h3 className="text-lg font-medium mb-2">
                {t("Uploaded Files")} ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 border rounded-lg"
                  >
                    {getFilePreview(file)}
                    <div className="ml-4 flex-grow">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      {t("Remove")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Link Analysis Section */}
        {/* <div className="w-full max-w-[600px]">
          <h2 className="text-xl font-semibold mb-2">{t("Analyze Links")}</h2>
          <span className="block text-slate-500 mb-4">
            {t("Optional - Add context from web links")}
          </span>
          <div className="space-y-4">
            {links.map((link, index) => (
              <AnalyzeLink
                key={"link" + index}
                authToken={authToken}
                links={links}
                setIsAnalyzing={setIsAnalyzing}
                index={index}
                isAnalyzing={isAnalyzing}
                link={link}
                handleLinkChange={handleLinkChange}
                setLinkData={setLinkData}
              />
            ))}
          </div>
        </div> */}
      </div>

      <button
        className="stunts-gradient text-white p-2 rounded w-1/4 mx-auto mt-8"
        onClick={continueHandler}
        disabled={loading}
      >
        {loading ? t("Saving") + "..." : t("Continue")}
      </button>
    </>
  );
}
