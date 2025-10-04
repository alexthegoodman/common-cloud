import { saveSequencesData } from "@/fetchers/projects";
import { BackgroundFill, ObjectType } from "../animations";
import { Editor, InputValue } from "../editor";
import EditorState from "../editor_state";

export function updateBackground(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: BackgroundFill
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.updateBackgroundFill(objectId, ObjectType.Polygon, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activePolygons.forEach((p) => {
          if (p.id == objectId) {
            p.backgroundFill = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.TextItem: {
      editor.updateBackgroundFill(objectId, ObjectType.TextItem, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeTextItems.forEach((p) => {
          if (p.id == objectId) {
            p.backgroundFill = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updateFontSize(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  editor.update_text_size(objectId, value);

  editorState.savedState.sequences.forEach((s) => {
    // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.fontSize = value;
      }
    });
    // }
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateWidth(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.update_polygon(objectId, "width", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activePolygons.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [value, p.dimensions[1]];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.TextItem: {
      console.info("test 1");
      editor.update_text(objectId, "width", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeTextItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [value, p.dimensions[1]];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.ImageItem: {
      editor.update_image(objectId, "width", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeImageItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [value, p.dimensions[1]];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.VideoItem: {
      editor.update_video(objectId, "width", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeVideoItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [value, p.dimensions[1]];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updateHeight(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.update_polygon(objectId, "height", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activePolygons.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [p.dimensions[0], value];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.TextItem: {
      console.info("test 2");
      editor.update_text(objectId, "height", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeTextItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [p.dimensions[0], value];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.ImageItem: {
      editor.update_image(objectId, "height", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeImageItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [p.dimensions[0], value];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.VideoItem: {
      editor.update_video(objectId, "height", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeVideoItems.forEach((p) => {
          if (p.id == objectId) {
            p.dimensions = [p.dimensions[0], value];
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updatePositionX(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.update_polygon(objectId, "positionX", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.TextItem: {
      console.info("test 2");
      editor.update_text(objectId, "positionX", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.ImageItem: {
      editor.update_image(objectId, "positionX", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.VideoItem: {
      editor.update_video(objectId, "positionX", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updatePositionY(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.update_polygon(objectId, "positionY", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.TextItem: {
      console.info("test 2");
      editor.update_text(objectId, "positionY", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.ImageItem: {
      editor.update_image(objectId, "positionY", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.VideoItem: {
      editor.update_video(objectId, "positionY", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
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

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updateBorderRadius(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  objectType: ObjectType,
  value: number
) {
  switch (objectType) {
    case ObjectType.Polygon: {
      editor.update_polygon(objectId, "borderRadius", InputValue.Number, value);

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activePolygons.forEach((p) => {
          if (p.id == objectId) {
            p.borderRadius = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.ImageItem: {
      let gpuResources = editor.gpuResources;
      let image = editor.imageItems.find((i) => i.id === objectId);

      if (!image || !gpuResources) {
        return;
      }

      image.updateBorderRadius(gpuResources.queue!, value);

      editorState.savedState.sequences.forEach((s) => {
        s.activeImageItems.forEach((p) => {
          if (p.id == objectId) {
            p.borderRadius = value;
          }
        });
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.VideoItem: {
      let gpuResources = editor.gpuResources;
      let video = editor.videoItems.find((v) => v.id === objectId);

      if (!video || !gpuResources) {
        return;
      }

      video.updateBorderRadius(gpuResources.queue!, value);

      editorState.savedState.sequences.forEach((s) => {
        s.activeVideoItems.forEach((p) => {
          if (p.id == objectId) {
            p.borderRadius = value;
          }
        });
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updateIsCircle(
  editorState: EditorState,
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

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeImageItems.forEach((p) => {
          if (p.id == objectId) {
            p.isCircle = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
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

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activeTextItems.forEach((p) => {
          if (p.id == objectId) {
            p.isCircle = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
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

      editorState.savedState.sequences.forEach((s) => {
        // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
        s.activePolygons.forEach((p) => {
          if (p.id == objectId) {
            p.isCircle = value;
          }
        });
        // }
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
  }
}

export function updateHiddenBackground(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: boolean
) {
  let text = editor.textItems.find((i) => i.id === objectId);

  if (!text) {
    return;
  }

  text.hiddenBackground = value;

  editorState.savedState.sequences.forEach((s) => {
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.hiddenBackground = value;
      }
    });
  });

  saveSequencesData(
    editorState.savedState.sequences,
    editorState.saveTarget
  );
}

export async function updateFontFamily(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: string
) {
  await editor.update_text_fontFamily(value, objectId);

  editorState.savedState.sequences.forEach((s) => {
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.fontFamily = value;
      }
    });
  });

  saveSequencesData(
    editorState.savedState.sequences,
    editorState.saveTarget
  );
}

export function updateTextContent(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: string
) {
  editor.update_text_content(objectId, value);

  editorState.savedState.sequences.forEach((s) => {
    // if s.id == selected_sequence_id.get() { // would be more efficient for many sequences
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.text = value;
      }
    });
    // }
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}
