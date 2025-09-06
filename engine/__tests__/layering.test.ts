import { Editor } from "../editor";
import { Polygon, PolygonConfig } from "../polygon";
import { MotionPath } from "../motionpath";
import { getZLayer } from "../vertex";
import { ObjectType, Sequence, UIKeyframe } from "../animations";
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

    expect(editor.polygons[0].layer).toBe(-1.0 - getZLayer(0 - 10));
    expect(editor.polygons[1].layer).toBe(-1.0 - getZLayer(1 - 10));
    expect(editor.polygons[1].layer).toBeLessThan(editor.polygons[0].layer);
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

    const keyframes: UIKeyframe[] = [
      {
        id: "kf1",
        time: 0,
        value: { type: "Position", value: [100, 100] },
        easing: 0,
        pathType: 0,
        keyType: { type: "Frame" },
        curveData: null,
      },
      {
        id: "kf2",
        time: 1000,
        value: { type: "Position", value: [200, 200] },
        easing: 0,
        pathType: 0,
        keyType: { type: "Frame" },
        curveData: null,
      },
    ];

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

    // Smaller Z is on top
    expect(motionPathZ).toBeLessThan(polygonZ);
  });
});
