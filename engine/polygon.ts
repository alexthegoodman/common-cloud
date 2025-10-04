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
import {
  BackgroundFill,
  GradientDefinition,
  GradientStop,
  ObjectType,
} from "./animations";
import { makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";

export const INTERNAL_LAYER_SPACE = 10;

export interface Stroke {
  thickness: number;
  fill: [number, number, number, number];
}

export interface PolygonConfig {
  id: string; // Use string for string
  name: string;
  points: Point[];
  // fill: [number, number, number, number];
  backgroundFill: BackgroundFill;
  dimensions: [number, number]; // [width, height]
  rotation: number;
  position: Point;
  borderRadius: number;
  stroke: Stroke;
  layer: number;
  isCircle: boolean;
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
  // fill: [number, number, number, number];
  backgroundFill: BackgroundFill;
  dimensions: [number, number];
  position: SavedPoint;
  borderRadius: number;
  stroke: SavedStroke;
  layer: number;
  isCircle: boolean;
}

export interface PolygonShape {
  points: Point[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  borderRadius: number;
  // fill: [number, number, number, number];
  backgroundFill: BackgroundFill;
  stroke: Stroke;
  baseLayer: number;
  transformLayer: number;
  id: string; // Add an ID field
  isCircle: boolean;
}

export class Polygon implements PolygonShape {
  points: Point[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  borderRadius: number;
  // fill: [number, number, number, number];
  backgroundFill: BackgroundFill;
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
  groupBindGroup: PolyfillBindGroup;
  hidden: boolean;
  vertices: Vertex[];
  indices: number[];
  vertexBuffer: PolyfillBuffer;
  indexBuffer: PolyfillBuffer;
  bindGroup: PolyfillBindGroup;
  transform: Transform;
  layer: number;
  objectType: ObjectType;
  // textureView: GPUTextureView;
  isCircle: boolean;

  gradient?: GradientDefinition;
  gradientBuffer?: PolyfillBuffer;
  gradientBindGroup?: PolyfillBindGroup;

  constructor(
    window_size: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    // gradientBindGroupLayout: PolyfillBindGroupLayout,
    camera: Camera,
    points: Point[],
    dimensions: [number, number],
    position: Point,
    rotation: number,
    borderRadius: number,
    // fill: [number, number, number, number],
    backgroundFill: BackgroundFill,
    stroke: Stroke,
    baseLayer: number,
    transformLayer: number,
    name: string,
    id: string,
    currentSequenceId: string,
    isCircle: boolean
  ) {
    this.points = points;
    this.dimensions = dimensions;
    this.position = position;
    this.rotation = rotation;
    this.borderRadius = borderRadius;
    // this.fill = fill;
    this.backgroundFill = backgroundFill;
    this.stroke = stroke;
    this.baseLayer = baseLayer;
    this.transformLayer = transformLayer;
    this.id = id;
    this.name = name;
    this.hidden = false;
    this.objectType = ObjectType.Polygon;
    this.isCircle = isCircle;

    this.currentSequenceId = currentSequenceId;
    // this.sourcePolygonId = null;
    // this.sourceKeyframeId = null;
    // this.sourcePathId = null;
    this.activeGroupPosition = [0, 0];

    this.position = {
      x: CANVAS_HORIZ_OFFSET + position.x,
      y: CANVAS_VERT_OFFSET + position.y,
    };

    // this.position = {
    //   x: 0,
    //   y: 0,
    // };

    let config: PolygonConfig = {
      id,
      name,
      points,
      dimensions,
      position,
      // position: {
      //   x: 0,
      //   y: 0,
      // },
      rotation,
      borderRadius,
      // fill,
      backgroundFill,
      stroke,
      // baseLayer,
      // transformLayer,
      layer: transformLayer,
      isCircle,
    };

    let [
      vertices,
      indices,
      vertex_buffer,
      index_buffer,
      bind_group,
      transform,
      // textureView,
      // sampler,
      gradientBuffer,
      gradient,
    ] = getPolygonData(
      window_size,
      device,
      queue,
      bindGroupLayout,
      camera,
      config
    );

    // this.textureView = textureView;
    this.gradient = gradient;
    this.gradientBuffer = gradientBuffer;

    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      window_size
    );

    // tmp_group_transform.layer = this.layer;
    // tmp_group_transform.updateUniformBuffer(queue, camera.windowSize);

    this.groupBindGroup = tmp_group_bind_group;

    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;

    // -10.0 to provide 10 spots for internal items on top of objects
    let layer_index = getZLayer(transformLayer);
    this.transformLayer = transformLayer;
    this.layer = transformLayer;
    this.transform.layer = layer_index as number;
    // this.layer = transformLayer - INTERNAL_LAYER_SPACE;
  }

  updateGradientAnimation(device: PolyfillDevice, deltaTime: number) {
    if (!this.gradient || !this.gradientBuffer) return;

    // Update the timeOffset
    this.gradient.timeOffset = (this.gradient.timeOffset || 0) + deltaTime;

    // Update just the time value in the buffer (offset 49 = 40 + 9)
    const timeOffset = 49;
    device.queue!.writeBuffer(
      this.gradientBuffer,
      timeOffset * 4, // Multiply by 4 because offset is in bytes
      new Float32Array([this.gradient.timeOffset])
    );
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

  updateOpacity(queue: PolyfillQueue, opacity: number) {
    // let new_color = [this.fill[0], this.fill[1], this.fill[2], opacity] as [
    //   number,
    //   number,
    //   number,
    //   number
    // ];
    // let new_color = [1, 1, 1, opacity] as [number, number, number, number];
    let new_color = [1, 1, 1, opacity] as [number, number, number, number];
    if (this.backgroundFill.type === "Gradient") {
      let firstStop = this.backgroundFill.value.stops[0];
      new_color = [
        firstStop.color[0],
        firstStop.color[1],
        firstStop.color[2],
        opacity,
      ] as [number, number, number, number];
    } else if (this.backgroundFill.type === "Color") {
      new_color = [
        this.backgroundFill.value[0],
        this.backgroundFill.value[1],
        this.backgroundFill.value[2],
        opacity,
      ] as [number, number, number, number];
    }

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
          ...v.gradient_coords,
          v.object_type,
        ])
      )
    );
  }

  updateLayer(layer: number) {
    // -10.0 to provide 10 spots for internal items on top of objects
    // let layer_index = layer - INTERNAL_LAYER_SPACE;
    let layer_index = getZLayer(layer);
    this.layer = layer - INTERNAL_LAYER_SPACE;
    this.transform.layer = layer_index as number;

    // TODO: update group transform layer as well?
  }

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

  setIsCircle(
    window_size: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bind_group_layout: PolyfillBindGroupLayout,
    isCircle: boolean,
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
      // fill: this.fill,
      backgroundFill: this.backgroundFill,
      stroke: this.stroke,
      // 0.0,
      layer: this.transformLayer,
      isCircle,
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

    this.isCircle = isCircle;
    this.vertices = vertices;
    this.indices = indices;
    this.vertexBuffer = vertex_buffer;
    this.indexBuffer = index_buffer;
    this.bindGroup = bind_group;
    this.transform = transform;
  }

  updateDataFromDimensions(
    window_size: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bind_group_layout: PolyfillBindGroupLayout,
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
      // fill: this.fill,
      backgroundFill: this.backgroundFill,
      stroke: this.stroke,
      // 0.0,
      layer: this.transformLayer,
      isCircle: this.isCircle,
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
    device: PolyfillDevice,
    bind_group_layout: PolyfillBindGroupLayout,
    position: Point,
    camera: Camera
  ) {
    this.transform.updatePosition([position.x, position.y], camera.windowSize);
  }

  updateDataFromBorderRadius(
    window_size: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bind_group_layout: PolyfillBindGroupLayout,
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
      // fill: this.fill,
      backgroundFill: this.backgroundFill,
      stroke: this.stroke,
      // 0.0,
      layer: this.transformLayer,
      isCircle: this.isCircle,
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
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bind_group_layout: PolyfillBindGroupLayout,
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
      // fill: this.fill,
      backgroundFill: this.backgroundFill,
      stroke: stroke,
      // 0.0,
      layer: this.transformLayer,
      isCircle: this.isCircle,
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
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bind_group_layout: PolyfillBindGroupLayout,
    // fill: [number, number, number, number],
    backgroundFill: BackgroundFill,
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
      // fill: fill,
      backgroundFill: backgroundFill,
      stroke: this.stroke,
      // 0.0,
      layer: this.transformLayer,
      isCircle: this.isCircle,
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

    // this.fill = fill;
    this.backgroundFill = backgroundFill;
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
      // fill: this.fill,
      backgroundFill: this.backgroundFill,
      dimensions: this.dimensions,
      rotation: this.transform.rotation,
      position: {
        x: this.transform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.transform.position[1] - CANVAS_VERT_OFFSET,
      },
      borderRadius: this.borderRadius,
      stroke: this.stroke,
      layer: this.layer,
      isCircle: this.isCircle,
    };

    return config;
  }

  // fromConfig(
  //     config: PolygonConfig,
  //     window_size: WindowSize,
  //     device: PolyfillDevice,
  //     queue:PolyfillQueue,
  //     model_bind_group_layout: PolyfillBindGroupLayout,
  //     group_bind_group_layout: PolyfillBindGroupLayout,
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

