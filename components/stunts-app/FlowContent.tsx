"use client";

import { useState, useRef, ChangeEvent, DragEventHandler } from "react";
import { Spinner } from "@phosphor-icons/react";

export default function FlowContent() {
  // State for file upload
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State for link inputs
  const [links, setLinks] = useState(["", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState([false, false, false]);

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

    setFiles((prev) => [...prev, ...validFiles]);
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

  // Handle link analysis
  const analyzeLink = async (index: number) => {
    if (!links[index].trim()) return;

    // Set the analyzing state for this link
    const newIsAnalyzing = [...isAnalyzing];
    newIsAnalyzing[index] = true;
    setIsAnalyzing(newIsAnalyzing);

    try {
      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Handle successful analysis
      console.log(`Analyzed link ${index + 1}: ${links[index]}`);

      // Here you would normally process the response
    } catch (error) {
      console.error(`Error analyzing link ${index + 1}:`, error);
    } finally {
      // Reset the analyzing state
      const resetIsAnalyzing = [...isAnalyzing];
      resetIsAnalyzing[index] = false;
      setIsAnalyzing(resetIsAnalyzing);
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* <h1 className="text-3xl font-bold mb-8">File Upload & Link Analyzer</h1> */}

      {/* File Upload Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
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
            <p className="text-sm">Accepts images, TXT, DOCX, and PDF files</p>
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Analyze Links</h2>
        <div className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-grow">
                <input
                  type="url"
                  placeholder={`Link ${index + 1}`}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => analyzeLink(index)}
                disabled={isAnalyzing[index] || !link.trim()}
                className={`p-3 rounded-md ${
                  isAnalyzing[index] || !link.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isAnalyzing[index] ? (
                  <div className="flex items-center">
                    <Spinner className="w-5 h-5 animate-spin mr-2" />
                    Analyzing...
                  </div>
                ) : (
                  "Analyze"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
