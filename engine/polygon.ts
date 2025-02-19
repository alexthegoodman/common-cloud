import { mat4, vec2, vec3 } from "gl-matrix";

import { Camera, WindowSize } from "./camera"; // Import your camera type
import {
  BoundingBox,
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Point,
} from "./editor"; // Import your types
import {
  createEmptyGroupTransform,
  matrix4ToRawArray,
  Transform,
} from "./transform";
import { createVertex, getZLayer, Vertex, vertexByteSize } from "./vertex";

import * as gt from "@thi.ng/geom-tessellate";
import { ObjectType } from "./animations";

export const INTERNAL_LAYER_SPACE = 10;

export interface Stroke {
  thickness: number;
  fill: [number, number, number, number];
}

export interface PolygonConfig {
  id: string; // Use string for string
  name: string;
  points: Point[];
  fill: [number, number, number, number];
  dimensions: [number, number]; // [width, height]
  rotation: number;
  position: Point;
  borderRadius: number;
  stroke: Stroke;
  layer: number;
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

export interface PolygonShape {
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
  name: string;
  currentSequenceId: string;
  sourcePolygonId: string | null = null;
  sourceKeyframeId: string | null = null;
  sourcePathId: string | null = null;
  activeGroupPosition: [number, number];
  groupBindGroup: GPUBindGroup;
  hidden: boolean;
  vertices: Vertex[];
  indices: number[];
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  transform: Transform;
  layer: number;
  objectType: ObjectType;
  textureView: GPUTextureView;

  constructor(
    window_size: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    camera: Camera,
    points: Point[],
    dimensions: [number, number],
    position: Point,
    rotation: number,
    borderRadius: number,
    fill: [number, number, number, number],
    stroke: Stroke,
    baseLayer: number,
    transformLayer: number,
    name: string,
    id: string,
    currentSequenceId: string
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
    this.id = id;
    this.name = name;
    this.hidden = false;
    this.objectType = ObjectType.Polygon;

    this.currentSequenceId = currentSequenceId;
    // this.sourcePolygonId = null;
    // this.sourceKeyframeId = null;
    // this.sourcePathId = null;
    this.activeGroupPosition = [0, 0];

    this.position = {
      x: CANVAS_HORIZ_OFFSET + position.x,
      y: CANVAS_VERT_OFFSET + position.y,
    };

    let config: PolygonConfig = {
      id,
      name,
      points,
      dimensions,
      position,
      rotation,
      borderRadius,
      fill,
      stroke,
      // baseLayer,
      // transformLayer,
      layer: transformLayer,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
      textureView,
      sampler,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bindGroupLayout,
      camera,
      config
    );

    this.textureView = textureView;

    // -10.0 to provide 10 spots for internal items on top of objects
    this.transformLayer = transformLayer - INTERNAL_LAYER_SPACE;
    this.layer = transformLayer;

    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      window_size
    );

    this.groupBindGroup = tmp_group_bind_group;

    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
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

