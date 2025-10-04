import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid"; // Make sure you have uuid installed
import { getZLayer, Vertex } from "./vertex";
import { createEmptyGroupTransform, Transform } from "./transform";
import {
  INTERNAL_LAYER_SPACE,
  SavedPoint,
  setupGradientBuffers,
} from "./polygon";
import { Point } from "./editor";
import { WindowSize } from "./camera";
import { ObjectType } from "./animations";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
  PolyfillTexture,
} from "./polyfill";

export interface SavedStImageConfig {
  id: string;
  name: string;
  dimensions: [number, number];
  // pub path: String,
  url: string;
  position: SavedPoint;
  layer: number;
  isCircle: boolean;
  isSticker?: boolean;
  borderRadius?: number;
}

export interface StImageConfig {
  id: string;
  name: string;
  dimensions: [number, number];
  // pub path: String,
  url: string;
  position: SavedPoint;
  layer: number;
  isCircle: boolean;
  isSticker?: boolean;
  borderRadius?: number;
}

export class StImage {
  id: string;
  currentSequenceId: string;
  name: string;
  url: string;
  texture!: PolyfillTexture;
  // textureView!: GPUTextureView;
  transform!: Transform;
  vertexBuffer!: PolyfillBuffer;
  indexBuffer!: PolyfillBuffer;
  dimensions: [number, number];
  bindGroup!: PolyfillBindGroup;
  originalDimensions: [number, number] = [0, 0];
  vertices: Vertex[];
  indices: number[];
  hidden: boolean;
  layer: number;
  groupBindGroup!: PolyfillBindGroup;
  objectType: ObjectType;
  isCircle: boolean;
  isSticker: boolean;
  borderRadius: number;
  gradientBuffer!: PolyfillBuffer;

  constructor(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    url: string,
    blob: Blob,
    imageConfig: StImageConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    zIndex: number,
    currentSequenceId: string,
    loadedHidden: boolean
    // isCircle: boolean = false
  ) {
    this.id = imageConfig.id;
    this.currentSequenceId = currentSequenceId;
    this.name = imageConfig.name;
    this.url = url;
    this.layer = imageConfig.layer;
    this.dimensions = imageConfig.dimensions;
    this.vertices = [];
    this.indices = [];
    this.objectType = ObjectType.ImageItem;
    this.isCircle = imageConfig.isCircle;
    this.isSticker = imageConfig.isSticker || false;
    this.borderRadius = imageConfig.borderRadius ?? 0.0;

    this.hidden = true; // true till bitmap loaded?

    console.info("see hidden", this.hidden);
  }

