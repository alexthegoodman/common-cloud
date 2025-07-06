"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  ArrowUpRight,
} from "@phosphor-icons/react";
import {
  getPublicFeaturedProjects,
  getPublicProjects,
} from "@/fetchers/mosaic";
import useSWR from "swr";
import { DateTime } from "luxon";
import Link from "next/link";
import { ClientOnly } from "@/components/ClientOnly";
import VideoPreview from "@/components/mosaic/VideoPreview";

interface MosaicCreatorSectionProps {
  language?: string;
}

export default function MosaicCreatorSection({
  language = "en",
}: MosaicCreatorSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const limit = 6; // Get more projects to show variety

  const {
    data: response,
    isLoading,
    error,
  } = useSWR(`mosaic-creator-section-${limit}`, () =>
    getPublicFeaturedProjects(1, limit)
  );

  const copy =
    language === "hi"
      ? {
          title: "देखें क्रिएटर्स क्या बना रहे हैं",
          subtitle: "हमारे कम्युनिटी के क्रिएटर्स के लेटेस्ट प्रोजेक्ट्स",
          viewProject: "प्रोजेक्ट देखें",
          browseMosaic: "Mosaic ब्राउज़ करें",
          clipsIncluded: "क्लिप्स शामिल",
          loading: "लोड हो रहा है...",
          error: "लोड करने में समस्या हुई",
          noProjects: "कोई प्रोजेक्ट नहीं मिला",
          readyToCreate: "इन जैसे कंटेंट बनाने के लिए तैयार हैं?",
          startCreating: "आज ही शुरू करें",
        }
      : {
          title: "See What Creators Are Making",
          subtitle: "Latest projects from our community of creators",
          viewProject: "View Project",
          browseMosaic: "Browse Mosaic",
          clipsIncluded: "clips included",
          loading: "Loading...",
          error: "Failed to load",
          noProjects: "No projects found",
          readyToCreate: "Ready to create content like this?",
          startCreating: "Start Creating Today",
        };

  const goToNext = () => {
    if (response?.projects) {
      setCurrentIndex((prevIndex) =>
        prevIndex === response.projects.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const goToPrevious = () => {
    if (response?.projects) {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? response.projects.length - 1 : prevIndex - 1
      );
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{copy.title}</h2>
          <p className="text-gray-400 text-lg">{copy.subtitle}</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-gray-400">{copy.loading}</div>
          </div>
        </div>
      </section>
    );
  }

  if (
    error ||
    !response ||
    !response.projects ||
    response.projects.length === 0
  ) {
    return (
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{copy.title}</h2>
          <p className="text-gray-400 text-lg">{copy.subtitle}</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-gray-400">
            {error ? copy.error : copy.noProjects}
          </div>
        </div>
      </section>
    );
  }

  const { projects } = response;
  const currentProject = projects[currentIndex];

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{copy.title}</h2>
        <p className="text-gray-400 text-lg">{copy.subtitle}</p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Main content */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-800 min-h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center w-full">
                {/* Content */}
                <div className="space-y-6">
                  <div className="inline-block bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    Mosaic Project
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {currentProject.name}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Created{" "}
                    {DateTime.fromISO(currentProject.createdAt).toRelative()}
                    {currentProject.fileData?.sequences?.[0]?.activeVideoItems
                      ?.length && (
                      <span className="block text-sm text-gray-400 mt-2">
                        {
                          currentProject.fileData.sequences[0].activeVideoItems
                            .length
                        }
                      </span>
                    )}
                  </p>
                  <div className="flex gap-4">
                    <Link
                      href={`/mosaic/${currentProject.id}`}
                      className="inline-flex items-center text-red-400 hover:text-red-300 transition-colors group"
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      {copy.viewProject}
                    </Link>
                    <Link
                      href="/mosaic"
                      className="inline-flex items-center text-gray-400 hover:text-gray-300 transition-colors group"
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      {copy.browseMosaic}
                    </Link>
                  </div>
                </div>

                {/* Video Preview */}
                <div className="relative">
                  <div className="aspect-[9/16] bg-slate-700 rounded-lg overflow-hidden max-w-xs mx-auto">
                    <ClientOnly>
                      <VideoPreview
                        project={{
                          project_id: currentProject.id,
                          project_name: currentProject.name,
                          video_data: currentProject.fileData,
                          created: DateTime.fromISO(currentProject.createdAt),
                          modified: DateTime.fromISO(currentProject.createdAt),
                        }}
                      />
                    </ClientOnly>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {projects.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {projects.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-red-500 scale-125"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call to action */}
      <div className="text-center mt-12">
        <p className="text-gray-300 text-lg mb-6">{copy.readyToCreate}</p>
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105"
          onClick={() => {
            // animate page scroll to the pricing table
            const pricingSection = document.querySelector("#pricing-table");
            if (pricingSection) {
              pricingSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }}
        >
          {copy.startCreating}
        </button>
      </div>
    </section>
  );
}
