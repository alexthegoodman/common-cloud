import React from "react";

interface TimelineTicksProps {
  trackWidth?: number; // Width of the track (540 or 960)
  pixelsPerSecond: number;
  durationMs: number; // Duration of the sequence in milliseconds
}

export const TimelineTicks: React.FC<TimelineTicksProps> = ({
  trackWidth = 960,
  pixelsPerSecond,
  durationMs,
}) => {
  const pixelsPerMs = pixelsPerSecond / 1000;
  const totalWidth = trackWidth;

  // Calculate the number of seconds to display
  const totalSeconds = Math.ceil(durationMs / 1000);

  // Generate tick marks for each second
  const ticks = [];
  for (let i = 0; i <= totalSeconds; i++) {
    const position = i * 1000 * pixelsPerMs;

    // Only show ticks that fit within the track width
    if (position <= totalWidth) {
      ticks.push({
        position,
        label: `${i}s`,
        isMajor: i % 5 === 0, // Every 5 seconds is a major tick
      });
    }
  }

  return (
    <div
      className={`relative h-[24px] ${
        trackWidth === 540 ? "w-[540px]" : "w-[960px]"
      } mb-1`}
    >
      {/* Timeline ruler background */}
      <div
        className={`relative ${
          trackWidth === 540 ? "w-[540px]" : "w-[960px]"
        } h-[30px] bg-slate-700 border-b border-slate-500`}
      >
        {/* Tick marks */}
        {ticks.map((tick, index) => (
          <div
            key={index}
            className="absolute flex flex-col items-center"
            style={{ left: `${tick.position}px` }}
          >
            {/* Tick line */}
            <div
              className={`${
                tick.isMajor ? "h-[16px] w-[2px]" : "h-[8px] w-[1px]"
              } bg-slate-300`}
            />
            {/* Tick label - only show for major ticks */}
            {tick.isMajor && (
              <span className="text-[10px] text-slate-300 mt-[2px] absolute top-[14px] -translate-x-1/2">
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