  updateOpacity(queue: GPUQueue, opacity: number) {
    let new_color = [this.fill[0], this.fill[1], this.fill[2], opacity] as [
      number,
      number,
      number,
      number
    ];

    this.vertices.forEach((v) => {
      v.color = new_color;
    });

    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        this.vertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
        ])
      )
    );
  }

  // updateLayer( layer_index: number) {
  //     // -10.0 to provide 10 spots for internal items on top of objects
  //     let layer_index = layer_index - INTERNAL_LAYER_SPACE;
  //     this.layer = layer_index;
  //     this.transform.layer = layer_index as number;
  // }

  updateGroupPosition(position: [number, number]) {
    this.activeGroupPosition = position;
  }

  toLocalSpace(world_point: Point, camera: Camera): Point {
    // First untranslate the point relative to polygon's position
    let untranslated: Point = {
      x: (world_point.x -
        this.transform.position[0] -
        this.activeGroupPosition[0]) as number,
      y: (world_point.y -
        this.transform.position[1] -
        this.activeGroupPosition[1]) as number,
    };

    // Apply inverse rotation
    let rotation_rad = -this.transform.rotation; // Negative for inverse rotation
    let rotated: Point = {
      x:
        untranslated.x * Math.cos(rotation_rad) -
        untranslated.y * Math.sin(rotation_rad),
      y:
        untranslated.x * Math.sin(rotation_rad) +
        untranslated.y * Math.cos(rotation_rad),
    };

    // Center the point and scale to normalized coordinates
    let local_point: Point = {
      x: (rotated.x + this.dimensions[0] / 2.0) / this.dimensions[0],
      y: (rotated.y + this.dimensions[1] / 2.0) / this.dimensions[1],
    };

    return local_point;
  }

  updateDataFromDimensions(
    window_size: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bind_group_layout: GPUBindGroupLayout,
    dimensions: [number, number],
    camera: Camera
  ) {
    let config: PolygonConfig = {
      id: this.id,
      name: this.name,
      dimensions,
      points: this.points,
      position: {
        x: this.transform.position[0],
        y: this.transform.position[1],
      },
      rotation: this.transform.rotation,
      borderRadius: this.borderRadius,
      fill: this.fill,
      stroke: this.stroke,
      // 0.0,
      layer: this.layer + INTERNAL_LAYER_SPACE,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bind_group_layout,
      camera,
      // this.points,
      config
    );

    this.dimensions = dimensions;
    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
  }

  updateDataFromPosition(
    window_size: WindowSize,
    device: GPUDevice,
    bind_group_layout: GPUBindGroupLayout,
    position: Point,
    camera: Camera
  ) {
    this.transform.updatePosition([position.x, position.y], camera.windowSize);
  }

  updateDataFromBorderRadius(
    window_size: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bind_group_layout: GPUBindGroupLayout,
    borderRadius: number,
    camera: Camera
  ) {
    let config: PolygonConfig = {
      id: this.id,
      name: this.name,
      dimensions: this.dimensions,
      points: this.points,
      position: {
        x: this.transform.position[0],
        y: this.transform.position[1],
      },
      rotation: this.transform.rotation,
      borderRadius: borderRadius,
      fill: this.fill,
      stroke: this.stroke,
      // 0.0,
      layer: this.layer + INTERNAL_LAYER_SPACE,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bind_group_layout,
      camera,
      config
      // this.points,
      // this.dimensions,
      // Point {
      //     x: this.transform.position.x,
      //     y: this.transform.position.y,
      // },
      // this.transform.rotation,
      // border_radius,
      // this.fill,
      // this.stroke,
      // 0.0,
      // this.layer + INTERNAL_LAYER_SPACE,
    );

    this.borderRadius = borderRadius;
    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
  }

  updateDataFromStroke(
    window_size: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bind_group_layout: GPUBindGroupLayout,
    stroke: Stroke,
    camera: Camera
  ) {
    let config: PolygonConfig = {
      id: this.id,
      name: this.name,
      dimensions: this.dimensions,
      points: this.points,
      position: {
        x: this.transform.position[0],
        y: this.transform.position[1],
      },
      rotation: this.transform.rotation,
      borderRadius: this.borderRadius,
      fill: this.fill,
      stroke: stroke,
      // 0.0,
      layer: this.layer + INTERNAL_LAYER_SPACE,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bind_group_layout,
      camera,
      config
      // this.points,
      // this.dimensions,
      // Point {
      //     x: this.transform.position.x,
      //     y: this.transform.position.y,
      // },
      // this.transform.rotation,
      // this.border_radius,
      // this.fill,
      // stroke,
      // 0.0,
      // this.layer + INTERNAL_LAYER_SPACE,
    );

    this.stroke = stroke;
    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
  }

  updateDataFromFill(
    window_size: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bind_group_layout: GPUBindGroupLayout,
    fill: [number, number, number, number],
    camera: Camera
  ) {
    let config: PolygonConfig = {
      id: this.id,
      name: this.name,
      dimensions: this.dimensions,
      points: this.points,
      position: {
        x: this.transform.position[0],
        y: this.transform.position[1],
      },
      rotation: this.transform.rotation,
      borderRadius: this.borderRadius,
      fill: fill,
      stroke: this.stroke,
      // 0.0,
      layer: this.layer + INTERNAL_LAYER_SPACE,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bind_group_layout,
      camera,
      config
      // this.points,
      // this.dimensions,
      // Point {
      //     x: this.transform.position.x,
      //     y: this.transform.position.y,
      // },
      // this.transform.rotation,
      // this.border_radius,
      // fill,
      // this.stroke,
      // 0.0,
      // this.layer + INTERNAL_LAYER_SPACE,
    );

    this.fill = fill;
    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
  }

  //  worldBoundingBox() -> BoundingBox {
  //     let mut min_x = number::MAX;
  //     let mut min_y = number::MAX;
  //     let mut max_x = number::MIN;
  //     let mut max_y = number::MIN;

  //     for point in .points {
  //         let world_x = point.x * this.dimensions.0 + this.transform.position.x;
  //         let world_y = point.y * this.dimensions.1 + this.transform.position.y;
  //         min_x = min_x.min(world_x);
  //         min_y = min_y.min(world_y);
  //         max_x = max_x.max(world_x);
  //         max_y = max_y.max(world_y);
  //     }

  //     BoundingBox {
  //         min: Point { x: min_x, y: min_y },
  //         max: Point { x: max_x, y: max_y },
  //     }
  // }

  toConfig(): PolygonConfig {
    let config: PolygonConfig = {
      id: this.id,
      name: this.name,
      points: this.points,
      fill: this.fill,
      dimensions: this.dimensions,
      rotation: this.transform.rotation,
      position: {
        x: this.transform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.transform.position[1] - CANVAS_VERT_OFFSET,
      },
      borderRadius: this.borderRadius,
      stroke: this.stroke,
      layer: this.layer,
    };

    return config;
  }

  // fromConfig(
  //     config: PolygonConfig,
  //     window_size: WindowSize,
  //     device: GPUDevice,
  //     queue:GPUQueue,
  //     model_bind_group_layout: GPUBindGroupLayout,
  //     group_bind_group_layout: GPUBindGroupLayout,
  //     camera: Camera,
  //     selected_sequence_id: String,
  // ) -> Polygon {
  //     Polygon::new(
  //         window_size,
  //         device,
  //         queue,
  //         model_bind_group_layout,
  //         group_bind_group_layout,
  //         camera,
  //         vec![
  //             Point { x: 0.0, y: 0.0 },
  //             Point { x: 1.0, y: 0.0 },
  //             Point { x: 1.0, y: 1.0 },
  //             Point { x: 0.0, y: 1.0 },
  //         ],
  //         (config.dimensions.0, config.dimensions.1), // width = length of segment, height = thickness
  //         config.position,
  //         0.0,
  //         config.border_radius,
  //         // [0.5, 0.8, 1.0, 1.0], // light blue with some transparency
  //         config.fill,
  //         config.stroke,
  //         -2.0,
  //         config.layer,
  //         config.name,
  //         config.id,
  //         string::from_str(selected_sequence_id).expect("Couldn't convert string to string"),
  //     )
  // }
}

