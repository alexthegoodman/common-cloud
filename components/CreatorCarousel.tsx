"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "@phosphor-icons/react";

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
}

interface CreatorCarouselProps {
  language?: string;
}

export default function CreatorCarousel({
  language = "en",
}: CreatorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  let copy = null;
  switch (language) {
    case "en":
      copy = {
        title: "See What Creators Are Making",
        subtitle: "Real examples from our community of 600+ creators",
        items: [
          {
            id: "1",
            title: "Viral Text Hooks",
            description: "AI-generated keyframes make text pop off the screen",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU", // Placeholder - replace with actual videos
            thumbnailUrl: "/stunts-web.jpeg",
            category: "Text Animation",
          },
          {
            id: "2",
            title: "Product Reveals",
            description:
              "Screen capture + auto-zoom for perfect product showcases",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "Product Demo",
          },
          {
            id: "3",
            title: "Logo Animations",
            description:
              "Professional branding that stands out from basic creators",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "Branding",
          },
          {
            id: "4",
            title: "Personal Stories",
            description: "Transform family moments into cinematic memories",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "Personal",
          },
        ],
      };
      break;

    case "hi":
      copy = {
        title: "देखें क्रिएटर्स क्या बना रहे हैं",
        subtitle: "हमारे 600+ क्रिएटर्स के कम्युनिटी के रियल एक्जाम्पल्स",
        items: [
          {
            id: "1",
            title: "वायरल टेक्स्ट हुक्स",
            description:
              "AI-जेनरेटेड कीफ्रेम्स टेक्स्ट को स्क्रीन से पॉप करवाते हैं",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "टेक्स्ट एनिमेशन",
          },
          {
            id: "2",
            title: "प्रोडक्ट रिवील्स",
            description:
              "परफेक्ट प्रोडक्ट शोकेस के लिए स्क्रीन कैप्चर + ऑटो-जूम",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "प्रोडक्ट डेमो",
          },
          {
            id: "3",
            title: "लोगो एनिमेशन",
            description:
              "प्रोफेशनल ब्रांडिंग जो बेसिक क्रिएटर्स से अलग दिखाती है",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "ब्रांडिंग",
          },
          {
            id: "4",
            title: "पर्सनल स्टोरीज",
            description:
              "फैमिली मोमेंट्स को सिनेमैटिक मेमोरीज में ट्रांसफॉर्म करें",
            videoUrl: "https://www.youtube.com/shorts/LuXI2KxavjU",
            thumbnailUrl: "/stunts-web.jpeg",
            category: "पर्सनल",
          },
        ],
      };
      break;

    default:
      break;
  }

  const items = copy?.items || [];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!items.length) return null;

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{copy?.title}</h2>
        <p className="text-gray-400 text-lg">{copy?.subtitle}</p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Main carousel */}
        <div
          className="relative overflow-hidden rounded-2xl bg-slate-800 h-96"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
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
                    {items[currentIndex].category}
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {items[currentIndex].title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {items[currentIndex].description}
                  </p>
                  <a
                    href={items[currentIndex].videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-red-400 hover:text-red-300 transition-colors group"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Watch Example
                  </a>
                </div>

                {/* Thumbnail/Preview */}
                <div className="relative">
                  <div className="aspect-[9/16] bg-slate-700 rounded-lg overflow-hidden max-w-xs mx-auto">
                    <img
                      src={items[currentIndex].thumbnailUrl}
                      alt={items[currentIndex].title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-red-500 rounded-full p-3">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
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
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {items.map((_, index) => (
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
      </div>

      {/* Call to action */}
      <div className="text-center mt-12">
        <p className="text-gray-300 text-lg mb-6">
          {language === "hi"
            ? "इन जैसे कंटेंट बनाने के लिए तैयार हैं?"
            : "Ready to create content like this?"}
        </p>
        <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105">
          {language === "hi" ? "आज ही शुरू करें" : "Start Creating Today"}
        </button>
      </div>
    </section>
  );
}