function generateCircleVertices(
  dimensions: [number, number],
  color: [number, number, number, number]
): Vertex[] {
  const vertices: Vertex[] = [];
  const segments = 32; // Number of segments to approximate the circle
  const radius = dimensions[0] / 2; // Radius of the circle

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    // UV coordinates map the texture to the circle
    // const u = x + 0.5;
    // const v = y + 0.5;

    vertices.push({
      position: [x, y, -0.0001], // Slightly above z=0 to avoid z-fighting
      tex_coords: [0, 0],
      color,
      gradient_coords: [x, y], // Adjust gradient coords if needed
      object_type: 0, // OBJECT_TYPE_POLYGON
    });
  }

  // Add the center vertex
  vertices.push({
    position: [0.0, 0.0, -0.0001],
    tex_coords: [0, 0],
    color,
    gradient_coords: [0.0, 0.0],
    object_type: 0, // OBJECT_TYPE_POLYGON
  });

  return vertices;
}

function generateCircleIndices(): number[] {
  const indices: number[] = [];
  const segments = 32;
  const centerIndex = segments; // Center vertex is the last one

  for (let i = 0; i < segments; i++) {
    const nextIndex = (i + 1) % segments;
    indices.push(centerIndex, i, nextIndex);
  }

  return indices;
}