export function getPolygonData(
  windowSize: WindowSize,
  device: GPUDevice,
  queue: GPUQueue,
  bindGroupLayout: GPUBindGroupLayout,
  camera: Camera,
  polygon: PolygonConfig
): [
  Vertex[],
  number[],
  GPUBuffer,
  GPUBuffer,
  GPUBindGroup,
  Transform,
  GPUTextureView,
  GPUSampler
] {
  // 1. Tessellate using @thi.ng/geom-tessellate
  let rounded_points = createRoundedPolygonPath(
    polygon.points,
    polygon.dimensions,
    polygon.borderRadius
  );

  // console.info("rounded_points", rounded_points);

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
        createVertex(point[0], point[1], getZLayer(1.0), polygon.fill)
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
      null as unknown as GPUTextureView,
      null as unknown as GPUSampler,
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

  // console.info(
  //   "polygon vertices",
  //   vertices.length,
  //   vertices.length * vertexByteSize
  // );

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
    size: indices.length * Uint32Array.BYTES_PER_ELEMENT, // Correct size calculation
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  queue.writeBuffer(indexBuffer, 0, new Uint32Array(indices).buffer);

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
    // mappedAtCreation: true,
  });
  // new Float32Array(uniformBuffer.getMappedRange()).set(rawMatrix);
  // uniformBuffer.unmap();
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
    polygon.rotation,
    // 0,
    vec2.fromValues(1, 1),
    uniformBuffer
    // camera.windowSize // Assuming camera has windowSize
  );

  transform.layer = polygon.layer - INTERNAL_LAYER_SPACE;
  transform.updateUniformBuffer(queue, camera.windowSize);

  return [
    vertices,
    indices,
    vertexBuffer,
    indexBuffer,
    bindGroup,
    transform,
    textureView,
    sampler,
  ];
}

