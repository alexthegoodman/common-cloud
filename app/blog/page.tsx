"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, Tag } from "@phosphor-icons/react";

const posts = [
  {
    slug: "zero-vs-human-loop",
    title: "Zero-Shot Generation vs Human-in-the-Loop",
    excerpt: "",
    date: "Feb, 8th 2025",
    readingTime: 10,
  },
  {
    slug: "vae-lstm-loop-dataloader",
    title: "Building a VAE-LSTM Model with Burn - Training Loop and Dataloader",
    excerpt: "",
    date: "Feb, 8th 2025",
    readingTime: 5,
  },
  {
    slug: "vae-lstm-dataset",
    title: "Building a VAE-LSTM Model with Burn - Preparing the Dataset",
    excerpt: "",
    date: "Feb, 8th 2025",
    readingTime: 5,
  },
];

const BlogIndex = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-12">Blog Posts</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
            <article className="bg-slate-800/50 p-6 rounded-xl h-full transition-all duration-200 hover:bg-slate-800/70">
              {/* {post.coverImage && (
                <div className="aspect-video mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={post.coverImage} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              )} */}

              <div className="flex gap-4 mb-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{post.readingTime} min read</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-red-500 transition-colors duration-200">
                {post.title}
              </h2>

              <p className="text-gray-400 mb-4">{post.excerpt}</p>

              {/* {post.tags && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <div 
                      key={tag}
                      className="bg-red-500/20 px-3 py-1 rounded-full text-sm text-red-500"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )} */}
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogIndex;
