"use client";

import { Check, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { BrandKitModal } from "./BrandKitModal";

export const BrandKitList = () => {
  let [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mx-auto w-full md:w-[600px]">
      <span className="block text-sm mb-2">Select brand kit</span>
      <div className="flex flex-row flex-wrap gap-2 mb-4">
        <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
          <div className="border border-slate-500 border-l-none p-1 rounded-full bg-green-500 text-white">
            {/* <CreateIcon icon="check" size="24px" /> */}
            <Check weight="regular" size="24px" />
          </div>
          <div className="pl-2 pr-3">
            <span className="text-sm">Common Brand Kit</span>
          </div>
        </div>
        <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
          {/* <div className="border border-black border-l-none p-1 rounded-full">
            <CreateIcon icon="check" size="24px" />
          </div> */}
          <div className="pl-3 pr-3">
            <span className="text-sm">Stunts Branding</span>
          </div>
        </div>
        <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
          {/* <div className="border border-black border-l-none p-1 rounded-full">
            <CreateIcon icon="check" size="24px" />
          </div> */}
          <div className="pl-3 pr-3">
            <span className="text-sm">Default Brand Kit</span>
          </div>
        </div>
        <div
          className="flex flex-row items-center rounded-full cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="p-1 rounded-full bg-indigo-500 text-white">
            {/* <CreateIcon icon="check" size="24px" /> */}
            <Plus weight="regular" size="24px" />
          </div>
        </div>
        <BrandKitModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </section>
  );
};
