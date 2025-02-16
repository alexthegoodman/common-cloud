const NUM_INFERENCE_FEATURES: number = 7;
export const CANVAS_HORIZ_OFFSET: number = 0.0;
export const CANVAS_VERT_OFFSET: number = 0.0;

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export class Viewport {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  toNdc(x: number, y: number): [number, number] {
    const ndcX = (x / this.width) * 2.0 - 1.0;
    const ndcY = -((y / this.height) * 2.0 - 1.0); // Flip Y-axis
    return [ndcX, ndcY];
  }

  clone(): Viewport {
    return new Viewport(this.width, this.height);
  }
}

// Assuming windowSize is defined elsewhere
export interface windowSize {
  width: number;
  height: number;
}

// Assuming Point is defined elsewhere
export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  min: Point;
  max: Point;
}

export function sizeToNormal(
  windowSize: WindowSize,
  x: number,
  y: number
): [number, number] {
  const ndcX = x / windowSize.width;
  const ndcY = y / windowSize.height;

  return [ndcX, ndcY];
}

export function pointToNdc(point: Point, windowSize: WindowSize) {
  const aspectRatio = windowSize.width / windowSize.height;

  return {
    x: (point.x / windowSize.width) * 2.0 - 1.0,
    y: 1.0 - (point.y / windowSize.height) * 2.0,
  };
}

export function rgbToWgpu(
  r: number,
  g: number,
  b: number,
  a: number
): [number, number, number, number] {
  return [r / 255.0, g / 255.0, b / 255.0, a / 255.0];
}

export function colorToWgpu(c: number): number {
  return c / 255.0;
}

export function wgpuToHuman(c: number): number {
  return c * 255.0;
}

export function stringToF32(s: string): number {
  const trimmed = s.trim();

  if (trimmed.length === 0) {
    return 0.0;
  }

  // Check if there's at least one digit of the string
  if (!/\d/.test(trimmed)) {
    return 0.0;
  }

  // At this point, we know there's at least one digit, so let's try to parse
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num;
  } else {
    // If parsing failed, check if it's because of a misplaced dash
    if (trimmed.includes("-") && trimmed !== "-") {
      // Remove all dashes and try parsing again
      const withoutDashes = trimmed.replace(/-/g, "");
      const parsed = parseFloat(withoutDashes);
      return !isNaN(parsed) ? -Math.abs(parsed) : 0.0;
    } else {
      return 0.0;
    }
  }
}

export function stringToU32(s: string): number {
  const trimmed = s.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  // Check if there's at least one digit of the string
  if (!/\d/.test(trimmed)) {
    return 0;
  }

  // At this point, we know there's at least one digit, so let's try to parse
  const num = parseInt(trimmed, 10);
  return !isNaN(num) ? num : 0;
}

import { v4 as uuidv4 } from "uuid";
import { Polygon, PolygonConfig } from "./polygon";
import { TextRenderer, TextRendererConfig } from "./text";
import {
  AnimationData,
  AnimationProperty,
  calculateDefaultCurve,
  EasingType,
  ObjectType,
  PathType,
  RangeData,
  SavedTimelineStateConfig,
  Sequence,
  TrackType,
  UIKeyframe,
} from "./animations";

// Define all possible edit operations
export enum ObjectProperty {
  Width = "Width",
  Height = "Height",
  Red = "Red",
  Green = "Green",
  Blue = "Blue",
  FillRed = "FillRed",
  FillGreen = "FillGreen",
  FillBlue = "FillBlue",
  BorderRadius = "BorderRadius",
  StrokeThickness = "StrokeThickness",
  StrokeRed = "StrokeRed",
  StrokeGreen = "StrokeGreen",
  StrokeBlue = "StrokeBlue",
  // Points = 'Points',
}

export interface ObjectEditConfig {
  objectId: string; // Using string for UUID
  objectType: ObjectType;
  fieldName: string;
  oldValue: { type: ObjectProperty; value: number };
  newValue: { type: ObjectProperty; value: number };
}

// Type definitions for handlers
export type PolygonClickHandler = () =>
  | ((id: string, config: PolygonConfig) => void)
  | null;
export type TextItemClickHandler = () =>
  | ((id: string, config: TextRendererConfig) => void)
  | null;
export type ImageItemClickHandler = () =>
  | ((id: string, config: StImageConfig) => void)
  | null;
export type VideoItemClickHandler = () =>
  | ((id: string, config: StVideoConfig) => void)
  | null;
export type OnMouseUp = () =>
  | ((id: string, point: Point) => [Sequence, UIKeyframe[]])
  | null;
export type OnHandleMouseUp = () =>
  | ((
      objectId: string,
      handleId: string,
      point: Point
    ) => [Sequence, UIKeyframe[]])
  | null;
export type OnPathMouseUp = () =>
  | ((id: string, point: Point) => [Sequence, UIKeyframe[]])
  | null;

export enum ControlMode {
  Select,
  Pan,
}

export interface windowSize {
  width: number;
  height: number;
}

// WebGPU resources class
export class WebGpuResources {
  surface: GPUCanvasContext | null;
  adapter: GPUAdapter;
  device: GPUDevice;
  queue: GPUQueue;

  private constructor(
    surface: GPUCanvasContext | null,
    adapter: GPUAdapter,
    device: GPUDevice,
    queue: GPUQueue
  ) {
    this.surface = surface;
    this.adapter = adapter;
    this.device = device;
    this.queue = queue;
  }

  static async request(
    canvas: HTMLCanvasElement,
    windowSize: WindowSize
  ): Promise<WebGpuResources> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser");
    }

    // Get WebGPU adapter
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });

    if (!adapter) {
      throw new GpuResourceError("AdapterNotFoundError");
    }

    // Request device from adapter
    const device = await adapter.requestDevice({
      label: "Main device",
      requiredFeatures: [],
      requiredLimits: {},
    });

    // Get canvas context
    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Couldn't get WebGPU context from canvas");
    }

    // Configure the canvas for the device
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });

    // Return the resources
    return new WebGpuResources(context, adapter, device, device.queue);
  }
}

// GPU Resource Error class
export class GpuResourceError extends Error {
  constructor(errorType: string, originalError?: Error) {
    const message = getErrorMessage(errorType, originalError);
    super(message);
    this.name = "GpuResourceError";

    // This is needed for proper TypeScript error handling
    Object.setPrototypeOf(this, GpuResourceError.prototype);
  }
}

function getErrorMessage(errorType: string, originalError?: Error): string {
  switch (errorType) {
    case "SurfaceCreationError":
      return `Surface creation error: ${
        originalError?.message || "unknown error"
      }`;
    case "AdapterNotFoundError":
      return "Failed to find a suitable GPU adapter";
    case "DeviceRequestError":
      return `Device request error: ${
        originalError?.message || "unknown error"
      }`;
    default:
      return `Unknown GPU resource error: ${
        originalError?.message || "unknown error"
      }`;
  }
}

// import { ControlMode, PolygonClickHandler, TextItemClickHandler, ImageItemClickHandler, VideoItemClickHandler, OnMouseUp, OnHandleMouseUp, OnPathMouseUp } from './control-types';
import { FontManager } from "./font";
import { MotionPath } from "./motionpath";
import { Camera, CameraBinding, WindowSize } from "./camera";
import { StImage, StImageConfig } from "./image";
import { MousePosition, SourceData, StVideo, StVideoConfig } from "./video";
import { vec2 } from "gl-matrix";

export class Editor {
  // visual
  selectedPolygonId: string | null;
  polygons: Polygon[];
  draggingPolygon: string | null;
  staticPolygons: Polygon[];
  projectSelected: string | null;
  textItems: TextRenderer[];
  draggingText: string | null;
  imageItems: StImage[];
  draggingImage: string | null;
  fontManager: FontManager;
  draggingPath: string | null;
  draggingPathHandle: string | null;
  draggingPathObject: string | null;
  draggingPathKeyframe: string | null;
  draggingPathAssocPath: string | null;
  //   cursorDot: RingDot | null;
  videoItems: StVideo[];
  draggingVideo: string | null;
  motionPaths: MotionPath[];

  // viewport
  viewport: Viewport;
  handlePolygonClick: PolygonClickHandler | null;
  handleTextClick: TextItemClickHandler | null;
  handleImageClick: ImageItemClickHandler | null;
  handleVideoClick: VideoItemClickHandler | null;

  // WebGPU resources
  gpuResources: WebGpuResources | null;

  window: Window | null;
  camera: Camera | null;
  cameraBinding: CameraBinding | null;
  modelBindGroupLayout: GPUBindGroupLayout | null;
  groupBindGroupLayout: GPUBindGroupLayout | null;
  windowSizeBindGroupLayout: GPUBindGroupLayout | null;
  windowSizeBindGroup: GPUBindGroup | null;
  windowSizeBuffer: GPUBuffer | null;
  renderPipeline: GPURenderPipeline | null;
  onMouseUp: OnMouseUp | null;
  onHandleMouseUp: OnHandleMouseUp | null;
  onPathMouseUp: OnPathMouseUp | null;
  currentView: string;
  interactiveBounds: BoundingBox;

  // state
  isPlaying: boolean;
  currentSequenceData: Sequence | null;
  lastFrameTime: number | null;
  startPlayingTime: number | null;
  videoIsPlaying: boolean;
  videoStartPlayingTime: number | null;
  videoCurrentSequenceTimeline: SavedTimelineStateConfig | null;
  videoCurrentSequencesData: Sequence[] | null;
  controlMode: ControlMode;
  isPanning: boolean;

  // points
  lastMousePos: Point | null;
  dragStart: Point | null;
  lastScreen: Point; // last mouse position from input event top-left origin
  lastWorld: Point;
  lastTopLeft: Point; // for inside the editor zone
  globalTopLeft: Point; // for when recording mouse positions outside the editor zone
  dsNdcPos: Point; // double-width sized ndc-style positioning (screen-oriented)
  ndc: Point;
  previousTopLeft: Point;

  // ai
  generationCount: number;
  generationCurved: boolean;
  generationChoreographed: boolean;
  generationFade: boolean;

  constructor(viewport: Viewport) {
    const windowSize = {
      width: viewport.width,
      height: viewport.height,
    };

    this.fontManager = new FontManager();

    this.selectedPolygonId = null; // nil UUID
    this.polygons = [];
    this.draggingPolygon = null;
    this.draggingPathAssocPath = null;
    this.dragStart = null;
    this.viewport = viewport;
    this.handlePolygonClick = null;
    this.handleTextClick = null;
    this.handleImageClick = null;
    this.handleVideoClick = null;
    this.gpuResources = null;
    this.renderPipeline = null;
    this.window = null;
    this.camera = null;
    this.cameraBinding = null;
    this.lastMousePos = null;
    this.lastScreen = { x: 0.0, y: 0.0 };
    this.lastWorld = { x: 0.0, y: 0.0 };
    this.dsNdcPos = { x: 0.0, y: 0.0 };
    this.lastTopLeft = { x: 0.0, y: 0.0 };
    this.globalTopLeft = { x: 0.0, y: 0.0 };
    this.ndc = { x: 0.0, y: 0.0 };
    this.previousTopLeft = { x: 0.0, y: 0.0 };
    this.isPlaying = false;
    this.currentSequenceData = null;
    this.lastFrameTime = null;
    this.startPlayingTime = null;
    this.modelBindGroupLayout = null;
    this.groupBindGroupLayout = null;
    this.windowSizeBindGroupLayout = null;
    this.windowSizeBindGroup = null;
    this.windowSizeBuffer = null;
    this.staticPolygons = [];
    this.onMouseUp = null;
    this.currentView = "manage_projects";
    this.projectSelected = null;
    this.textItems = [];
    this.draggingText = null;
    this.imageItems = [];
    this.draggingImage = null;
    this.videoIsPlaying = false;
    this.videoStartPlayingTime = null;
    this.videoCurrentSequenceTimeline = null;
    this.videoCurrentSequencesData = null;
    this.draggingPath = null;
    this.draggingPathHandle = null;
    this.onHandleMouseUp = null;
    this.onPathMouseUp = null;
    this.draggingPathObject = null;
    this.draggingPathKeyframe = null;
    // this.cursorDot = null;
    this.controlMode = ControlMode.Select;
    this.isPanning = false;
    this.videoItems = [];
    this.draggingVideo = null;
    this.motionPaths = [];
    this.generationCount = 4;
    this.generationCurved = false;
    this.generationChoreographed = true;
    this.generationFade = true;

    // TODO: update interactive bounds on window resize?
    this.interactiveBounds = {
      min: { x: 0.0, y: 0.0 }, // account for aside width, allow for some off-canvas positioning
      max: {
        x: windowSize.width,
        // y: windowSize.height - 350.0, // 350.0 for timeline space
        y: 550.0, // allow for 50.0 padding below and above the canvas
      },
    };
  }

