"use client";

import React, { useState, useRef, useEffect, JSX } from "react";
import {
  AnimationData,
  AnimationProperty,
  KeyType,
  ObjectType,
  UIKeyframe,
} from "@/engine/animations";
import EditorState from "@/engine/editor_state";
import { Editor } from "@/engine/editor";

interface TimelineProps {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  objectId: string;
  objectType: ObjectType;
  sequenceId: string;
  width: number;
  height: number;
  headerHeight: number;
  propertyWidth: number;
  rowHeight: number;
}

const KeyframeTimeline: React.FC<TimelineProps> = ({
  editorRef,
  editorStateRef,
  objectId,
  objectType,
  sequenceId,
  width,
  height,
  headerHeight,
  propertyWidth,
  rowHeight,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<UIKeyframe | null>(
    null
  );
  const [selectedKeyframes, setSelectedKeyframes] = useState<UIKeyframe[]>([]);
  const [propertyExpansions, setPropertyExpansions] = useState<
    Record<string, boolean>
  >({});
  const [animationData, setAnimationData] = useState<AnimationData | null>(
    null
  );

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) {
      console.warn("No editor in timeline");
      return;
    }

    const sequence = editorState.savedState.sequences.find(
      (s) => s.id === sequenceId
    );
    const data = sequence?.polygonMotionPaths.find(
      (p) => p.polygonId === objectId
    );

    if (!data) {
      console.warn("No data for timeline");
      return;
    }

    setAnimationData(data);
  }, [editorRef, editorStateRef, sequenceId, objectId]); // Add proper dependencies

  //   const timeToX = (time: number) => {
  //     return time * propertyWidth * zoomLevel - scrollOffset;
  //   };

  //   const xToTime = (x: number) => {
  //     return Math.max(0, (x + scrollOffset) / (propertyWidth * zoomLevel));
  //   };

  const getAdjustedPropertyWidth = (baseWidth: number, currentZoom: number) => {
    // If zooming out (zoom < 1), increase property width proportionally
    return baseWidth * (currentZoom < 1 ? 1 / currentZoom : 1);
  };

  const timeToX = (time: number) => {
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    return time * adjustedWidth * zoomLevel - scrollOffset;
  };

  const xToTime = (x: number) => {
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    return Math.max(0, (x + scrollOffset) / (adjustedWidth * zoomLevel));
  };

  const handleTimeSliderChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentTime(parseFloat(event.target.value));
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(event.target.value));
  };

  //   const handleScroll = (event: React.WheelEvent) => {
  //     event.preventDefault();
  //     setScrollOffset((prevOffset) => Math.max(0, prevOffset - event.deltaY));
  //   };

  //   const handleScroll = (event: React.WheelEvent) => {
  //     // Prevent default scroll behavior
  //     event.preventDefault();

  //     // Handle zoom if ctrl/cmd key is pressed
  //     if (event.ctrlKey || event.metaKey) {
  //       setZoomLevel((prevZoom) => {
  //         const newZoom = prevZoom * (event.deltaY < 0 ? 1.1 : 0.9);
  //         return Math.min(Math.max(0.1, newZoom), 5); // Clamp between 0.1 and 5
  //       });
  //     }
  //     // Otherwise handle pan
  //     else {
  //       setScrollOffset((prevOffset) => {
  //         const newOffset = prevOffset - event.deltaX + event.deltaY;
  //         return Math.max(0, newOffset); // Prevent negative scroll
  //       });
  //     }
  //   };

  const handleScroll = (event: React.WheelEvent) => {
    // Prevent default scroll behavior
    event.preventDefault();

    setZoomLevel((prevZoom) => {
      const newZoom = prevZoom * (event.deltaY < 0 ? 1.1 : 0.9);
      return Math.min(Math.max(0.1, newZoom), 5); // Clamp between 0.1 and 5
    });
  };

  // Prevent page scroll when mouse is over timeline
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    timeline.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      timeline.removeEventListener("wheel", preventScroll);
    };
  }, [animationData]);

  const handleKeyframeClick = (propertyPath: string, keyframe: UIKeyframe) => {
    setSelectedKeyframes((prev) =>
      prev.some((k) => k === keyframe)
        ? prev.filter((k) => k !== keyframe)
        : [...prev, keyframe]
    );
  };

  const togglePropertyExpansion = (propertyPath: string) => {
    setPropertyExpansions((prev) => ({
      ...prev,
      [propertyPath]: !prev[propertyPath],
    }));
  };

  const drawPropertyLabel = (property: AnimationProperty, y: number) => {
    const indent = property.propertyPath.split("/").length * 15;
    const isExpanded = propertyExpansions[property.propertyPath] || false;
    const prefix =
      property.children.length > 0 ? (isExpanded ? "▼ " : "▶ ") : "  ";
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);

    return (
      <div
        key={property.propertyPath}
        style={{
          position: "absolute",
          left: `${indent}px`,
          top: `${y}px`,
          width: `${adjustedWidth}px`,
        }}
      >
        <span onClick={() => togglePropertyExpansion(property.propertyPath)}>
          {prefix}
          {property.name}
        </span>
      </div>
    );
  };

  const drawKeyframe = (
    x: number,
    y: number,
    keyType: string,
    isSelected: boolean
  ) => {
    const size = 8;
    const color = isSelected
      ? keyType === "Frame"
        ? "blue"
        : "red"
      : keyType === "Frame"
      ? "orange"
      : "orangered";

    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    const adjustedX = adjustedWidth + x; // Add property width to position keyframes after the label

    return (
      <div
        style={{
          position: "absolute",
          left: `${adjustedX - size}px`,
          top: `${y - size}px`,
          width: `${size * 2}px`,
          height: `${size * 2}px`,
          transform: "rotate(45deg)",
          backgroundColor: color,
          cursor: "pointer",
        }}
        className="keyframe"
      />
    );
  };

  const drawConnectingLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    const adjustedX1 = adjustedWidth + x1;
    const adjustedX2 = adjustedWidth + x2;

    return (
      <div
        style={{
          position: "absolute",
          top: `${Math.min(y1, y2)}px`,
          left: `${Math.min(adjustedX1, adjustedX2)}px`,
          width: `${Math.abs(adjustedX2 - adjustedX1)}px`,
          height: "1px",
          backgroundColor: "darkgray",
        }}
      />
    );
  };

  const renderPropertyKeyframes = (property: AnimationProperty, y: number) => {
    return property.keyframes.map((keyframe, i) => {
      const x = timeToX(msToSec(keyframe.time));
      const isSelected = selectedKeyframes.some((k) => k === keyframe);

      return (
        <div
          key={`${property.propertyPath}-${keyframe.time}`}
          onClick={() => handleKeyframeClick(property.propertyPath, keyframe)}
        >
          {drawKeyframe(
            x,
            y + rowHeight / 2,
            keyframe.keyType.type,
            isSelected
          )}
          {i > 0 &&
            msToSec(property.keyframes[i - 1].time) >= xToTime(-scrollOffset) &&
            drawConnectingLine(
              timeToX(msToSec(property.keyframes[i - 1].time)),
              y + rowHeight / 2,
              x,
              y + rowHeight / 2
            )}
        </div>
      );
    });
  };

  const renderProperties = (
    properties: AnimationProperty[],
    startY: number
  ): { elements: JSX.Element[]; nextY: number } => {
    let currentY = startY;
    const elements: JSX.Element[] = [];

    properties.forEach((property) => {
      // Add property label and keyframes at current Y position
      elements.push(
        drawPropertyLabel(property, currentY),
        ...renderPropertyKeyframes(property, currentY)
      );

      // Move to next row
      currentY += rowHeight;

      // If property is expanded and has children, render them
      //   const isExpanded = propertyExpansions[property.propertyPath] || false;
      //   if (isExpanded && property.children.length > 0) {
      //     const childResult = renderProperties(property.children, currentY);
      //     elements.push(...childResult.elements);
      //     currentY = childResult.nextY;
      //   }
    });

    return { elements, nextY: currentY };
  };

  if (!animationData) {
    return <div>No animation data available.</div>;
  }

  const duration = msToSec(animationData.duration);
  const step = Math.max(0.1, 0.5 / zoomLevel);
  const timeGridElements = Array.from(
    { length: Math.ceil(duration / step) },
    (_, i) => {
      const time = i * step;
      const x = timeToX(time);
      return (
        <React.Fragment key={time}>
          <div
            style={{
              position: "absolute",
              left: `${x}px`,
              top: 0,
              height: "100%",
              borderLeft: "1px solid gray",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${x}px`,
              top: 0,
              fontSize: "10px",
            }}
          >
            {time.toFixed(1)}s
          </div>
        </React.Fragment>
      );
    }
  );

  // Calculate total height needed for all properties
  const { elements: propertyElements, nextY: totalHeight } = renderProperties(
    animationData.properties,
    headerHeight
  );

  return (
    <div
      className="timeline"
      style={{ width, height, overflowX: "auto", overflowY: "auto" }}
      ref={timelineRef}
      onWheel={handleScroll}
    >
      <div
        className="time-slider"
        style={{
          height: headerHeight,
          width: "100%",
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 1,
        }}
      >
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={handleTimeSliderChange}
          style={{ width: "100%" }}
        />
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={zoomLevel}
          onChange={handleZoomChange}
          style={{ width: "100%" }}
        />
      </div>

      <div
        className="timeline-grid"
        style={{
          width: `${duration * propertyWidth * zoomLevel}px`,
          height: `${totalHeight}px`,
          position: "relative",
        }}
      >
        {timeGridElements}
        {propertyElements}
      </div>
    </div>
  );
};

function msToSec(time: number) {
  return time / 1000;
}

export default KeyframeTimeline;
