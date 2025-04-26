"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// import { RTEEditor } from "@/components/stunts-app/RTEEditor";

export default function Books() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="mx-auto flex flex-row">
            {/* <RTEEditor projectId={projectId} /> */}
            <aside className="pr-4">
              <ul className="flex flex-col">
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/cover`}
                  >
                    Cover
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/table-of-contents`}
                  >
                    Table of Contents
                  </Link>
                </li>
                <span className="block mb-1">Chapters</span>
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/${0}`}
                  >
                    Chapter 1
                  </Link>
                </li>
                <li>
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/new/`}
                  >
                    New Chapter
                  </Link>
                </li>
              </ul>
            </aside>
            <main className="block min-w-[50vw]">
              <p>Book Summary</p>
            </main>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
