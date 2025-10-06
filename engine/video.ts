import { mat4, vec2 } from "gl-matrix";
import { v4 as uuidv4 } from "uuid";
import { Point } from "./editor";
import { createEmptyGroupTransform, Transform } from "./transform";
import { getZLayer, Vertex } from "./vertex";
import {
  INTERNAL_LAYER_SPACE,
  SavedPoint,
  setupGradientBuffers,
} from "./polygon";
import MP4Box, { DataStream, MP4ArrayBuffer, MP4VideoTrack } from "mp4box";
import { WindowSize } from "./camera";
import { MotionPath } from "./motionpath";
import { ObjectType } from "./animations";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
  PolyfillTexture,
} from "./polyfill";

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
  // x: number;
  // y: number;
  point: [number, number, number]; // x, y, time
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
  borderRadius?: number;
  // mousePath: string;
}

export interface StVideoConfig {
  id: string;
  name: string;
  dimensions: [number, number]; // overrides actual image size
  position: Point;
  path: string;
  layer: number;
  borderRadius?: number;
  // mousePath: string;
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
  // frameData: Uint8ClampedArray;
  // bitmap: ImageBitmap;
  frame: VideoFrame;
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
  // texture!: GPUTexture;
  // textureView!: GPUTextureView;
  texture!: PolyfillTexture;
  transform!: Transform;
  vertexBuffer!: PolyfillBuffer;
  indexBuffer!: PolyfillBuffer;
  dimensions: [number, number];
  bindGroup!: PolyfillBindGroup;
  vertices: Vertex[];
  indices: Uint32Array;
  hidden: boolean;
  layer: number;
  groupBindGroup!: PolyfillBindGroup;
  groupTransform!: Transform;
  objectType: ObjectType;
  currentZoom: number;
  mousePath: MotionPath | undefined;
  // mousePositions: MousePosition[] | undefined;
  lastCenterPoint: Point | undefined;
  lastStartPoint: [number, number, number] | undefined; // x, y, time
  lastEndPoint: [number, number, number] | undefined;
  lastShiftTime: number | undefined;
  // sourceData: SourceData | null = null;
  gridResolution: [number, number];
  //   frameTimer: FrameTimer | undefined;
  dynamicAlpha: number;
  numFramesDrawn: number;
  objectTypeShader: number = 3;

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
  borderRadius: number;
  gradientBuffer!: PolyfillBuffer;
  // gradientBindGroup: PolyfillBindGroup;

  constructor(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    blob: Blob,
    videoConfig: StVideoConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    // gradientBindGroupLayout: PolyfillBindGroupLayout,
    zIndex: number,
    currentSequenceId: string,
    loadedHidden: boolean,
    objectTypeShader: number = 3
  ) {
    this.id = videoConfig.id;
    this.currentSequenceId = currentSequenceId;
    this.name = videoConfig.name;
    this.path = videoConfig.path;
    // this.blob = blob;
    this.hidden = true;
    this.layer = videoConfig.layer;
    this.currentZoom = 1.0;
    // this.mousePath = videoConfig.mousePath;
    this.gridResolution = [20, 20]; // Default grid resolution
    this.dynamicAlpha = 0.01;
    this.numFramesDrawn = 0;
    this.objectType = ObjectType.VideoItem;
    this.borderRadius = videoConfig.borderRadius ?? 0.0;
    this.objectTypeShader = objectTypeShader;

    // defaults
    this.sourceDuration = 0;
    this.sourceDurationMs = 0;
    this.sourceDimensions = [0, 0];
    this.sourceFrameRate = 0;
    this.dimensions = [0, 0];
    this.vertices = [];
    this.indices = new Uint32Array();
  }

  async initialize(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    blob: Blob,
    videoConfig: StVideoConfig,
    windowSize: { width: number; height: number },
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    // gradientBindGroupLayout: PolyfillBindGroupLayout,
    zIndex: number,
    currentSequenceId: string,
    loadedHidden: boolean
  ) {
    this.dimensions = videoConfig.dimensions;

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
      // vec2.fromValues(videoConfig.position.x, videoConfig.position.y),
      vec2.fromValues(0, 0),
      0.0,
      // vec2.fromValues(videoConfig.dimensions[0], videoConfig.dimensions[1]), // Apply scaling here instead of resizing image
      vec2.fromValues(1, 1), // testing
      uniformBuffer
      // window_size,
    );

    // let layer_index =
    //   -1.0 - getZLayer(videoConfig.layer - INTERNAL_LAYER_SPACE);
    let layer_index = getZLayer(videoConfig.layer);
    this.transform.layer = layer_index;

