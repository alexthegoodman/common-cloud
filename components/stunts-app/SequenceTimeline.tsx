import { TimelineSequence, TrackType } from "@/engine/animations";
import React, { useState, useCallback } from "react";

interface TrackProps {
  type: TrackType;
  trackWidth?: number; // Optional width for the track
  tSequences: TimelineSequence[];
  pixelsPerSecond: number;
  sequenceQuickAccess: Record<string, string>;
  sequenceDurations: Record<string, number>;
  onSequenceDragEnd: (
    sequence: TimelineSequence,
    newStartTimeMs: number
  ) => void;
}

export const TimelineTrack: React.FC<TrackProps> = ({
  type,
  trackWidth = 900, // Default width if not provided
  tSequences,
  pixelsPerSecond,
  sequenceQuickAccess,
  sequenceDurations,
  onSequenceDragEnd,
}) => {
  //   console.info("tSequences", tSequences);

  const pixelsPerMs = pixelsPerSecond / 1000;
  const trackColor = type === TrackType.Audio ? "bg-blue-300" : "bg-orange-200";
  const sequenceColor =
    type === TrackType.Audio ? "bg-red-400" : "bg-green-400";

  const handleDragStart = (e: React.DragEvent, sequence: TimelineSequence) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(sequence));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sequence = JSON.parse(
      e.dataTransfer.getData("text/plain")
    ) as TimelineSequence;

    // Calculate new position based on drop coordinates
    const trackRect = (
      e.currentTarget as HTMLDivElement
    ).getBoundingClientRect();
    const newPositionX = e.clientX - trackRect.left;
    const newStartTimeMs = Math.max(0, Math.round(newPositionX / pixelsPerMs));

    onSequenceDragEnd(sequence, newStartTimeMs);
  };

  return (
    <div
      className={`relative h-[50px] ${
        trackWidth === 550 ? "w-[550px]" : "w-[900px]"
      }`}
    >
      {/* Track background */}
      <div
        className={`absolute ${
          trackWidth === 550 ? "w-[550px]" : "w-[900px]"
        } h-[50px] ${trackColor}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Sequences */}
      <div className="absolute w-full h-full p-1">
        {tSequences
          .filter((seq) => seq.trackType === type)
          .map((tSequence) => {
            const left = tSequence.startTimeMs * pixelsPerMs;
            const width = sequenceDurations[tSequence.sequenceId] * pixelsPerMs;

            return (
              <div
                key={tSequence.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tSequence)}
                className={`absolute h-10 rounded cursor-pointer ${sequenceColor} 
                           hover:shadow-lg transition-shadow duration-200
                           flex items-center px-2 select-none`}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                }}
              >
                {sequenceQuickAccess[tSequence.sequenceId]}
              </div>
            );
          })}
      </div>
    </div>
  );
};