  async restore_sequence_objects(saved_sequence: Sequence, hidden: boolean) {
    const camera = this.camera!; // Non-null assertion, assuming camera is initialized
    const windowSize = camera.windowSize;

    const gpu_resources = this.gpuResources!; // Non-null assertion

    const device = gpu_resources.device;
    const queue = gpu_resources.queue;

    saved_sequence.activePolygons.forEach((p) => {
      const restored_polygon = new Polygon(
        windowSize,
        device,
        queue,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        camera,
        [
          { x: 0.0, y: 0.0 },
          { x: 1.0, y: 0.0 },
          { x: 1.0, y: 1.0 },
          { x: 0.0, y: 1.0 },
        ],
        // { x: p.dimensions[0], y: p.dimensions[1] },
        [p.dimensions[0], p.dimensions[1]],
        { x: p.position.x, y: p.position.y },
        0.0,
        p.borderRadius,
        [p.fill[0], p.fill[1], p.fill[2], p.fill[3]],
        {
          thickness: p.stroke.thickness,
          fill: [
            p.stroke.fill[0],
            p.stroke.fill[1],
            p.stroke.fill[2],
            p.stroke.fill[3],
          ],
        },
        -2.0,
        p.layer,
        p.name,
        p.id, // Generate a new UUID
        saved_sequence.id
      );

      restored_polygon.hidden = hidden;

      this.polygons.push(restored_polygon);

      console.log("Polygon restored...");
    });

    saved_sequence.activeTextItems.forEach(async (t) => {
      const position = {
        x: CANVAS_HORIZ_OFFSET + t.position.x,
        y: CANVAS_VERT_OFFSET + t.position.y,
      };

      let fontData = await this.fontManager.loadFontByName(t.fontFamily);

      if (!fontData) {
        return;
      }

      let config: TextRendererConfig = {
        id: t.id,
        name: t.name,
        text: t.text,
        fontFamily: t.fontFamily,
        dimensions: [t.dimensions[0], t.dimensions[1]],
        position,
        layer: t.layer,
        color: t.color,
        fontSize: t.fontSize,
        backgroundFill: t.backgroundFill ?? [200, 200, 200, 255],
      };

      const restored_text = new TextRenderer(
        device,
        queue,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        config,
        fontData,
        windowSize,
        // t.text,
        // config,
        // t.id,
        saved_sequence.id,
        camera
      );

      restored_text.hidden = hidden;
      restored_text.renderText(device, queue);

      this.textItems.push(restored_text);

      console.log("Text restored...");
    });

    // saved_sequence.activeImageItems.forEach((i) => {
    //   const position = {
    //     x: CANVAS_HORIZ_OFFSET + i.position[0],
    //     y: CANVAS_VERT_OFFSET + i.position[1],
    //   };

    //   const image_config: StImageConfig = {
    //     id: i.id,
    //     name: i.name,
    //     dimensions: i.dimensions,
    //     url: i.url,
    //     position,
    //     layer: i.layer,
    //   };

    //   const restored_image = new StImage(
    //     device,
    //     queue,
    //     i.url,
    //     [], // TODO: load of image data
    //     image_config,
    //     windowSize,
    //     this.modelBindGroupLayout!,
    //     this.groupBindGroupLayout!,
    //     -2.0,
    //     i.id,
    //     saved_sequence.id
    //   );

    //   restored_image.hidden = hidden;
    //   this.imageItems.push(restored_image);
    //   console.log("Image restored...");
    // });

    // saved_sequence.activeVideoItems.forEach((i) => {
    //   let stored_source_data: SourceData | null = null;
    //   let stored_mouse_positions: MousePosition[] | null = null;

    //   if (i.mouse_path) {
    //     try {
    //       // Assuming you have a way to read files of your TS environment (e.g., using fetch or Node.js's fs)
    //       const sourceDataPath =
    //         i.mouse_path.substring(0, i.mouse_path.lastIndexOf("/")) +
    //         "/sourceData.json";
    //       const sourceData = // however you read it, you'll need to await, etc.
    //         (stored_source_data = sourceData as SourceData); // parse the json

    //       const mousePositions = // read the mouse position file
    //         (stored_mouse_positions = mousePositions as MousePosition[]); // parse the json
    //     } catch (error) {
    //       console.error("Error reading video data:", error);
    //     }
    //   }

    //   const position = {
    //     x: CANVAS_HORIZ_OFFSET + i.position[0],
    //     y: CANVAS_VERT_OFFSET + i.position[1],
    //   };

    //   const video_config: StVideoConfig = {
    //     id: i.id,
    //     name: i.name,
    //     dimensions: i.dimensions,
    //     path: i.path,
    //     position,
    //     layer: i.layer,
    //     mouse_path: i.mouse_path,
    //   };

    //   const restored_video = new StVideo(
    //     device,
    //     queue,
    //     i.path,
    //     video_config,
    //     windowSize,
    //     this.modelBindGroupLayout!,
    //     this.groupBindGroupLayout!,
    //     -2.0,
    //     i.id,
    //     saved_sequence.id
    //   );

    //   restored_video.hidden = hidden;
    //   restored_video.source_data = stored_source_data;
    //   restored_video.mouse_positions = stored_mouse_positions;

    //   restored_video.draw_video_frame(device, queue).catch(console.error); // Handle potential errors

    //   this.videoItems.push(restored_video);
    //   console.log("Video restored...");
    // });
  }

  reset_sequence_objects() {
    if (this.currentSequenceData) {
      const gpu_resources = this.gpuResources!;
      const camera = this.camera!;

      this.currentSequenceData.activePolygons.forEach((p) => {
        const polygon = this.polygons.find((polygon) => polygon.id === p.id);
        if (!polygon) {
          throw new Error("Couldn't find polygon");
        }

        polygon.transform.position[0] = p.position.x + CANVAS_HORIZ_OFFSET;
        polygon.transform.position[1] = p.position.y + CANVAS_VERT_OFFSET;
        polygon.transform.rotation = 0.0;
        polygon.transform.updateScale([1.0, 1.0]);

        polygon.transform.updateUniformBuffer(
          gpu_resources.queue,
          camera.windowSize
        );
        polygon.updateOpacity(gpu_resources.queue, 1.0);
      });

      this.currentSequenceData.activeTextItems.forEach((t) => {
        const text = this.textItems.find((text) => text.id === t.id);
        if (!text) {
          throw new Error("Couldn't find text");
        }

        text.transform.position[0] = t.position.x + CANVAS_HORIZ_OFFSET;
        text.transform.position[1] = t.position.y + CANVAS_VERT_OFFSET;
        text.transform.rotation = 0.0;

        text.transform.updateUniformBuffer(
          gpu_resources.queue,
          camera.windowSize
        );
        text.updateOpacity(gpu_resources.queue, 1.0);

        text.backgroundPolygon.transform.position[0] =
          t.position.x + CANVAS_HORIZ_OFFSET;
        text.backgroundPolygon.transform.position[1] =
          t.position.y + CANVAS_VERT_OFFSET;
        text.backgroundPolygon.transform.rotation = 0.0;

        text.backgroundPolygon.transform.updateUniformBuffer(
          gpu_resources.queue,
          camera.windowSize
        );
        text.backgroundPolygon.updateOpacity(gpu_resources.queue, 1.0);
      });

      // this.currentSequenceData.active_imageItems.forEach(i => {
      //     const image = this.imageItems.find(image => image.id === i.id);
      //     if (!image) {
      //         throw new Error("Couldn't find image");
      //     }

      //     image.transform.position[0] = i.position[0] + CANVAS_HORIZ_OFFSET;
      //     image.transform.position[1] = i.position[1] + CANVAS_VERT_OFFSET;
      //     image.transform.rotation = 0.0;

      //     image.transform.update_uniform_buffer(gpu_resources.queue, camera.windowSize);
      //     image.update_opacity(gpu_resources.queue, 1.0);
      // });

      // this.currentSequenceData.active_videoItems.forEach(i => {
      //     const video = this.videoItems.find(video => video.id === i.id);
      //     if (!video) {
      //         throw new Error("Couldn't find video");
      //     }

      //     video.transform.position[0] = i.position[0] + CANVAS_HORIZ_OFFSET;
      //     video.transform.position[1] = i.position[1] + CANVAS_VERT_OFFSET;
      //     video.transform.rotation = 0.0;

      //     video.transform.update_uniform_buffer(gpu_resources.queue, camera.windowSize);
      //     video.update_opacity(gpu_resources.queue, 1.0);

      //     video.reset_playback().catch(console.error); // Handle potential errors
      // });
    }
  }

  run_motion_inference(): AnimationData[] {
    let prompt = "";
    let total = 0;

    for (const polygon of this.polygons) {
      if (!polygon.hidden) {
        let x = polygon.transform.position[0] - CANVAS_HORIZ_OFFSET;
        x = (x / 800.0) * 100.0;
        let y = polygon.transform.position[1] - CANVAS_VERT_OFFSET;
        y = (y / 450.0) * 100.0;

        prompt += `${total}, 5, ${polygon.dimensions[0]}, ${
          polygon.dimensions[1]
        }, ${Math.round(x)}, ${Math.round(y)}, 0.000,\n`;
        total++;

        if (total > 6) {
          break;
        }
      }
    }

    for (const text of this.textItems) {
      if (!text.hidden) {
        let x = text.transform.position[0] - CANVAS_HORIZ_OFFSET;
        x = (x / 800.0) * 100.0;
        let y = text.transform.position[1] - CANVAS_VERT_OFFSET;
        y = (y / 450.0) * 100.0;

        prompt += `${total}, 5, ${text.dimensions[0]}, ${
          text.dimensions[1]
        }, ${Math.round(x)}, ${Math.round(y)}, 0.000,\n`;
        total++;

        if (total > 6) {
          break;
        }
      }
    }

    // for (const image of this.imageItems) {
    //   if (!image.hidden) {
    //     let x = image.transform.position[0] - CANVAS_HORIZ_OFFSET;
    //     x = (x / 800.0) * 100.0;
    //     let y = image.transform.position[1] - CANVAS_VERT_OFFSET;
    //     y = (y / 450.0) * 100.0;

    //     prompt += `${total}, 5, ${image.dimensions.x}, ${
    //       image.dimensions.y
    //     }, ${Math.round(x)}, ${Math.round(y)}, 0.000,\n`;
    //     total++;

    //     if (total > 6) {
    //       break;
    //     }
    //   }
    // }

    // for (const video of this.videoItems) {
    //   if (!video.hidden) {
    //     let x = video.transform.position[0] - CANVAS_HORIZ_OFFSET;
    //     x = (x / 800.0) * 100.0;
    //     let y = video.transform.position[1] - CANVAS_VERT_OFFSET;
    //     y = (y / 450.0) * 100.0;

    //     prompt += `${total}, 5, ${video.dimensions.x}, ${
    //       video.dimensions.y
    //     }, ${Math.round(x)}, ${Math.round(y)}, 0.000,\n`;
    //     total++;

    //     if (total > 6) {
    //       break;
    //     }
    //   }
    // }

    console.log("prompt", prompt);

    return this.call_motion_inference(prompt);
  }

