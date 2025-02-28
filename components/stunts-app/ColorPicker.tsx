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
  const [localColor, setLocalColor] = useColor(
    `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`
  );

  return (
    <>
      <label>{label}</label>
      <Picker
        color={localColor}
        onChange={setLocalColor}
        onChangeComplete={setColor}
      />
    </>
  );
}
