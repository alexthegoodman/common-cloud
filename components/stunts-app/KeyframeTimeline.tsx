"use client";

import React, {
  useState,
  useRef,
  useEffect,
  JSX,
  Dispatch,
  SetStateAction,
} from "react";
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
  selectedKeyframes: string[] | null;
  setSelectedKeyframes: Dispatch<SetStateAction<string[] | null>>;
  onKeyframeChanged: (
    propertyPath: string,
    keyframeId: string,
    newTime: number
  ) => void;
  refreshTimeline: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  originalTime: number;
}

// // const renderPropertyKeyframes = (
// //   property: AnimationProperty,
// //   y: number,
// //   xToTime: any,
// //   timeToX: any,
// //   drawKeyframe: any,
// //   drawConnectingLine: any,
// //   handleKeyframeClick: any,
// //   propertyWidth: any,
// //   selectedKeyframes: any,
// //   scrollOffset: any,
// //   rowHeight: any,
// //   onKeyframeChanged: (
// //     propertyPath: string,
// //     keyframeId: string,
// //     newTime: number
// //   ) => void
// // ) => {
// //   const [dragState, setDragState] = useState<DragState>({
// //     isDragging: false,
// //     startX: 0,
// //     originalTime: 0,
// //   });

// //   // Snapping threshold in pixels
// //   const SNAP_THRESHOLD = 5;

// //   const findNearestSnapPoint = (x: number): number => {
// //     // Convert x position to time
// //     const currentTime = xToTime(x);

// //     // Find nearest snap points (e.g., every second or half second)
// //     const snapInterval = 0.5; // Half second intervals
// //     const nearestSnap = Math.round(currentTime / snapInterval) * snapInterval;

// //     // Convert back to x position
// //     const snapX = timeToX(nearestSnap);

// //     // If within threshold, return snap point, otherwise return original position
// //     return Math.abs(snapX - x) < SNAP_THRESHOLD ? snapX : x;
// //   };

// //   const handleDragStart = (e: React.MouseEvent, keyframe: any) => {
// //     console.info("handleDragStart");

// //     setDragState({
// //       isDragging: true,
// //       startX: e.clientX,
// //       originalTime: keyframe.time,
// //     });

// //     // Prevent text selection while dragging
// //     e.preventDefault();
// //   };

// //   const handleDrag = (e: React.MouseEvent, keyframe: any) => {
// //     if (!dragState.isDragging) return;

// //     const deltaX = e.clientX - dragState.startX;
// //     const newX = timeToX(msToSec(dragState.originalTime)) + deltaX;
// //     const snappedX = findNearestSnapPoint(newX);

// //     // Convert position back to time
// //     const newTime = secToMs(xToTime(snappedX));

// //     // Call the onChange callback with the new time
// //     onKeyframeChanged(property.propertyPath, keyframe.id, newTime);
// //   };

// //   const handleDragEnd = () => {
// //     setDragState({
// //       isDragging: false,
// //       startX: 0,
// //       originalTime: 0,
// //     });
// //   };

// //   return property.keyframes.map((keyframe, i) => {
// //     const x = timeToX(msToSec(keyframe.time)) - propertyWidth;
// //     const isSelected =
// //       selectedKeyframes?.some((k: string) => k === keyframe.id) || false;

// //     return (
// //       <div
// //         key={`${property.propertyPath}-${keyframe.time}`}
// //         onClick={() => handleKeyframeClick(property.propertyPath, keyframe)}
// //       >
// //         {drawKeyframe(
// //           x,
// //           y + rowHeight / 2,
// //           keyframe.keyType.type,
// //           isSelected,
// //           (e: any) => handleDragStart(e, keyframe),
// //           (e: any) => handleDrag(e, keyframe),
// //           handleDragEnd
// //         )}
// //         {i > 0 &&
// //           msToSec(property.keyframes[i - 1].time) >= xToTime(-scrollOffset) &&
// //           drawConnectingLine(
// //             timeToX(msToSec(property.keyframes[i - 1].time)),
// //             y + rowHeight / 2,
// //             x,
// //             y + rowHeight / 2
// //           )}
// //       </div>
// //     );
// //   });
// // };

