"use client";

import Footer from "@/components/Footer";
import Link from "next/link";

export default function BlogLayout({ children = null }) {
  return (
    <>
      <section className="container max-w-[900px] w-full mx-auto blog">
        {/* <h1 className="text-2xl mb-8">Common | Blog</h1> */}

        {children}
      </section>

      <style>
        {`
        .blog h1 {
            font-size: 36px;
            margin-bottom: 15px;
        }
        .blog h2 {
            font-size: 28px;
            margin-bottom: 15px;
        }
        .blog iframe {
            margin-bottom: 15px;
            width: 100%;
            height: auto;
            aspect-ratio: calc(16/9);
        }
        .blog p {
            margin-bottom: 15px;
        }
        .blog ul {
            margin-bottom: 15px;
        }
        `}
      </style>
    </>
  );
}
