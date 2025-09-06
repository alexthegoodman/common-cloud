"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  PencilSimple,
  Sparkle,
  Timer,
  PaintBrush,
} from "@phosphor-icons/react";
import { createDemoProject } from "@/fetchers/projects";

interface CarouselSlide {
  id: string;
  component: React.ReactNode;
}

export default function OnboardingCarousel() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  const slides: CarouselSlide[] = [
    {
      id: "welcome",
      component: (
        <div className="text-center">
          <div className="w-24 h-24 bg-black p-4 rounded-full flex items-center justify-center mx-auto mb-8">
            {/* <Sparkle className="w-12 h-12 text-white" /> */}
            <img
              className="block w-full h-full"
              src="/stunts_logo_letter.jpg"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t("carousel.welcome.title")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t("carousel.welcome.description")}
          </p>
        </div>
      ),
    },
    {
      id: "flow",
      component: (
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Play className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t("carousel.flow.title")}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t("carousel.flow.description")}
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("carousel.flow.step1")}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("carousel.flow.step2")}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("carousel.flow.step3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "editor",
      component: (
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <PencilSimple className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t("carousel.editor.title")}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t("carousel.editor.description")}
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tools</h3>
                <p className="text-sm text-gray-700">
                  {t("carousel.editor.tools")}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PaintBrush className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Animations</h3>
                <p className="text-sm text-gray-700">
                  {t("carousel.editor.animations")}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Export</h3>
                <p className="text-sm text-gray-700">
                  {t("carousel.editor.export")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ready",
      component: (
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <ArrowRight className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t("carousel.ready.title")}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t("carousel.ready.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-4">
              <Play className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Flow</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 rounded-lg p-4">
              <PencilSimple className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Manual Editor
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    // Mark onboarding as completed (skipped)
    localStorage.setItem("onboarding-completed", "true");
    router.push("/projects");
  };

  const handleGetStarted = async () => {
    // Mark onboarding as completed
    localStorage.setItem("onboarding-completed", "true");

    // Check if user is authenticated
    // const authTokenString = localStorage.getItem("auth-token");
    // if (!authTokenString) {
    //   // If not authenticated, redirect to projects page
    //   router.push("/projects");
    //   return;
    // }

    // try {
    //   setIsCreatingDemo(true);
    //   const authToken = JSON.parse(authTokenString);

    //   // Create a demo project from a template
    //   const demoProject = await createDemoProject(authToken.token);

    //   // Store the demo project and navigate to it
    //   localStorage.setItem(
    //     "stored-project",
    //     JSON.stringify({ project_id: demoProject.newProject.id })
    //   );

    //   router.push(`/project/${demoProject.newProject.id}/videos`);
    // } catch (error) {
    //   console.error("Error creating demo project:", error);
    //   // Fall back to projects page if demo creation fails
    //   router.push("/projects");
    // } finally {
    //   setIsCreatingDemo(false);
    // }

    // demo project was overkill, but maybe add one to the project list without going to it?
    router.push("/projects");
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Skip Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            {t("carousel.navigation.skip")}
          </button>
        </div>

        {/* Carousel Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 min-h-[500px] flex flex-col justify-center">
          <div className="flex-1 flex items-center justify-center">
            {slides[currentSlide].component}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentSlide === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-white hover:shadow-md"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            {t("carousel.navigation.previous")}
          </button>

          {/* Progress Indicators */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Next/Get Started Button */}
          <button
            onClick={isLastSlide ? handleGetStarted : nextSlide}
            disabled={isCreatingDemo}
            className="flex items-center gap-2 px-6 py-2 stunts-gradient text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastSlide && isCreatingDemo
              ? "Creating Demo..."
              : isLastSlide
              ? t("carousel.navigation.getStarted")
              : t("carousel.navigation.next")}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
