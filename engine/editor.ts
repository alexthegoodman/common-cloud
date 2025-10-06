import { Buffer } from "buffer";

export const TEXT_BACKGROUNDS_DEFAULT_HIDDEN = true;

interface BBox {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

function isOverlapping(a: BBox, b: BBox, margin: number = 10): boolean {
  return !(
    (
      a.x + a.width + margin < b.x || // a is left of b
      a.x > b.x + b.width + margin || // a is right of b
      a.y + a.height + margin < b.y || // a is above b
      a.y > b.y + b.height + margin
    ) // a is below b
  );
}

function resolveOverlaps(
  objects: BBox[],
  maxIterations: number = 10,
  pushAmount: number = 20
): BBox[] {
  let moved = true;
  let iterations = 0;

  while (moved && iterations < maxIterations) {
    moved = false;
    iterations++;

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        let a = objects[i];
        let b = objects[j];

        if (isOverlapping(a, b)) {
          moved = true;
          let dx = a.x + a.width / 2 - (b.x + b.width / 2);
          let dy = a.y + a.height / 2 - (b.y + b.height / 2);
          let magnitude = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero

          // Push objects apart
          dx = (dx / magnitude) * pushAmount;
          dy = (dy / magnitude) * pushAmount;

          a.x += dx;
          a.y += dy;
          b.x -= dx;
          b.y -= dy;
        }
      }
    }
  }

  return objects;
}

// // Example usage
// const objects: BoundingBox[] = [
//   { id: "obj1", width: 100, height: 150, x: 100, y: 100 },
//   { id: "obj2", width: 200, height: 100, x: 120, y: 130 },
//   { id: "obj3", width: 120, height: 180, x: 150, y: 160 },
// ];

// const resolvedObjects = resolveOverlaps(objects);
// console.log(resolvedObjects);

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
  BackgroundFill,
  calculateDefaultCurve,
  EasingType,
  ObjectType,
  PathType,
  ProjectSettings,
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
export type PolygonClickHandler = (
  polygon_id: string,
  polygon_config: PolygonConfig
) => void | null;
export type TextItemClickHandler = (text_id: string) => void | null;
export type ImageItemClickHandler = (image_id: string) => void | null;
export type VideoItemClickHandler = (video_id: string) => void | null;
export type Cube3DClickHandler = (
  cube_id: string,
  cube_config: Cube3DConfig
) => void | null;
export type Sphere3DClickHandler = (
  sphere_id: string,
  sphere_config: Sphere3DConfig
) => void | null;
export type Mockup3DClickHandler = (
  mockup_id: string,
  mockup_config: Mockup3DConfig
) => void | null;
export type OnMouseUp = (
  id: string,
  point: Point
) => [Sequence, string[]] | null;
export type OnHandleMouseUp = (
  objectId: string,
  handleId: string,
  point: Point
) => [Sequence | null, string[] | null] | undefined;
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

// import { ControlMode, PolygonClickHandler, TextItemClickHandler, ImageItemClickHandler, VideoItemClickHandler, OnMouseUp, OnHandleMouseUp, OnPathMouseUp } from './control-types';
import { FontManager } from "./font";
import { MotionPath } from "./motionpath";
import { Camera, CameraBinding, WindowSize } from "./camera";
import { StImage, StImageConfig } from "./image";
import { MousePosition, SourceData, StVideo, StVideoConfig } from "./video";
import { vec2 } from "gl-matrix";
import {
  getUploadedImage,
  getUploadedImageData,
  getUploadedVideoData,
} from "../fetchers/projects";
import { RepeatManager } from "./repeater";
import {
  DocumentSize,
  FormattedPage,
  loadFonts,
  MultiPageEditor,
  RenderItem,
} from "./rte";
import EditorState, { SaveTarget } from "./editor_state";
import { Camera3D } from "./3dcamera";
import {
  GPUPolyfill,
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
  PolyfillRenderPipeline,
  WebGpuResources,
} from "./polyfill";
import { UnifiedRichTextEditor } from "./rte-one";
import { ProceduralBrush, BrushConfig } from "./brush";
import { Cube3D, Cube3DConfig } from "./cube3d";
import { Sphere3D, Sphere3DConfig } from "./sphere3d";
import { Mockup3D, Mockup3DConfig } from "./mockup3d";
// import * as fontkit from "fontkit";

export class Editor {
  kind: "editor" | "state" = "editor";

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
  brushes: ProceduralBrush[];
  brushDrawingMode: boolean;
  currentBrush: ProceduralBrush | null;
  cubes3D: Cube3D[];
  spheres3D: Sphere3D[];
  mockups3D: Mockup3D[];
  draggingCube3D: string | null;
  draggingSphere3D: string | null;
  draggingMockup3D: string | null;
  motionPaths: MotionPath[];
  repeatManager: RepeatManager;
  // multiPageEditor: MultiPageEditor | null = null;
  multiPageEditor: UnifiedRichTextEditor | null = null;
  textArea: TextRenderer | null = null;
  textAreaActive: boolean = false;
  target: SaveTarget = SaveTarget.Videos;

  // viewport
  viewport: Viewport;
  handlePolygonClick: PolygonClickHandler | null;
  handleTextClick: TextItemClickHandler | null;
  handleImageClick: ImageItemClickHandler | null;
  handleVideoClick: VideoItemClickHandler | null;
  handleCube3DClick: Cube3DClickHandler | null;
  handleSphere3DClick: Sphere3DClickHandler | null;
  handleMockup3DClick: Mockup3DClickHandler | null;
  scaleMultiplier: number = 1.0;

  window: Window | null;
  camera: Camera3D | null;
  cameraBinding: CameraBinding | null;

  // WebGPU resources
  // gpuResources: WebGpuResources | null;
  // modelBindGroupLayout: PolyfillBindGroupLayout | null;
  // groupBindGroupLayout: PolyfillBindGroupLayout | null;
  // windowSizeBindGroupLayout: PolyfillBindGroupLayout | null;
  // windowSizeBindGroup: PolyfillBindGroup | null;
  // windowSizeBuffer: GPUBuffer | null;
  // renderPipeline: GPURenderPipeline | null;
  gpuResources: GPUPolyfill | null = null;
  modelBindGroupLayout: PolyfillBindGroupLayout | null = null;
  groupBindGroupLayout: PolyfillBindGroupLayout | null = null;
  windowSizeBindGroupLayout: PolyfillBindGroupLayout | null = null;
  windowSizeBindGroup: PolyfillBindGroup | null = null;
  windowSizeBuffer: PolyfillBuffer | null = null;
  renderPipeline: PolyfillRenderPipeline | null = null;

  // Events
  onMouseUp: OnMouseUp | null;
  onHandleMouseUp: OnHandleMouseUp | null;
  onPathMouseUp: OnPathMouseUp | null;
  currentView: string;
  // interactiveBounds: BoundingBox;

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
  gridSnap: number = 10;

  // ai
  generationCount: number;
  generationCurved: boolean;
  generationChoreographed: boolean;
  generationFade: boolean;

  settings: ProjectSettings | null = null;

  constructor(viewport: Viewport) {
    const windowSize = {
      width: viewport.width,
      height: viewport.height,
    };

    this.fontManager = new FontManager();
    this.repeatManager = new RepeatManager();

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
    this.handleCube3DClick = null;
    this.handleSphere3DClick = null;
    this.handleMockup3DClick = null;
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
    // this.gradientBindGroupLayout = null;
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
    this.brushes = [];
    this.brushDrawingMode = false;
    this.currentBrush = null;
    this.cubes3D = [];
    this.spheres3D = [];
    this.mockups3D = [];
    this.draggingCube3D = null;
    this.draggingSphere3D = null;
    this.draggingMockup3D = null;
    this.motionPaths = [];
    this.generationCount = 4;
    this.generationCurved = false;
    this.generationChoreographed = true;
    this.generationFade = true;

    // TODO: update interactive bounds on window resize?
    // this.interactiveBounds = {
    //   min: { x: 0.0, y: 0.0 }, // account for aside width, allow for some off-canvas positioning
    //   max: {
    //     x: windowSize.width,
    //     // y: windowSize.height - 350.0, // 350.0 for timeline space
    //     y: 550.0, // allow for 50.0 padding below and above the canvas
    //   },
    // };
  }

  async initializeRTE() {
    window.Buffer = Buffer;
    window.__canvasRTEInsertCharacterIndex = 0;
    window.__canvasRTEInsertCharacterIndexNl = 0;

    // TODO: double check perf hit of preloading all these fonts
    const fontUrls = this.fontManager.fontData.map((f) => ({
      url: f.path,
      name: f.name,
    }));

    const fontData = await loadFonts(fontUrls);

    const initialDocumentSize: DocumentSize = {
      width: 900,
      height: 1200,
    };

    // const multiPageEditor = new MultiPageEditor(initialDocumentSize, fontData);
    const multiPageEditor = new UnifiedRichTextEditor(
      initialDocumentSize,
      fontData
    );

    this.multiPageEditor = multiPageEditor;
  }

  async initializeTextArea(text_config: TextRendererConfig) {
    if (this.textArea) {
      console.warn("Text area already exists");
      return;
    }

    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera) {
      console.warn("Couldn't find gpu resources");
      return;
    }

    if (
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
      // !this.gradientBindGroupLayout
    ) {
      console.warn("Couldn't find gpu layouts");
      return;
    }

    let device = gpuResources.device;
    let queue = gpuResources.queue;

    let windowSize = camera.windowSize;

    let default_fontFamily = await this.fontManager.loadFontByName(
      text_config.fontFamily
    );

    if (!default_fontFamily) {
      console.warn("Couldn't find default font family");
      return;
    }

    let textArea = new TextRenderer(
      device!,
      queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      text_config,
      default_fontFamily, // load font data ahead of time
      windowSize,
      "",
      camera,
      true
    );

    // text_item.renderText(device!, queue);

