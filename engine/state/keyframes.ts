import {
  AnimationData,
  AnimationProperty,
  EasingType,
  ObjectType,
  PathType,
  UIKeyframe,
} from "../animations";
import EditorState from "../editor_state";
import { SavedPoint } from "../polygon";
import { v4 as uuidv4 } from "uuid";

export function save_default_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  object_position: SavedPoint,
  durationMs: number
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
    easing: EasingType.Linear,
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
    time: durationMs - 5000,
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
    time: durationMs - 2500,
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
    time: durationMs,
    value: {
      type: "Position",
      value: [object_position.x, object_position.y + 150],
    },
    easing: EasingType.Linear,
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
    easing: EasingType.Linear,
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
    time: durationMs - 5000,
    value: { type: "Rotation", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  rotation_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "Rotation", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  rotation_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "Rotation", value: 0 },
    easing: EasingType.Linear,
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
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let scale_prop = {
    name: "Scale X",
    propertyPath: "scalex",
    children: [],
    keyframes: scale_keyframes,
    depth: 0,
  };

  let scale_y_keyframes: UIKeyframe[] = [];

  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let scale_y_prop = {
    name: "Scale Y",
    propertyPath: "scaley",
    children: [],
    keyframes: scale_y_keyframes,
    depth: 0,
  };

  let opacity_keyframes: UIKeyframe[] = [];

  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.Linear,
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
    time: durationMs - 5000,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.Linear,
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

  let perspective_x_keyframes: UIKeyframe[] = [];

  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_x_prop = {
    name: "Perspective X",
    propertyPath: "perspectiveX",
    children: [],
    keyframes: perspective_x_keyframes,
    depth: 0,
  };

  let perspective_y_keyframes: UIKeyframe[] = [];

  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_y_prop = {
    name: "Perspective Y",
    propertyPath: "perspectiveY",
    children: [],
    keyframes: perspective_y_keyframes,
    depth: 0,
  };

  properties.push(position_prop);
  properties.push(rotation_prop);
  properties.push(scale_prop);
  properties.push(scale_y_prop);
  properties.push(perspective_x_prop);
  properties.push(perspective_y_prop);
  properties.push(opacity_prop);

  if (object_type == ObjectType.VideoItem) {
    let zoom_keyframes: UIKeyframe[] = [];

    zoom_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: {
        type: "Zoom",
        value: {
          position: [20, 20],
          zoomLevel: 100,
        },
      },
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
      value: {
        type: "Zoom",
        value: {
          position: [40, 40],
          zoomLevel: 135,
        },
      },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    zoom_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs - 5000,
      value: {
        type: "Zoom",
        value: {
          position: [60, 60],
          zoomLevel: 135,
        },
      },
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
      time: durationMs,
      value: {
        type: "Zoom",
        value: {
          position: [80, 80],
          zoomLevel: 100,
        },
      },
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
    duration: durationMs,
    startTimeMs: 0,
    position: [0, 0],
    properties: properties,
  };

  return new_motion_path;
}

export function remove_position_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData
) {
  let durationMs = current_keyframes.duration;

  let properties: AnimationProperty[] = [];

  let non_positions = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_positions) {
    non_positions.forEach((pos) => {
      properties.push(pos);
    });
  }

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

export function save_perspective_x_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData
) {
  let durationMs = current_keyframes.duration;

  let properties: AnimationProperty[] = [];

  let position_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "position"
  );

  if (position_prop) {
    properties.push(position_prop);
  }

  let rotation_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "rotation"
  );

  if (rotation_prop) {
    properties.push(rotation_prop);
  }

  let scale_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scalex"
  );

  if (scale_prop) {
    properties.push(scale_prop);
  }

  let scale_y_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scaley"
  );

  if (scale_y_prop) {
    properties.push(scale_y_prop);
  }

  let opacity_keyframes: UIKeyframe[] = [];

  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "Opacity", value: 0 },
    easing: EasingType.Linear,
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
    time: durationMs - 5000,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "Opacity", value: 0 },
    easing: EasingType.Linear,
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

  let perspective_x_keyframes: UIKeyframe[] = [];

  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveX", value: 20 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveX", value: 10 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveX", value: 10 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveX", value: 20 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_x_prop = {
    name: "Perspective X",
    propertyPath: "perspectiveX",
    children: [],
    keyframes: perspective_x_keyframes,
    depth: 0,
  };

  let perspective_y_keyframes: UIKeyframe[] = [];

  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_y_prop = {
    name: "Perspective Y",
    propertyPath: "perspectiveY",
    children: [],
    keyframes: perspective_y_keyframes,
    depth: 0,
  };

  properties.push(perspective_x_prop);
  properties.push(perspective_y_prop);
  properties.push(opacity_prop);

  if (object_type === ObjectType.VideoItem) {
    let zoom_prop = current_keyframes.properties.find(
      (p) => p.propertyPath === "zoom"
    );

    if (zoom_prop) {
      properties.push(zoom_prop);
    }
  }

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