// // PropertyKeyframe component to handle individual keyframe state
// interface PropertyKeyframeProps {
//   property: AnimationProperty;
//   keyframe: any; // Replace with your keyframe type
//   index: number;
//   y: number;
//   xToTime: (x: number) => number;
//   timeToX: (time: number) => number;
//   drawKeyframe: any; // Replace with proper type
//   drawConnectingLine: any; // Replace with proper type
//   handleKeyframeClick: (propertyPath: string, keyframe: any) => void;
//   propertyWidth: number;
//   selectedKeyframes: string[] | null;
//   scrollOffset: number;
//   rowHeight: number;
//   onKeyframeChanged: (
//     propertyPath: string,
//     keyframeId: string,
//     newTime: number
//   ) => void;
// }

// const PropertyKeyframe: React.FC<PropertyKeyframeProps> = ({
//   property,
//   keyframe,
//   index,
//   y,
//   xToTime,
//   timeToX,
//   drawKeyframe,
//   drawConnectingLine,
//   handleKeyframeClick,
//   propertyWidth,
//   selectedKeyframes,
//   scrollOffset,
//   rowHeight,
//   onKeyframeChanged,
// }) => {
//   const [dragState, setDragState] = useState<{
//     isDragging: boolean;
//     startX: number;
//     originalTime: number;
//   }>({
//     isDragging: false,
//     startX: 0,
//     originalTime: 0,
//   });

//   // Snapping threshold in pixels
//   const SNAP_THRESHOLD = 5;

//   const findNearestSnapPoint = (x: number): number => {
//     const currentTime = xToTime(x);
//     const snapInterval = 0.5; // Half second intervals
//     const nearestSnap = Math.round(currentTime / snapInterval) * snapInterval;
//     const snapX = timeToX(nearestSnap);
//     return Math.abs(snapX - x) < SNAP_THRESHOLD ? snapX : x;
//   };

//   const handleDragStart = (e: React.MouseEvent) => {
//     console.info("handleDragStart");
//     setDragState({
//       isDragging: true,
//       startX: e.clientX,
//       originalTime: keyframe.time,
//     });
//     e.preventDefault();
//   };

//   const handleDrag = (e: React.MouseEvent) => {
//     // console.info("handle drag", dragState);
//     if (!dragState.isDragging) return;

//     const deltaX = e.clientX - dragState.startX;
//     const newX = timeToX(msToSec(dragState.originalTime)) + deltaX;
//     const snappedX = findNearestSnapPoint(newX);
//     const newTime = secToMs(xToTime(snappedX));

//     onKeyframeChanged(property.propertyPath, keyframe.id, newTime);
//   };

//   const handleDragEnd = () => {
//     setDragState({
//       isDragging: false,
//       startX: 0,
//       originalTime: 0,
//     });
//   };

//   const x = timeToX(msToSec(keyframe.time)) - propertyWidth;
//   const isSelected = selectedKeyframes?.some((k) => k === keyframe.id) || false;

//   return (
//     <div
//       key={`${property.propertyPath}-${keyframe.time}`}
//       onClick={() => handleKeyframeClick(property.propertyPath, keyframe)}
//     >
//       {drawKeyframe(
//         x,
//         y + rowHeight / 2,
//         keyframe.keyType.type,
//         isSelected,
//         handleDragStart,
//         handleDrag,
//         handleDragEnd
//       )}
//       {index > 0 &&
//         msToSec(property.keyframes[index - 1].time) >= xToTime(-scrollOffset) &&
//         drawConnectingLine(
//           timeToX(msToSec(property.keyframes[index - 1].time)),
//           y + rowHeight / 2,
//           x,
//           y + rowHeight / 2
//         )}
//     </div>
//   );
// };

// PropertyKeyframes component to handle the collection of keyframes