    console.info("Set textarea");
    this.textArea = textArea;
  }

  setMasterDoc(
    // doc: RenderItem[],
    renderPages: FormattedPage[],
    optionalInsertIndex = 1,
    runCallback = true
  ) {
    if (!this.multiPageEditor) {
      console.info("No editor");
      return;
    }

    // let currentMasterDoc = this.multiPageEditor.masterDoc;
    // let masterDoc =
    //   optionalInsertIndex && currentMasterDoc
    //     ? [
    //         ...currentMasterDoc.slice(0, optionalInsertIndex), // Keep the elements before the replacement
    //         ...doc, // Insert the new elements
    //         ...currentMasterDoc.slice(optionalInsertIndex + doc.length), // Keep the elements after the replaced portion
    //       ]
    //     : doc;

    // let docByPage = this.multiPageEditor.getJsonByPage(masterDoc);

    this.renderTextNodes(renderPages);
  }

  renderTextNodes(
    // docByPage: { [key: number]: RenderItem[] }
    renderPages: FormattedPage[]
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera) {
      return;
    }

    this.textArea?.renderAreaText(
      gpuResources.device!,
      gpuResources.queue!,
      // docByPage
      renderPages
    );
  }

  private processPrmoptItem(
    item: StImage | StVideo | Polygon | TextRenderer,
    total: number
  ): [string, number] {
    if (item.hidden) {
      return ["", total];
    }

    // Convert coordinates to percentage-based values
    const x = item.transform.position[0] - CANVAS_HORIZ_OFFSET;
    const xPercent = (x / 800.0) * 100.0;
    const y = item.transform.position[1] - CANVAS_VERT_OFFSET;
    const yPercent = (y / 450.0) * 100.0;

    // Build the prompt string for this item
    const promptLine = [
      total.toString(),
      "5",
      item.dimensions[0].toString(),
      item.dimensions[1].toString(),
      Math.round(xPercent).toString(),
      Math.round(yPercent).toString(),
      "0.000", // direction
      "\n",
    ].join(", ");

    return [promptLine, total + 1];
  }

  createInferencePrompt(): string {
    let prompt = "";
    let total = 0;

    // Process each type of item
    for (const itemArrays of [
      this.polygons,
      this.textItems,
      this.imageItems,
      this.videoItems,
    ]) {
      for (const item of itemArrays) {
        if (total > 6) break;

        const [promptLine, newTotal] = this.processPrmoptItem(item, total);
        prompt += promptLine;
        total = newTotal;
      }

      if (total > 6) break;
    }

    console.log("prompt", prompt);

    return prompt;
  }

  private processLayoutPrmoptItem(
    item: StImage | Polygon | TextRenderer,
    total: number
  ): [string, number] {
    if (item.hidden) {
      return ["", total];
    }

    let object_type = 1;
    if (item.objectType === ObjectType.Polygon && item.isCircle) {
      object_type = 4;
    } else if (item.objectType === ObjectType.TextItem && item.isCircle) {
      object_type = 2;
    } else if (item.objectType === ObjectType.ImageItem && item.isCircle) {
      object_type = 6;
    } else if (item.objectType === ObjectType.Polygon) {
      object_type = 3;
    } else if (item.objectType === ObjectType.TextItem) {
      object_type = 1;
    } else if (item.objectType === ObjectType.ImageItem) {
      object_type = 5;
    }

    // Build the prompt string for this item
    const promptLine = [
      total.toString(),
      object_type,
      getRandomNumber(1, 8),
      "\n",
    ].join(",");

    return [promptLine, total + 1];
  }

  createLayoutInferencePrompt(): string {
    let prompt = "";
    let total = 0;

    // Process each type of item
    for (const itemArrays of [
      this.polygons,
      this.textItems,
      this.imageItems,
      // this.videoItems,
    ]) {
      for (const item of itemArrays) {
        if (total > 8) break;

        const [promptLine, newTotal] = this.processLayoutPrmoptItem(
          item,
          total
        );
        prompt += promptLine;
        total = newTotal;
      }

      if (total > 8) break;
    }

    console.log("prompt", prompt);

    return prompt;
  }

  // updateLayoutFromPredictions(
  //   predictions: number[],
  //   curerntSequenceId: string,
  //   sequences: Sequence[]
  // ): Sequence[] {
  //   let gpuResources = this.gpuResources;
  //   let camera = this.camera;

  //   if (!gpuResources || !camera || !this.modelBindGroupLayout) {
  //     return sequences;
  //   }

  //   let prePrediction = 7;
  //   let adjustTotal = 0;
  //   let objects: BBox[] = [];

  //   for (const itemArrays of [
  //     this.polygons,
  //     this.textItems,
  //     this.imageItems,
  //     // this.videoItems,
  //   ]) {
  //     for (const item of itemArrays) {
  //       if (item.hidden) continue;
  //       if (adjustTotal > 8) break;

  //       const itemId = this.getItemId(adjustTotal);
  //       const objectType = this.getObjectType(adjustTotal);

  //       if (!itemId || !objectType) continue; // Skip if ID or type is not found

  //       const baseIdx = adjustTotal * prePrediction;

  //       let new_width = Math.round(predictions[baseIdx + 3] * 0.01 * 900.0);
  //       let new_height = Math.round(predictions[baseIdx + 4] * 0.01 * 1100.0);
  //       let new_x = Math.round(predictions[baseIdx + 5] * 0.01 * 900.0);
  //       let new_y = Math.round(predictions[baseIdx + 6] * 0.01 * 1100.0);

  //       objects.push({
  //         id: itemId,
  //         width: new_width,
  //         height: new_height,
  //         x: new_x,
  //         y: new_y,
  //       });

  //       adjustTotal++;
  //     }
  //   }

  //   const resolvedObjects = resolveOverlaps(objects);

  //   let values_per_prediction = 7;
  //   let total = 0;

  //   // for (const itemArrays of [
  //   //   this.polygons,
  //   //   this.textItems,
  //   //   this.imageItems,
  //   //   // this.videoItems,
  //   // ]) {
  //   for (const item of resolvedObjects) {
  //     if (total > 8) break;

  //     const itemId = item.id;

  //     let isPolygon = this.polygons.findIndex((p) => p.id === itemId);
  //     let isText = this.textItems.findIndex((p) => p.id === itemId);
  //     let isImage = this.imageItems.findIndex((p) => p.id === itemId);

  //     let new_width = item.width;
  //     let new_height = item.height;
  //     let new_x = item.x;
  //     let new_y = item.y;

  //     if (isPolygon > -1) {
  //       let polygon = this.polygons.find((p) => p.id === itemId);

  //       if (!polygon || !this.modelBindGroupLayout) continue;

  //       // polygon.dimensions = [new_width, new_height];
  //       polygon.updateDataFromDimensions(
  //         camera.windowSize,
  //         gpuResources.device!,
  //         gpuResources.queue!,
  //         this.modelBindGroupLayout,
  //         [new_width, new_height],
  //         camera
  //       );
  //       polygon.transform.updatePosition([new_x, new_y], camera.windowSize);
  //       polygon.transform.updateUniformBuffer(
  //         gpuResources.queue!,
  //         camera.windowSize
  //       );

  //       sequences.forEach((s) => {
  //         if (s.id === curerntSequenceId) {
  //           let activePolygon = s.activePolygons.find((p) => p.id === itemId);

  //           if (activePolygon) {
  //             activePolygon.dimensions = [new_width, new_height];
  //             activePolygon.position = {
  //               x: new_x,
  //               y: new_y,
  //             };
  //           }
  //         }
  //       });
  //     } else if (isText > -1) {
  //       let text = this.textItems.find((p) => p.id === itemId);

  //       if (!text || !this.modelBindGroupLayout) continue;

  //       // text.dimensions = [new_width, new_height];
  //       text.updateDataFromDimensions(
  //         camera.windowSize,
  //         gpuResources.device!,
  //         gpuResources.queue!,
  //         this.modelBindGroupLayout,
  //         [new_width, new_height],
  //         camera
  //       );
  //       text.transform.updatePosition([new_x, new_y], camera.windowSize);
  //       text.backgroundPolygon.transform.updatePosition(
  //         [new_x, new_y],
  //         camera.windowSize
  //       );
  //       text.transform.updateUniformBuffer(
  //         gpuResources.queue!,
  //         camera.windowSize
  //       );
  //       text.backgroundPolygon.transform.updateUniformBuffer(
  //         gpuResources.queue!,
  //         camera.windowSize
  //       );

  //       sequences.forEach((s) => {
  //         if (s.id === curerntSequenceId) {
  //           let activeText = s.activeTextItems.find((p) => p.id === itemId);

  //           if (activeText) {
  //             activeText.dimensions = [new_width, new_height];
  //             activeText.position = {
  //               x: new_x,
  //               y: new_y,
  //             };
  //           }
  //         }
  //       });
  //     } else if (isImage > -1) {
  //       let image = this.imageItems.find((p) => p.id === itemId);

  //       if (!image || !this.modelBindGroupLayout) continue;

  //       // image.dimensions = [new_width, new_height];
  //       image.updateDataFromDimensions(
  //         camera.windowSize,
  //         gpuResources.device!,
  //         gpuResources.queue!,
  //         this.modelBindGroupLayout,
  //         [new_width, new_height]
  //         // camera
  //       );
  //       image.transform.updatePosition([new_x, new_y], camera.windowSize);
  //       image.transform.updateUniformBuffer(
  //         gpuResources.queue!,
  //         camera.windowSize
  //       );

  //       sequences.forEach((s) => {
  //         if (s.id === curerntSequenceId) {
  //           let activeImage = s.activeImageItems.find((p) => p.id === itemId);

  //           if (activeImage) {
  //             activeImage.dimensions = [new_width, new_height];
  //             activeImage.position = {
  //               x: new_x,
  //               y: new_y,
  //             };
  //           }
  //         }
  //       });
  //     }

  //     total++;
  //   }
  //   // }

  //   // let values_per_prediction = 7;
  //   // let total = 0;

  //   // for (const itemArrays of [
  //   //   this.polygons,
  //   //   this.textItems,
  //   //   this.imageItems,
  //   //   // this.videoItems,
  //   // ]) {
  //   //   for (const item of itemArrays) {
  //   //     if (item.hidden) continue;
  //   //     if (total > 8) break;

  //   //     const itemId = this.getItemId(total);
  //   //     const objectType = this.getObjectType(total);

  //   //     if (!itemId || !objectType) continue; // Skip if ID or type is not found

  //   //     // TODO: what is baseIdx value? how to calculate?
  //   //     const baseIdx = total * values_per_prediction;

  //   //     let new_width = Math.round(predictions[baseIdx + 3] * 0.01 * 900.0);
  //   //     let new_height = Math.round(predictions[baseIdx + 4] * 0.01 * 1100.0);
  //   //     let new_x = Math.round(predictions[baseIdx + 5] * 0.01 * 900.0);
  //   //     let new_y = Math.round(predictions[baseIdx + 6] * 0.01 * 1100.0);

  //   //     if (objectType === ObjectType.Polygon) {
  //   //       let polygon = this.polygons.find((p) => p.id === itemId);

  //   //       if (!polygon || !this.modelBindGroupLayout) continue;

  //   //       // polygon.dimensions = [new_width, new_height];
  //   //       polygon.updateDataFromDimensions(
  //   //         camera.windowSize,
  //   //         gpuResources.device!,
  //   //         gpuResources.queue!,
  //   //         this.modelBindGroupLayout,
  //   //         [new_width, new_height],
  //   //         camera
  //   //       );
  //   //       polygon.transform.updatePosition([new_x, new_y], camera.windowSize);
  //   //       polygon.transform.updateUniformBuffer(
  //   //         gpuResources.queue!,
  //   //         camera.windowSize
  //   //       );

  //   //       sequences.forEach((s) => {
  //   //         if (s.id === curerntSequenceId) {
  //   //           let activePolygon = s.activePolygons.find((p) => p.id === itemId);

  //   //           if (activePolygon) {
  //   //             activePolygon.dimensions = [new_width, new_height];
  //   //             activePolygon.position = {
  //   //               x: new_x,
  //   //               y: new_y,
  //   //             };
  //   //           }
  //   //         }
  //   //       });
  //   //     } else if (objectType === ObjectType.TextItem) {
  //   //       let text = this.textItems.find((p) => p.id === itemId);

  //   //       if (!text || !this.modelBindGroupLayout) continue;

  //   //       // text.dimensions = [new_width, new_height];
  //   //       text.updateDataFromDimensions(
  //   //         camera.windowSize,
  //   //         gpuResources.device!,
  //   //         gpuResources.queue!,
  //   //         this.modelBindGroupLayout,
  //   //         [new_width, new_height],
  //   //         camera
  //   //       );
  //   //       text.transform.updatePosition([new_x, new_y], camera.windowSize);
  //   //       text.backgroundPolygon.transform.updatePosition(
  //   //         [new_x, new_y],
  //   //         camera.windowSize
  //   //       );
  //   //       text.transform.updateUniformBuffer(
  //   //         gpuResources.queue!,
  //   //         camera.windowSize
  //   //       );
  //   //       text.backgroundPolygon.transform.updateUniformBuffer(
  //   //         gpuResources.queue!,
  //   //         camera.windowSize
  //   //       );

  //   //       sequences.forEach((s) => {
  //   //         if (s.id === curerntSequenceId) {
  //   //           let activeText = s.activeTextItems.find((p) => p.id === itemId);

  //   //           if (activeText) {
  //   //             activeText.dimensions = [new_width, new_height];
  //   //             activeText.position = {
  //   //               x: new_x,
  //   //               y: new_y,
  //   //             };
  //   //           }
  //   //         }
  //   //       });
  //   //     } else if (objectType === ObjectType.ImageItem) {
  //   //       let image = this.imageItems.find((p) => p.id === itemId);

  //   //       if (!image || !this.modelBindGroupLayout) continue;

  //   //       // image.dimensions = [new_width, new_height];
  //   //       image.updateDataFromDimensions(
  //   //         camera.windowSize,
  //   //         gpuResources.device!,
  //   //         gpuResources.queue!,
  //   //         this.modelBindGroupLayout,
  //   //         [new_width, new_height]
  //   //         // camera
  //   //       );
  //   //       image.transform.updatePosition([new_x, new_y], camera.windowSize);
  //   //       image.transform.updateUniformBuffer(
  //   //         gpuResources.queue!,
  //   //         camera.windowSize
  //   //       );

  //   //       sequences.forEach((s) => {
  //   //         if (s.id === curerntSequenceId) {
  //   //           let activeImage = s.activeImageItems.find((p) => p.id === itemId);

  //   //           if (activeImage) {
  //   //             activeImage.dimensions = [new_width, new_height];
  //   //             activeImage.position = {
  //   //               x: new_x,
  //   //               y: new_y,
  //   //             };
  //   //           }
  //   //         }
  //   //       });
  //   //     }

  //   //     total++;
  //   //   }
  //   // }

  //   return sequences;
  // }

  // First, extract prediction parsing into its own function
  parsePredictionsToObjects(
    predictions: number[],
    // getItemId: (idx: number) => string | null,
    // getObjectType: (objectIdx: number) => ObjectType | null
    manager: Editor | EditorState,
    dimensions = {
      width: 900,
      height: 1100,
    }
  ): BBox[] {
    let prePrediction = 7;
    let adjustTotal = 0;
    let objects: BBox[] = [];

    let isState = manager.kind === "state" ? true : false;

    let items =
      manager.kind === "state"
        ? [
            (manager as EditorState).savedState.sequences[0].activePolygons,
            (manager as EditorState).savedState.sequences[0].activeTextItems,
            (manager as EditorState).savedState.sequences[0].activeImageItems,
          ]
        : [this.polygons, this.textItems, this.imageItems];

    console.info("debug items", isState, items);

    for (const itemArrays of items) {
      for (const item of itemArrays) {
        if ((item as any).hidden) continue;
        if (adjustTotal > 8) break;

        const itemId = manager.getItemId(adjustTotal);
        const objectType = manager.getObjectType(adjustTotal);

        console.info("debug item", itemId, objectType, adjustTotal);

        if (!itemId || !objectType) continue;

        const baseIdx = adjustTotal * prePrediction;

        let new_width = Math.round(
          predictions[baseIdx + 3] * 0.01 * dimensions.width
        );
        let new_height = Math.round(
          predictions[baseIdx + 4] * 0.01 * dimensions.height
        );
        let new_x = Math.round(
          predictions[baseIdx + 5] * 0.01 * dimensions.width
        );
        let new_y = Math.round(
          predictions[baseIdx + 6] * 0.01 * dimensions.height
        );

        objects.push({
          id: itemId,
          width: new_width,
          height: new_height,
          x: new_x,
          y: new_y,
        });

        adjustTotal++;
      }
    }

    return resolveOverlaps(objects);
  }

  // Update sequences (pure function - no side effects)
  updateSequencesFromObjects(
    objects: BBox[],
    currentSequenceId: string,
    sequences: Sequence[]
  ): Sequence[] {
    return sequences.map((sequence) => {
      if (sequence.id !== currentSequenceId) {
        return sequence;
      }

      return {
        ...sequence,
        activePolygons: sequence.activePolygons.map((polygon) => {
          const obj = objects.find((o) => o.id === polygon.id);
          if (!obj) return polygon;

          return {
            ...polygon,
            dimensions: [obj.width, obj.height],
            position: { x: obj.x, y: obj.y },
          };
        }),
        activeTextItems: sequence.activeTextItems.map((textItem) => {
          const obj = objects.find((o) => o.id === textItem.id);
          if (!obj) return textItem;

          return {
            ...textItem,
            dimensions: [obj.width, obj.height],
            position: { x: obj.x, y: obj.y },
          };
        }),
        activeImageItems: sequence.activeImageItems.map((imageItem) => {
          const obj = objects.find((o) => o.id === imageItem.id);
          if (!obj) return imageItem;

          return {
            ...imageItem,
            dimensions: [obj.width, obj.height],
            position: { x: obj.x, y: obj.y },
          };
        }),
      };
    });
  }

  // Update GPU resources (side effects)
  private updateGpuResourcesFromObjects(objects: BBox[]): void {
    const { gpuResources, camera, modelBindGroupLayout } = this;

    if (!gpuResources || !camera || !modelBindGroupLayout) {
      return;
    }

    let total = 0;
    for (const obj of objects) {
      if (total > 8) break;

      const { id, width, height, x, y } = obj;

      this.updatePolygonGpuResources(
        id,
        width,
        height,
        x,
        y,
        gpuResources,
        camera,
        modelBindGroupLayout
      );
      this.updateTextGpuResources(
        id,
        width,
        height,
        x,
        y,
        gpuResources,
        camera,
        modelBindGroupLayout
      );
      this.updateImageGpuResources(
        id,
        width,
        height,
        x,
        y,
        gpuResources,
        camera,
        modelBindGroupLayout
      );

      total++;
    }
  }

  // Individual GPU update functions
  private updatePolygonGpuResources(
    itemId: string,
    width: number,
    height: number,
    x: number,
    y: number,
    gpuResources: any,
    camera: any,
    modelBindGroupLayout: any
  ): void {
    const polygonIndex = this.polygons.findIndex((p) => p.id === itemId);
    if (polygonIndex === -1) return;

    const polygon = this.polygons[polygonIndex];
    if (!polygon) return;

    polygon.updateDataFromDimensions(
      camera.windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      modelBindGroupLayout,
      [width, height],
      camera
    );
    polygon.transform.updatePosition([x, y], camera.windowSize);
    polygon.transform.updateUniformBuffer(
      gpuResources.queue!,
      camera.windowSize
    );
  }

  private updateTextGpuResources(
    itemId: string,
    width: number,
    height: number,
    x: number,
    y: number,
    gpuResources: any,
    camera: any,
    modelBindGroupLayout: any
  ): void {
    const textIndex = this.textItems.findIndex((p) => p.id === itemId);
    if (textIndex === -1) return;

    const text = this.textItems[textIndex];
    if (!text) return;

    text.updateDataFromDimensions(
      camera.windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      modelBindGroupLayout,
      [width, height],
      camera
    );
    text.transform.updatePosition([x, y], camera.windowSize);
    text.backgroundPolygon.transform.updatePosition([x, y], camera.windowSize);
    text.transform.updateUniformBuffer(gpuResources.queue!, camera.windowSize);
    text.backgroundPolygon.transform.updateUniformBuffer(
      gpuResources.queue!,
      camera.windowSize
    );
  }

  private updateImageGpuResources(
    itemId: string,
    width: number,
    height: number,
    x: number,
    y: number,
    gpuResources: any,
    camera: any,
    modelBindGroupLayout: any
  ): void {
    const imageIndex = this.imageItems.findIndex((p) => p.id === itemId);
    if (imageIndex === -1) return;

    const image = this.imageItems[imageIndex];
    if (!image) return;

    image.updateDataFromDimensions(
      camera.windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      modelBindGroupLayout,
      [width, height]
    );
    image.transform.updatePosition([x, y], camera.windowSize);
    image.transform.updateUniformBuffer(gpuResources.queue!, camera.windowSize);
  }

  // Main orchestrator function
  updateLayoutFromPredictions(
    predictions: number[],
    currentSequenceId: string,
    sequences: Sequence[]
  ): Sequence[] {
    // Parse predictions into structured objects
    const objects = this.parsePredictionsToObjects(predictions, this);

    // Update GPU resources (side effects)
    this.updateGpuResourcesFromObjects(objects);

    // Return updated sequences (pure)
    return this.updateSequencesFromObjects(
      objects,
      currentSequenceId,
      sequences
    );
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
        device!,
        queue!,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        camera,
        [
          { x: 0.0, y: 0.0 },
          { x: 1.0, y: 0.0 },
          { x: 1.0, y: 1.0 },
          { x: 0.0, y: 1.0 },
        ],
        // { x: p.dimensions[0], y: p.dimensions[1] },
        [
          p.dimensions[0] * this.scaleMultiplier,
          p.dimensions[1] * this.scaleMultiplier,
        ],
        {
          x: p.position.x * this.scaleMultiplier,
          y: p.position.y * this.scaleMultiplier,
        },
        0.0,
        p.borderRadius,
        // [p.fill[0], p.fill[1], p.fill[2], p.fill[3]],
        p.backgroundFill,
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
        saved_sequence.id,
        p.isCircle
      );

      restored_polygon.hidden = hidden;

      this.polygons.push(restored_polygon);

      console.log("Polygon restored...");
    });

    // saved_sequence.activeTextItems.forEach(async (t) => {
    for (let t of saved_sequence.activeTextItems) {
      const position = {
        x: CANVAS_HORIZ_OFFSET + t.position.x * this.scaleMultiplier,
        y: CANVAS_VERT_OFFSET + t.position.y * this.scaleMultiplier,
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
        dimensions: [
          t.dimensions[0] * this.scaleMultiplier,
          t.dimensions[1] * this.scaleMultiplier,
        ],
        position,
        layer: t.layer,
        // color: rgbToWgpu(t.color[0], t.color[1], t.color[2], t.color[3]),
        color: t.color,
        fontSize: t.fontSize * this.scaleMultiplier,
        // backgroundFill: t.backgroundFill
        //   ? rgbToWgpu(
        //       t.backgroundFill[0],
        //       t.backgroundFill[1],
        //       t.backgroundFill[2],
        //       t.backgroundFill[3]
        //     )
        //   : rgbToWgpu(100, 100, 100, 255),
        backgroundFill: t.backgroundFill,
        isCircle: t.isCircle,
      };

      const restored_text = new TextRenderer(
        device!,
        queue!,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        config,
        fontData,
        windowSize,
        // t.text,
        // config,
        // t.id,
        saved_sequence.id,
        camera,
        false
      );

      restored_text.hidden = hidden;
      restored_text.renderText(device!, queue!);

      // Restore text animation if it exists
      if (t.textAnimation) {
        console.log("Restoring text animation for:", t.id, t.textAnimation);
        restored_text.setTextAnimation(t.textAnimation);
      }

      this.textItems.push(restored_text);

      console.log("Text restored...");
    }

    // saved_sequence.activeImageItems.forEach((i) => {
    for (let i of saved_sequence.activeImageItems) {
      const position = {
        x: CANVAS_HORIZ_OFFSET + i.position.x * this.scaleMultiplier,
        y: CANVAS_VERT_OFFSET + i.position.y * this.scaleMultiplier,
      };

      const image_config: StImageConfig = {
        id: i.id,
        name: i.name,
        dimensions: [
          i.dimensions[0] * this.scaleMultiplier,
          i.dimensions[1] * this.scaleMultiplier,
        ],
        url: i.url,
        position,
        layer: i.layer,
        isCircle: i.isCircle,
        borderRadius: i.borderRadius,
      };

      let blob = await getUploadedImageData(i.url);

      const restored_image = new StImage(
        device!,
        queue!,
        i.url,
        blob!, // load of image data
        image_config,
        windowSize,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        -2.0,
        saved_sequence.id,
        hidden
      );

      await restored_image.initialize(
        device!,
        queue!,
        i.url,
        blob!, // load of image data
        image_config,
        windowSize,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        -2.0,
        saved_sequence.id,
        hidden
      );

      // restored_image.hidden = hidden;
      this.imageItems.push(restored_image);
      console.log("Image restored...");
    }

    // saved_sequence.activeVideoItems.forEach((i) => {
    for (let i of saved_sequence.activeVideoItems) {
      // let stored_source_data: SourceData | null = null;
      // let stored_mouse_positions: MousePosition[] | null = null;

      // if (i.mouse_path) {
      //   try {
      //     // Assuming you have a way to read files of your TS environment (e.g., using fetch or Node.js's fs)
      //     const sourceDataPath =
      //       i.mouse_path.substring(0, i.mouse_path.lastIndexOf("/")) +
      //       "/sourceData.json";
      //     const sourceData = // however you read it, you'll need to await, etc.
      //       (stored_source_data = sourceData as SourceData); // parse the json

      //     const mousePositions = // read the mouse position file
      //       (stored_mouse_positions = mousePositions as MousePosition[]); // parse the json
      //   } catch (error) {
      //     console.error("Error reading video data:", error);
      //   }
      // }

      const position = {
        x: CANVAS_HORIZ_OFFSET + i.position.x * this.scaleMultiplier,
        y: CANVAS_VERT_OFFSET + i.position.y * this.scaleMultiplier,
      };

      const video_config: StVideoConfig = {
        id: i.id,
        name: i.name,
        dimensions: [
          i.dimensions[0] * this.scaleMultiplier,
          i.dimensions[1] * this.scaleMultiplier,
        ],
        path: i.path,
        position,
        layer: i.layer,
        borderRadius: i.borderRadius,
        // mousePath: i.mousePath,
      };

      let blob = await getUploadedVideoData(i.path);

      const restored_video = new StVideo(
        device!,
        queue!,
        blob!,
        video_config,
        windowSize,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        -2.0,
        // i.id,
        saved_sequence.id,
        hidden
      );

      await restored_video.initialize(
        device!,
        queue!,
        blob!,
        video_config,
        windowSize,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        // this.gradientBindGroupLayout!,
        -2.0,
        // i.id,
        saved_sequence.id,
        hidden
      );

      // restored_video.hidden = hidden;
      // restored_video.source_data = stored_source_data;
      // restored_video.mouse_positions = stored_mouse_positions;

      // restored_video.drawVideoFrame(device!, queue).catch(console.error); // Handle potential errors

      this.videoItems.push(restored_video);
      console.log("Video restored...");
    }

    // Restore 3D cubes
    if (saved_sequence.activeCubes3D) {
      for (let c of saved_sequence.activeCubes3D) {
        const cube_config: Cube3DConfig = {
          id: c.id,
          name: c.name,
          dimensions: c.dimensions,
          position: {
            x: c.position.x * this.scaleMultiplier,
            y: c.position.y * this.scaleMultiplier,
          },
          rotation: c.rotation,
          backgroundFill: c.backgroundFill,
          layer: c.layer,
        };

        const restored_cube = new Cube3D(
          windowSize,
          device!,
          queue!,
          this.modelBindGroupLayout!,
          this.groupBindGroupLayout!,
          camera,
          cube_config,
          saved_sequence.id
        );

        restored_cube.hidden = hidden;
        this.cubes3D.push(restored_cube);
        console.log("Cube3D restored...");
      }
    }

    // Restore 3D spheres
    if (saved_sequence.activeSpheres3D) {
      for (let s of saved_sequence.activeSpheres3D) {
        const sphere_config: Sphere3DConfig = {
          id: s.id,
          name: s.name,
          radius: s.radius,
          position: {
            x: s.position.x * this.scaleMultiplier,
            y: s.position.y * this.scaleMultiplier,
          },
          rotation: s.rotation,
          backgroundFill: s.backgroundFill,
          layer: s.layer,
          segments: s.segments,
        };

        const restored_sphere = new Sphere3D(
          windowSize,
          device!,
          queue!,
          this.modelBindGroupLayout!,
          this.groupBindGroupLayout!,
          camera,
          sphere_config,
          saved_sequence.id
        );

        restored_sphere.hidden = hidden;
        this.spheres3D.push(restored_sphere);
        console.log("Sphere3D restored...");
      }
    }

    // Restore 3D Mockups
    if (saved_sequence.activeMockups3D) {
      for (let s of saved_sequence.activeMockups3D) {
        const mockup_config: Mockup3DConfig = {
          id: s.id,
          name: s.name,
          dimensions: s.dimensions,
          position: {
            x: s.position.x * this.scaleMultiplier,
            y: s.position.y * this.scaleMultiplier,
          },
          rotation: s.rotation,
          backgroundFill: s.backgroundFill,
          layer: s.layer,
          videoChild: s.videoChild,
        };

        const restored_mockup = new Mockup3D(
          windowSize,
          device!,
          queue!,
          this.modelBindGroupLayout!,
          this.groupBindGroupLayout!,
          camera,
          mockup_config,
          saved_sequence.id
        );

        const i = s.videoChild;

        // TODO: initialize the video class as is done above in this function and attach to the restored_mockup
        const position = {
          x: CANVAS_HORIZ_OFFSET + i.position.x * this.scaleMultiplier,
          y: CANVAS_VERT_OFFSET + i.position.y * this.scaleMultiplier,
        };

        const ndcPoint = {
          x: (position.x / camera.windowSize.width) * 2.0 - 1.0,
          y: -((position.y / camera.windowSize.height) * 2.0 - 1.0),
        };

        let dimensions = [
          i.dimensions[0] * this.scaleMultiplier,
          i.dimensions[1] * this.scaleMultiplier,
        ] as [number, number];

        const ndcDimensions = [
          (dimensions[0] / camera.windowSize.width) * 2.0 - 1.0,
          -((dimensions[1] / camera.windowSize.height) * 2.0 - 1.0),
        ] as [number, number];

        const video_config: StVideoConfig = {
          id: i.id,
          name: i.name,
          dimensions: dimensions,
          path: i.path,
          // position: ndcPoint,
          position,
          layer: i.layer,
          borderRadius: i.borderRadius,
          // mousePath: i.mousePath,
        };

        let blob = await getUploadedVideoData(i.path);

        const restored_video = new StVideo(
          device!,
          queue!,
          blob!,
          video_config,
          windowSize,
          this.modelBindGroupLayout!,
          this.groupBindGroupLayout!,
          // this.gradientBindGroupLayout!,
          -2.0,
          // i.id,
          saved_sequence.id,
          hidden,
          7
        );

        await restored_video.initialize(
          device!,
          queue!,
          blob!,
          video_config,
          windowSize,
          this.modelBindGroupLayout!,
          this.groupBindGroupLayout!,
          // this.gradientBindGroupLayout!,
          -2.0,
          // i.id,
          saved_sequence.id,
          hidden
        );

        restored_mockup.videoChild = restored_video;

        restored_mockup.videoChild.transform.layer =
          restored_mockup.videoChild.transform.layer + 0.3;

        restored_mockup.updateVideoChildTransform(
          this.gpuResources?.queue!,
          this.camera?.windowSize!
        );

        restored_mockup.hidden = hidden;
        this.mockups3D.push(restored_mockup);
        console.log("Sphere3D restored...");
      }
    }
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

        polygon.transform.position[0] =
          p.position.x + CANVAS_HORIZ_OFFSET * this.scaleMultiplier;
        polygon.transform.position[1] =
          p.position.y + CANVAS_VERT_OFFSET * this.scaleMultiplier;
        polygon.transform.rotation = 0.0;
        polygon.transform.updateScale([1.0, 1.0]);

        polygon.transform.updateUniformBuffer(
          gpu_resources.queue!,
          camera.windowSize
        );
        polygon.updateOpacity(gpu_resources.queue!, 1.0);
      });

      this.currentSequenceData.activeTextItems.forEach((t) => {
        const text = this.textItems.find((text) => text.id === t.id);
        if (!text) {
          throw new Error("Couldn't find text");
        }

        text.transform.position[0] =
          t.position.x + CANVAS_HORIZ_OFFSET * this.scaleMultiplier;
        text.transform.position[1] =
          t.position.y + CANVAS_VERT_OFFSET * this.scaleMultiplier;
        text.transform.rotation = 0.0;

        text.transform.updateUniformBuffer(
          gpu_resources.queue!,
          camera.windowSize
        );
        text.updateOpacity(gpu_resources.queue!, 1.0);

        text.backgroundPolygon.transform.position[0] =
          t.position.x + CANVAS_HORIZ_OFFSET;
        text.backgroundPolygon.transform.position[1] =
          t.position.y + CANVAS_VERT_OFFSET;
        text.backgroundPolygon.transform.rotation = 0.0;

        text.backgroundPolygon.transform.updateUniformBuffer(
          gpu_resources.queue!,
          camera.windowSize
        );
        text.backgroundPolygon.updateOpacity(gpu_resources.queue!, 1.0);
      });

      this.currentSequenceData.activeImageItems.forEach((i) => {
        const image = this.imageItems.find((image) => image.id === i.id);
        if (!image) {
          throw new Error("Couldn't find image");
        }

        image.transform.position[0] =
          i.position.x + CANVAS_HORIZ_OFFSET * this.scaleMultiplier;
        image.transform.position[1] =
          i.position.y + CANVAS_VERT_OFFSET * this.scaleMultiplier;
        image.transform.rotation = 0.0;

        image.transform.updateUniformBuffer(
          gpu_resources.queue!,
          camera.windowSize
        );
        image.updateOpacity(gpu_resources.queue!, 1.0);
      });

      this.currentSequenceData.activeVideoItems.forEach((i) => {
        const video = this.videoItems.find((video) => video.id === i.id);
        if (!video) {
          throw new Error("Couldn't find video");
        }

        // video.transform.position[0] = i.position.x + CANVAS_HORIZ_OFFSET;
        // video.transform.position[1] = i.position.y + CANVAS_VERT_OFFSET;
        // video.transform.rotation = 0.0;

        // video.transform.updateUniformBuffer(
        //   gpu_resources.queue!,
        //   camera.windowSize
        // );

        video.groupTransform.position[0] =
          i.position.x + CANVAS_HORIZ_OFFSET * this.scaleMultiplier;
        video.groupTransform.position[1] =
          i.position.y + CANVAS_VERT_OFFSET * this.scaleMultiplier;
        video.groupTransform.rotation = 0.0;

        video.groupTransform.updateUniformBuffer(
          gpu_resources.queue!,
          camera.windowSize
        );

        video.updateOpacity(gpu_resources.queue!, 1.0);

        video.resetPlayback();
      });
    }
  }

  clearCanvas() {
    this.reset_sequence_objects();
    this.hide_all_objects();

    this.currentSequenceData = null;
  }

  getCurrentPositions() {
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
          video.groupTransform.position[0] - CANVAS_HORIZ_OFFSET,
          video.groupTransform.position[1] - CANVAS_VERT_OFFSET,
        ]);
        total++;
      }
    }

    return current_positions;
  }

  createMotionPathsFromPredictions(
    predictions: number[],
    current_positions: [number, number, number, number][],
    // getItemId: (idx: number) => string | null,
    // getObjectType: (objectIdx: number) => ObjectType | null
    manager: Editor | EditorState,
    dimensions = {
      width: 800,
      height: 450,
    }
  ): AnimationData[] {
    const animation_data_vec: AnimationData[] = [];
    const values_per_prediction = NUM_INFERENCE_FEATURES;
    const keyframes_per_object = 6;

    const timestamp_diffs = [0.0, 2500.0, 5000.0, -5000.0, -2500.0, 0.0];

    const total_predictions = predictions.length;
    const num_objects =
      total_predictions / (values_per_prediction * keyframes_per_object);

    console.info(
      "createMotionPathsFromPredictions",
      total_predictions,
      num_objects,
      this.generationChoreographed,
      this.generationFade,
      this.generationCurved
    );

    let longest_path: number | null = 0;
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

          const x = Math.round(
            predictions[base_idx + 4] * 0.01 * dimensions.width
          );
          const y = Math.round(
            predictions[base_idx + 5] * 0.01 * dimensions.height
          );

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
      const itemId = manager.getItemId(object_idx);
      const objectType = manager.getObjectType(object_idx);

      if (!itemId || !objectType) continue; // Skip if ID or type is not found

      console.info("processing item", itemId, objectType);

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
        ? longest_path
        : object_idx; // Use nullish coalescing

      const positionKeyframes: UIKeyframe[] = [];

      const [, , currentX, currentY] = current_positions[object_idx];

      const rangeCenterIdx =
        pathSourceIdx * (values_per_prediction * keyframes_per_object) +
        2 * values_per_prediction;

      console.info("rangeCenterIdx", rangeCenterIdx);

      const centerX = Math.round(
        predictions[rangeCenterIdx + 4] * 0.01 * dimensions.width
      );
      const centerY = Math.round(
        predictions[rangeCenterIdx + 5] * 0.01 * dimensions.height
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

        console.info("baseIdx", baseIdx);

        if (baseIdx + 5 >= predictions.length) {
          continue;
        }

        const predictedX =
          Math.round(predictions[baseIdx + 4] * 0.01 * dimensions.width) +
          offsetX;
        const predictedY =
          Math.round(predictions[baseIdx + 5] * 0.01 * dimensions.height) +
          offsetY;

        const timestamp =
          keyframeTimeIdx < 3
            ? timestamp_diffs[keyframeTimeIdx]
            : totalDuration + timestamp_diffs[keyframeTimeIdx];

        console.info("key time", keyframeTimeIdx, timestamp);

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

      console.info("pre split", positionKeyframes);

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

      console.info("final positions", final_position_keyframes);

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
            name: "Scale X",
            propertyPath: "scalex",
            children: [],
            keyframes: timestamps.map((t) => ({
              id: uuidv4(),
              time: t,
              value: {
                type: "ScaleX",
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
            name: "Scale Y",
            propertyPath: "scaley",
            children: [],
            keyframes: timestamps.map((t) => ({
              id: uuidv4(),
              time: t,
              value: {
                type: "ScaleY",
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
          let keyframes = [] as UIKeyframe[];
          let entries = timestamps.entries() as any;
          entries.forEach(([i, t]: [number, number]) =>
            keyframes.push({
              id: uuidv4(),
              time: t,
              value: {
                type: "Zoom",
                value: {
                  position: [i * 20, i * 20],
                  zoomLevel: i === 0 ? 100 : 135,
                },
              },
              easing: EasingType.EaseInOut,
              pathType: PathType.Linear,
              keyType: { type: "Frame" },
              curveData: null,
            })
          );

          properties.push({
            name: "Zoom / Popout",
            propertyPath: "zoom",
            children: [],
            keyframes,
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
      // console.warn("no data");
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
      // console.warn("no data");
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
      if (ts.trackType !== TrackType.Video) {
        continue;
      }

      // Find the duration of the sequence
      const durationMs =
        videoCurrentSequencesData.find((s) => s.id === ts.sequenceId)
          ?.durationMs || 0;

      // Check if this sequence should be playing at the current time
      if (
        currentTimeMs >= ts.startTimeMs &&
        currentTimeMs < ts.startTimeMs + durationMs
      ) {
        // Find the corresponding sequence data
        const sequence = videoCurrentSequencesData.find(
          (s) => s.id === ts.sequenceId
        );

        // console.info("checking mark", sequence);

        if (sequence) {
          // Calculate local time within this sequence
          const sequenceLocalTime = (currentTimeMs - ts.startTimeMs) / 1000;

          if (this.currentSequenceData) {
            // Check id to avoid unnecessary cloning
            if (sequence.id !== this.currentSequenceData.id) {
              this.currentSequenceData = sequence;

              // Set hidden attribute on relevant objects
              const currentSequenceId = sequence.id;

              // console.info("mark unhidden");

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
        } else {
          // console.warn("no data");
        }
      }
    }

    if (updateBackground && this.currentSequenceData) {
      const backgroundFill = this.currentSequenceData.backgroundFill;

      if (!backgroundFill) {
        return;
      }

      let camera = this.camera;

      if (!camera) return;

      let backgroundSize: WindowSize = {
        width: (camera.windowSize.width - 50) * this.scaleMultiplier,
        height: (camera.windowSize.height - 50) * this.scaleMultiplier,
      };

      this.replace_background(
        this.currentSequenceData.id,
        backgroundFill,
        backgroundSize
      );
    }
  }

  async stepMotionPathAnimations(
    camera: Camera,
    providedCurrentTimeS?: number
  ): Promise<void> {
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

    // if (providedCurrentTimeS !== undefined) {
    //   console.info("step animations");
    // }

    try {
      await this.stepAnimateSequence(
        totalDt,
        camera,
        providedCurrentTimeS !== undefined
      );
    } catch (error) {
      console.error("Error during stepAnimateSequence:", error);
      throw error; // Re-throw the error to be handled by the caller
    }

    // if (providedCurrentTimeS !== undefined) {
    //   console.info("finished step animations");
    // }
  }

  async stepAnimateSequence(
    totalDt: number,
    camera: Camera,
    isExport: boolean
  ): Promise<void> {
    const gpuResources = this.gpuResources;
    if (!gpuResources) {
      throw new Error("Couldn't get GPU Resources");
    }

    const sequence = this.currentSequenceData;
    if (!sequence || !sequence.polygonMotionPaths || !sequence.durationMs) {
      throw new Error("Couldn't get sequence");
    }

    // if (isExport) {
    //   console.info(
    //     "Exporting sequence animations...",
    //     sequence.polygonMotionPaths
    //   );
    // }

    // Update each animation path
    for (const animation of sequence.polygonMotionPaths) {
      // Group transform position
      const pathGroupPosition = animation.position;

      // Get current time within animation duration
      const currentTime = totalDt % (sequence.durationMs / 1000);
      const startTime = animation.startTimeMs / 1000;
      const currentTimeMs = currentTime * 1000;
      const startTimeMs = startTime * 1000;

      // console.info("animating", animation.objectType, animation.polygonId);

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
        case "Cube3D":
          objectIdx = this.cubes3D.findIndex(
            (c) => c.id === animation.polygonId
          );
          break;
        case "Sphere3D":
          objectIdx = this.spheres3D.findIndex(
            (s) => s.id === animation.polygonId
          );
          break;
      }

      if (objectIdx === undefined || objectIdx === -1) {
        // if (isExport) {
        //   console.warn(
        //     `Object with ID ${animation.polygonId} not found for animation type ${animation.objectType}`
        //   );
        // }
        continue;
      }

      // if (isExport) {
      //   console.info(
      //     `Processing animation for ${animation.objectType} with ID ${animation.polygonId} at time ${currentTimeMs} (start: ${startTimeMs}, duration: ${animation.duration})`
      //   );
      // }

      // Determine whether to draw the video frame based on the frame rate and current time
      let animateProperties = false;

      if (animation.objectType === "VideoItem") {
        const videoItem = this.videoItems[objectIdx];
        const frameRate = videoItem.sourceFrameRate;
        const sourceDurationMs = videoItem.sourceDurationMs;
        const frameInterval = 1.0 / frameRate;

        // Calculate the number of frames that should have been displayed by now
        const elapsedTime = currentTimeMs - startTimeMs;
        const currentFrameTime = videoItem.numFramesDrawn * frameInterval;

        // Only draw the frame if the current time is within the frame's display interval
        if (
          currentTime >= currentFrameTime &&
          currentTime < currentFrameTime + frameInterval
        ) {
          if (currentTime * 1000 + 1000 < sourceDurationMs) {
            // console.info(
            //   `Drawing video frame for ${videoItem.id} at time ${currentTimeMs} (start: ${startTimeMs}, duration: ${animation.duration})`
            // );
            await videoItem.drawVideoFrame(
              gpuResources.device!,
              gpuResources.queue!
            );
            // console.info("drew frame");
            animateProperties = true;
            videoItem.numFramesDrawn += 1;
          }
        } else {
          // Determine how many video frames to draw to catch up
          const difference = currentTime - currentFrameTime;
          const catchUpFrames = Math.floor(difference / frameInterval);

          // Only catch up if we're behind and within the video duration
          if (catchUpFrames > 0 && currentTimeMs + 1000 < sourceDurationMs) {
            // Limit the maximum number of frames to catch up to avoid excessive CPU usage
            const maxCatchUp = 5;
            const framesToDraw = Math.min(catchUpFrames, maxCatchUp);

            // console.info("Catching up video frames:", framesToDraw);

            for (let i = 0; i < framesToDraw; i++) {
              await videoItem.drawVideoFrame(
                gpuResources.device!,
                gpuResources.queue!
              );
              videoItem.numFramesDrawn += 1;
            }

            animateProperties = true;
          }
        }
      } else {
        animateProperties = true;
      }

      // Check if the current time is within the animation's active period
      if (
        currentTimeMs < startTimeMs ||
        currentTimeMs > startTimeMs + animation.duration
      ) {
        // if (isExport) {
        //   console.warn(
        //     `Skipping animation for ${animation.objectType} with ID ${animation.polygonId} at time ${currentTimeMs} (start: ${startTimeMs}, duration: ${animation.duration})`
        //   );
        // }
        continue;
      }

      // if (isExport) {
      //   console.info(
      //     `Processing animation for ${animation.objectType} with ID ${animation.polygonId} at time ${currentTimeMs} (start: ${startTimeMs}, duration: ${animation.duration})`
      //   );
      // }

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
          currentTimeMs - startTimeMs
        );
        if (!surroundingKeyframes) {
          // console.info("no surrounding keyframes");
          continue;
        }

        const [startFrame, endFrame] = surroundingKeyframes;

        if (!startFrame || !endFrame) {
          continue;
        }

        // Calculate interpolation progress
        const duration = endFrame.time - startFrame.time; // duration between keyframes
        const elapsed = currentTimeMs - startTimeMs - startFrame.time; // elapsed since start keyframe
        let progress = elapsed / duration;

        // Apply easing based on keyframe setting
        switch (startFrame.easing) {
          case EasingType.Linear:
            break; // progress stays as is
          case EasingType.EaseIn:
            progress = progress * progress;
            break;
          case EasingType.EaseOut:
            progress = 1.0 - (1.0 - progress) * (1.0 - progress);
            break;
          case EasingType.EaseInOut:
            progress =
              progress < 0.5
                ? 2.0 * progress * progress
                : 1.0 - Math.pow(-2.0 * progress + 2.0, 2) / 2.0;
            break;
          default:
            break; // Default to linear
        }

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

            let posBufferAdjustment = 0;
            if (this.scaleMultiplier > 1) {
              posBufferAdjustment = 100;
            }

            // const positionVec: vec2 = vec2.fromValues(position.x, position.y);
            let positionVec = [
              position.x * this.scaleMultiplier - posBufferAdjustment,
              position.y * this.scaleMultiplier - posBufferAdjustment,
            ] as [number, number];
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
                // console.info("update video transform", positionVec);
                this.videoItems[objectIdx].groupTransform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updatePosition(
                  positionVec,
                  camera.windowSize
                );
                break;
            }
            break;
          }

          case startFrame.value.type === "PerspectiveX" &&
            endFrame.value.type === "PerspectiveX": {
            const start = startFrame.value.value; // Type assertion for clarity
            const end = endFrame.value.value;

            const x = this.lerp(start, end, progress) * 0.01;

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (
                  this.polygons[objectIdx] as Polygon
                ).transform.updateRotationXDegrees(x);
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateRotationXDegrees(x);
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updateRotationXDegrees(x);
                break;
              case ObjectType.ImageItem:
                this.imageItems[objectIdx].transform.updateRotationXDegrees(x);
                break;
              case ObjectType.VideoItem:
                // console.info("update video transform", positionVec);
                this.videoItems[
                  objectIdx
                ].groupTransform.updateRotationXDegrees(x);
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updateRotationXDegrees(x);
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updateRotationXDegrees(x);
                break;
            }
            break;
          }

          case startFrame.value.type === "PerspectiveY" &&
            endFrame.value.type === "PerspectiveY": {
            const start = startFrame.value.value; // Type assertion for clarity
            const end = endFrame.value.value;

            const y = this.lerp(start, end, progress) * 0.01;

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (
                  this.polygons[objectIdx] as Polygon
                ).transform.updateRotationYDegrees(y);
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateRotationYDegrees(y);
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updateRotationYDegrees(y);
                break;
              case ObjectType.ImageItem:
                this.imageItems[objectIdx].transform.updateRotationYDegrees(y);
                break;
              case ObjectType.VideoItem:
                // console.info("update video transform", positionVec);
                this.videoItems[
                  objectIdx
                ].groupTransform.updateRotationYDegrees(y);
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updateRotationYDegrees(y);
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updateRotationYDegrees(y);
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
                this.videoItems[objectIdx].groupTransform.updateRotation(
                  new_rotation_rad
                );
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updateRotation(
                  new_rotation_rad
                );
                break;
            }
            break;
          }
          case startFrame.value.type === "ScaleX" &&
            endFrame.value.type === "ScaleX": {
            const start = startFrame.value.value as number;
            const end = endFrame.value.value as number;
            const new_scale = this.lerp(start, end, progress) / 100.0;
            // const scaleVec: vec2 = vec2.fromValues(new_scale, new_scale); // Create scale vector
            const scaleVec = [new_scale, new_scale] as [number, number];

            // console.info("scaling to", new_scale, scaleVec);

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (this.polygons[objectIdx] as Polygon).transform.updateScaleX(
                  new_scale
                );
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateScaleX(new_scale);
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updateScaleX(new_scale);
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
                this.imageItems[objectIdx].transform.updateScaleX(
                  originalScaleImage[0] * new_scale
                );
                break;
              case ObjectType.VideoItem:
                const originalScaleVideo =
                  this.videoItems[objectIdx].dimensions;
                // const scaledVideoDimensions = vec2.fromValues(
                //   originalScaleVideo[0] * new_scale,
                //   originalScaleVideo[1] * new_scale
                // );
                // const scaledVideoDimensions = [
                //   originalScaleVideo[0] * new_scale,
                //   originalScaleVideo[1] * new_scale,
                // ] as [number, number];
                // console.info("scaling", originalScaleVideo, new_scale);
                this.videoItems[objectIdx].groupTransform.updateScaleX(
                  new_scale // only scaleVec needed for group
                );
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updateScaleX(new_scale);
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updateScaleX(new_scale);
                break;
            }
            break;
          }
          case startFrame.value.type === "ScaleY" &&
            endFrame.value.type === "ScaleY": {
            const start = startFrame.value.value as number;
            const end = endFrame.value.value as number;
            const new_scale = this.lerp(start, end, progress) / 100.0;
            // const scaleVec: vec2 = vec2.fromValues(new_scale, new_scale); // Create scale vector
            const scaleVec = [new_scale, new_scale] as [number, number];

            // console.info("scaling to", new_scale, scaleVec);

            switch (animation.objectType) {
              case ObjectType.Polygon:
                (this.polygons[objectIdx] as Polygon).transform.updateScaleY(
                  new_scale
                );
                break;
              case ObjectType.TextItem:
                this.textItems[objectIdx].transform.updateScaleY(new_scale);
                this.textItems[
                  objectIdx
                ].backgroundPolygon.transform.updateScaleY(new_scale);
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
                this.imageItems[objectIdx].transform.updateScaleY(
                  originalScaleImage[1] * new_scale
                );
                break;
              case ObjectType.VideoItem:
                const originalScaleVideo =
                  this.videoItems[objectIdx].dimensions;
                // const scaledVideoDimensions = vec2.fromValues(
                //   originalScaleVideo[0] * new_scale,
                //   originalScaleVideo[1] * new_scale
                // );
                // const scaledVideoDimensions = [
                //   originalScaleVideo[0] * new_scale,
                //   originalScaleVideo[1] * new_scale,
                // ] as [number, number];
                // console.info("scaling", originalScaleVideo, new_scale);
                this.videoItems[objectIdx].groupTransform.updateScaleY(
                  new_scale // only scaleVec needed for group
                );
                break;
              case ObjectType.Cube3D:
                this.cubes3D[objectIdx].transform.updateScaleY(new_scale);
                break;
              case ObjectType.Sphere3D:
                this.spheres3D[objectIdx].transform.updateScaleY(new_scale);
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
                  this.polygons[objectIdx].updateOpacity(queue!, opacity);
                  break;
                case ObjectType.TextItem:
                  this.textItems[objectIdx].updateOpacity(queue!, opacity);
                  this.textItems[objectIdx].backgroundPolygon.updateOpacity(
                    queue!,
                    opacity
                  );
                  break;
                case ObjectType.ImageItem:
                  this.imageItems[objectIdx].updateOpacity(queue!, opacity);
                  break;
                case ObjectType.VideoItem:
                  this.videoItems[objectIdx].updateOpacity(queue!, opacity);
                  break;
                // case ObjectType.Cube3D:
                //   this.cubes3D[objectIdx].updateOpacity(queue!, opacity);
                //   break;
                // case ObjectType.Sphere3D:
                //   this.spheres3D[objectIdx].updateOpacity(queue!, opacity);
                //   break;
              }
            } else {
              console.error("GPU resources not available.");
            }
            break;
          }

          case startFrame.value.type === "Zoom" &&
            endFrame.value.type === "Zoom": {
            const zoom =
              this.lerp(
                startFrame.value.value.zoomLevel,
                endFrame.value.value.zoomLevel,
                progress
              ) / 100.0;

            if (!this.gpuResources) {
              throw new Error("Couldn't get gpu resources");
            }

            if (animation.objectType === ObjectType.VideoItem) {
              const videoItem = this.videoItems[objectIdx];
              let halfVideoWidth =
                videoItem.dimensions[0] / 2.0 / this.scaleMultiplier;
              let halfVideoHeight =
                videoItem.dimensions[1] / 2.0 / this.scaleMultiplier;
              const elapsedMs = currentTimeMs;

              const autoFollowDelay = 150;

              // if (videoItem.mousePositions && videoItem.sourceData) {
              // Check if we need to update the shift points
              const shouldUpdateShift = videoItem.lastShiftTime
                ? elapsedMs - videoItem.lastShiftTime > autoFollowDelay
                : (() => {
                    videoItem.lastShiftTime = elapsedMs;

                    // Get all positions after current time
                    // const relevantPositions = property.keyframes.filter(
                    //   (p) => p.time >= elapsedMs
                    // );

                    // Find first position after delay
                    const endPosition = property.keyframes.find(
                      (p) => p.time > elapsedMs + autoFollowDelay
                    );

                    // Find the position that comes before it
                    const startPosition = property.keyframes.find(
                      (p) => p.time < (endPosition?.time ?? 0)
                    );

                    if (
                      startPosition &&
                      endPosition &&
                      startPosition.value.type === "Zoom" &&
                      endPosition.value.type === "Zoom"
                    ) {
                      videoItem.lastStartPoint = [
                        startPosition.value.value.position[0] + halfVideoWidth,
                        startPosition.value.value.position[1] + halfVideoHeight,
                        startPosition.time,
                      ];
                      videoItem.lastEndPoint = [
                        // ...endPosition.value.value.position,
                        endPosition.value.value.position[0] + halfVideoWidth,
                        endPosition.value.value.position[1] + halfVideoHeight,
                        endPosition.time,
                      ];
                    }

                    return false;
                  })();

              const delayOffset = 500; // time shift
              const minDistance = 30.0; // Min distance to incur change
              let baseAlpha = 0.005; // Your current default value
              let maxAlpha = 0.05; // Maximum blending speed
              let scalingFactor = 0.005; // Controls how quickly alpha increases with distance

              let mousePositions: MousePosition[] = [];
              property.keyframes.forEach((kf) => {
                if (kf.value.type === "Zoom") {
                  mousePositions.push({
                    timestamp: kf.time,
                    point: [
                      kf.value.value.position[0] + halfVideoWidth,
                      kf.value.value.position[1] + halfVideoHeight,
                      kf.time,
                    ],
                  });
                }
              });

              // Update shift points if needed
              if (shouldUpdateShift) {
                // Find current position (after elapsed - delay + offset)
                const startPoint = mousePositions.find(
                  (p) =>
                    p.timestamp > elapsedMs - autoFollowDelay + delayOffset &&
                    p.timestamp < videoItem.sourceDurationMs
                );

                // Find future position (after the first position's timestamp + minimum gap)
                const endPoint = mousePositions.find(
                  (p) =>
                    p.timestamp >
                      (startPoint?.timestamp ?? 0) + autoFollowDelay &&
                    p.timestamp < videoItem.sourceDurationMs
                );

                if (
                  startPoint &&
                  endPoint &&
                  videoItem.lastStartPoint &&
                  videoItem.lastEndPoint
                ) {
                  const dx = startPoint.point[0] - videoItem.lastStartPoint[0];
                  const dy = startPoint.point[1] - videoItem.lastStartPoint[1];
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  const dx2 = endPoint.point[0] - videoItem.lastEndPoint[0];
                  const dy2 = endPoint.point[1] - videoItem.lastEndPoint[1];
                  const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                  if (distance >= minDistance || distance2 >= minDistance) {
                    videoItem.lastShiftTime = elapsedMs;
                    videoItem.lastStartPoint = startPoint.point;
                    videoItem.lastEndPoint = endPoint.point;

                    const maxDistance = Math.max(distance, distance2);
                    const dynamicAlpha =
                      baseAlpha +
                      (maxAlpha - baseAlpha) *
                        (1.0 - Math.exp(-scalingFactor * maxDistance));

                    videoItem.dynamicAlpha = dynamicAlpha;

                    // console.info("update shift points", dynamicAlpha);
                  }
                }
              }

              // Always interpolate between the current shift points
              if (videoItem.lastStartPoint && videoItem.lastEndPoint) {
                // console.info(
                //   "points",
                //   videoItem.lastStartPoint,
                //   videoItem.lastEndPoint
                // );

                const clampedElapsedMs = Math.min(
                  Math.max(elapsedMs, videoItem.lastStartPoint[2]!),
                  videoItem.lastEndPoint[2]!
                );

                const timeProgress =
                  (clampedElapsedMs - videoItem.lastStartPoint[2]!) /
                  (videoItem.lastEndPoint[2]! - videoItem.lastStartPoint[2]!);

                // console.info(
                //   "timeProgerss",
                //   elapsedMs,
                //   clampedElapsedMs,
                //   timeProgress
                // );

                const interpolatedX =
                  videoItem.lastStartPoint[0] +
                  (videoItem.lastEndPoint[0] - videoItem.lastStartPoint[0]) *
                    timeProgress;
                //     *
                // this.scaleMultiplier;
                const interpolatedY =
                  videoItem.lastStartPoint[1] +
                  (videoItem.lastEndPoint[1] - videoItem.lastStartPoint[1]) *
                    timeProgress;
                //     *
                // this.scaleMultiplier;

                // console.info("interpolated", interpolatedX, interpolatedY);

                // const newCenterPoint: Point = {
                //   x:
                //     (interpolatedX / videoItem.sourceDimensions[0]) *
                //     videoItem.dimensions[0],
                //   y:
                //     (interpolatedY / videoItem.sourceDimensions[1]) *
                //     videoItem.dimensions[1],
                // };

                // console.info("newCenterPoint", interpolatedX, interpolatedY);

                // Smooth transition with existing center point
                const blendedCenterPoint = videoItem.lastCenterPoint
                  ? {
                      x:
                        videoItem.lastCenterPoint.x *
                          (1.0 - videoItem.dynamicAlpha) +
                        interpolatedX * videoItem.dynamicAlpha,
                      y:
                        videoItem.lastCenterPoint.y *
                          (1.0 - videoItem.dynamicAlpha) +
                        interpolatedY * videoItem.dynamicAlpha,
                    }
                  : {
                      x: interpolatedX,
                      y: interpolatedY,
                    };

                const scaledCenterPoint = {
                  x: blendedCenterPoint.x * this.scaleMultiplier,
                  y: blendedCenterPoint.y * this.scaleMultiplier,
                };

                // console.info("blendedCenterPoint", blendedCenterPoint);

                videoItem.updateZoom(
                  gpuResources.queue!,
                  zoom,
                  scaledCenterPoint
                );
                videoItem.lastCenterPoint = blendedCenterPoint;

                // this.updateVideoItemPopout(
                //   videoItem,
                //   blendedCenterPoint,
                //   1.5,
                //   { width: 200, height: 200 }
                // );
              }
              // }
            }

            break;
          }

          default:
            break; // Or handle the default case as needed
        }
      }
    }

    // Update text animations
    // console.info("About to call updateTextAnimations, totalDt:", totalDt);
    this.updateTextAnimations(totalDt * 1000, gpuResources.queue!);
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
    objectId: string,
    colorIndex: number
  ): void {
    if (!sequence.polygonMotionPaths) {
      return;
    }

    const animationData = sequence.polygonMotionPaths.find(
      (anim) => anim.polygonId === objectId
    );
    if (!animationData) {
      console.warn(`Couldn't find animation data for object ${objectId}`);
      return;
    }

    const positionProperty = animationData.properties.find(
      (prop) =>
        // prop.name.startsWith("Position")
        prop.propertyPath === "position"
    );
    if (!positionProperty) {
      console.warn(
        `Couldn't create motion path as couldn't find position property for object ${objectId}`
      );
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
      // !this.gradientBindGroupLayout
    ) {
      console.error(
        "Missing required resources for motion path visualization."
      );
      return;
    }

    const motionPath = new MotionPath(
      this.gpuResources.device!,
      this.gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      newId,
      this.camera.windowSize,
      keyframes,
      this.camera,
      sequence,
      colorIndex,
      objectId,
      initialPosition
    );

    this.motionPaths.push(motionPath);

    // add mouse zoom path if available
    const zoomProperty = animationData.properties.find(
      (prop) =>
        // prop.name.startsWith("Position")
        prop.propertyPath === "zoom"
    );
    if (!zoomProperty) {
      // console.warn(`Couldn't find zoom property for object ${objectId}`);
      return;
    } else {
      console.info("Found zoom property for ", objectId);
    }

    // Sort keyframes by time
    const zoomKeyframes = [...zoomProperty.keyframes].sort(
      (a, b) => a.time - b.time
    );

    const animationId = animationData.id; // Directly using string ID
    const initialZoomPosition: [number, number] = animationData.position;

    console.info("creating new zoom path", initialZoomPosition);

    const zoomPath = new MotionPath(
      this.gpuResources.device!,
      this.gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      objectId, // good association? no need to drag full zoom path?
      this.camera.windowSize,
      zoomKeyframes,
      this.camera,
      sequence,
      colorIndex,
      objectId,
      initialZoomPosition
    );

    this.videoItems.forEach((video) => {
      if (video.id === objectId) {
        video.mousePath = zoomPath;
      }
    });
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
      this.cameraBinding.update(this.gpuResources.queue!, this.camera);
    }
  }

  handleWHeel(delta: number, mouse_pos: Point) {
    let camera = this.camera;

    // if (
    //   this.lastScreen.x < this.interactiveBounds.min.x ||
    //   this.lastScreen.x > this.interactiveBounds.max.x ||
    //   this.lastScreen.y < this.interactiveBounds.min.y ||
    //   this.lastScreen.y > this.interactiveBounds.max.y
    // ) {
    //   return;
    // }

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
      // !this.gradientBindGroupLayout
    ) {
      return;
    }

    let polygon = new Polygon(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      camera,
      polygon_config.points,
      polygon_config.dimensions,
      polygon_config.position,
      0.0,
      polygon_config.borderRadius,
      // polygon_config.fill,
      polygon_config.backgroundFill,
      {
        thickness: 2.0,
        fill: rgbToWgpu(0, 0, 0, 255.0),
      },
      0.0,
      polygon_config.layer,
      polygon_name,
      new_id,
      selected_sequence_id,
      polygon_config.isCircle
    );

    this.polygons.push(polygon);
  }

  add_brush(
    brush_config: BrushConfig,
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

    let brush = new ProceduralBrush(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      camera,
      brush_config,
      selected_sequence_id
    );

    this.brushes.push(brush);
    this.currentBrush = brush;
  }

  add_cube3d(
    cube_config: Cube3DConfig,
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

    let cube = new Cube3D(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      camera,
      cube_config,
      selected_sequence_id
    );

    this.cubes3D.push(cube);
  }

  add_sphere3d(
    sphere_config: Sphere3DConfig,
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

    let sphere = new Sphere3D(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      camera,
      sphere_config,
      selected_sequence_id
    );

    this.spheres3D.push(sphere);
  }

  add_mockup3d(
    mockup_config: Mockup3DConfig,
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

    let mockup = new Mockup3D(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      camera,
      mockup_config,
      selected_sequence_id
    );

    this.mockups3D.push(mockup);
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
      console.warn("No resources or camera");
      return;
    }

    if (
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
      // !this.gradientBindGroupLayout
    ) {
      console.warn("No binding layouts");
      return;
    }

    let device = gpuResources.device;
    let queue = gpuResources.queue;

    let windowSize = camera.windowSize;

    let default_fontFamily = await this.fontManager.loadFontByName(
      text_config.fontFamily
    );

    if (!default_fontFamily) {
      console.warn("Cannot load default font family");
      return;
    }

    let text_item = new TextRenderer(
      device!,
      queue!,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      text_config,
      default_fontFamily, // load font data ahead of time
      windowSize,
      selected_sequence_id,
      camera,
      false
    );

    text_item.renderText(device!, queue!);

    this.textItems.push(text_item);
  }

  // Update text animations for all text items
  updateTextAnimations(currentTimeMs: number, queue: PolyfillQueue): void {
    // console.info("Editor.updateTextAnimations called with", this.textItems.length, "text items");

    for (const textItem of this.textItems) {
      // console.info("Checking text item:", textItem.id, "hidden:", textItem.hidden, "hasAnimation:", textItem.hasTextAnimation());
      if (!textItem.hidden && textItem.hasTextAnimation()) {
        // console.info("Calling updateTextAnimation for:", textItem.id);
        textItem.updateTextAnimation(currentTimeMs, queue);
      }
    }
  }

  async add_image_item(
    // windowSize: WindowSize,
    // device: Polyfilldevice!,
    // queue: PolyfillQueue,
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

    if (
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout
      // !this.gradientBindGroupLayout
    ) {
      return;
    }

    let image_item = new StImage(
      device!,
      queue!,
      // path,
      url,
      blob,
      image_config,
      windowSize,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      0.0,
      selected_sequence_id,
      false
    );

    await image_item.initialize(
      device!,
      queue!,
      url,
      blob, // load of image data
      image_config,
      windowSize,
      this.modelBindGroupLayout!,
      this.groupBindGroupLayout!,
      // this.gradientBindGroupLayout!,
      0.0,
      selected_sequence_id,
      false
    );

    this.imageItems.push(image_item);
  }

  async add_video_item(
    // windowSize: WindowSize,
    // device: Polyfilldevice!,
    // queue: PolyfillQueue,
    video_config: StVideoConfig,
    blob: Blob,
    new_id: string,
    selected_sequence_id: string,
    mouse_positions: MousePosition[],
    stored_source_data: SourceData | null
  ) {
    let video_item = await this.create_video_item(
      video_config,
      blob,
      new_id,
      selected_sequence_id,
      mouse_positions,
      stored_source_data
    );

    if (!video_item) {
      return;
    }

    this.videoItems.push(video_item);
  }

  async create_video_item(
    // windowSize: WindowSize,
    // device: Polyfilldevice!,
    // queue: PolyfillQueue,
    video_config: StVideoConfig,
    blob: Blob,
    new_id: string,
    selected_sequence_id: string,
    mouse_positions: MousePosition[],
    stored_source_data: SourceData | null,
    objectTypeShader: number = 3
  ): Promise<StVideo | null> {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    let device = gpuResources?.device;
    let queue = gpuResources?.queue;
    let windowSize = camera?.windowSize;

    if (
      !gpuResources ||
      !camera ||
      !this.modelBindGroupLayout ||
      !this.groupBindGroupLayout ||
      // !this.gradientBindGroupLayout ||
      !device ||
      !queue ||
      !windowSize
    ) {
      return null;
    }

    let video_item = new StVideo(
      device!,
      queue!,
      blob,
      video_config,
      windowSize,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      0.0,
      selected_sequence_id,
      false,
      objectTypeShader
    );

    await video_item.initialize(
      device!,
      queue!,
      blob,
      video_config,
      windowSize,
      this.modelBindGroupLayout,
      this.groupBindGroupLayout,
      // this.gradientBindGroupLayout,
      0.0,
      selected_sequence_id,
      false
    );

    return video_item;
  }

  replace_background(
    sequence_id: string,
    backgroundFill: BackgroundFill,
    backgroundSize: WindowSize
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;
    let modelBindGroupLayout = this.modelBindGroupLayout;
    let groupBindGroupLayout = this.groupBindGroupLayout;
    // let gradientBindGroupLayout = this.gradientBindGroupLayout;

    if (
      !gpuResources ||
      !camera ||
      !modelBindGroupLayout ||
      !groupBindGroupLayout
      // !gradientBindGroupLayout
    ) {
      return;
    }

    console.info("replace background {:?} {:?}", sequence_id, backgroundFill);

    let windowSize = camera.windowSize;

    // Remove existing background
    this.staticPolygons = this.staticPolygons.filter(
      (p) => p.name !== "canvas_background"
    );

    console.info("replace background", backgroundFill);

    let canvas_polygon = new Polygon(
      windowSize,
      gpuResources.device!,
      gpuResources.queue!,
      modelBindGroupLayout,
      groupBindGroupLayout,
      // gradientBindGroupLayout,
      camera,
      [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 },
      ],
      [backgroundSize.width as number, backgroundSize.height as number],
      {
        x: windowSize.width / 2.0,
        y: windowSize.height / 2.0,
      },
      0.0,
      0.0,
      backgroundFill,
      // [0.2, 0.5, 0.2, 0.5],
      {
        thickness: 0.0,
        fill: rgbToWgpu(0, 0, 0, 255.0),
      },
      0.0,
      -89, // camera far is -100
      "canvas_background",
      sequence_id,
      sequence_id,
      false
    );

    console.info("bg poly", canvas_polygon);

    canvas_polygon.transform.updateScale([20, 20]);
    canvas_polygon.transform.layer = -89;
    canvas_polygon.transform.updateUniformBuffer(
      gpuResources.queue!,
      camera.windowSize
    );

    canvas_polygon.updateGradientAnimation(gpuResources.device!, 0.01);

    this.staticPolygons.push(canvas_polygon);
  }

  update_background(
    selected_id: string,
    // key: string,
    // new_value_type: InputValue,
    // new_value: number
    newFill: BackgroundFill
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

    if (polygon_index !== null) {
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

        selected_polygon.updateDataFromFill(
          windowSize,
          device!,
          queue!,
          this.modelBindGroupLayout,
          newFill,
          camera
        );

        // update scale
        selected_polygon.transform.updateScale([20, 20]);
        selected_polygon.transform.layer = -89;
        selected_polygon.transform.updateUniformBuffer(
          gpuResources.queue!,
          camera.windowSize
        );

        // switch (new_value_type) {
        //   case InputValue.Number:
        //     switch (key) {
        //       case "red": {
        //         selected_polygon.updateDataFromFill(
        //           windowSize,
        //           device!,
        //           queue!,
        //           this.modelBindGroupLayout,
        //           [
        //             colorToWgpu(new_value),
        //             selected_polygon.fill[1],
        //             selected_polygon.fill[2],
        //             selected_polygon.fill[3],
        //           ],
        //           camera
        //         );
        //       }
        //       case "green": {
        //         selected_polygon.updateDataFromFill(
        //           windowSize,
        //           device!,
        //           queue!,
        //           this.modelBindGroupLayout,
        //           [
        //             selected_polygon.fill[0],
        //             colorToWgpu(new_value),
        //             selected_polygon.fill[2],
        //             selected_polygon.fill[3],
        //           ],
        //           camera
        //         );
        //       }
        //       case "blue": {
        //         selected_polygon.updateDataFromFill(
        //           windowSize,
        //           device!,
        //           queue!,
        //           this.modelBindGroupLayout,
        //           [
        //             selected_polygon.fill[0],
        //             selected_polygon.fill[1],
        //             colorToWgpu(new_value),
        //             selected_polygon.fill[3],
        //           ],
        //           camera
        //         );
        //       }
        //     }
        // }
      }
    } else {
      console.info(
        "No static_polygon found with the selected ID: {}",
        selected_id
      );
    }
  }

  updateBackgroundFill(
    selected_id: string,
    objectType: ObjectType,
    new_value: BackgroundFill
  ) {
    let gpuResources = this.gpuResources;
    let camera = this.camera;

    if (!gpuResources || !camera || !this.modelBindGroupLayout) {
      return;
    }

    if (objectType === ObjectType.Polygon) {
      let polygon = this.polygons.find((p) => p.id == selected_id);

      if (!polygon) {
        return;
      }

      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;

      polygon.updateDataFromFill(
        windowSize,
        device!,
        queue!,
        this.modelBindGroupLayout,
        new_value,
        camera
      );
    } else if (objectType === ObjectType.TextItem) {
      let text = this.textItems.find((p) => p.id == selected_id);

      if (!text) {
        return;
      }

      let device = gpuResources.device;
      let queue = gpuResources.queue;

      let windowSize = camera.windowSize;

      text.backgroundPolygon.updateDataFromFill(
        windowSize,
        device!,
        queue!,
        this.modelBindGroupLayout,
        new_value,
        camera
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

    if (polygon_index !== null) {
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
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [new_value, selected_polygon.dimensions[1]],
                  camera
                );
                break;
              }
              case "height": {
                selected_polygon.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [selected_polygon.dimensions[0], new_value],
                  camera
                );
                break;
              }
              case "borderRadius": {
                selected_polygon.updateDataFromBorderRadius(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  new_value,
                  camera
                );
                break;
              }
              case "red": {
                if (selected_polygon.backgroundFill.type === "Color") {
                  selected_polygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        new_value,
                        selected_polygon.backgroundFill.value[1],
                        selected_polygon.backgroundFill.value[2],
                        selected_polygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
              }
              case "green": {
                if (selected_polygon.backgroundFill.type === "Color") {
                  selected_polygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        selected_polygon.backgroundFill.value[0],
                        new_value,
                        selected_polygon.backgroundFill.value[2],
                        selected_polygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
              }
              case "blue": {
                if (selected_polygon.backgroundFill.type === "Color") {
                  selected_polygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        selected_polygon.backgroundFill.value[0],
                        selected_polygon.backgroundFill.value[1],
                        new_value,
                        selected_polygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
              }
              case "stroke_thickness": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  {
                    thickness: new_value,
                    fill: selected_polygon.stroke.fill,
                  },
                  camera
                );
                break;
              }
              case "stroke_red": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device!,
                  queue!,
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
                break;
              }
              case "stroke_green": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device!,
                  queue!,
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
                break;
              }
              case "stroke_blue": {
                selected_polygon.updateDataFromStroke(
                  windowSize,
                  device!,
                  queue!,
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
                break;
              }
              case "positionX": {
                selected_polygon.updateDataFromPosition(
                  windowSize,
                  device!,
                  // queue!,
                  this.modelBindGroupLayout,
                  {
                    x: new_value,
                    y: selected_polygon.position.y,
                  },
                  camera
                );
                selected_polygon.transform.updateUniformBuffer(
                  gpuResources.queue!,
                  camera.windowSize
                );
                break;
              }
              case "positionY": {
                selected_polygon.updateDataFromPosition(
                  windowSize,
                  device!,
                  // queue!,
                  this.modelBindGroupLayout,
                  {
                    x: selected_polygon.position.x,
                    y: new_value,
                  },
                  camera
                );
                selected_polygon.transform.updateUniformBuffer(
                  gpuResources.queue!,
                  camera.windowSize
                );
                break;
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

    if (text_index !== null) {
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

        console.info("check 2", key);

        switch (new_value_type) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                console.info("update the width");
                selected_text.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [new_value, selected_text.dimensions[1]],
                  camera
                );
                break;
              }
              case "height": {
                console.info("update the height");
                selected_text.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [selected_text.dimensions[0], new_value],
                  camera
                );
                break;
              }
              case "red_fill": {
                if (
                  selected_text.backgroundPolygon.backgroundFill.type ===
                  "Color"
                ) {
                  selected_text.backgroundPolygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        new_value,
                        selected_text.backgroundPolygon.backgroundFill.value[1],
                        selected_text.backgroundPolygon.backgroundFill.value[2],
                        selected_text.backgroundPolygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
              }
              case "green_fill": {
                if (
                  selected_text.backgroundPolygon.backgroundFill.type ===
                  "Color"
                ) {
                  selected_text.backgroundPolygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        selected_text.backgroundPolygon.backgroundFill.value[0],
                        new_value,
                        selected_text.backgroundPolygon.backgroundFill.value[2],
                        selected_text.backgroundPolygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
              }
              case "blue_fill": {
                if (
                  selected_text.backgroundPolygon.backgroundFill.type ===
                  "Color"
                ) {
                  selected_text.backgroundPolygon.updateDataFromFill(
                    windowSize,
                    device!,
                    queue!,
                    this.modelBindGroupLayout,
                    {
                      type: "Color",
                      value: [
                        selected_text.backgroundPolygon.backgroundFill.value[0],
                        selected_text.backgroundPolygon.backgroundFill.value[1],
                        new_value,
                        selected_text.backgroundPolygon.backgroundFill.value[3],
                      ],
                    },
                    camera
                  );
                }
                break;
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

    if (image_index !== null) {
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
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [new_value as number, selected_image.dimensions[1] as number]
                  //   camera
                );
                break;
              }
              case "height": {
                selected_image.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [selected_image.dimensions[0] as number, new_value as number]
                  //   camera
                );
                break;
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

    if (video_index !== null) {
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

        switch (new_value_type) {
          case InputValue.Number: {
            switch (key) {
              case "width": {
                selected_video.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [new_value as number, selected_video.dimensions[1] as number]
                  //   camera
                );
                break;
              }
              case "height": {
                selected_video.updateDataFromDimensions(
                  windowSize,
                  device!,
                  queue!,
                  this.modelBindGroupLayout,
                  [selected_video.dimensions[0] as number, new_value as number]
                  //   camera
                );
                break;
              }
            }
          }
        }
      }
    } else {
      console.info("No video found with the selected ID: {}", selected_id);
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

  // get_fill_red(selected_id: string): number {
  //   let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.textItems[polygon_index]) {
  //       let selected_polygon = this.textItems[polygon_index];
  //       return selected_polygon.backgroundPolygon.fill[0];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_fill_green(selected_id: string): number {
  //   let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.textItems[polygon_index]) {
  //       let selected_polygon = this.textItems[polygon_index];
  //       return selected_polygon.backgroundPolygon.fill[1];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_fill_blue(selected_id: string): number {
  //   let polygon_index = this.textItems.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.textItems[polygon_index]) {
  //       let selected_polygon = this.textItems[polygon_index];
  //       return selected_polygon.backgroundPolygon.fill[2];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_background_red(selected_id: string): number {
  //   let polygon_index = this.staticPolygons.findIndex(
  //     (p) => p.id == selected_id
  //   );

  //   if (polygon_index) {
  //     if (this.staticPolygons[polygon_index]) {
  //       let selected_polygon = this.staticPolygons[polygon_index];

  //       return selected_polygon.fill[0];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_background_green(selected_id: string): number {
  //   let polygon_index = this.staticPolygons.findIndex(
  //     (p) => p.id == selected_id
  //   );

  //   if (polygon_index) {
  //     if (this.staticPolygons[polygon_index]) {
  //       let selected_polygon = this.staticPolygons[polygon_index];

  //       return selected_polygon.fill[1];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_background_blue(selected_id: string): number {
  //   let polygon_index = this.staticPolygons.findIndex(
  //     (p) => p.id == selected_id
  //   );

  //   if (polygon_index) {
  //     if (this.staticPolygons[polygon_index]) {
  //       let selected_polygon = this.staticPolygons[polygon_index];

  //       return selected_polygon.fill[2];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_polygon_red(selected_id: string): number {
  //   let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.polygons[polygon_index]) {
  //       let selected_polygon = this.polygons[polygon_index];

  //       return selected_polygon.fill[0];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_polygon_green(selected_id: string): number {
  //   let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.polygons[polygon_index]) {
  //       let selected_polygon = this.polygons[polygon_index];

  //       return selected_polygon.fill[1];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

  // get_polygon_blue(selected_id: string): number {
  //   let polygon_index = this.polygons.findIndex((p) => p.id == selected_id);

  //   if (polygon_index) {
  //     if (this.polygons[polygon_index]) {
  //       let selected_polygon = this.polygons[polygon_index];

  //       return selected_polygon.fill[2];
  //     } else {
  //       return 0.0;
  //     }
  //   }

  //   return 0.0;
  // }

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

    console.info("Updating font family... ", font_id);

    text_item.fontFamily = font_id;
    text_item.updateFontFamily(new_fontFamily);
    text_item.renderText(gpuResources.device!, gpuResources.queue!);
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

    console.info("Updating text color...");

    text_item.color = color;
    text_item.renderText(gpuResources.device!, gpuResources.queue!);
  }

  update_text_size(selected_text_id: string, size: number) {
    let gpuResources = this.gpuResources;
    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.fontSize = size;
    text_item.renderText(gpuResources.device!, gpuResources.queue!);
  }

  update_text_content(selected_text_id: string, content: string) {
    let gpuResources = this.gpuResources;
    let text_item = this.textItems.find((t) => t.id == selected_text_id);

    if (!text_item || !gpuResources) {
      return;
    }

    text_item.text = content;
    text_item.renderText(gpuResources.device!, gpuResources.queue!);
  }

  // handlers
  handle_mouse_down(positionX: number, positionY: number) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let ray = visualize_ray_intersection(
      camera.windowSize,
      positionX,
      positionY,
      camera
    );
    let top_left = ray.top_left;
    this.lastTopLeft = top_left;

    // if (
    //   this.lastScreen.x < this.interactiveBounds.min.x ||
    //   this.lastScreen.x > this.interactiveBounds.max.x ||
    //   this.lastScreen.y < this.interactiveBounds.min.y ||
    //   this.lastScreen.y > this.interactiveBounds.max.y
    // ) {
    //   return;
    // }

    // First, check if brush drawing mode
    if (this.brushDrawingMode && this.currentBrush) {
      const brushPoint = {
        x: top_left.x,
        y: top_left.y,
        pressure: 1.0, // Could be read from pointer event if supported
        timestamp: Date.now(),
      };

      // Create a new ProceduralBrush instance for this stroke
      const gpuResources = this.gpuResources;
      const camera = this.camera;
      if (!gpuResources || !camera) {
        return;
      }

      const windowSize = camera.windowSize;
      const config = this.currentBrush.toConfig();
      config.id = `brush_stroke_${Date.now()}_${Math.random()}`;

      const newBrush = new ProceduralBrush(
        windowSize,
        gpuResources.device!,
        gpuResources.queue!,
        this.modelBindGroupLayout!,
        this.groupBindGroupLayout!,
        camera,
        config,
        this.currentBrush.currentSequenceId
      );

      this.brushes.push(newBrush);
      this.currentBrush = newBrush;
      this.currentBrush.startStroke(brushPoint, config);
      return;
    }

    // Next, check if panning
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
    let intersecting_objects: [number, InteractionTarget, number][] = [];

    // Collect intersecting polygons
    for (let [i, polygon] of this.polygons.entries()) {
      if (polygon.hidden) {
        continue;
      }

      if (polygon.containsPoint(this.lastTopLeft, camera)) {
        console.info("polygon contains pointer");
        intersecting_objects.push([
          polygon.layer,
          InteractionTarget.Polygon,
          i,
        ]);
      }
    }

    // Collect intersecting text items
    for (let [i, text_item] of this.textItems.entries()) {
      if (text_item.hidden) {
        continue;
      }

      if (text_item.containsPoint(this.lastTopLeft, camera)) {
        intersecting_objects.push([text_item.layer, InteractionTarget.Text, i]);
      }
    }

    // Collect intersecting image items
    for (let [i, image_item] of this.imageItems.entries()) {
      if (image_item.hidden) {
        continue;
      }

      if (image_item.containsPoint(this.lastTopLeft)) {
        intersecting_objects.push([
          image_item.layer,
          InteractionTarget.Image,
          i,
        ]);
      }
    }

    // Collect intersecting image items
    for (let [i, video_item] of this.videoItems.entries()) {
      if (video_item.hidden) {
        continue;
      }

      // console.info("Checking video point");

      if (video_item.containsPoint(this.lastTopLeft)) {
        console.info("Video contains point");
        intersecting_objects.push([
          video_item.layer,
          InteractionTarget.Video,
          i,
        ]);
      }

      if (video_item.mousePath) {
        for (let polygon of video_item.mousePath.staticPolygons) {
          // check if we're clicking on a motion path handle to drag

          let adjustedPoint: Point = {
            x: this.lastTopLeft.x - video_item.groupTransform.position[0],
            y: this.lastTopLeft.y - video_item.groupTransform.position[1],
          };

          if (polygon.name == "motion_path_handle") {
            if (polygon.containsPoint(adjustedPoint, camera)) {
              // console.info("triggering handle!", polygon.id);

              this.draggingPathHandle = polygon.id;
              this.draggingPathAssocPath = polygon.sourcePathId; // video_item.mousePath.id
              this.draggingPathObject = polygon.sourcePolygonId;
              this.draggingPathKeyframe = polygon.sourceKeyframeId;
              this.dragStart = this.lastTopLeft;

              return; // nothing to add to undo stack
            }
          }
          if (polygon.name == "motion_path_segment") {
            if (polygon.containsPoint(adjustedPoint, camera)) {
              this.draggingPath = video_item.mousePath.id;
              this.draggingPathObject = polygon.sourcePolygonId;
              this.dragStart = this.lastTopLeft;

              return; // nothing to add to undo stack
            }
          }
        }
      }
    }

    // Collect intersecting cubes
    // Convert mouse position to NDC for 3D objects
    const ndcPoint = {
      x: (this.lastTopLeft.x / camera.windowSize.width) * 2.0 - 1.0,
      y: -((this.lastTopLeft.y / camera.windowSize.height) * 2.0 - 1.0),
    };

    for (let [i, cube] of this.cubes3D.entries()) {
      if (cube.hidden) {
        continue;
      }

      if (cube.containsPoint(ndcPoint)) {
        intersecting_objects.push([cube.layer, InteractionTarget.Cube3D, i]);
      }
    }

    // Collect intersecting spheres
    for (let [i, sphere] of this.spheres3D.entries()) {
      if (sphere.hidden) {
        continue;
      }

      if (sphere.containsPoint(ndcPoint)) {
        intersecting_objects.push([
          sphere.layer,
          InteractionTarget.Sphere3D,
          i,
        ]);
      }
    }

    // Collect intersecting mockups
    for (let [i, mockup] of this.mockups3D.entries()) {
      if (mockup.hidden) {
        continue;
      }

      if (mockup.containsPoint(ndcPoint, this.camera?.windowSize!)) {
        intersecting_objects.push([
          mockup.layer,
          InteractionTarget.Mockup3D,
          i,
        ]);
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

    if (intersecting_objects.length <= 0) {
      console.warn("No selection to be made");
      return;
    }

    let target: InteractionTarget =
      intersecting_objects[intersecting_objects.length - 1][1];
    let index = intersecting_objects[intersecting_objects.length - 1][2];

    // if (target) {
    switch (target) {
      case InteractionTarget.Polygon: {
        let polygon = this.polygons[index];

        this.draggingPolygon = polygon.id;
        this.dragStart = this.lastTopLeft;

        polygon.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        // TODO: make DRY with below
        if (this.handlePolygonClick) {
          // let handler_creator = this.handlePolygonClick;
          // let handle_click = handler_creator();

          // if (!handle_click) {
          //   return;
          // }

          this.handlePolygonClick(polygon.id, {
            id: polygon.id,
            name: polygon.name,
            points: polygon.points,
            dimensions: polygon.dimensions,
            rotation: polygon.rotation,
            position: {
              x: polygon.transform.position[0],
              y: polygon.transform.position[1],
            },
            borderRadius: polygon.borderRadius,
            backgroundFill: polygon.backgroundFill,
            stroke: polygon.stroke,
            layer: polygon.layer,
            isCircle: polygon.isCircle,
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

        text_item.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        // TODO: make DRY with below
        if (this.handleTextClick) {
          // let handler_creator = this.handleTextClick;
          // let handle_click = handler_creator();

          // if (!handle_click) {
          //   return;
          // }

          this.handleTextClick(
            text_item.id
            //    {
            //   id: text_item.id,
            //   name: text_item.name,
            //   text: text_item.text,
            //   fontFamily: text_item.fontFamily,
            //   // points: polygon.points,
            //   dimensions: text_item.dimensions,
            //   position: {
            //     x: text_item.transform.position[0],
            //     y: text_item.transform.position[1],
            //   },
            //   layer: text_item.layer,
            //   color: text_item.color,
            //   fontSize: text_item.fontSize,
            //   backgroundFill: [
            //     wgpuToHuman(text_item.backgroundPolygon.fill[0]) as number,
            //     wgpuToHuman(text_item.backgroundPolygon.fill[1]) as number,
            //     wgpuToHuman(text_item.backgroundPolygon.fill[2]) as number,
            //     wgpuToHuman(text_item.backgroundPolygon.fill[3]) as number,
            //   ],
            //   // borderRadius: polygon.borderRadius,
            //   // fill: polygon.fill,
            //   // stroke: polygon.stroke,
            // }
          );
          this.selectedPolygonId = text_item.id; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Image: {
        let image_item = this.imageItems[index];

        this.draggingImage = image_item.id;
        this.dragStart = this.lastTopLeft;

        image_item.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        // TODO: make DRY with below
        if (this.handleImageClick) {
          // let handler_creator = this.handleImageClick;
          // let handle_click = handler_creator();

          // if (!handle_click) {
          //   return;
          // }

          let uuid = image_item.id;
          this.handleImageClick(
            uuid
            //   {
            //   id: image_item.id,
            //   name: image_item.name,
            //   url: image_item.url,
            //   // points: polygon.points,
            //   dimensions: image_item.dimensions,
            //   position: {
            //     x: image_item.transform.position[0],
            //     y: image_item.transform.position[1],
            //   },
            //   layer: image_item.layer, // borderRadius: polygon.borderRadius,
            //   // fill: polygon.fill,
            //   // stroke: polygon.stroke,
            // }
          );
          this.selectedPolygonId = uuid; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Video: {
        let video_item = this.videoItems[index];

        this.draggingVideo = video_item.id;
        this.dragStart = this.lastTopLeft;

        video_item.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        console.info("Video interaction");

        // TODO: make DRY with below
        if (this.handleVideoClick) {
          console.info("Video click");

          let handler_creator = this.handleVideoClick;
          // let handle_click = handler_creator();

          // if (!handle_click) {
          //   return;
          // }

          let uuid = video_item.id;
          this.handleVideoClick(
            uuid
            //   {
            //   id: video_item.id,
            //   name: video_item.name,
            //   path: video_item.path,
            //   // points: polygon.points,
            //   dimensions: video_item.dimensions,
            //   position: {
            //     x: video_item.transform.position[0],
            //     y: video_item.transform.position[1],
            //   },
            //   layer: video_item.layer,
            //   mousePath: video_item.mousePath as string, // borderRadius: polygon.borderRadius,
            //   // fill: polygon.fill,
            //   // stroke: polygon.stroke,
            // }
          );
          this.selectedPolygonId = uuid; // TODO: separate property for each object type?
          // polygon.old_points = (polygon.points);
        }

        break; // nothing to add to undo stack
      }
      case InteractionTarget.Cube3D: {
        let cube = this.cubes3D[index];

        this.draggingCube3D = cube.id;
        this.dragStart = this.lastTopLeft;

        cube.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        if (this.handleCube3DClick) {
          this.handleCube3DClick(cube.id, {
            id: cube.id,
            name: cube.name,
            dimensions: cube.dimensions,
            position: {
              x: cube.transform.position[0] - CANVAS_HORIZ_OFFSET,
              y: cube.transform.position[1] - CANVAS_VERT_OFFSET,
            },
            rotation: cube.rotation,
            backgroundFill: cube.backgroundFill,
            layer: cube.layer,
          });
        }

        break;
      }
      case InteractionTarget.Sphere3D: {
        let sphere = this.spheres3D[index];

        this.draggingSphere3D = sphere.id;
        this.dragStart = this.lastTopLeft;

        sphere.transform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        if (this.handleSphere3DClick) {
          this.handleSphere3DClick(sphere.id, {
            id: sphere.id,
            name: sphere.name,
            radius: sphere.radius,
            position: {
              x: sphere.transform.position[0] - CANVAS_HORIZ_OFFSET,
              y: sphere.transform.position[1] - CANVAS_VERT_OFFSET,
            },
            rotation: sphere.rotation,
            backgroundFill: sphere.backgroundFill,
            layer: sphere.layer,
            segments: sphere.segments,
          });
        }

        break;
      }
      case InteractionTarget.Mockup3D: {
        let mockup = this.mockups3D[index];

        this.draggingMockup3D = mockup.id;
        this.dragStart = this.lastTopLeft;

        mockup.groupTransform.startPosition = vec2.fromValues(
          this.dragStart.x,
          this.dragStart.y
        );

        if (this.handleMockup3DClick) {
          this.handleMockup3DClick(mockup.id, {
            id: mockup.id,
            name: mockup.name,
            dimensions: mockup.dimensions,
            position: {
              x: mockup.groupTransform.position[0] - CANVAS_HORIZ_OFFSET,
              y: mockup.groupTransform.position[1] - CANVAS_VERT_OFFSET,
            },
            rotation: [
              mockup.groupTransform.rotationX,
              mockup.groupTransform.rotationY,
              mockup.groupTransform.rotation,
            ],
            backgroundFill: mockup.backgroundFill,
            layer: mockup.layer,
            videoChild: mockup.videoChildConfig,
          });
        }

        break;
      }
      default:
        const _exhaustiveCheck: never = target;
        console.error("Unhandled InteractionTarget:", target);
    }
    // }

    return;
  }

  handle_mouse_move(
    // windowSize: WindowSize,
    // device: Polyfilldevice!,
    // queue: PolyfillQueue,
    x: number,
    y: number
  ) {
    let camera = this.camera;
    let windowSize = camera?.windowSize;
    let gpuResources = this.gpuResources;
    let device = gpuResources?.device;
    let queue = gpuResources?.queue;

    if (!camera || !windowSize || !device || !queue) {
      return;
    }

    let mouse_pos = { x, y };
    let ray = visualize_ray_intersection(windowSize, x, y, camera);
    let top_left = ray.top_left;

    this.globalTopLeft = top_left;
    this.lastScreen = { x, y };

    // if (
    //   this.lastScreen.x < this.interactiveBounds.min.x ||
    //   this.lastScreen.x > this.interactiveBounds.max.x ||
    //   this.lastScreen.y < this.interactiveBounds.min.y ||
    //   this.lastScreen.y > this.interactiveBounds.max.y
    // ) {
    //   // reset when out of bounds
    //   this.isPanning = false;
    //   return;
    // }

    this.lastTopLeft = top_left;

    const ndcPoint = {
      x: (this.lastTopLeft.x / camera.windowSize.width) * 2.0 - 1.0,
      y: -((this.lastTopLeft.y / camera.windowSize.height) * 2.0 - 1.0),
    };

    const startNdcPoint = this.dragStart
      ? {
          x: (this.dragStart.x / camera.windowSize.width) * 2.0 - 1.0,
          y: -((this.dragStart.y / camera.windowSize.height) * 2.0 - 1.0),
        }
      : {
          x: 0,
          y: 0,
        };

    // handle brush drawing
    if (
      this.brushDrawingMode &&
      this.currentBrush &&
      this.currentBrush.currentStroke
    ) {
      const brushPoint = {
        x: top_left.x,
        y: top_left.y,
        pressure: 1.0, // Could be read from pointer event if supported
        timestamp: Date.now(),
      };

      this.currentBrush.addStrokePoint(brushPoint);

      // Update brush geometry in real-time
      this.currentBrush.createGeometry(camera, windowSize);
      this.currentBrush.updateBuffers(device, queue, camera, windowSize);

      return;
    }

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

    if (this.draggingCube3D) {
      if (this.dragStart) {
        this.move_cube3d(
          ndcPoint,
          startNdcPoint,
          this.draggingCube3D,
          windowSize,
          device
        );
      }
    }

    if (this.draggingSphere3D) {
      if (this.dragStart) {
        this.move_sphere3d(
          ndcPoint,
          startNdcPoint,
          this.draggingSphere3D,
          windowSize,
          device
        );
      }
    }

    if (this.draggingMockup3D) {
      if (this.dragStart) {
        this.move_mockup3d(
          this.lastTopLeft,
          this.dragStart,
          this.draggingMockup3D,
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

    // Handle brush stroke end
    if (
      this.brushDrawingMode &&
      this.currentBrush &&
      this.currentBrush.currentStroke
    ) {
      this.currentBrush.endStroke();

      // Regenerate final geometry with all strokes
      const windowSize = camera.windowSize;
      const gpuResources = this.gpuResources;
      const device = gpuResources?.device;
      const queue = gpuResources?.queue;

      if (windowSize && device && queue) {
        this.currentBrush.createGeometry(camera, windowSize);
        this.currentBrush.updateBuffers(device, queue, camera, windowSize);
      }

      return;
    }

    // TODO: does another bounds cause this to get stuck?
    // if (
    //   this.lastScreen.x < this.interactiveBounds.min.x ||
    //   this.lastScreen.x > this.interactiveBounds.max.x ||
    //   this.lastScreen.y < this.interactiveBounds.min.y ||
    //   this.lastScreen.y > this.interactiveBounds.max.y
    // ) {
    //   return;
    // }

    // handle object on mouse up
    let object_id = null;
    let active_point = null;
    if (this.draggingPolygon) {
      object_id = this.draggingPolygon;
      let active_polygon = this.polygons.find(
        (p) => p.id == this.draggingPolygon
      );

      if (active_polygon) {
        active_point = {
          x: active_polygon.transform.position[0],
          y: active_polygon.transform.position[1],
        };
      }
    } else if (this.draggingImage) {
      object_id = this.draggingImage;
      let active_image = this.imageItems.find(
        (i) => i.id == this.draggingImage
      );

      if (active_image) {
        active_point = {
          x: active_image.transform.position[0],
          y: active_image.transform.position[1],
        };
      }
    } else if (this.draggingText) {
      object_id = this.draggingText;
      let active_text = this.textItems.find((t) => t.id == this.draggingText);

      if (active_text) {
        active_point = {
          x: active_text.transform.position[0],
          y: active_text.transform.position[1],
        };
      }
    } else if (this.draggingVideo) {
      object_id = this.draggingVideo;
      let active_video = this.videoItems.find(
        (t) => t.id == this.draggingVideo
      );

      if (active_video) {
        active_point = {
          x: active_video.groupTransform.position[0],
          y: active_video.groupTransform.position[1],
        };
      }
    } else if (this.draggingCube3D) {
      object_id = this.draggingCube3D;
      let active_cube = this.cubes3D.find((c) => c.id == this.draggingCube3D);

      if (active_cube) {
        active_point = {
          x: active_cube.transform.position[0],
          y: active_cube.transform.position[1],
        };
      }
    } else if (this.draggingSphere3D) {
      object_id = this.draggingSphere3D;
      let active_sphere = this.spheres3D.find(
        (s) => s.id == this.draggingSphere3D
      );

      if (active_sphere) {
        active_point = {
          x: active_sphere.transform.position[0],
          y: active_sphere.transform.position[1],
        };
      }
    } else if (this.draggingMockup3D) {
      object_id = this.draggingMockup3D;
      let active_mockup = this.mockups3D.find(
        (m) => m.id == this.draggingMockup3D
      );

      if (active_mockup) {
        active_point = {
          x: active_mockup.groupTransform.position[0],
          y: active_mockup.groupTransform.position[1],
        };
      }
    }

    if (object_id && active_point) {
      if (this.onMouseUp) {
        // let on_up = this.onMouseUp();

        // if (!on_up) {
        //   return;
        // }

        // let active_point = active_point;
        let data = this.onMouseUp(object_id, {
          x: active_point.x - CANVAS_HORIZ_OFFSET,
          y: active_point.y - CANVAS_VERT_OFFSET,
        });

        if (data) {
          let [selected_sequence_data, selected_keyframes] = data;
        }
        // need some way of seeing if keyframe selected
        // perhaps need some way of opening keyframes explicitly
        // perhaps a toggle between keyframes and layout
        // if (selected_keyframes.length > 0) {
        //   this.updateMotionPaths(selected_sequence_data);
        //   console.info("Motion Paths updated!");
        // }
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

      if (active_handle) {
        handle_point = {
          x: active_handle.transform.position[0],
          y: active_handle.transform.position[1],
        };
      } else {
        console.info("checking video handle");
        let active_handle = this.videoItems
          .filter((v) => !v.hidden && v.id === this.draggingPathObject)
          .map((m) => m.mousePath?.staticPolygons)
          .flat()
          .find((p) => p?.id == handle_id);

        if (active_handle) {
          console.info("found video handle!");

          handle_point = {
            x: active_handle.transform.position[0],
            y: active_handle.transform.position[1],
          };
        }
      }
    }

    // the object (polygon, text image, etc) related to this motion path handle
    let handle_object_id = this.draggingPathObject
      ? this.draggingPathObject
      : null;
    // the keyframe associated with this motion path handle
    let handle_keyframe_id = this.draggingPathKeyframe
      ? this.draggingPathKeyframe
      : null;

    console.info(
      "checing video handle data",
      handle_object_id,
      handle_keyframe_id
    );

    if (handle_keyframe_id && handle_point) {
      // need to update saved state and motion paths, handle polygon position already updated
      if (this.onHandleMouseUp) {
        // let on_up = this.onHandleMouseUp();

        if (handle_object_id) {
          // let handle_point = handle_point.expect("Couldn't get handle point");
          console.info("calling video handle mouse up!");
          let upObject = this.onHandleMouseUp(
            handle_keyframe_id,
            handle_object_id,
            {
              x: handle_point.x - CANVAS_HORIZ_OFFSET,
              y: handle_point.y - CANVAS_VERT_OFFSET,
            }
          );

          if (upObject) {
            let [selected_sequence_data, selected_keyframes] = upObject;

            // always updated when handle is moved
            if (selected_sequence_data) {
              this.updateMotionPaths(selected_sequence_data);
              console.info("Motion Paths updated!");
            }
          }
        }
      }
    }

    // handle path mouse up
    if (this.draggingPath) {
      let active_path = this.motionPaths.find((p) => p.id == this.draggingPath);

      if (active_path) {
        let path_point = {
          x: active_path.transform.position[0],
          y: active_path.transform.position[1],
        };

        if (this.onPathMouseUp) {
          let on_up = this.onPathMouseUp();

          if (on_up) {
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
      }
    }

    if (this.textArea) {
      let characterId = this.textArea.textAreaCharContainsPoint(
        this.lastTopLeft
      );

      console.info("text area click", characterId);

      if (typeof characterId !== "undefined" && characterId !== null) {
        const characterPage = parseInt(characterId.split("-")[1]);
        const characterIndex = parseInt(characterId.split("-")[2]);
        const characterNlIndex = parseInt(characterId.split("-")[3]);

        // const character = this.multiPageEditor?.masterDoc[characterIndex];
        // const character = this.multiPageEditor?.pages[characterPage].layout.queryInfos(characterIndex);

        // console.info("character clicked ", character);

        window.__canvasRTEInsertCharacterIndex = characterIndex;
        window.__canvasRTEInsertCharacterIndexNl = characterNlIndex;

        this.textAreaActive = true;

        // renderCursor();
      }
    }

    // reset variables
    console.info("reset vars");
    this.draggingPolygon = null;
    this.draggingText = null;
    this.draggingImage = null;
    this.draggingVideo = null;
    this.draggingCube3D = null;
    this.draggingSphere3D = null;
    this.draggingMockup3D = null;
    this.dragStart = null;
    this.draggingPath = null;
    this.draggingPathAssocPath = null;
    this.draggingPathHandle = null;
    this.draggingPathObject = null;
    this.draggingPathKeyframe = null;
    this.isPanning = false;
    // this.lastTopLeft = { x: -1000, y: -1000 }; // resets for mobile?

    // this.dragging_edge = None;
    // this.guide_lines.clear();
    // this.update_cursor();

    // action_edit
    return;
  }

  handle_key() {}

  reset_bounds(windowSize: WindowSize) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    // camera.position = Vector2.new(0.0, 0.0);
    camera.position = vec2.create();
    camera.zoom = 1.0;
    this.updateCameraBinding();
    // this.interactiveBounds = {
    //   min: { x: 550.0, y: 0.0 }, // account for aside width, allow for some off-canvas positioning
    //   max: {
    //     x: windowSize.width as number,
    //     // y: windowSize.height as number - 350.0, // 350.0 for timeline space
    //     y: 550.0, // allow for 50.0 padding below and above the canvas
    //   },
    // };
  }

  move_polygon(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
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

    // let new_position = {
    //   x: roundToGrid(polygon.transform.position[0] + dx, this.gridSnap), // not sure relation with aspect_ratio?
    //   y: roundToGrid(polygon.transform.position[1] + dy, this.gridSnap),
    // };

    // Get the original position when drag started
    const originalX = polygon.transform.startPosition
      ? polygon.transform.startPosition[0]
      : polygon.transform.position[0];
    const originalY = polygon.transform.startPosition
      ? polygon.transform.startPosition[1]
      : polygon.transform.position[1];

    // On first drag, store original position
    if (!polygon.transform.startPosition) {
      polygon.transform.startPosition = vec2.fromValues(
        polygon.transform.position[0],
        polygon.transform.position[1]
      );
    }

    // Calculate new position based on original position + total movement
    let new_position = {
      x: roundToGrid(originalX + dx, this.gridSnap),
      y: roundToGrid(originalY + dy, this.gridSnap),
    };

    // Get the original group position for associated motion paths
    const originalPathX =
      this.motionPaths.filter((p) => p.associatedPolygonId === poly_id)[0]
        ?.transform.startPosition[0] || 0;
    const originalPathY =
      this.motionPaths.filter((p) => p.associatedPolygonId === poly_id)[0]
        ?.transform.startPosition[1] || 0;

    let new_path_position = {
      x: roundToGrid(originalPathX + dx, this.gridSnap),
      y: roundToGrid(originalPathY + dy, this.gridSnap),
    };

    // console.info("move_polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device!,
      this.modelBindGroupLayout,
      new_position,
      camera
    );

    // Move associated motion paths when object is moved
    this.motionPaths.forEach((motionPath) => {
      if (motionPath.associatedPolygonId === poly_id) {
        motionPath.updateDataFromPosition(
          windowSize,
          device!,
          this.modelBindGroupLayout!,
          // new_path_position,
          new_position,
          camera
        );
      }
    });

    // Also check video items for motion paths
    // this.videoItems.forEach((videoItem) => {
    //   if (
    //     videoItem.mousePath &&
    //     videoItem.mousePath.associatedPolygonId === poly_id
    //   ) {
    //     videoItem.mousePath.updateDataFromPosition(
    //       windowSize,
    //       device!,
    //       this.modelBindGroupLayout!,
    //       new_position,
    //       camera
    //     );
    //   }
    // });

    // this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_static_polygon(
    mouse_pos: Point,
    start: Point,
    poly_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
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
      x: polygon.transform.position[0] + dx, // not sure relation with aspect_ratio?
      y: polygon.transform.position[1] + dy,
    };

    // console.info("move_polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device!,
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
    device: PolyfillDevice
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
      path = this.videoItems.find(
        (v) => !v.hidden && v.mousePath?.id === path_id
      )?.mousePath;

      // console.info("move static", path, poly_id);
    }

    if (!path) {
      return;
    }

    let polygon = path.staticPolygons.find((p) => p.id == poly_id);

    if (!polygon || !this.modelBindGroupLayout) {
      return;
    }

    // console.info("moving static", polygon);

    let new_position = {
      x: polygon.transform.position[0] + dx, // not sure relation with aspect_ratio?
      y: polygon.transform.position[1] + dy,
    };

    // console.info("move path polygon {:?}", new_position);

    polygon.updateDataFromPosition(
      windowSize,
      device!,
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
    device: PolyfillDevice
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
      x: path.transform.position[0] + dx, // not sure relation with aspect_ratio? probably not needed now
      y: path.transform.position[1] + dy,
    };

    // console.info("move_path {:?}", new_position);

    path.updateDataFromPosition(
      windowSize,
      device!,
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
    device: PolyfillDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let aspect_ratio = ((camera.windowSize.width as number) /
      camera.windowSize.height) as number;

    // Calculate dx and dy relative to the original drag start point
    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;

    let text_item = this.textItems.find((t) => t.id == text_id);

    if (!text_item) {
      return;
    }

    // Get the original position when drag started
    const originalX = text_item.transform.startPosition
      ? text_item.transform.startPosition[0]
      : text_item.transform.position[0];
    const originalY = text_item.transform.startPosition
      ? text_item.transform.startPosition[1]
      : text_item.transform.position[1];

    // On first drag, store original position
    if (!text_item.transform.startPosition) {
      text_item.transform.startPosition = vec2.fromValues(
        text_item.transform.position[0],
        text_item.transform.position[1]
      );
    }

    // Calculate new position based on original position + total movement
    let new_position = {
      x: roundToGrid(originalX + dx, this.gridSnap),
      y: roundToGrid(originalY + dy, this.gridSnap),
    };

    text_item.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );
    text_item.backgroundPolygon.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    // Get the original group position for associated motion paths
    const originalPathX =
      this.motionPaths.filter((p) => p.associatedPolygonId === text_id)[0]
        ?.transform.startPosition[0] || 0;
    const originalPathY =
      this.motionPaths.filter((p) => p.associatedPolygonId === text_id)[0]
        ?.transform.startPosition[1] || 0;

    let new_path_position = {
      x: roundToGrid(originalPathX + dx, this.gridSnap),
      y: roundToGrid(originalPathY + dy, this.gridSnap),
    };

    // Move associated motion paths when text object is moved
    this.motionPaths.forEach((motionPath) => {
      if (motionPath.associatedPolygonId === text_id) {
        motionPath.updateDataFromPosition(
          windowSize,
          device!,
          this.modelBindGroupLayout!,
          new_path_position,
          camera
        );
      }
    });

    // Also check video items for motion paths
    // this.videoItems.forEach((videoItem) => {
    //   if (
    //     videoItem.mousePath &&
    //     videoItem.mousePath.associatedPolygonId === text_id
    //   ) {
    //     videoItem.mousePath.updateDataFromPosition(
    //       windowSize,
    //       device!,
    //       this.modelBindGroupLayout!,
    //       new_position,
    //       camera
    //     );
    //   }
    // });

    // this.dragStart = mouse_pos;
  }

  move_image(
    mouse_pos: Point,
    start: Point,
    image_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
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

    // let new_position = {
    //   x: image_item.transform.position[0] + dx, // not sure relation with aspect_ratio?
    //   y: image_item.transform.position[1] + dy,
    // };
    // let new_position = {
    //   x: roundToGrid(image_item.transform.position[0] + dx, this.gridSnap), // not sure relation with aspect_ratio?
    //   y: roundToGrid(image_item.transform.position[1] + dy, this.gridSnap),
    // };

    // Get the original position when drag started
    const originalX = image_item.transform.startPosition
      ? image_item.transform.startPosition[0]
      : image_item.transform.position[0];
    const originalY = image_item.transform.startPosition
      ? image_item.transform.startPosition[1]
      : image_item.transform.position[1];

    // On first drag, store original position
    if (!image_item.transform.startPosition) {
      image_item.transform.startPosition = vec2.fromValues(
        image_item.transform.position[0],
        image_item.transform.position[1]
      );
    }

    // Calculate new position based on original position + total movement
    let new_position = {
      x: roundToGrid(originalX + dx, this.gridSnap),
      y: roundToGrid(originalY + dy, this.gridSnap),
    };

    // console.info("move_image {:?}", new_position);

    image_item.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    // Get the original group position for associated motion paths
    const originalPathX =
      this.motionPaths.filter((p) => p.associatedPolygonId === image_id)[0]
        ?.transform.startPosition[0] || 0;
    const originalPathY =
      this.motionPaths.filter((p) => p.associatedPolygonId === image_id)[0]
        ?.transform.startPosition[1] || 0;

    let new_path_position = {
      x: roundToGrid(originalPathX + dx, this.gridSnap),
      y: roundToGrid(originalPathY + dy, this.gridSnap),
    };

    // Move associated motion paths when image object is moved
    this.motionPaths.forEach((motionPath) => {
      if (motionPath.associatedPolygonId === image_id) {
        motionPath.updateDataFromPosition(
          windowSize,
          device!,
          this.modelBindGroupLayout!,
          new_path_position,
          camera
        );
      }
    });

    // Also check video items for motion paths
    // this.videoItems.forEach((videoItem) => {
    //   if (
    //     videoItem.mousePath &&
    //     videoItem.mousePath.associatedPolygonId === image_id
    //   ) {
    //     videoItem.mousePath.updateDataFromPosition(
    //       windowSize,
    //       device!,
    //       this.modelBindGroupLayout!,
    //       new_position,
    //       camera
    //     );
    //   }
    // });

    // this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_video(
    mouse_pos: Point,
    start: Point,
    video_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
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

    // let new_position = {
    //   x: video_item.groupTransform.position[0] + dx, // not sure relation with aspect_ratio?
    //   y: video_item.groupTransform.position[1] + dy,
    // };

    // let new_position = {
    //   x: roundToGrid(video_item.transform.position[0] + dx, this.gridSnap), // not sure relation with aspect_ratio?
    //   y: roundToGrid(video_item.transform.position[1] + dy, this.gridSnap),
    // };

    // Get the original position when drag started
    const originalX = video_item.transform.startPosition
      ? video_item.transform.startPosition[0]
      : video_item.transform.position[0];
    const originalY = video_item.transform.startPosition
      ? video_item.transform.startPosition[1]
      : video_item.transform.position[1];

    // On first drag, store original position
    if (!video_item.transform.startPosition) {
      video_item.transform.startPosition = vec2.fromValues(
        video_item.transform.position[0],
        video_item.transform.position[1]
      );
    }

    // Calculate new position based on original position + total movement
    let new_position = {
      x: roundToGrid(originalX + dx, this.gridSnap),
      y: roundToGrid(originalY + dy, this.gridSnap),
    };

    // console.info("move_video {:?}", new_position);

    video_item.groupTransform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    // Get the original group position for associated motion paths
    const originalPathX =
      this.motionPaths.filter((p) => p.associatedPolygonId === video_id)[0]
        ?.transform.startPosition[0] || 0;
    const originalPathY =
      this.motionPaths.filter((p) => p.associatedPolygonId === video_id)[0]
        ?.transform.startPosition[1] || 0;

    let new_path_position = {
      x: roundToGrid(originalPathX + dx, this.gridSnap),
      y: roundToGrid(originalPathY + dy, this.gridSnap),
    };

    // Move associated motion paths when video object is moved
    this.motionPaths.forEach((motionPath) => {
      if (motionPath.associatedPolygonId === video_id) {
        motionPath.updateDataFromPosition(
          windowSize,
          device!,
          this.modelBindGroupLayout!,
          new_path_position,
          camera
        );
      }
    });

    // Also check video items for motion paths (self-reference case)
    // this.videoItems.forEach((videoItem) => {
    //   if (
    //     videoItem.mousePath &&
    //     videoItem.mousePath.associatedPolygonId === video_id
    //   ) {
    //     videoItem.mousePath.updateDataFromPosition(
    //       windowSize,
    //       device!,
    //       this.modelBindGroupLayout!,
    //       new_position,
    //       camera
    //     );
    //   }
    // });

    // this.dragStart = mouse_pos;
    // this.update_guide_lines(poly_index, windowSize);
  }

  move_cube3d(
    mouse_pos: Point,
    start: Point,
    cube_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let cube = this.cubes3D.find((c) => c.id == cube_id);

    if (!cube) {
      return;
    }

    const originalX = cube.transform.startPosition
      ? cube.transform.startPosition[0]
      : cube.transform.position[0];
    const originalY = cube.transform.startPosition
      ? cube.transform.startPosition[1]
      : cube.transform.position[1];

    if (!cube.transform.startPosition) {
      cube.transform.startPosition = vec2.fromValues(
        cube.transform.position[0],
        cube.transform.position[1]
      );
    }

    // let new_position = {
    //   x: roundToGrid(originalX + dx, this.gridSnap),
    //   y: roundToGrid(originalY + dy, this.gridSnap),
    // };

    // let new_position = {
    //   x: originalX + dx,
    //   y: originalY + dy,
    // };

    let new_position = mouse_pos;

    cube.transform.updatePosition([new_position.x, new_position.y], windowSize);
  }

  move_sphere3d(
    mouse_pos: Point,
    start: Point,
    sphere_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let sphere = this.spheres3D.find((s) => s.id == sphere_id);

    if (!sphere) {
      return;
    }

    const originalX = sphere.transform.startPosition
      ? sphere.transform.startPosition[0]
      : sphere.transform.position[0];
    const originalY = sphere.transform.startPosition
      ? sphere.transform.startPosition[1]
      : sphere.transform.position[1];

    if (!sphere.transform.startPosition) {
      sphere.transform.startPosition = vec2.fromValues(
        sphere.transform.position[0],
        sphere.transform.position[1]
      );
    }

    // let new_position = {
    //   x: roundToGrid(originalX + dx, this.gridSnap),
    //   y: roundToGrid(originalY + dy, this.gridSnap),
    // };

    let new_position = mouse_pos;

    sphere.transform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );
  }

  move_mockup3d(
    mouse_pos: Point,
    start: Point,
    mockup_id: string,
    windowSize: WindowSize,
    device: PolyfillDevice
  ) {
    let camera = this.camera;

    if (!camera) {
      return;
    }

    let dx = mouse_pos.x - start.x;
    let dy = mouse_pos.y - start.y;
    let mockup = this.mockups3D.find((m) => m.id == mockup_id);

    if (!mockup) {
      return;
    }

    const originalX = mockup.groupTransform.startPosition
      ? mockup.groupTransform.startPosition[0]
      : mockup.groupTransform.position[0];
    const originalY = mockup.groupTransform.startPosition
      ? mockup.groupTransform.startPosition[1]
      : mockup.groupTransform.position[1];

    if (!mockup.groupTransform.startPosition) {
      mockup.groupTransform.startPosition = vec2.fromValues(
        mockup.groupTransform.position[0],
        mockup.groupTransform.position[1]
      );
    }

    // let new_position = mouse_pos;

    let new_position = {
      x: roundToGrid(originalX + dx, this.gridSnap),
      y: roundToGrid(originalY + dy, this.gridSnap),
    };

    mockup.groupTransform.updatePosition(
      [new_position.x, new_position.y],
      windowSize
    );

    // Video child automatically follows via shared group transform
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
    this.staticPolygons = [];
  }
}

// used for grid snap
export function roundUp(numToRound: number, multiple: number): number {
  if (multiple == 0) {
    return numToRound;
  }

  let remainder = numToRound % multiple;
  if (remainder == 0) {
    return numToRound;
  }

  return numToRound + multiple - remainder;
}

export function roundToGrid(numToRound: number, grid: number): number {
  return Math.round(numToRound / grid) * grid;
}

// export function roundToGrid(
//   numToRound: number,
//   grid: number,
//   roundUp = true
// ): number {
//   if (roundUp) {
//     // For positive numbers, ceil rounds up
//     // For negative numbers, floor rounds "up" (to more negative)
//     return numToRound >= 0
//       ? Math.ceil(1 / grid) * grid
//       : Math.floor(-1 / grid) * grid;
//   } else {
//     // Standard rounding behavior
//     return Math.round(numToRound / grid) * grid;
//   }
// }

export function interpolatePosition(
  start: UIKeyframe,
  end: UIKeyframe,
  time: number
): [number, number] {
  let startPos = start.value.value as [number, number];
  let endPos = end.value.value as [number, number];

  if (start.value.type === "Zoom" && end.value.type === "Zoom") {
    startPos = start.value.value.position as [number, number];
    endPos = end.value.value.position as [number, number];
  }

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

  // console.info("Segment progress", progress);

  switch (start.pathType) {
    case PathType.Linear:
      return [
        startPos[0] + (endPos[0] - startPos[0]) * progress,
        startPos[1] + (endPos[1] - startPos[1]) * progress,
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

      return [x, y];
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
  Cube3D,
  Sphere3D,
  Mockup3D,
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