  async initialize(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    url: string,
    blob: Blob,
    imageConfig: StImageConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    zIndex: number,
    currentSequenceId: string,
    loadedHidden: boolean
    // isCircle: boolean = false
  ) {
    let [gradient, gradientBuffer] = setupGradientBuffers(device, queue, null, this.borderRadius);
    this.gradientBuffer = gradientBuffer;

    const identityMatrix = mat4.create();
    let uniformBuffer = device.createBuffer(
      {
        size: 64,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      "uniformMatrix4fv"
    );

    if (process.env.NODE_ENV !== "test") {
      new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
      uniformBuffer.unmap();
    }

    this.transform = new Transform(
      vec2.fromValues(imageConfig.position.x, imageConfig.position.y),
      0.0,
      vec2.fromValues(imageConfig.dimensions[0], imageConfig.dimensions[1]), // Apply scaling here instead of resizing image
      uniformBuffer
    );

    console.info("image spot", imageConfig.position.x, imageConfig.position.y);

    // -10.0 to provide 10 spots for internal items on top of objects
    let layer_index = getZLayer(imageConfig.layer);
    this.transform.layer = layer_index;
    // this.transform.updateUniformBuffer(queue, windowSize);

    const imageBitmap = await createImageBitmap(blob);

    const originalDimensions = [imageBitmap.width, imageBitmap.height] as [
      number,
      number
    ];

    this.originalDimensions = originalDimensions;

    const dimensions = imageConfig.dimensions;

    console.info("imgBitmap", originalDimensions);

    // const textureSize: GPUExtent3DStrict = {
    const textureSize = {
      // width: dimensions[0],
      // height: dimensions[1],
      width: originalDimensions[0],
      height: originalDimensions[1],
      depthOrArrayLayers: 1,
    };

    this.texture = device.createTexture({
      // Initialize texture
      label: "Image Texture",
      size: textureSize,
      // mipLevelCount: 1,
      // sampleCount: 1,
      // dimension: "2d",
      format: "rgba8unorm-srgb",
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // surely we can get write our textures without creating all these canvases
    const context =
      process.env.NODE_ENV !== "test"
        ? document.createElement("canvas").getContext("2d")
        : null;
    if (context) {
      context.canvas.width = originalDimensions[0];
      context.canvas.height = originalDimensions[1];
    }

    context?.drawImage(
      imageBitmap,
      0,
      0,
      originalDimensions[0],
      originalDimensions[1]
    );
    const rgba = context
      ? context?.getImageData(
          0,
          0,
          originalDimensions[0],
          originalDimensions[1]
        )?.data
      : Buffer.from([]);

    queue.writeTexture(
      {
        texture: this.texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 },
        // aspect: "all",
      },
      rgba,
      {
        offset: 0,
        bytesPerRow: originalDimensions[0] * 4,
        rowsPerImage: originalDimensions[1],
      },
      textureSize
    );

    // this.textureView = this.texture.createView(); // Initialize textureView

    // const sampler = device.createSampler({
    //   addressModeU: "clamp-to-edge",
    //   addressModeV: "clamp-to-edge",
    //   addressModeW: "clamp-to-edge",
    //   magFilter: "linear",
    //   minFilter: "linear",
    //   mipmapFilter: "linear",
    // });

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
        // { binding: 1, resource: this.textureView },
        { binding: 1, groupIndex: 1, resource: this.texture },
        // { binding: 2, resource: sampler },
        {
          binding: 0,
          groupIndex: 2,
          resource: {
            pbuffer: gradientBuffer,
          },
        },
      ],
      // label: "Image Bind Group",
    });

    // uniformBuffer.unmap();
    this.transform.updateUniformBuffer(queue, windowSize);

