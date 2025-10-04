import { mat4, vec2, vec3 } from "gl-matrix";
import { Camera, WindowSize } from "./camera";
import {
  BoundingBox,
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Point,
} from "./editor";
import {
  createEmptyGroupTransform,
  matrix4ToRawArray,
  Transform,
} from "./transform";
import { createVertex, getZLayer, Vertex, vertexByteSize } from "./vertex";
import { BackgroundFill, ObjectType } from "./animations";
import { makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";

export const INTERNAL_LAYER_SPACE = 10;

// Brush type enumeration
export enum BrushType {
  Noise = "Noise",
  Dots = "Dots",
  Lines = "Lines",
  Voronoi = "Voronoi",
  Fractal = "Fractal",
  Gradient = "Gradient",
  Splatter = "Splatter",
}

// Point with pressure information for stroke variation
export interface BrushPoint {
  x: number;
  y: number;
  pressure: number; // 0.0 to 1.0
  timestamp: number; // milliseconds
}

// Brush configuration
export interface BrushConfig {
  id: string;
  name: string;
  brushType: BrushType;
  size: number; // Base brush size in pixels
  opacity: number; // 0.0 to 1.0
  flow: number; // 0.0 to 1.0 (paint accumulation per dab)
  spacing: number; // Distance between dabs (0.0 to 1.0 of brush size)

  // Color
  primaryColor: [number, number, number, number]; // RGBA
  secondaryColor: [number, number, number, number]; // RGBA for gradients/patterns

  // Procedural texture parameters
  noiseScale: number; // Scale of noise pattern
  octaves: number; // Number of noise octaves (detail level)
  persistence: number; // Amplitude falloff per octave
  randomSeed: number; // Seed for reproducible randomness

  // Pattern-specific parameters
  dotDensity?: number; // For Dots brush
  lineAngle?: number; // For Lines brush (in radians)
  lineSpacing?: number; // For Lines brush
  cellSize?: number; // For Voronoi brush

  // Layer and positioning
  position: Point;
  dimensions: [number, number]; // Width and height of brush area
  layer: number;
  rotation: number;
}

// Saved brush configuration (for serialization)
export interface SavedBrushConfig {
  id: string;
  name: string;
  brushType: BrushType;
  size: number;
  opacity: number;
  flow: number;
  spacing: number;
  primaryColor: [number, number, number, number];
  secondaryColor: [number, number, number, number];
  noiseScale: number;
  octaves: number;
  persistence: number;
  randomSeed: number;
  dotDensity?: number;
  lineAngle?: number;
  lineSpacing?: number;
  cellSize?: number;
  position: { x: number; y: number };
  dimensions: [number, number];
  layer: number;
  rotation: number;
  strokes: BrushStroke[]; // Store all strokes made with this brush
}

// Individual brush stroke
export interface BrushStroke {
  id: string;
  points: BrushPoint[];
  brushConfigSnapshot: Partial<BrushConfig>; // Capture config at stroke time
  startTime: number;
  endTime: number;
}

// Brush stroke shape for rendering
export interface BrushStrokeShape {
  points: BrushPoint[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  primaryColor: [number, number, number, number];
  secondaryColor: [number, number, number, number];
  baseLayer: number;
  transformLayer: number;
  id: string;
  brushType: BrushType;
}

export class ProceduralBrush implements BrushStrokeShape {
  points: BrushPoint[];
  dimensions: [number, number];
  position: Point;
  rotation: number;
  primaryColor: [number, number, number, number];
  secondaryColor: [number, number, number, number];
  baseLayer: number;
  transformLayer: number;
  id: string;
  name: string;
  currentSequenceId: string;
  brushType: BrushType;

  // Brush-specific properties
  size: number;
  opacity: number;
  flow: number;
  spacing: number;
  noiseScale: number;
  octaves: number;
  persistence: number;
  randomSeed: number;

  // Pattern-specific
  dotDensity?: number;
  lineAngle?: number;
  lineSpacing?: number;
  cellSize?: number;

  // Rendering resources
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

  // Stroke collection
  currentStroke: BrushStroke | null;
  strokes: BrushStroke[];

  // Uniform buffer for brush parameters
  brushParamsBuffer?: PolyfillBuffer;
  brushParamsBindGroup?: PolyfillBindGroup;

  constructor(
    window_size: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    camera: Camera,
    config: BrushConfig,
    currentSequenceId: string
  ) {
    this.points = [];
    this.dimensions = config.dimensions;
    this.position = config.position;
    this.rotation = config.rotation;
    this.primaryColor = config.primaryColor;
    this.secondaryColor = config.secondaryColor;
    this.baseLayer = config.layer;
    this.transformLayer = 0;
    this.id = config.id;
    this.name = config.name;
    this.currentSequenceId = currentSequenceId;
    this.brushType = config.brushType;

    this.size = config.size;
    this.opacity = config.opacity;
    this.flow = config.flow;
    this.spacing = config.spacing;
    this.noiseScale = config.noiseScale;
    this.octaves = config.octaves;
    this.persistence = config.persistence;
    this.randomSeed = config.randomSeed;

    this.dotDensity = config.dotDensity;
    this.lineAngle = config.lineAngle;
    this.lineSpacing = config.lineSpacing;
    this.cellSize = config.cellSize;

    this.activeGroupPosition = [0, 0];
    this.hidden = false;
    this.vertices = [];
    this.indices = [];
    this.layer = config.layer;
    this.objectType = ObjectType.Polygon; // Treat as polygon-like object for now

    this.currentStroke = null;
    this.strokes = [];

    // Initialize transform
    // this.transform = createEmptyGroupTransform(
    //   this.position.x,
    //   this.position.y,
    //   this.dimensions[0],
    //   this.dimensions[1],
    //   this.rotation
    // );
    let [group_bind_group, group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      camera.windowSize
    );

    this.transform = group_transform;

    // Create initial geometry (empty until strokes are added)
    this.createGeometry(camera, window_size);

    // Create buffers
    this.vertexBuffer = this.createVertexBuffer(device, queue);
    this.indexBuffer = this.createIndexBuffer(device, queue);
    this.bindGroup = this.createBindGroup(
      device,
      bindGroupLayout,
      camera,
      queue
    );
    // this.groupBindGroup = this.createGroupBindGroup(
    //   device,
    //   groupBindGroupLayout,
    //   camera
    // );
    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      camera.windowSize
    );
    this.groupBindGroup = tmp_group_bind_group;
  }

  // Start a new stroke
  startStroke(point: BrushPoint, config: BrushConfig): void {
    this.currentStroke = {
      id: `stroke_${Date.now()}_${Math.random()}`,
      points: [point],
      brushConfigSnapshot: {
        brushType: config.brushType,
        size: config.size,
        opacity: config.opacity,
        flow: config.flow,
        spacing: config.spacing,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        noiseScale: config.noiseScale,
        octaves: config.octaves,
        persistence: config.persistence,
        randomSeed: config.randomSeed,
      },
      startTime: point.timestamp,
      endTime: point.timestamp,
    };
  }

  // Add point to current stroke
  addStrokePoint(point: BrushPoint): void {
    if (!this.currentStroke) return;

    // Check spacing - only add point if it's far enough from last point
    const lastPoint =
      this.currentStroke.points[this.currentStroke.points.length - 1];
    const distance = Math.sqrt(
      Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
    );

    const minDistance = this.size * this.spacing;
    if (distance >= minDistance) {
      this.currentStroke.points.push(point);
      this.currentStroke.endTime = point.timestamp;
    }
  }

  // End current stroke and add to strokes array
  endStroke(): void {
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
    }
  }

  // Create geometry from all strokes
  createGeometry(camera: Camera, window_size: WindowSize): void {
    this.vertices = [];
    this.indices = [];

    if (this.strokes.length === 0 && !this.currentStroke) {
      return;
    }

    // Combine all strokes into vertices/indices
    const allStrokes = [...this.strokes];
    if (this.currentStroke) {
      allStrokes.push(this.currentStroke);
    }

    let vertexOffset = 0;

    for (const stroke of allStrokes) {
      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const pressureSize = this.size * point.pressure;

        // Create quad for each point (brush dab)
        const halfSize = pressureSize / 2;

        // Four corners of the quad
        const corners = [
          { x: point.x - halfSize, y: point.y - halfSize },
          { x: point.x + halfSize, y: point.y - halfSize },
          { x: point.x + halfSize, y: point.y + halfSize },
          { x: point.x - halfSize, y: point.y + halfSize },
        ];

        // Add vertices with proper gradient_coords for world position
        for (let j = 0; j < 4; j++) {
          const vertex = createVertex(
            corners[j].x,
            corners[j].y,
            getZLayer(this.transformLayer),
            [
              this.primaryColor[0] / 255,
              this.primaryColor[1] / 255,
              this.primaryColor[2] / 255,
              (this.primaryColor[3] / 255) * this.opacity,
            ],
            ObjectType.Brush
          );

          // Set gradient_coords to world position for procedural texture
          vertex.gradient_coords = [corners[j].x, corners[j].y];

          this.vertices.push(vertex);
        }

        // Add indices (two triangles per quad)
        this.indices.push(
          vertexOffset + 0,
          vertexOffset + 1,
          vertexOffset + 2,
          vertexOffset + 0,
          vertexOffset + 2,
          vertexOffset + 3
        );

        vertexOffset += 4;
      }
    }
  }

  createVertexBuffer(
    device: PolyfillDevice,
    queue: PolyfillQueue
  ): PolyfillBuffer {
    // Vertex layout: position(3) + tex_coords(2) + color(4) + gradient_coords(2) + object_type(1)
    const floatsPerVertex = 12;
    const vertexData = new Float32Array(this.vertices.length * floatsPerVertex);

    this.vertices.forEach((vertex, i) => {
      const offset = i * floatsPerVertex;
      vertexData[offset + 0] = vertex.position[0];
      vertexData[offset + 1] = vertex.position[1];
      vertexData[offset + 2] = vertex.position[2];
      vertexData[offset + 3] = vertex.tex_coords[0];
      vertexData[offset + 4] = vertex.tex_coords[1];
      vertexData[offset + 5] = vertex.color[0];
      vertexData[offset + 6] = vertex.color[1];
      vertexData[offset + 7] = vertex.color[2];
      vertexData[offset + 8] = vertex.color[3];
      vertexData[offset + 9] = vertex.gradient_coords[0];
      vertexData[offset + 10] = vertex.gradient_coords[1];
      vertexData[offset + 11] = vertex.object_type;
    });

    console.info(
      "brush data ",
      this.vertices.length,
      vertexData.byteLength,
      this.vertices.length * Float32Array.BYTES_PER_ELEMENT * 100
    );

    const buffer = device.createBuffer(
      {
        // size: vertexData.byteLength,
        size: this.vertices.length * Float32Array.BYTES_PER_ELEMENT * 100,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // VERTEX | COPY_DST
        // mappedAtCreation: true,
      },
      ""
    );

    // new Float32Array(buffer.getMappedRange()).set(vertexData);
    // buffer.unmap();

    queue.writeBuffer(
      buffer,
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

    return buffer;
  }

  createIndexBuffer(
    device: PolyfillDevice,
    queue: PolyfillQueue
  ): PolyfillBuffer {
    const indexData = new Uint16Array(this.indices);

    const buffer = device.createBuffer(
      {
        // size: indexData.byteLength,
        size: this.indices.length * Uint32Array.BYTES_PER_ELEMENT * 24,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, // INDEX | COPY_DST
        // mappedAtCreation: true,
      },
      ""
    );

    // new Uint16Array(buffer.getMappedRange()).set(indexData);
    // buffer.unmap();

    queue.writeBuffer(buffer, 0, new Uint32Array(this.indices));

    return buffer;
  }

  createBindGroup(
    device: PolyfillDevice,
    bindGroupLayout: PolyfillBindGroupLayout,
    camera: Camera,
    queue: PolyfillQueue
  ): PolyfillBindGroup {
    const emptyMatrix = mat4.create();
    const modelMatrix = matrix4ToRawArray(emptyMatrix);
    const modelBuffer = device.createBuffer(
      {
        label: "Brush Uniform Buffer",
        size: modelMatrix.byteLength,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      "uniformMatrix4fv"
    );

    if (process.env.NODE_ENV !== "test") {
      new Float32Array(modelBuffer.getMappedRange()).set(modelMatrix);
      modelBuffer.unmap();
    }

    // Create white texture (brushes don't use textures but need something bound)
    const textureSize = { width: 1, height: 1, depthOrArrayLayers: 1 };
    const texture = device.createTexture({
      label: "Brush White Texture",
      size: textureSize,
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
        origin: { x: 0, y: 0, z: 0 },
      },
      whitePixel,
      { offset: 0, bytesPerRow: 4, rowsPerImage: undefined },
      textureSize
    );

    const brushParamsBuffer = device.createBuffer(
      {
        label: "Brush Params Buffer",
        size: 212,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      // "uniform"
      "UBO"
    );

    // Create brush parameters buffer (reusing gradient buffer structure)
    // const brushParamsData = new Float32Array(64); // Match gradient buffer size
    const brushParamsData = new Float32Array(
      brushParamsBuffer.getMappedRange()
    );

    // Pack brush parameters into the buffer
    // Layout in bindGroup2_0:
    // u_stop_offsets[2] = vec4 * 2 = 8 floats (indices 0-7)
    // u_stop_colors[8] = vec4 * 8 = 32 floats (indices 8-39)
    // u_num_stops = 1 float (index 40) = brushType
    // u_gradient_type = 1 float (index 41) = noiseScale
    // u_start_point = 2 floats (indices 42-43) = octaves, persistence
    // u_end_point = 2 floats (indices 44-45) = randomSeed, dotDensity/lineAngle/cellSize
    // u_center = 2 floats (indices 46-47) = lineSpacing, unused
    // u_radius = 1 float (index 48)
    // u_time = 1 float (index 49)
    // u_animation_speed = 1 float (index 50)
    // u_enabled = 1 float (index 51)
    // u_border_radius = 1 float (index 52)

    // Fill u_stop_offsets[2] (8 floats) - placeholder zeros
    for (let i = 0; i < 8; i++) {
      brushParamsData[i] = 0.0;
    }

    // Fill u_stop_colors[8] (32 floats) - placeholder zeros
    for (let i = 8; i < 40; i++) {
      brushParamsData[i] = 0.0;
    }

    console.info("brush type", this.brushTypeToNumber());

    // Fill actual brush parameters
    brushParamsData[40] = this.brushTypeToNumber(); // u_num_stops = brushType
    brushParamsData[41] = this.noiseScale; // u_gradient_type = noiseScale
    brushParamsData[42] = this.octaves; // u_start_point.x = octaves
    brushParamsData[43] = this.persistence; // u_start_point.y = persistence
    brushParamsData[44] = this.randomSeed; // u_end_point.x = randomSeed

    // Set pattern-specific param based on brush type
    let param1 = 0.0;
    if (this.brushType === BrushType.Dots && this.dotDensity !== undefined) {
      param1 = this.dotDensity;
    } else if (
      this.brushType === BrushType.Lines &&
      this.lineAngle !== undefined
    ) {
      param1 = this.lineAngle;
    } else if (
      this.brushType === BrushType.Voronoi &&
      this.cellSize !== undefined
    ) {
      param1 = this.cellSize;
    }
    brushParamsData[45] = param1; // u_end_point.y

    let lineSpacing = 0.0;
    if (this.brushType === BrushType.Lines && this.lineSpacing !== undefined) {
      lineSpacing = this.lineSpacing;
    }
    brushParamsData[46] = lineSpacing; // u_center.x
    brushParamsData[47] = 0.0; // u_center.y (unused)

    brushParamsData[48] = 0.0; // u_radius (unused)
    brushParamsData[49] = 0.0; // u_time (unused)
    brushParamsData[50] = 0.0; // u_animation_speed (unused)
    brushParamsData[51] = 0.0; // u_enabled (unused)
    brushParamsData[52] = 0.0; // u_border_radius (unused)

    if (process.env.NODE_ENV !== "test") {
      // new Float32Array(brushParamsBuffer.getMappedRange()).set(brushParamsData);
      brushParamsBuffer.unmap();
    }

    return device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          groupIndex: 1,
          resource: {
            pbuffer: modelBuffer,
          },
        },
        { binding: 1, groupIndex: 1, resource: texture },
        {
          binding: 0,
          groupIndex: 2,
          resource: {
            pbuffer: brushParamsBuffer,
          },
        },
      ],
    });
  }

  brushTypeToNumber(): number {
    switch (this.brushType) {
      case BrushType.Noise:
        return 1;
      case BrushType.Dots:
        return 2;
      case BrushType.Lines:
        return 3;
      case BrushType.Voronoi:
        return 4;
      case BrushType.Fractal:
        return 5;
      case BrushType.Gradient:
        return 6;
      case BrushType.Splatter:
        return 7;
      default:
        return 1;
    }
  }

  // createGroupBindGroup(
  //   device: PolyfillDevice,
  //   groupBindGroupLayout: PolyfillBindGroupLayout,
  //   camera: Camera
  // ): PolyfillBindGroup {
  //   const groupPositionData = new Float32Array([
  //     this.activeGroupPosition[0],
  //     this.activeGroupPosition[1],
  //   ]);

  //   const groupBuffer = device.createBuffer({
  //     size: groupPositionData.byteLength,
  //     usage: 1 | 2,
  //     mappedAtCreation: true,
  //   });
  //   new Float32Array(groupBuffer.getMappedRange()).set(groupPositionData);
  //   groupBuffer.unmap();

  //   return device.createBindGroup({
  //     layout: groupBindGroupLayout,
  //     entries: [{ binding: 0, resource: { buffer: groupBuffer } }],
  //   });
  // }

  // Update buffers when strokes change
  updateBuffers(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    camera: Camera,
    window_size: WindowSize
  ): void {
    this.createGeometry(camera, window_size);

    if (this.vertices.length === 0) {
      return;
    }

    // Recreate buffers
    this.vertexBuffer = this.createVertexBuffer(device, queue);
    this.indexBuffer = this.createIndexBuffer(device, queue);
  }

  // Convert to config for saving
  toConfig(): BrushConfig {
    return {
      id: this.id,
      name: this.name,
      brushType: this.brushType,
      size: this.size,
      opacity: this.opacity,
      flow: this.flow,
      spacing: this.spacing,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      noiseScale: this.noiseScale,
      octaves: this.octaves,
      persistence: this.persistence,
      randomSeed: this.randomSeed,
      dotDensity: this.dotDensity,
      lineAngle: this.lineAngle,
      lineSpacing: this.lineSpacing,
      cellSize: this.cellSize,
      position: this.position,
      dimensions: this.dimensions,
      layer: this.layer,
      rotation: this.rotation,
    };
  }

  toSavedConfig(): SavedBrushConfig {
    return {
      id: this.id,
      name: this.name,
      brushType: this.brushType,
      size: this.size,
      opacity: this.opacity,
      flow: this.flow,
      spacing: this.spacing,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      noiseScale: this.noiseScale,
      octaves: this.octaves,
      persistence: this.persistence,
      randomSeed: this.randomSeed,
      dotDensity: this.dotDensity,
      lineAngle: this.lineAngle,
      lineSpacing: this.lineSpacing,
      cellSize: this.cellSize,
      position: { x: this.position.x, y: this.position.y },
      dimensions: this.dimensions,
      layer: this.layer,
      rotation: this.rotation,
      strokes: this.strokes,
    };
  }
}
