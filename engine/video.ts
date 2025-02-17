import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";
import { Point } from "./editor";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Vertex } from "./vertex";
import { INTERNAL_LAYER_SPACE, SavedPoint } from "./polygon";
import MP4Box, { DataStream, MP4ArrayBuffer, MP4VideoTrack } from "mp4box";
import { WindowSize } from "./camera";

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
  codecs: string;
  description?: Uint8Array;
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
  sourceData: SourceData | null = null;
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
  private codecString?: string;

  bytesPerFrame: number | null = null;

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
    this.hidden = true;
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

    this.transform.layer = videoConfig.layer - INTERNAL_LAYER_SPACE;
    this.transform.updateUniformBuffer(queue, windowSize);

    // Placeholder for media initialization
    this.initializeMediaSource(blob).then((mediaInfo) => {
      if (mediaInfo) {
        const { duration, durationMs, width, height, frameRate } = mediaInfo;

        console.info("media info", mediaInfo);

        this.sourceDuration = duration;
        this.sourceDurationMs = durationMs;
        this.sourceDimensions = [width, height];
        this.sourceFrameRate = frameRate;
        this.bytesPerFrame = width * 4 * height;

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
          // format: "bgra8unorm", // Or appropriate format
          format: "rgba8unorm",
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

        // // console.info("vertices", this.vertices);

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

        this.initializeDecoder().then(() => {
          // draw initial preview frame
          this.drawVideoFrame(device, queue).catch(console.error); // Handle potential errors
        });
      }
    });
  }

  private avcDecoderConfig?: Uint8Array;

  description(track: MP4VideoTrack) {
    if (!this.mp4File) {
      return;
    }

    const trak = this.mp4File.getTrackById(track.id);

    if (
      !trak.mdia ||
      !trak.mdia.minf ||
      !trak.mdia.minf.stbl ||
      !trak.mdia.minf.stbl.stsd
    ) {
      return;
    }

    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC;
      // || entry.vpcC || entry.av1C;
      if (box) {
        // console.info("prepare box!");
        const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8); // Remove the box header.
      }
    }
    throw new Error("avcC, hvcC, vpcC, or av1C box not found");
  }

  async initializeMediaSource(blob: Blob): Promise<VideoMetadata | null> {
    try {
      this.sourceBuffer = (await blob.arrayBuffer()) as MP4ArrayBuffer;
      this.sourceBuffer.fileStart = 0;
      this.mp4File = MP4Box.createFile();

      return new Promise((resolve, reject) => {
        if (!this.mp4File) {
          reject(new Error("MP4Box not initialized"));
          return;
        }

        this.mp4File.onError = (error: string) => {
          reject(new Error(`MP4Box error: ${error}`));
        };

        this.mp4File.onReady = (info: MP4Box.MP4Info) => {
          const videoTrack = info.videoTracks[0];

          if (!videoTrack) {
            reject(new Error("No video track found in the file"));
            return;
          }

          // Store codec string for decoder configuration
          this.codecString = videoTrack.codec;

          this.avcDecoderConfig = this.description(videoTrack);

          console.log("Codec string:", videoTrack.codec);
          console.log("avcC length:", this.avcDecoderConfig?.length);
          if (this.avcDecoderConfig) {
            const firstFewBytes = Array.from(this.avcDecoderConfig.slice(0, 10))
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join("");
            console.log("First few bytes of avcC:", firstFewBytes);
          }

          this.mp4File!.setExtractionOptions(videoTrack.id, null, {
            nbSamples: Infinity,
          });

          this.mp4File!.onSamples = (
            track_id: number,
            user: any,
            samples: MP4Box.MP4Sample[]
          ) => {
            // console.info("onSamples");

            this.samples = samples;

            // console.info("original duration", videoTrack.duration);

            const durationInSeconds =
              videoTrack.duration / videoTrack.timescale;
            const frameRate = samples.length / durationInSeconds;
            let actualDurationInSeconds = durationInSeconds / frameRate;

            // console.info("frameRate", frameRate, durationInSeconds);

            this.videoMetadata = {
              duration: durationInSeconds,
              durationMs: durationInSeconds * 1000,
              width: videoTrack.video.width,
              height: videoTrack.video.height,
              frameRate: frameRate,
              trackId: videoTrack.id,
              timescale: videoTrack.timescale,
              codecs: videoTrack.codec,
              description: this.avcDecoderConfig,
            };

            this.isInitialized = true;
            resolve(this.videoMetadata);
          };

          this.mp4File!.start();
        };

        // (this.mp4File as any).fileStart = 0;
        if (!this.sourceBuffer) {
          return;
        }

        this.mp4File.appendBuffer(this.sourceBuffer);
      });
    } catch (error) {
      console.error("Error initializing media source:", error);
      this.isInitialized = false;
      return null;
    }
  }

  private async initializeDecoder(): Promise<void> {
    // console.info("initializeDecoder");

    if (this.videoDecoder) {
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.codecString || !this.videoMetadata) {
        throw new Error("Codec information not available");
      }

      this.videoDecoder = new VideoDecoder({
        output: async (frame: VideoFrame) => {
          try {
            if (!this.bytesPerFrame) {
              throw new Error("No bytesPerFrame");
            }

            // console.info(
            //   "decoder output",
            //   this.bytesPerFrame,
            //   frame.allocationSize(),
            //   frame.codedWidth,
            //   frame.displayWidth,
            //   frame.colorSpace
            // );

            const frameData = new Uint8Array(this.bytesPerFrame);
            const options: VideoFrameCopyToOptions = {
              colorSpace: "srgb",
              format: "RGBA",
            };
            await frame.copyTo(frameData, options);

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

      // Configure the decoder with the codec information and AVC configuration
      // const colorSpace: VideoColorSpaceInit = {
      //   fullRange: false,
      //   matrix: "rgb",
      //   // primaries?: VideoColorPrimaries | null;
      //   // transfer?: VideoTransferCharacteristics | null;
      //   primaries: "bt709",
      //   transfer: "iec61966-2-1",
      // };

      // let test  = new VideoColorSpace(colorSpace);

      const config: VideoDecoderConfig = {
        codec: this.codecString,
        optimizeForLatency: true,
        hardwareAcceleration: "prefer-hardware",
        // colorSpace: colorSpace,

        // Add description for AVC/H.264
        description: this.avcDecoderConfig,
      };

      this.videoDecoder.configure(config);

      // console.info("decoder configured");

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
    // console.info("decodeNextFrame");

    if (!this.isInitialized || this.currentSampleIndex >= this.samples.length) {
      throw new Error("No more frames to decode");
    }

    return new Promise((resolve, reject) => {
      this.frameCallback = (frameInfo: DecodedFrameInfo) => {
        this.frameCallback = undefined;
        resolve(frameInfo);
      };

      let sample = this.samples[this.currentSampleIndex];

      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data,
      });

      // console.log(
      //   "EncodedVideoChunk:",
      //   chunk.type,
      //   chunk.timestamp,
      //   chunk.duration,
      //   chunk.byteLength
      // );

      // console.info(
      //   "decode chunk",
      //   this.samples.length,
      //   chunk.type,
      //   this.currentSampleIndex,
      //   sample.is_sync
      // );

      this.videoDecoder!.decode(chunk);

      // console.info("chunk decoded");

      this.currentSampleIndex++;
    });
  }

  async drawVideoFrame(device: GPUDevice, queue: GPUQueue, timeMs?: number) {
    if (timeMs !== undefined) {
      await this.seekToTime(timeMs);
    }

    const frameInfo = await this.decodeNextFrame();

    // console.info(
    //   "write texture!",
    //   frameInfo.width,
    //   frameInfo.height,
    //   frameInfo.frameData.length,
    //   frameInfo.frameData.slice(0, 1000)
    // );

    // this.bindGroup = device.createBindGroup({
    //   layout: this.bindGroupLayout,
    //   entries: [
    //     {
    //       binding: 0,
    //       resource: {
    //         buffer: this.uniformBuffer,
    //       },
    //     },
    //     {
    //       binding: 1,
    //       resource: device.importExternalTexture({ source: frameInfo.frame }),
    //     },
    //     { binding: 2, resource: this.sampler },
    //   ],
    //   label: "Video Bind Group",
    // });

    // Update WebGPU texture
    queue.writeTexture(
      {
        texture: this.texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 },
        aspect: "all",
      },
      frameInfo.frameData,
      {
        offset: 0,
        bytesPerRow: frameInfo.width * 4,
        rowsPerImage: frameInfo.height,
      },
      {
        width: frameInfo.width,
        height: frameInfo.height,
        depthOrArrayLayers: 1,
      }
    );

    // console.info("texture write succesful");
    // console.log("Texture format:", this.texture.format); // Log texture format

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

  resetPlayback() {
    this.currentSampleIndex = 0;
    this.numFramesDrawn = 0;
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

  update(queue: GPUQueue, windowSize: { width: number; height: number }): void {
    /* ... */
  }

  getDimensions(): [number, number] {
    return [0, 0];
  }

  updateDataFromDimensions(
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    dimensions: [number, number]
  ): void {
    console.info("updateDataFromDimensions", dimensions);
    this.dimensions = [dimensions[0], dimensions[1]];
    this.transform.updateScale([dimensions[0], dimensions[1]]);
    this.transform.updateUniformBuffer(queue, windowSize);
  }

  updateLayer(layerIndex: number): void {
    let layer = layerIndex - INTERNAL_LAYER_SPACE;
    this.layer = layer;
    this.transform.layer = layer;
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
    return { x: 0, y: 0 };
  }

  toConfig(): StVideoConfig {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      mousePath: this.mousePath || "",
      dimensions: this.dimensions,
      position: {
        x: this.transform.position[0],
        y: this.transform.position[1],
      },
      layer: this.layer,
    };
  }
}
