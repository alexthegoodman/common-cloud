"use client";

import React from "react";
import {
  ArrowFatLinesRight,
  ArrowLeft,
  ArrowsClockwise,
  ArrowsOutCardinal,
  Atom,
  Bone,
  BookOpen,
  Brain,
  Broadcast,
  CaretDown,
  CaretRight,
  Check,
  CirclesThree,
  Copy,
  CubeFocus,
  DotOutline,
  DotsThreeOutlineVertical,
  Faders,
  FastForward,
  FileCloud,
  FilePlus,
  FolderPlus,
  Gear,
  Image,
  Lightning,
  MagicWand,
  MapTrifold,
  Minus,
  Octagon,
  PaintBrush,
  Panorama,
  Plus,
  Polygon,
  ProjectorScreenChart,
  Resize,
  Shapes,
  Speedometer,
  Sphere,
  Square,
  SquaresFour,
  Storefront,
  TextT,
  Trash,
  Triangle,
  VectorThree,
  Video,
  Windmill,
  X,
  Book,
  Sticker,
  Play,
  Pause,
  Circle,
  Laptop,
} from "@phosphor-icons/react";

export const CreateIcon = ({ icon, size }: { icon: string; size: string }) => {
  switch (icon) {
    case "laptop": {
      return <Laptop data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "play": {
      return <Play data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "pause": {
      return <Pause data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "book": {
      return <Book data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "plus": {
      return <Plus data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "minus": {
      return <Minus data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "windmill": {
      return (
        <Windmill data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "gear": {
      return <Gear data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "brush": {
      return (
        <PaintBrush data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "shapes": {
      return <Shapes data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "arrow-left": {
      return (
        <ArrowLeft data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "polygon": {
      return <Polygon data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "octagon": {
      return <Octagon data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "square": {
      return <Square data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "squares": {
      return (
        <SquaresFour data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "triangle": {
      return (
        <Triangle data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "dot": {
      return (
        <DotOutline data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "dots-vertical": {
      return (
        <DotsThreeOutlineVertical
          data-testid={`icon-${icon}`}
          weight="thin"
          size={size}
        />
      );
    }
    case "sphere": {
      return <Sphere data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "gizmo": {
      return (
        <VectorThree data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "book": {
      return (
        <BookOpen data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "cube": {
      return (
        <CubeFocus data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "faders": {
      return <Faders data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "map": {
      return (
        <MapTrifold data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "panorama": {
      return (
        <Panorama data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "speedometer": {
      return (
        <Speedometer data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "motion-arrow": {
      return (
        <ArrowFatLinesRight
          data-testid={`icon-${icon}`}
          weight="thin"
          size={size}
        />
      );
    }
    case "atom": {
      return <Atom data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "brain": {
      return <Brain data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "broadcast": {
      return (
        <Broadcast data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "circle": {
      return <Circle data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "circles": {
      return (
        <CirclesThree data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "fast-forward": {
      return (
        <FastForward data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "folder-plus": {
      return (
        <FolderPlus data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "bone": {
      return <Bone data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "caret-down": {
      return (
        <CaretDown data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "caret-right": {
      return (
        <CaretRight data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "translate": {
      return (
        <ArrowsOutCardinal
          data-testid={`icon-${icon}`}
          weight="thin"
          size={size}
        />
      );
    }
    case "rotate": {
      return (
        <ArrowsClockwise
          data-testid={`icon-${icon}`}
          weight="thin"
          size={size}
        />
      );
    }
    case "scale": {
      return <Resize data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "image": {
      return <Image data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "text": {
      return <TextT data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "video": {
      return <Video data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "copy": {
      return <Copy data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "trash": {
      return <Trash data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "x": {
      return <X data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "wand": {
      return (
        <MagicWand data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "lightning": {
      return (
        <Lightning data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "file-plus": {
      return (
        <FilePlus data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "market": {
      return (
        <Storefront data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "presentation": {
      return (
        <ProjectorScreenChart
          data-testid={`icon-${icon}`}
          weight="thin"
          size={size}
        />
      );
    }
    case "file-cloud": {
      return (
        <FileCloud data-testid={`icon-${icon}`} weight="thin" size={size} />
      );
    }
    case "check": {
      return <Check data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    case "sticker": {
      return <Sticker data-testid={`icon-${icon}`} weight="thin" size={size} />;
    }
    default: {
      return <></>;
    }
  }
};
