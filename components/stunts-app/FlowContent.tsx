"use client";

import { useState, useRef, ChangeEvent, DragEventHandler } from "react";
import { Spinner } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { IFlowContent, scrapeLink, updateFlowContent } from "@/fetchers/flows";
import { AuthToken, saveImage, UploadResponse } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { AnalyzeLink } from "./AnalyzeLink";
import { DataInterface } from "@/def/ai";
import { fileToBlob } from "@/engine/image";

export default function FlowContent({
  flowId = null,
}: {
  flowId: string | null;
}) {
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
        fileType === "text/plain" ||
        fileType === "application/pdf" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });

    if (validFiles.length > 3) {
      toast.error("You can only upload up to 3 files");
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

    // TODO: update flow with files and link data
    setLoading(true);

    let flowContent: IFlowContent = {
      files: [],
      links: [],
    };

    // add files to flow's content object
    for (let file of files) {
      let blob = await fileToBlob(file);

      if (!blob) {
        return;
      }

      try {
        let response = await saveImage(authToken.token, file.name, blob);

        if (response) {
          flowContent.files.push(response);
        }
      } catch (error: any) {
        console.error("add image error", error);
        toast.error(error.message || "An error occurred");
      }
    }

    // add links to flow's content object
    for (let link of linkData) {
      flowContent.links.push(link);
    }

    await updateFlowContent(authToken.token, flowId, flowContent);

    setLoading(false);
  };

  return (
    <>
      <div className="max-w-[1200px] flex flex-row gap-4 mx-auto p-6">
        {/* <h1 className="text-3xl font-bold mb-8">File Upload & Link Analyzer</h1> */}

        {/* File Upload Section */}
        <div className="max-w-[600px] mb-10">
          <h2 className="text-xl font-semibold mb-2">Upload Files</h2>
          <span className="block text-slate-500 mb-4">Optional</span>
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
              accept="image/*,.txt,.pdf,.docx"
            />
            <div className="text-gray-500">
              <p className="font-medium mb-1">
                Drag and drop files here or click to browse
              </p>
              <p className="text-sm">
                Accepts images, TXT, DOCX, and PDF files
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">
                Uploaded Files ({files.length})
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
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Link Analysis Section */}
        <div className="max-w-[600px]">
          <h2 className="text-xl font-semibold mb-2">Analyze Links</h2>
          <span className="block text-slate-500 mb-4">Optional</span>
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
        </div>
      </div>

      <button
        className="stunts-gradient text-white p-2 rounded w-1/4 mx-auto mt-8"
        onClick={continueHandler}
        disabled={loading}
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </>
  );
}