export function getPolygonData(
  windowSize: WindowSize,
  device: PolyfillDevice,
  queue: PolyfillQueue,
  bindGroupLayout: PolyfillBindGroupLayout,
  camera: Camera,
  polygon: PolygonConfig
): [
  Vertex[],
  number[],
  PolyfillBuffer,
  PolyfillBuffer,
  PolyfillBindGroup,
  Transform,
  // GPUTextureView,
  // GPUSampler,
  PolyfillBuffer,
  GradientDefinition
] {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  if (polygon.isCircle) {
    if (polygon.backgroundFill.type === "Color") {
      vertices.push(
        ...generateCircleVertices(
          polygon.dimensions,
          polygon.backgroundFill.value
        )
      );
      indices.push(...generateCircleIndices());
      console.info("polygon circle color", vertices, indices);
    } else if (polygon.backgroundFill.type === "Gradient") {
      vertices.push(
        ...generateCircleVertices(
          polygon.dimensions,
          polygon.backgroundFill.value.stops[0].color
        )
      );
      indices.push(...generateCircleIndices());
    }
  } else {
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

    // Assuming triFan gives us a list of points and faces as indices into the points array
    if (
      tessellationResult &&
      tessellationResult.points &&
      tessellationResult.faces
    ) {
      tessellationResult.points.forEach((point) => {
        const normalizedX = point[0] / polygon.dimensions[0] + 0.5;
        const normalizedY = point[1] / polygon.dimensions[1] + 0.5;

        // console.info("normalized poly", normalizedX, normalizedY);

        let fill = [1, 1, 1, 1] as [number, number, number, number];
        if (polygon.backgroundFill.type === "Gradient") {
          let firstStop = polygon.backgroundFill.value.stops[0];
          fill = [
            firstStop.color[0],
            firstStop.color[1],
            firstStop.color[2],
            1,
          ] as [number, number, number, number];
        } else if (polygon.backgroundFill.type === "Color") {
          fill = [
            polygon.backgroundFill.value[0],
            polygon.backgroundFill.value[1],
            polygon.backgroundFill.value[2],
            1,
          ] as [number, number, number, number];
        }

        vertices.push(
          // createVertex(point[0], point[1], getZLayer(1.0), polygon.fill, ObjectType.Polygon)
          {
            position: [point[0], point[1], -0.0001],
            tex_coords: [0, 0],
            color: fill,
            gradient_coords: [normalizedX, normalizedY],
            object_type: 0, // OBJECT_TYPE_POLYGON
          }
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
        null as unknown as PolyfillBuffer,
        null as unknown as PolyfillBuffer,
        null as unknown as PolyfillBindGroup,
        null as unknown as Transform,
        // null as unknown as GPUTextureView,
        // null as unknown as GPUSampler,
        null as unknown as PolyfillBuffer,
        null as unknown as GradientDefinition,
      ];
    }
  }

  const vertexBuffer = device.createBuffer(
    {
      label: "Vertex Buffer",
      size: vertices.length * vertexByteSize, // Use the helper function
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // or 0 for testing env where type cant be used as value
    },
    ""
  );

  const vertexData = new Float32Array(vertices.length * (3 + 2 + 4 + 2 + 1));

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 0] = v.position[0];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 1] = v.position[1];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 2] = v.position[2];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 3] = v.tex_coords[0];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 4] = v.tex_coords[1];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 5] = v.color[0];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 6] = v.color[1];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 7] = v.color[2];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 8] = v.color[3];

    vertexData[i * (3 + 2 + 4 + 2 + 1) + 9] = v.gradient_coords[0];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 10] = v.gradient_coords[1];
    vertexData[i * (3 + 2 + 4 + 2 + 1) + 11] = v.object_type;
  }

  queue.writeBuffer(vertexBuffer, 0, vertexData.buffer);

  const indexBuffer = device.createBuffer(
    {
      label: "Index Buffer",
      size: indices.length * Uint32Array.BYTES_PER_ELEMENT, // Correct size calculation
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    },
    ""
  );
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

  // createBuffer calls createBuffer, bindBuffer, and bufferData
  const uniformBuffer = device.createBuffer(
    {
      label: "Polygon Uniform Buffer",
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
    uniformBuffer.unmap();
  }

  const textureSize = { width: 1, height: 1, depthOrArrayLayers: 1 };
  const texture = device.createTexture({
    label: "Default White Texture",
    size: textureSize,
    // mipLevelCount: 1,
    // sampleCount: 1,
    // dimension: "2d",
    format: "rgba8unorm",
    usage:
      process.env.NODE_ENV === "test"
        ? 0
        : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const whitePixel = new Uint8Array([255, 255, 255, 255]);
  queue.writeTexture(
    {
      texture,
      mipLevel: 0,
      origin: { x: 0, y: 0, z: 0 }, //aspect: "all"
    },
    whitePixel,
    { offset: 0, bytesPerRow: 4, rowsPerImage: undefined },
    textureSize
  );

  // const textureView = texture.createView();

  // const sampler = device.createSampler({
  //   addressModeU: "clamp-to-edge",
  //   addressModeV: "clamp-to-edge",
  //   addressModeW: "clamp-to-edge",
  //   magFilter: "nearest",
  //   minFilter: "nearest",
  //   mipmapFilter: "nearest",
  // });

  let gradientDef = null;
  if (polygon.backgroundFill.type === "Gradient") {
    gradientDef = polygon.backgroundFill.value;
  }

  let [gradient, gradientBuffer] = setupGradientBuffers(
    device,
    queue,
    gradientDef
  );

  // gradientBuffer.unmap();

  const transform = new Transform(
    vec2.fromValues(polygon.position.x, polygon.position.y),
    polygon.rotation,
    // 0,
    vec2.fromValues(1, 1),
    uniformBuffer
    // camera.windowSize // Assuming camera has windowSize
  );

  // console.info(
  //   "polygon layer",
  //   polygon.layer - INTERNAL_LAYER_SPACE,
  //   getZLayer(polygon.layer - INTERNAL_LAYER_SPACE)
  // );

  transform.layer = getZLayer(polygon.layer); // results in numbers like -1.099
  // transform.layer = 1 - getZLayer(polygon.layer - INTERNAL_LAYER_SPACE);
  // transform.layer = getZLayer(polygon.layer - INTERNAL_LAYER_SPACE);
  // console.info("polygon transform layer", transform.layer);

  // queue.writeBuffer(uniformBuffer, 0, rawMatrix);
  // uniformBuffer.unmap();

  transform.updateUniformBuffer(queue, camera.windowSize);

  // createBindGroup calls uniformBlockBinding and bindBufferBase
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        groupIndex: 1,
        resource: {
          pbuffer: uniformBuffer,
        },
      },
      // { binding: 1, resource: textureView },
      { binding: 1, groupIndex: 1, resource: texture },
      // { binding: 2, resource: sampler },
      {
        binding: 0,
        groupIndex: 2,
        resource: {
          pbuffer: gradientBuffer,
        },
      },
    ],
  });

  // unmap calls bindBuffer and bufferSubData
  // gradientBuffer.unmap();

  // console.info("vertexbuffer", vertexBuffer);

  return [
    vertices,
    indices,
    vertexBuffer,
    indexBuffer,
    bindGroup,
    transform,
    // textureView,
    // sampler,
    gradientBuffer,
    gradient,
  ];
}