interface PropertyKeyframeProps {
  property: AnimationProperty;
  keyframe: any;
  index: number;
  y: number;
  xToTime: (x: number) => number;
  timeToX: (time: number) => number;
  drawKeyframe: any;
  drawConnectingLine: any;
  handleKeyframeClick: (propertyPath: string, keyframe: any) => void;
  propertyWidth: number;
  selectedKeyframes: string[] | null;
  scrollOffset: number;
  rowHeight: number;
  onKeyframeChanged: (
    propertyPath: string,
    keyframeId: string,
    newTime: number
  ) => void;
}

interface PropertyKeyframesProps {
  property: AnimationProperty;
  y: number;
  xToTime: (x: number) => number;
  timeToX: (time: number) => number;
  drawKeyframe: any; // Replace with proper type
  drawConnectingLine: any; // Replace with proper type
  handleKeyframeClick: (propertyPath: string, keyframe: any) => void;
  propertyWidth: number;
  selectedKeyframes: string[] | null;
  scrollOffset: number;
  rowHeight: number;
  onKeyframeChanged: (
    propertyPath: string,
    keyframeId: string,
    newTime: number
  ) => void;
}

const PropertyKeyframe: React.FC<PropertyKeyframeProps> = ({
  property,
  keyframe,
  index,
  y,
  xToTime,
  timeToX,
  drawKeyframe,
  drawConnectingLine,
  handleKeyframeClick,
  propertyWidth,
  selectedKeyframes,
  scrollOffset,
  rowHeight,
  onKeyframeChanged,
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    originalTime: number;
    currentX: number;
  }>({
    isDragging: false,
    startX: 0,
    originalTime: 0,
    currentX: timeToX(msToSec(keyframe.time)) - propertyWidth,
  });

  const SNAP_THRESHOLD = 5;

  const findNearestSnapPoint = (x: number): number => {
    const currentTime = xToTime(x);
    const snapInterval = 0.5;
    const nearestSnap = Math.round(currentTime / snapInterval) * snapInterval;
    const snapX = timeToX(nearestSnap);
    return Math.abs(snapX - x) < SNAP_THRESHOLD ? snapX : x;
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      originalTime: keyframe.time,
      currentX: timeToX(msToSec(keyframe.time)) - propertyWidth,
    });
    e.preventDefault();
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const newX = timeToX(msToSec(dragState.originalTime)) + deltaX;
    const snappedX = findNearestSnapPoint(newX);

    // Only update the visual position during drag
    setDragState((prev) => ({
      ...prev,
      currentX: snappedX - propertyWidth,
    }));
  };

  const handleDragEnd = () => {
    if (dragState.isDragging) {
      // Calculate final time and call onKeyframeChanged
      const newTime = secToMs(xToTime(dragState.currentX + propertyWidth));
      onKeyframeChanged(property.propertyPath, keyframe.id, newTime);
    }

    setDragState({
      isDragging: false,
      startX: 0,
      originalTime: 0,
      currentX: timeToX(msToSec(keyframe.time)) - propertyWidth,
    });
  };

  const isSelected = selectedKeyframes?.some((k) => k === keyframe.id) || false;

  // Use dragState.currentX for position during drag, otherwise use calculated position
  const x = dragState.isDragging
    ? dragState.currentX
    : timeToX(msToSec(keyframe.time)) - propertyWidth;

  useEffect(() => {
    // Update currentX when keyframe.time changes from external updates
    if (!dragState.isDragging) {
      setDragState((prev) => ({
        ...prev,
        currentX: timeToX(msToSec(keyframe.time)) - propertyWidth,
      }));
    }
  }, [keyframe.time, timeToX, propertyWidth]);

  // Add event listeners for when mouse leaves the window
  useEffect(() => {
    const handleMouseUp = () => {
      if (dragState.isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState.isDragging]);

  return (
    <div
      key={`${property.propertyPath}-${keyframe.time}`}
      onClick={() => handleKeyframeClick(property.propertyPath, keyframe)}
    >
      {drawKeyframe(
        x,
        y + rowHeight / 2,
        keyframe.keyType.type,
        isSelected,
        handleDragStart,
        handleDrag,
        handleDragEnd
      )}
      {index > 0 &&
        msToSec(property.keyframes[index - 1].time) >= xToTime(-scrollOffset) &&
        drawConnectingLine(
          timeToX(msToSec(property.keyframes[index - 1].time)),
          y + rowHeight / 2,
          x,
          y + rowHeight / 2
        )}
    </div>
  );
};

// PropertyKeyframes component remains the same
const PropertyKeyframes: React.FC<PropertyKeyframesProps> = ({
  property,
  y,
  xToTime,
  timeToX,
  drawKeyframe,
  drawConnectingLine,
  handleKeyframeClick,
  propertyWidth,
  selectedKeyframes,
  scrollOffset,
  rowHeight,
  onKeyframeChanged,
}) => {
  return property.keyframes.map((keyframe, index) => (
    <PropertyKeyframe
      key={`${property.propertyPath}-${keyframe.time}`}
      property={property}
      keyframe={keyframe}
      index={index}
      y={y}
      xToTime={xToTime}
      timeToX={timeToX}
      drawKeyframe={drawKeyframe}
      drawConnectingLine={drawConnectingLine}
      handleKeyframeClick={handleKeyframeClick}
      propertyWidth={propertyWidth}
      selectedKeyframes={selectedKeyframes}
      scrollOffset={scrollOffset}
      rowHeight={rowHeight}
      onKeyframeChanged={onKeyframeChanged}
    />
  ));
};

// const PropertyKeyframes: React.FC<PropertyKeyframesProps> = ({
//   property,
//   y,
//   xToTime,
//   timeToX,
//   drawKeyframe,
//   drawConnectingLine,
//   handleKeyframeClick,
//   propertyWidth,
//   selectedKeyframes,
//   scrollOffset,
//   rowHeight,
//   onKeyframeChanged,
// }) => {
//   return property.keyframes.map((keyframe, index) => (
//     <PropertyKeyframe
//       key={`${property.propertyPath}-${keyframe.time}`}
//       property={property}
//       keyframe={keyframe}
//       index={index}
//       y={y}
//       xToTime={xToTime}
//       timeToX={timeToX}
//       drawKeyframe={drawKeyframe}
//       drawConnectingLine={drawConnectingLine}
//       handleKeyframeClick={handleKeyframeClick}
//       propertyWidth={propertyWidth}
//       selectedKeyframes={selectedKeyframes}
//       scrollOffset={scrollOffset}
//       rowHeight={rowHeight}
//       onKeyframeChanged={onKeyframeChanged}
//     />
//   ));
// };

const renderProperties = (
  properties: AnimationProperty[],
  startY: number,
  xToTime: (x: number) => number,
  timeToX: (time: number) => number,
  drawKeyframe: any,
  drawConnectingLine: any,
  handleKeyframeClick: (propertyPath: string, keyframe: any) => void,
  propertyWidth: number,
  selectedKeyframes: string[] | null,
  scrollOffset: number,
  rowHeight: number,
  drawPropertyLabel: any,
  onKeyframeChanged: (
    propertyPath: string,
    keyframeId: string,
    newTime: number
  ) => void
): { elements: JSX.Element[]; nextY: number } => {
  let currentY = startY;
  const elements: JSX.Element[] = [];

  properties.forEach((property) => {
    elements.push(
      drawPropertyLabel(property, currentY),
      <PropertyKeyframes
        key={`${property.propertyPath}-keyframes`}
        property={property}
        y={currentY}
        xToTime={xToTime}
        timeToX={timeToX}
        drawKeyframe={drawKeyframe}
        drawConnectingLine={drawConnectingLine}
        handleKeyframeClick={handleKeyframeClick}
        propertyWidth={propertyWidth}
        selectedKeyframes={selectedKeyframes}
        scrollOffset={scrollOffset}
        rowHeight={rowHeight}
        onKeyframeChanged={onKeyframeChanged}
      />
    );

    currentY += rowHeight;
  });

  return { elements, nextY: currentY };
};

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
  selectedKeyframes,
  setSelectedKeyframes,
  onKeyframeChanged,
  refreshTimeline,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<UIKeyframe | null>(
    null
  );
  // const [selectedKeyframes, setSelectedKeyframes] = useState<UIKeyframe[]>([]);
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
  }, [editorRef, editorStateRef, sequenceId, objectId, refreshTimeline]); // Add proper dependencies

  //   const timeToX = (time: number) => {
  //     return time * propertyWidth * zoomLevel - scrollOffset;
  //   };

  //   const xToTime = (x: number) => {
  //     return Math.max(0, (x + scrollOffset) / (propertyWidth * zoomLevel));
  //   };

  const getAdjustedPropertyWidth = (baseWidth: number, currentZoom: number) => {
    // If zooming out (zoom < 1), increase property width proportionally
    // return baseWidth * (currentZoom < 1 ? 1 / currentZoom : 1);
    return baseWidth;
  };

  const timeToX = (time: number) => {
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    return time * adjustedWidth * zoomLevel - scrollOffset;
  };

  const xToTime = (x: number) => {
    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    return Math.max(0, (x + scrollOffset) / (adjustedWidth * zoomLevel));
  };

  // const handleTimeSliderChange = (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   setCurrentTime(parseFloat(event.target.value));
  // };

  // const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setZoomLevel(parseFloat(event.target.value));
  // };

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

  // const handleScroll = (event: React.WheelEvent) => {
  //   // Prevent default scroll behavior
  //   event.preventDefault();

  //   setZoomLevel((prevZoom) => {
  //     const newZoom = prevZoom * (event.deltaY < 0 ? 1.1 : 0.9);
  //     return Math.min(Math.max(0.1, newZoom), 5); // Clamp between 0.1 and 5
  //   });
  // };

  // // Prevent page scroll when mouse is over timeline
  // useEffect(() => {
  //   const timeline = timelineRef.current;
  //   if (!timeline) return;

  //   const preventScroll = (e: WheelEvent) => {
  //     e.preventDefault();
  //   };

  //   timeline.addEventListener("wheel", preventScroll, { passive: false });

  //   return () => {
  //     timeline.removeEventListener("wheel", preventScroll);
  //   };
  // }, [animationData]);

  const handleKeyframeClick = (propertyPath: string, keyframe: UIKeyframe) => {
    // setSelectedKeyframes((prev) =>
    //   prev.some((k) => k === keyframe)
    //     ? prev.filter((k) => k !== keyframe)
    //     : [...prev, keyframe]
    // );
    console.info("keyframe click", keyframe.id);
    setSelectedKeyframes([keyframe.id]);
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
          fontSize: "12px",
        }}
      >
        <span onClick={() => togglePropertyExpansion(property.propertyPath)}>
          {prefix}
          {property.name}
        </span>
      </div>
    );
  };

  // const drawKeyframe = (
  //   x: number,
  //   y: number,
  //   keyType: string,
  //   isSelected: boolean
  // ) => {
  //   const size = 6;
  //   const color = isSelected
  //     ? keyType === "Frame"
  //       ? "blue"
  //       : "red"
  //     : keyType === "Frame"
  //     ? "orange"
  //     : "orangered";

  //   const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
  //   const adjustedX = adjustedWidth + x; // Add property width to position keyframes after the label

  //   return (
  //     <div
  //       style={{
  //         position: "absolute",
  //         left: `${adjustedX - size}px`,
  //         top: `${y - size}px`,
  //         width: `${size * 2}px`,
  //         height: `${size * 2}px`,
  //         transform: "rotate(45deg)",
  //         backgroundColor: color,
  //         cursor: "pointer",
  //         zIndex: 2,
  //       }}
  //       className="keyframe"
  //     />
  //   );
  // };

  const drawKeyframe = (
    x: number,
    y: number,
    keyType: string,
    isSelected: boolean,
    onDragStart: (e: React.MouseEvent) => void,
    onDrag: (e: React.MouseEvent) => void,
    onDragEnd: (e: React.MouseEvent) => void
  ) => {
    const size = 6;
    const color = isSelected
      ? keyType === "Frame"
        ? "blue"
        : "red"
      : keyType === "Frame"
      ? "orange"
      : "orangered";

    const adjustedWidth = getAdjustedPropertyWidth(propertyWidth, zoomLevel);
    const adjustedX = adjustedWidth + x;

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
          cursor: "grab",
          zIndex: 2,
        }}
        className="keyframe"
        onMouseDown={onDragStart}
        onMouseMove={onDrag}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      />
    );
  };

  const drawConnectingLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const adjustedWidth =
      getAdjustedPropertyWidth(propertyWidth, zoomLevel) - propertyWidth;
    const adjustedX1 = adjustedWidth + x1;
    const adjustedX2 = adjustedWidth + x2;

    return (
      <div
        style={{
          position: "absolute",
          top: `${Math.min(y1, y2)}px`,
          left: `${Math.min(adjustedX1, adjustedX2)}px`,
          width: `${Math.abs(adjustedX2 - adjustedX1 + propertyWidth)}px`,
          height: "1px",
          backgroundColor: "darkgray",
        }}
      />
    );
  };

  // const renderPropertyKeyframes = (property: AnimationProperty, y: number) => {
  //   return property.keyframes.map((keyframe, i) => {
  //     const x = timeToX(msToSec(keyframe.time)) - propertyWidth;
  //     let isSelected = selectedKeyframes?.some((k) => k === keyframe.id);

  //     if (typeof isSelected === "undefined") {
  //       isSelected = false;
  //     }

  //     return (
  //       <div
  //         key={`${property.propertyPath}-${keyframe.time}`}
  //         onClick={() => handleKeyframeClick(property.propertyPath, keyframe)}
  //       >
  //         {drawKeyframe(
  //           x,
  //           y + rowHeight / 2,
  //           keyframe.keyType.type,
  //           isSelected
  //         )}
  //         {i > 0 &&
  //           msToSec(property.keyframes[i - 1].time) >= xToTime(-scrollOffset) &&
  //           drawConnectingLine(
  //             timeToX(msToSec(property.keyframes[i - 1].time)),
  //             y + rowHeight / 2,
  //             x,
  //             y + rowHeight / 2
  //           )}
  //       </div>
  //     );
  //   });
  // };

  // const renderProperties = (
  //   properties: AnimationProperty[],
  //   startY: number,
  //   onKeyframeChanged: (
  //     propertyPath: string,
  //     keyframeId: string,
  //     newTime: number
  //   ) => void
  // ): { elements: JSX.Element[]; nextY: number } => {
  //   let currentY = startY;
  //   const elements: JSX.Element[] = [];

  //   properties.forEach((property) => {
  //     // Add property label and keyframes at current Y position
  //     elements.push(
  //       drawPropertyLabel(property, currentY),
  //       ...renderPropertyKeyframes(
  //         property,
  //         currentY,
  //         xToTime,
  //         timeToX,
  //         drawKeyframe,
  //         drawConnectingLine,
  //         handleKeyframeClick,
  //         propertyWidth,
  //         selectedKeyframes,
  //         scrollOffset,
  //         rowHeight,
  //         onKeyframeChanged
  //       )
  //     );

  //     // Move to next row
  //     currentY += rowHeight;
  //   });

  //   return { elements, nextY: currentY };
  // };

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
    headerHeight,
    xToTime,
    timeToX,
    drawKeyframe,
    drawConnectingLine,
    handleKeyframeClick,
    propertyWidth,
    selectedKeyframes,
    scrollOffset,
    rowHeight,
    drawPropertyLabel,
    onKeyframeChanged
  );

  return (
    <div
      className="timeline"
      style={{
        width,
        height: "auto",
        overflowX: "auto",
        overflowY: "auto",
        paddingBottom: "25px",
      }}
      ref={timelineRef}
      // onWheel={handleScroll}
    >
      {/* <div
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
      </div> */}

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

function secToMs(time: number) {
  return time * 1000;
}

export default KeyframeTimeline;
