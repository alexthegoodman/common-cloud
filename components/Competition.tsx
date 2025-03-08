"use client";

import { Check } from "@phosphor-icons/react";

const Competition = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        The Competition
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center bg-slate-800/50 p-12 rounded-xl relative overflow-hidden">
          <h3 className="text-xl font-semibold mb-2 text-white">
            What makes Stunts special?
          </h3>
          <p className="text-gray-400">
            Stunts is for everybody, brining a fresh perspective on
            expressiveness and ease-of-use. Yet it has powerful features that
            make it a strong choice for professionals and amateurs alike.
          </p>
          <ul className="flex flex-col gap-2 mt-4 text-white">
            <li className="flex flex-row gap-2 items-center">
              <Check />
              <span>Generate draft animations with our in-house AI</span>
            </li>
            <li className="flex flex-row gap-2 items-center">
              <Check />
              <span>Refine animations with a tap-and-drag experience</span>
            </li>
            <li className="flex flex-row gap-2 items-center">
              <Check />
              <span>Add polygons, images, text, and video</span>
            </li>
            <li className="flex flex-row gap-2 items-center">
              <Check />
              <span>Available for Web</span>
            </li>
          </ul>
        </div>
        <div className="">
          <img src="/stunts_competition.png" className="mx-auto rounded-xl" />
        </div>
      </div>
    </section>
  );
};

export default Competition;