// Helper function to create a LyonPoint (if needed, adjust import if LyonPoint is defined differently)
const lyonPoint = (x: number, y: number) => ({ x, y }); // Simple object for now

// import FragShader from "./shaders/frag_primary.wgsl?raw";

// let defs = makeShaderDataDefinitions(FragShader);
// const gradientValues = makeStructuredView(defs.uniforms.gradient);

// console.info("test utils", defs.uniforms);

function createRoundedPolygonPath(
  normalizedPoints: Point[],
  dimensions: number[],
  borderRadius: number
) {
  const [width, height] = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  // const centerX = 0;
  // const centerY = 0;

  // Scale the normalized points to the dimensions
  const scaledPoints = normalizedPoints.map((point) => [
    point.x * width - centerX,
    point.y * height - centerY,
  ]);

  // Function to calculate the rounded corner points
  // function roundedCorner(
  //   start: number[],
  //   corner: number[],
  //   end: number[],
  //   radius: number
  // ) {
  //   const [x1, y1] = start;
  //   const [x2, y2] = corner;
  //   const [x3, y3] = end;

  //   // Calculate the vectors for the incoming and outgoing edges
  //   const dx1 = x2 - x1;
  //   const dy1 = y2 - y1;
  //   const dx2 = x2 - x3;
  //   const dy2 = y2 - y3;

  //   // Calculate the angles of the edges
  //   const angle1 = Math.atan2(dy1, dx1);
  //   const angle2 = Math.atan2(dy2, dx2);
  //   const angleBetween = Math.PI - Math.abs(angle1 - angle2);

  //   // Calculate the distance to the rounded corner control point
  //   const dist = radius / Math.tan(angleBetween / 2);

  //   // Calculate the control points for the rounded corner
  //   const cx1 = x2 - dist * Math.cos(angle1);
  //   const cy1 = y2 - dist * Math.sin(angle1);
  //   const cx2 = x2 - dist * Math.cos(angle2);
  //   const cy2 = y2 - dist * Math.sin(angle2);

  //   return [
  //     [cx1, cy1], // Start of the rounded corner
  //     [cx2, cy2], // End of the rounded corner
  //   ];
  // }

  function roundedCorner(
    start: number[],
    corner: number[],
    end: number[],
    radius: number
  ) {
    const [x1, y1] = start;
    const [x2, y2] = corner;
    const [x3, y3] = end;

    // Calculate the vectors for the incoming and outgoing edges
    const v1x = x1 - x2;
    const v1y = y1 - y2;
    const v2x = x3 - x2;
    const v2y = y3 - y2;

    // Normalize the vectors
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

    const uv1x = v1x / len1;
    const uv1y = v1y / len2;
    const uv2x = v2x / len2;
    const uv2y = v2y / len2;

    // Calculate the distance to move from corner along each edge
    const angleBetween = Math.acos(uv1x * uv2x + uv1y * uv2y);
    const dist = radius / Math.tan(angleBetween / 2);

    // Limit distance to prevent issues with very sharp angles
    const maxDist = Math.min(len1, len2) * 0.5;
    const actualDist = Math.min(dist, maxDist);

    // Calculate the control points along each edge
    const cx1 = x2 + uv1x * actualDist;
    const cy1 = y2 + uv1y * actualDist;
    const cx2 = x2 + uv2x * actualDist;
    const cy2 = y2 + uv2y * actualDist;

    return [
      [cx1, cy1], // Start of the rounded corner
      [cx2, cy2], // End of the rounded corner
    ];
  }

  // Function to interpolate points along a curve
  function interpolatePoints(
    start: number[],
    end: number[],
    control: number[],
    numSegments: number
  ) {
    const points = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x =
        (1 - t) ** 2 * start[0] +
        2 * (1 - t) * t * control[0] +
        t ** 2 * end[0];
      const y =
        (1 - t) ** 2 * start[1] +
        2 * (1 - t) * t * control[1] +
        t ** 2 * end[1];
      points.push([x, y]);
    }
    return points;
  }

  // Generate the path with rounded corners
  const path = [];
  const numSegments = 10; // Number of segments per rounded corner

  for (let i = 0; i < scaledPoints.length; i++) {
    const prev =
      scaledPoints[(i - 1 + scaledPoints.length) % scaledPoints.length];
    const current = scaledPoints[i];
    const next = scaledPoints[(i + 1) % scaledPoints.length];

    // Calculate the rounded corner control points
    const [startCorner, endCorner] = roundedCorner(
      prev,
      current,
      next,
      borderRadius
    );

    // Interpolate points along the rounded corner
    const roundedPoints = interpolatePoints(
      startCorner,
      endCorner,
      current,
      numSegments
    );

    // Add the points to the path
    if (i === 0) {
      path.push(startCorner);
    }
    path.push(...roundedPoints);
  }

  // Close the path by connecting back to the first point
  path.push(path[0]);

  return path;
}

