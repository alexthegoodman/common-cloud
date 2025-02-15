"use client";

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
  CirclesThree,
  Copy,
  CubeFocus,
  DotOutline,
  DotsThreeOutlineVertical,
  Faders,
  FastForward,
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
  Resize,
  Shapes,
  Speedometer,
  Sphere,
  Square,
  TextT,
  Trash,
  Triangle,
  VectorThree,
  Video,
  Windmill,
  X,
} from "@phosphor-icons/react";

export const CreateIcon = ({ icon, size }: { icon: string; size: string }) => {
  switch (icon) {
    case "plus": {
      return <Plus weight="thin" size={size} />;
    }
    case "minus": {
      return <Minus weight="thin" size={size} />;
    }
    case "windmill": {
      return <Windmill weight="thin" size={size} />;
    }
    case "gear": {
      return <Gear weight="thin" size={size} />;
    }
    case "brush": {
      return <PaintBrush weight="thin" size={size} />;
    }
    case "shapes": {
      return <Shapes weight="thin" size={size} />;
    }
    case "arrow-left": {
      return <ArrowLeft weight="thin" size={size} />;
    }
    case "polygon": {
      return <Polygon weight="thin" size={size} />;
    }
    case "octagon": {
      return <Octagon weight="thin" size={size} />;
    }
    case "square": {
      return <Square weight="thin" size={size} />;
    }
    case "triangle": {
      return <Triangle weight="thin" size={size} />;
    }
    case "dot": {
      return <DotOutline weight="thin" size={size} />;
    }
    case "dots-vertical": {
      return <DotsThreeOutlineVertical weight="thin" size={size} />;
    }
    case "sphere": {
      return <Sphere weight="thin" size={size} />;
    }
    case "gizmo": {
      return <VectorThree weight="thin" size={size} />;
    }
    case "book": {
      return <BookOpen weight="thin" size={size} />;
    }
    case "cube": {
      return <CubeFocus weight="thin" size={size} />;
    }
    case "faders": {
      return <Faders weight="thin" size={size} />;
    }
    case "map": {
      return <MapTrifold weight="thin" size={size} />;
    }
    case "panorama": {
      return <Panorama weight="thin" size={size} />;
    }
    case "speedometer": {
      return <Speedometer weight="thin" size={size} />;
    }
    case "motion-arrow": {
      return <ArrowFatLinesRight weight="thin" size={size} />;
    }
    case "atom": {
      return <Atom weight="thin" size={size} />;
    }
    case "brain": {
      return <Brain weight="thin" size={size} />;
    }
    case "broadcast": {
      return <Broadcast weight="thin" size={size} />;
    }
    case "circles": {
      return <CirclesThree weight="thin" size={size} />;
    }
    case "fast-forward": {
      return <FastForward weight="thin" size={size} />;
    }
    case "folder-plus": {
      return <FolderPlus weight="thin" size={size} />;
    }
    case "bone": {
      return <Bone weight="thin" size={size} />;
    }
    case "caret-down": {
      return <CaretDown weight="thin" size={size} />;
    }
    case "caret-right": {
      return <CaretRight weight="thin" size={size} />;
    }
    case "translate": {
      return <ArrowsOutCardinal weight="thin" size={size} />;
    }
    case "rotate": {
      return <ArrowsClockwise weight="thin" size={size} />;
    }
    case "scale": {
      return <Resize weight="thin" size={size} />;
    }
    case "image": {
      return <Image weight="thin" size={size} />;
    }
    case "text": {
      return <TextT weight="thin" size={size} />;
    }
    case "video": {
      return <Video weight="thin" size={size} />;
    }
    case "copy": {
      return <Copy weight="thin" size={size} />;
    }
    case "trash": {
      return <Trash weight="thin" size={size} />;
    }
    case "x": {
      return <X weight="thin" size={size} />;
    }
    case "wand": {
      return <MagicWand weight="thin" size={size} />;
    }
    case "lightning": {
      return <Lightning weight="thin" size={size} />;
    }
    default: {
      return <></>;
    }
  }
};
