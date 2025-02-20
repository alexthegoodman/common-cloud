import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid"; // Make sure you have uuid installed
import { Vertex } from "./vertex";
import { createEmptyGroupTransform, Transform } from "./transform";
import {
  INTERNAL_LAYER_SPACE,
  SavedPoint,
  setupGradientBuffers,
} from "./polygon";
import { Point } from "./editor";
import { WindowSize } from "./camera";
import { ObjectType } from "./animations";

export interface SavedStImageConfig {
  id: string;
  name: string;
  dimensions: [number, number];
  // pub path: String,
  url: string;
  position: SavedPoint;
  layer: number;
}

export interface StImageConfig {
  id: string;
  name: string;
  dimensions: [number, number];
  // pub path: String,
  url: string;
  position: SavedPoint;
  layer: number;
}

export class StImage {
  id: string;
  currentSequenceId: string;
  name: string;
  url: string;
  texture!: GPUTexture;
  textureView!: GPUTextureView;
  transform: Transform;
  vertexBuffer!: GPUBuffer;
  indexBuffer!: GPUBuffer;
  dimensions: [number, number];
  bindGroup!: GPUBindGroup;
  vertices: Vertex[];
  // indices: Uint32Array;
  indices: number[];
  hidden: boolean;
  layer: number;
  groupBindGroup!: GPUBindGroup;
  objectType: ObjectType;
  // gradientBindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    url: string,
    blob: Blob,
    imageConfig: StImageConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    // gradientBindGroupLayout: GPUBindGroupLayout,
    zIndex: number,
    currentSequenceId: string,
    loadedHidden: boolean
  ) {
    this.id = imageConfig.id;
    this.currentSequenceId = currentSequenceId;
    this.name = imageConfig.name;
    this.url = url;
    // this.hidden = false;
    this.layer = imageConfig.layer;
    this.dimensions = imageConfig.dimensions;
    this.vertices = [];
    // this.indices = new Uint32Array();
    this.indices = [];
    this.objectType = ObjectType.ImageItem;

    let gradientBuffer = setupGradientBuffers(
      device,
      queue
      // gradientBindGroupLayout
    );

    // this.gradientBindGroup = gradientBindGroup;

    const identityMatrix = mat4.create();
    let uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
    uniformBuffer.unmap();

    // let pos = vec2.create();
    // vec2.set(pos, imageConfig.position.x, imageConfig.position.y);
    // let scl = vec2.create();
    // vec2.set(scl, imageConfig.dimensions[0], imageConfig.dimensions[1]);

    this.transform = new Transform(
      vec2.fromValues(imageConfig.position.x, imageConfig.position.y),
      0.0,
      vec2.fromValues(imageConfig.dimensions[0], imageConfig.dimensions[1]), // Apply scaling here instead of resizing image
      uniformBuffer
      // window_size,
    );

    console.info("image spot", imageConfig.position.x, imageConfig.position.y);

    // -10.0 to provide 10 spots for internal items on top of objects
    this.transform.layer = imageConfig.layer - INTERNAL_LAYER_SPACE;
    this.transform.updateUniformBuffer(queue, windowSize);

    this.hidden = true; // true till bitmap loaded?

    const imgBitmap = createImageBitmap(blob).then(async (imageBitmap) => {
      const originalDimensions = [imageBitmap.width, imageBitmap.height];
      const dimensions = imageConfig.dimensions;

      console.info("imgBitmap", originalDimensions);

      const textureSize: GPUExtent3DStrict = {
        width: dimensions[0],
        height: dimensions[1],
        depthOrArrayLayers: 1,
      };

      this.texture = device.createTexture({
        // Initialize texture
        label: "Image Texture",
        size: textureSize,
        mipLevelCount: 1,
        sampleCount: 1,
        dimension: "2d",
        format: "rgba8unorm-srgb",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });

      // surely we can get write our textures without creating all these canvases
      const context = document.createElement("canvas").getContext("2d")!;
      context.canvas.width = dimensions[0];
      context.canvas.height = dimensions[1];
      context.drawImage(imageBitmap, 0, 0, dimensions[0], dimensions[1]);
      const rgba = context.getImageData(
        0,
        0,
        dimensions[0],
        dimensions[1]
      ).data;

      console.info("rgba", rgba.length);

      queue.writeTexture(
        {
          texture: this.texture,
          mipLevel: 0,
          origin: { x: 0, y: 0, z: 0 },
          aspect: "all",
        },
        rgba,
        {
          offset: 0,
          bytesPerRow: dimensions[0] * 4,
          rowsPerImage: dimensions[1],
        },
        textureSize
      );

      this.textureView = this.texture.createView(); // Initialize textureView

      const sampler = device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        addressModeW: "clamp-to-edge",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
      });

      this.bindGroup = device.createBindGroup({
        // Initialize bindGroup
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
          { binding: 1, resource: this.textureView },
          { binding: 2, resource: sampler },
          {
            binding: 3,
            resource: {
              buffer: gradientBuffer,
            },
          },
        ],
        label: "Image Bind Group",
      });

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

      this.vertexBuffer = device.createBuffer({
        // Initialize vertexBuffer
        label: "Vertex Buffer",
        size: this.vertices.length * 4 * 14,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
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
      ); // Correct writeBuffer call

      // const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);
      const indices = [0, 1, 2, 0, 2, 3];
      this.indices = indices;
      // this.indexBuffer = device.createBuffer({
      //   // Initialize indexBuffer
      //   label: "Index Buffer",
      //   size: indices.byteLength,
      //   usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      // });
      // queue.writeBuffer(this.indexBuffer, 0, indices); // Correct writeBuffer call

      this.indexBuffer = device.createBuffer({
        label: "Index Buffer",
        size: indices.length * Uint32Array.BYTES_PER_ELEMENT, // Correct size calculation
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(indices));

      this.dimensions = dimensions;

      let [group_bind_group, group_transform] = createEmptyGroupTransform(
        device,
        groupBindGroupLayout,
        windowSize
      );

      this.groupBindGroup = group_bind_group;
      // this.hidden = false;
      this.hidden = loadedHidden;
    });
    // return imgBitmap;
  }

  updateOpacity(queue: GPUQueue, opacity: number): void {
    const newColor: [number, number, number, number] = [1.0, 1.0, 1.0, opacity];

    this.vertices.forEach((v) => {
      v.color = newColor;
    });

    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(this.vertices.flat() as unknown as ArrayBuffer)
    );
  }

  updateDataFromDimensions(
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    dimensions: [number, number]
  ): void {
    this.dimensions = [dimensions[0], dimensions[1]];
    this.transform.updateScale([dimensions[0], dimensions[1]]);
    this.transform.updateUniformBuffer(queue, windowSize);
  }

  updateLayer(layerIndex: number): void {
    let layer = layerIndex - INTERNAL_LAYER_SPACE;
    this.layer = layer;
    this.transform.layer = layer;
  }

  //   update(queue: GPUQueue, windowSize: { width: number; height: number }): void {
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
    };
  }

  static async fromConfig(
    config: StImageConfig,
    windowSize: { width: number; height: number },
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    // gradientBindGroupLayout: GPUBindGroupLayout,
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
