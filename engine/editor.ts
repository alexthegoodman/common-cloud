const NUM_INFERENCE_FEATURES: number = 7;
export const CANVAS_HORIZ_OFFSET: number = 0.0;
export const CANVAS_VERT_OFFSET: number = 0.0;

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

// Assuming WindowSize is defined elsewhere
export interface WindowSize {
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

export function pointToNdc(point: Point, windowSize: WindowSize): Point {
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

  // Check if there's at least one digit in the string
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

  // Check if there's at least one digit in the string
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
import { SavedTimelineStateConfig, Sequence, UIKeyframe } from "./animations";

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

// Assuming ObjectType is defined elsewhere
export interface ObjectType {
  // Add properties as needed
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

export interface WindowSize {
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
import { Camera, CameraBinding } from "./camera";
import { StImage, StImageConfig } from "./image";
import { StVideo, StVideoConfig } from "./video";

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
        windowSize
        // t.text,
        // config,
        // t.id,
        // saved_sequence.id,
        // camera
      );

      restored_text.hidden = hidden;
      restored_text.renderText(device, queue);

      this.textItems.push(restored_text);

      console.log("Text restored...");
    });

    // saved_sequence.activeImageItems.forEach((i) => {
    //   const position = {
    //     x: CANVAS_HORIZ_OFFSET + i.position.x,
    //     y: CANVAS_VERT_OFFSET + i.position.y,
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
    //     [], // TODO: load in image data
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
    //       // Assuming you have a way to read files in your TS environment (e.g., using fetch or Node.js's fs)
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
    //     x: CANVAS_HORIZ_OFFSET + i.position.x,
    //     y: CANVAS_VERT_OFFSET + i.position.y,
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
}
