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
      value: { type: "Scale", value: 100 },
      easing: EasingType.Linear,
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
      time: durationMs - 5000,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs - 2500,
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: durationMs,
      value: { type: "Scale", value: 100 },
      easing: EasingType.Linear,
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
      (p) => p.propertyPath === "scale"
    );

    if (scale_prop) {
      properties.push(scale_prop);
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
      (p) => p.propertyPath === "scale"
    );

    if (scale_prop) {
      properties.push(scale_prop);
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
      value: { type: "Scale", value: 100 },
      easing: EasingType.EaseInOut,
      pathType: PathType.Linear,
      keyType: { type: "Frame" },
      curveData: null,
    });
    scale_keyframes.push({
      id: uuidv4().toString(),
      time: 2500,
      value: { type: "Scale", value: 110 },
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
      value: { type: "Scale", value: 110 },
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
}