    if (imageConfig.isCircle) {
      // Generate circular vertices and UVs
      this.vertices = this.generateCircleVertices();
      this.indices = this.generateCircleIndices();

      // console.info("indices circle ", this.indices);
    } else {
      // Calculate the texture coordinates
      const { u0, u1, v0, v1 } = this.calculateCoverTextureCoordinates(
        dimensions[0],
        dimensions[1],
        originalDimensions[0],
        originalDimensions[1]
      );

      const normalizedX0 =
        (-0.5 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY0 =
        (-0.5 - this.transform.position[1]) / this.dimensions[1];
      const normalizedX1 =
        (0.5 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY1 =
        (0.5 - this.transform.position[1]) / this.dimensions[1];

      this.vertices = [
        {
          position: [-0.5, -0.5, 0.0],
          tex_coords: [u0, v0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX0, normalizedY0],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [0.5, -0.5, 0.0],
          tex_coords: [u1, v0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX1, normalizedY0],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [0.5, 0.5, 0.0],
          tex_coords: [u1, v1],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX1, normalizedY1],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [-0.5, 0.5, 0.0],
          tex_coords: [u0, v1],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX0, normalizedY1],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
      ];

      const indices = [0, 1, 2, 0, 2, 3];
      this.indices = indices;

      console.info("indices", this.indices);
    }

    this.vertexBuffer = device.createBuffer(
      {
        // Initialize vertexBuffer
        label: "Vertex Buffer",
        size: this.vertices.length * 4 * 100,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );

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

    this.indexBuffer = device.createBuffer(
      {
        label: "Index Buffer",
        size: this.indices.length * Uint32Array.BYTES_PER_ELEMENT * 24, // Correct size calculation
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );
    queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(this.indices));

    this.dimensions = dimensions;

    let [group_bind_group, group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      windowSize
    );

    this.groupBindGroup = group_bind_group;
    console.info("set hidden", loadedHidden);
    this.hidden = loadedHidden;
  }

  calculateCoverTextureCoordinates(
    containerWidth: number,
    containerHeight: number,
    imageWidth: number,
    imageHeight: number
  ) {
    // Calculate aspect ratios
    const containerAspect = containerWidth / containerHeight;
    const imageAspect = imageWidth / imageHeight;

    // Initialize texture coordinate variables
    let u0 = 0,
      u1 = 1,
      v0 = 0,
      v1 = 1;

    // If image is wider than container (relative to their heights)
    if (imageAspect > containerAspect) {
      // We need to crop the sides
      const scaleFactor = containerAspect / imageAspect;
      const cropAmount = (1 - scaleFactor) / 2;

      u0 = cropAmount;
      u1 = 1 - cropAmount;
    }
    // If image is taller than container (relative to their widths)
    else if (imageAspect < containerAspect) {
      // We need to crop top and bottom
      const scaleFactor = imageAspect / containerAspect;
      const cropAmount = (1 - scaleFactor) / 2;

      v0 = cropAmount;
      v1 = 1 - cropAmount;
    }

    return { u0, u1, v0, v1 };
  }

  setIsCircle(queue: PolyfillQueue, isCircle: boolean): void {
    this.isCircle = isCircle;

    if (isCircle) {
      // Generate circular vertices and UVs
      this.vertices = this.generateCircleVertices();
      this.indices = this.generateCircleIndices();
    } else {
      const normalizedX0 =
        (-0.5 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY0 =
        (-0.5 - this.transform.position[1]) / this.dimensions[1];
      const normalizedX1 =
        (0.5 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY1 =
        (0.5 - this.transform.position[1]) / this.dimensions[1];

      this.vertices = [
        {
          position: [-0.5, -0.5, 0.0],
          tex_coords: [0.0, 0.0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX0, normalizedY0],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [0.5, -0.5, 0.0],
          tex_coords: [1.0, 0.0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX1, normalizedY0],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [0.5, 0.5, 0.0],
          tex_coords: [1.0, 1.0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX1, normalizedY1],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
        {
          position: [-0.5, 0.5, 0.0],
          tex_coords: [0.0, 1.0],
          color: [1.0, 1.0, 1.0, 1.0],
          gradient_coords: [normalizedX0, normalizedY1],
          object_type: 2, // OBJECT_TYPE_IMAGE
        },
      ];

      const indices = [0, 1, 2, 0, 2, 3];
      this.indices = indices;
    }

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

    queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(this.indices));
  }

  private generateCircleVertices(): Vertex[] {
    const vertices: Vertex[] = [];
    const segments = 32; // Number of segments to approximate the circle
    const radius = 0.5; // Radius of the circle

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // UV coordinates map the texture to the circle
      const u = x + 0.5;
      const v = y + 0.5;

      vertices.push({
        position: [x, y, 0.0],
        tex_coords: [u, v],
        color: [1.0, 1.0, 1.0, 1.0],
        gradient_coords: [x, y], // Adjust gradient coords if needed
        object_type: 2, // OBJECT_TYPE_IMAGE
      });
    }

    // Add the center vertex
    vertices.push({
      position: [0.0, 0.0, 0.0],
      tex_coords: [0.5, 0.5],
      color: [1.0, 1.0, 1.0, 1.0],
      gradient_coords: [0.0, 0.0],
      object_type: 2, // OBJECT_TYPE_IMAGE
    });

    return vertices;
  }

  private generateCircleIndices(): number[] {
    const indices: number[] = [];
    const segments = 32;
    const centerIndex = segments; // Center vertex is the last one

    for (let i = 0; i < segments; i++) {
      const nextIndex = (i + 1) % segments;
      indices.push(centerIndex, i, nextIndex);
    }

    return indices;
  }

  updateOpacity(queue: PolyfillQueue, opacity: number): void {
    const newColor: [number, number, number, number] = [1.0, 1.0, 1.0, opacity];

    this.vertices.forEach((v) => {
      v.color = newColor;
    });

    queue.writeBuffer(
      this.vertexBuffer,
      0,
      // new Float32Array(this.vertices.flat() as unknown as ArrayBuffer)
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

  updateBorderRadius(queue: PolyfillQueue, borderRadius: number): void {
    this.borderRadius = borderRadius;

    // Update the gradient buffer with the new border radius
    if (process.env.NODE_ENV !== "test") {
      const gradientData = new Float32Array(this.gradientBuffer.size / 4);
      // The border_radius is at offset 40 + 12 floats = index 52
      gradientData[52] = borderRadius;

      queue.writeBuffer(
        this.gradientBuffer,
        52 * 4, // byte offset
        gradientData.slice(52, 53)
      );
    }
  }

  updateDataFromDimensions(
    windowSize: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    dimensions: [number, number]
  ): void {
    this.dimensions = [dimensions[0], dimensions[1]];
    this.transform.updateScale([dimensions[0], dimensions[1]]);
    this.transform.updateUniformBuffer(queue, windowSize);

    if (!this.isCircle) {
      // Calculate the texture coordinates
      const { u0, u1, v0, v1 } = this.calculateCoverTextureCoordinates(
        dimensions[0],
        dimensions[1],
        this.originalDimensions[0],
        this.originalDimensions[1]
      );

      this.vertices.forEach((v, i) => {
        if (i === 0) {
          v.tex_coords = [u0, v0];
        }
        if (i === 1) {
          v.tex_coords = [u1, v0];
        }
        if (i === 2) {
          v.tex_coords = [u1, v1];
        }
        if (i === 3) {
          v.tex_coords = [u0, v1];
        }
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
  }

  updateLayer(layerIndex: number): void {
    // let layer = layerIndex - INTERNAL_LAYER_SPACE;
    // let layer_index = -1.0 - getZLayer(layerIndex - INTERNAL_LAYER_SPACE);
    let layer_index = getZLayer(layerIndex);
    this.layer = layerIndex;
    this.transform.layer = layer_index;
  }

  //   update(queue: PolyfillQueue, windowSize: { width: number; height: number }): void {
  //     queue.writeBuffer(
  //       this.vertexBuffer,
  //       0,
  //       new Float32Array(this.transform as unknown as ArrayBuffer)
  //     );
  //   }

  getDimensions(): [number, number] {
    return this.dimensions;
  }

  containsPoint(point: Point): boolean {
    const untranslated: Point = {
      x: point.x - this.transform.position[0], // Access translation from matrix
      y: point.y - this.transform.position[1],
    };

    return (
      untranslated.x >= -0.5 * this.dimensions[0] &&
      untranslated.x <= 0.5 * this.dimensions[0] &&
      untranslated.y >= -0.5 * this.dimensions[1] &&
      untranslated.y <= 0.5 * this.dimensions[1]
    );
  }

  toLocalSpace(worldPoint: Point): Point {
    const untranslated: Point = {
      x: worldPoint.x - this.transform.position[0],
      y: worldPoint.y - this.transform.position[1],
    };

    const localPoint: Point = {
      x: untranslated.x / this.dimensions[0],
      y: untranslated.y / this.dimensions[1],
    };

    return localPoint;
  }

  toConfig(): StImageConfig {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      dimensions: this.dimensions,
      position: {
        x: this.transform.position[0], // Access position from matrix
        y: this.transform.position[1],
      },
      layer: this.layer,
      isCircle: this.isCircle,
      isSticker: this.isSticker,
      borderRadius: this.borderRadius,
    };
  }

  static async fromConfig(
    config: StImageConfig,
    windowSize: { width: number; height: number },
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    // gradientBindGroupLayout: PolyfillBindGroupLayout,
    selectedSequenceId: string
  ): Promise<StImage> {
    const response = await fetch(config.url);
    const blob = await response.blob();

    const stImage = new StImage(
      device,
      queue,
      config.url,
      blob,
      config,
      windowSize,
      bindGroupLayout,
      groupBindGroupLayout,
      // gradientBindGroupLayout,
      -2.0,
      selectedSequenceId,
      false
    );
    return stImage;
  }
}

export async function fileToBlob(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    return blob;
  } catch (error) {
    console.error("Error converting file to blob:", error);
    return null;
  }
}
