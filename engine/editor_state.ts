import { saveSequencesData } from "../fetchers/projects";
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
import { SavedBrushConfig } from "./brush";
import { SavedCube3DConfig } from "./cube3d";
import { SavedSphere3DConfig } from "./sphere3d";
import { SavedMockup3DConfig } from "./mockup3d";
import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Editor,
  getRandomNumber,
  InputValue,
} from "./editor";
import { TextAnimationConfig } from "./textAnimator";
import { save_default_keyframes } from "./state/keyframes";

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

  async add_saved_polygon(
    selected_sequence_id: string,
    savable_polygon: SavedPolygonConfig
  ) {
    let new_motion_path = save_default_keyframes(
      this,
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
    let new_motion_path = save_default_keyframes(
      this,
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

  updateTextAnimation(
    objectId: string,
    animationConfig: TextAnimationConfig | null
  ) {
    this.savedState.sequences.forEach((s) => {
      s.activeTextItems.forEach((t) => {
        if (t.id === objectId) {
          t.textAnimation = animationConfig;
        }
      });
    });

    saveSequencesData(this.savedState.sequences, this.saveTarget);
  }

  async add_saved_image_item(
    selected_sequence_id: string,
    savable_text: SavedStImageConfig
  ) {
    let new_motion_path = save_default_keyframes(
      this,
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
    let new_motion_path = save_default_keyframes(
      this,
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

  async add_saved_brush(
    selected_sequence_id: string,
    savable_brush: SavedBrushConfig
  ) {
    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        if (!s.activeBrushes) {
          s.activeBrushes = [];
        }
        s.activeBrushes.push(savable_brush);
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_cube3d(
    selected_sequence_id: string,
    savable_cube: SavedCube3DConfig
  ) {
    let new_motion_path = save_default_keyframes(
      this,
      savable_cube.id,
      ObjectType.Cube3D,
      savable_cube.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        if (!s.activeCubes3D) {
          s.activeCubes3D = [];
        }
        s.activeCubes3D.push(savable_cube);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_sphere3d(
    selected_sequence_id: string,
    savable_sphere: SavedSphere3DConfig
  ) {
    let new_motion_path = save_default_keyframes(
      this,
      savable_sphere.id,
      ObjectType.Sphere3D,
      savable_sphere.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        if (!s.activeSpheres3D) {
          s.activeSpheres3D = [];
        }
        s.activeSpheres3D.push(savable_sphere);

        if (this.supportsMotionPaths && s.polygonMotionPaths) {
          s.polygonMotionPaths.push(new_motion_path);
        }
      }
    });

    let sequences = saved_state.sequences;

    await saveSequencesData(sequences, this.saveTarget);

    this.savedState = saved_state;
  }

  async add_saved_mockup3d(
    selected_sequence_id: string,
    savable_mockup: SavedMockup3DConfig
  ) {
    let new_motion_path = save_default_keyframes(
      this,
      savable_mockup.id,
      ObjectType.Mockup3D,
      savable_mockup.position,
      20000
    );

    let saved_state = this.savedState;

    saved_state.sequences.forEach((s) => {
      if (s.id == selected_sequence_id) {
        if (!s.activeMockups3D) {
          s.activeMockups3D = [];
        }
        s.activeMockups3D.push(savable_mockup);

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
