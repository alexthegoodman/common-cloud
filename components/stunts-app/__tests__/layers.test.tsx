import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { expect, jest, test, beforeEach, describe } from "@jest/globals";
import { LayerPanel, SortableItem, Layer } from "../layers";
import { ObjectType } from "@/engine/animations";
import { Editor } from "@/engine/editor";
import EditorState, { SaveTarget } from "@/engine/editor_state";

// Mock external dependencies
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockSaveSequencesData = jest.fn().mockResolvedValue(null!);
jest.mock("@/fetchers/projects", () => ({
  saveSequencesData: mockSaveSequencesData,
}));

jest.mock("../icon", () => ({
  CreateIcon: ({ icon, size }: { icon: string; size: string }) => (
    <div data-testid={`icon-${icon}`} data-size={size}>
      {icon}
    </div>
  ),
}));

describe("LayerPanel", () => {
  let mockEditor: Partial<Editor>;
  let mockEditorState: Partial<EditorState>;
  let editorRef: React.RefObject<Editor | null>;
  let editorStateRef: React.RefObject<EditorState | null>;
  let mockLayers: Layer[];
  let setLayers: jest.Mock;

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

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock polygon object with required methods
    const mockPolygon = {
      id: "polygon1",
      name: "Test Polygon",
      layer: 0,
      transformLayer: 0,
      hidden: false,
      updateLayer: jest.fn(),
      transform: {
        updateUniformBuffer: jest.fn(),
        position: [100, 100],
        layer: 0,
      },
      toConfig: jest.fn(() => ({
        id: "polygon1",
        name: "Test Polygon",
        layer: 0,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        dimensions: [100, 100],
        position: { x: 100, y: 100 },
        isCircle: false,
        backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
        stroke: { thickness: 1, fill: [0, 0, 0, 1] },
        rotation: 0,
        borderRadius: 0,
      })),
    };

    // Mock text item object
    const mockTextItem = {
      id: "text1",
      name: "Test Text",
      layer: 1,
      transformLayer: 1,
      hidden: false,
      updateLayer: jest.fn(),
      transform: {
        updateUniformBuffer: jest.fn(),
        position: [200, 200],
        layer: -1,
      },
      toConfig: jest.fn(() => ({
        id: "text1",
        name: "Test Text",
        layer: 1,
        text: "Test Text",
        fontFamily: "Aleo",
        fontSize: 24,
        dimensions: [200, 50],
        position: { x: 200, y: 200 },
        color: [0, 0, 0, 1],
        backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
        isCircle: false,
      })),
    };

    // Mock image item object
    const mockImageItem = {
      id: "image1",
      name: "Test Image",
      layer: 2,
      transformLayer: 2,
      hidden: false,
      updateLayer: jest.fn(),
      transform: {
        updateUniformBuffer: jest.fn(),
        position: [300, 300],
        layer: -2,
      },
      toConfig: jest.fn(() => ({
        id: "image1",
        name: "Test Image",
        layer: 2,
        dimensions: [150, 150],
        url: "https://picsum.photos/150",
        position: { x: 300, y: 300 },
        isCircle: false,
        isSticker: false,
      })),
    };

    mockEditor = {
      target: "Videos" as SaveTarget,
      camera: mockCamera as any,
      gpuResources: mockGpuResources as any,
      polygons: [mockPolygon as any],
      textItems: [mockTextItem as any],
      imageItems: [mockImageItem as any],
      videoItems: [],
      add_polygon: jest.fn(),
      add_text_item: jest.fn(),
    };

    mockEditorState = {
      savedState: {
        sequences: [
          {
            id: "seq1",
            activePolygons: [
              {
                id: "polygon1",
                name: "Test Polygon",
                layer: 0,
              },
            ],
            activeTextItems: [
              {
                id: "text1",
                name: "Test Text",
                layer: 1,
              },
            ],
            activeImageItems: [
              {
                id: "image1",
                name: "Test Image",
                layer: 2,
              },
            ],
            activeVideoItems: [],
            polygonMotionPaths: [],
          },
        ],
      },
    };

    editorRef = { current: mockEditor as Editor };
    editorStateRef = { current: mockEditorState as EditorState };

    mockLayers = [
      {
        instance_id: "image1",
        instance_name: "Test Image",
        instance_kind: ObjectType.ImageItem,
        initial_layer_index: 2,
      },
      {
        instance_id: "text1",
        instance_name: "Test Text",
        instance_kind: ObjectType.TextItem,
        initial_layer_index: 1,
      },
      {
        instance_id: "polygon1",
        instance_name: "Test Polygon",
        instance_kind: ObjectType.Polygon,
        initial_layer_index: 0,
      },
    ];

    setLayers = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("renders LayerPanel with correct layers", () => {
    render(
      <LayerPanel
        editorRef={editorRef}
        editorStateRef={editorStateRef}
        currentSequenceId="seq1"
        layers={mockLayers}
        setLayers={setLayers}
      />
    );

    expect(screen.getByText("Scene")).toBeInTheDocument();
    expect(screen.getByText("Test Image")).toBeInTheDocument();
    expect(screen.getByText("Test Text")).toBeInTheDocument();
    expect(screen.getByText("Test Polygon")).toBeInTheDocument();
  });

  test("renders correct icons for different layer types", () => {
    render(
      <LayerPanel
        editorRef={editorRef}
        editorStateRef={editorStateRef}
        currentSequenceId="seq1"
        layers={mockLayers}
        setLayers={setLayers}
      />
    );

    expect(screen.getByTestId("icon-image")).toBeInTheDocument();
    expect(screen.getByTestId("icon-text")).toBeInTheDocument();
    expect(screen.getByTestId("icon-square")).toBeInTheDocument();
  });

  test("calls delete handler when delete button is clicked", async () => {
    render(
      <LayerPanel
        editorRef={editorRef}
        editorStateRef={editorStateRef}
        currentSequenceId="seq1"
        layers={mockLayers}
        setLayers={setLayers}
      />
    );

    expect(mockEditor.imageItems).toHaveLength(1);

    const deleteButtons = screen.getAllByTestId("icon-trash");
    fireEvent.click(deleteButtons[0]); // Delete the first item (image)

    // Verify that the image was removed from editor
    expect(mockEditor.imageItems).toHaveLength(0);
    // expect(mockSaveSequencesData).toHaveBeenCalled();
  });

  // good test to keep, but the duplciation functionality hasn't been verified yet
  // test("calls duplicate handler when duplicate button is clicked", async () => {
  //   render(
  //     <LayerPanel
  //       editorRef={editorRef}
  //       editorStateRef={editorStateRef}
  //       currentSequenceId="seq1"
  //       layers={mockLayers}
  //       setLayers={setLayers}
  //     />
  //   );

  //   expect(mockEditor.polygons).toHaveLength(1);

  //   const duplicateButtons = screen.getAllByTestId("icon-copy");
  //   fireEvent.click(duplicateButtons[2]); // Duplicate the polygon

  //   expect(mockEditor.polygons).toHaveLength(2);

  //   // expect(mockSaveSequencesData).toHaveBeenCalled();
  // });
});

