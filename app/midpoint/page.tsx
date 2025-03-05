"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  ShieldChevron,
  MagicWand,
  Lightning,
  Clock,
  Video,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

const HomePage = () => {
  // const router = useRouter();

  // const clickPrimary = () => {
  //   router.push("/stunts/");
  // };

  return (
    <div className="min-h-screen bg-gradient-to-g">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-bold mb-6">Midpoint</h1>
          </motion.div>
          <h1 className="text-5xl font-bold pb-2 mb-6 bg-gradient-to-r from-green-500 to-yellow-500 text-transparent bg-clip-text">
            The Game Engine for Regular People
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Midpoint enables people to build large, open-world games with
            features that work right out of the box, while also being driven by
            a Rust engine and Rust code.
          </p>
          <pre className="p-8 bg-gray-200 max-w-[700px] mx-auto text-left leading-8 mb-8">
            {`mkdir midpoint
cd midpoint
git clone https://github.com/alexthegoodman/common-floem.git
git clone https://github.com/alexthegoodman/midpoint-engine.git
git clone https://github.com/alexthegoodman/midpoint-editor.git
cd midpoint-editor
cargo run --release`}
          </pre>
          <div className="flex justify-center gap-4">
            <a
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full flex items-center"
              href="https://github.com/alexthegoodman/midpoint-editor"
              target="_blank"
            >
              Try Midpoint <ShieldChevron className="ml-2" />
            </a>
            <a
              href="https://youtu.be/DtaVs11wQD8?si=oDL5Xpw5A9Kve4KV"
              target="_blank"
              className="border border-green-500 text-green-500 hover:bg-green-500/10 px-8 py-3 rounded-full flex items-center"
            >
              Watch Demo <Play className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-300/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <MagicWand className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-green-500">
              Import Generated Assets
            </h3>
            <p className="text-gray-600">
              Midpoint is designed to work with GLB files from the likes of
              Hunyuan3D-2 and StableFast3D, as well as PNG textures from models
              such as Stable Diffusion.
            </p>
          </div>

          <div className="bg-gray-300/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lightning className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-green-500">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Most features work right out of the box, including large terrain
              LODs, while the Rust / wgpu engine makes it highly performant at
              runtime.
            </p>
          </div>

          <div className="bg-gray-300/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Video className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-green-500">
              Your Vision
            </h3>
            <p className="text-gray-600">
              Forget about sacrificing your vision to fit within the constraints
              of other engines. Midpoint is very flexible and offers complete
              control.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-black">
            Looking to connect?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We are pleased to make new friends.
          </p>
          <a
            href="mailto:alexthegoodman@gmail.com"
            target="_blank"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            Contact Common <ShieldChevron className="ml-2" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
