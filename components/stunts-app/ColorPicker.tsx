"use client";

import React from "react";
import { IColor, ColorPicker as Picker, useColor } from "react-color-palette";
import "react-color-palette/css";

export function ColorPicker({
  label,
  color,
  setColor,
}: {
  label: string;
  color: IColor;
  setColor: React.Dispatch<React.SetStateAction<IColor>>;
}) {
  //   const [color, setColor] = useColor("#561ecb");

  return (
    <>
      <label>{label}</label>
      <Picker color={color} onChange={setColor} />
    </>
  );
}