  call_motion_inference(prompt: string): AnimationData[] {
    // TODO: will call API.  Return a Promise<AnimationData[]> and use async/await
    return []; // Placeholder
  }

  create_motionPaths_from_predictions(
    predictions: number[]
    // this.generation_choreographed: boolean,
    // this.generation_curved: boolean,
    // this.generation_fade: boolean,
    // polygons: Polygon[],
    // textItems: TextRenderer[],
    // imageItems: StImage[],
    // videoItems: StVideo[],
    // generation_count: number,
  ): AnimationData[] {
    const animation_data_vec: AnimationData[] = [];
    const values_per_prediction = NUM_INFERENCE_FEATURES;
    const keyframes_per_object = 6;

    const timestamp_diffs = [0.0, 2500.0, 5000.0, -5000.0, -2500.0, 0.0];

    const total_predictions = predictions.length;
    const num_objects =
      total_predictions / (values_per_prediction * keyframes_per_object);

    const current_positions: [number, number, number, number][] = [];
    let total = 0;

    for (const polygon of this.polygons) {
      if (!polygon.hidden) {
        current_positions.push([
          total,
          20000,
          polygon.transform.position[0] - CANVAS_HORIZ_OFFSET,
          polygon.transform.position[1] - CANVAS_VERT_OFFSET,
        ]);
        total++;
      }
    }

    for (const text of this.textItems) {
      if (!text.hidden) {
        current_positions.push([
          total,
          20000,
          text.transform.position[0] - CANVAS_HORIZ_OFFSET,
          text.transform.position[1] - CANVAS_VERT_OFFSET,
        ]);
        total++;
      }
    }

    for (const image of this.imageItems) {
      if (!image.hidden) {
        current_positions.push([
          total,
          20000,
          image.transform.position[0] - CANVAS_HORIZ_OFFSET,
          image.transform.position[1] - CANVAS_VERT_OFFSET,
        ]);
        total++;
      }
    }

    for (const video of this.videoItems) {
      if (!video.hidden) {
        current_positions.push([
          total,
          video.sourceDurationMs,
          video.transform.position[0] - CANVAS_HORIZ_OFFSET,
          video.transform.position[1] - CANVAS_VERT_OFFSET,
        ]);
        total++;
      }
    }

    let longest_path: number | null = null;
    if (this.generationChoreographed) {
      let max_distance = 0.0;
      for (let object_idx = 0; object_idx < num_objects; object_idx++) {
        let path_length = 0.0;
        let prev_x: number | null = null;
        let prev_y: number | null = null;

        for (
          let keyframe_idx = 0;
          keyframe_idx < keyframes_per_object;
          keyframe_idx++
        ) {
          const base_idx =
            object_idx * (values_per_prediction * keyframes_per_object) +
            keyframe_idx * values_per_prediction;

          if (base_idx + 5 >= predictions.length) {
            continue;
          }

          const x = Math.round(predictions[base_idx + 4] * 0.01 * 800.0);
          const y = Math.round(predictions[base_idx + 5] * 0.01 * 450.0);

          if (prev_x !== null && prev_y !== null) {
            const dx = x - prev_x;
            const dy = y - prev_y;
            path_length += Math.sqrt(dx * dx + dy * dy);
          }

          prev_x = x;
          prev_y = y;
        }

        if (path_length > max_distance) {
          max_distance = path_length;
          longest_path = object_idx;
        }
      }
    }

    for (
      let object_idx = 0;
      object_idx < current_positions.length;
      object_idx++
    ) {
      const itemId = this.getItemId(object_idx);
      const objectType = this.getObjectType(object_idx);

      if (!itemId || !objectType) continue; // Skip if ID or type is not found

      const totalDuration =
        objectType === ObjectType.VideoItem
          ? this.videoItems.find((v) => v.id === itemId)?.sourceDurationMs ||
            20000 // Provide a default
          : 20000.0;

      const timestamps = [
        0.0,
        2500.0,
        5000.0,
        totalDuration - 5000.0,
        totalDuration - 2500.0,
        totalDuration,
      ];

      const pathSourceIdx = this.generationChoreographed
        ? longest_path ?? object_idx
        : object_idx; // Use nullish coalescing

      const positionKeyframes: UIKeyframe[] = [];

      const [, , currentX, currentY] = current_positions[object_idx];

      const rangeCenterIdx =
        pathSourceIdx * (values_per_prediction * keyframes_per_object) +
        2 * values_per_prediction;
      const centerX = Math.round(
        predictions[rangeCenterIdx + 4] * 0.01 * 800.0
      );
      const centerY = Math.round(
        predictions[rangeCenterIdx + 5] * 0.01 * 450.0
      );

      const offsetX = currentX - centerX;
      const offsetY = currentY - centerY;

      for (
        let keyframeTimeIdx = 0;
        keyframeTimeIdx < keyframes_per_object;
        keyframeTimeIdx++
      ) {
        if (
          this.generationCount === 4 &&
          (keyframeTimeIdx === 1 || keyframeTimeIdx === 4)
        ) {
          continue;
        }

        const baseIdx =
          pathSourceIdx * (values_per_prediction * keyframes_per_object) +
          keyframeTimeIdx * values_per_prediction;

        if (baseIdx + 5 >= predictions.length) {
          continue;
        }

        const predictedX =
          Math.round(predictions[baseIdx + 4] * 0.01 * 800.0) + offsetX;
        const predictedY =
          Math.round(predictions[baseIdx + 5] * 0.01 * 450.0) + offsetY;

        const timestamp =
          keyframeTimeIdx < 3
            ? timestamp_diffs[keyframeTimeIdx]
            : totalDuration + timestamp_diffs[keyframeTimeIdx];

        const keyframe: UIKeyframe = {
          id: uuidv4(),
          time: timestamp,
          value: { type: "Position", value: [predictedX, predictedY] },
          easing: EasingType.EaseInOut,
          pathType: PathType.Linear,
          curveData: null,
          keyType: { type: "Frame" },
        };

        positionKeyframes.push(keyframe);
      }

      // ... (rest of the code for range keyframes and final keyframes)

      if (positionKeyframes.length === 6) {
        const forthKeyframe = { ...positionKeyframes[3] }; // Create a copy
        const thirdKeyframe = positionKeyframes[2];
        thirdKeyframe.keyType = {
          type: "Range",
          data: {
            endTime: forthKeyframe.time, // Duration of milliseconds
          },
        };
        positionKeyframes.splice(3, 1); // Remove the 4th element
      }

      if (positionKeyframes.length === 4) {
        const mid2Keyframe = { ...positionKeyframes[2] }; // Create a copy
        const midKeyframe = positionKeyframes[1];
        // midKeyframe.keyType = KeyType.Range({ end_time: mid2Keyframe.time });
        midKeyframe.keyType = {
          type: "Range",
          data: {
            endTime: mid2Keyframe.time, // Duration of milliseconds
          },
        };
        positionKeyframes.splice(2, 1); // Remove the 3rd element (index 2)
      }

      let final_position_keyframes: UIKeyframe[] = [];
      if (this.generationCurved) {
        for (const keyframe of positionKeyframes) {
          if (final_position_keyframes.length > 0) {
            // Check if there's a previous keyframe
            const prevKeyframe =
              final_position_keyframes[final_position_keyframes.length - 1];
            const curveData = calculateDefaultCurve(prevKeyframe, keyframe); // Implement this function
            prevKeyframe.pathType = PathType.Bezier;
            if (prevKeyframe.pathType === PathType.Bezier && curveData) {
              prevKeyframe.curveData = curveData;
            }
          }
          final_position_keyframes.push({ ...keyframe }); // Push a copy
        }
      } else {
        final_position_keyframes = [...positionKeyframes]; // Create a copy
      }

      if (final_position_keyframes.length > 0 && itemId) {
        // Check if itemId is defined
        const properties: AnimationProperty[] = [
          {
            name: "Position",
            propertyPath: "position",
            children: [],
            keyframes: final_position_keyframes,
            depth: 0,
          },
          {
            name: "Rotation",
            propertyPath: "rotation",
            children: [],
            keyframes: timestamps.map((t) => ({
              id: uuidv4(),
              time: t,
              value: {
                type: "Rotation",
                value: 0,
              }, // Assuming 0 for rotation
              easing: EasingType.EaseInOut,
              pathType: PathType.Linear,
              keyType: { type: "Frame" },
              curveData: null,
            })),
            depth: 0,
          },
          {
            name: "Scale",
            propertyPath: "scale",
            children: [],
            keyframes: timestamps.map((t) => ({
              id: uuidv4(),
              time: t,
              value: {
                type: "Scale",
                value: 100,
              }, // Assuming 100 for scale
              easing: EasingType.EaseInOut,
              pathType: PathType.Linear,
              keyType: { type: "Frame" },
              curveData: null,
            })),
            depth: 0,
          },
          {
            name: "Opacity",
            propertyPath: "opacity",
            children: [],
            keyframes: timestamps.map((t, i) => {
              let opacity = 100;
              if (
                this.generationFade &&
                (i === 0 || i === timestamps.length - 1)
              ) {
                opacity = 0;
              }

              return {
                id: uuidv4(),
                time: t,
                value: {
                  type: "Opacity",
                  value: opacity,
                },
                easing: EasingType.EaseInOut,
                pathType: PathType.Linear,
                keyType: { type: "Frame" },
                curveData: null,
              };
            }),
            depth: 0,
          },
        ];

        if (objectType === ObjectType.VideoItem) {
          properties.push({
            name: "Zoom / Popout",
            propertyPath: "zoom",
            children: [],
            keyframes: timestamps.map((t) => ({
              id: uuidv4(),
              time: t,
              value: {
                type: "Zoom",
                value: 100,
              },
              easing: EasingType.EaseInOut,
              pathType: PathType.Linear,
              keyType: { type: "Frame" },
              curveData: null,
            })),
            depth: 0,
          });
        }

        animation_data_vec.push({
          id: uuidv4(),
          objectType: objectType,
          polygonId: itemId,
          duration: totalDuration,
          startTimeMs: 0,
          position: [0, 0],
          properties,
        });
      }
    }

    return animation_data_vec;
  }

  // Helper function to get item ID based on object index
  getItemId(objectIdx: number): string | null {
    const visiblePolygons: Polygon[] = this.polygons.filter((p) => !p.hidden);
    const visibleTexts: TextRenderer[] = this.textItems.filter(
      (t) => !t.hidden
    );
    const visibleImages: StImage[] = this.imageItems.filter((i) => !i.hidden);
    const visibleVideos: StVideo[] = this.videoItems.filter((v) => !v.hidden);

    const polygonCount = visiblePolygons.length;
    const textCount = visibleTexts.length;
    const imageCount = visibleImages.length;
    const videoCount = visibleVideos.length;

    if (objectIdx < polygonCount) {
      return visiblePolygons[objectIdx].id;
    } else if (objectIdx < polygonCount + textCount) {
      return visibleTexts[objectIdx - polygonCount].id;
    } else if (objectIdx < polygonCount + textCount + imageCount) {
      return visibleImages[objectIdx - (polygonCount + textCount)].id;
    } else if (objectIdx < polygonCount + textCount + imageCount + videoCount) {
      return visibleVideos[objectIdx - (polygonCount + textCount + imageCount)]
        .id;
    } else {
      return null;
    }
  }

  // Helper function to get object type based on object index
  getObjectType(objectIdx: number): ObjectType | null {
    const polygonCount = this.polygons.filter((p) => !p.hidden).length;
    const textCount = this.textItems.filter((t) => !t.hidden).length;
    const imageCount = this.imageItems.filter((i) => !i.hidden).length;
    const videoCount = this.videoItems.filter((v) => !v.hidden).length;

    if (objectIdx < polygonCount) {
      return ObjectType.Polygon;
    } else if (objectIdx < polygonCount + textCount) {
      return ObjectType.TextItem;
    } else if (objectIdx < polygonCount + textCount + imageCount) {
      return ObjectType.ImageItem;
    } else if (objectIdx < polygonCount + textCount + imageCount + videoCount) {
      return ObjectType.VideoItem;
    } else {
      return null;
    }
  }

