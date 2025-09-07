"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { RTEEditor } from "@/components/stunts-app/RTEEditor";

export default function Books() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="mx-auto flex flex-row">
            <RTEEditor projectId={projectId} />
            {/* <aside className="pr-4">
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
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/dedication/`}
                  >
                    Dedication
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
                <li className="mb-2">
                  <Link
                    className="flex flex-row items-center border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/new/`}
                  >
                    <Plus className="mr-1" /> New Chapter
                  </Link>
                </li>
                <span className="block mb-1">Data</span>
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/isbn/`}
                  >
                    ISBN
                  </Link>
                </li>
                <span className="block mb-1">Visual</span>
                <li className="mb-2">
                  <Link
                    className="block border-[1px] border-solid border-gray-300 p-1 px-2 rounded"
                    href={`/project/${projectId}/books/chapter/theme/`}
                  >
                    Choose Theme
                  </Link>
                </li>
                <span className="block mb-1">Export</span>
                <li>
                  <button className="block bg-indigo-100 p-1 px-2 rounded">
                    Export Book
                  </button>
                </li>
              </ul>
            </aside>
            <main className="block min-w-[50vw]">
              <p>Book Summary</p>
            </main> */}
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
