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
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";
import { setupGradientBuffers } from "./polygon";

export interface Cube3DConfig {
  id: string;
  name: string;
  dimensions: [number, number, number]; // [width, height, depth]
  position: Point;
  rotation: [number, number, number]; // Euler angles [x, y, z]
  backgroundFill: BackgroundFill;
  layer: number;
}

export interface SavedCube3DConfig {
  id: string;
  name: string;
  dimensions: [number, number, number];
  position: Point;
  rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
}

export class Cube3D {
  id: string;
  name: string;
  dimensions: [number, number, number];
  position: Point;
  rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
  hidden: boolean;
  objectType: ObjectType;

  vertices: Vertex[];
  indices: number[];
  vertexBuffer: PolyfillBuffer;
  indexBuffer: PolyfillBuffer;
  bindGroup: PolyfillBindGroup;
  groupBindGroup: PolyfillBindGroup;
  transform: Transform;
  currentSequenceId: string;

  constructor(
    windowSize: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    camera: Camera,
    config: Cube3DConfig,
    currentSequenceId: string
  ) {
    this.id = config.id;
    this.name = config.name;
    this.dimensions = config.dimensions;
    this.position = {
      x: CANVAS_HORIZ_OFFSET + config.position.x,
      y: CANVAS_VERT_OFFSET + config.position.y,
    };
    this.rotation = config.rotation;
    this.backgroundFill = config.backgroundFill;
    this.layer = config.layer;
    this.hidden = false;
    this.objectType = ObjectType.Cube3D;
    this.currentSequenceId = currentSequenceId;

    // Generate cube geometry
    const [vertices, indices] = this.generateCubeGeometry();
    this.vertices = vertices;
    this.indices = indices;

    // Create vertex buffer
    this.vertexBuffer = device.createBuffer(
      {
        label: "Cube3D Vertex Buffer",
        size: vertices.length * vertexByteSize,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
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

    queue.writeBuffer(this.vertexBuffer, 0, vertexData.buffer);

    // Create index buffer
    this.indexBuffer = device.createBuffer(
      {
        label: "Cube3D Index Buffer",
        size: indices.length * Uint32Array.BYTES_PER_ELEMENT,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );
    queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(indices).buffer);

    // Create uniform buffer
    const emptyMatrix = mat4.create();
    const rawMatrix = matrix4ToRawArray(emptyMatrix);

    const uniformBuffer = device.createBuffer(
      {
        label: "Cube3D Uniform Buffer",
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

    // Create texture
    const textureSize = { width: 1, height: 1, depthOrArrayLayers: 1 };
    const texture = device.createTexture({
      label: "Cube3D Texture",
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

    // Setup gradient
    let [gradient, gradientBuffer] = setupGradientBuffers(
      device,
      queue,
      config.backgroundFill.type === "Gradient"
        ? config.backgroundFill.value
        : null
    );

    // Create bind group
    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          groupIndex: 1,
          resource: {
            pbuffer: uniformBuffer,
          },
        },
        { binding: 1, groupIndex: 1, resource: texture },
        {
          binding: 0,
          groupIndex: 2,
          resource: {
            pbuffer: gradientBuffer,
          },
        },
      ],
    });

    // Create transform
    this.transform = new Transform(
      vec2.fromValues(this.position.x, this.position.y),
      0, // 2D rotation (we'll handle 3D rotation separately)
      vec2.fromValues(1, 1),
      uniformBuffer
    );

    this.transform.updateRotationXDegrees(this.rotation[0]);
    this.transform.updateRotationYDegrees(this.rotation[1]);
    this.transform.updateRotationDegrees(this.rotation[2]);
    this.transform.layer = (getZLayer(config.layer) as number) - 0.5;
    this.transform.updateUniformBuffer(queue, camera.windowSize);

    // Create group bind group
    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      windowSize
    );
    this.groupBindGroup = tmp_group_bind_group;
  }

  private generateCubeGeometry(): [Vertex[], number[]] {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const [w, h, d] = this.dimensions;
    const hw = w / 2; // half width
    const hh = h / 2; // half height
    const hd = d / 2; // half depth

    // Define a distinct color for each face (RGBA)
    const faceColors: [number, number, number, number][] = [
      [1, 0, 0, 1], // Front - Red
      [0, 1, 0, 1], // Back - Green
      [0, 0, 1, 1], // Top - Blue
      [1, 1, 0, 1], // Bottom - Yellow
      [1, 0, 1, 1], // Right - Magenta
      [0, 1, 1, 1], // Left - Cyan
    ];

    // Define the 8 cube corners
    const positions: [number, number, number][] = [
      [-hw, -hh, hd], // 0 Front-bottom-left
      [hw, -hh, hd], // 1 Front-bottom-right
      [hw, hh, hd], // 2 Front-top-right
      [-hw, hh, hd], // 3 Front-top-left
      [-hw, -hh, -hd], // 4 Back-bottom-left
      [hw, -hh, -hd], // 5 Back-bottom-right
      [hw, hh, -hd], // 6 Back-top-right
      [-hw, hh, -hd], // 7 Back-top-left
    ];

    // Define faces with indices and normals
    const faces = [
      { indices: [0, 1, 2, 0, 2, 3], normal: [0, 0, 1] }, // Front
      { indices: [5, 4, 7, 5, 7, 6], normal: [0, 0, -1] }, // Back
      { indices: [3, 2, 6, 3, 6, 7], normal: [0, 1, 0] }, // Top
      { indices: [4, 5, 1, 4, 1, 0], normal: [0, -1, 0] }, // Bottom
      { indices: [1, 5, 6, 1, 6, 2], normal: [1, 0, 0] }, // Right
      { indices: [4, 0, 3, 4, 3, 7], normal: [-1, 0, 0] }, // Left
    ];

    // Build geometry
    for (let faceIdx = 0; faceIdx < faces.length; faceIdx++) {
      const face = faces[faceIdx];
      const color = faceColors[faceIdx];
      const startIndex = vertices.length;

      // Add 6 vertices (2 triangles per face)
      for (const idx of face.indices) {
        const pos = positions[idx];
        vertices.push({
          position: pos,
          tex_coords: [0, 0],
          color: color,
          gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
          object_type: 5,
        });
      }

      // Add indices
      indices.push(
        startIndex,
        startIndex + 1,
        startIndex + 2,
        startIndex + 3,
        startIndex + 4,
        startIndex + 5
      );
    }

    return [vertices, indices];
  }

  updateOpacity(queue: PolyfillQueue, opacity: number) {
    let new_color: [number, number, number, number] = [1, 1, 1, opacity];
    if (this.backgroundFill.type === "Gradient") {
      let firstStop = this.backgroundFill.value.stops[0];
      new_color = [
        firstStop.color[0],
        firstStop.color[1],
        firstStop.color[2],
        opacity,
      ];
    } else if (this.backgroundFill.type === "Color") {
      new_color = [
        this.backgroundFill.value[0],
        this.backgroundFill.value[1],
        this.backgroundFill.value[2],
        opacity,
      ];
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
    let layer_index = getZLayer(layer);
    this.layer = layer;
    this.transform.layer = layer_index as number;
  }

  toConfig(): Cube3DConfig {
    return {
      id: this.id,
      name: this.name,
      dimensions: this.dimensions,
      position: {
        x: this.transform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.transform.position[1] - CANVAS_VERT_OFFSET,
      },
      rotation: this.rotation,
      backgroundFill: this.backgroundFill,
      layer: this.layer,
    };
  }

  toSavedConfig(): SavedCube3DConfig {
    return this.toConfig();
  }

  containsPoint(point: Point): boolean {
    // Simple bounding box check for 3D cube projected to 2D
    const [w, h] = this.dimensions;
    const x = this.transform.position[0];
    const y = this.transform.position[1];

    return (
      point.x >= x - w / 2 &&
      point.x <= x + w / 2 &&
      point.y >= y - h / 2 &&
      point.y <= y + h / 2
    );
  }
}