  stepVideoAnimations(camera: Camera, providedCurrentTimeS?: number): void {
    if (!this.videoIsPlaying || !this.videoCurrentSequenceTimeline) {
      return;
    }

    const now = Date.now();
    const totalDt = this.videoStartPlayingTime
      ? (now - this.videoStartPlayingTime) / 1000
      : 0;

    const sequenceTimeline = this.videoCurrentSequenceTimeline;

    // Convert totalDt from seconds to milliseconds for comparison with timeline
    const currentTimeMs = providedCurrentTimeS
      ? Math.floor(providedCurrentTimeS * 1000)
      : Math.floor(totalDt * 1000);

    // Get the sequences data
    const videoCurrentSequencesData = this.videoCurrentSequencesData;
    if (!videoCurrentSequencesData) {
      return;
    }

    let updateBackground = false;

    if (totalDt <= 1.0 / 60.0) {
      console.log("Update initial background...");
      updateBackground = true;
    }

    // Iterate through timeline sequences of order
    for (const ts of sequenceTimeline.timeline_sequences) {
      // Skip audio tracks as we're only handling video
      if (ts.track_type !== TrackType.Video) {
        continue;
      }

      // Find the duration of the sequence
      const durationMs =
        videoCurrentSequencesData.find((s) => s.id === ts.sequence_id)
          ?.durationMs || 0;

      // Check if this sequence should be playing at the current time
      if (
        currentTimeMs >= ts.start_time_ms &&
        currentTimeMs < ts.start_time_ms + durationMs
      ) {
        // Find the corresponding sequence data
        const sequence = videoCurrentSequencesData.find(
          (s) => s.id === ts.sequence_id
        );
        if (sequence) {
          // Calculate local time within this sequence
          const sequenceLocalTime = (currentTimeMs - ts.start_time_ms) / 1000;

          if (this.currentSequenceData) {
            // Check id to avoid unnecessary cloning
            if (sequence.id !== this.currentSequenceData.id) {
              this.currentSequenceData = sequence;

              // Set hidden attribute on relevant objects
              const currentSequenceId = sequence.id;

              for (const polygon of this.polygons) {
                polygon.hidden =
                  polygon.currentSequenceId !== currentSequenceId;
              }
              for (const text of this.textItems) {
                text.hidden = text.currentSequenceId !== currentSequenceId;
              }
              for (const image of this.imageItems) {
                image.hidden = image.currentSequenceId !== currentSequenceId;
              }
              for (const video of this.videoItems) {
                video.hidden = video.currentSequenceId !== currentSequenceId;
              }

              updateBackground = true;
            }
          } else {
            this.currentSequenceData = sequence;
          }
        }
      }
    }

    if (updateBackground && this.currentSequenceData) {
      const backgroundFill = this.currentSequenceData.backgroundFill;
      if (backgroundFill && backgroundFill.type === "Color") {
        const [r, g, b, a] = backgroundFill.value;
        // this.replaceBackground(
        //   this.currentSequenceData.id,
        //   rgbToWgpu(r, g, b, a)
        // );
      } else {
        console.log("Not supported yet...");
      }
    }
  }

  stepMotionPathAnimations(
    camera: Camera,
    providedCurrentTimeS?: number
  ): void {
    if (!this.isPlaying || !this.currentSequenceData) {
      return;
    }

    const now = Date.now();
    let totalDt = this.startPlayingTime
      ? (now - this.startPlayingTime) / 1000
      : 0;
    totalDt =
      providedCurrentTimeS !== undefined ? providedCurrentTimeS : totalDt;
    this.lastFrameTime = now;

    this.stepAnimateSequence(totalDt, camera);
  }

  stepAnimateSequence(totalDt: number, camera: Camera): void {
    const gpuResources = this.gpuResources;
    if (!gpuResources) {
      throw new Error("Couldn't get GPU Resources");
    }

    const sequence = this.currentSequenceData;
    if (!sequence) {
      throw new Error("Couldn't get sequence");
    }

    // Update each animation path
    for (const animation of sequence.polygonMotionPaths) {
      // Group transform position
      const pathGroupPosition = animation.position;

      // Get current time within animation duration
      const currentTime = totalDt % (sequence.durationMs / 1000);
      const startTime = animation.startTimeMs / 1000;

      // Check if the current time is within the animation's active period
      if (
        currentTime < startTime ||
        currentTime > startTime + animation.duration
      ) {
        continue;
      }

      // Find the object to update
      let objectIdx: number | undefined;
      switch (animation.objectType) {
        case "Polygon":
          objectIdx = this.polygons.findIndex(
            (p) => p.id === animation.polygonId
          );
          break;
        case "TextItem":
          objectIdx = this.textItems.findIndex(
            (t) => t.id === animation.polygonId
          );
          break;
        case "ImageItem":
          objectIdx = this.imageItems.findIndex(
            (i) => i.id === animation.polygonId
          );
          break;
        case "VideoItem":
          objectIdx = this.videoItems.findIndex(
            (i) => i.id === animation.polygonId
          );
          break;
      }

      if (objectIdx === undefined || objectIdx === -1) {
        continue;
      }

      // Determine whether to draw the video frame based on the frame rate and current time
      let animateProperties = false;

      if (animation.objectType === "VideoItem") {
        const videoItem = this.videoItems[objectIdx];
        const frameRate = videoItem.sourceFrameRate;
        const sourceDurationMs = videoItem.sourceDurationMs;
        const frameInterval = 1.0 / frameRate;

        // Calculate the number of frames that should have been displayed by now
        const elapsedTime = currentTime - startTime;
        const currentFrameTime = videoItem.numFramesDrawn * frameInterval;

        // Only draw the frame if the current time is within the frame's display interval
        if (
          currentTime >= currentFrameTime &&
          currentTime < currentFrameTime + frameInterval
        ) {
          if (currentTime * 1000 + 1000 < sourceDurationMs) {
            videoItem.drawVideoFrame(gpuResources.device, gpuResources.queue);
            animateProperties = true;
            videoItem.numFramesDrawn += 1;
          }
        } else {
          // Determine how many video frames to draw to catch up
          const difference = currentTime - currentFrameTime;
          const catchUpFrames = Math.floor(difference / frameInterval);

          // Only catch up if we're behind and within the video duration
          if (
            catchUpFrames > 0 &&
            currentTime * 1000 + 1000 < sourceDurationMs
          ) {
            // Limit the maximum number of frames to catch up to avoid excessive CPU usage
            const maxCatchUp = 5;
            const framesToDraw = Math.min(catchUpFrames, maxCatchUp);

            for (let i = 0; i < framesToDraw; i++) {
              videoItem.drawVideoFrame(gpuResources.device, gpuResources.queue);
              videoItem.numFramesDrawn += 1;
            }

            animateProperties = true;
          }
        }
      } else {
        animateProperties = true;
      }

      if (!animateProperties) {
        continue;
      }

      // Go through each property
      for (const property of animation.properties) {
        if (property.keyframes.length < 2) {
          continue;
        }

        if (startTime > currentTime) {
          continue;
        }

        // Find the surrounding keyframes
        const surroundingKeyframes = this.getSurroundingKeyframes(
          property.keyframes,
          currentTime - startTime
        );
        if (!surroundingKeyframes) {
          continue;
        }

        const [startFrame, endFrame] = surroundingKeyframes;

        if (!startFrame || !endFrame) {
          continue;
        }

        // Calculate interpolation progress
        const duration = endFrame.time - startFrame.time; // duration between keyframes
        const elapsed = currentTime - startTime - startFrame.time; // elapsed since start keyframe
        let progress = elapsed / duration;

        // Apply easing (EaseInOut)
        progress =
          progress < 0.5
            ? 2.0 * progress * progress
            : 1.0 - Math.pow(-2.0 * progress + 2.0, 2) / 2.0;

        // Apply the interpolated value to the object's property
        const startValue = startFrame.value;
        const endValue = endFrame.value;

        // Add property-specific interpolation logic here
        // Example:
        // if (property.type === 'Position') {
        //     const interpolatedValue = startValue + (endValue - startValue) * progress;
        //     this.updateObjectProperty(objectIdx, property.type, interpolatedValue);
        // }

        switch (
          true // Using switch(true) for cleaner type checking
        ) {
          case startFrame.value.type === "Position" &&
            endFrame.value.type === "Position": {
            const start = startFrame.value.value as [number, number]; // Type assertion for clarity
            const end = endFrame.value.value as [number, number];

            const x = this.lerp(start[0], end[0], progress);
            const y = this.lerp(start[1], end[1], progress);

            const position: Point = {
              x: CANVAS_HORIZ_OFFSET + x + pathGroupPosition[0],
              y: CANVAS_VERT_OFFSET + y + pathGroupPosition[1],
            };

            // const positionVec: vec2 = vec2.fromValues(position.x, position.y);
            let positionVec = [position.x, position.y] as [number, number];
            // const windowSizeVec: vec2 = vec2.fromValues(
            //   camera.windowSize.width,
            //   camera.windowSize.height
            // ); // Assuming camera.windowSize is an array [width, height]

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (this.polygons[objectIdx] as Polygon).transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
              case ObjectType.ImageItem:
                this.imageItems[objectIdx].transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
              case ObjectType.VideoItem:
                this.videoItems[objectIdx].transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
            }
            break;
          }

          case startFrame.value.type === "Rotation" &&
            endFrame.value.type === "Rotation": {
            const start = startFrame.value.value as number;
            const end = endFrame.value.value as number;
            const new_rotation = this.lerp(start, end, progress);
            const new_rotation_rad = toRadians(new_rotation);

            switch (animation.objectType) {
              case ObjectType.Polygon:
                this.polygons[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
              case ObjectType.ImageItem:
                this.imageItems[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
              case ObjectType.VideoItem:
                this.videoItems[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
            }
            break;
          }
          case startFrame.value.type === "Scale" &&
            endFrame.value.type === "Scale": {
            const start = startFrame.value.value as number;
            const end = endFrame.value.value as number;
            const new_scale = this.lerp(start, end, progress) / 100.0;
            // const scaleVec: vec2 = vec2.fromValues(new_scale, new_scale); // Create scale vector
            const scaleVec = [new_scale, new_scale] as [number, number];

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (this.polygons[objectIdx] as Polygon).transform.updateScale(
                  scaleVec
                );
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateScale(scaleVec);
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updateScale(scaleVec);
                break;
              case ObjectType.ImageItem:
                const originalScaleImage =
                  this.imageItems[objectIdx].dimensions;
                // const scaledImageDimensions = vec2.fromValues(
                //   originalScaleImage[0] * new_scale,
                //   originalScaleImage[1] * new_scale
                // );
                const scaledImageDimensions = [
                  originalScaleImage[0] * new_scale,
                  originalScaleImage[1] * new_scale,
                ] as [number, number];
                this.imageItems[objectIdx].transform.updateScale(
                  scaledImageDimensions
                );
                break;
              case ObjectType.VideoItem:
                const originalScaleVideo =
                  this.videoItems[objectIdx].dimensions;
                // const scaledVideoDimensions = vec2.fromValues(
                //   originalScaleVideo[0] * new_scale,
                //   originalScaleVideo[1] * new_scale
                // );
                const scaledVideoDimensions = [
                  originalScaleVideo[0] * new_scale,
                  originalScaleVideo[1] * new_scale,
                ] as [number, number];
                this.videoItems[objectIdx].transform.updateScale(
                  scaledVideoDimensions
                );
                break;
            }
            break;
          }

          case startFrame.value.type === "Opacity" &&
            endFrame.value.type === "Opacity": {
            const start = startFrame.value.value as number;
            const end = endFrame.value.value as number;
            const opacity = this.lerp(start, end, progress) / 100.0;

            const gpuResources = this.gpuResources;

            if (gpuResources) {
              const queue = gpuResources.queue;
              switch (animation.objectType) {
                case ObjectType.Polygon:
                  this.polygons[objectIdx].updateOpacity(queue, opacity);
                  break;
                case ObjectType.TextItem:
                  this.textItems[objectIdx].updateOpacity(queue, opacity);
                  this.textItems[objectIdx].backgroundPolygon.updateOpacity(
                    queue,
                    opacity
                  );
                  break;
                case ObjectType.ImageItem:
                  this.imageItems[objectIdx].updateOpacity(queue, opacity);
                  break;
                case ObjectType.VideoItem:
                  this.videoItems[objectIdx].updateOpacity(queue, opacity);
                  break;
              }
            } else {
              console.error("GPU resources not available.");
            }
            break;
          }

          default:
            break; // Or handle the default case as needed
        }
      }
    }
  }

  getSurroundingKeyframes(
    keyframes: UIKeyframe[],
    current_time: number
  ): [UIKeyframe | null, UIKeyframe | null] {
    let prev_frame: UIKeyframe | null = null;
    let next_frame: UIKeyframe | null = null;

    keyframes.sort((a, b) => a.time - b.time); // Sort keyframes by time

    for (let i = 0; i < keyframes.length; i++) {
      const frame = keyframes[i];

      if (frame.time > current_time) {
        if (i > 0) {
          const prevKeyframe = keyframes[i - 1];
          if (prevKeyframe.keyType.type === "Range") {
            // Check the 'type' property
            const range_data = prevKeyframe.keyType.data as RangeData; // Type assertion

            if (
              current_time >= prevKeyframe.time &&
              current_time < range_data.endTime
            ) {
              prev_frame = { ...prevKeyframe }; // Create a copy
              next_frame = {
                id: "virtual",
                time: range_data.endTime,
                value: prevKeyframe.value,
                easing: EasingType.Linear,
                pathType: PathType.Linear,
                keyType: { type: "Frame" }, // Virtual keyframe is a Frame
                curveData: null,
              };
              return [prev_frame, next_frame];
            }

            if (
              current_time >= range_data.endTime &&
              current_time < frame.time
            ) {
              prev_frame = {
                id: "virtual",
                time: range_data.endTime,
                value: prevKeyframe.value,
                easing: EasingType.Linear,
                pathType: PathType.Linear,
                keyType: { type: "Frame" },
                curveData: null,
              };
              next_frame = { ...frame }; // Create a copy
              return [prev_frame, next_frame];
            }
          }
        }

        next_frame = { ...frame }; // Create a copy
        prev_frame =
          i > 0
            ? { ...keyframes[i - 1] }
            : { ...keyframes[keyframes.length - 1] }; // Create a copy
        break;
      }
    }

    return [prev_frame, next_frame];
  }

  lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  createMotionPathVisualization(
    sequence: Sequence,
    polygonId: string,
    colorIndex: number
  ): void {
    const animationData = sequence.polygonMotionPaths.find(
      (anim) => anim.polygonId === polygonId
    );
    if (!animationData) {
      console.error(`Couldn't find animation data for polygon ${polygonId}`);
      return;
    }

    const positionProperty = animationData.properties.find((prop) =>
      prop.name.startsWith("Position")
    );
    if (!positionProperty) {
      console.error(`Couldn't find position property for polygon ${polygonId}`);
      return;
    }

    // Sort keyframes by time
    const keyframes = [...positionProperty.keyframes].sort(
      (a, b) => a.time - b.time
    );

    const newId = animationData.id; // Directly using string ID
    const initialPosition: [number, number] = animationData.position;

    if (
      !this.camera ||
      !this.gpuResources ||
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
    ) {
      console.error(
        "Missing required resources for motion path visualization."
      );
      return;
    }

    const motionPath = new MotionPath(
      this.gpuResources.device,
      this.gpuResources.queue,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      newId,
      this.camera.windowSize,
      keyframes,
      this.camera,
      sequence,
      colorIndex,
      polygonId,
      initialPosition
    );

    this.motionPaths.push(motionPath);
  }

  updateMotionPaths(sequence: Sequence): void {
    this.motionPaths = [];

    let colorIndex = 1;
    const allItems = [
      ...sequence.activePolygons,
      ...sequence.activeTextItems,
      ...sequence.activeImageItems,
      ...sequence.activeVideoItems,
    ];

    for (const item of allItems) {
      this.createMotionPathVisualization(sequence, item.id, colorIndex);
      colorIndex += 1;
    }
  }

  updateCameraBinding() {
    if (this.cameraBinding && this.camera && this.gpuResources) {
      this.cameraBinding.update(this.gpuResources.queue, this.camera);
    }
  }

  handleWHeel(delta: number, mouse_pos: Point) {
    let camera = this.camera;

    if (
      this.lastScreen.x < this.interactiveBounds.min.x ||
      this.lastScreen.x > this.interactiveBounds.max.x ||
      this.lastScreen.y < this.interactiveBounds.min.y ||
      this.lastScreen.y > this.interactiveBounds.max.y
    ) {
      return;
    }

    // let zoom_factor = if delta > 0.0 { 1[1] } else { 0.9 };
    let zoom_factor = delta / 10.0;
    camera?.update_zoom(zoom_factor, mouse_pos);
    this.updateCameraBinding();
  }

  add_polygon(
    polygon_config: PolygonConfig,
    polygon_name: string,
    new_id: string,
    selected_sequence_id: string
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;
    let windowSize = camera?.windowSize;

    if (
      !camera ||
      !windowSize ||
      !gpuResources ||
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
    ) {
      return;
    }

    let polygon = new Polygon(
      windowSize,
      gpuResources.device,
      gpuResources.queue,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      camera,
      polygon_config.points,
      polygon_config.dimensions,
      polygon_config.position,
      0.0,
      polygon_config.borderRadius,
      polygon_config.fill,
      {
        thickness: 2.0,
        fill: rgbToWgpu(0, 0, 0, 255.0),
      },
      0.0,
      polygon_config.layer,
      polygon_name,
      new_id,
      selected_sequence_id
    );

    this.polygons.push(polygon);
  }

  async add_text_item(
    text_config: TextRendererConfig,
    text_content: string,
    new_id: string,
    selected_sequence_id: string
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera) {
      return;
    }

    if (!this.modelBindGroupLayout || !this.groupBindGroupLayout) {
      return;
    }

    let device = gpuResources.device;
    let queue = gpuResources.queue;

    let windowSize = camera.windowSize;

    let default_fontFamily = await this.fontManager.loadFontByName(
      text_config.fontFamily
    );

    if (!default_fontFamily) {
      return;
    }

    let text_item = new TextRenderer(
      device,
      queue,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      text_config,
      default_fontFamily, // load font data ahead of time
      windowSize,
      selected_sequence_id,
      camera
    );

    text_item.renderText(device, queue);

    this.textItems.push(text_item);
  }