export function setupGradientBuffers(
  device: PolyfillDevice,
  queue: PolyfillQueue,
  // gradientBindGroupLayout: PolyfillBindGroupLayout,
  gradient?: GradientDefinition | null,
  borderRadius?: number
): [GradientDefinition, PolyfillBuffer] {
  let defaultStops: GradientStop[] = [
    { offset: 0, color: [1, 0, 0, 1] }, // Red
    { offset: 1, color: [0, 0, 1, 1] }, // Blue
  ];

  let selectedGradient = gradient;

  if (!selectedGradient) {
    selectedGradient = {
      stops: defaultStops,
      numStops: defaultStops.length, // numStops
      type: "linear", // gradientType (0 is linear, 1 is radial)
      startPoint: [0, 0], // startPoint
      endPoint: [1, 0], // endPoint
      center: [0.5, 0.5], // center
      radius: 1.0, // radius
      timeOffset: 0, // timeOffset
      animationSpeed: 1, // animationSpeed
      enabled: 0, // enabled
    };
    // console.warn("no gradient selected");
  }

  const gradientBuffer = device.createBuffer(
    {
      label: "Gradient Buffer",
      // 2 vec4s for offsets + 8 vec4s for colors + 13 floats for config (added border_radius)
      // (2 + 8) * 16 + 13 * 4 = 212 bytes
      size: 212,
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    },
    "UBO"
  );

  if (process.env.NODE_ENV !== "test") {
    const mappedRange = new Float32Array(gradientBuffer.getMappedRange());

    // const mappedRange = new Float32Array(gradientBuffer.getMappedRange());
    // console.log("checking", mappedRange.buffer === gradientBuffer.data); // Should be true

    // mappedRange[0] = 42;
    // const check = new Float32Array(gradientBuffer.data!);
    // console.log("check", check[0]); // Should be 42

    // console.info(
    //   "gradientBuffer mappedRange",
    //   JSON.stringify(mappedRange.buffer)
    // );

    // Set stop offsets (packed into vec4s)
    selectedGradient.stops.forEach((stop, i) => {
      const vec4Index = Math.floor(i / 4);
      const componentIndex = i % 4;
      mappedRange[vec4Index * 4 + componentIndex] = stop.offset;
    });

    // Set stop colors (starting at index 8)
    selectedGradient.stops.forEach((stop, i) => {
      const colorIndex = 8 + i * 4;
      mappedRange[colorIndex] = stop.color[0];
      mappedRange[colorIndex + 1] = stop.color[1];
      mappedRange[colorIndex + 2] = stop.color[2];
      mappedRange[colorIndex + 3] = stop.color[3];
    });

    // Set configuration (starting at index 40)
    const configOffset = 40;
    mappedRange[configOffset] = selectedGradient.stops.length;
    mappedRange[configOffset + 1] = selectedGradient.type === "linear" ? 0 : 1;
    mappedRange[configOffset + 2] = selectedGradient.startPoint?.[0] ?? 0;
    mappedRange[configOffset + 3] = selectedGradient.startPoint?.[1] ?? 0;
    mappedRange[configOffset + 4] = selectedGradient.endPoint?.[0] ?? 1;
    mappedRange[configOffset + 5] = selectedGradient.endPoint?.[1] ?? 0;
    mappedRange[configOffset + 6] = selectedGradient.center?.[0] ?? 0.5;
    mappedRange[configOffset + 7] = selectedGradient.center?.[1] ?? 0.5;
    mappedRange[configOffset + 8] = selectedGradient.radius ?? 1.0;
    mappedRange[configOffset + 9] = selectedGradient.timeOffset ?? 0;
    mappedRange[configOffset + 10] = selectedGradient.animationSpeed ?? 0;
    mappedRange[configOffset + 11] = selectedGradient.enabled;
    mappedRange[configOffset + 12] = borderRadius ?? 0.0;

    console.info(
      "setupGradientBuffers borderRadius:",
      borderRadius,
      "at index",
      configOffset + 12,
      "value:",
      mappedRange[configOffset + 12]
    );

    // console.info(
    //   "gradientBuffer mappedRange after setup",
    //   JSON.stringify(mappedRange.buffer)
    // );

    // gradientBuffer.data = mappedRange.buffer; // TODO: is this correct?

    gradientBuffer.unmap(); // used elsewhere
  }

  return [selectedGradient, gradientBuffer];
}
