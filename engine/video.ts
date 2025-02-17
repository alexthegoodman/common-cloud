import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";
import { Point } from "./editor";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Vertex } from "./vertex";
import { SavedPoint } from "./polygon";
import MP4Box, { MP4ArrayBuffer } from "mp4box";

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

interface VideoMetadata {
  duration: number;
  durationMs: number;
  width: number;
  height: number;
  frameRate: number;
  trackId?: number;
  timescale: number;
}

interface DecodedFrameInfo {
  timestamp: number;
  duration: number;
  frameData: Uint8Array;
  width: number;
  height: number;
}

export class StVideo {
  id: string;
  currentSequenceId: string;
  name: string;
  path: string;
  // blob: Blob;
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

  private videoDecoder?: VideoDecoder;
  private mp4File?: MP4Box.MP4File;
  private sourceBuffer?: MP4ArrayBuffer;
  private videoMetadata?: VideoMetadata;
  private isInitialized: boolean = false;
  private samples: MP4Box.MP4Sample[] = [];
  private currentSampleIndex: number = 0;
  private decodingPromise?: Promise<DecodedFrameInfo>;
  private frameCallback?: (frame: DecodedFrameInfo) => void;

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    blob: Blob,
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
    this.path = videoConfig.path;
    // this.blob = blob;
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

    this.transform = new Transform(
      vec2.fromValues(videoConfig.position.x, videoConfig.position.y),
      0.0,
      vec2.fromValues(videoConfig.dimensions[0], videoConfig.dimensions[1]), // Apply scaling here instead of resizing image
      uniformBuffer
      // window_size,
    );

    // Placeholder for media initialization
    this.initializeMediaSource(blob).then((mediaInfo) => {
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
        });

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
          new Float32Array(
            this.vertices.flatMap((v) => [
              ...v.position,
              ...v.tex_coords,
              ...v.color,
            ])
          )
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
    });
  }

  async initializeMediaSource(blob: Blob): Promise<VideoMetadata | null> {
    try {
      // Convert blob to ArrayBuffer
      this.sourceBuffer = (await blob.arrayBuffer()) as MP4ArrayBuffer;

      // Initialize MP4Box
      this.mp4File = MP4Box.createFile();

      return new Promise((resolve, reject) => {
        if (!this.mp4File) {
          reject(new Error("MP4Box not initialized"));
          return;
        }

        this.mp4File.onError = (error: string) => {
          reject(new Error(`MP4Box error: ${error}`));
        };

        // Handle MP4 parsing completion
        this.mp4File.onReady = (info: MP4Box.MP4Info) => {
          const videoTrack = info.videoTracks[0];

          if (!videoTrack) {
            reject(new Error("No video track found in the file"));
            return;
          }

          // Extract all samples to calculate actual FPS
          this.mp4File!.setExtractionOptions(videoTrack.id, null, {
            nbSamples: Infinity,
          });

          this.mp4File!.onSamples = (
            track_id: number,
            user: any,
            samples: MP4Box.MP4Sample[]
          ) => {
            this.samples = samples;

            // Calculate FPS from sample count and duration
            const durationInSeconds =
              videoTrack.duration / videoTrack.timescale;
            const frameRate = samples.length / durationInSeconds;

            this.videoMetadata = {
              duration: info.duration,
              durationMs: info.duration * 1000,
              width: videoTrack.video.width,
              height: videoTrack.video.height,
              frameRate: frameRate,
              trackId: videoTrack.id,
              timescale: videoTrack.timescale,
            };

            this.isInitialized = true;
            resolve(this.videoMetadata);
          };

          this.mp4File!.start();
        };

        // Process the file
        const chunk = this.sourceBuffer;
        if (chunk) {
          this.mp4File.appendBuffer(chunk);
        }
      });
    } catch (error) {
      console.error("Error initializing media source:", error);
      this.isInitialized = false;
      return null;
    }
  }

  private async initializeDecoder(): Promise<void> {
    if (this.videoDecoder) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.videoDecoder = new VideoDecoder({
        output: async (frame: VideoFrame) => {
          try {
            const frameData = new Uint8Array(frame.allocationSize());
            await frame.copyTo(frameData);

            const frameInfo: DecodedFrameInfo = {
              timestamp: frame.timestamp,
              duration: frame.duration || 0,
              frameData,
              width: frame.displayWidth,
              height: frame.displayHeight,
            };

            this.frameCallback?.(frameInfo);
            frame.close();
          } catch (error) {
            console.error("Error processing frame:", error);
            frame.close();
          }
        },
        error: (error: DOMException) => {
          console.error("VideoDecoder error:", error);
          reject(error);
        },
      });

      resolve();
    });
  }

  async seekToTime(timeMs: number): Promise<void> {
    if (!this.isInitialized || !this.samples.length) {
      throw new Error("Video not initialized");
    }

    const timescale = this.videoMetadata!.timescale;
    const timeInTimescale = (timeMs / 1000) * timescale;

    // Find the nearest keyframe before the desired time
    let targetIndex = 0;
    for (let i = 0; i < this.samples.length; i++) {
      if (this.samples[i].cts > timeInTimescale) {
        break;
      }
      if (this.samples[i].is_sync) {
        targetIndex = i;
      }
    }

    this.currentSampleIndex = targetIndex;
  }

  async decodeNextFrame(): Promise<DecodedFrameInfo> {
    if (!this.isInitialized || this.currentSampleIndex >= this.samples.length) {
      throw new Error("No more frames to decode");
    }

    await this.initializeDecoder();

    return new Promise((resolve, reject) => {
      this.frameCallback = (frameInfo: DecodedFrameInfo) => {
        this.frameCallback = undefined;
        resolve(frameInfo);
      };

      const sample = this.samples[this.currentSampleIndex];
      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data,
      });

      this.videoDecoder!.decode(chunk);
      this.currentSampleIndex++;
    });
  }

  async drawVideoFrame(device: GPUDevice, queue: GPUQueue, timeMs?: number) {
    if (timeMs !== undefined) {
      await this.seekToTime(timeMs);
    }

    const frameInfo = await this.decodeNextFrame();

    // Update WebGPU texture
    queue.writeTexture(
      { texture: this.texture },
      frameInfo.frameData,
      {
        bytesPerRow: frameInfo.width * 4,
        rowsPerImage: frameInfo.height,
      },
      {
        width: frameInfo.width,
        height: frameInfo.height,
        depthOrArrayLayers: 1,
      }
    );

    return frameInfo;
  }

  getCurrentTime(): number {
    if (!this.samples[this.currentSampleIndex]) {
      return 0;
    }
    return (
      (this.samples[this.currentSampleIndex].cts /
        this.videoMetadata!.timescale) *
      1000
    );
  }

  getTotalFrames(): number {
    return this.samples.length;
  }

  getCurrentFrame(): number {
    return this.currentSampleIndex;
  }

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
