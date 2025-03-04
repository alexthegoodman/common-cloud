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
import { Editor, InputValue } from "./editor";

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

        image.setIsCircle(gpuResources.queue, value);

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
          gpuResources.device,
          gpuResources.queue,
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
          gpuResources.device,
          gpuResources.queue,
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
}
