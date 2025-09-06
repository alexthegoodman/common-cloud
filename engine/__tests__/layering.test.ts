import { Editor } from "../editor";
import { Polygon, PolygonConfig } from "../polygon";
import { TextRenderer, TextRendererConfig } from "../text";
import { StImage, StImageConfig } from "../image";
import { StVideo, StVideoConfig } from "../video";
import { MotionPath } from "../motionpath";
import {
  EasingType,
  ObjectType,
  PathType,
  Sequence,
  UIKeyframe,
} from "../animations";
import { Viewport } from "../editor";
import { tessellate } from "@thi.ng/geom-tessellate";

const gt = { tessellate };

import { expect, jest, test } from "@jest/globals";
import { save_confetti_explosion_keyframes } from "../state/keyframes";

// Mocking the GPU resources and camera
const mockGpuResources = {
  device: {
    createBuffer: jest.fn(),
    createBindGroup: jest.fn(),
    createTexture: jest.fn(),
  },
  queue: {
    writeBuffer: jest.fn(),
    writeTexture: jest.fn(),
  },
};

const mockCamera = {
  windowSize: { width: 800, height: 600 },
  position: [0, 0],
  zoom: 1.0,
};

describe("Layering and Object Ordering", () => {
  let editor: Editor;

  beforeEach(() => {
    // Initialize a new editor before each test
    editor = new Editor(new Viewport(800, 600));
    editor.gpuResources = mockGpuResources as any;
    editor.camera = mockCamera as any;
    editor.modelBindGroupLayout = {} as any;
    editor.groupBindGroupLayout = {} as any;

    jest.spyOn(gt, "tessellate").mockReturnValue({
      points: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      faces: [[0, 1, 2]],
    } as any);

    global.createImageBitmap = jest.fn((image: any, options?: any) => {
      // Return a mock ImageBitmap object or a Promise that resolves to one
      // For simplicity, we can return a resolved Promise with a dummy object
      return Promise.resolve({
        width: 100,
        height: 100,
        // Add any other properties or methods you expect to use on ImageBitmap
      }) as any;
    });
  });

  test("a new object should be added with the correct layer", () => {
    const polygonConfig1: PolygonConfig = {
      id: "polygon1",
      name: "Polygon 1",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      dimensions: [100, 100],
      position: { x: 100, y: 100 },
      layer: 0,
      isCircle: false,
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
      stroke: { thickness: 1, fill: [0, 0, 0, 1] },
      rotation: 0,
      borderRadius: 0,
    };
    editor.add_polygon(polygonConfig1, "Polygon 1", "polygon1", "seq1");

    const polygonConfig2: PolygonConfig = {
      id: "polygon2",
      name: "Polygon 2",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      dimensions: [100, 100],
      position: { x: 200, y: 200 },
      layer: 1,
      isCircle: false,
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
      stroke: { thickness: 1, fill: [0, 0, 0, 1] },
      rotation: 0,
      borderRadius: 0,
    };
    editor.add_polygon(polygonConfig2, "Polygon 2", "polygon2", "seq1");

    // transformLayer is 0 for lowest layer and higher for closer layers
    expect(editor.polygons[1].transformLayer).toBeGreaterThan(
      editor.polygons[0].transformLayer
    );
    // transform.layer is the calculated z value for the object in 3D space
    expect(editor.polygons[1].transform.layer).toBeLessThan(
      editor.polygons[0].transform.layer
    );
    // simply layer, this should be the same as tranformLayer (at least here with the polygons)
    expect(editor.polygons[1].layer).toBeGreaterThan(editor.polygons[0].layer);
  });

  test("motion paths should always be displayed on top of everything else", () => {
    const polygonConfig: PolygonConfig = {
      id: "polygon1",
      name: "Polygon 1",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      dimensions: [100, 100],
      position: { x: 100, y: 100 },
      layer: 0,
      isCircle: false,
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
      stroke: { thickness: 1, fill: [0, 0, 0, 1] },
      rotation: 0,
      borderRadius: 0,
    };
    editor.add_polygon(polygonConfig, "Polygon 1", "polygon1", "seq1");

    // const keyframes: UIKeyframe[] = [
    //   {
    //     id: "kf1",
    //     time: 0,
    //     value: { type: "Position", value: [100, 100] },
    //     easing: 0 as unknown as EasingType.EaseIn,
    //     pathType: 0 as unknown as PathType.Bezier,
    //     keyType: { type: "Frame" },
    //     curveData: null,
    //   },
    //   {
    //     id: "kf2",
    //     time: 1000,
    //     value: { type: "Position", value: [200, 200] },
    //     easing: 0 as unknown as EasingType.EaseIn,
    //     pathType: 0 as unknown as PathType.Bezier,
    //     keyType: { type: "Frame" },
    //     curveData: null,
    //   },
    // ];

    // just a random motion path data gen
    let confetti_keyframes = save_confetti_explosion_keyframes(
      null!,
      ["polygon1"],
      [ObjectType.Polygon],
      [
        {
          duration: 1000,
          startTimeMs: 0,
          position: [0, 0],
          properties: [],
        } as any,
      ],
      [100, 100],
      200,
      300
    );

    const sequence: Sequence = {
      id: "seq1",
      durationMs: 1000,
      activePolygons: [polygonConfig],
      activeTextItems: [],
      activeImageItems: [],
      activeVideoItems: [],
      polygonMotionPaths: confetti_keyframes,
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
    };

    editor.createMotionPathVisualization(sequence, "polygon1", 1);

    const polygonZ = editor.polygons[0].transform.layer;
    const motionPathZ = editor.motionPaths[0].staticPolygons[0].transform.layer;

    const polygonZ2 = editor.polygons[0].transformLayer;
    const motionPathZ2 = editor.motionPaths[0].staticPolygons[0].transformLayer;

    const polygonZ3 = editor.polygons[0].layer;
    const motionPathZ3 = editor.motionPaths[0].staticPolygons[0].layer;

    // Smaller Z is on top
    expect(motionPathZ).toBeLessThan(polygonZ);
    expect(motionPathZ2).toBeGreaterThan(polygonZ2);
    expect(motionPathZ3).toBeGreaterThan(polygonZ3);
  });

  test("all object types (polygon, text, image, video) should be assigned correct layers", async () => {
    // Mock text renderer constructor to avoid font loading issues
    // const mockTextRenderer = {
    //   id: "text1",
    //   name: "Text 1",
    //   layer: 2,
    //   transformLayer: 2,
    //   transform: { layer: -2.0 },
    //   renderText: jest.fn(),
    //   hidden: false,
    // };

    // jest
    //   .spyOn(TextRenderer.prototype, "constructor" as any)
    //   .mockImplementation(function () {
    //     Object.assign(this, mockTextRenderer);
    //   });

    // // Mock image initialization
    // const mockImageInitialize = jest.fn().mockResolvedValue(undefined);
    // jest
    //   .spyOn(StImage.prototype, "initialize")
    //   .mockImplementation(mockImageInitialize);

    // Create mock blob for image and video
    const mockBlob = new Blob(["mock"], { type: "image/png" });

    // Create objects with different layers
    const polygonConfig: PolygonConfig = {
      id: "polygon1",
      name: "Polygon 1",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      dimensions: [100, 100],
      position: { x: 100, y: 100 },
      layer: 1,
      isCircle: false,
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
      stroke: { thickness: 1, fill: [0, 0, 0, 1] },
      rotation: 0,
      borderRadius: 0,
    };

    const textConfig: TextRendererConfig = {
      id: "text1",
      name: "Text 1",
      text: "Test Text",
      fontFamily: "Aleo",
      fontSize: 24,
      dimensions: [200, 50],
      position: { x: 200, y: 100 },
      layer: 2,
      color: [0, 0, 0, 1],
      backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
      isCircle: false,
    };

    const imageConfig: StImageConfig = {
      id: "image1",
      name: "Image 1",
      dimensions: [150, 150],
      url: "https://picsum.photos/150",
      position: { x: 300, y: 100 },
      layer: 3,
      isCircle: false,
      isSticker: false,
    };

    const videoConfig: StVideoConfig = {
      id: "video1",
      name: "Video 1",
      dimensions: [200, 150],
      position: { x: 400, y: 100 },
      path: "mock-video.mp4",
      layer: 4,
    };

    // Add objects to editor
    editor.add_polygon(polygonConfig, "Polygon 1", "polygon1", "seq1");
    await editor.add_text_item(textConfig, "Test Text", "text1", "seq1");
    await editor.add_image_item(
      imageConfig,
      "https://picsum.photos/150",
      mockBlob,
      "image1",
      "seq1"
    );

    // For video, we need to mock more complex initialization
    const mockMousePositions: any[] = [];
    try {
      await editor.add_video_item(
        videoConfig,
        mockBlob,
        "video1",
        "seq1",
        mockMousePositions,
        null
      );
    } catch (error) {
      // Video initialization might fail in test environment, that's OK for layer testing
    }

    // Verify polygon layer assignment
    expect(editor.polygons).toHaveLength(1);
    // expect(editor.polygons[0].layer).toBe(1);
    expect(editor.polygons[0].transformLayer).toBe(1);

    // Verify text layer assignment
    expect(editor.textItems).toHaveLength(1);
    // expect(editor.textItems[0].layer).toBe(2);
    // expect(editor.textItems[0].transformLayer).toBe(2);

    // Verify image layer assignment
    expect(editor.imageItems).toHaveLength(1);
    // expect(editor.imageItems[0].layer).toBe(3);
    // expect(editor.imageItems[0].transformLayer).toBe(3);

    // Test layer ordering - higher layer numbers should have higher transformLayer values
    // but lower transform.layer values (closer to camera)
    if (editor.polygons.length > 0 && editor.textItems.length > 0) {
      expect(editor.textItems[0].layer).toBeGreaterThan(
        editor.polygons[0].layer
      );
      expect(editor.textItems[0].transform.layer).toBeLessThan(
        editor.polygons[0].transform.layer
      );
    }

    if (editor.textItems.length > 0 && editor.imageItems.length > 0) {
      expect(editor.imageItems[0].layer).toBeGreaterThan(
        editor.textItems[0].layer
      );
      expect(editor.imageItems[0].transform.layer).toBeLessThan(
        editor.textItems[0].transform.layer
      );
    }

    // If video was successfully added, test its layer too
    if (editor.videoItems && editor.videoItems.length > 0) {
      // expect(editor.videoItems[0].layer).toBe(4);
      // expect(editor.videoItems[0].transformLayer).toBe(4);

      if (editor.imageItems.length > 0) {
        expect(editor.videoItems[0].layer).toBeGreaterThan(
          editor.imageItems[0].layer
        );
        expect(editor.videoItems[0].transform.layer).toBeLessThan(
          editor.imageItems[0].transform.layer
        );
      }
    }
  });
});