describe("SortableItem", () => {
  let mockLayers: Layer[];
  let setMockLayers: jest.Mock;
  let setDraggerId: jest.Mock;
  let onItemsUpdated: jest.Mock;
  let onItemDuplicated: jest.Mock;
  let onItemDeleted: jest.Mock;

  beforeEach(() => {
    mockLayers = [
      {
        instance_id: "polygon1",
        instance_name: "Polygon 1",
        instance_kind: ObjectType.Polygon,
        initial_layer_index: 0,
      },
      {
        instance_id: "text1",
        instance_name: "Text 1",
        instance_kind: ObjectType.TextItem,
        initial_layer_index: 1,
      },
      {
        instance_id: "image1",
        instance_name: "Image 1",
        instance_kind: ObjectType.ImageItem,
        initial_layer_index: 2,
      },
    ];

    setMockLayers = jest.fn();
    setDraggerId = jest.fn();
    onItemsUpdated = jest.fn();
    onItemDuplicated = jest.fn();
    onItemDeleted = jest.fn();

    jest.clearAllMocks();
  });

  test("renders SortableItem with correct content", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId={null}
        setDraggerId={setDraggerId}
        itemId="polygon1"
        kind={ObjectType.Polygon}
        layerName="Polygon 1"
        iconName="square"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    expect(screen.getByText("Polygon 1")).toBeInTheDocument();
    expect(screen.getByTestId("icon-square")).toBeInTheDocument();
    expect(screen.getByTestId("icon-copy")).toBeInTheDocument();
    expect(screen.getByTestId("icon-trash")).toBeInTheDocument();
  });

  test("triggers drag start and sets dragger ID", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId={null}
        setDraggerId={setDraggerId}
        itemId="polygon1"
        kind={ObjectType.Polygon}
        layerName="Polygon 1"
        iconName="square"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Polygon 1").closest("div");
    fireEvent.dragStart(draggableElement!);

    expect(setDraggerId).toHaveBeenCalledWith("polygon1");
  });

  test("triggers drag end and calls onItemsUpdated", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId="polygon1"
        setDraggerId={setDraggerId}
        itemId="polygon1"
        kind={ObjectType.Polygon}
        layerName="Polygon 1"
        iconName="square"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Polygon 1").closest("div");
    fireEvent.dragEnd(draggableElement!);

    expect(setDraggerId).toHaveBeenCalledWith(null);
    expect(onItemsUpdated).toHaveBeenCalled();
  });

  test("reorders layers when dragging over different positions", () => {
    // Mock console.info to avoid test output noise
    const consoleSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId="polygon1" // polygon1 is being dragged
        setDraggerId={setDraggerId}
        itemId="text1" // dragging over text1
        kind={ObjectType.TextItem}
        layerName="Text 1"
        iconName="text"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Text 1").closest("div");
    fireEvent.dragOver(draggableElement!, { preventDefault: jest.fn() });

    expect(setMockLayers).toHaveBeenCalled();

    // Verify the reordering logic was called
    const reorderedLayers = setMockLayers.mock.calls[0][0];
    expect(reorderedLayers).toBeDefined();
    expect(reorderedLayers.length).toBe(3);

    consoleSpy.mockRestore();
  });

  test("calls onItemDuplicated when duplicate button is clicked", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId={null}
        setDraggerId={setDraggerId}
        itemId="polygon1"
        kind={ObjectType.Polygon}
        layerName="Polygon 1"
        iconName="square"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const duplicateButton = screen.getByTestId("icon-copy").closest("button");
    fireEvent.click(duplicateButton!);

    expect(onItemDuplicated).toHaveBeenCalledWith(
      "polygon1",
      ObjectType.Polygon
    );
  });

  test("calls onItemDeleted when delete button is clicked", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId={null}
        setDraggerId={setDraggerId}
        itemId="polygon1"
        kind={ObjectType.Polygon}
        layerName="Polygon 1"
        iconName="square"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const deleteButton = screen.getByTestId("icon-trash").closest("button");
    fireEvent.click(deleteButton!);

    expect(onItemDeleted).toHaveBeenCalledWith("polygon1", ObjectType.Polygon);
  });

  test("prevents default on drag over to allow drop", () => {
    const preventDefault = jest.fn();

    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId="polygon1"
        setDraggerId={setDraggerId}
        itemId="text1"
        kind={ObjectType.TextItem}
        layerName="Text 1"
        iconName="text"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Text 1").closest("div");

    // Create a proper drag event with preventDefault
    const dragOverEvent = new Event("dragover", { bubbles: true });
    Object.defineProperty(dragOverEvent, "preventDefault", {
      value: preventDefault,
      writable: false,
    });

    draggableElement!.dispatchEvent(dragOverEvent);

    expect(preventDefault).toHaveBeenCalled();
  });

  test("does not reorder when no dragger ID is set", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId={null} // No active drag
        setDraggerId={setDraggerId}
        itemId="text1"
        kind={ObjectType.TextItem}
        layerName="Text 1"
        iconName="text"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Text 1").closest("div");
    fireEvent.dragOver(draggableElement!, { preventDefault: jest.fn() });

    // Should not call setSortableItems when no drag is active
    expect(setMockLayers).not.toHaveBeenCalled();
  });

  test("does not reorder when dragging over same position", () => {
    render(
      <SortableItem
        sortableItems={mockLayers}
        setSortableItems={setMockLayers}
        draggerId="text1" // text1 is being dragged
        setDraggerId={setDraggerId}
        itemId="text1" // dragging over itself
        kind={ObjectType.TextItem}
        layerName="Text 1"
        iconName="text"
        onItemsUpdated={onItemsUpdated}
        onItemDuplicated={onItemDuplicated}
        onItemDeleted={onItemDeleted}
      />
    );

    const draggableElement = screen.getByText("Text 1").closest("div");
    fireEvent.dragOver(draggableElement!, { preventDefault: jest.fn() });

    // Should not call setSortableItems when dragging over same item
    expect(setMockLayers).not.toHaveBeenCalled();
  });
});

