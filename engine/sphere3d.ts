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

export interface Sphere3DConfig {
  id: string;
  name: string;
  radius: number;
  position: Point;
  rotation: [number, number, number]; // Euler angles [x, y, z]
  backgroundFill: BackgroundFill;
  layer: number;
  segments?: number; // Optional: defaults to 32
}

export interface SavedSphere3DConfig {
  id: string;
  name: string;
  radius: number;
  position: Point;
  rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
  segments?: number;
}

export class Sphere3D {
  id: string;
  name: string;
  radius: number;
  position: Point;
  rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
  segments: number;
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
    config: Sphere3DConfig,
    currentSequenceId: string
  ) {
    this.id = config.id;
    this.name = config.name;
    this.radius = config.radius;
    this.position = {
      x: CANVAS_HORIZ_OFFSET + config.position.x,
      y: CANVAS_VERT_OFFSET + config.position.y,
    };
    this.rotation = config.rotation;
    this.backgroundFill = config.backgroundFill;
    this.layer = config.layer;
    this.segments = config.segments || 32;
    this.hidden = false;
    this.objectType = ObjectType.Sphere3D;
    this.currentSequenceId = currentSequenceId;

    // Generate sphere geometry
    const [vertices, indices] = this.generateSphereGeometry();
    this.vertices = vertices;
    this.indices = indices;

    // Create vertex buffer
    this.vertexBuffer = device.createBuffer(
      {
        label: "Sphere3D Vertex Buffer",
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
        label: "Sphere3D Index Buffer",
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
        label: "Sphere3D Uniform Buffer",
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
      label: "Sphere3D Texture",
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

  private generateSphereGeometry(): [Vertex[], number[]] {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const latBands = this.segments;
    const longBands = this.segments;
    const radius = this.radius;

    let color: [number, number, number, number] = [1, 1, 1, 1];
    if (this.backgroundFill.type === "Color") {
      color = this.backgroundFill.value;
    } else if (this.backgroundFill.type === "Gradient") {
      color = this.backgroundFill.value.stops[0].color;
    }

    // Generate vertices
    for (let lat = 0; lat <= latBands; lat++) {
      const theta = (lat * Math.PI) / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let long = 0; long <= longBands; long++) {
        const phi = (long * 2 * Math.PI) / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        const u = 1 - long / longBands;
        const v = 1 - lat / latBands;

        vertices.push({
          position: [x * radius, y * radius, z * radius],
          tex_coords: [u, v],
          color: color,
          gradient_coords: [u, v],
          object_type: 6, // Will update ObjectType enum
        });
      }
    }

    // Generate indices
    for (let lat = 0; lat < latBands; lat++) {
      for (let long = 0; long < longBands; long++) {
        const first = lat * (longBands + 1) + long;
        const second = first + longBands + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
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

  toConfig(): Sphere3DConfig {
    return {
      id: this.id,
      name: this.name,
      radius: this.radius,
      position: {
        x: this.transform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.transform.position[1] - CANVAS_VERT_OFFSET,
      },
      rotation: this.rotation,
      backgroundFill: this.backgroundFill,
      layer: this.layer,
      segments: this.segments,
    };
  }

  toSavedConfig(): SavedSphere3DConfig {
    return this.toConfig();
  }

  containsPoint(point: Point): boolean {
    // Simple bounding box check for 3D sphere projected to 2D
    const r = this.radius;
    const x = this.transform.position[0];
    const y = this.transform.position[1];

    // Use circle containment (distance from center)
    const dx = point.x - x;
    const dy = point.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= r;
  }
}