export function save_perspective_y_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData
) {
  let durationMs = current_keyframes.duration;

  let properties: AnimationProperty[] = [];

  let position_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "position"
  );

  if (position_prop) {
    properties.push(position_prop);
  }

  let rotation_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "rotation"
  );

  if (rotation_prop) {
    properties.push(rotation_prop);
  }

  let scale_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scalex"
  );

  if (scale_prop) {
    properties.push(scale_prop);
  }

  let scale_y_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scaley"
  );

  if (scale_y_prop) {
    properties.push(scale_y_prop);
  }

  let opacity_keyframes: UIKeyframe[] = [];

  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "Opacity", value: 0 },
    easing: EasingType.Linear,
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
    time: durationMs - 5000,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "Opacity", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "Opacity", value: 0 },
    easing: EasingType.Linear,
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

  let perspective_x_keyframes: UIKeyframe[] = [];

  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_x_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveX", value: 0 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_x_prop = {
    name: "Perspective X",
    propertyPath: "perspectiveX",
    children: [],
    keyframes: perspective_x_keyframes,
    depth: 0,
  };

  let perspective_y_keyframes: UIKeyframe[] = [];

  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "PerspectiveY", value: 20 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "PerspectiveY", value: 10 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 5000,
    value: { type: "PerspectiveY", value: 0 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs - 2500,
    value: { type: "PerspectiveY", value: 10 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  perspective_y_keyframes.push({
    id: uuidv4().toString(),
    time: durationMs,
    value: { type: "PerspectiveY", value: 20 },
    easing: EasingType.Linear,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let perspective_y_prop = {
    name: "Perspective Y",
    propertyPath: "perspectiveY",
    children: [],
    keyframes: perspective_y_keyframes,
    depth: 0,
  };

  properties.push(perspective_x_prop);
  properties.push(perspective_y_prop);
  properties.push(opacity_prop);

  if (object_type === ObjectType.VideoItem) {
    let zoom_prop = current_keyframes.properties.find(
      (p) => p.propertyPath === "zoom"
    );

    if (zoom_prop) {
      properties.push(zoom_prop);
    }
  }

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

export function save_configurable_perspective_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  options: {
    applyX: boolean;
    applyY: boolean;
    degrees: number;
    fadeIn: boolean;
    fadeOut: boolean;
    animateTo: boolean; // true = animate TO perspective, false = animate FROM perspective
  }
) {
  let durationMs = current_keyframes.duration;

  let properties: AnimationProperty[] = [];

  let position_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "position"
  );

  if (position_prop) {
    properties.push(position_prop);
  }

  let rotation_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "rotation"
  );

  if (rotation_prop) {
    properties.push(rotation_prop);
  }

  let scale_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scalex"
  );

  if (scale_prop) {
    properties.push(scale_prop);
  }

  let scale_y_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scaley"
  );

  if (scale_y_prop) {
    properties.push(scale_y_prop);
  }

  // Fade animation
  if (options.fadeIn || options.fadeOut) {
    let opacity_keyframes: UIKeyframe[] = [];

    if (options.fadeIn && options.fadeOut) {
      // Both fade in and fade out
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Opacity", value: 0 },
        easing: EasingType.Linear,
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
        time: durationMs - 5000,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs - 2500,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "Opacity", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    } else if (options.fadeIn) {
      // Only fade in
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Opacity", value: 0 },
        easing: EasingType.Linear,
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
        time: durationMs,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    } else if (options.fadeOut) {
      // Only fade out
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs - 2500,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "Opacity", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let opacity_prop = {
      name: "Opacity",
      propertyPath: "opacity",
      children: [],
      keyframes: opacity_keyframes,
      depth: 0,
    };

    properties.push(opacity_prop);
  }

  // Perspective X animation
  if (options.applyX) {
    let perspective_x_keyframes: UIKeyframe[] = [];

    if (options.animateTo) {
      // Animate TO perspective (start normal, end at perspective)
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "PerspectiveX", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: 2500,
        value: { type: "PerspectiveX", value: options.degrees / 2 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: 5000,
        value: { type: "PerspectiveX", value: options.degrees },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "PerspectiveX", value: options.degrees },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    } else {
      // Animate FROM perspective (start at perspective, end normal)
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "PerspectiveX", value: options.degrees },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      // perspective_x_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: 2500,
      //   value: { type: "PerspectiveX", value: options.degrees / 2 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_x_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: 5000,
      //   value: { type: "PerspectiveX", value: 0 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_x_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs - 5000,
      //   value: { type: "PerspectiveX", value: 0 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_x_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs - 2500,
      //   value: { type: "PerspectiveX", value: options.degrees / 2 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_x_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs,
      //   value: { type: "PerspectiveX", value: options.degrees },
      //   easing: EasingType.Linear,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      perspective_x_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "PerspectiveX", value: 0 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let perspective_x_prop = {
      name: "Perspective X",
      propertyPath: "perspectiveX",
      children: [],
      keyframes: perspective_x_keyframes,
      depth: 0,
    };

    properties.push(perspective_x_prop);
  }

  // Perspective Y animation
  if (options.applyY) {
    let perspective_y_keyframes: UIKeyframe[] = [];

    if (options.animateTo) {
      // Animate TO perspective (start normal, end at perspective)
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "PerspectiveY", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: 2500,
        value: { type: "PerspectiveY", value: options.degrees / 2 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: 5000,
        value: { type: "PerspectiveY", value: options.degrees },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "PerspectiveY", value: options.degrees },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    } else {
      // Animate FROM perspective (start at perspective, end normal)
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "PerspectiveY", value: options.degrees },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      // perspective_y_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: 2500,
      //   value: { type: "PerspectiveY", value: options.degrees / 2 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_y_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: 5000,
      //   value: { type: "PerspectiveY", value: 0 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_y_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs - 5000,
      //   value: { type: "PerspectiveY", value: 0 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_y_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs - 2500,
      //   value: { type: "PerspectiveY", value: options.degrees / 2 },
      //   easing: EasingType.EaseInOut,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      // perspective_y_keyframes.push({
      //   id: uuidv4().toString(),
      //   time: durationMs,
      //   value: { type: "PerspectiveY", value: options.degrees },
      //   easing: EasingType.Linear,
      //   pathType: PathType.Linear,
      //   keyType: { type: "Frame" },
      //   curveData: null,
      // });
      perspective_y_keyframes.push({
        id: uuidv4().toString(),
        time: durationMs,
        value: { type: "PerspectiveY", value: 0 },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let perspective_y_prop = {
      name: "Perspective Y",
      propertyPath: "perspectiveY",
      children: [],
      keyframes: perspective_y_keyframes,
      depth: 0,
    };

    properties.push(perspective_y_prop);
  }

  if (object_type === ObjectType.VideoItem) {
    let zoom_prop = current_keyframes.properties.find(
      (p) => p.propertyPath === "zoom"
    );

    if (zoom_prop) {
      properties.push(zoom_prop);
    }
  }

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

export function save_spin_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  options: {
    spinX: boolean;
    spinY: boolean;
    spinZ: boolean;
    rotations: number;
    duration: number;
  }
) {
  let durationMs = options.duration;
  let totalDegrees = options.rotations * 360;

  let properties: AnimationProperty[] = [];

  // Preserve existing position, scale properties
  let position_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "position"
  );
  if (position_prop) {
    properties.push(position_prop);
  }

  let scale_x_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scalex"
  );
  if (scale_x_prop) {
    properties.push(scale_x_prop);
  }

  let scale_y_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "scaley"
  );
  if (scale_y_prop) {
    properties.push(scale_y_prop);
  }

  let opacity_prop = current_keyframes.properties.find(
    (p) => p.propertyPath === "opacity"
  );
  if (opacity_prop) {
    properties.push(opacity_prop);
  }

  // X Axis rotation (PerspectiveX)
  if (options.spinX) {
    let perspective_x_keyframes: UIKeyframe[] = [];

    perspective_x_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "PerspectiveX", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    perspective_x_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs,
      value: { type: "PerspectiveX", value: totalDegrees },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let perspective_x_prop = {
      name: "PerspectiveX",
      propertyPath: "perspectiveX",
      children: [],
      keyframes: perspective_x_keyframes,
      depth: 0,
    };

    properties.push(perspective_x_prop);
  }

  // Y Axis rotation (PerspectiveY)
  if (options.spinY) {
    let perspective_y_keyframes: UIKeyframe[] = [];

    perspective_y_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "PerspectiveY", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    perspective_y_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs,
      value: { type: "PerspectiveY", value: totalDegrees },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    let perspective_y_prop = {
      name: "PerspectiveY",
      propertyPath: "perspectiveY",
      children: [],
      keyframes: perspective_y_keyframes,
      depth: 0,
    };

    properties.push(perspective_y_prop);
  }

  // Z Axis rotation (Rotation)
  if (options.spinZ) {
    let rotation_keyframes: UIKeyframe[] = [];

    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs,
      value: { type: "Rotation", value: totalDegrees },
      easing: EasingType.Linear,
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

    properties.push(rotation_prop);
  }

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// TODO: make work with variable duration
export function save_pulse_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData
): AnimationData {
  let properties: AnimationProperty[] = [];

  let position_keyframes: UIKeyframe[] = [];

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  let rotation_keyframes: UIKeyframe[] = [];

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
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "ScaleX", value: 110 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 15000,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 17500,
    value: { type: "ScaleX", value: 110 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 20000,
    value: { type: "ScaleX", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let scale_prop = {
    name: "Scale X",
    propertyPath: "scalex",
    children: [],
    keyframes: scale_keyframes,
    depth: 0,
  };

  let scale_y_keyframes: UIKeyframe[] = [];

  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 2500,
    value: { type: "ScaleY", value: 110 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 5000,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 15000,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 17500,
    value: { type: "ScaleY", value: 110 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });
  scale_y_keyframes.push({
    id: uuidv4().toString(),
    time: 20000,
    value: { type: "ScaleY", value: 100 },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let scale_y_prop = {
    name: "Scale Y",
    propertyPath: "scaley",
    children: [],
    keyframes: scale_y_keyframes,
    depth: 0,
  };

  let opacity_keyframes: UIKeyframe[] = [];

  opacity_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "Opacity", value: 0 },
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
    value: { type: "Opacity", value: 0 },
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
  properties.push(scale_y_prop);
  // properties.push(perspective_x_prop);
  // properties.push(perspective_y_prop);
  properties.push(opacity_prop);

  if (object_type == ObjectType.VideoItem) {
    let props = current_keyframes.properties.find(
      (p) => p.propertyPath === "zoom"
    );

    let zoom_keyframes: UIKeyframe[] = [];

    if (props) {
      zoom_keyframes = props.keyframes;
    } else {
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: {
          type: "Zoom",
          value: {
            position: [20, 20],
            zoomLevel: 100,
          },
        },
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
        value: {
          type: "Zoom",
          value: {
            position: [40, 40],
            zoomLevel: 135,
          },
        },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 15000,
        value: {
          type: "Zoom",
          value: {
            position: [60, 60],
            zoomLevel: 135,
          },
        },
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
        value: {
          type: "Zoom",
          value: {
            position: [80, 80],
            zoomLevel: 100,
          },
        },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }
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

export interface ScaleFadePulseConfig {
  startScale: number; // Starting scale percentage (e.g., 50 for 50%, 150 for 150%)
  targetScale: number; // Target scale percentage (e.g., 100 for 100%)
  rippleCount: number; // Number of ripples (0 for none, 1+ for ripple effect)
  rippleIntensity: number; // Ripple overshoot percentage (e.g., 10 means 10% overshoot)
  durationMs: number; // Total duration of the animation
  fadeIn: boolean; // Whether to fade in from 0 to 100 opacity
  fadeOut: boolean; // Whether to fade out from 100 to 0 opacity
}

export function save_scale_fade_pulse_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  config: ScaleFadePulseConfig
): AnimationData {
  let properties: AnimationProperty[] = [];

  let position_keyframes: UIKeyframe[] = [];
  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  let rotation_keyframes: UIKeyframe[] = [];
  let rotation_prop = {
    name: "Rotation",
    propertyPath: "rotation",
    children: [],
    keyframes: rotation_keyframes,
    depth: 0,
  };

  // Generate scale keyframes with ripple effect
  let scale_keyframes: UIKeyframe[] = [];

  // Start keyframe
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: 0,
    value: { type: "ScaleX", value: config.startScale },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  // Calculate ripple keyframes
  if (config.rippleCount > 0) {
    const totalRippleTime = config.durationMs * 0.6; // Use 60% of duration for ripples
    const rippleSegment = totalRippleTime / (config.rippleCount + 1);

    for (let i = 0; i < config.rippleCount; i++) {
      const rippleTime = rippleSegment * (i + 1);
      const overshoot =
        config.targetScale > config.startScale
          ? config.targetScale + config.rippleIntensity
          : config.targetScale - config.rippleIntensity;

      // Overshoot keyframe
      scale_keyframes.push({
        id: uuidv4().toString(),
        time: rippleTime,
        value: { type: "ScaleX", value: overshoot },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      // Settle back keyframe
      scale_keyframes.push({
        id: uuidv4().toString(),
        time: rippleTime + rippleSegment * 0.5,
        value: { type: "ScaleX", value: config.targetScale },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }
  }

  // End keyframe
  scale_keyframes.push({
    id: uuidv4().toString(),
    time: config.durationMs,
    value: { type: "ScaleX", value: config.targetScale },
    easing: EasingType.EaseInOut,
    pathType: PathType.Linear,
    keyType: { type: "Frame" },
    curveData: null,
  });

  let scale_prop = {
    name: "Scale X",
    propertyPath: "scalex",
    children: [],
    keyframes: scale_keyframes,
    depth: 0,
  };

  // Generate scale Y keyframes (same as X for uniform scaling)
  let scale_y_keyframes: UIKeyframe[] = scale_keyframes.map((kf) => ({
    ...kf,
    id: uuidv4().toString(),
    value: { type: "ScaleY", value: (kf.value as any).value },
  }));

  let scale_y_prop = {
    name: "Scale Y",
    propertyPath: "scaley",
    children: [],
    keyframes: scale_y_keyframes,
    depth: 0,
  };

  // Generate opacity keyframes
  let opacity_keyframes: UIKeyframe[] = [];

  if (config.fadeIn) {
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: config.durationMs * 0.3,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  } else {
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  if (config.fadeOut) {
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: config.durationMs * 0.7,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: config.durationMs,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  } else {
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: config.durationMs,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

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
  properties.push(scale_y_prop);
  properties.push(opacity_prop);

  if (object_type == ObjectType.VideoItem) {
    let props = current_keyframes.properties.find(
      (p) => p.propertyPath === "zoom"
    );

    let zoom_keyframes: UIKeyframe[] = [];

    if (props) {
      zoom_keyframes = props.keyframes;
    } else {
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: {
          type: "Zoom",
          value: {
            position: [20, 20],
            zoomLevel: 100,
          },
        },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      zoom_keyframes.push({
        id: uuidv4().toString(),
        time: config.durationMs,
        value: {
          type: "Zoom",
          value: {
            position: [20, 20],
            zoomLevel: 100,
          },
        },
        easing: EasingType.EaseInOut,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }
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
    duration: config.durationMs,
    startTimeMs: 0,
    position: [0, 0],
    properties: properties,
  };

  return new_motion_path;
}

export function save_circular_motion_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  radius: number,
  rotation: number = 0
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let center_x = current_position[0];
  let center_y = current_position[1];
  let num_points = 16;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let angle = (i / num_points) * 2 * Math.PI + (rotation * Math.PI) / 180;
    let x = center_x + radius * Math.cos(angle);
    let y = center_y + radius * Math.sin(angle);

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    // position: current_keyframes.position,
    position: [0, 0],
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 1. PENDULUM SWING - Hypnotic back-and-forth rhythm
export function save_pendulum_swing_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  swing_width: number,
  swing_periods: number = 2
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let center_x = current_position[0];
  let center_y = current_position[1];
  let num_points = 60;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    // Pendulum motion: sinusoidal with damping for realism
    let t = i / num_points;
    let angle = Math.sin(t * swing_periods * 2 * Math.PI);
    let damping = Math.exp(-t * 0.5); // Gentle damping over time
    let x = center_x + swing_width * angle * damping;
    let y = center_y;

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 2. FIGURE-8 INFINITY - Smooth infinity symbol motion
export function save_figure_eight_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  width: number,
  height: number,
  loops: number = 1
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let center_x = current_position[0];
  let center_y = current_position[1];
  let num_points = 80;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let t = (i / num_points) * loops * 2 * Math.PI;
    // Lissajous curve with 2:1 frequency ratio creates figure-8
    let x = center_x + (width / 2) * Math.sin(t);
    let y = center_y + (height / 2) * Math.sin(2 * t);

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 3. RIPPLE EFFECT - Concentric expansion with scale
export function save_ripple_effect_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  max_scale: number = 3,
  ripple_count: number = 2
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  // Keep non-scale/position properties
  let non_ripple_props = current_keyframes.properties.filter(
    (p) =>
      p.propertyPath !== "scalex" &&
      p.propertyPath !== "scaley" &&
      p.propertyPath !== "position"
  );

  if (non_ripple_props) {
    non_ripple_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  // Position stays constant
  let position_keyframes: UIKeyframe[] = [
    {
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Position", value: current_position },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    },
  ];

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  // Scale creates the ripple effect
  let scale_keyframes: UIKeyframe[] = [];
  let scale_y_keyframes: UIKeyframe[] = [];
  let num_points = 40;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let t = i / num_points;
    // Multiple ripples with phase shifts
    let scale = 1;
    for (let r = 0; r < ripple_count; r++) {
      let phase = (r / ripple_count) * Math.PI * 2;
      let ripple_t = t * ripple_count * Math.PI * 2 + phase;
      scale += (max_scale - 1) * Math.sin(ripple_t) * Math.exp(-t * 2);
    }
    scale = Math.max(0.1, scale); // Prevent negative scaling

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "ScaleX", value: scale * 100 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "ScaleY", value: scale * 100 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let scale_prop = {
    name: "Scale X",
    propertyPath: "scalex",
    children: [],
    keyframes: scale_keyframes,
    depth: 0,
  };

  let scale_y_prop = {
    name: "Scale Y",
    propertyPath: "scaley",
    children: [],
    keyframes: scale_y_keyframes,
    depth: 0,
  };

  properties.push(position_prop);
  properties.push(scale_prop);
  properties.push(scale_y_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 4. SPIRAL MOTION - Expanding/contracting spiral
export function save_spiral_motion_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  max_radius: number,
  spiral_turns: number = 3,
  direction: "outward" | "inward" = "outward"
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let center_x = current_position[0];
  let center_y = current_position[1];
  let num_points = 60;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let t = i / num_points;
    let angle = t * spiral_turns * 2 * Math.PI;

    let radius;
    if (direction === "outward") {
      radius = t * max_radius;
    } else {
      radius = (1 - t) * max_radius;
    }

    let x = center_x + radius * Math.cos(angle);
    let y = center_y + radius * Math.sin(angle);

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 5. BOUNCING BALL - Physics-based bounce with gravity
export function save_bouncing_ball_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  bounce_height: number,
  bounces: number = 3,
  gravity_strength: number = 1
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let start_x = current_position[0];
  let ground_y = current_position[1];
  let num_points = 60;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let t = i / num_points;

    // Calculate which bounce we're in
    let bounce_duration = 1 / bounces;
    let current_bounce = Math.floor(t / bounce_duration);
    let bounce_t = (t % bounce_duration) / bounce_duration;

    // Height decreases with each bounce
    let current_height = bounce_height * Math.pow(0.7, current_bounce);

    // Parabolic motion for each bounce
    let y = ground_y - current_height * 4 * bounce_t * (1 - bounce_t);

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [start_x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// NEW ANIMATION TEMPLATE - 6. FLOATING BUBBLES - Gentle rise with subtle drift
export function save_floating_bubbles_keyframes(
  editorState: EditorState,
  savable_item_id: string,
  object_type: ObjectType,
  current_keyframes: AnimationData,
  current_position: [number, number],
  rise_distance: number,
  drift_amount: number = 50
): AnimationData {
  let durationMs = current_keyframes.duration;
  let properties: AnimationProperty[] = [];

  let non_position_props = current_keyframes.properties.filter(
    (p) => p.propertyPath !== "position"
  );

  if (non_position_props) {
    non_position_props.forEach((prop) => {
      properties.push(prop);
    });
  }

  let position_keyframes: UIKeyframe[] = [];
  let start_x = current_position[0];
  let start_y = current_position[1];
  let num_points = 50;
  let time_step = durationMs / num_points;

  for (let i = 0; i <= num_points; i++) {
    let t = i / num_points;

    // Gentle upward motion with easing
    let y = start_y - rise_distance * t;

    // Subtle horizontal drift with multiple sine waves for naturalism
    let drift =
      drift_amount *
      (0.5 * Math.sin(t * Math.PI * 3) +
        0.3 * Math.sin(t * Math.PI * 5 + 1) +
        0.2 * Math.sin(t * Math.PI * 7 + 2)) *
      t; // Drift increases over time

    let x = start_x + drift;

    position_keyframes.push({
      id: uuidv4().toString(),
      time: i * time_step,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
  }

  let position_prop = {
    name: "Position",
    propertyPath: "position",
    children: [],
    keyframes: position_keyframes,
    depth: 0,
  };

  properties.push(position_prop);

  let new_motion_path: AnimationData = {
    id: uuidv4().toString(),
    objectType: object_type,
    polygonId: savable_item_id,
    duration: durationMs,
    startTimeMs: current_keyframes.startTimeMs,
    position: current_keyframes.position,
    properties: properties,
  };

  return new_motion_path;
}

// CHOREOGRAPHED TEMPLATE - 1. CONFETTI EXPLOSION - Multiple objects burst and fall with gravity
export function save_confetti_explosion_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  explosion_center: [number, number],
  explosion_force: number = 200,
  gravity_strength: number = 300
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    // Keep non-position properties
    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let start_x = explosion_center[0];
    let start_y = explosion_center[1];
    let num_points = 60;
    let time_step = durationMs / num_points;

    // Random explosion direction for each object
    let angle =
      (i / savable_item_ids.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    let initial_velocity_x =
      Math.cos(angle) * explosion_force * (0.8 + Math.random() * 0.4);
    let initial_velocity_y =
      Math.sin(angle) * explosion_force * (0.8 + Math.random() * 0.4);

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time_seconds = (durationMs / 1000) * t;

      // Physics: position = initial_pos + velocity*time + 0.5*acceleration*time^2
      let x = start_x + initial_velocity_x * time_seconds;
      let y =
        start_y +
        initial_velocity_y * time_seconds +
        0.5 * gravity_strength * time_seconds * time_seconds;

      position_keyframes.push({
        id: uuidv4().toString(),
        time: j * time_step,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    properties.push(position_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// CHOREOGRAPHED TEMPLATE - 2. FLOCK FORMATION - Objects move in coordinated formation like birds
export function save_flock_formation_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  formation_center: [number, number],
  target_position: [number, number],
  formation_spacing: number = 80
): AnimationData[] {
  let animations: AnimationData[] = [];
  let num_objects = savable_item_ids.length;

  for (let i = 0; i < num_objects; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let num_points = 50;
    let time_step = durationMs / num_points;

    // Calculate formation positions (V-shape)
    let formation_row = Math.floor(i / 2);
    let formation_side = i % 2 === 0 ? -1 : 1;
    let formation_offset_x =
      formation_side * formation_row * formation_spacing * 0.5;
    let formation_offset_y = formation_row * formation_spacing * 0.8;

    let start_x = formation_center[0] + formation_offset_x;
    let start_y = formation_center[1] + formation_offset_y;
    let end_x = target_position[0] + formation_offset_x;
    let end_y = target_position[1] + formation_offset_y;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;

      // Smooth interpolation with slight wave motion for organic feel
      let base_x = start_x + (end_x - start_x) * t;
      let base_y = start_y + (end_y - start_y) * t;

      // Add subtle wing-flap motion
      let wave_amplitude = 15 * Math.sin(t * Math.PI * 2); // Decreases over time
      let wave_x = wave_amplitude * Math.sin(t * Math.PI * 8 + i * 0.5);
      let wave_y = wave_amplitude * 0.3 * Math.cos(t * Math.PI * 6 + i * 0.3);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: j * time_step,
        value: {
          type: "Position",
          value: [base_x + wave_x, base_y + wave_y],
        },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    properties.push(position_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// CHOREOGRAPHED TEMPLATE - 3. RIPPLE WAVE - Objects animate in sequence like a wave traveling through
export function save_ripple_wave_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  object_positions: [number, number][],
  wave_amplitude: number = 100,
  wave_speed: number = 2
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let base_x = object_positions[i][0];
    let base_y = object_positions[i][1];
    let num_points = 60;
    let time_step = durationMs / num_points;

    // Phase delay based on object index creates wave effect
    let phase_delay = (i / savable_item_ids.length) * Math.PI * 2;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let wave_time = t * wave_speed * Math.PI * 2 + phase_delay;

      // Vertical wave motion
      let y_offset = wave_amplitude * Math.sin(wave_time) * Math.exp(-t * 0.5);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: j * time_step,
        value: { type: "Position", value: [base_x, base_y + y_offset] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    properties.push(position_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// CHOREOGRAPHED TEMPLATE - 4. DOMINO CASCADE - Objects fall in sequence like dominos
export function save_domino_cascade_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  object_positions: [number, number][],
  cascade_delay_ms: number = 100
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    // Keep non-rotation properties
    let non_rotation_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "rotation" && p.propertyPath !== "position"
    );

    if (non_rotation_props) {
      non_rotation_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    // Position stays the same
    let position_keyframes: UIKeyframe[] = [
      {
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Position", value: object_positions[i] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      },
    ];

    // Rotation creates the falling effect
    let rotation_keyframes: UIKeyframe[] = [];
    let delay_time = i * cascade_delay_ms;
    let fall_duration = durationMs - delay_time;
    let num_points = Math.max(10, Math.floor(fall_duration / 50));

    if (fall_duration > 0) {
      for (let j = 0; j <= num_points; j++) {
        let t = j / num_points;
        let time = delay_time + t * fall_duration;

        if (time <= durationMs) {
          // Rotation accelerates like gravity
          let rotation = t < 0.1 ? 0 : 90 * Math.pow((t - 0.1) / 0.9, 1.5);

          rotation_keyframes.push({
            id: uuidv4().toString(),
            time: time,
            value: { type: "Rotation", value: rotation },
            easing: EasingType.Linear,
            pathType: PathType.Linear,
            keyType: { type: "Frame" },
            curveData: null,
          });
        }
      }
    }

    // Add initial rotation keyframe if there's a delay
    if (delay_time > 0) {
      rotation_keyframes.unshift({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "Rotation", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    let rotation_prop = {
      name: "Rotation",
      propertyPath: "rotation",
      children: [],
      keyframes: rotation_keyframes,
      depth: 0,
    };

    properties.push(position_prop);
    properties.push(rotation_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// CHOREOGRAPHED TEMPLATE - 5. ORBIT DANCE - Multiple objects orbit around a center in different patterns
export function save_orbit_dance_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  orbit_center: [number, number],
  base_radius: number = 100
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let num_points = 60;
    let time_step = durationMs / num_points;

    // Each object has different orbital characteristics
    let orbit_radius = base_radius * (0.5 + (i % 3) * 0.5); // Varying radii
    let orbit_speed = 1 + (i % 2) * 0.5; // Different speeds
    let initial_angle = (i / savable_item_ids.length) * 2 * Math.PI; // Distributed start positions

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let angle = initial_angle + t * orbit_speed * 2 * Math.PI;

      let x = orbit_center[0] + orbit_radius * Math.cos(angle);
      let y = orbit_center[1] + orbit_radius * Math.sin(angle);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: j * time_step,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    properties.push(position_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// CHOREOGRAPHED TEMPLATE - 6. SWARM CONVERGENCE - Objects start scattered and converge to formation
export function save_swarm_convergence_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  scatter_center: [number, number],
  target_formation_center: [number, number],
  scatter_radius: number = 200,
  formation_radius: number = 50
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let num_points = 50;
    let time_step = durationMs / num_points;

    // Random start position in scatter area
    let start_angle =
      (i / savable_item_ids.length) * 2 * Math.PI + (Math.random() - 0.5) * 1;
    let start_distance = scatter_radius * (0.3 + Math.random() * 0.7);
    let start_x = scatter_center[0] + Math.cos(start_angle) * start_distance;
    let start_y = scatter_center[1] + Math.sin(start_angle) * start_distance;

    // Target position in formation (circular)
    let target_angle = (i / savable_item_ids.length) * 2 * Math.PI;
    let target_x =
      target_formation_center[0] + Math.cos(target_angle) * formation_radius;
    let target_y =
      target_formation_center[1] + Math.sin(target_angle) * formation_radius;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;

      // Smooth convergence with easing
      let ease_t = 1 - Math.pow(1 - t, 3); // Ease-out cubic

      let x = start_x + (target_x - start_x) * ease_t;
      let y = start_y + (target_y - start_y) * ease_t;

      // Add some organic movement during convergence
      let flutter = 20 * Math.sin(t * Math.PI * 4 + i) * (1 - t);
      x += flutter * 0.5;
      y += flutter * 0.3;

      position_keyframes.push({
        id: uuidv4().toString(),
        time: j * time_step,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    let position_prop = {
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    };

    properties.push(position_prop);

    animations.push({
      // id: uuidv4().toString(),
      // Use existing ID from current keyframes
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// COLLAGE-STYLE TEMPLATE - 1. PHOTO MOSAIC ASSEMBLY - Objects slide in from edges to form grid layout
export function save_photo_mosaic_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  grid_center: [number, number],
  grid_spacing: number = 120,
  stagger_delay: number = 100
): AnimationData[] {
  let animations: AnimationData[] = [];
  let num_objects = savable_item_ids.length;
  let cols = Math.ceil(Math.sqrt(num_objects));
  let rows = Math.ceil(num_objects / cols);

  for (let i = 0; i < num_objects; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) =>
        p.propertyPath !== "position" &&
        p.propertyPath !== "rotation" &&
        p.propertyPath !== "scalex" &&
        p.propertyPath !== "scaley"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    // Calculate grid position
    let row = Math.floor(i / cols);
    let col = i % cols;
    let final_x = grid_center[0] + (col - (cols - 1) / 2) * grid_spacing;
    let final_y = grid_center[1] + (row - (rows - 1) / 2) * grid_spacing;

    // Choose random starting edge
    let edge = i % 4; // 0: left, 1: top, 2: right, 3: bottom
    let start_x, start_y;
    switch (edge) {
      case 0:
        start_x = -200;
        start_y = final_y;
        break;
      case 1:
        start_x = final_x;
        start_y = -200;
        break;
      case 2:
        start_x = 1100;
        start_y = final_y;
        break;
      case 3:
        start_x = final_x;
        start_y = 750;
        break;
      default:
        start_x = -200;
        start_y = final_y;
    }

    let position_keyframes: UIKeyframe[] = [];
    let rotation_keyframes: UIKeyframe[] = [];
    let scale_keyframes: UIKeyframe[] = [];
    let scale_y_keyframes: UIKeyframe[] = [];

    let delay = i * stagger_delay;
    let active_duration = durationMs - delay;
    let num_points = 40;
    let time_step = active_duration / num_points;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time = delay + j * time_step;

      // Ease out cubic for smooth arrival
      let eased_t = 1 - Math.pow(1 - t, 3);

      let x = start_x + (final_x - start_x) * eased_t;
      let y = start_y + (final_y - start_y) * eased_t;

      // Subtle rotation during movement
      let rotation = (1 - eased_t) * 15 * Math.sin(t * Math.PI);

      // Scale effect for impact
      let scale = 0.3 + 0.7 * eased_t + 0.1 * Math.sin(t * Math.PI);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      rotation_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Rotation", value: rotation },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      scale_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleX", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      scale_y_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleY", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    properties.push({
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Rotation",
      propertyPath: "rotation",
      children: [],
      keyframes: rotation_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Scale X",
      propertyPath: "scalex",
      children: [],
      keyframes: scale_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Scale Y",
      propertyPath: "scaley",
      children: [],
      keyframes: scale_y_keyframes,
      depth: 0,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// COLLAGE-STYLE TEMPLATE - 2. SCRAPBOOK SCATTER - Objects drop naturally like scattered photos
export function save_scrapbook_scatter_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  drop_height: number = -200,
  bounce_intensity: number = 0.3,
  rotation_variance: number = 15
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) => p.propertyPath !== "position" && p.propertyPath !== "rotation"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    // Random final position in scattered arrangement
    let final_x = 200 + Math.random() * 500;
    let final_y = 200 + Math.random() * 200;
    let final_rotation = (Math.random() - 0.5) * rotation_variance;

    let position_keyframes: UIKeyframe[] = [];
    let rotation_keyframes: UIKeyframe[] = [];

    let num_points = 50;
    let time_step = durationMs / num_points;
    let gravity = 800;
    let initial_velocity_y = -100 + Math.random() * 200;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time = j * time_step;
      let time_seconds = (durationMs / 1000) * t;

      let x = final_x + (Math.random() - 0.5) * 10; // Slight horizontal drift
      let y;

      if (t < 0.7) {
        // Falling phase with bounce
        y =
          drop_height +
          initial_velocity_y * time_seconds +
          0.5 * gravity * time_seconds * time_seconds;

        // Simple bounce effect
        if (y > final_y) {
          let bounce_factor = bounce_intensity * (1 - t / 0.7);
          y = final_y - Math.abs(y - final_y) * bounce_factor;
        }
      } else {
        // Settling phase
        let settle_t = (t - 0.7) / 0.3;
        y = final_y + 5 * Math.sin(settle_t * Math.PI * 4) * (1 - settle_t);
      }

      // Rotation during fall
      let rotation =
        final_rotation * (1 - Math.pow(1 - t, 2)) +
        Math.sin(t * Math.PI * 3) * 5 * (1 - t);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      rotation_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Rotation", value: rotation },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    properties.push({
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Rotation",
      propertyPath: "rotation",
      children: [],
      keyframes: rotation_keyframes,
      depth: 0,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// COLLAGE-STYLE TEMPLATE - 3. GALLERY WALL BUILD - Sequential appearance in organized gallery layout
export function save_gallery_wall_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  wall_bounds: [number, number, number, number], // x, y, width, height
  appear_delay: number = 200,
  scale_effect: boolean = true
): AnimationData[] {
  let animations: AnimationData[] = [];
  let num_objects = savable_item_ids.length;

  // Calculate optimal gallery layout
  let cols = Math.ceil(
    Math.sqrt(num_objects * (wall_bounds[2] / wall_bounds[3]))
  );
  let rows = Math.ceil(num_objects / cols);
  let spacing_x = wall_bounds[2] / (cols + 1);
  let spacing_y = wall_bounds[3] / (rows + 1);

  for (let i = 0; i < num_objects; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) =>
        p.propertyPath !== "position" &&
        p.propertyPath !== "scalex" &&
        p.propertyPath !== "scaley" &&
        p.propertyPath !== "opacity"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    // Calculate gallery position
    let row = Math.floor(i / cols);
    let col = i % cols;
    let final_x = wall_bounds[0] + (col + 1) * spacing_x;
    let final_y = wall_bounds[1] + (row + 1) * spacing_y;

    let position_keyframes: UIKeyframe[] = [];
    let scale_keyframes: UIKeyframe[] = [];
    let scale_y_keyframes: UIKeyframe[] = [];
    let opacity_keyframes: UIKeyframe[] = [];

    let delay = i * appear_delay;
    let active_duration = Math.min(durationMs - delay, 1000); // Max 1 second appear time
    let num_points = 30;
    let time_step = active_duration / num_points;

    // Before appearance
    position_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Position", value: [final_x, final_y] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    if (scale_effect) {
      scale_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "ScaleX", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      scale_keyframes.push({
        id: uuidv4().toString(),
        time: 0,
        value: { type: "ScaleY", value: 0 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: 0,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Appearance animation
    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time = delay + j * time_step;

      // Elastic ease out for scale
      let eased_t = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Position", value: [final_x, final_y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      if (scale_effect) {
        let scale = eased_t * (1 + 0.1 * Math.sin(t * Math.PI));
        scale_keyframes.push({
          id: uuidv4().toString(),
          time: time,
          value: { type: "ScaleX", value: scale * 100 },
          easing: EasingType.Linear,
          pathType: PathType.Linear,
          keyType: { type: "Frame" },
          curveData: null,
        });
        scale_y_keyframes.push({
          id: uuidv4().toString(),
          time: time,
          value: { type: "ScaleY", value: scale * 100 },
          easing: EasingType.Linear,
          pathType: PathType.Linear,
          keyType: { type: "Frame" },
          curveData: null,
        });
      }

      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Opacity", value: eased_t * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    // Hold final state
    if (delay + active_duration < durationMs) {
      let hold_time = durationMs;

      position_keyframes.push({
        id: uuidv4().toString(),
        time: hold_time,
        value: { type: "Position", value: [final_x, final_y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      if (scale_effect) {
        scale_keyframes.push({
          id: uuidv4().toString(),
          time: hold_time,
          value: { type: "ScaleX", value: 1 },
          easing: EasingType.Linear,
          pathType: PathType.Linear,
          keyType: { type: "Frame" },
          curveData: null,
        });
        scale_y_keyframes.push({
          id: uuidv4().toString(),
          time: hold_time,
          value: { type: "ScaleY", value: 1 },
          easing: EasingType.Linear,
          pathType: PathType.Linear,
          keyType: { type: "Frame" },
          curveData: null,
        });
      }

      opacity_keyframes.push({
        id: uuidv4().toString(),
        time: hold_time,
        value: { type: "Opacity", value: 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    properties.push({
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    });

    if (scale_effect) {
      properties.push({
        name: "Scale X",
        propertyPath: "scalex",
        children: [],
        keyframes: scale_keyframes,
        depth: 0,
      });
      properties.push({
        name: "Scale Y",
        propertyPath: "scaley",
        children: [],
        keyframes: scale_y_keyframes,
        depth: 0,
      });
    }

    properties.push({
      name: "Opacity",
      propertyPath: "opacity",
      children: [],
      keyframes: opacity_keyframes,
      depth: 0,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// COLLAGE-STYLE TEMPLATE - 4. MEMORY CAROUSEL - Horizontal scrolling timeline effect
export function save_memory_carousel_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  carousel_y: number = 300,
  spacing: number = 150,
  curve_intensity: number = 50
): AnimationData[] {
  let animations: AnimationData[] = [];

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) =>
        p.propertyPath !== "position" &&
        p.propertyPath !== "scalex" &&
        p.propertyPath !== "scaley"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let position_keyframes: UIKeyframe[] = [];
    let scale_keyframes: UIKeyframe[] = [];
    let scale_y_keyframes: UIKeyframe[] = [];

    let num_points = 60;
    let time_step = durationMs / num_points;
    let carousel_width = savable_item_ids.length * spacing;
    let start_x = -200;
    let end_x = 1100;
    let travel_distance = end_x - start_x + carousel_width;

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time = j * time_step;

      // Smooth movement across screen
      let x = start_x + travel_distance * t - i * spacing;

      // Vertical curve for depth effect
      let curve_t = Math.abs(x - 450) / 450; // Distance from screen center
      let y = carousel_y + curve_intensity * Math.pow(curve_t, 2);

      // Scale based on position (larger in center)
      let scale = 0.7 + 0.3 * (1 - Math.min(curve_t, 1));

      // Add slight floating motion
      y += 10 * Math.sin(t * Math.PI * 4 + i * 0.5);

      position_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      scale_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleX", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      scale_y_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleY", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    properties.push({
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Scale X",
      propertyPath: "scalex",
      children: [],
      keyframes: scale_keyframes,
      depth: 0,
    });
    properties.push({
      name: "Scale Y",
      propertyPath: "scaley",
      children: [],
      keyframes: scale_y_keyframes,
      depth: 0,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// COLLAGE-STYLE TEMPLATE - 5. POLAROID TUMBLE - Objects tumble and rotate into place like physical photos
export function save_polaroid_tumble_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  tumble_positions: [number, number][] | null = null,
  rotation_range: number = 45,
  settle_time: number = 0.7
): AnimationData[] {
  let animations: AnimationData[] = [];

  // Generate random positions if none provided
  if (!tumble_positions) {
    tumble_positions = [];
    for (let i = 0; i < savable_item_ids.length; i++) {
      tumble_positions.push([
        200 + Math.random() * 500,
        200 + Math.random() * 200,
      ]);
    }
  }

  for (let i = 0; i < savable_item_ids.length; i++) {
    let durationMs = current_keyframes_array[i].duration;
    let properties: AnimationProperty[] = [];

    let non_position_props = current_keyframes_array[i].properties.filter(
      (p) =>
        p.propertyPath !== "position" &&
        p.propertyPath !== "rotation" &&
        p.propertyPath !== "scalex" &&
        p.propertyPath !== "scaley"
    );

    if (non_position_props) {
      non_position_props.forEach((prop) => {
        properties.push(prop);
      });
    }

    let final_x = tumble_positions[i][0];
    let final_y = tumble_positions[i][1];
    let final_rotation = (Math.random() - 0.5) * rotation_range;

    // Random starting position (off screen)
    let start_angle = Math.random() * Math.PI * 2;
    let start_distance = 400 + Math.random() * 200;
    let start_x = final_x + Math.cos(start_angle) * start_distance;
    let start_y = final_y + Math.sin(start_angle) * start_distance;
    let start_rotation = (Math.random() - 0.5) * 180;

    let position_keyframes: UIKeyframe[] = [];
    let rotation_keyframes: UIKeyframe[] = [];
    let scale_keyframes: UIKeyframe[] = [];
    let scale_y_keyframes: UIKeyframe[] = [];

    let num_points = 50;
    let time_step = durationMs / num_points;
    let settle_point = Math.floor(num_points * settle_time);

    for (let j = 0; j <= num_points; j++) {
      let t = j / num_points;
      let time = j * time_step;

      let x, y, rotation, scale;

      if (j <= settle_point) {
        // Tumbling phase
        let tumble_t = j / settle_point;
        let eased_t = 1 - Math.pow(1 - tumble_t, 3); // Ease out cubic

        x = start_x + (final_x - start_x) * eased_t;
        y = start_y + (final_y - start_y) * eased_t;

        // Multiple rotations during tumble
        rotation =
          start_rotation +
          (final_rotation - start_rotation) * eased_t +
          360 * tumble_t * (2 + Math.random());

        scale = 0.5 + 0.5 * eased_t;
      } else {
        // Settling phase
        let settle_t = (j - settle_point) / (num_points - settle_point);
        let wobble = Math.sin(settle_t * Math.PI * 8) * (1 - settle_t) * 3;

        x = final_x + wobble;
        y = final_y + wobble * 0.5;
        rotation = final_rotation + wobble * 2;
        scale = 1;
      }

      position_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Position", value: [x, y] },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      rotation_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "Rotation", value: rotation },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });

      scale_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleX", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      scale_y_keyframes.push({
        id: uuidv4().toString(),
        time: time,
        value: { type: "ScaleY", value: scale * 100 },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
    }

    properties.push({
      name: "Position",
      propertyPath: "position",
      children: [],
      keyframes: position_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Rotation",
      propertyPath: "rotation",
      children: [],
      keyframes: rotation_keyframes,
      depth: 0,
    });

    properties.push({
      name: "Scale X",
      propertyPath: "scalex",
      children: [],
      keyframes: scale_keyframes,
      depth: 0,
    });
    properties.push({
      name: "Scale Y",
      propertyPath: "scaley",
      children: [],
      keyframes: scale_y_keyframes,
      depth: 0,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: durationMs,
      startTimeMs: current_keyframes_array[i].startTimeMs,
      position: current_keyframes_array[i].position,
      properties: properties,
    });
  }

  return animations;
}

// SCREEN-FILLING TEMPLATE - 1. FULL-SCREEN SLIDESHOW
export function save_fullscreen_slideshow_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  slide_duration: number,
  transition_duration: number
): AnimationData[] {
  let animations: AnimationData[] = [];
  const canvasWidth = 900;
  const canvasHeight = 550;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  for (let i = 0; i < savable_item_ids.length; i++) {
    let duration = current_keyframes_array[i].duration;
    let existing_properties = current_keyframes_array[i].properties.filter(
      (prop) =>
        prop.name !== "Position" &&
        prop.name !== "ScaleX" &&
        prop.name !== "ScaleY" &&
        prop.name !== "Opacity"
    );

    let position_keyframes = [];
    let scale_keyframes = [];
    let scale_y_keyframes = [];
    let opacity_keyframes = [];

    // Calculate optimal scale to fill screen while maintaining aspect ratio
    let scaleX = canvasWidth / 200; // Assume object is ~200px wide
    let scaleY = canvasHeight / 200; // Assume object is ~200px tall
    let scale = Math.min(scaleX, scaleY) * 90; // 90% of screen size

    // Each slide gets its time slot
    let slideStartTime = i * slide_duration;
    let slideEndTime = slideStartTime + slide_duration;
    let fadeInEnd = slideStartTime + transition_duration;
    let fadeOutStart = slideEndTime - transition_duration;

    // Start invisible and off-screen
    position_keyframes.push({
      id: uuidv4().toString(),
      time: slideStartTime,
      value: { type: "Position", value: [centerX, centerY] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: slideStartTime,
      value: { type: "ScaleX", value: scale },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: slideStartTime,
      value: { type: "ScaleY", value: scale },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: slideStartTime,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Fade in
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: fadeInEnd,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Stay visible
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: fadeOutStart,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Fade out
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: slideEndTime,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: duration,
      startTimeMs: 0,
      properties: [
        ...existing_properties,
        {
          name: "Position",
          propertyPath: "position",
          children: [],
          keyframes: position_keyframes as any,
          depth: 0,
        },
        {
          name: "ScaleX",
          propertyPath: "scale.x",
          children: [],
          keyframes: scale_keyframes,
          depth: 0,
        },
        {
          name: "ScaleY",
          propertyPath: "scale.y",
          children: [],
          keyframes: scale_y_keyframes,
          depth: 0,
        },
        {
          name: "Opacity",
          propertyPath: "opacity",
          children: [],
          keyframes: opacity_keyframes,
          depth: 0,
        },
      ],
      position: [centerX, centerY],
    });
  }

  return animations;
}

// SCREEN-FILLING TEMPLATE - 2. ADAPTIVE GRID LAYOUT
export function save_adaptive_grid_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  cols: number,
  rows: number,
  margin: number,
  stagger: number
): AnimationData[] {
  let animations: AnimationData[] = [];
  const canvasWidth = 900;
  const canvasHeight = 550;

  // Calculate grid dimensions
  const gridWidth = canvasWidth - 2 * margin;
  const gridHeight = canvasHeight - 2 * margin;
  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;

  for (let i = 0; i < savable_item_ids.length; i++) {
    let duration = current_keyframes_array[i].duration;
    let existing_properties = current_keyframes_array[i].properties.filter(
      (prop) =>
        prop.name !== "Position" &&
        prop.name !== "ScaleX" &&
        prop.name !== "ScaleY" &&
        prop.name !== "Opacity"
    );

    let position_keyframes = [];
    let scale_keyframes = [];
    let scale_y_keyframes = [];
    let opacity_keyframes = [];

    // Calculate grid position
    let gridIndex = i % (cols * rows);
    let col = gridIndex % cols;
    let row = Math.floor(gridIndex / cols);

    let x = margin + col * cellWidth + cellWidth / 2;
    let y = margin + row * cellHeight + cellHeight / 2;

    // Calculate scale to fit in grid cell
    let scaleX = (cellWidth * 0.8) / 200; // Assume object is ~200px wide
    let scaleY = (cellHeight * 0.8) / 200; // Assume object is ~200px tall
    let scale = Math.min(scaleX, scaleY) * 100;

    let animationStartTime = i * stagger;

    // Start from center, scaled down and invisible
    position_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Position", value: [canvasWidth / 2, canvasHeight / 2] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleX", value: 10 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleY", value: 10 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Animate to grid position
    position_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime + 800,
      value: { type: "Position", value: [x, y] },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime + 800,
      value: { type: "ScaleX", value: scale },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime + 800,
      value: { type: "ScaleY", value: scale },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime + 400,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: duration,
      startTimeMs: 0,
      properties: [
        ...existing_properties,
        {
          name: "Position",
          propertyPath: "position",
          children: [],
          keyframes: position_keyframes as any,
          depth: 0,
        },
        {
          name: "ScaleX",
          propertyPath: "scale.x",
          children: [],
          keyframes: scale_keyframes,
          depth: 0,
        },
        {
          name: "ScaleY",
          propertyPath: "scale.y",
          children: [],
          keyframes: scale_y_keyframes,
          depth: 0,
        },
        {
          name: "Opacity",
          propertyPath: "opacity",
          children: [],
          keyframes: opacity_keyframes,
          depth: 0,
        },
      ],
      position: [x, y],
    });
  }

  return animations;
}

// SCREEN-FILLING TEMPLATE - 3. SCREEN-FILLING CAROUSEL
export function save_screen_carousel_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  enter_delay: number,
  slide_speed: number
): AnimationData[] {
  let animations: AnimationData[] = [];
  const canvasWidth = 900;
  const canvasHeight = 550;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  for (let i = 0; i < savable_item_ids.length; i++) {
    let duration = current_keyframes_array[i].duration;
    let existing_properties = current_keyframes_array[i].properties.filter(
      (prop) =>
        prop.name !== "Position" &&
        prop.name !== "ScaleX" &&
        prop.name !== "ScaleY" &&
        prop.name !== "Opacity"
    );

    let position_keyframes = [];
    let scale_keyframes = [];
    let scale_y_keyframes = [];
    let opacity_keyframes = [];

    // Calculate optimal scale to fill most of the screen
    let scale = Math.min(canvasWidth / 250, canvasHeight / 250) * 80;

    let animationStartTime = i * enter_delay;
    let slideInTime = animationStartTime + slide_speed;
    let stayTime = slideInTime + slide_speed * 2;
    let slideOutTime = stayTime + slide_speed;

    // Start position (from left or right alternating)
    let startX = i % 2 === 0 ? -200 : canvasWidth + 200;
    let endX = i % 2 === 0 ? canvasWidth + 200 : -200;

    // Enter from side
    position_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Position", value: [startX, centerY] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleX", value: scale },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleY", value: scale },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Slide to center
    position_keyframes.push({
      id: uuidv4().toString(),
      time: slideInTime,
      value: { type: "Position", value: [centerX, centerY] },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Stay at center
    position_keyframes.push({
      id: uuidv4().toString(),
      time: stayTime,
      value: { type: "Position", value: [centerX, centerY] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Slide out to opposite side
    position_keyframes.push({
      id: uuidv4().toString(),
      time: slideOutTime,
      value: { type: "Position", value: [endX, centerY] },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: duration,
      startTimeMs: 0,
      properties: [
        ...existing_properties,
        {
          name: "Position",
          propertyPath: "position",
          children: [],
          keyframes: position_keyframes as any,
          depth: 0,
        },
        {
          name: "ScaleX",
          propertyPath: "scale.x",
          children: [],
          keyframes: scale_keyframes,
          depth: 0,
        },
        {
          name: "ScaleY",
          propertyPath: "scale.y",
          children: [],
          keyframes: scale_y_keyframes,
          depth: 0,
        },
        {
          name: "Opacity",
          propertyPath: "opacity",
          children: [],
          keyframes: opacity_keyframes,
          depth: 0,
        },
      ],
      position: [centerX, centerY],
    });
  }

  return animations;
}

// SCREEN-FILLING TEMPLATE - 4. MAXIMIZE & SHOWCASE
export function save_maximize_showcase_keyframes(
  editorState: EditorState,
  savable_item_ids: string[],
  object_types: ObjectType[],
  current_keyframes_array: AnimationData[],
  scale_factor: number,
  stagger: number
): AnimationData[] {
  let animations: AnimationData[] = [];
  const canvasWidth = 900;
  const canvasHeight = 550;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  for (let i = 0; i < savable_item_ids.length; i++) {
    let duration = current_keyframes_array[i].duration;
    let existing_properties = current_keyframes_array[i].properties.filter(
      (prop) =>
        prop.name !== "Position" &&
        prop.name !== "ScaleX" &&
        prop.name !== "ScaleY" &&
        prop.name !== "Opacity" &&
        prop.name !== "Rotation"
    );

    let position_keyframes = [];
    let scale_keyframes = [];
    let scale_y_keyframes = [];
    let opacity_keyframes = [];
    let rotation_keyframes = [];

    // Calculate maximum scale that fits in screen
    let maxScale =
      Math.min(canvasWidth / 200, canvasHeight / 200) * scale_factor * 100;

    let animationStartTime = i * stagger;
    let scaleUpTime = animationStartTime + 600;
    let showcaseTime = scaleUpTime + 800;
    let scaleDownTime = showcaseTime + 400;

    // Start small and centered
    position_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Position", value: [centerX, centerY] },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleX", value: 10 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "ScaleY", value: 10 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.Linear,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Fade in and scale up dramatically
    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: animationStartTime + 200,
      value: { type: "Opacity", value: 100 },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_keyframes.push({
      id: uuidv4().toString(),
      time: scaleUpTime,
      value: { type: "ScaleX", value: maxScale },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: scaleUpTime,
      value: { type: "ScaleY", value: maxScale },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Slight rotation for showcase effect
    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: showcaseTime,
      value: { type: "Rotation", value: i % 2 === 0 ? 2 : -2 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    // Scale down and fade out
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: scaleDownTime,
      value: { type: "ScaleX", value: 10 },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    scale_y_keyframes.push({
      id: uuidv4().toString(),
      time: scaleDownTime,
      value: { type: "ScaleY", value: 10 },
      easing: EasingType.EaseIn,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    opacity_keyframes.push({
      id: uuidv4().toString(),
      time: scaleDownTime,
      value: { type: "Opacity", value: 0 },
      easing: EasingType.EaseOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    rotation_keyframes.push({
      id: uuidv4().toString(),
      time: scaleDownTime,
      value: { type: "Rotation", value: 0 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });

    animations.push({
      id: current_keyframes_array[i].id,
      objectType: object_types[i],
      polygonId: savable_item_ids[i],
      duration: duration,
      startTimeMs: 0,
      properties: [
        ...existing_properties,
        {
          name: "Position",
          propertyPath: "position",
          children: [],
          keyframes: position_keyframes as any,
          depth: 0,
        },
        {
          name: "ScaleX",
          propertyPath: "scale.x",
          children: [],
          keyframes: scale_keyframes,
          depth: 0,
        },
        {
          name: "ScaleY",
          propertyPath: "scale.y",
          children: [],
          keyframes: scale_y_keyframes,
          depth: 0,
        },
        {
          name: "Opacity",
          propertyPath: "opacity",
          children: [],
          keyframes: opacity_keyframes,
          depth: 0,
        },
        {
          name: "Rotation",
          propertyPath: "rotation",
          children: [],
          keyframes: rotation_keyframes,
          depth: 0,
        },
      ],
      position: [centerX, centerY],
    });
  }

  return animations;
}
