import { v4 as uuidv4 } from "uuid";
import { SavedTextRendererConfig } from "./text";
import { SavedPolygonConfig } from "./polygon";
import { SavedStImageConfig } from "./image";
import { SavedStVideoConfig } from "./video";

export interface SavedState {
  sequences: Sequence[];
  timeline_state: SavedTimelineStateConfig | null;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  dimensions: {
    width: number; // in pixels
    height: number; // in pixels
  };
}

export interface ProjectData {
  project_id: string;
  project_name: string;
}

export interface ProjectsDataFile {
  projects: ProjectData[];
}

export interface TimelineSequence {
  id: string;
  sequenceId: string;
  trackType: TrackType;
  startTimeMs: number; // in milliseconds
  // pub duration_ms: i32,   // in milliseconds
}

export enum TrackType {
  Audio,
  Video,
}

export interface SavedTimelineStateConfig {
  timeline_sequences: TimelineSequence[];
}

// Enums
export enum ObjectType {
  Polygon = "Polygon",
  TextItem = "TextItem",
  ImageItem = "ImageItem",
  VideoItem = "VideoItem",
}

export enum EasingType {
  Linear = "Linear",
  EaseIn = "EaseIn",
  EaseOut = "EaseOut",
  EaseInOut = "EaseInOut",
}

export enum PathType {
  Linear = "Linear",
  Bezier = "Bezier",
}

// Interfaces and Types
export interface ControlPoint {
  x: number;
  y: number;
}

export interface CurveData {
  controlPoint1?: ControlPoint;
  controlPoint2?: ControlPoint;
}

export interface Sequence {
  id: string;
  name?: string;
  backgroundFill?: BackgroundFill;
  durationMs?: number;
  activePolygons: SavedPolygonConfig[];
  polygonMotionPaths?: AnimationData[];
  activeTextItems: SavedTextRendererConfig[];
  activeImageItems: SavedStImageConfig[];
  activeVideoItems: SavedStVideoConfig[];
}

export interface AnimationData {
  id: string;
  objectType: ObjectType;
  polygonId: string;
  duration: number; // Duration in milliseconds
  startTimeMs: number;
  properties: AnimationProperty[];
  position: [number, number];
}

export interface AnimationProperty {
  name: string;
  propertyPath: string;
  children: AnimationProperty[];
  keyframes: UIKeyframe[];
  depth: number;
}

export interface ControlPoint {
  x: number;
  y: number;
}

export interface CurveData {
  control_point1?: ControlPoint;
  control_point2?: ControlPoint;
}

// export enum PathType {
//   Linear = "Linear",
//   Bezier = "Bezier",
// }

// export enum EasingType {
//   Linear = "Linear",
//   EaseIn = "EaseIn",
//   EaseOut = "EaseOut",
//   EaseInOut = "EaseInOut",
// }

export interface UIKeyframe {
  id: string;
  time: number; // Duration in milliseconds
  value: KeyframeValue;
  easing: EasingType;
  pathType: PathType;
  curveData: CurveData | null;
  keyType: KeyType;
}

export type KeyframeValue =
  | { type: "Position"; value: [number, number] }
  | { type: "Rotation"; value: number }
  | { type: "Scale"; value: number }
  | { type: "PerspectiveX"; value: number }
  | { type: "PerspectiveY"; value: number }
  | { type: "Opacity"; value: number }
  | {
      type: "Zoom";
      value: {
        position: [number, number];
        zoomLevel: number;
      };
    }
  | { type: "Custom"; value: number[] };

export type BackgroundFill =
  | { type: "Color"; value: [number, number, number, number] }
  | { type: "Gradient"; value: GradientDefinition }; // For later

export interface GradientStop {
  offset: number; // Position from 0 to 1
  color: [number, number, number, number];
}

export interface GradientDefinition {
  type: "linear" | "radial";
  stops: GradientStop[];
  numStops: number;
  // For linear gradient
  startPoint?: [number, number]; // Normalized coordinates (0-1)
  endPoint?: [number, number]; // Normalized coordinates (0-1)
  // For radial gradient
  center?: [number, number]; // Normalized coordinates (0-1)
  radius?: number; // In normalized units
  // Animation properties
  animationSpeed?: number; // Rotation speed in radians per second
  timeOffset?: number; // Current time offset for animation
  enabled: number;
}