describe("Layer Reassignment Integration", () => {
  test("properly reassigns layers to objects after drag operation", async () => {
    let mockEditor: Partial<Editor>;
    let mockEditorState: Partial<EditorState>;
    let editorRef: React.RefObject<Editor | null>;
    let editorStateRef: React.RefObject<EditorState | null>;

    const mockGpuResources = {
      device: {},
      queue: {
        writeBuffer: jest.fn(),
      },
    };

    const mockCamera = {
      windowSize: { width: 800, height: 600 },
    };

    // Create mock objects with proper layer update methods
    const mockPolygon = {
      id: "polygon1",
      name: "Test Polygon",
      layer: 0,
      transformLayer: 0,
      hidden: false,
      updateLayer: jest.fn(),
      transform: {
        updateUniformBuffer: jest.fn(),
      },
      toConfig: jest.fn(() => ({
        id: "polygon1",
        name: "Test Polygon",
        layer: 0,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        dimensions: [100, 100],
        position: { x: 100, y: 100 },
        isCircle: false,
        backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
        stroke: { thickness: 1, fill: [0, 0, 0, 1] },
        rotation: 0,
        borderRadius: 0,
      })),
    };

    const mockTextItem = {
      id: "text1",
      name: "Test Text",
      layer: 1,
      transformLayer: 1,
      hidden: false,
      updateLayer: jest.fn(),
      transform: {
        updateUniformBuffer: jest.fn(),
      },
      toConfig: jest.fn(() => ({
        id: "text1",
        name: "Test Text",
        layer: 1,
        text: "Test Text",
        fontFamily: "Aleo",
        fontSize: 24,
        dimensions: [200, 50],
        position: { x: 200, y: 200 },
        color: [0, 0, 0, 1],
        backgroundFill: { type: "Color", value: [1, 1, 1, 1] },
        isCircle: false,
      })),
    };

    mockEditor = {
      target: "mock-target",
      camera: mockCamera as any,
      gpuResources: mockGpuResources as any,
      polygons: [mockPolygon as any],
      textItems: [mockTextItem as any],
      imageItems: [],
      videoItems: [],
      add_polygon: jest.fn(),
      add_text_item: jest.fn(),
    };

    const mockSequence = {
      id: "seq1",
      activePolygons: [
        {
          id: "polygon1",
          name: "Test Polygon",
          layer: 0,
        },
      ],
      activeTextItems: [
        {
          id: "text1",
          name: "Test Text",
          layer: 1,
        },
      ],
      activeImageItems: [],
      activeVideoItems: [],
    };

    mockEditorState = {
      savedState: {
        sequences: [mockSequence],
      },
    };

    editorRef = { current: mockEditor as Editor };
    editorStateRef = { current: mockEditorState as EditorState };

    // Initial layers order: text1 (index 0), polygon1 (index 1)
    const reorderedLayers = [
      {
        instance_id: "text1",
        instance_name: "Test Text",
        instance_kind: ObjectType.TextItem,
        initial_layer_index: 1,
      },
      {
        instance_id: "polygon1",
        instance_name: "Test Polygon",
        instance_kind: ObjectType.Polygon,
        initial_layer_index: 0,
      },
    ];

    const setLayers = jest.fn();

    const { saveSequencesData } = await import("@/fetchers/projects");

    render(
      <LayerPanel
        editorRef={editorRef}
        editorStateRef={editorStateRef}
        currentSequenceId="seq1"
        layers={reorderedLayers}
        setLayers={setLayers}
      />
    );

    // Simulate the onItemsUpdated call that would happen after drag
    const layerPanel = screen.getByText("Scene").closest("div");
    const sortableItems = layerPanel!.querySelectorAll('[draggable="true"]');

    // Trigger drag end on first item to simulate completion of drag operation
    fireEvent.dragEnd(sortableItems[0]);

    // Verify that updateLayer was called with positive layer values
    // For 2 items: text1 at index 0 gets layer (2-1-0) = 1, polygon1 at index 1 gets layer (2-1-1) = 0
    expect(mockTextItem.updateLayer).toHaveBeenCalledWith(
      mockGpuResources.device,
      mockGpuResources.queue,
      mockCamera.windowSize,
      1 // text1 at index 0 gets highest layer value (2-1-0=1)
    );

    expect(mockPolygon.updateLayer).toHaveBeenCalledWith(0); // polygon1 at index 1 gets layer (2-1-1=0)

    // Verify that sequence data was updated with positive values
    expect(mockSequence.activeTextItems[0].layer).toBe(1); // Higher layer renders on top
    expect(mockSequence.activePolygons[0].layer).toBe(0); // Lower layer renders behind

    // Verify that data was saved
    // expect(mockSaveSequencesData).toHaveBeenCalledWith(
    //   mockEditorState.savedState!.sequences,
    //   "mock-target"
    // );
  });
});
