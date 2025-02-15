import { v4 as uuidv4 } from "uuid";
import { SavedTextRendererConfig } from "./text";

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
  name: string;
  backgroundFill?: BackgroundFill;
  durationMs: number;
  activePolygons: SavedPolygonConfig[];
  polygonMotionPaths: AnimationData[];
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

export interface UIKeyframe {
  id: string;
  time: number; // Duration in milliseconds
  value: KeyframeValue;
  easing: EasingType;
  pathType: PathType | CurveData;
  keyType: KeyType;
}

export type KeyframeValue =
  | { type: "Position"; value: [number, number] }
  | { type: "Rotation"; value: number }
  | { type: "Scale"; value: number }
  | { type: "PerspectiveX"; value: number }
  | { type: "PerspectiveY"; value: number }
  | { type: "Opacity"; value: number }
  | { type: "Zoom"; value: number }
  | { type: "Custom"; value: number[] };

export type BackgroundFill =
  | { type: "Color"; value: [number, number, number, number] }
  | { type: "Gradient" }; // For later

export interface RangeData {
  endTime: number; // Duration in milliseconds
}

export type KeyType = { type: "Frame" } | { type: "Range"; data: RangeData };

// Helper functions
export function calculateDefaultCurve(
  currentKeyframe: UIKeyframe,
  nextKeyframe: UIKeyframe
): PathType | CurveData {
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
    if (distance < 10.0) {
      return PathType.Linear;
    }

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
  }

  return PathType.Linear;
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