// Helper function to create a LyonPoint (if needed, adjust import if LyonPoint is defined differently)
const lyonPoint = (x: number, y: number) => ({ x, y }); // Simple object for now

export function createRoundedPolygonPath(
  normalizedPoints: Point[],
  dimensions: [number, number],
  borderRadius: number
): number[][] {
  const n = normalizedPoints.length;

  // console.info("create rounded path", n);

  const scaledRadius = borderRadius / Math.min(dimensions[0], dimensions[1]);
  const halfWidth = dimensions[0] / 2.0;
  const halfHeight = dimensions[1] / 2.0;
  const pathPoints: number[][] = [];

  for (let i = 0; i < n; i++) {
    const p0 = normalizedPoints[(i + n - 1) % n];
    const p1 = normalizedPoints[i];
    const p2 = normalizedPoints[(i + 1) % n];

    const v1 = vec2.fromValues(p1.x - p0.x, p1.y - p0.y);
    const v2 = vec2.fromValues(p2.x - p1.x, p2.y - p1.y);

    const len1 = vec2.length(v1);
    const len2 = vec2.length(v2);

    // Skip if vectors have zero length
    if (len1 === 0 || len2 === 0) {
      console.error("Zero-length vector detected at index", i);
      continue;
    }

    const radius = Math.min(scaledRadius, len1 / 2.0, len2 / 2.0);

    const offset1 = vec2.create();
    vec2.scale(offset1, vec2.normalize(vec2.create(), v1), radius);
    const offset2 = vec2.create();
    vec2.scale(offset2, vec2.normalize(vec2.create(), v2), radius);

    const p1Scaled = {
      x: p1.x * dimensions[0] - halfWidth,
      y: p1.y * dimensions[1] - halfHeight,
    };

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

    const dotProduct = vec2.dot(offset1, offset2);

    // Handle orthogonal vectors (dotProduct === 0)
    if (dotProduct === 0) {
      // For orthogonal vectors, the rounded corner is a quarter-circle
      const steps = 5; // Number of segments to approximate the arc
      const angleIncrement = Math.PI / 2 / steps; // 90 degrees divided into steps

      for (let j = 1; j <= steps; j++) {
        const currentAngle = angleIncrement * j;
        const rotatedOffset = vec2.create();
        vec2.rotate(rotatedOffset, offset1, vec2.create(), currentAngle);

        const cornerPoint = [
          p1Scaled.x + rotatedOffset[0] * dimensions[0],
          p1Scaled.y + rotatedOffset[1] * dimensions[1],
        ];
        pathPoints.push(cornerPoint);
      }
    } else {
      // For non-orthogonal vectors, compute the angle dynamically
      const angleInput =
        dotProduct / (vec2.length(offset1) * vec2.length(offset2));
      const clampedAngleInput = Math.max(-1, Math.min(1, angleInput));

      if (isNaN(clampedAngleInput)) {
        console.warn(
          "Invalid input to Math.acos at index",
          i,
          ":",
          clampedAngleInput
        );
        continue;
      }

      const angle = Math.acos(clampedAngleInput);
      const steps = 5; // Number of segments to approximate the arc

      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        const currentAngle = angle * t;
        const rotatedOffset = vec2.create();
        vec2.rotate(rotatedOffset, offset1, vec2.create(), currentAngle);

        const cornerPoint = [
          p1Scaled.x + rotatedOffset[0] * dimensions[0],
          p1Scaled.y + rotatedOffset[1] * dimensions[1],
        ];
        pathPoints.push(cornerPoint);
      }
    }

    pathPoints.push(cornerEnd);
  }

  return pathPoints;
}
