import { saveSequencesData } from "@/fetchers/projects";
import {
  AnimationData,
  AnimationProperty,
  BackgroundFill,
  EasingType,
  ObjectType,
  PathType,
  SavedState,
  UIKeyframe,
  interpolateKeyframeValue,
} from "./animations";
import { SavedPoint, SavedPolygonConfig } from "./polygon";
import { v4 as uuidv4 } from "uuid";
import { SavedTextRendererConfig } from "./text";
import { SavedStImageConfig } from "./image";
import { SavedStVideoConfig } from "./video";
import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Editor,
  getRandomNumber,
  InputValue,
} from "./editor";

export enum SaveTarget {
  Videos = "Videos",
  Docs = "Docs",
  Slides = "Slides",
  Promos = "Promos",
}

export default class EditorState {
  kind: "editor" | "state" = "state";

  selected_polygon_id: string = "";
  savedState: SavedState;
  supportsMotionPaths: boolean = true;
  saveTarget: SaveTarget = SaveTarget.Videos;

  constructor(savedState: SavedState) {
    this.savedState = savedState;
  }

  updateBackground(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: BackgroundFill
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.updateBackgroundFill(objectId, ObjectType.Polygon, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.backgroundFill = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        editor.updateBackgroundFill(objectId, ObjectType.TextItem, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.backgroundFill = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updateFontSize(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    editor.update_text_size(objectId, value);

    this.savedState.sequences.forEach((s) => {
      // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
      s.activeTextItems.forEach((p) => {
        if (p.id == objectId) {
          p.fontSize = value;
        }
      });
      // }
    });

    saveSequencesData(this.savedState.sequences, this.saveTarget);
  }

  updateWidth(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.update_polygon(objectId, "width", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [value, p.dimensions[1]];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        console.info("test 1");
        editor.update_text(objectId, "width", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [value, p.dimensions[1]];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.ImageItem: {
        editor.update_image(objectId, "width", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeImageItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [value, p.dimensions[1]];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.VideoItem: {
        editor.update_video(objectId, "width", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeVideoItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [value, p.dimensions[1]];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updateHeight(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.update_polygon(objectId, "height", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [p.dimensions[0], value];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        console.info("test 2");
        editor.update_text(objectId, "height", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [p.dimensions[0], value];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.ImageItem: {
        editor.update_image(objectId, "height", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeImageItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [p.dimensions[0], value];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.VideoItem: {
        editor.update_video(objectId, "height", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeVideoItems.forEach((p) => {
            if (p.id == objectId) {
              p.dimensions = [p.dimensions[0], value];
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updatePositionX(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.update_polygon(objectId, "positionX", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: value,
                y: p.position.y,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        console.info("test 2");
        editor.update_text(objectId, "positionX", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: value,
                y: p.position.y,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.ImageItem: {
        editor.update_image(objectId, "positionX", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeImageItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: value,
                y: p.position.y,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.VideoItem: {
        editor.update_video(objectId, "positionX", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeVideoItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: value,
                y: p.position.y,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updatePositionY(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.update_polygon(objectId, "positionY", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: p.position.x,
                y: value,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        console.info("test 2");
        editor.update_text(objectId, "positionY", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: p.position.x,
                y: value,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.ImageItem: {
        editor.update_image(objectId, "positionY", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeImageItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: p.position.x,
                y: value,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.VideoItem: {
        editor.update_video(objectId, "positionY", InputValue.Number, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeVideoItems.forEach((p) => {
            if (p.id == objectId) {
              p.position = {
                x: p.position.x,
                y: value,
              };
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updateBorderRadius(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: number
  ) {
    switch (objectType) {
      case ObjectType.Polygon: {
        editor.update_polygon(
          objectId,
          "borderRadius",
          InputValue.Number,
          value
        );

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.borderRadius = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      // case ObjectType.TextItem: {
      //   editor.update_text(objectId, "height", InputValue.Number, value);

      //   this.savedState.sequences.forEach((s) => {
      //     // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
      //     s.activeTextItems.forEach((p) => {
      //       if (p.id == objectId) {
      //         p.dimensions = [p.dimensions[0], value];
      //       }
      //     });
      //     // }
      //   });

      //   saveSequencesData(this.savedState.sequences, this.saveTarget);
      //   break;
      // }
      // case ObjectType.ImageItem: {
      //   editor.update_image(objectId, "height", InputValue.Number, value);

      //   this.savedState.sequences.forEach((s) => {
      //     // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
      //     s.activeImageItems.forEach((p) => {
      //       if (p.id == objectId) {
      //         p.dimensions = [p.dimensions[0], value];
      //       }
      //     });
      //     // }
      //   });

      //   saveSequencesData(this.savedState.sequences, this.saveTarget);
      //   break;
      // }
      // case ObjectType.VideoItem: {
      //   editor.update_video(objectId, "height", InputValue.Number, value);

      //   this.savedState.sequences.forEach((s) => {
      //     // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
      //     s.activeVideoItems.forEach((p) => {
      //       if (p.id == objectId) {
      //         p.dimensions = [p.dimensions[0], value];
      //       }
      //     });
      //     // }
      //   });

      //   saveSequencesData(this.savedState.sequences, this.saveTarget);
      //   break;
      // }
    }
  }

  updateIsCircle(
    editor: Editor,
    objectId: string,
    objectType: ObjectType,
    value: boolean
  ) {
    switch (objectType) {
      case ObjectType.ImageItem: {
        let gpuResources = editor.gpuResources;
        let image = editor.imageItems.find((i) => i.id === objectId);

        if (!image || !gpuResources) {
          return;
        }

        image.setIsCircle(gpuResources.queue!, value);

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeImageItems.forEach((p) => {
            if (p.id == objectId) {
              p.isCircle = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.TextItem: {
        let gpuResources = editor.gpuResources;
        let text = editor.textItems.find((i) => i.id === objectId);

        if (
          !text ||
          !gpuResources ||
          !editor.camera ||
          !editor.modelBindGroupLayout
        ) {
          return;
        }

        text.isCircle = value;
        text.backgroundPolygon.setIsCircle(
          editor.camera?.windowSize,
          gpuResources.device!,
          gpuResources.queue!,
          editor.modelBindGroupLayout,
          value,
          editor.camera
        );

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activeTextItems.forEach((p) => {
            if (p.id == objectId) {
              p.isCircle = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
      case ObjectType.Polygon: {
        let gpuResources = editor.gpuResources;
        let polygon = editor.polygons.find((i) => i.id === objectId);

        if (
          !polygon ||
          !gpuResources ||
          !editor.camera ||
          !editor.modelBindGroupLayout
        ) {
          return;
        }

        polygon.isCircle = value;
        polygon.setIsCircle(
          editor.camera?.windowSize,
          gpuResources.device!,
          gpuResources.queue!,
          editor.modelBindGroupLayout,
          value,
          editor.camera
        );

        this.savedState.sequences.forEach((s) => {
          // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
          s.activePolygons.forEach((p) => {
            if (p.id == objectId) {
              p.isCircle = value;
            }
          });
          // }
        });

        saveSequencesData(this.savedState.sequences, this.saveTarget);
        break;
      }
    }
  }

  updateTextContent(editor: Editor, objectId: string, value: string) {
    editor.update_text_content(objectId, value);

    this.savedState.sequences.forEach((s) => {
      // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
      s.activeTextItems.forEach((p) => {
        if (p.id == objectId) {
          p.text = value;
        }
      });
      // }
    });

    saveSequencesData(this.savedState.sequences, this.saveTarget);
  }

  save_default_keyframes(
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

  remove_position_keyframes(
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

  save_perspective_x_keyframes(
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

  save_perspective_y_keyframes(
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

  // TODO: make work with variable duration
  save_pulse_keyframes(
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

  save_circular_motion_keyframes(
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
    let num_points = 32;
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
      position: current_keyframes.position,
      properties: properties,
    };

    return new_motion_path;
  }

  // NEW ANIMATION TEMPLATE - 1. PENDULUM SWING - Hypnotic back-and-forth rhythm
  save_pendulum_swing_keyframes(
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
  save_figure_eight_keyframes(
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
  save_ripple_effect_keyframes(
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
        value: { type: "ScaleX", value: scale },
        easing: EasingType.Linear,
        pathType: PathType.Linear,
        keyType: { type: "Frame" },
        curveData: null,
      });
      scale_y_keyframes.push({
        id: uuidv4().toString(),
        time: i * time_step,
        value: { type: "ScaleY", value: scale },
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
  save_spiral_motion_keyframes(
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
  save_bouncing_ball_keyframes(
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
  save_floating_bubbles_keyframes(
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
  save_confetti_explosion_keyframes(
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
        (i / savable_item_ids.length) * 2 * Math.PI +
        (Math.random() - 0.5) * 0.5;
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
  save_flock_formation_keyframes(
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
  save_ripple_wave_keyframes(
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
        let y_offset =
          wave_amplitude * Math.sin(wave_time) * Math.exp(-t * 0.5);

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
  save_domino_cascade_keyframes(
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
  save_orbit_dance_keyframes(
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
  save_swarm_convergence_keyframes(
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

  async add_saved_polygon(
    selected_sequence_id: string,
    savable_polygon: SavedPolygonConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_polygon.id,
      ObjectType.Polygon,
      savable_polygon.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activePolygons.push(savable_polygon);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_text_item(
    selected_sequence_id: string,
    savable_text: SavedTextRendererConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.TextItem,
      savable_text.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activeTextItems.push(savable_text);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_image_item(
    selected_sequence_id: string,
    savable_text: SavedStImageConfig
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.ImageItem,
      savable_text.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        s.activeImageItems.push(savable_text);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_video_item(
    selected_sequence_id: string,
    savable_text: SavedStVideoConfig,
    sourceDurationMs: number
  ) {
    let new_motion_path = this.save_default_keyframes(
      savable_text.id,
      ObjectType.VideoItem,
      savable_text.position,
      sourceDurationMs
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        if (!s.durationMs) {
          return;
        }

        if (s.durationMs < sourceDurationMs) {
          s.durationMs = sourceDurationMs;
        }

        s.activeVideoItems.push(savable_text);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  private genProcessPrmoptItem(
    item:
      | SavedStImageConfig
      | SavedStVideoConfig
      | SavedPolygonConfig
      | SavedTextRendererConfig,
    total: number
  ): [string, number] {
    // if (item.hidden) {
    //   return ["", total];
    // }

    // Convert coordinates to percentage-based values
    const x = item.position.x - CANVAS_HORIZ_OFFSET;
    const xPercent = (x / 800.0) * 100.0;
    const y = item.position.y - CANVAS_VERT_OFFSET;
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

  genCreateInferencePrompt(): string {
    let prompt = "";
    let total = 0;

    let sequence = this.savedState.sequences[0];

    // Process each type of item
    for (const itemArrays of [
      sequence.activePolygons,
      sequence.activeTextItems,
      sequence.activeImageItems,
      sequence.activeVideoItems,
    ]) {
      for (const item of itemArrays) {
        if (total > 6) break;

        const [promptLine, newTotal] = this.genProcessPrmoptItem(item, total);
        prompt += promptLine;
        total = newTotal;
      }

      if (total > 6) break;
    }

    console.log("prompt", prompt);

    return prompt;
  }

  // private genProcessLayoutPrmoptItem(
  //   item: SavedStImageConfig | SavedPolygonConfig | SavedTextRendererConfig,
  //   total: number
  // ): [string, number] {
  //   // if (item.hidden) {
  //   //   return ["", total];
  //   // }

  //   let object_type = 1;
  //   if (item.objectType === ObjectType.Polygon && item.isCircle) {
  //     object_type = 4;
  //   } else if (item.objectType === ObjectType.TextItem && item.isCircle) {
  //     object_type = 2;
  //   } else if (item.objectType === ObjectType.ImageItem && item.isCircle) {
  //     object_type = 6;
  //   } else if (item.objectType === ObjectType.Polygon) {
  //     object_type = 3;
  //   } else if (item.objectType === ObjectType.TextItem) {
  //     object_type = 1;
  //   } else if (item.objectType === ObjectType.ImageItem) {
  //     object_type = 5;
  //   }

  //   // Build the prompt string for this item
  //   const promptLine = [
  //     total.toString(),
  //     object_type,
  //     getRandomNumber(1, 8),
  //     "\n",
  //   ].join(",");

  //   return [promptLine, total + 1];
  // }

  // genCreateLayoutInferencePrompt(): string {
  //   let prompt = "";
  //   let total = 0;

  //   let sequence = this.savedState.sequences[0];

  //   // Process each type of item
  //   for (const itemArrays of [
  //     sequence.activePolygons,
  //     sequence.activeTextItems,
  //     sequence.activeImageItems,
  //     // this.videoItems,
  //   ]) {
  //     for (const item of itemArrays) {
  //       if (total > 8) break;

  //       const [promptLine, newTotal] = this.genProcessLayoutPrmoptItem(
  //         item,
  //         total
  //       );
  //       prompt += promptLine;
  //       total = newTotal;
  //     }

  //     if (total > 8) break;
  //   }

  //   console.log("prompt", prompt);

  //   return prompt;
  // }

  genCreateLayoutInferencePrompt(): string {
    let prompt = "";
    let total = 0;

    let sequence = this.savedState.sequences[0];

    // Process each type with explicit type knowledge
    const itemGroups = [
      { items: sequence.activePolygons, baseType: 3, circleType: 4 },
      { items: sequence.activeTextItems, baseType: 1, circleType: 2 },
      { items: sequence.activeImageItems, baseType: 5, circleType: 6 },
    ];

    for (const group of itemGroups) {
      for (const item of group.items) {
        if (total > 8) break;

        const object_type = item.isCircle ? group.circleType : group.baseType;

        const promptLine = [
          total.toString(),
          object_type,
          getRandomNumber(1, 8),
          "\n",
        ].join(",");

        prompt += promptLine;
        total++;
      }
      if (total > 8) break;
    }

    console.log("prompt", prompt);
    return prompt;
  }

  getCurrentPositions() {
    const current_positions: [number, number, number, number][] = [];
    let total = 0;

    let sequence = this.savedState.sequences[0];

    for (const polygon of sequence.activePolygons) {
      // if (!polygon.hidden) {
      current_positions.push([
        total,
        20000,
        polygon.position.x - CANVAS_HORIZ_OFFSET,
        polygon.position.y - CANVAS_VERT_OFFSET,
      ]);
      total++;
      // }
    }

    for (const text of sequence.activeTextItems) {
      // if (!text.hidden) {
      current_positions.push([
        total,
        20000,
        text.position.x - CANVAS_HORIZ_OFFSET,
        text.position.y - CANVAS_VERT_OFFSET,
      ]);
      total++;
      // }
    }

    for (const image of sequence.activeImageItems) {
      // if (!image.hidden) {
      current_positions.push([
        total,
        20000,
        image.position.x - CANVAS_HORIZ_OFFSET,
        image.position.y - CANVAS_VERT_OFFSET,
      ]);
      total++;
      // }
    }

    for (const video of sequence.activeVideoItems) {
      // if (!video.hidden) {
      current_positions.push([
        total,
        0,
        video.position.x - CANVAS_HORIZ_OFFSET,
        video.position.y - CANVAS_VERT_OFFSET,
      ]);
      total++;
      // }
    }

    return current_positions;
  }

  // Helper function to get item ID based on object index
  getItemId(objectIdx: number): string | null {
    let sequence = this.savedState.sequences[0];

    const visiblePolygons: SavedPolygonConfig[] = sequence.activePolygons;
    const visibleTexts: SavedTextRendererConfig[] = sequence.activeTextItems;
    const visibleImages: SavedStImageConfig[] = sequence.activeImageItems;
    const visibleVideos: SavedStVideoConfig[] = sequence.activeVideoItems;

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
    let sequence = this.savedState.sequences[0];

    const polygonCount = sequence.activePolygons.length;
    const textCount = sequence.activeTextItems.length;
    const imageCount = sequence.activeImageItems.length;
    const videoCount = sequence.activeVideoItems.length;

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

  addKeyframe(
    objectId: string,
    sequenceId: string,
    propertyPath: string,
    time: number,
    prevKeyframe: UIKeyframe,
    nextKeyframe: UIKeyframe
  ) {
    const sequence = this.savedState.sequences.find((s) => s.id === sequenceId);
    if (!sequence?.polygonMotionPaths) return;

    const animationData = sequence.polygonMotionPaths.find(
      (mp) => mp.polygonId === objectId
    );
    if (!animationData) return;

    const property = animationData.properties.find(
      (p) => p.propertyPath === propertyPath
    );
    if (!property) return;

    // Create interpolated value at the specified time
    const interpolatedValue = interpolateKeyframeValue(
      prevKeyframe,
      nextKeyframe,
      time
    );

    // Create new keyframe
    const newKeyframe: UIKeyframe = {
      id: uuidv4(),
      time: time,
      value: interpolatedValue,
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    };

    // Find the correct insertion point
    const insertIndex = property.keyframes.findIndex((kf) => kf.time > time);

    if (insertIndex === -1) {
      // Add to end
      property.keyframes.push(newKeyframe);
    } else {
      // Insert at the correct position
      property.keyframes.splice(insertIndex, 0, newKeyframe);
    }

    // Sort keyframes by time to ensure correct order
    property.keyframes.sort((a, b) => a.time - b.time);

    // Save the updated state
    saveSequencesData(this.savedState.sequences, this.saveTarget);
  }
}
