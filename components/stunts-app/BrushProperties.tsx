"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@/engine/editor";
import { BrushType } from "@/engine/brush";
import { X } from "@phosphor-icons/react";

interface BrushPropertiesProps {
  editorRef: React.RefObject<Editor | null>;
  onClose?: () => void;
}

export default function BrushProperties({ editorRef, onClose }: BrushPropertiesProps) {
  const [brushType, setBrushType] = useState<BrushType>(BrushType.Noise);
  const [size, setSize] = useState(20);
  const [opacity, setOpacity] = useState(0.7);
  const [flow, setFlow] = useState(0.5);
  const [spacing, setSpacing] = useState(0.25);
  const [noiseScale, setNoiseScale] = useState(0.01);
  const [octaves, setOctaves] = useState(4);
  const [persistence, setPersistence] = useState(0.5);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");

  // Pattern-specific parameters
  const [dotDensity, setDotDensity] = useState(10);
  const [lineAngle, setLineAngle] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(5);
  const [cellSize, setCellSize] = useState(50);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !editor.currentBrush) return;

    const brush = editor.currentBrush;

    // Update brush configuration
    brush.brushType = brushType;
    brush.size = size;
    brush.opacity = opacity;
    brush.flow = flow;
    brush.spacing = spacing;
    brush.noiseScale = noiseScale;
    brush.octaves = octaves;
    brush.persistence = persistence;

    // Convert hex to RGBA
    const hexToRgba = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b, 255] as [number, number, number, number];
    };

    brush.primaryColor = hexToRgba(primaryColor);
    brush.secondaryColor = hexToRgba(secondaryColor);

    // Pattern-specific
    brush.dotDensity = dotDensity;
    brush.lineAngle = (lineAngle * Math.PI) / 180; // Convert to radians
    brush.lineSpacing = lineSpacing;
    brush.cellSize = cellSize;
  }, [
    editorRef,
    brushType,
    size,
    opacity,
    flow,
    spacing,
    noiseScale,
    octaves,
    persistence,
    primaryColor,
    secondaryColor,
    dotDensity,
    lineAngle,
    lineSpacing,
    cellSize,
  ]);

  return (
    <div className="w-full p-4 theme-bg-primary border-t">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Brush Properties</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Close brush properties"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Brush Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Brush Type</label>
        <select
          value={brushType}
          onChange={(e) => setBrushType(e.target.value as BrushType)}
          className="w-full p-2 border rounded"
        >
          <option value={BrushType.Noise}>Noise</option>
          <option value={BrushType.Dots}>Dots</option>
          <option value={BrushType.Lines}>Lines</option>
          <option value={BrushType.Voronoi}>Voronoi</option>
          <option value={BrushType.Fractal}>Fractal</option>
          <option value={BrushType.Gradient}>Gradient</option>
          <option value={BrushType.Splatter}>Splatter</option>
        </select>
      </div>

      {/* Basic Properties */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Size: {size}px</label>
        <input
          type="range"
          min="5"
          max="100"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Opacity: {(opacity * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Flow: {(flow * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={flow}
          onChange={(e) => setFlow(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Spacing: {(spacing * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Colors */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Primary Color</label>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="w-full h-10 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Secondary Color
        </label>
        <input
          type="color"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          className="w-full h-10 border rounded"
        />
      </div>

      {/* Procedural Parameters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Noise Scale: {noiseScale.toFixed(3)}
        </label>
        <input
          type="range"
          min="0.001"
          max="0.1"
          step="0.001"
          value={noiseScale}
          onChange={(e) => setNoiseScale(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Octaves: {octaves}
        </label>
        <input
          type="range"
          min="1"
          max="8"
          value={octaves}
          onChange={(e) => setOctaves(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Persistence: {persistence.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={persistence}
          onChange={(e) => setPersistence(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Pattern-Specific Controls */}
      {brushType === BrushType.Dots && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Dot Density: {dotDensity}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={dotDensity}
            onChange={(e) => setDotDensity(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {brushType === BrushType.Lines && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Line Angle: {lineAngle}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={lineAngle}
              onChange={(e) => setLineAngle(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Line Spacing: {lineSpacing}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineSpacing}
              onChange={(e) => setLineSpacing(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}

      {brushType === BrushType.Voronoi && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Cell Size: {cellSize}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