    this.transform.updateUniformBuffer(queue, windowSize);

    let [gradient, gradientBuffer] = setupGradientBuffers(
      device,
      queue,
      null,
      this.borderRadius
      // gradientBindGroupLayout
    );
    this.gradientBuffer = gradientBuffer;

    // this.gradientBindGroup = gradientBindGroup;

    let [group_bind_group, group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      windowSize
    );

    // console.info("position", videoConfig.position);

    let setPosition = {
      // x: 1.5,
      // y: 1.5,
      x: videoConfig.position.x,
      y: videoConfig.position.y,
    };

    group_transform.updatePosition([setPosition.x, setPosition.y], windowSize);

    // group_transform.updateRotationYDegrees(0.02);

    group_transform.updateUniformBuffer(queue, windowSize);

    this.groupBindGroup = group_bind_group;
    this.groupTransform = group_transform;

    if (process.env.NODE_ENV !== "test") {
      const mediaInfo = await this.initializeMediaSource(blob);

      if (mediaInfo) {
        const { duration, durationMs, width, height, frameRate } = mediaInfo;

        console.info("media info", mediaInfo);

        this.sourceDuration = duration;
        this.sourceDurationMs = durationMs;
        this.sourceDimensions = [width, height];
        this.sourceFrameRate = frameRate;
        this.bytesPerFrame = width * 4 * height;

        // const textureSize: GPUExtent3DStrict = {
        const textureSize = {
          width: width,
          height: height,
          depthOrArrayLayers: 1,
        };

        console.info("video texture", textureSize);

        this.texture = device.createTexture({
          label: "Video Texture",
          size: textureSize,
          // mipLevelCount: 1,
          // sampleCount: 1,
          // dimension: "2d",
          // format: "bgra8unorm", // Or appropriate format
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        // this.textureView = this.texture.createView();

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
          // label: "Video Bind Group",
        });

        // uniformBuffer.unmap();
        // this.transform.updateUniformBuffer(queue, windowSize);
        // group_transform.updateUniformBuffer(queue, windowSize);

        // // 20x20 grid
        const rows = this.gridResolution[0];
        const cols = this.gridResolution[1];

        // Calculate cover texture coordinates
        const { u0, u1, v0, v1 } = this.calculateCoverTextureCoordinates(
          this.dimensions[0],
          this.dimensions[1],
          this.sourceDimensions[0],
          this.sourceDimensions[1]
        );

        this.vertices = [];
        for (let y = 0; y <= rows; y++) {
          for (let x = 0; x <= cols; x++) {
            // Keep your original position calculation
            // const posX = -0.5 + x / cols;
            // const posY = -0.5 + y / rows;

            // Center the position by offsetting by half dimensions
            const posX =
              -videoConfig.dimensions[0] / 2 +
              videoConfig.dimensions[0] * (x / cols);
            const posY =
              -videoConfig.dimensions[1] / 2 +
              videoConfig.dimensions[1] * (y / rows);

            // Map texture coordinates to properly implement cover
            const percentX = x / cols; // 0 to 1 across the grid
            const percentY = y / rows; // 0 to 1 across the grid

            // Apply the cover bounds to the texture coordinates
            const texX = u0 + (u1 - u0) * percentX;
            const texY = v0 + (v1 - v0) * percentY;

            const normalizedX =
              (posX - this.transform.position[0]) / this.dimensions[0];
            const normalizedY =
              (posY - this.transform.position[1]) / this.dimensions[1];

            this.vertices.push({
              position: [posX, posY, 0.0],
              tex_coords: [texX, texY],
              color: [1.0, 1.0, 1.0, 1.0],
              gradient_coords: [normalizedX, normalizedY],
              object_type: this.objectTypeShader, // OBJECT_TYPE_VIDEO
            });
          }
        }

        // this.implementCoverEffect(
        //   this.sourceDimensions[0],
        //   this.sourceDimensions[1]
        // );

        // this.vertices = [];
        // for (let y = 0; y <= rows; y++) {
        //   for (let x = 0; x <= cols; x++) {
        //     const posX = -0.5 + x / cols;
        //     const posY = -0.5 + y / rows;
        //     const texX = x / cols;
        //     const texY = y / rows;

        //     const normalizedX =
        //       (posX - this.transform.position[0]) / this.dimensions[0];
        //     const normalizedY =
        //       (posY - this.transform.position[1]) / this.dimensions[1];

        //     this.vertices.push({
        //       position: [posX, posY, 0.0],
        //       tex_coords: [texX, texY],
        //       color: [1.0, 1.0, 1.0, 1.0],
        //       gradient_coords: [normalizedX, normalizedY],
        //       object_type: 3, // OBJECT_TYPE_VIDEO
        //     });
        //   }
        // }

        console.info("video vertices", this.vertices);

        this.vertexBuffer = device.createBuffer(
          {
            label: "Vertex Buffer",
            size: this.vertices.length * 4 * 16,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
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

        this.indexBuffer = device.createBuffer(
          {
            label: "Index Buffer",
            size: this.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
          },
          ""
        );

        queue.writeBuffer(this.indexBuffer, 0, this.indices);

        // this.initializeDecoder().then(() => {
        //   // draw initial preview frame
        //   this.drawVideoFrame(device, queue).catch(console.error); // Handle potential errors
        // });

        console.info("prep to decode video");

        try {
          await this.initializeDecoder();
        } catch (error) {
          console.error("Error initializing video decoder:", error);
          throw new Error("Failed to initialize video decoder");
        }

        console.info("prep to draw video frame");

        try {
          await this.drawVideoFrame(device, queue);
        } catch (error) {
          console.error("Error drawing video frame:", error);
          throw new Error("Failed to draw video frame");
        }

        this.hidden = loadedHidden;

        console.info("video loaded");
      }
    }
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

  // implementCoverEffect(videoWidth: number, videoHeight: number) {
  //   const rows = this.gridResolution[0];
  //   const cols = this.gridResolution[1];

  //   // Calculate aspect ratios
  //   const videoAspect = videoWidth / videoHeight;
  //   const gridAspect = this.dimensions[0] / this.dimensions[1];

  //   // Determine scaling factor to cover the grid
  //   let scaleX, scaleY;
  //   if (videoAspect > gridAspect) {
  //     // Video is wider than grid - scale based on height
  //     scaleY = 1.0;
  //     scaleX = videoAspect / gridAspect;
  //   } else {
  //     // Video is taller than grid - scale based on width
  //     scaleX = 1.0;
  //     scaleY = gridAspect / videoAspect;
  //   }

  //   console.info(
  //     "scales",
  //     scaleX,
  //     scaleY,
  //     gridAspect,
  //     videoAspect,
  //     this.dimensions[0],
  //     this.dimensions[1]
  //   );

  //   this.vertices = [];
  //   for (let y = 0; y <= rows; y++) {
  //     for (let x = 0; x <= cols; x++) {
  //       // Position coordinates remain the same
  //       const posX = -0.5 + x / cols;
  //       const posY = -0.5 + y / rows;

  //       // Modified texture coordinates for cover effect
  //       // Center the texture and apply scaling
  //       const texX = (x / cols - 0.5) * scaleX + 0.5;
  //       const texY = (y / rows - 0.5) * scaleY + 0.5;

  //       // console.info("tex coords", texX, texY);

  //       const normalizedX =
  //         (posX - this.transform.position[0]) / this.dimensions[0];
  //       const normalizedY =
  //         (posY - this.transform.position[1]) / this.dimensions[1];

  //       this.vertices.push({
  //         position: [posX, posY, 0.0],
  //         tex_coords: [texX, texY],
  //         color: [1.0, 1.0, 1.0, 1.0],
  //         gradient_coords: [normalizedX, normalizedY],
  //         object_type: 3, // OBJECT_TYPE_VIDEO
  //       });
  //     }
  //   }
  // }

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

          console.info("track length ", info.videoTracks.length);

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

            // const durationInSeconds = videoTrack.duration / 1000;
            // const durationMs = videoTrack.duration;
            // const frameRate = samples.length / durationInSeconds;

            const durationInSeconds = info.duration / info.timescale;
            const durationMs = durationInSeconds * 1000;
            const frameRate = samples.length / durationInSeconds;

            console.info(
              "samples ",
              samples.length,
              "info ",
              info.duration,
              info.timescale,
              "track: ",
              videoTrack.duration,
              videoTrack.timescale,
              "rate: ",
              frameRate,
              durationInSeconds
            );

            this.videoMetadata = {
              duration: durationInSeconds,
              durationMs: durationMs,
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

        console.info("append buffer");

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
      console.warn("Video decoder already initialized");
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
              console.error("No bytesPerFrame set");
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

            // needed for webgpu?
            // const frameData = new Uint8ClampedArray(this.bytesPerFrame);
            // const options: VideoFrameCopyToOptions = {
            //   colorSpace: "srgb",
            //   format: "RGBA",
            // };
            // await frame.copyTo(frameData, options);

            // hmmm?
            // const bitmap = await createImageBitmap(frame);

            const frameInfo: DecodedFrameInfo = {
              timestamp: frame.timestamp,
              duration: frame.duration || 0,
              // frameData,
              // bitmap,
              frame,
              width: frame.displayWidth,
              height: frame.displayHeight,
            };

            // console.info("this.frameCallback", this.frameCallback);

            // console.info(
            //   "frameInfo",
            //   frameInfo.width,
            //   frameInfo.height,
            //   frameInfo.frame.displayWidth,
            //   frameInfo.frame.displayHeight
            // );

            this.frameCallback?.(frameInfo);
            // frame.close();
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
        // optimizeForLatency: true,
        // hardwareAcceleration: "prefer-hardware",
        // testing settings for taller videos...
        optimizeForLatency: true,
        hardwareAcceleration: "no-preference",
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
    // console.info("decodeNextFrame 1");

    if (!this.isInitialized || this.currentSampleIndex >= this.samples.length) {
      throw new Error("No more frames to decode");
    }

    return new Promise((resolve, reject) => {
      // console.info("decodeNextFrame 2");

      this.frameCallback = (frameInfo: DecodedFrameInfo) => {
        // console.info("decodeNextFrame 3");

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

      // console.info("chunk decoded", sample.data.length);

      this.currentSampleIndex++;
    });
  }

  async drawVideoFrame(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    timeMs?: number
  ) {
    if (timeMs !== undefined) {
      await this.seekToTime(timeMs);
    }

    // console.info("calling decodeNextFrame", this.currentSampleIndex);

    const frameInfo = await this.decodeNextFrame();

    // console.info(
    //   "frame info",
    //   frameInfo.width,
    //   frameInfo.height,
    //   frameInfo.frame.displayWidth,
    //   frameInfo.frame.displayHeight
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

    // console.info("frameInfo", frameInfo);

    // Update WebGPU texture
    queue.writeTexture(
      {
        texture: this.texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 },
        // aspect: "all",
      },
      // frameInfo.frameData,
      frameInfo.frame,
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

    // console.info("close frame");

    frameInfo.frame.close();

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

  updateOpacity(queue: PolyfillQueue, opacity: number): void {
    const newColor: [number, number, number, number] = [1.0, 1.0, 1.0, opacity];

    this.vertices.forEach((v) => {
      v.color = newColor;
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

  update(
    queue: PolyfillQueue,
    windowSize: { width: number; height: number }
  ): void {
    /* ... */
  }

  getDimensions(): [number, number] {
    return [0, 0];
  }

  updateDataFromDimensions(
    windowSize: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    dimensions: [number, number]
  ): void {
    console.info("updateDataFromDimensions", dimensions);
    this.dimensions = [dimensions[0], dimensions[1]];
    // this.transform.updateScale([dimensions[0], dimensions[1]]); // old scale way with webgpu

    this.transform.updateUniformBuffer(queue, windowSize);

    const rows = this.gridResolution[0];
    const cols = this.gridResolution[1];

    // Calculate cover texture coordinates
    const { u0, u1, v0, v1 } = this.calculateCoverTextureCoordinates(
      this.dimensions[0],
      this.dimensions[1],
      this.sourceDimensions[0],
      this.sourceDimensions[1]
    );

    let n = 0;
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        // Center the position by offsetting by half dimensions
        const posX = -this.dimensions[0] / 2 + this.dimensions[0] * (x / cols);
        const posY = -this.dimensions[1] / 2 + this.dimensions[1] * (y / rows);

        // Map texture coordinates to properly implement cover
        const percentX = x / cols; // 0 to 1 across the grid
        const percentY = y / rows; // 0 to 1 across the grid
        // Apply the cover bounds to the texture coordinates
        const texX = u0 + (u1 - u0) * percentX;
        const texY = v0 + (v1 - v0) * percentY;

        this.vertices[n].position = [posX, posY, 0];
        this.vertices[n].tex_coords = [texX, texY];

        n++;
      }
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
  }

  updateLayer(layerIndex: number): void {
    // let layer = layerIndex - INTERNAL_LAYER_SPACE;
    // let layer_index = -1.0 - getZLayer(layerIndex - INTERNAL_LAYER_SPACE);
    let layer_index = getZLayer(layerIndex);
    this.layer = layer_index;
    this.transform.layer = layer_index;
  }

  updateZoom(queue: PolyfillQueue, newZoom: number, centerPoint: Point): void {
    // console.info("updateZoom", newZoom, centerPoint);

    this.currentZoom = newZoom;
    const [videoWidth, videoHeight] = [this.dimensions[0], this.dimensions[1]];

    const uvCenterX = centerPoint.x / videoWidth;
    const uvCenterY = centerPoint.y / videoHeight;

    const halfWidth = 0.5 / newZoom;
    const halfHeight = 0.5 / newZoom;

    let uvMinX = uvCenterX - halfWidth;
    let uvMaxX = uvCenterX + halfWidth;
    let uvMinY = uvCenterY - halfHeight;
    let uvMaxY = uvCenterY + halfHeight;

    // console.info(
    //   "pre clamp uv",
    //   uvCenterX,
    //   uvCenterY,
    //   uvMinX,
    //   uvMinY,
    //   uvMaxX,
    //   uvMaxY
    // );

    // Check for clamping and adjust other UVs accordingly to prevent warping
    if (uvMinX < 0.0) {
      const diff = -uvMinX;
      uvMinX = 0.0;
      uvMaxX = Math.min(uvMaxX + diff, 1.0); // Clamp maxX as well
    } else if (uvMaxX > 1.0) {
      const diff = uvMaxX - 1.0;
      uvMaxX = 1.0;
      uvMinX = Math.max(uvMinX - diff, 0.0); // Clamp minX
    }

    if (uvMinY < 0.0) {
      const diff = -uvMinY;
      uvMinY = 0.0;
      uvMaxY = Math.min(uvMaxY + diff, 1.0); // Clamp maxY
    } else if (uvMaxY > 1.0) {
      const diff = uvMaxY - 1.0;
      uvMaxY = 1.0;
      uvMinY = Math.max(uvMinY - diff, 0.0); // Clamp minY
    }

    const [rows, cols] = this.gridResolution;

    // Update UV coordinates for each vertex in place
    for (let y = 0; y <= rows; y++) {
      const vRatio = y / rows;
      const uvY = uvMinY + (uvMaxY - uvMinY) * vRatio;

      for (let x = 0; x <= cols; x++) {
        const uRatio = x / cols;
        const uvX = uvMinX + (uvMaxX - uvMinX) * uRatio;

        const vertexIndex = y * (cols + 1) + x;
        this.vertices[vertexIndex].tex_coords = [uvX, uvY];
      }
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
  }

  updatePopout(
    queue: PolyfillQueue,
    mousePoint: Point,
    popoutIntensity: number,
    popoutDimensions: [number, number]
  ): void {
    const [videoWidth, videoHeight] = [this.dimensions[0], this.dimensions[1]];

    const uvMouseX = mousePoint.x / videoWidth;
    const uvMouseY = mousePoint.y / videoHeight;

    const radiusX = popoutDimensions[0] / (2.0 * videoWidth);
    const radiusY = popoutDimensions[1] / (2.0 * videoHeight);

    // Create new array of vertices to modify
    const newVertices = this.vertices.map((vertex) => {
      const dx = vertex.tex_coords[0] - uvMouseX;
      const dy = vertex.tex_coords[1] - uvMouseY;

      // Check if the vertex is within the popout area
      if (Math.abs(dx) <= radiusX && Math.abs(dy) <= radiusY) {
        // Normalize the coordinates to the popout area
        const normalizedX = dx / radiusX;
        const normalizedY = dy / radiusY;

        // Apply the zoom effect by scaling the texture coordinates
        const newX = uvMouseX + (normalizedX * radiusX) / popoutIntensity;
        const newY = uvMouseY + (normalizedY * radiusY) / popoutIntensity;

        // Clamp the texture coordinates to avoid going out of bounds
        return {
          ...vertex,
          texCoords: [
            Math.max(0.0, Math.min(1.0, newX)),
            Math.max(0.0, Math.min(1.0, newY)),
          ] as [number, number],
        };
      }
      return vertex;
    });

    // Update the vertices in the video item
    this.vertices = newVertices;

    // Write to GPU buffer
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

  containsPoint(point: Point): boolean {
    // const untranslated: Point = {
    //   x: point.x - this.transform.position[0], // Access translation from matrix
    //   y: point.y - this.transform.position[1],
    // };

    const untranslated: Point = {
      x: point.x - this.groupTransform.position[0], // Access translation from matrix
      y: point.y - this.groupTransform.position[1],
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
      // mousePath: this.mousePath || "",
      dimensions: this.dimensions,
      position: {
        x: this.groupTransform.position[0],
        y: this.groupTransform.position[1],
      },
      layer: this.layer,
      borderRadius: this.borderRadius,
    };
  }
}
