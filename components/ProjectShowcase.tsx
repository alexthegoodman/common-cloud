"use client";

import React from "react";
import { ArrowRight, Code, Cpu, Globe } from "@phosphor-icons/react";
import Image from "next/image";

const ProjectShowcase = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Rust Project */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-10 flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-orange-100 p-6 flex items-center justify-center">
          {/* <img src=""> */}
          <Image
            src="/midpoint-editor.png"
            width={500}
            height={280}
            alt="Midpoint Game Engine"
          />
        </div>
        <div className="md:w-2/3 p-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <Code className="mr-3 text-orange-500" /> Midpoint
          </h2>
          <p className="text-gray-600 mb-4">
            A high-performance game engine enabling the creation of large
            open-world games. Created in fully native Rust with the Floem UI
            framework and wgpu rendering library, Midpoint offers susbtantial
            speed advantages over Tauri or Electron. Midpoint also features a
            quadtree large landscape implementation, enabling expansive terrain
            rendering without cracks.
          </p>
          <a
            className="flex flex-row justify-center items-center bg-orange-100 p-2 rounded mb-4 w-[200px] text-center"
            href="https://github.com/alexthegoodman/midpoint-editor"
            target="_blank"
          >
            See the Code
            <ArrowRight className="ml-2" />
          </a>
          <div className="flex space-x-4">
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              Rust
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              3D
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              Native GUI
            </span>
          </div>
        </div>
      </div>

      {/* Web Project */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-10 flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-blue-100 p-6 flex items-center justify-center">
          {/* <Globe className="w-24 h-24 text-blue-500" /> */}
          <Image
            src="/stunts-web.jpeg"
            width={500}
            height={280}
            alt="Stunts Video Editor"
          />
        </div>
        <div className="md:w-2/3 p-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <Globe className="mr-3 text-blue-500" /> Stunts
          </h2>
          <p className="text-gray-600 mb-4">
            A full-stack web application enabling the creation of beautiful
            motion graphics videos. Offering complete cross-platform
            compatability in an easily deployed package, Stunts renders video
            completely client-side, performantly, and with small file sizes.
          </p>
          <a
            className="flex flex-row justify-center items-center bg-blue-100 p-2 rounded mb-4 w-[200px] text-center"
            href="https://github.com/alexthegoodman/common-cloud"
            target="_blank"
          >
            See the Code
            <ArrowRight className="ml-2" />
          </a>
          <div className="flex space-x-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              React
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              WebGPU
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              WebCodecs
            </span>
          </div>
        </div>
      </div>

      {/* Machine Learning Project */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-green-100 p-6 flex items-center justify-center">
          <Cpu className="w-24 h-24 text-green-500" />
        </div>
        <div className="md:w-2/3 p-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <Cpu className="mr-3 text-green-500" /> CommonMotion2D
          </h2>
          <p className="text-gray-600 mb-4">
            A machine learning model which generates motion path keyframes and
            is designed to run on under 1GB of RAM.
          </p>
          <a
            className="flex flex-row justify-center items-center bg-green-100 p-2 rounded mb-4 w-[200px] text-center"
            href="https://github.com/alexthegoodman/common-motion-2d-reg"
            target="_blank"
          >
            See the Code
            <ArrowRight className="ml-2" />
          </a>
          <div className="flex space-x-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Rust
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Burn
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Lightweight
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectShowcase;
