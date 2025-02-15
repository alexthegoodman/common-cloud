import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";
import { Point } from "./editor";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Vertex } from "./vertex";
import { SavedPoint } from "./polygon";

export interface RectInfo {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}
export interface WindowInfo {
  hwnd: number;
  title: string;
  rect: RectInfo;
}

export interface MouseTrackingState {
  // mouse_positions: Arc<Mutex<Vec<serde_json::Value>>>,
  // start_time: SystemTime,
  // is_tracking: Arc<AtomicBool>,
  // is_recording: Arc<AtomicBool>,
}

export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface SourceData {
  id: String;
  name: String;
  width: number;
  height: number;
  x: number;
  y: number;
  scaleFactor: number;
}
export interface SavedStVideoConfig {
  id: string;
  name: string;
  dimensions: [number, number];
  path: string;
  position: SavedPoint;
  layer: number;
  mousePath: string;
}

export interface StVideoConfig {
  id: string;
  name: string;
  dimensions: [number, number]; // overrides actual image size
  position: Point;
  path: string;
  layer: number;
  mousePath: string;
}

export class StVideo {
  id: string;
  currentSequenceId: string;
  name: string;
  path: string;
  sourceDuration: number;
  sourceDurationMs: number;
  sourceDimensions: [number, number];
  sourceFrameRate: number;
  texture!: GPUTexture;
  textureView!: GPUTextureView;
  transform: Transform;
  vertexBuffer!: GPUBuffer;
  indexBuffer!: GPUBuffer;
  dimensions: [number, number];
  bindGroup!: GPUBindGroup;
  vertices: Vertex[];
  indices: Uint32Array;
  hidden: boolean;
  layer: number;
  groupBindGroup!: GPUBindGroup;
  currentZoom: number;
  mousePath: string | undefined;
  mousePositions: MousePosition[] | undefined;
  lastCenterPoint: Point | undefined;
  lastStartPoint: MousePosition | undefined;
  lastEndPoint: MousePosition | undefined;
  lastShiftTime: number | undefined;
  sourceData: SourceData | undefined;
  gridResolution: [number, number];
  //   frameTimer: FrameTimer | undefined;
  dynamicAlpha: number;
  numFramesDrawn: number;

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    path: string,
    videoConfig: StVideoConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    zIndex: number,
    currentSequenceId: string
  ) {
    this.id = videoConfig.id;
    this.currentSequenceId = currentSequenceId;
    this.name = videoConfig.name;
    this.path = path;
    this.hidden = false;
    this.layer = videoConfig.layer;
    this.currentZoom = 1.0;
    this.mousePath = videoConfig.mousePath;
    this.gridResolution = [20, 20]; // Default grid resolution
    this.dynamicAlpha = 0.01;
    this.numFramesDrawn = 0;

    // defaults
    this.sourceDuration = 0;
    this.sourceDurationMs = 0;
    this.sourceDimensions = [0, 0];
    this.sourceFrameRate = 0;
    this.dimensions = [0, 0];
    this.vertices = [];
    this.indices = new Uint32Array();

    const identityMatrix = mat4.create();
    let uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
    uniformBuffer.unmap();

    let pos = vec2.create();
    vec2.set(pos, videoConfig.position.x, videoConfig.position.y);
    let scl = vec2.create();
    vec2.set(scl, videoConfig.dimensions[0], videoConfig.dimensions[1]);
    this.transform = new Transform(
      pos,
      0.0,
      scl, // Apply scaling here instead of resizing image
      uniformBuffer
      // window_size,
    );

    // Placeholder for media initialization
    const mediaInfo = this.initializeMediaSource(path);

    if (mediaInfo) {
      const { duration, durationMs, width, height, frameRate } = mediaInfo;
      this.sourceDuration = duration;
      this.sourceDurationMs = durationMs;
      this.sourceDimensions = [width, height];
      this.sourceFrameRate = frameRate;

      const textureSize: GPUExtent3DStrict = {
        width: width,
        height: height,
        depthOrArrayLayers: 1,
      };

      this.texture = device.createTexture({
        label: "Video Texture",
        size: textureSize,
        mipLevelCount: 1,
        sampleCount: 1,
        dimension: "2d",
        format: "bgra8unorm", // Or appropriate format
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this.textureView = this.texture.createView();

      const sampler = device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        addressModeW: "clamp-to-edge",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
      }); // Sampler descriptor

      //   mat4.translate(this.transform, this.transform, [
      //     videoConfig.position.x,
      //     videoConfig.position.y,
      //     0,
      //   ]);
      //   mat4.scale(this.transform, this.transform, [
      //     videoConfig.dimensions[0],
      //     videoConfig.dimensions[1],
      //     1,
      //   ]);

      //   const uniformBuffer = device.createBuffer({
      //     label: "Video Uniform Buffer",
      //     size: 64,
      //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      //   });

      //   queue.writeBuffer(
      //     uniformBuffer,
      //     0,
      //     new Float32Array(this.transform as unknown as ArrayBuffer)
      //   );

      this.bindGroup = device.createBindGroup({
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
        ],
        label: "Video Bind Group",
      });

      const rows = this.gridResolution[0];
      const cols = this.gridResolution[1];

      this.vertices = [];
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          const posX = -0.5 + x / cols;
          const posY = -0.5 + y / rows;
          const texX = x / cols;
          const texY = y / rows;
          this.vertices.push({
            position: [posX, posY, 0.0],
            tex_coords: [texX, texY],
            color: [1.0, 1.0, 1.0, 1.0],
          });
        }
      }

      this.vertexBuffer = device.createBuffer({
        label: "Vertex Buffer",
        size: this.vertices.length * 4 * 10,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      queue.writeBuffer(
        this.vertexBuffer,
        0,
        new Float32Array(this.vertices.flat() as unknown as ArrayBuffer)
      );

      this.indices = new Uint32Array(
        (() => {
          const indices = [];
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const topLeft = y * (cols + 1) + x;
              const topRight = topLeft + 1;
              const bottomLeft = (y + 1) * (cols + 1) + x;
              const bottomRight = bottomLeft + 1;

              indices.push(
                bottomRight,
                bottomLeft,
                topRight,
                topRight,
                bottomLeft,
                topLeft
              );
            }
          }
          return indices;
        })()
      );

      this.indexBuffer = device.createBuffer({
        label: "Index Buffer",
        size: this.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });

      queue.writeBuffer(this.indexBuffer, 0, this.indices);

      this.dimensions = videoConfig.dimensions;

      let [group_bind_group, group_transform] = createEmptyGroupTransform(
        device,
        groupBindGroupLayout,
        windowSize
      );

      this.groupBindGroup = group_bind_group;
    }
  }

  // Placeholder functions (implement these based on your needs)
  initializeMediaSource(path: string): {
    duration: number;
    durationMs: number;
    width: number;
    height: number;
    frameRate: number;
  } | null {
    // Implement video source initialization and metadata retrieval.
    return {
      duration: 100,
      durationMs: 100000,
      width: 640,
      height: 480,
      frameRate: 30,
    }; // Replace with real data
  }

  drawVideoFrame(device: GPUDevice, queue: GPUQueue) {}

  updateOpacity(queue: GPUQueue, opacity: number): void {
    /* ... */
  }
  updateDataFromDimensions(
    windowSize: { width: number; height: number },
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    dimensions: [number, number]
  ): void {
    /* ... */
  }
  updateLayer(layerIndex: number): void {
    /* ... */
  }
  update(queue: GPUQueue, windowSize: { width: number; height: number }): void {
    /* ... */
  }
  getDimensions(): [number, number] {
    return [0, 0];
  }
  containsPoint(point: Point): boolean {
    return false;
  }
  toLocalSpace(worldPoint: Point): Point {
    return { x: 0, y: 0 };
  }
  toConfig(): StVideoConfig {
    return {
      id: "",
      name: "",
      path: "",
      mousePath: "",
      dimensions: [0, 0],
      position: { x: 0, y: 0 },
      layer: 0,
    };
  }
}
