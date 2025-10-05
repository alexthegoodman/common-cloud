import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Make sure you have uuid installed: npm install uuid
import { PolygonConfig } from "@/engine/polygon";
import { StImageConfig } from "@/engine/image";
import { TextRendererConfig } from "@/engine/text";
import { StVideoConfig } from "@/engine/video";
import { BrushConfig } from "@/engine/brush";
import { Cube3DConfig } from "@/engine/cube3d";
import { Sphere3DConfig } from "@/engine/sphere3d";
import { Mockup3DConfig } from "@/engine/mockup3d";
import { ObjectType } from "@/engine/animations";
import { CreateIcon } from "./icon";
import { Editor } from "@/engine/editor";
import EditorState from "@/engine/editor_state";
import { saveSequencesData } from "@/fetchers/projects";
import toast from "react-hot-toast";

export interface Layer {
  instance_id: string;
  instance_name: string;
  instance_kind: ObjectType;
  initial_layer_index: number;
}

export const LayerFromConfig = {
  fromPolygonConfig: (config: PolygonConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.Polygon,
    initial_layer_index: config.layer,
  }),
  fromBrushConfig: (config: BrushConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.Brush,
    initial_layer_index: config.layer,
  }),
  fromImageConfig: (config: StImageConfig): Layer => ({
    instance_id: config.id, // Generate a new UUID here
    instance_name: config.name,
    instance_kind: ObjectType.ImageItem,
    initial_layer_index: config.layer,
  }),
  fromTextConfig: (config: TextRendererConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.TextItem,
    initial_layer_index: config.layer,
  }),
  fromVideoConfig: (config: StVideoConfig): Layer => ({
    instance_id: config.id, // Generate a new UUID here
    instance_name: config.name,
    instance_kind: ObjectType.VideoItem,
    initial_layer_index: config.layer,
  }),
  fromCube3DConfig: (config: Cube3DConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.Cube3D,
    initial_layer_index: config.layer,
  }),
  fromSphere3DConfig: (config: Sphere3DConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.Sphere3D,
    initial_layer_index: config.layer,
  }),
  fromMockup3DConfig: (config: Mockup3DConfig): Layer => ({
    instance_id: config.id,
    instance_name: config.name,
    instance_kind: ObjectType.Mockup3D,
    initial_layer_index: config.layer,
  }),
};

export const SortableItem: React.FC<{
  sortableItems: Layer[];
  setSortableItems: React.Dispatch<React.SetStateAction<Layer[]>>;
  draggerId: string | null;
  setDraggerId: React.Dispatch<React.SetStateAction<string | null>>;
  itemId: string;
  kind: ObjectType;
  layerName: string;
  iconName: string;
  onItemsUpdated: () => void;
  onItemDuplicated: (id: string, kind: ObjectType) => void;
  onItemDeleted: (id: string, kind: ObjectType) => void;
}> = ({
  sortableItems,
  setSortableItems,
  draggerId,
  setDraggerId,
  itemId,
  kind,
  layerName,
  iconName,
  onItemsUpdated,
  onItemDuplicated,
  onItemDeleted,
}) => {
  const handleDragStart = () => {
    setDraggerId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Important for allowing drop
    if (!draggerId) return;

    const draggerPos = sortableItems.findIndex(
      (layer) => layer.instance_id === draggerId
    );
    const hoverPos = sortableItems.findIndex(
      (layer) => layer.instance_id === itemId
    );

    console.info("positions", draggerPos, hoverPos);

    if (draggerPos !== -1 && hoverPos !== -1 && draggerPos !== hoverPos) {
      const newItems = [...sortableItems];
      const item = newItems.splice(draggerPos, 1)[0];
      newItems.splice(hoverPos, 0, item);
      setSortableItems(newItems);
    }
  };

  const handleDragEnd = () => {
    setDraggerId(null);
    onItemsUpdated();
  };

  return (
    <div
      className="flex flex-row w-full justify-between items-center p-1 rounded-lg cursor-row-resize"
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center gap-2">
        <CreateIcon icon={iconName} size="24px" />
        <span className="text-gray-800 text-xs">{layerName}</span>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-gray-100 text-black px-1 py-1 rounded hover:bg-gray-300"
          onClick={() => onItemDuplicated(itemId, kind)}
        >
          <CreateIcon icon="copy" size="20px" />
        </button>
        <button
          className="bg-gray-100 text-black px-1 py-1 rounded hover:bg-gray-300"
          onClick={() => onItemDeleted(itemId, kind)}
        >
          <CreateIcon icon="trash" size="20px" />
        </button>
      </div>
    </div>
  );
};

