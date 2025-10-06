import { saveSequencesData } from "@/fetchers/projects";
import { BackgroundFill, ObjectType } from "../animations";
import { Editor, InputValue } from "../editor";
import EditorState from "../editor_state";
import { TextAnimationConfig } from "../textAnimator";

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
    case ObjectType.Cube3D: {
      let cube = editor.cubes3D.find((c) => c.id === objectId);
      if (cube && editor.camera) {
        cube.transform.updatePosition(
          [value, cube.transform.position[1]],
          editor.camera.windowSize
        );
        cube.transform.updateUniformBuffer(
          editor.gpuResources?.queue!,
          editor.camera.windowSize
        );
      }

      editorState.savedState.sequences.forEach((s) => {
        s.activeCubes3D?.forEach((c) => {
          if (c.id == objectId) {
            c.position = {
              x: value,
              y: c.position.y,
            };
          }
        });
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.Sphere3D: {
      let sphere = editor.spheres3D.find((s) => s.id === objectId);
      if (sphere && editor.camera) {
        sphere.transform.updatePosition(
          [value, sphere.transform.position[1]],
          editor.camera.windowSize
        );
        sphere.transform.updateUniformBuffer(
          editor.gpuResources?.queue!,
          editor.camera.windowSize
        );
      }

      editorState.savedState.sequences.forEach((s) => {
        s.activeSpheres3D?.forEach((sp) => {
          if (sp.id == objectId) {
            sp.position = {
              x: value,
              y: sp.position.y,
            };
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
    case ObjectType.Cube3D: {
      let cube = editor.cubes3D.find((c) => c.id === objectId);
      if (cube && editor.camera) {
        cube.transform.updatePosition(
          [cube.transform.position[0], value],
          editor.camera.windowSize
        );
        cube.transform.updateUniformBuffer(
          editor.gpuResources?.queue!,
          editor.camera.windowSize
        );
      }

      editorState.savedState.sequences.forEach((s) => {
        s.activeCubes3D?.forEach((c) => {
          if (c.id == objectId) {
            c.position = {
              x: c.position.x,
              y: value,
            };
          }
        });
      });

      saveSequencesData(
        editorState.savedState.sequences,
        editorState.saveTarget
      );
      break;
    }
    case ObjectType.Sphere3D: {
      let sphere = editor.spheres3D.find((s) => s.id === objectId);
      if (sphere && editor.camera) {
        sphere.transform.updatePosition(
          [sphere.transform.position[0], value],
          editor.camera.windowSize
        );
        sphere.transform.updateUniformBuffer(
          editor.gpuResources?.queue!,
          editor.camera.windowSize
        );
      }

      editorState.savedState.sequences.forEach((s) => {
        s.activeSpheres3D?.forEach((sp) => {
          if (sp.id == objectId) {
            sp.position = {
              x: sp.position.x,
              y: value,
            };
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

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
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

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
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

export function updateTextAnimation(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  templateId: string
) {
  const textItem = editor.textItems.find((t) => t.id === objectId);
  if (!textItem) return;

  textItem.setTextAnimationFromTemplate(templateId);
  const animationConfig = textItem.getTextAnimationConfig();

  editorState.savedState.sequences.forEach((s) => {
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.textAnimation = animationConfig;
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function removeTextAnimation(
  editorState: EditorState,
  editor: Editor,
  objectId: string
) {
  const textItem = editor.textItems.find((t) => t.id === objectId);
  if (!textItem) return;

  textItem.removeTextAnimation();

  editorState.savedState.sequences.forEach((s) => {
    s.activeTextItems.forEach((p) => {
      if (p.id == objectId) {
        p.textAnimation = null;
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

// Cube3D specific properties
export function updateCube3DWidth(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.dimensions = [value, cube.dimensions[1], cube.dimensions[2]];
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.dimensions = [value, c.dimensions[1], c.dimensions[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateCube3DHeight(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.dimensions = [cube.dimensions[0], value, cube.dimensions[2]];
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.dimensions = [c.dimensions[0], value, c.dimensions[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateCube3DDepth(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.dimensions = [cube.dimensions[0], cube.dimensions[1], value];
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.dimensions = [c.dimensions[0], c.dimensions[1], value];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateCube3DRotationX(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.transform.updateRotationXDegrees(value);
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    cube.rotation = [value, cube.rotation[1], cube.rotation[2]];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.rotation = [value, c.rotation[1], c.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateCube3DRotationY(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.transform.updateRotationYDegrees(value);
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    cube.rotation = [cube.rotation[0], value, cube.rotation[2]];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.rotation = [c.rotation[0], value, c.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateCube3DRotationZ(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let cube = editor.cubes3D.find((c) => c.id === objectId);
  if (cube && editor.camera) {
    cube.transform.updateRotationDegrees(value);
    cube.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    cube.rotation = [cube.rotation[0], cube.rotation[1], value];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeCubes3D?.forEach((c) => {
      if (c.id == objectId) {
        c.rotation = [c.rotation[0], c.rotation[1], value];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

// Sphere3D specific properties
export function updateSphere3DRadius(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let sphere = editor.spheres3D.find((s) => s.id === objectId);
  if (sphere) {
    sphere.radius = value;
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeSpheres3D?.forEach((sp) => {
      if (sp.id == objectId) {
        sp.radius = value;
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateSphere3DRotationX(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let sphere = editor.spheres3D.find((s) => s.id === objectId);
  if (sphere && editor.camera) {
    sphere.transform.updateRotationXDegrees(value);
    sphere.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    sphere.rotation = [value, sphere.rotation[1], sphere.rotation[2]];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeSpheres3D?.forEach((sp) => {
      if (sp.id == objectId) {
        sp.rotation = [value, sp.rotation[1], sp.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateSphere3DRotationY(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let sphere = editor.spheres3D.find((s) => s.id === objectId);
  if (sphere && editor.camera) {
    sphere.transform.updateRotationYDegrees(value);
    sphere.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    sphere.rotation = [sphere.rotation[0], value, sphere.rotation[2]];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeSpheres3D?.forEach((sp) => {
      if (sp.id == objectId) {
        sp.rotation = [sp.rotation[0], value, sp.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateSphere3DRotationZ(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let sphere = editor.spheres3D.find((s) => s.id === objectId);
  if (sphere && editor.camera) {
    sphere.transform.updateRotationDegrees(value);
    sphere.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    sphere.rotation = [sphere.rotation[0], sphere.rotation[1], value];
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeSpheres3D?.forEach((sp) => {
      if (sp.id == objectId) {
        sp.rotation = [sp.rotation[0], sp.rotation[1], value];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DWidth(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.dimensions = [value, mockup.dimensions[1], mockup.dimensions[2]];
    mockup.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Update video child transform to match new mockup dimensions
    if (mockup.videoChild && editor.gpuResources?.queue) {
      mockup.updateVideoChildTransform(
        editor.gpuResources.queue,
        editor.camera.windowSize
      );
    }
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.dimensions = [value, m.dimensions[1], m.dimensions[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DHeight(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.dimensions = [mockup.dimensions[0], value, mockup.dimensions[2]];
    mockup.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Update video child transform to match new mockup dimensions
    if (mockup.videoChild && editor.gpuResources?.queue) {
      mockup.updateVideoChildTransform(
        editor.gpuResources.queue,
        editor.camera.windowSize
      );
    }
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.dimensions = [m.dimensions[0], value, m.dimensions[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DDepth(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.dimensions = [mockup.dimensions[0], mockup.dimensions[1], value];
    mockup.transform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Update video child transform to match new mockup dimensions
    if (mockup.videoChild && editor.gpuResources?.queue) {
      mockup.updateVideoChildTransform(
        editor.gpuResources.queue,
        editor.camera.windowSize
      );
    }
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.dimensions = [m.dimensions[0], m.dimensions[1], value];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DRotationX(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.groupTransform.rotationX = value;
    mockup.groupTransform.updateRotationXDegrees(value * 0.01);
    mockup.groupTransform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Video child automatically follows via shared group transform
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.rotation = [value, m.rotation[1], m.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DRotationY(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.groupTransform.rotationY = value;
    mockup.groupTransform.updateRotationYDegrees(value * 0.01);
    mockup.groupTransform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Video child automatically follows via shared group transform
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.rotation = [m.rotation[0], value, m.rotation[2]];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}

export function updateMockup3DRotationZ(
  editorState: EditorState,
  editor: Editor,
  objectId: string,
  value: number
) {
  let mockup = editor.mockups3D.find((m) => m.id === objectId);
  if (mockup && editor.camera) {
    mockup.groupTransform.rotation = value;
    mockup.groupTransform.updateRotationDegrees(value * 0.01);
    mockup.groupTransform.updateUniformBuffer(
      editor.gpuResources?.queue!,
      editor.camera.windowSize
    );
    // Video child automatically follows via shared group transform
  }

  editorState.savedState.sequences.forEach((s) => {
    s.activeMockups3D?.forEach((m) => {
      if (m.id == objectId) {
        m.rotation = [m.rotation[0], m.rotation[1], value];
      }
    });
  });

  saveSequencesData(editorState.savedState.sequences, editorState.saveTarget);
}
