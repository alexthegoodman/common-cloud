import { mat4, vec2, vec3 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";

import {
  EasingType,
  KeyType,
  KeyframeValue,
  Sequence,
  UIKeyframe,
} from "./animations"; // Import your animation types
import { Camera, WindowSize } from "./camera"; // Import your camera type
import { getFullColor, interpolatePosition, rgbToWgpu, Point } from "./editor"; // Import your editor functions and types
import { Polygon, SavedPoint, Stroke, INTERNAL_LAYER_SPACE } from "./polygon"; // Import your polygon types
import { matrix4ToRawArray, Transform } from "./transform"; // Import your transform functions and types
import { getZLayer, Vertex } from "./vertex"; // Import your vertex functions and types
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";

// maybe unnecessary for MotionPath
export interface MotionPathConfig {
  id: string;
  dimensions: [number, number];
  position: Point;
}

export class MotionPath {
  public id: string;
  public transform: Transform;
  public bindGroup: PolyfillBindGroup;
  public staticPolygons: Polygon[];
  public associatedPolygonId: string;

  constructor(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    modelBindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    // gradientBindGroupLayout: PolyfillBindGroupLayout,
    newId: string,
    windowSize: WindowSize,
    keyframes: UIKeyframe[],
    camera: Camera,
    sequence: Sequence,
    colorIndex: number,
    associatedPolygonId: string,
    initialPosition: [number, number]
  ) {
    const [fillR, fillG, fillB] = getFullColor(colorIndex);
    const pathFill = rgbToWgpu(fillR, fillG, fillB, 255.0);

    const polygonId = associatedPolygonId;

    this.staticPolygons = [];

    // Create path segments between consecutive keyframes
    let pairsDone = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      const startKf = keyframes[i];
      const endKf = keyframes[i + 1];

      const startKfId = startKf.id;
      const endKfId = endKf.id;

      // console.info("keyframes", startKf, endKf);

      let startPos = [0, 0];
      let endPos = [0, 0];
      let startPoint: Point = { x: 0, y: 0 };
      let endPoint: Point = { x: 0, y: 0 };

      if (
        startKf.value.type === "Position" &&
        endKf.value.type === "Position"
      ) {
        startPos = startKf.value.value as [number, number];
        endPos = endKf.value.value as [number, number];
        startPoint = { x: startPos[0], y: startPos[1] };
        endPoint = { x: endPos[0], y: endPos[1] };
      } else if (startKf.value.type === "Zoom" && endKf.value.type === "Zoom") {
        startPos = startKf.value.value.position as [number, number];
        endPos = endKf.value.value.position as [number, number];
        startPoint = { x: startPos[0], y: startPos[1] };
        endPoint = { x: endPos[0], y: endPos[1] };
      } else {
        continue;
      }

      // Create intermediate points for curved paths if using non-linear easing
      const numSegments = startKf.easing === EasingType.Linear ? 1 : 9; // More segments for smooth curves

      // console.info("MotionPath ", startPos, endPos);

      if (pairsDone === 0) {
        // handle for first keyframe in path
        let handle = createPathHandle(
          windowSize,
          device,
          queue,
          modelBindGroupLayout,
          groupBindGroupLayout,
          // gradientBindGroupLayout,
          camera,
          startPoint,
          20.0, // width and height
          sequence.id,
          pathFill,
          0.0
        );

        handle.sourcePolygonId = polygonId;
        handle.sourceKeyframeId = startKfId;
        handle.sourcePathId = newId;

        handle.updateGroupPosition(initialPosition);

        this.staticPolygons.push(handle);
      }

      // handles for remaining keyframes

      let handle =
        endKf.keyType.type === "Frame"
          ? createPathHandle(
              windowSize,
              device,
              queue,
              modelBindGroupLayout,
              groupBindGroupLayout,
              // gradientBindGroupLayout,
              camera,
              endPoint,
              20.0, // width and height
              sequence.id,
              pathFill,
              0.0
            )
          : createPathHandle(
              windowSize,
              device,
              queue,
              modelBindGroupLayout,
              groupBindGroupLayout,
              // gradientBindGroupLayout,
              camera,
              endPoint,
              20.0, // width and height
              sequence.id,
              pathFill,
              45.0
            );

      handle.sourcePolygonId = polygonId;
      handle.sourceKeyframeId = endKfId;
      handle.sourcePathId = newId;

      handle.updateGroupPosition(initialPosition);

      this.staticPolygons.push(handle);

      const segmentDuration = (endKf.time - startKf.time) / numSegments;

      // console.info("Segment duration", segmentDuration);

      let odd = false;
      for (let j = 0; j < numSegments; j++) {
        const t1 = startKf.time + segmentDuration * j;
        const t2 = startKf.time + segmentDuration * (j + 1);

        // console.info("Segment t", t1, t2);

        const pos1 = interpolatePosition(startKf, endKf, t1);
        const pos2 = interpolatePosition(startKf, endKf, t2);

        const pathStart: Point = { x: pos1[0], y: pos1[1] };
        const pathEnd: Point = { x: pos2[0], y: pos2[1] };

        // Calculate rotation angle from start to end point
        const dx = pathEnd.x - pathStart.x;
        const dy = pathEnd.y - pathStart.y;
        const rotation = Math.atan2(dy, dx);

        // Calculate length of the segment
        const length = Math.sqrt(dx * dx + dy * dy);

        // console.info(
        //   "Segment",
        //   startKf.value.type,
        //   pathStart,
        //   pathEnd,
        //   rotation,
        //   length
        // );

        let segment = createPathSegment(
          windowSize,
          device,
          queue,
          modelBindGroupLayout,
          groupBindGroupLayout,
          // gradientBindGroupLayout,
          camera,
          pathStart,
          pathEnd,
          2.0, // thickness of the path
          sequence.id,
          pathFill,
          rotation,
          length
        );

        segment.sourcePathId = newId;
        segment.updateGroupPosition(initialPosition);

        this.staticPolygons.push(segment);

        // arrow for indicating direction of motion
        if (odd) {
          const arrowOrientationOffset = -Math.PI / 2; // for upward-facing arrow
          let arrow = createPathArrow(
            windowSize,
            device,
            queue,
            modelBindGroupLayout,
            groupBindGroupLayout,
            // gradientBindGroupLayout,
            camera,
            pathEnd,
            10.0, // width and height
            sequence.id,
            pathFill,
            rotation + arrowOrientationOffset
          );

          arrow.updateGroupPosition(initialPosition);

          this.staticPolygons.push(arrow);
        }

        odd = !odd;
      }

      pairsDone++;
    }

    const emptyBuffer = mat4.create();
    const rawMatrix = matrix4ToRawArray(emptyBuffer);

    const uniformBuffer = device.createBuffer(
      {
        label: "MotionPath Uniform Buffer",
        size: rawMatrix.byteLength,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      "uniformMatrix4fv"
    );

    if (process.env.NODE_ENV !== "test") {
      new Float32Array(uniformBuffer.getMappedRange()).set(rawMatrix);
    }

    // Now create your bind group with these defaults
    this.bindGroup = device.createBindGroup({
      layout: groupBindGroupLayout,
      entries: [
        {
          binding: 0,
          groupIndex: 3,
          resource: {
            pbuffer: uniformBuffer,
          },
        },
      ],
      // label: "Motion Path Bind Group",
    });

    if (process.env.NODE_ENV !== "test") {
      uniformBuffer.unmap();
    }

    const groupTransform = new Transform(
      vec2.fromValues(initialPosition[0], initialPosition[1]), // everything can move relative to this
      // test 0
      // vec2.fromValues(0.0, 0.0), // everything can move relative to this
      0.0,
      vec2.fromValues(1.0, 1.0),
      uniformBuffer
      //   windowSize
    );

    groupTransform.updateUniformBuffer(queue, windowSize);

    this.id = newId;
    this.transform = groupTransform;
    this.associatedPolygonId = associatedPolygonId;
    // this.dimensions = dynamicDimensions;
  }

  public updateDataFromPosition(
    windowSize: WindowSize,
    device: PolyfillDevice,
    bindGroupLayout: PolyfillBindGroupLayout,
    position: Point,
    camera: Camera
  ) {
    this.transform.updatePosition([position.x, position.y], windowSize);

    this.staticPolygons.forEach((p) => {
      // simply provides info to the polygon about its position, does not change the polygon's position
      p.updateGroupPosition([position.x, position.y]);
    });
  }
}

/// Creates a path segment using a rotated square
function createPathSegment(
  windowSize: WindowSize,
  device: PolyfillDevice,
  queue: PolyfillQueue,
  modelBindGroupLayout: PolyfillBindGroupLayout,
  groupBindGroupLayout: PolyfillBindGroupLayout,
  // gradientBindGroupLayout: PolyfillBindGroupLayout,
  camera: Camera,
  start: Point,
  end: Point,
  thickness: number,
  selectedSequenceId: string,
  fill: [number, number, number, number],
  rotation: number,
  length: number
): Polygon {
  // Calculate segment midpoint for position
  const position: Point = {
    x: (start.x + end.x) / 2.0,
    y: (start.y + end.y) / 2.0,
  };

  // Create polygon using default square points
  return new Polygon(
    windowSize,
    device,
    queue,
    modelBindGroupLayout,
    groupBindGroupLayout,
    // gradientBindGroupLayout,
    camera,
    [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
    ],
    [length, thickness], // width = length of segment, height = thickness
    position,
    rotation,
    0.0,
    // [0.5, 0.8, 1.0, 1.0], // light blue with some transparency
    // fill,
    { type: "Color", value: fill },
    {
      thickness: 0.0,
      fill: rgbToWgpu(0, 0, 0, 255.0),
    },
    -1.0,
    1, // positive to use INTERNAL_LAYER_SPACE
    "motion_path_segment",
    uuidv4(),
    selectedSequenceId,
    false
  );
}

/// Creates a path handle for dragging and showing direction
function createPathHandle(
  windowSize: WindowSize,
  device: PolyfillDevice,
  queue: PolyfillQueue,
  modelBindGroupLayout: PolyfillBindGroupLayout,
  groupBindGroupLayout: PolyfillBindGroupLayout,
  // gradientBindGroupLayout: PolyfillBindGroupLayout,
  camera: Camera,
  end: Point,
  size: number,
  selectedSequenceId: string,
  fill: [number, number, number, number],
  rotation: number
): Polygon {
  return new Polygon(
    windowSize,
    device,
    queue,
    modelBindGroupLayout,
    groupBindGroupLayout,
    // gradientBindGroupLayout,
    camera,
    [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
    ],
    [size, size], // width = length of segment, height = thickness
    end,
    rotation,
    0.0,
    // fill,
    { type: "Color", value: fill },
    {
      thickness: 0.0,
      fill: rgbToWgpu(0, 0, 0, 255.0),
    },
    -1.0,
    1,
    "motion_path_handle",
    uuidv4(),
    selectedSequenceId,
    false
  );
}

/// Creates arrow for showing direction
function createPathArrow(
  windowSize: WindowSize,
  device: PolyfillDevice,
  queue: PolyfillQueue,
  modelBindGroupLayout: PolyfillBindGroupLayout,
  groupBindGroupLayout: PolyfillBindGroupLayout,
  // gradientBindGroupLayout: PolyfillBindGroupLayout,
  camera: Camera,
  end: Point,
  size: number,
  selectedSequenceId: string,
  fill: [number, number, number, number],
  rotation: number
): Polygon {
  return new Polygon(
    windowSize,
    device,
    queue,
    modelBindGroupLayout,
    groupBindGroupLayout,
    // gradientBindGroupLayout,
    camera,
    [
      // rightside up
      // { x: 0.0, y: 0.0 },
      // { x: 0.5, y: 0.6 },
      // { x: 1.0, y: 0.0 },
      // { x: 0.5, y: 1.0 },
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 0.5, y: 1.0 },
      // { x: 0.0, y: 0.0 },
    ],
    [size, size],
    end,
    rotation,
    0.0,
    // fill,
    { type: "Color", value: fill },
    {
      thickness: 0.0,
      fill: rgbToWgpu(0, 0, 0, 255.0),
    },
    -1.0,
    1,
    "motion_path_arrow",
    uuidv4(),
    selectedSequenceId,
    false
  );
}

export { createPathSegment, createPathHandle, createPathArrow };
