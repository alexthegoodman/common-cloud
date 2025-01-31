"use client";

import { Book, Video, Microphone, Sparkle } from "@phosphor-icons/react";

const ComingSoonSection = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Coming Soon
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Book size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Template Repository
          </h3>
          <p className="text-gray-400">
            Access a growing library of professional templates to jumpstart your
            projects and maintain consistency across your content.
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
            Template Generation
          </h3>
          <p className="text-gray-400">
            Create custom templates automatically from your existing projects,
            saving time and enabling more creative possibilities.
          </p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Video size={24} className="text-amber-500" />
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