  add_image_item(
    // windowSize: WindowSize,
    // device: GPUDevice,
    // queue: GPUQueue,
    image_config: StImageConfig,
    // path: Path,
    url: string,
    blob: Blob,
    new_id: string,
    selected_sequence_id: string
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera) {
      return;
    }
    let device = gpuResources.device;
    let queue = gpuResources.queue;

    let windowSize = camera.windowSize;

    if (!this.modelBindGroupLayout || !this.groupBindGroupLayout) {
      return;
    }

    let image_item = new StImage(
      device,
      queue,
      // path,
      url,
      blob,
      image_config,
      windowSize,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      0.0,
      selected_sequence_id
    );

    this.imageItems.push(image_item);
  }

  add_video_item(
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    video_config: StVideoConfig,
    path: string,
    new_id: string,
    selected_sequence_id: string,
    mouse_positions: MousePosition[],
    stored_source_data: SourceData
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (
      !gpuResources ||
      !camera ||
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
    ) {
      return;
    }

    let video_item = new StVideo(
      device,
      queue,
      path,
      video_config,
      windowSize,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      0.0,
      selected_sequence_id
    );
    // .expect("Couldn't create video item");

    // set mouse capture source data if it exists
    video_item.sourceData = stored_source_data;

    // set mouse positions for later use
    video_item.mousePositions = mouse_positions;

    // render 1 frame to provide preview image
    video_item.drawVideoFrame(device, queue);

    this.videoItems.push(video_item);
  }

  replace_background(
    sequence_id: string,
    fill: [number, number, number, number]
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;
    let modelBindGroupLayout = this.modelBindGroupLayout;
    let groupBindGroupLayout = this.groupBindGroupLayout;

    if (
      !gpuResources ||
      !camera ||
      !modelBindGroupLayout ||
      !groupBindGroupLayout
    ) {
      return;
    }

    console.info("replace background {:?} {:?}", sequence_id, fill);

    let windowSize = camera.windowSize;

    // Remove existing background
    this.staticPolygons = this.staticPolygons.filter(
      (p) => p.name !== "canvas_background"
    );

    let canvas_polygon = new Polygon(
      windowSize,
      gpuResources.device,
      gpuResources.queue,
      modelBindGroupLayout,
      groupBindGroupLayout,
      camera,
      [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 },
      ],
      [800.0 as number, 450.0 as number],
      {
        x: 900.0 / 2.0,
        y: 550.0 / 2.0,
      },
      0.0,
      0.0,
      fill,
      {
        thickness: 0.0,
        fill: rgbToWgpu(0, 0, 0, 255.0),
      },
      0.0,
      -89, // camera far is -100
      "canvas_background",
      sequence_id,
      sequence_id
    );

    console.info("bg poly", canvas_polygon);

    this.staticPolygons.push(canvas_polygon);
  }

  update_background(
    selected_id: string,
    key: string,
    new_value_type: InputValue,
    new_value: number
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    // First iteration: find the index of the selected polygon
    let polygon_index = this.staticPolygons.findIndex(
      (p) => p.id == selected_id && p.name == "canvas_background"
    );

    if (polygon_index) {
      console.info("Found selected static_polygon with ID: {}", selected_id);

      // Get the necessary data from editor
      // let viewport_width = camera.windowSize.width;
      // let viewport_height = camera.windowSize.height;
      let windowSize = camera?.windowSize;
      let device = gpuResources.device;
      let queue = gpuResources.queue;

      // let windowSize = windowSize {
      //     width: viewport_width as number,
      //     height: viewport_height as number,
      // };

      // Second iteration: update the selected polygon

      if (this.staticPolygons[polygon_index]) {
        let selected_polygon = this.staticPolygons[polygon_index];

        switch (new_value_type) {
          case InputValue.Number:
            switch (key) {
              case "red": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    colorToWgpu(new_value),
                    selected_polygon.fill[1],
                    selected_polygon.fill[2],
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
              case "green": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_polygon.fill[0],
                    colorToWgpu(new_value),
                    selected_polygon.fill[2],
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
              case "blue": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_polygon.fill[0],
                    selected_polygon.fill[1],
                    colorToWgpu(new_value),
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
            }
        }
      }
    } else {
      console.info(
        "No static_polygon found with the selected ID: {}",
        selected_id
      );
    }
  }

  update_polygon(
    selected_id: string,
    key: string,
    new_value_type: InputValue,
    new_value: number
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    // First iteration: find the index of the selected polygon
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      console.info("Found selected polygon with ID: {}", selected_id);

      // Get the necessary data from editor
      let viewport_width = camera.windowSize.width;
      let viewport_height = camera.windowSize.height;
      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;
      // Second iteration: update the selected polygon
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        switch (new_value_type) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                selected_polygon.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [new_value, selected_polygon.dimensions[1]],
                  camera
                );
              }
              case "height": {
                selected_polygon.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [selected_polygon.dimensions[0], new_value],
                  camera
                );
              }
              case "borderRadius": {
                selected_polygon.updateDataFromBorderRadius(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  new_value,
                  camera
                );
              }
              case "red": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    colorToWgpu(new_value),
                    selected_polygon.fill[1],
                    selected_polygon.fill[2],
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
              case "green": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_polygon.fill[0],
                    colorToWgpu(new_value),
                    selected_polygon.fill[2],
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
              case "blue": {
                selected_polygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_polygon.fill[0],
                    selected_polygon.fill[1],
                    colorToWgpu(new_value),
                    selected_polygon.fill[3],
                  ],
                  camera
                );
              }
              case "stroke_thickness": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  {
                    thickness: new_value,
                    fill: selected_polygon.stroke.fill,
                  },
                  camera
                );
              }
              case "stroke_red": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  {
                    thickness: selected_polygon.stroke.thickness,
                    fill: [
                      colorToWgpu(new_value),
                      selected_polygon.stroke.fill[1],
                      selected_polygon.stroke.fill[2],
                      selected_polygon.stroke.fill[3],
                    ],
                  },
                  camera
                );
              }
              case "stroke_green": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  {
                    thickness: selected_polygon.stroke.thickness,
                    fill: [
                      selected_polygon.stroke.fill[0],
                      colorToWgpu(new_value),
                      selected_polygon.stroke.fill[2],
                      selected_polygon.stroke.fill[3],
                    ],
                  },
                  camera
                );
              }
              case "stroke_blue": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  {
                    thickness: selected_polygon.stroke.thickness,
                    fill: [
                      selected_polygon.stroke.fill[0],
                      selected_polygon.stroke.fill[1],
                      colorToWgpu(new_value),
                      selected_polygon.stroke.fill[3],
                    ],
                  },
                  camera
                );
              }
            }
          }
        }
      }
    } else {
      console.info("No polygon found with the selected ID: {}", selected_id);
    }
  }

  update_text(
    selected_id: string,
    key: string,
    new_value_type: InputValue,
    new_value: number
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    // First iteration: find the index of the selected polygon
    let text_index = this.textItems.findIndex((p) => p.id == selected_id);

    if (text_index) {
      console.info("Found selected text with ID: {}", selected_id);

      // Get the necessary data from editor
      let viewport_width = camera.windowSize.width;
      let viewport_height = camera.windowSize.height;
      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;
      // Second iteration: update the selected polygon
      if (this.textItems[text_index]) {
        let selected_text = this.textItems[text_index];

        switch (new_value_type) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                selected_text.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [new_value, selected_text.dimensions[1]],
                  camera
                );
              }
              case "height": {
                selected_text.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [selected_text.dimensions[0], new_value],
                  camera
                );
              }
              case "red_fill": {
                selected_text.backgroundPolygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    new_value,
                    selected_text.backgroundPolygon.fill[1],
                    selected_text.backgroundPolygon.fill[2],
                    selected_text.backgroundPolygon.fill[3],
                  ],
                  camera
                );
              }
              case "green_fill": {
                selected_text.backgroundPolygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_text.backgroundPolygon.fill[0],
                    new_value,
                    selected_text.backgroundPolygon.fill[2],
                    selected_text.backgroundPolygon.fill[3],
                  ],
                  camera
                );
              }
              case "blue_fill": {
                selected_text.backgroundPolygon.updateDataFromFill(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [
                    selected_text.backgroundPolygon.fill[0],
                    selected_text.backgroundPolygon.fill[1],
                    new_value,
                    selected_text.backgroundPolygon.fill[3],
                  ],
                  camera
                );
              }
            }
          }
        }
      }
    } else {
      console.info("No text found with the selected ID: {}", selected_id);
    }
  }

  update_image(
    selected_id: string,
    key: string,
    new_value_type: InputValue,
    new_value: number
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    // First iteration: find the index of the selected polygon
    let image_index = this.imageItems.findIndex((p) => p.id == selected_id);

    if (image_index) {
      console.info("Found selected image with ID: {}", selected_id);

      // Get the necessary data from editor
      let viewport_width = camera.windowSize.width;
      let viewport_height = camera.windowSize.height;
      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;
      // Second iteration: update the selected polygon
      if (this.imageItems[image_index]) {
        let selected_image = this.imageItems[image_index];

        switch (new_value_type) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                selected_image.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [new_value as number, selected_image.dimensions[1] as number]
                  //   camera
                );
              }
              case "height": {
                selected_image.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [selected_image.dimensions[0] as number, new_value as number]
                  //   camera
                );
              }
            }
          }
        }
      }
    } else {
      console.info("No image found with the selected ID: {}", selected_id);
    }
  }

  update_video(
    selected_id: string,
    key: string,
    new_value_type: InputValue,
    new_value: number
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    // First iteration: find the index of the selected polygon
    let video_index = this.videoItems.findIndex((p) => p.id == selected_id);

    if (video_index) {
      console.info("Found selected video with ID: {}", selected_id);

      // Get the necessary data from editor
      let viewport_width = camera.windowSize.width;
      let viewport_height = camera.windowSize.height;
      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;
      // Second iteration: update the selected polygon
      if (this.videoItems[video_index]) {
        let selected_video = this.videoItems[video_index];

        switch (new_value) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                selected_video.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [new_value as number, selected_video.dimensions[1] as number]
                  //   camera
                );
              }
              case "height": {
                selected_video.updateDataFromDimensions(
                  windowSize,
                  device,
                  queue,
                  this.modelBindGroupLayout,
                  [selected_video.dimensions[0] as number, new_value as number]
                  //   camera
                );
              }
            }
          }
        }
      }
    } else {
      console.info("No image found with the selected ID: {}", selected_id);
    }
  }

  get_object_width(selected_id: string, object_type: ObjectType): number {
    switch (object_type) {
      case ObjectType.Polygon: {
        let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

        if (polygon_index) {
          if (this.polygons[polygon_index]) {
            let selected_polygon = this.polygons[polygon_index];
            return selected_polygon.dimensions[0];
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.TextItem: {
        let polygon_index = this.textItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.textItems[polygon_index]) {
            let selected_polygon = this.textItems[polygon_index];
            return selected_polygon.dimensions[0];
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.ImageItem: {
        let polygon_index = this.imageItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.imageItems[polygon_index]) {
            let selected_polygon = this.imageItems[polygon_index];
            return selected_polygon.dimensions[0] as number;
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.VideoItem: {
        let polygon_index = this.videoItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.videoItems[polygon_index]) {
            let selected_polygon = this.videoItems[polygon_index];
            return selected_polygon.dimensions[0] as number;
          } else {
            return 0.0;
          }
        }
      }
    }

    return 0.0;
  }

  get_object_height(selected_id: string, object_type: ObjectType): number {
    switch (object_type) {
      case ObjectType.Polygon: {
        let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

        if (polygon_index) {
          if (this.polygons[polygon_index]) {
            let selected_polygon = this.polygons[polygon_index];
            return selected_polygon.dimensions[1];
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.TextItem: {
        let polygon_index = this.textItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.textItems[polygon_index]) {
            let selected_polygon = this.textItems[polygon_index];
            return selected_polygon.dimensions[1];
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.ImageItem: {
        let polygon_index = this.imageItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.imageItems[polygon_index]) {
            let selected_polygon = this.imageItems[polygon_index];
            return selected_polygon.dimensions[1] as number;
          } else {
            return 0.0;
          }
        }
      }
      case ObjectType.VideoItem: {
        let polygon_index = this.videoItems.findIndex(
          (p) => p.id == selected_id
        );

        if (polygon_index) {
          if (this.videoItems[polygon_index]) {
            let selected_polygon = this.videoItems[polygon_index];
            return selected_polygon.dimensions[1] as number;
          } else {
            return 0.0;
          }
        }
      }
    }

    return 0.0;
  }

  get_fill_red(selected_id: string): number {
    let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.textItems[polygon_index]) {
        let selected_polygon = this.textItems[polygon_index];
        return selected_polygon.backgroundPolygon.fill[0];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_fill_green(selected_id: string): number {
    let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.textItems[polygon_index]) {
        let selected_polygon = this.textItems[polygon_index];
        return selected_polygon.backgroundPolygon.fill[1];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_fill_blue(selected_id: string): number {
    let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.textItems[polygon_index]) {
        let selected_polygon = this.textItems[polygon_index];
        return selected_polygon.backgroundPolygon.fill[2];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_background_red(selected_id: string): number {
    let polygon_index = this.staticPolygons.findIndex(
      (p) => p.id == selected_id
    );

    if (polygon_index) {
      if (this.staticPolygons[polygon_index]) {
        let selected_polygon = this.staticPolygons[polygon_index];

        return selected_polygon.fill[0];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_background_green(selected_id: string): number {
    let polygon_index = this.staticPolygons.findIndex(
      (p) => p.id == selected_id
    );

    if (polygon_index) {
      if (this.staticPolygons[polygon_index]) {
        let selected_polygon = this.staticPolygons[polygon_index];

        return selected_polygon.fill[1];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_background_blue(selected_id: string): number {
    let polygon_index = this.staticPolygons.findIndex(
      (p) => p.id == selected_id
    );

    if (polygon_index) {
      if (this.staticPolygons[polygon_index]) {
        let selected_polygon = this.staticPolygons[polygon_index];

        return selected_polygon.fill[2];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_red(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.fill[0];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_green(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.fill[1];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_blue(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.fill[2];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_borderRadius(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.borderRadius;
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_stroke_thickness(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.stroke.thickness;
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_stroke_red(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.stroke.fill[0];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_stroke_green(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.stroke.fill[1];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  get_polygon_stroke_blue(selected_id: string): number {
    let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

    if (polygon_index) {
      if (this.polygons[polygon_index]) {
        let selected_polygon = this.polygons[polygon_index];

        return selected_polygon.stroke.fill[2];
      } else {
        return 0.0;
      }
    }

    return 0.0;
  }

  async update_text_fontFamily(font_id: string, selected_text_id: string) {
    let gpuResources = this.gpuResources;
    let new_fontFamily = await this.fontManager.loadFontByName(font_id);

    if (!new_fontFamily) {
      return;
    }

    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.fontFamily = font_id;
    text_item.updateFontFamily(new_fontFamily);
    text_item.renderText(gpuResources.device, gpuResources.queue);
  }

  update_text_color(
    selected_text_id: string,
    color: [number, number, number, number]
  ) {
    let gpuResources = this.gpuResources;
    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.color = color;
    text_item.renderText(gpuResources.device, gpuResources.queue);
  }

  update_text_size(selected_text_id: string, size: number) {
    let gpuResources = this.gpuResources;
    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.fontSize = size;
    text_item.renderText(gpuResources.device, gpuResources.queue);
  }

  update_text_content(selected_text_id: string, content: string) {
    let gpuResources = this.gpuResources;
    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.text = content;
    text_item.renderText(gpuResources.device, gpuResources.queue);
  }

  // handlers
  handle_mouse_down(windowSize: WindowSize, device: GPUDevice) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    if (
      this.lastScreen.x < this.interactiveBounds.min.x ||
      this.lastScreen.x > this.interactiveBounds.max.x ||
      this.lastScreen.y < this.interactiveBounds.min.y ||
      this.lastScreen.y > this.interactiveBounds.max.y
    ) {
      return;
    }

    // First, check if panning
    if (this.controlMode == ControlMode.Pan) {
      this.isPanning = true;
      this.dragStart = this.lastTopLeft;

      return;
    }

    // Next, check if we're clicking on a motion path handle to drag
    // for (poly_index, polygon) of this.staticPolygons {
    //     if polygon.name != "motion_path_handle" {
    //         continue;
    //     }

    //     if polygon.containsPoint(this.lastTopLeft, camera) {
    //         this.draggingPathHandle = (polygon.id);
    //         this.draggingPathObject = polygon.sourcePolygonId;
    //         this.draggingPathKeyframe = polygon.sourceKeyframeId;
    //         this.dragStart = (this.lastTopLeft);

    //         return; // nothing to add to undo stack
    //     }
    // }

    for (let path of this.motionPaths) {
      for (let polygon of path.staticPolygons) {
        // check if we're clicking on a motion path handle to drag
        if (polygon.name == "motion_path_handle") {
          if (polygon.containsPoint(this.lastTopLeft, camera)) {
            this.draggingPathHandle = polygon.id;
            this.draggingPathAssocPath = polygon.sourcePathId;
            this.draggingPathObject = polygon.sourcePolygonId;
            this.draggingPathKeyframe = polygon.sourceKeyframeId;
            this.dragStart = this.lastTopLeft;

            return; // nothing to add to undo stack
          }
        }
        if (polygon.name == "motion_path_segment") {
          if (polygon.containsPoint(this.lastTopLeft, camera)) {
            this.draggingPath = path.id;
            this.draggingPathObject = polygon.sourcePolygonId;
            this.dragStart = this.lastTopLeft;

            return; // nothing to add to undo stack
          }
        }
      }
    }

    // Finally, check for object interation
    let intersecting_objects: [number, InteractionTarget][] = [];

    // Collect intersecting polygons
    for (let polygon of this.polygons) {
      if (polygon.hidden) {
        continue;
      }

      if (polygon.containsPoint(this.lastTopLeft, camera)) {
        intersecting_objects.push([polygon.layer, InteractionTarget.Polygon]);
      }
    }

    // Collect intersecting text items
    for (let text_item of this.textItems) {
      if (text_item.hidden) {
        continue;
      }

      if (text_item.containsPoint(this.lastTopLeft, camera)) {
        intersecting_objects.push([text_item.layer, InteractionTarget.Text]);
      }
    }

    // Collect intersecting image items
    for (let image_item of this.imageItems) {
      if (image_item.hidden) {
        continue;
      }

      if (image_item.containsPoint(this.lastTopLeft)) {
        intersecting_objects.push([image_item.layer, InteractionTarget.Image]);
      }
    }

    // Collect intersecting image items
    for (let video_item of this.videoItems) {
      if (video_item.hidden) {
        continue;
      }

      // console.info("Checking video point");

      if (video_item.containsPoint(this.lastTopLeft)) {
        console.info("Video contains point");
        intersecting_objects.push([video_item.layer, InteractionTarget.Video]);
      }
    }

    // Sort intersecting objects by layer of descending order (highest layer first)
    // intersecting_objects.sort_by(|a, b| b.0.cmp(a.0));

    // sort by lowest layer first, for this system
    // intersecting_objects.sort_by((a, b) a.0.cmp(b.0));
    intersecting_objects.sort((a, b) => a[0] - b[0]);

    // Return the topmost intersecting object, if any
    // let target = intersecting_objects
    //     .into_iter()
    //     .next()
    //     .map(((_, target)) => target);
    let target: InteractionTarget =
      intersecting_objects[intersecting_objects.length - 1][1];
    let index = intersecting_objects[intersecting_objects.length - 1][0];

    // if (target) {
    switch (target) {
      case InteractionTarget.Polygon: {
        let polygon = this.polygons[index];

        this.draggingPolygon = polygon.id;
        this.dragStart = this.lastTopLeft;

        // TODO: make DRY with below
        if (this.handlePolygonClick) {
          let handler_creator = this.handlePolygonClick;
          let handle_click = handler_creator();

          if (!handle_click) {
            return;
          }

          handle_click(polygon.id, {
            id: polygon.id,
            name: polygon.name,
            points: polygon.points,
            dimensions: polygon.dimensions,
            position: {
              x: polygon.transform.position[0],
              y: polygon.transform.position[1],
            },
            borderRadius: polygon.borderRadius,
            fill: polygon.fill,
            stroke: polygon.stroke,
            layer: polygon.layer,
          });
          this.selectedPolygonId = polygon.id;
          // polygon.old_points = polygon.points;
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Text: {
        let text_item = this.textItems[index];

        this.draggingText = text_item.id;
        this.dragStart = this.lastTopLeft;

        // TODO: make DRY with below
        if (this.handleTextClick) {
          let handler_creator = this.handleTextClick;
          let handle_click = handler_creator();

          if (!handle_click) {
            return;
          }

          handle_click(text_item.id, {
            id: text_item.id,
            name: text_item.name,
            text: text_item.text,
            fontFamily: text_item.fontFamily,
            // points: polygon.points,
            dimensions: text_item.dimensions,
            position: {
              x: text_item.transform.position[0],
              y: text_item.transform.position[1],
            },
            layer: text_item.layer,
            color: text_item.color,
            fontSize: text_item.fontSize,
            backgroundFill: [
              wgpuToHuman(text_item.backgroundPolygon.fill[0]) as number,
              wgpuToHuman(text_item.backgroundPolygon.fill[1]) as number,
              wgpuToHuman(text_item.backgroundPolygon.fill[2]) as number,
              wgpuToHuman(text_item.backgroundPolygon.fill[3]) as number,
            ],
            // borderRadius: polygon.borderRadius,
            // fill: polygon.fill,
            // stroke: polygon.stroke,
          });
          this.selectedPolygonId = text_item.id; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Image: {
        let image_item = this.imageItems[index];

        this.draggingImage = image_item.id;
        this.dragStart = this.lastTopLeft;

        // TODO: make DRY with below
        if (this.handleImageClick) {
          let handler_creator = this.handleImageClick;
          let handle_click = handler_creator();

          if (!handle_click) {
            return;
          }

          let uuid = image_item.id;
          handle_click(uuid, {
            id: image_item.id,
            name: image_item.name,
            url: image_item.url,
            // points: polygon.points,
            dimensions: image_item.dimensions,
            position: {
              x: image_item.transform.position[0],
              y: image_item.transform.position[1],
            },
            layer: image_item.layer, // borderRadius: polygon.borderRadius,
            // fill: polygon.fill,
            // stroke: polygon.stroke,
          });
          this.selectedPolygonId = uuid; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Video: {
        let video_item = this.videoItems[index];

        this.draggingVideo = video_item.id;
        this.dragStart = this.lastTopLeft;

        console.info("Video interaction");

        // TODO: make DRY with below
        if (this.handleVideoClick) {
          console.info("Video click");

          let handler_creator = this.handleVideoClick;
          let handle_click = handler_creator();

          if (!handle_click) {
            return;
          }

          let uuid = video_item.id;
          handle_click(uuid, {
            id: video_item.id,
            name: video_item.name,
            path: video_item.path,
            // points: polygon.points,
            dimensions: video_item.dimensions,
            position: {
              x: video_item.transform.position[0],
              y: video_item.transform.position[1],
            },
            layer: video_item.layer,
            mousePath: video_item.mousePath as string, // borderRadius: polygon.borderRadius,
            // fill: polygon.fill,
            // stroke: polygon.stroke,
          });
          this.selectedPolygonId = uuid; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      default:
        const _exhaustiveCheck: never = target;
        console.error("Unhandled InteractionTarget:", target);
    }
    // }

    return;
  }

  handle_mouse_move(
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    x: number,
    y: number
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let mouse_pos = { x, y };
    let ray = visualize_ray_intersection(windowSize, x, y, camera);
    let top_left = ray.top_left;
    // let top_left = camera.screen_to_world(x, y);
    // let top_left = mouse_pos;

    this.globalTopLeft = top_left;
    this.lastScreen = { x, y };

    if (
      this.lastScreen.x < this.interactiveBounds.min.x ||
      this.lastScreen.x > this.interactiveBounds.max.x ||
      this.lastScreen.y < this.interactiveBounds.min.y ||
      this.lastScreen.y > this.interactiveBounds.max.y
    ) {
      // reset when out of bounds
      this.isPanning = false;
      return;
    }

    this.lastTopLeft = top_left;
    // this.ds_ndc_pos = ds_ndc_pos;
    // this.ndc = ds_ndc.ndc;

    // this.last_world = camera.screen_to_world(mouse_pos);

    // this.update_cursor();

    // if (dot) = .cursor_dot {
    //     // let ndc_position = point_to_ndc(this.lastTopLeft, windowSize);
    //     // console.info("move dot {:?}", this.lastTopLeft);
    //     dot.transform
    //         .updatePosition([this.lastTopLeft.x, this.lastTopLeft.y], windowSize);
    // }

    // handle panning
    if (this.controlMode == ControlMode.Pan && this.isPanning) {
      let dx = this.previousTopLeft.x - this.lastTopLeft.x;
      let dy = this.lastTopLeft.y - this.previousTopLeft.y;
      let new_x = camera.position[0] + dx;
      let new_y = camera.position[1] + dy;

      // camera.position = Vector2.new(new_x, new_y);
      let new_position = vec2.create();
      vec2.set(new_position, new_x, new_y);
      camera.position = new_position;

      // this.updateCameraBinding(); // call of render loop, much more efficient
      // this.interactiveBounds = {
      //     max: {
      //         x: this.interactiveBounds.max.x + dx,
      //         y: this.interactiveBounds.max.y + dy,
      //     },
      //     min: {
      //         x: this.interactiveBounds.min.x + dx,
      //         y: this.interactiveBounds.min.y + dy,
      //     },
      // }
    }

    // handle dragging paths
    if (this.draggingPath) {
      if (this.dragStart) {
        this.move_path(
          this.lastTopLeft,
          this.dragStart,
          this.draggingPath,
          windowSize,
          device
        );
      }
    }

    // handle motion path handles
    if (this.draggingPathHandle) {
      if (this.draggingPathAssocPath) {
        if (this.dragStart) {
          // this.move_static_polygon(this.lastTopLeft, start, poly_id, windowSize, device);
          this.move_path_static_polygon(
            this.lastTopLeft,
            this.dragStart,
            this.draggingPathHandle,
            this.draggingPathAssocPath,
            windowSize,
            device
          );
        }
      }
    }

    // handle dragging to move objects (polygons, images, text, etc)
    if (this.draggingPolygon) {
      if (this.dragStart) {
        this.move_polygon(
          this.lastTopLeft,
          this.dragStart,
          this.draggingPolygon,
          windowSize,
          device
        );
      }
    }

    if (this.draggingText) {
      if (this.dragStart) {
        this.move_text(
          this.lastTopLeft,
          this.dragStart,
          this.draggingText,
          windowSize,
          device
        );
      }
    }

    if (this.draggingImage) {
      if (this.dragStart) {
        this.move_image(
          this.lastTopLeft,
          this.dragStart,
          this.draggingImage,
          windowSize,
          device
        );
      }
    }

    if (this.draggingVideo) {
      if (this.dragStart) {
        this.move_video(
          this.lastTopLeft,
          this.dragStart,
          this.draggingVideo,
          windowSize,
          device
        );
      }
    }

    this.previousTopLeft = this.lastTopLeft;
  }

  handle_mouse_up() {
    // let action_edit = None;

    let camera = this.camera;

    if (!camera) {
      return;
    }

    // TODO: does another bounds cause this to get stuck?
    if (
      this.lastScreen.x < this.interactiveBounds.min.x ||
      this.lastScreen.x > this.interactiveBounds.max.x ||
      this.lastScreen.y < this.interactiveBounds.min.y ||
      this.lastScreen.y > this.interactiveBounds.max.y
    ) {
      return;
    }

    // handle object on mouse up
    let object_id = null;
    let active_point = null;
    if (this.draggingPolygon) {
      object_id = this.draggingPolygon;
      let active_polygon = this.polygons.find(
        (p) => p.id == this.draggingPolygon
      );

      if (!active_polygon) {
        return;
      }

      active_point = {
        x: active_polygon.transform.position[0],
        y: active_polygon.transform.position[1],
      };
    } else if (this.draggingImage) {
      object_id = this.draggingImage;
      let active_image = this.imageItems.find(
        (i) => i.id == this.draggingImage
      );

      if (!active_image) {
        return;
      }

      active_point = {
        x: active_image.transform.position[0],
        y: active_image.transform.position[1],
      };
    } else if (this.draggingText) {
      object_id = this.draggingText;
      let active_text = this.textItems.find((t) => t.id == this.draggingText);

      if (!active_text) {
        return;
      }

      active_point = {
        x: active_text.transform.position[0],
        y: active_text.transform.position[1],
      };
    } else if (this.draggingVideo) {
      object_id = this.draggingVideo;
      let active_video = this.videoItems.find(
        (t) => t.id == this.draggingVideo
      );

      if (!active_video) {
        return;
      }

      active_point = {
        x: active_video.transform.position[0],
        y: active_video.transform.position[1],
      };
    }

    if (object_id && active_point) {
      if (this.onMouseUp) {
        let on_up = this.onMouseUp();

        if (!on_up) {
          return;
        }

        // let active_point = active_point;
        let [selected_sequence_data, selected_keyframes] = on_up(object_id, {
          x: active_point.x - CANVAS_HORIZ_OFFSET,
          y: active_point.y - CANVAS_VERT_OFFSET,
        });

        // need some way of seeing if keyframe selected
        // perhaps need some way of opening keyframes explicitly
        // perhaps a toggle between keyframes and layout
        if (selected_keyframes.length > 0) {
          this.updateMotionPaths(selected_sequence_data);
          console.info("Motion Paths updated!");
        }
      }
    }

    // handle handle on mouse up
    let handle_id = this.draggingPathHandle ? this.draggingPathHandle : null;
    let handle_point = null;
    if (handle_id) {
      let active_handle = this.motionPaths
        .map((m) => m.staticPolygons)
        .flat()
        .find((p) => p.id == handle_id);

      if (!active_handle) {
        return;
      }

      handle_point = {
        x: active_handle.transform.position[0],
        y: active_handle.transform.position[1],
      };
    }

    // the object (polygon, text image, etc) related to this motion path handle
    let handle_object_id = this.draggingPathObject
      ? this.draggingPathObject
      : null;
    // the keyframe associated with this motion path handle
    let handle_keyframe_id = this.draggingPathKeyframe
      ? this.draggingPathKeyframe
      : null;
    if (handle_keyframe_id && handle_point) {
      // need to update saved state and motion paths, handle polygon position already updated
      if (this.onHandleMouseUp) {
        let on_up = this.onHandleMouseUp();

        if (!on_up || !handle_object_id) {
          return;
        }

        // let handle_point = handle_point.expect("Couldn't get handle point");
        let [selected_sequence_data, selected_keyframes] = on_up(
          handle_keyframe_id,
          handle_object_id,
          {
            x: handle_point.x - CANVAS_HORIZ_OFFSET,
            y: handle_point.y - CANVAS_VERT_OFFSET,
          }
        );

        // always updated when handle is moved
        this.updateMotionPaths(selected_sequence_data);
        console.info("Motion Paths updated!");
      }
    }

    // handle path mouse up
    if (this.draggingPath) {
      let active_path = this.motionPaths.find((p) => p.id == this.draggingPath);

      if (!active_path) {
        return;
      }

      let path_point = {
        x: active_path.transform.position[0],
        y: active_path.transform.position[1],
      };

      if (this.onPathMouseUp) {
        let on_up = this.onPathMouseUp();

        if (!on_up) {
          return;
        }

        let [selected_sequence_data, selected_keyframes] = on_up(
          this.draggingPath,
          // {
          //     x: path_point.x - 600.0,
          //     y: path_point.y - 50.0,
          // },
          // no offset needed because all relative?
          {
            x: path_point.x,
            y: path_point.y,
          }
        );

        // always updated when handle is moved
        // not necessary to update motion paths here? seems redundant
        // this.updateMotionPaths(selected_sequence_data);
        // console.info("Motion Paths updated!");
      }
    }

    // reset variables
    this.draggingPolygon = null;
    this.draggingText = null;
    this.draggingImage = null;
    this.draggingVideo = null;
    this.dragStart = null;
    this.draggingPath = null;
    this.draggingPathAssocPath = null;
    this.draggingPathHandle = null;
    this.draggingPathObject = null;
    this.draggingPathKeyframe = null;
    this.isPanning = false;

    // this.dragging_edge = None;
    // this.guide_lines.clear();
    // this.update_cursor();

    // action_edit
    return;
  }

  reset_bounds(windowSize: WindowSize) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    // camera.position = Vector2.new(0.0, 0.0);
    camera.position = vec2.create();
    camera.zoom = 1.0;
    this.updateCameraBinding();
    this.interactiveBounds = {
      min: { x: 550.0, y: 0.0 }, // account for aside width, allow for some off-canvas positioning
      max: {
        x: windowSize.width as number,
        // y: windowSize.height as number - 350.0, // 350.0 for timeline space
        y: 550.0, // allow for 50.0 padding below and above the canvas
      },
    };
  }

  move_polygon(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let polygon = this.polygons.find((p) => p.id == poly_id);

    if (!polygon || !this.modelBindGroupLayout) {
      return;
    }

    let new_position = {
      x: polygon.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: polygon.transform.position[1] + dy,
    };

    console.info("move_polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device,
      this.modelBindGroupLayout,
      new_position,
      camera
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_static_polygon(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let polygon = this.staticPolygons.find((p) => p.id == poly_id);

    if (!polygon || !this.modelBindGroupLayout) {
      return;
    }

    let new_position = {
      x: polygon.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: polygon.transform.position[1] + dy,
    };

    console.info("move_polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device,
      this.modelBindGroupLayout,
      new_position,
      camera
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_path_static_polygon(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    path_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let path = this.motionPaths.find((p) => p.id == path_id);

    if (!path) {
      return;
    }

    let polygon = path.staticPolygons.find((p) => p.id == poly_id);

    if (!polygon || !this.modelBindGroupLayout) {
      return;
    }

    let new_position = {
      x: polygon.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: polygon.transform.position[1] + dy,
    };

    console.info("move path polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device,
      this.modelBindGroupLayout,
      new_position,
      camera
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_path(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let path = this.motionPaths.find((p) => p.id == poly_id);

    if (!path || !this.modelBindGroupLayout) {
      return;
    }

    let new_position = {
      x: path.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio? probably not needed now
      y: path.transform.position[1] + dy,
    };

    console.info("move_path {:?}", new_position);

    path.updateDataFromPosition(
      windowSize,
      device,
      this.modelBindGroupLayout,
      new_position,
      camera
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_text(
    mouse_pos: Point,
    start: Point,
    text_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    // let text_item = .textItems[text_index];
    let text_item = this.textItems.find((t) => t.id == text_id);

    if (!text_item) {
      return;
    }

    let new_position = {
      x: text_item.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: text_item.transform.position[1] + dy,
    };

    console.info("move_text {:?}", new_position);

    text_item.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );
    text_item.backgroundPolygon.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_image(
    mouse_pos: Point,
    start: Point,
    image_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    // let image_item = .imageItems[image_index];
    let image_item = this.imageItems.find((i) => i.id == image_id);

    if (!image_item) {
      return;
    }

    let new_position = {
      x: image_item.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: image_item.transform.position[1] + dy,
    };

    console.info("move_image {:?}", new_position);

    image_item.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_video(
    mouse_pos: Point,
    start: Point,
    video_id: string,
    windowSize: WindowSize,
    device: GPUDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    // let image_item = .imageItems[image_index];
    let video_item = this.videoItems.find((i) => i.id == video_id);

    if (!video_item) {
      return;
    }

    let new_position = {
      x: video_item.transform.position[0] + dx * 0.9, // not sure relation with aspect_ratio?
      y: video_item.transform.position[1] + dy,
    };

    console.info("move_video {:?}", new_position);

    video_item.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  // is_close(a: number, b: number, threshold: number): boolean {
  //   return (a - b).abs() < threshold;
  // }

  hide_all_objects() {
    // Remove objects
    this.polygons.forEach((p) => {
      p.hidden = true;
    });
    this.textItems.forEach((t) => {
      t.hidden = true;
    });
    this.imageItems.forEach((i) => {
      i.hidden = true;
    });
    this.videoItems.forEach((v) => {
      v.hidden = true;
    });

    // Remove existing motion path segments
    // this.staticPolygons.retain(|p| {
    //     p.name != "motion_path_segment"
    //          p.name != "motion_path_handle"
    //          p.name != "motion_path_arrow"
    // });

    // Remove existing motion paths
    this.motionPaths = [];
  }
}

export function interpolatePosition(
  start: UIKeyframe,
  end: UIKeyframe,
  time: number
): [number, number] {
  const startPos = start.value.value as [number, number];
  const endPos = end.value.value as [number, number];

  const progress = (() => {
    const total_time = end.time - start.time;
    const current_time = time - start.time;
    const t = current_time / total_time;

    switch (start.easing) {
      case EasingType.Linear:
        return t;
      case EasingType.EaseIn:
        return t * t;
      case EasingType.EaseOut:
        return 1.0 - (1.0 - t) * (1.0 - t);
      case EasingType.EaseInOut:
        return t < 0.5 ? 2.0 * t * t : 1.0 - Math.pow(-2.0 * t + 2.0, 2) / 2.0;
      default:
        return t; // Default case, or throw an error if you want to be stricter
    }
  })();

  switch (start.pathType) {
    case PathType.Linear:
      return [
        Math.round(startPos[0] + (endPos[0] - startPos[0]) * progress),
        Math.round(startPos[1] + (endPos[1] - startPos[1]) * progress),
      ];
    case PathType.Bezier:
      const p0 = [startPos[0], startPos[1]];
      const p3 = [endPos[0], endPos[1]];

      const p1 =
        start.pathType === PathType.Bezier && start.curveData?.controlPoint1
          ? [start.curveData.controlPoint1.x, start.curveData.controlPoint1.y]
          : [p0[0] + (p3[0] - p0[0]) * 0.33, p0[1] + (p3[1] - p0[1]) * 0.33];

      const p2 =
        start.pathType === PathType.Bezier && start.curveData?.controlPoint2
          ? [start.curveData.controlPoint2.x, start.curveData.controlPoint2.y]
          : [p0[0] + (p3[0] - p0[0]) * 0.66, p0[1] + (p3[1] - p0[1]) * 0.66];

      const t = progress;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1.0 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      const x =
        p0[0] * mt3 +
        3.0 * p1[0] * mt2 * t +
        3.0 * p2[0] * mt * t2 +
        p3[0] * t3;
      const y =
        p0[1] * mt3 +
        3.0 * p1[1] * mt2 * t +
        3.0 * p2[1] * mt * t2 +
        p3[1] * t3;

      return [Math.round(x), Math.round(y)];
    default:
      throw new Error("Invalid PathType");
  }
}

export interface IRay {
  top_left: Point;
}

export class Ray implements IRay {
  // Use a class for better type handling
  top_left: Point;

  constructor(top_left: Point) {
    this.top_left = top_left;
  }

  static new(top_left: Point): Ray {
    // Static factory method (optional)
    return new Ray(top_left);
  }
}

export function visualize_ray_intersection(
  windowSize: WindowSize,
  screen_x: number,
  screen_y: number,
  camera: Camera
): Ray {
  const scale_factor = camera.zoom;
  const zoom_center_x = windowSize.width / 2.0;
  const zoom_center_y = windowSize.height / 2.0;

  const translated_screen_x = screen_x - zoom_center_x;
  const translated_screen_y = screen_y - zoom_center_y;

  const zoomed_screen_x = translated_screen_x / scale_factor;
  const zoomed_screen_y = translated_screen_y / scale_factor;

  const scaled_screen_x = zoomed_screen_x + zoom_center_x;
  const scaled_screen_y = zoomed_screen_y + zoom_center_y;

  const pan_offset_x = camera.position[0] * 0.5;
  const pan_offset_y = camera.position[1] * 0.5;

  const top_left: Point = {
    x: scaled_screen_x + pan_offset_x,
    y: scaled_screen_y - pan_offset_y,
  };

  return Ray.new(top_left);
}

export enum InteractionTarget {
  Polygon,
  Text,
  Image,
  Video,
}

export function getColor(color_index: number): number {
  const normalized_index = color_index % 30;
  const shade_index = Math.floor(normalized_index / 3); // Use Math.floor for integer division
  return 155 + shade_index * 10;
}

export function getFullColor(index: number): [number, number, number] {
  const normalized_index = index % 30;

  switch (normalized_index % 3) {
    case 0:
      return [getColor(index), 10, 10];
    case 1:
      return [10, getColor(index), 10];
    case 2:
      return [10, 10, getColor(index)];
    default:
      throw new Error("Unreachable case of get_full_color"); // More appropriate than unreachable!()
  }
}

export enum InputValue {
  Text,
  Number,
  // Points(Vec<Point>),
}

export function getRandomNumber(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
