import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Make sure you have uuid installed: npm install uuid
import { PolygonConfig } from "@/engine/polygon";
import { StImageConfig } from "@/engine/image";
import { TextRendererConfig } from "@/engine/text";
import { StVideoConfig } from "@/engine/video";
import { ObjectType } from "@/engine/animations";
import { CreateIcon } from "./icon";

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
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  onItemsUpdated: () => void;
  onItemDuplicated: (id: string, kind: ObjectType) => void;
  onItemDeleted: (id: string, kind: ObjectType) => void;
}> = ({
  layers,
  setLayers,
  onItemsUpdated,
  onItemDuplicated,
  onItemDeleted,
}) => {
  const [draggerId, setDraggerId] = useState<string | null>(null);

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
