// import {
//   AnimationData,
//   TimelineSequence,
//   TrackType,
// } from "@/engine/animations";
// import React, { useState, useCallback } from "react";

// interface TrackProps {
//   type: TrackType;
//   objectData: AnimationData;
//   pixelsPerSecond: number;
//   onSequenceDragEnd: (animation: AnimationData, newStartTimeMs: number) => void;
// }

// export const ObjectTrack: React.FC<TrackProps> = ({
//   type,
//   objectData,
//   pixelsPerSecond,
//   onSequenceDragEnd,
// }) => {
//   //   console.info("tSequences", tSequences);

//   const pixelsPerMs = pixelsPerSecond / 1000;
//   const trackColor = type === TrackType.Audio ? "bg-blue-300" : "bg-orange-200";
//   const sequenceColor =
//     type === TrackType.Audio ? "bg-red-400" : "bg-green-400";

//   const handleDragStart = (e: React.DragEvent, animation: AnimationData) => {
//     console.info("handleDragStart");
//     e.dataTransfer.setData("text/plain", JSON.stringify(animation));
//     e.dataTransfer.effectAllowed = "move";
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     console.info("handleDragOver");
//     e.preventDefault();

//     e.dataTransfer.dropEffect = "move";
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     console.info("handleDrop");
//     e.preventDefault();

//     const animation = JSON.parse(
//       e.dataTransfer.getData("text/plain")
//     ) as AnimationData;

//     // Calculate new position based on drop coordinates
//     const trackRect = (
//       e.currentTarget as HTMLDivElement
//     ).getBoundingClientRect();
//     const newPositionX = e.clientX - trackRect.left;
//     const newStartTimeMs = Math.max(0, Math.round(newPositionX / pixelsPerMs));

//     onSequenceDragEnd(animation, newStartTimeMs);
//   };

//   const left = objectData.startTimeMs * pixelsPerMs;
//   const width = objectData.duration * pixelsPerMs;

//   return (
//     <div className="relative h-[50px] w-[900px] mb-1">
//       {/* Track background */}
//       <div
//         className={`relative w-[900px] h-[50px] ${trackColor}`}
//         onDragOver={(e) => handleDragOver(e)}
//         onDrop={(e) => handleDrop(e)}
//       />

//       {/* Sequences */}
//       <div className="relative w-full h-full p-1 top-[-50px] z-10">
//         {objectData && (
//           <div
//             key={objectData.id}
//             draggable
//             onDragStart={(e) => handleDragStart(e, objectData)}
//             className={`relative h-10 rounded cursor-pointer ${sequenceColor}
//            hover:shadow-lg transition-shadow duration-200
//            flex items-center px-2 select-none`}
//             style={{
//               left: `${left}px`,
//               width: `${width}px`,
//             }}
//           >
//             {objectData.id}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { AnimationData, TrackType } from "@/engine/animations";

interface TrackProps {
  type: TrackType;
  trackWidth?: number; // Optional width for the track
  objectName: string | null | undefined;
  objectData: AnimationData;
  pixelsPerSecond: number;
  onSequenceDragEnd: (animation: AnimationData, newStartTimeMs: number) => void;
}

interface SequenceProps {
  objectName: string | null | undefined;
  animation: AnimationData;
  pixelsPerMs: number;
  sequenceColor: string;
  localLeft: number;
  localWidth: number;
}

// Draggable Sequence Component
const DraggableSequence: React.FC<SequenceProps> = ({
  objectName,
  animation,
  pixelsPerMs,
  sequenceColor,
  localLeft,
  localWidth,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: animation.id,
      data: animation,
    });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-row gap-2 relative h-10 rounded cursor-pointer ${sequenceColor} 
        hover:shadow-lg transition-shadow duration-200
        flex items-center px-2 select-none ${isDragging ? "opacity-50" : ""}`}
      style={{
        transform: CSS.Translate.toString(transform),
        left: `${localLeft}px`,
        width: `${localWidth}px`,
      }}
      {...listeners}
      {...attributes}
    >
      <span>{objectName}</span>
      {/* <span className="text-xs">({animation.polygonId})</span> */}
    </div>
  );
};

export const ObjectTrack: React.FC<TrackProps> = ({
  type,
  trackWidth = 900,
  objectName,
  objectData,
  pixelsPerSecond,
  onSequenceDragEnd,
}) => {
  const pixelsPerMs = pixelsPerSecond / 1000;

  const [localLeft, setLocalLeft] = useState(
    objectData.startTimeMs * pixelsPerMs
  );
  const [localWidth, setLocalWidth] = useState(
    objectData.duration * pixelsPerMs
  );

  const trackColor = type === TrackType.Audio ? "bg-slate-600" : "bg-slate-600";
  const sequenceColor =
    type === TrackType.Audio ? "bg-blue-400" : "bg-green-400";

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Adjust activation constraints if needed
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {};

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;

    if (active) {
      const animation = active.data.current as AnimationData;

      // Calculate new time based on delta
      const deltaXInMs = Math.round(delta.x / pixelsPerMs);
      const newStartTimeMs = Math.max(0, animation.startTimeMs + deltaXInMs);

      setLocalLeft(newStartTimeMs * pixelsPerMs);
      onSequenceDragEnd(animation, newStartTimeMs);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToHorizontalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`relative h-[50px] ${
          trackWidth === 540 ? "w-[540px]" : "w-[960px]"
        } mb-1`}
      >
        {/* Track background */}
        <div
          className={`relative ${
            trackWidth === 540 ? "w-[540px]" : "w-[960px]"
          } h-[50px] ${trackColor}`}
        />

        {/* Sequences */}
        <div className="relative w-full h-full p-1 top-[-50px] z-10">
          {objectData && (
            <DraggableSequence
              objectName={objectName}
              animation={objectData}
              pixelsPerMs={pixelsPerMs}
              sequenceColor={sequenceColor}
              localLeft={localLeft}
              localWidth={localWidth}
            />
          )}
        </div>
      </div>
    </DndContext>
  );
};
