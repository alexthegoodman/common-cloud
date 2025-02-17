import { saveSequencesData } from "@/fetchers/projects";
import {
  AnimationData,
  AnimationProperty,
  EasingType,
  ObjectType,
  PathType,
  SavedState,
  UIKeyframe,
} from "./animations";
import { SavedPoint, SavedPolygonConfig } from "./polygon";
import { v4 as uuidv4 } from "uuid";
import { SavedTextRendererConfig } from "./text";
import { SavedStImageConfig } from "./image";
import { SavedStVideoConfig } from "./video";

export default class EditorState {
  selected_polygon_id: string = "";
  savedState: SavedState;

  constructor(savedState: SavedState) {
    this.savedState = savedState;
  }

  save_default_keyframes(
    savable_item_id: string,
    object_type: ObjectType,
    object_position: SavedPoint
  ): AnimationData {
    let properties: AnimationProperty[] = [];

    let position_keyframes: UIKeyframe[] = [];

    position_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      // value: { type: "Position", value: [object_position.x, object_position.y - 100]),
      value: {
        type: "Position",
        value: [object_position.x, object_position.y - 100],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 2500,
      value: {
        type: "Position",
        value: [object_position.x, object_position.y - 50],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 5000,
      value: {
        type: "Position",
        value: [object_position.x, object_position.y],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 15000,
      value: {
        type: "Position",
        value: [object_position.x, object_position.y + 50],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 17500,
      value: {
        type: "Position",
        value: [object_position.x, object_position.y + 100],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 20000,
      value: {
        type: "Position",
        value: [object_position.x, object_position.y + 150],
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    let rotation_keyframes: UIKeyframe[] = [];

    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      // value: { type: "Rotation", value: 0 },
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 2500,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 5000,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 15000,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 17500,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 20000,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let rotation_prop = {
      name: "Rotation",
      propertyPath: "rotation",
      children: [],
      keyframes: rotation_keyframes,
      depth: 0,
    };

    let scale_keyframes: UIKeyframe[] = [];

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 2500,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 5000,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 15000,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 17500,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 20000,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let scale_prop = {
      name: "Scale",
      propertyPath: "scale",
      children: [],
      keyframes: scale_keyframes,
      depth: 0,
    };

    let opacity_keyframes: UIKeyframe[] = [];

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 2500,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 5000,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 15000,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 17500,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 20000,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let opacity_prop = {
      name: "Opacity",
      propertyPath: "opacity",
      children: [],
      keyframes: opacity_keyframes,
      depth: 0,
    };

    properties.push(position_prop);
    properties.push(rotation_prop);
    properties.push(scale_prop);
    // properties.push(perspective_x_prop);
    // properties.push(perspective_y_prop);
    properties.push(opacity_prop);

    if (object_type == ObjectType.VideoItem) {
      let zoom_keyframes: UIKeyframe[] = [];

      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Zoom", value: 100 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      // zoom_keyframes.push({
      //     id: uuidv4().toString(),
      //     time: 2500,
      //     value: { type: "Position", value: [object_position.x, object_position.y - 50]),
      //     easing: EasingType.EaseInOut,
      //     pathType: PathType.Linear,
      //     keyType: { type: "Frame" }, curveData: null
      // });
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 5000,
        value: { type: "Zoom", value: 135 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 15000,
        value: { type: "Zoom", value: 135 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      // zoom_keyframes.push({
      //     id: uuidv4().toString(),
      //     time: 17500,
      //     value: { type: "Position", value: [object_position.x, object_position.y + 100]),
      //     easing: EasingType.EaseInOut,
      //     pathType: PathType.Linear,
      //     keyType: { type: "Frame" }, curveData: null
      // });
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 20000,
        value: { type: "Zoom", value: 100 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      let zoom_prop = {
        name: "Zoom / Popout",
        propertyPath: "zoom",
        children: [],
        keyframes: zoom_keyframes,
        depth: 0,
      };

      properties.push(zoom_prop);
    }

    let new_motion_path: AnimationData = {
      id: uuidv4().toString(),
      objectType: object_type,
      polygonId: savable_item_id,
      duration: 20000,
      startTimeMs: 0,
      position: [0, 0],
      properties: properties,
    };

    return new_motion_path;
  }

  async add_saved_polygon(
    selected_sequence_id: string,
    savable_polygon: SavedPolygonConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_polygon.id,
      ObjectType.Polygon,
      savable_polygon.position
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activePolygons.push(savable_polygon);
        s.polygonMotionPaths.push(new_motion_path);
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences);

    this.savedState = saved_state;
  }

  async add_saved_text_item(
    selected_sequence_id: string,
    savable_text: SavedTextRendererConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.Polygon,
      savable_text.position
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activeTextItems.push(savable_text);
        s.polygonMotionPaths.push(new_motion_path);
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences);

    this.savedState = saved_state;
  }

  async add_saved_image_item(
    selected_sequence_id: string,
    savable_text: SavedStImageConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.ImageItem,
      savable_text.position
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activeImageItems.push(savable_text);
        s.polygonMotionPaths.push(new_motion_path);
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences);

    this.savedState = saved_state;
  }

  async add_saved_video_item(
    selected_sequence_id: string,
    savable_text: SavedStVideoConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.VideoItem,
      savable_text.position
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activeVideoItems.push(savable_text);
        s.polygonMotionPaths.push(new_motion_path);
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences);

    this.savedState = saved_state;
  }
}
