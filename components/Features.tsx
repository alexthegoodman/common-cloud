"use client";

import {
  Play,
  ShieldChevron,
  MagicWand,
  Lightning,
  Clock,
  Video,
  Shapes,
  TextAUnderline,
  Layout,
} from "@phosphor-icons/react";

export default function Features({ grid = 3, py = 16 }) {
  return (
    <section className={`container mx-auto px-4 py-${py}`}>
      <div className={`grid md:grid-cols-${grid} gap-8`}>
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <MagicWand size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Smart Path Generation
          </h3>
          <p className="text-gray-400">
            Automatically generate logical motion paths with our intelligent
            keyframe system. No more template-look!
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Lightning size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Screen Capture & Smooth Zooms
          </h3>
          <p className="text-gray-400">
            Record your screen to enable dynamic product showcases with
            beautiful zooms!
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Shapes size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Create with Text, Images, and Shapes
          </h3>
          <p className="text-gray-400">
            Build stunning compositions using our comprehensive toolkit of text
            editing, image manipulation, and vector shape tools.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TextAUnderline size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Over 35 Fonts Included
          </h3>
          <p className="text-gray-400">
            Express your creativity with our extensive collection of carefully
            curated professional fonts, ready to use in your projects.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Video size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Your Content
          </h3>
          <p className="text-gray-400">
            Import your own media and transform it with our powerful animation
            tools.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Layout size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            Video Import
          </h3>
          <p className="text-gray-400">
            Import your existing video content with desktop-class performance on
            the web
          </p>
        </div>
      </div>
    </section>
  );
}
