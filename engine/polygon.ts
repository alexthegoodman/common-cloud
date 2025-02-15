import { mat4, vec2, vec3 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";

import { Camera } from "./camera"; // Import your camera type
import { BoundingBox, Point, Shape, WindowSize } from "./editor"; // Import your types
import {
  createEmptyGroupTransform,
  matrix4ToRawArray,
  Transform,
} from "./transform";
import { createVertex, getZLayer, Vertex, vertexByteSize } from "./vertex";

import * as gt from "@thi.ng/geom-tessellate";

export const INTERNAL_LAYER_SPACE = 10;

export interface Stroke {
  thickness: number;
  fill: [number, number, number, number];
}

export interface PolygonConfig {
  id: string; // Use string for UUID
  name: string;
  points: Point[];
  fill: [number, number, number, number];
  dimensions: [number, number]; // [width, height]
  position: Point;
  borderRadius: number;
  stroke: Stroke;
  layer: number;
}

export interface Point {
  // Consistent Point interface
  x: number;
  y: number;
}

export interface SavedPoint {
  x: number;
  y: number;
}

export interface SavedStroke {
  thickness: number;
  fill: [number, number, number, number];
}

export interface SavedPolygonConfig {
  id: string;
  name: string;
  fill: [number, number, number, number];
  dimensions: [number, number];
  position: SavedPoint;
  borderRadius: number;
  stroke: SavedStroke;
  layer: number;
}

export interface PolygonShape extends Shape {
  points: Point[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  borderRadius: number;
  fill: [number, number, number, number];
  stroke: Stroke;
  baseLayer: number;
  transformLayer: number;
  id: string; // Add an ID field
}

export class Polygon implements PolygonShape {
  points: Point[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  borderRadius: number;
  fill: [number, number, number, number];
  stroke: Stroke;
  baseLayer: number;
  transformLayer: number;
  id: string;

  constructor(
    points: Point[],
    dimensions: [number, number],
    position: Point,
    rotation: number,
    borderRadius: number,
    fill: [number, number, number, number],
    stroke: Stroke,
    baseLayer: number,
    transformLayer: number
  ) {
    this.points = points;
    this.dimensions = dimensions;
    this.position = position;
    this.rotation = rotation;
    this.borderRadius = borderRadius;
    this.fill = fill;
    this.stroke = stroke;
    this.baseLayer = baseLayer;
    this.transformLayer = transformLayer;
    this.id = uuidv4(); // Generate UUID on creation
  }

  boundingBox(): BoundingBox {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }

  containsPoint(point: Point, camera: Camera): boolean {
    const localPoint = this.toLocalSpace(point, camera); // Implement toLocalSpace

    let inside = false;
    let j = this.points.length - 1;
    for (let i = 0; i < this.points.length; i++) {
      const pi = this.points[i];
      const pj = this.points[j];

      if (
        pi.y > localPoint.y !== pj.y > localPoint.y &&
        localPoint.x <
          ((pj.x - pi.x) * (localPoint.y - pi.y)) / (pj.y - pi.y) + pi.x
      ) {
        inside = !inside;
      }
      j = i;
    }

    return inside;
  }

  toLocalSpace(point: Point, camera: Camera): Point {
    // Implement the logic to convert a point to the polygon's local space.
    // This will likely involve using the camera's view matrix and the polygon's transform.
    // Placeholder - replace with actual implementation
    return { x: point.x, y: point.y };
  }
}

export async function getPolygonData(
  windowSize: WindowSize,
  device: GPUDevice,
  queue: GPUQueue,
  bindGroupLayout: GPUBindGroupLayout,
  camera: Camera,
  polygon: PolygonConfig
): Promise<
  [Vertex[], number[], GPUBuffer, GPUBuffer, GPUBindGroup, Transform]
> {
  // 1. Tessellate using @thi.ng/geom-tessellate
  let rounded_points = createRoundedPolygonPath(
    polygon.points,
    polygon.dimensions,
    polygon.borderRadius
  );

  const tessellationResult = gt.tessellate(
    rounded_points.map((p) => [p[0], p[1]]),
    gt.triFan
  ); // Or appropriate tessellation method

  // 2. Prepare vertex and index data
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  // Assuming triFan gives us a list of points and faces as indices into the points array
  if (
    tessellationResult &&
    tessellationResult.points &&
    tessellationResult.faces
  ) {
    tessellationResult.points.forEach((point) => {
      vertices.push(
        createVertex(
          point[0],
          point[1],
          getZLayer(polygon.layer + 2.0),
          polygon.fill
        )
      );
    });
    tessellationResult.faces.forEach((face) => {
      face.forEach((index) => indices.push(index));
    });
  } else {
    console.error(
      "Tessellation failed or returned unexpected result:",
      tessellationResult
    );
    // Handle the error appropriately, e.g., return default values or throw an exception.
    return [
      [],
      [],
      null as unknown as GPUBuffer,
      null as unknown as GPUBuffer,
      null as unknown as GPUBindGroup,
      null as unknown as Transform,
    ];
  }

  //   // 3. Create buffers (similar to before)
  //   const vertexBuffer = device.createBuffer({
  //     label: "Vertex Buffer",
  //     size: vertices.byteLength, // Use the size of the new vertices array
  //     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  //   });
  //   queue.writeBuffer(
  //     vertexBuffer,
  //     0,
  //     new Float32Array(
  //       vertices
  //         .map((v) => [v.position[0], v.position[1], v.position[2], ...v.color])
  //         .flat().buffer
  //     )
  //   );

  //   const indexBuffer = device.createBuffer({
  //     label: "Index Buffer",
  //     size: indices.length * Uint16Array.BYTES_PER_ELEMENT, // Correct size calculation
  //     usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  //   });
  //   queue.writeBuffer(indexBuffer, 0, new Uint16Array(indices).buffer);

  // ... (In getPolygonData)

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.length * vertexByteSize, // Use the helper function
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const vertexData = new Float32Array(vertices.length * (3 + 2 + 4));

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    vertexData[i * (3 + 2 + 4) + 0] = v.position[0];
    vertexData[i * (3 + 2 + 4) + 1] = v.position[1];
    vertexData[i * (3 + 2 + 4) + 2] = v.position[2];
    vertexData[i * (3 + 2 + 4) + 3] = v.tex_coords[0];
    vertexData[i * (3 + 2 + 4) + 4] = v.tex_coords[1];
    vertexData[i * (3 + 2 + 4) + 5] = v.color[0];
    vertexData[i * (3 + 2 + 4) + 6] = v.color[1];
    vertexData[i * (3 + 2 + 4) + 7] = v.color[2];
    vertexData[i * (3 + 2 + 4) + 8] = v.color[3];
  }

  queue.writeBuffer(vertexBuffer, 0, vertexData.buffer);

  const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indices.length * Uint16Array.BYTES_PER_ELEMENT, // Correct size calculation
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  queue.writeBuffer(indexBuffer, 0, new Uint16Array(indices).buffer);

  //   if (polygon.stroke.thickness > 0.0) {
  //     strokeTessellator.tessellatePath(
  //       path,
  //       StrokeOptions.default().withLineWidth(polygon.stroke.thickness),
  //       geometry.builder((vertex) => {
  //         const x = vertex.position().x;
  //         const y = vertex.position().y;
  //         return new Vertex(
  //           x,
  //           y,
  //           getZLayer(polygon.baseLayer + 3.0),
  //           polygon.stroke.fill
  //         );
  //       })
  //     );
  //   }

  const emptyMatrix = mat4.create();
  const rawMatrix = matrix4ToRawArray(emptyMatrix);

  const uniformBuffer = device.createBuffer({
    label: "Polygon Uniform Buffer",
    size: rawMatrix.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  queue.writeBuffer(uniformBuffer, 0, rawMatrix);

  const textureSize = { width: 1, height: 1, depthOrArrayLayers: 1 };
  const texture = device.createTexture({
    label: "Default White Texture",
    size: textureSize,
    mipLevelCount: 1,
    sampleCount: 1,
    dimension: "2d",
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const whitePixel = new Uint8Array([255, 255, 255, 255]);
  queue.writeTexture(
    { texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 }, aspect: "all" },
    whitePixel,
    { offset: 0, bytesPerRow: 4, rowsPerImage: undefined },
    textureSize
  );

  const textureView = texture.createView();

  const sampler = device.createSampler({
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
    addressModeW: "clamp-to-edge",
    magFilter: "nearest",
    minFilter: "nearest",
    mipmapFilter: "nearest",
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      { binding: 1, resource: textureView },
      { binding: 2, resource: sampler },
    ],
  });

  const transform = new Transform(
    vec2.fromValues(polygon.position.x, polygon.position.y),
    // polygon.rotation,
    0,
    vec2.fromValues(1, 1),
    uniformBuffer
    // camera.windowSize // Assuming camera has windowSize
  );

  transform.layer = polygon.layer - INTERNAL_LAYER_SPACE;
  transform.updateUniformBuffer(queue, camera.windowSize);

  return [vertices, indices, vertexBuffer, indexBuffer, bindGroup, transform];
}

// Helper function to create a LyonPoint (if needed, adjust import if LyonPoint is defined differently)
const lyonPoint = (x: number, y: number) => ({ x, y }); // Simple object for now

export function createRoundedPolygonPath(
  normalizedPoints: Point[],
  dimensions: [number, number],
  borderRadius: number
): number[][] {
  // Return points suitable for @thi.ng/geom-tessellate

  const n = normalizedPoints.length;

  const scaledRadius = borderRadius / Math.min(dimensions[0], dimensions[1]);

  const halfWidth = dimensions[0] / 2.0;
  const halfHeight = dimensions[1] / 2.0;

  const pathPoints: number[][] = []; // Array to hold the final path points

  // for (let i = 0; i < n; i++) {
  //   const p0 = normalizedPoints[(i + n - 1) % n];
  //   const p1 = normalizedPoints[i];
  //   const p2 = normalizedPoints[(i + 1) % n];

  //   const v1 = vec2.fromValues(p1.x - p0.x, p1.y - p0.y);
  //   const v2 = vec2.fromValues(p2.x - p1.x, p2.y - p1.y);

  //   const len1 = vec2.length(v1);
  //   const len2 = vec2.length(v2);

  //   const radius = Math.min(scaledRadius, len1 / 2.0, len2 / 2.0);

  //   const offset1 = vec2.create();
  //   vec2.scale(offset1, vec2.normalize(v1, vec2.create()), radius);
  //   const offset2 = vec2.create();
  //   vec2.scale(offset2, vec2.normalize(v2, vec2.create()), radius);

  //   const p1Scaled = lyonPoint(
  //     p1.x * dimensions[0] - halfWidth,
  //     p1.y * dimensions[1] - halfHeight
  //   );

  //   const cornerStart = [
  //     p1Scaled.x - offset1[0] * dimensions[0],
  //     p1Scaled.y - offset1[1] * dimensions[1],
  //   ];
  //   const cornerEnd = [
  //     p1Scaled.x + offset2[0] * dimensions[0],
  //     p1Scaled.y + offset2[1] * dimensions[1],
  //   ];

  //   if (i === 0) {
  //     pathPoints.push(cornerStart); // Start the path
  //   }

  //   // Approximate the rounded corner with a small line segment or a quadratic curve
  //   // For simplicity, we just add the corner end point here.  A better approach would be to calculate
  //   // a few intermediate points along the arc of the rounded corner.
  //   pathPoints.push(cornerEnd);
  // }

  // return pathPoints;

  for (let i = 0; i < n; i++) {
    const p0 = normalizedPoints[(i + n - 1) % n];
    const p1 = normalizedPoints[i];
    const p2 = normalizedPoints[(i + 1) % n];

    const v1 = vec2.fromValues(p1.x - p0.x, p1.y - p0.y);
    const v2 = vec2.fromValues(p2.x - p1.x, p2.y - p1.y);

    const len1 = vec2.length(v1);
    const len2 = vec2.length(v2);

    const radius = Math.min(scaledRadius, len1 / 2.0, len2 / 2.0);

    const offset1 = vec2.create();
    vec2.scale(offset1, vec2.normalize(v1, vec2.create()), radius);
    const offset2 = vec2.create();
    vec2.scale(offset2, vec2.normalize(v2, vec2.create()), radius);

    const p1Scaled = lyonPoint(
      p1.x * dimensions[0] - halfWidth,
      p1.y * dimensions[1] - halfHeight
    );

    const cornerStart = [
      p1Scaled.x - offset1[0] * dimensions[0],
      p1Scaled.y - offset1[1] * dimensions[1],
    ];
    const cornerEnd = [
      p1Scaled.x + offset2[0] * dimensions[0],
      p1Scaled.y + offset2[1] * dimensions[1],
    ];

    if (i === 0) {
      pathPoints.push(cornerStart);
    }

    const angle = Math.acos(
      vec2.dot(offset1, offset2) / (vec2.length(offset1) * vec2.length(offset2))
    ); // Angle between vectors
    const steps = 5; // Number of segments to approximate the arc (adjust as needed)

    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const currentAngle = angle * t;
      const rotatedOffset = vec2.create();
      vec2.rotate(rotatedOffset, vec2.create(), offset1, currentAngle); // Rotate offset1

      const cornerPoint = [
        p1Scaled.x + rotatedOffset[0] * dimensions[0],
        p1Scaled.y + rotatedOffset[1] * dimensions[1],
      ];
      pathPoints.push(cornerPoint);
    }

    pathPoints.push(cornerEnd); // Add the final corner point
  }

  return pathPoints;
}