export const LayerPanel: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  // onItemsUpdated: () => void;
  // onItemDuplicated: (id: string, kind: ObjectType) => void;
  // onItemDeleted: (id: string, kind: ObjectType) => void;
}> = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  layers,
  setLayers,
  // onItemsUpdated,
  // onItemDuplicated,
  // onItemDeleted,
}) => {
  const [draggerId, setDraggerId] = useState<string | null>(null);

  const update_layer_list = () => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let sequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );

    if (!sequence) {
      return;
    }

    let new_layers: Layer[] = [];

    editor.polygons.forEach((polygon) => {
      if (!polygon.hidden) {
        let polygon_config: PolygonConfig = polygon.toConfig();
        let new_layer: Layer =
          LayerFromConfig.fromPolygonConfig(polygon_config);
        new_layers.push(new_layer);
      }
    });
    editor.textItems.forEach((text) => {
      if (!text.hidden) {
        let text_config: TextRendererConfig = text.toConfig();
        let new_layer: Layer = LayerFromConfig.fromTextConfig(text_config);
        new_layers.push(new_layer);
      }
    });
    editor.imageItems.forEach((image) => {
      if (!image.hidden) {
        let image_config: StImageConfig = image.toConfig();
        let new_layer: Layer = LayerFromConfig.fromImageConfig(image_config);
        new_layers.push(new_layer);
      }
    });
    editor.videoItems.forEach((video) => {
      if (!video.hidden) {
        let video_config: StVideoConfig = video.toConfig();
        let new_layer: Layer = LayerFromConfig.fromVideoConfig(video_config);
        new_layers.push(new_layer);
      }
    });

    // sort layers by layer_index property, lower values should come first in the list
    // but reverse the order because the UI outputs the first one first, thus it displays last
    new_layers
      .sort((a, b) => b.initial_layer_index - a.initial_layer_index)
      .reverse();

    setLayers(new_layers);
  };

  const onItemDeleted = async (id: string, kind: ObjectType) => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let sequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );

    if (!sequence) {
      return;
    }

    switch (kind) {
      case ObjectType.Polygon:
        editor.polygons = editor.polygons.filter((p) => p.id !== id);
        sequence.activePolygons = sequence.activePolygons.filter(
          (p) => p.id !== id
        );
        break;
      case ObjectType.ImageItem:
        editor.imageItems = editor.imageItems.filter((i) => i.id !== id);
        sequence.activeImageItems = sequence.activeImageItems.filter(
          (i) => i.id !== id
        );
        break;

      case ObjectType.TextItem:
        editor.textItems = editor.textItems.filter((t) => t.id !== id);
        sequence.activeTextItems = sequence.activeTextItems.filter(
          (t) => t.id !== id
        );
        break;

      case ObjectType.VideoItem:
        editor.videoItems = editor.videoItems.filter((v) => v.id !== id);
        sequence.activeVideoItems = sequence.activeVideoItems.filter(
          (v) => v.id !== id
        );
        break;

      case ObjectType.Cube3D:
        editor.cubes3D = editor.cubes3D.filter((v) => v.id !== id);
        sequence.activeCubes3D = sequence.activeCubes3D?.filter(
          (v) => v.id !== id
        );
        break;

      case ObjectType.Sphere3D:
        editor.spheres3D = editor.spheres3D.filter((v) => v.id !== id);
        sequence.activeSpheres3D = sequence.activeSpheres3D?.filter(
          (v) => v.id !== id
        );
        break;

      case ObjectType.Mockup3D:
        editor.mockups3D = editor.mockups3D.filter((v) => v.id !== id);
        sequence.activeMockups3D = sequence.activeMockups3D?.filter(
          (v) => v.id !== id
        );
        break;

      default:
        break;
    }

    sequence.polygonMotionPaths = sequence.polygonMotionPaths?.filter(
      (pm) => pm.polygonId !== id
    );

    await saveSequencesData(editorState.savedState.sequences, editor.target);

    update_layer_list();
  };
  const onItemDuplicated = async (id: string, kind: ObjectType) => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;
    let saved_state = editorState?.savedState;

    if (!editor || !editorState || !saved_state) {
      return;
    }

    let camera = editor.camera;
    let gpuResources = editor.gpuResources;

    if (!camera || !gpuResources) {
      return;
    }

    let sequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );

    if (!sequence) {
      return;
    }

    let newId = uuidv4();

    switch (kind) {
      case ObjectType.Polygon:
        let polygonConfig = editor.polygons
          .find((p) => p.id === id)
          ?.toConfig();
        let savedPolygon = sequence.activePolygons.find((p) => p.id === id);

        if (!polygonConfig || !savedPolygon) {
          return;
        }

        polygonConfig.id = newId;
        polygonConfig.position = {
          x: polygonConfig.position.x + 50,
          y: polygonConfig.position.y + 50,
        };

        editor.add_polygon(
          polygonConfig,
          "Duplicated Polygon",
          newId,
          currentSequenceId
        );

        savedPolygon.id = newId;
        savedPolygon.name = "Duplicated Polygon";
        savedPolygon.position = {
          x: polygonConfig.position.x + 50,
          y: polygonConfig.position.y + 50,
        };

        saved_state.sequences.forEach((s) => {
          if (s.id == currentSequenceId) {
            s.activePolygons.push(savedPolygon);
          }
        });

        break;
      case ObjectType.ImageItem:
        let imageItem = structuredClone(
          editor.imageItems.find((i) => i.id === id)
        );
        let savedImageItem = sequence.activeImageItems.find((i) => i.id === id);

        if (!imageItem || !savedImageItem) {
          return;
        }

        imageItem.id = newId;
        imageItem.transform.updatePosition(
          [
            imageItem.transform.position[0] + 50,
            imageItem.transform.position[1] + 50,
          ],
          camera.windowSize
        );
        imageItem.transform.updateUniformBuffer(
          gpuResources.queue!,
          camera.windowSize
        );

        savedImageItem.id = newId;
        savedImageItem.name = "Duplicated Image";
        savedImageItem.position = {
          x: savedImageItem.position.x + 50,
          y: savedImageItem.position.y + 50,
        };

        saved_state.sequences.forEach((s) => {
          if (s.id == currentSequenceId) {
            s.activeImageItems.push(savedImageItem);
          }
        });

        break;

      case ObjectType.TextItem:
        let textItemConfig = editor.textItems
          .find((t) => t.id === id)
          ?.toConfig();
        let savedTextItem = sequence.activeTextItems.find((t) => t.id === id);

        if (!textItemConfig || !savedTextItem) {
          return;
        }

        textItemConfig.id = newId;
        textItemConfig.position = {
          x: textItemConfig.position.x + 50,
          y: textItemConfig.position.y + 50,
        };

        editor.add_text_item(
          textItemConfig,
          "Duplicated Text Item",
          newId,
          currentSequenceId
        );

        savedTextItem.id = newId;
        savedTextItem.position = {
          x: savedTextItem.position.x + 50,
          y: savedTextItem.position.y + 50,
        };

        saved_state.sequences.forEach((s) => {
          if (s.id == currentSequenceId) {
            s.activeTextItems.push(savedTextItem);
          }
        });

        break;

      case ObjectType.VideoItem:
        toast.error("Duplciating videos is not yet supported!");

        break;

      default:
        break;
    }

    let savedMotionPath = sequence.polygonMotionPaths?.find(
      (pm) => pm.polygonId === id
    );

    if (kind !== ObjectType.VideoItem) {
      if (
        savedMotionPath?.properties.find((p) => p.propertyPath === "position")
          ?.keyframes.length
      ) {
        savedMotionPath?.properties
          .find((p) => p.propertyPath === "position")
          ?.keyframes.forEach((kf) => {
            if (kf.value.type === "Position") {
              kf.value.value = [kf.value.value[0] + 50, kf.value.value[1] + 50];
            }
          });
      }

      await saveSequencesData(editorState.savedState.sequences, editor.target);

      update_layer_list();
    }
  };
  const onItemsUpdated = async () => {
    // use updated layer list to update the editor
    let editor = editorRef.current;
    let editorState = editorStateRef.current;
    let gpuResources = editor?.gpuResources;

    if (!editor || !editorState || !gpuResources) {
      return;
    }

    let camera = editor.camera;

    if (!camera) {
      return;
    }

    let sequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );

    if (!sequence) {
      return;
    }

    let device = gpuResources.device!;
    let queue = gpuResources.queue!;
    let windowSize = camera.windowSize;

    // update the layer property on each object that is not hidden
    editor.polygons.forEach((polygon) => {
      if (!polygon.hidden) {
        let index = layers.findIndex((l) => l.instance_id === polygon.id);
        if (index > -1) {
          const positiveLayer = layers.length - 1 - index;
          polygon.updateLayer(positiveLayer);
          polygon.transform.updateUniformBuffer(
            gpuResources.queue!,
            camera.windowSize
          );
          sequence.activePolygons.find((p) => p.id === polygon.id)!.layer =
            positiveLayer;
        }
      }
    });

    editor.textItems.forEach((text) => {
      if (!text.hidden) {
        let index = layers.findIndex((l) => l.instance_id === text.id);
        if (index > -1) {
          const positiveLayer = layers.length - 1 - index;
          text.updateLayer(device, queue, windowSize, positiveLayer);
          text.transform.updateUniformBuffer(
            gpuResources.queue!,
            camera.windowSize
          );
          sequence.activeTextItems.find((t) => t.id === text.id)!.layer =
            positiveLayer;
        }
      }
    });

    editor.imageItems.forEach((image) => {
      if (!image.hidden) {
        let index = layers.findIndex((l) => l.instance_id === image.id);
        if (index > -1) {
          const positiveLayer = layers.length - 1 - index;
          image.updateLayer(positiveLayer);
          image.transform.updateUniformBuffer(
            gpuResources.queue!,
            camera.windowSize
          );
          sequence.activeImageItems.find((i) => i.id === image.id)!.layer =
            positiveLayer;
        }
      }
    });

    editor.videoItems.forEach((video) => {
      if (!video.hidden) {
        let index = layers.findIndex((l) => l.instance_id === video.id);
        if (index > -1) {
          const positiveLayer = layers.length - 1 - index;
          video.updateLayer(positiveLayer);
          video.transform.updateUniformBuffer(
            gpuResources.queue!,
            camera.windowSize
          );
          sequence.activeVideoItems.find((v) => v.id === video.id)!.layer =
            positiveLayer;
        }
      }
    });

    await saveSequencesData(editorState.savedState.sequences, editor.target);

    update_layer_list();
  };

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-lg font-semibold mb-3">Scene</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {layers.map((layer) => {
          const iconName = (() => {
            switch (layer.instance_kind) {
              case ObjectType.Polygon:
                return "square";
              case ObjectType.TextItem:
                return "text";
              case ObjectType.ImageItem:
                return "image";
              case ObjectType.VideoItem:
                return "video";
              default:
                return "x"; // Default icon
            }
          })();

          return (
            <SortableItem
              key={layer.instance_id.toString()}
              sortableItems={layers}
              setSortableItems={setLayers}
              draggerId={draggerId}
              setDraggerId={setDraggerId}
              itemId={layer.instance_id}
              kind={layer.instance_kind}
              layerName={layer.instance_name}
              iconName={iconName}
              onItemsUpdated={onItemsUpdated}
              onItemDuplicated={onItemDuplicated}
              onItemDeleted={onItemDeleted}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;
