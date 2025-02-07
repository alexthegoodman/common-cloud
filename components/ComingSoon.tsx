"use client";

import {
  Book,
  Video,
  Microphone,
  Sparkle,
  Headphones,
  MagicWand,
} from "@phosphor-icons/react";

const ComingSoonSection = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Coming Soon
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Video size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Easy Shorts & Vertical Video
          </h3>
          <p className="text-gray-400">
            Bring all the power of motion paths and mouse capture to your
            vertical videos!
          </p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <MagicWand size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Enhanced Machine Learning Model
          </h3>
          <p className="text-gray-400">
            Enjoy the upcoming version of our AI which will help generate
            rotation, opacity, and scale properties in addition to position!
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Book size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Dynamic Filters & <br />
            Color Grading
          </h3>
          <p className="text-gray-400">
            Select from a list of dynamically generated video and image filters
            to set the tone for your video.
          </p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Sparkle size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Stylized Captions
          </h3>
          <p className="text-gray-400">
            Extract and generate beautiful stylized captions which add impact
            and drive your narrative.
          </p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Headphones size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Audio Import
          </h3>
          <p className="text-gray-400">
            Import and integrate your existing audio files seamlessly into your
            projects.
          </p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Microphone size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Voiceover Generation
          </h3>
          <p className="text-gray-400">
            Generate professional voiceovers for your content with multiple
            voices.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
