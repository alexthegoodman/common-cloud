"use client";

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ColorPicker } from "./ColorPicker";
import { useColor } from "react-color-palette";

export function BrandKitModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [color, setColor] = useColor("#561ecb");
  const [colorSecondary, setColorSecondary] = useColor("#561ecb");

  return (
    <>
      {/* <button onClick={() => setIsOpen(true)}>Open dialog</button> */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 border bg-white p-12">
            <DialogTitle className="font-bold">Create Brand Kit</DialogTitle>
            <Description>
              This will enable you to create projects which reflect your unique
              brand.
            </Description>
            <p>
              Select 2 colors and a font that represent your brand. You can
              always change these later.
            </p>
            <div>
              <ColorPicker
                label="Primary Color"
                color={color}
                setColor={setColor}
              />
              <ColorPicker
                label="Secondary Color"
                color={colorSecondary}
                setColor={setColorSecondary}
              />
              {/* <FontPicker label="Font" font={font} setFont={setFont} /> */}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button onClick={() => setIsOpen(false)}>Confirm</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