export interface RangeData {
  endTime: number; // Duration in milliseconds
}

export type KeyType = { type: "Frame" } | { type: "Range"; data: RangeData };

// Helper functions
export function calculateDefaultCurve(
  currentKeyframe: UIKeyframe,
  nextKeyframe: UIKeyframe
): CurveData {
  if (
    currentKeyframe.value.type === "Position" &&
    nextKeyframe.value.type === "Position"
  ) {
    const currentPos = currentKeyframe.value.value;
    const nextPos = nextKeyframe.value.value;

    // Calculate distance between points
    const dx = nextPos[0] - currentPos[0];
    const dy = nextPos[1] - currentPos[1];
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    // Calculate time difference
    const timeDiff = nextKeyframe.time - currentKeyframe.time;

    // Calculate velocity (pixels per millisecond)
    const velocity = distance / timeDiff;

    // If the movement is very small, use Linear
    // if (distance < 10.0) {
    //   return PathType.Linear;
    // }

    // Calculate control points with perpendicular offset
    const controlPoints = calculateNaturalControlPoints(
      currentPos,
      nextPos,
      timeDiff,
      velocity
    );

    return {
      controlPoint1: controlPoints[0],
      controlPoint2: controlPoints[1],
    };
  } else {
    return {
      controlPoint1: {
        x: 0,
        y: 0,
      },
      controlPoint2: {
        x: 0,
        y: 0,
      },
    };
  }

  // return PathType.Linear;
}

function calculateNaturalControlPoints(
  current: [number, number],
  next: [number, number],
  timeDiff: number,
  velocity: number
): [ControlPoint, ControlPoint] {
  // Calculate the primary direction vector
  const dx = next[0] - current[0];
  const dy = next[1] - current[1];
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normalize the direction vector
  const dirX = dx / distance;
  const dirY = dy / distance;

  // Calculate perpendicular vector (rotate 90 degrees)
  const perpX = -dirY;
  const perpY = dirX;

  // Calculate the distance for control points based on velocity and time
  const forwardDistance = Math.min(velocity * timeDiff * 0.25, 100.0);

  // Calculate perpendicular offset based on distance
  // Longer distances get more pronounced curves
  const perpendicularOffset = Math.min(distance * 0.2, 50.0);

  // First control point:
  // - Move forward along the path
  // - Offset perpendicular to create an arc
  const cp1: ControlPoint = {
    x:
      current[0] +
      Math.round(forwardDistance * dirX + perpendicularOffset * perpX),
    y:
      current[1] +
      Math.round(forwardDistance * dirY + perpendicularOffset * perpY),
  };

  // Second control point:
  // - Move backward from the end point
  // - Offset perpendicular in the same direction for symmetry
  const cp2: ControlPoint = {
    x:
      next[0] -
      Math.round(forwardDistance * dirX - perpendicularOffset * perpX),
    y:
      next[1] -
      Math.round(forwardDistance * dirY - perpendicularOffset * perpY),
  };

  return [cp1, cp2];
}

// Helper function to detect if we should flip the curve direction
function shouldFlipCurve(
  current: [number, number],
  next: [number, number]
): boolean {
  // Calculate angle relative to horizontal
  const angle = Math.atan2(next[1] - current[1], next[0] - current[0]);

  // Flip the curve if the angle is in the lower half of the circle
  // This creates more natural arcs for different movement directions
  return angle < 0.0;
}

export function findObjectType(
  lastSavedState: SavedState,
  objectId: string
): ObjectType | null {
  // Check active polygons
  if (
    lastSavedState.sequences.some((s) =>
      s.activePolygons.some((ap) => ap.id === objectId)
    )
  ) {
    return ObjectType.Polygon;
  }

  // Check active images
  if (
    lastSavedState.sequences.some((s) =>
      s.activeImageItems.some((ai) => ai.id === objectId)
    )
  ) {
    return ObjectType.ImageItem;
  }

  // Check active text
  if (
    lastSavedState.sequences.some((s) =>
      s.activeTextItems.some((at) => at.id === objectId)
    )
  ) {
    return ObjectType.TextItem;
  }

  // Check active videos
  if (
    lastSavedState.sequences.some((s) =>
      s.activeVideoItems.some((av) => av.id === objectId)
    )
  ) {
    return ObjectType.VideoItem;
  }

  return null;
}
