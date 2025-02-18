"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DebouncedInput,
  ExportVideoButton,
  NavButton,
  OptionButton,
  PlaySequenceButton,
  PlayVideoButton,
} from "./items";
import { CreateIcon } from "./icon";
import {
  BackgroundFill,
  ObjectType,
  SavedState,
  Sequence,
  TimelineSequence,
  TrackType,
  UIKeyframe,
} from "@/engine/animations";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  AuthToken,
  getSingleProject,
  saveImage,
  saveSequencesData,
  saveTimelineData,
  saveVideo,
  updateSequences,
} from "@/fetchers/projects";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Editor,
  getRandomNumber,
  InputValue,
  Point,
  rgbToWgpu,
  Viewport,
  wgpuToHuman,
} from "@/engine/editor";
import { StVideoConfig } from "@/engine/video";
import { fileToBlob, StImageConfig } from "@/engine/image";
import { TextRendererConfig } from "@/engine/text";
import { PolygonConfig } from "@/engine/polygon";
import EditorState from "@/engine/editor_state";
import LayerPanel, { Layer, LayerFromConfig } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import {
  ImageProperties,
  PolygonProperties,
  TextProperties,
  VideoProperties,
} from "./Properties";
import { callMotionInference } from "@/fetchers/inference";
import KeyframeTimeline from "./KeyframeTimeline";
import { TimelineTrack } from "./SequenceTimeline";
import { hexParse } from "@kurkle/color";

export function update_keyframe(
  editor_state: EditorState,
  // mut current_animation_data: AnimationData,
  // mut current_keyframe: &mut UIKeyframe,
  current_keyframe: UIKeyframe,
  current_sequence: Sequence,
  selected_keyframes: UIKeyframe[],
  set_selected_keyframes: React.Dispatch<React.SetStateAction<UIKeyframe[]>>,
  // animation_data: RwSignal<Option<AnimationData>>,
  // selected_sequence_data: RwSignal<Sequence>,
  selected_sequence_id: string
  // sequence_selected: RwSignal<bool>,
) {
  if (selected_keyframes[0]) {
    let selected_keyframe = selected_keyframes[0];
    if (current_keyframe.id != selected_keyframe.id) {
      let new_keyframes = [];
      new_keyframes.push(current_keyframe);

      set_selected_keyframes(new_keyframes);
    }
  } else {
    let new_keyframes = [];
    new_keyframes.push(current_keyframe);

    set_selected_keyframes(new_keyframes);
  }

  // update animation data
  // current_animation_data.properties.iter_mut().for_each(|p| {
  //     p.keyframes.iter_mut().for_each(|mut k| {
  //         if k.id == current_keyframe.id {
  //             *k = current_keyframe.to_owned();
  //         }
  //     });
  // });

  // animation_data.set(Some(current_animation_data));

  // update sequence
  current_sequence.polygonMotionPaths.forEach((pm) => {
    pm.properties.forEach((p) => {
      p.keyframes.forEach((k) => {
        if (k.id == current_keyframe.id) {
          k = current_keyframe;
        }
      });
    });
  });

  // set_selected_sequence_data(current_sequence);

  // sequence_selected.set(true);

  // save to file
  // let last_saved_state = editor_state
  //     .saved_state;

  // last_saved_state.sequences.forEach((s) => {
  //     if s.id == selected_sequence_id {
  current_sequence.polygonMotionPaths.forEach((pm) => {
    pm.properties.forEach((p) => {
      p.keyframes.forEach((k) => {
        if (k.id == current_keyframe.id) {
          k = current_keyframe;
        }
      });
    });
  });
  // }
  // });

  // TODO: probably perf hit with larger files, or does it get released?
  // let new_saved_state = last_saved_state.to_owned();

  editor_state.savedState.sequences.forEach((s) => {
    if (s.id == current_sequence.id) {
      s = current_sequence;
    }
  });

  saveSequencesData(editor_state.savedState.sequences);
}

function findObjectType(
  lastSavedState: SavedState,
  objectId: string
): ObjectType | null {
  // Check active polygons
  if (
    lastSavedState.sequences.some((s) =>
      s.activePolygons.some((ap) => ap.id === objectId)
    )
  ) {
    return ObjectType.Polygon;
  }

  // Check active images
  if (
    lastSavedState.sequences.some((s) =>
      s.activeImageItems.some((ai) => ai.id === objectId)
    )
  ) {
    return ObjectType.ImageItem;
  }

  // Check active text
  if (
    lastSavedState.sequences.some((s) =>
      s.activeTextItems.some((at) => at.id === objectId)
    )
  ) {
    return ObjectType.TextItem;
  }

  // Check active videos
  if (
    lastSavedState.sequences.some((s) =>
      s.activeVideoItems.some((av) => av.id === objectId)
    )
  ) {
    return ObjectType.VideoItem;
  }

  return null;
}

export const ProjectEditor: React.FC<any> = ({ projectId }) => {
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [sequences, set_sequences] = useState<Sequence[]>([]);
  let [loading, set_loading] = useState(false);
  let [section, set_section] = useState("SequenceList");
  let [keyframe_count, set_keyframe_count] = useState(0);
  let [is_curved, set_is_curved] = useState(false);
  let [auto_choreograph, set_auto_choreograph] = useState(true);
  let [auto_fade, set_auto_fade] = useState(true);
  let [layers, set_layers] = useState<Layer[]>([]);
  let [dragger_id, set_dragger_id] = useState(null);
  let [current_sequence_id, set_current_sequence_id] = useState<string | null>(
    null
  );

  let [selected_polygon_id, set_selected_polygon_id] = useState<string | null>(
    null
  );
  let [selected_image_id, set_selected_image_id] = useState<string | null>(
    null
  );
  let [selected_text_id, set_selected_text_id] = useState<string | null>(null);
  let [selected_video_id, set_selected_video_id] = useState<string | null>(
    null
  );
  let [selected_keyframes, set_selected_keyframes] = useState<string[] | null>(
    null
  );

  let [tSequences, setTSequences] = useState<TimelineSequence[]>([]);
  let [sequenceDurations, setSequenceDurations] = useState<
    Record<string, number>
  >({});
  let [sequenceQuickAccess, setSequenceQuickAccess] = useState<
    Record<string, string>
  >({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const editorRef = useRef<Editor | null>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const canvasPipelineRef = useRef<CanvasPipeline | null>(null);
  const [editorIsSet, setEditorIsSet] = useState(false);

  let setupCanvasMouseTracking = (canvas: HTMLCanvasElement) => {
    let editor = editorRef.current;

    if (!editor) {
      return;
    }

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      // Get the canvas's bounding rectangle
      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to the canvas
      const positionX = event.clientX - rect.left;
      const positionY = event.clientY - rect.top;

      // Get current viewport size
      // const viewport = getViewportSize();

      editor.handle_mouse_move(positionX, positionY);
    });

    canvas.addEventListener("mousedown", () => {
      editor.handle_mouse_down();
    });

    canvas.addEventListener("mouseup", () => {
      console.info("handle mouse up");
      editor.handle_mouse_up();
    });

    canvas.addEventListener("mouseleave", () => {
      // Handle mouse leaving canvas if needed
    });
  };

  let select_polygon = (polygon_id: string) => {
    set_selected_polygon_id(polygon_id);
    set_selected_text_id(null);
    set_selected_image_id(null);
    set_selected_video_id(null);
  };

  let select_text = (text_id: string) => {
    set_selected_polygon_id(null);
    set_selected_text_id(text_id);
    set_selected_image_id(null);
    set_selected_video_id(null);
  };

  let select_image = (image_id: string) => {
    set_selected_polygon_id(null);
    set_selected_text_id(null);
    set_selected_image_id(image_id);
    set_selected_video_id(null);
  };

  let select_video = (video_id: string) => {
    set_selected_polygon_id(null);
    set_selected_text_id(null);
    set_selected_image_id(null);
    set_selected_video_id(video_id);
  };

  let handle_polygon_click = (
    polygon_id: string,
    polygon_config: PolygonConfig
  ) => {
    select_polygon(polygon_id);
  };

  let handle_text_click = (
    text_id: string
    // polygon_config: PolygonConfig
  ) => {
    select_text(text_id);
  };

  let handle_image_click = (
    image_id: string
    // polygon_config: PolygonConfig
  ) => {
    select_image(image_id);
  };

  let handle_video_click = (
    video_id: string
    // polygon_config: PolygonConfig
  ) => {
    select_video(video_id);
  };

  let handle_mouse_up = (
    object_id: string,
    point: Point
  ): [Sequence, string[]] | null => {
    let last_saved_state = editorStateRef.current?.savedState;

    if (!last_saved_state) {
      return null;
    }

    let object_type = findObjectType(last_saved_state, object_id);

    console.info(
      "see type",
      object_type,
      "id",
      object_id,
      "id2",
      current_sequence_id
    );

    last_saved_state.sequences.forEach((s) => {
      if (s.id == current_sequence_id) {
        switch (object_type) {
          case ObjectType.Polygon: {
            s.activePolygons.forEach((ap) => {
              if (ap.id == object_id) {
                console.info("updating position...");
                ap.position = {
                  x: point.x,
                  y: point.y,
                };
              }
            });
            break;
          }
          case ObjectType.TextItem: {
            s.activeTextItems.forEach((tr) => {
              if (tr.id == object_id) {
                tr.position = {
                  x: point.x,
                  y: point.y,
                };
              }
            });
            break;
          }
          case ObjectType.ImageItem: {
            s.activeImageItems.forEach((si) => {
              if (si.id == object_id) {
                si.position = {
                  x: point.x,
                  y: point.y,
                };
              }
            });
            break;
          }
          case ObjectType.VideoItem: {
            s.activeVideoItems.forEach((si) => {
              if (si.id == object_id) {
                si.position = {
                  x: point.x,
                  y: point.y,
                };
              }
            });
            break;
          }
        }
      }
    });

    // last_saved_state.sequences = updatedSequences;

    saveSequencesData(last_saved_state.sequences);

    console.info("Position updated!");

    let current_sequence_data = last_saved_state.sequences.find(
      (s) => s.id === current_sequence_id
    );

    if (!current_sequence_data || !selected_keyframes) {
      return null;
    }

    return [current_sequence_data, selected_keyframes];
  };

  useDevEffectOnce(() => {
    if (editorIsSet) {
      return;
    }

    console.info("Starting Editor...");

    let viewport = new Viewport(900, 550);

    editorRef.current = new Editor(viewport);

    setEditorIsSet(true);
  });

  useEffect(() => {
    console.info("remount");
  }, []);

  let fetch_data = async () => {
    if (!authToken || !editorRef.current) {
      return;
    }

    set_loading(true);

    let response = await getSingleProject(authToken.token, projectId);

    let fileData = response.project?.fileData;

    console.info("savedState", fileData);

    if (!fileData) {
      return;
    }

    editorStateRef.current = new EditorState(fileData);

    let cloned_sequences = fileData?.sequences;

    if (!cloned_sequences) {
      return;
    }

    set_sequences(cloned_sequences);
    // set_timeline_state(response.project?.fileData.timeline_state);

    // drop(editor_state);

    console.info("Initializing pipeline...");

    let pipeline = new CanvasPipeline();

    canvasPipelineRef.current = await pipeline.new(editorRef.current, true);

    let windowSize = editorRef.current.camera?.windowSize;

    if (!windowSize?.width || !windowSize?.height) {
      return;
    }

    canvasPipelineRef.current.recreateDepthView(
      windowSize?.width,
      windowSize?.height
    );

    console.info("Beginning rendering...");

    canvasPipelineRef.current.beginRendering(editorRef.current);

    // console.info("Restoring objects...");

    for (let sequence of cloned_sequences) {
      editorRef.current.restore_sequence_objects(
        sequence,
        true
        // authToken.token,
      );
    }

    // set handlers
    const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
    setupCanvasMouseTracking(canvas);

    set_quick_access();

    set_loading(false);
  };

  useEffect(() => {
    if (editorIsSet) {
      console.info("Fetch data...");

      fetch_data();
    }
  }, [editorIsSet]);

  useEffect(() => {
    if (editorIsSet) {
      if (!editorRef.current) {
        return;
      }

      console.info("Setting event handlers!");

      // set handlers that rely on state
      editorRef.current.handlePolygonClick = handle_polygon_click;
      editorRef.current.handleTextClick = handle_text_click;
      editorRef.current.handleImageClick = handle_image_click;
      editorRef.current.handleVideoClick = handle_video_click;
      editorRef.current.onMouseUp = handle_mouse_up;
    }
  }, [editorIsSet, current_sequence_id]);

  let on_create_sequence = async () => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    if (!authToken) {
      return;
    }

    set_loading(true);

    let new_sequences = sequences;

    new_sequences.push({
      id: uuidv4().toString(),
      name: "New Sequence",
      backgroundFill: { type: "Color", value: [200, 200, 200, 255] },
      durationMs: 20000,
      activePolygons: [],
      polygonMotionPaths: [],
      activeTextItems: [],
      activeImageItems: [],
      activeVideoItems: [],
    });

    set_sequences(new_sequences);

    editorState.savedState.sequences = new_sequences;

    let response = await updateSequences(
      authToken.token,
      projectId,
      new_sequences
    );

    set_quick_access();

    set_loading(false);
  };

  let set_quick_access = () => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let durations = {} as Record<string, number>;
    editorState.savedState.sequences.forEach((s) => {
      durations[s.id] = s.durationMs;
    });

    setSequenceDurations(durations);

    let quickAccess = {} as Record<string, string>;
    editorState.savedState.sequences.forEach((s) => {
      quickAccess[s.id] = s.name;
    });

    setSequenceQuickAccess(quickAccess);

    setTSequences(editorState.savedState.timeline_state.timeline_sequences);
  };

  let on_open_sequence = (sequence_id: string) => {
    set_section("SequenceView");

    console.info("Open Sequence...");

    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    let saved_state = editor_state?.savedState;

    if (!saved_state) {
      return;
    }

    let saved_sequence = saved_state.sequences.find((s) => s.id == sequence_id);

    if (!saved_sequence) {
      return;
    }

    let background_fill = {
      type: "Color",
      value: [
        wgpuToHuman(0.8) as number,
        wgpuToHuman(0.8) as number,
        wgpuToHuman(0.8) as number,
        255,
      ],
    } as BackgroundFill;

    if (saved_sequence?.backgroundFill) {
      background_fill = saved_sequence.backgroundFill;
    }

    // for the background polygon and its signal
    editor_state.selected_polygon_id = saved_sequence.id;

    // drop(editor_state);

    console.info("Opening Sequence...");

    // let mut editor = editor.lock().unwrap();

    // let camera = editor.camera.expect("Couldn't get camera");
    // let viewport = editor.viewport.lock().unwrap();

    // let window_size = WindowSize {
    //     width: viewport.width as u32,
    //     height: viewport.height as u32,
    // };

    // drop(viewport);

    // let mut rng = rand::thread_rng();

    // set hidden to false based on sequence
    // also reset all objects to hidden=true beforehand
    editor.polygons.forEach((p) => {
      p.hidden = true;
    });
    editor?.imageItems.forEach((i) => {
      i.hidden = true;
    });
    editor?.textItems.forEach((t) => {
      t.hidden = true;
    });
    editor?.videoItems.forEach((t) => {
      t.hidden = true;
    });

    saved_sequence.activePolygons.forEach((ap) => {
      let polygon = editor.polygons.find((p) => p.id == ap.id);

      if (!polygon) {
        return;
      }

      polygon.hidden = false;
    });
    saved_sequence.activeImageItems.forEach((si) => {
      let image = editor.imageItems.find((i) => i.id == si.id);

      if (!image) {
        return;
      }

      image.hidden = false;
    });
    saved_sequence.activeTextItems.forEach((tr) => {
      let text = editor.textItems.find((t) => t.id == tr.id);

      if (!text) {
        return;
      }

      text.hidden = false;
    });
    saved_sequence.activeVideoItems.forEach((tr) => {
      let video = editor.videoItems.find((t) => t.id == tr.id);

      if (!video) {
        return;
      }

      video.hidden = false;

      console.info("Video restored!");
    });

    if (background_fill.type === "Color") {
      editor.replace_background(
        saved_sequence.id,
        rgbToWgpu(
          background_fill.value[0],
          background_fill.value[1],
          background_fill.value[2],
          background_fill.value[3]
        )
      );
    }

    console.info("Objects restored!", saved_sequence.id);

    editor?.updateMotionPaths(saved_sequence);

    console.info("Motion Paths restored!");

    console.info("Restoring layers...");

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

    // console.info("new_layers", new_layers);

    // sort layers by layer_index property, lower values should come first in the list
    // but reverse the order because the UI outputs the first one first, thus it displays last
    new_layers.sort((a, b) => a.initial_layer_index);

    set_layers(new_layers);
    console.info("set current", sequence_id);
    set_current_sequence_id(sequence_id);

    // set_quick_access();

    // drop(editor);
  };

  let on_generate_animation = async () => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    set_loading(true);

    console.info("create prompt");

    let prompt = editor.createInferencePrompt();
    let predictions = await callMotionInference(prompt);

    console.info("predictions", predictions);

    let animation = editor.createMotionPathsFromPredictions(predictions);

    editor_state.savedState.sequences.forEach((s) => {
      if (s.id === current_sequence_id) {
        s.polygonMotionPaths = animation;
      }
    });

    let updatedSequence = editor_state.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );

    if (!updatedSequence) {
      return;
    }

    console.info("update paths");

    editor.updateMotionPaths(updatedSequence);

    saveSequencesData(editor_state.savedState.sequences);

    set_loading(false);
  };

  let on_add_square = (sequence_id: string) => {
    console.info("Adding Square...");

    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(0, 800);
    let random_number_450 = getRandomNumber(0, 450);

    let new_id = uuidv4();

    let polygon_config: PolygonConfig = {
      id: new_id,
      name: "Square",
      points: [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 },
      ],
      dimensions: [100.0, 100.0],
      position: {
        x: random_number_800,
        y: random_number_450,
      },
      rotation: 0,
      borderRadius: 0.0,
      fill: [1.0, 1.0, 1.0, 1.0],
      stroke: {
        fill: [1.0, 1.0, 1.0, 1.0],
        thickness: 2.0,
      },
      layer: -2,
    };

    editor.add_polygon(polygon_config, "Polygon", new_id, sequence_id);

    editor_state.add_saved_polygon(sequence_id, {
      id: polygon_config.id,
      name: polygon_config.name,
      dimensions: [polygon_config.dimensions[0], polygon_config.dimensions[1]],
      fill: [
        polygon_config.fill[0],
        polygon_config.fill[1],
        polygon_config.fill[2],
        polygon_config.fill[3],
      ],
      borderRadius: polygon_config.borderRadius,
      position: {
        x: polygon_config.position.x,
        y: polygon_config.position.y,
      },
      stroke: {
        thickness: polygon_config.stroke.thickness,
        fill: [
          polygon_config.stroke.fill[0],
          polygon_config.stroke.fill[1],
          polygon_config.stroke.fill[2],
          polygon_config.stroke.fill[3],
        ],
      },
      layer: polygon_config.layer,
    });

    let saved_state = editor_state.savedState;

    let updated_sequence = saved_state.sequences.find(
      (s) => s.id == sequence_id
    );

    let sequence_cloned = updated_sequence;

    if (!sequence_cloned) {
      throw Error("Sequence does not exist");
    }

    set_sequences(saved_state.sequences);

    editor.currentSequenceData = sequence_cloned;

    editor.updateMotionPaths(sequence_cloned);

    console.info("Square added!");
  };

  let on_add_image = async (sequence_id: string, file: File) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!authToken) {
      return;
    }

    let blob = await fileToBlob(file);

    if (!blob) {
      return;
    }

    let response = await saveImage(authToken.token, file.name, blob);

    if (response) {
      let url = response.url;

      console.info("File url:", url);

      // let mut rng = rand::thread_rng();
      // let random_number_800 = rng.gen_range(0..=800);
      // let random_number_450 = rng.gen_range(0..=450);

      let random_number_800 = getRandomNumber(0, 800);
      let random_number_450 = getRandomNumber(0, 450);

      let new_id = uuidv4();

      let position = {
        x: random_number_800 + CANVAS_HORIZ_OFFSET,
        y: random_number_450 + CANVAS_VERT_OFFSET,
      };

      let image_config = {
        id: new_id,
        name: "New Image Item",
        dimensions: [100, 100] as [number, number],
        position,
        // path: new_path.clone(),
        url: url,
        layer: -1,
      };

      editor.add_image_item(image_config, url, blob, new_id, sequence_id);

      console.info("Adding image: {:?}", new_id);

      editor_state.add_saved_image_item(sequence_id, {
        id: image_config.id,
        name: image_config.name,
        // path: new_path.clone(),
        url: url,
        dimensions: [image_config.dimensions[0], image_config.dimensions[1]],
        position: {
          x: position.x,
          y: position.y,
        },
        layer: image_config.layer,
      });

      console.info("Saved image!");

      let saved_state = editor_state.savedState;
      let updated_sequence = saved_state.sequences.find(
        (s) => s.id == sequence_id
      );

      let sequence_cloned = updated_sequence;

      if (!sequence_cloned) {
        return;
      }

      set_sequences(saved_state.sequences);

      editor.currentSequenceData = sequence_cloned;
      editor.updateMotionPaths(sequence_cloned);

      console.info("Image added!");
    }
  };

  let on_add_text = async (sequence_id: string) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(0, 800);
    let random_number_450 = getRandomNumber(0, 450);

    let new_id = uuidv4();
    let new_text = "New text";
    let font_family = "Aleo";

    let position = {
      x: random_number_800 + CANVAS_HORIZ_OFFSET,
      y: random_number_450 + CANVAS_VERT_OFFSET,
    };

    let text_config = {
      id: new_id,
      name: "New Text Item",
      text: new_text,
      fontFamily: font_family,
      dimensions: [100.0, 100.0] as [number, number],
      position,
      layer: -2,
      // color: rgbToWgpu(20, 20, 200, 255) as [number, number, number, number],
      color: [20, 20, 200, 255] as [number, number, number, number],
      fontSize: 28,
      backgroundFill: rgbToWgpu(200, 200, 200, 255) as [
        number,
        number,
        number,
        number
      ],
    };

    await editor.add_text_item(text_config, new_text, new_id, sequence_id);

    editor_state.add_saved_text_item(sequence_id, {
      id: text_config.id,
      name: text_config.name,
      text: new_text,
      fontFamily: text_config.fontFamily,
      dimensions: [text_config.dimensions[0], text_config.dimensions[1]],
      position: {
        x: position.x,
        y: position.y,
      },
      layer: text_config.layer,
      color: text_config.color,
      fontSize: text_config.fontSize,
      backgroundFill: text_config.backgroundFill,
    });

    let saved_state = editor_state.savedState;
    let updated_sequence = saved_state.sequences.find(
      (s) => s.id == sequence_id
    );

    let sequence_cloned = updated_sequence;

    if (!sequence_cloned) {
      return;
    }

    set_sequences(saved_state.sequences);

    // let mut editor = editor_m.lock().unwrap();

    editor.currentSequenceData = sequence_cloned;
    editor.updateMotionPaths(sequence_cloned);

    // drop(editor);
  };

  let on_add_video = async (sequence_id: string, file: File) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!authToken) {
      return;
    }

    let blob = await fileToBlob(file);

    if (!blob) {
      return;
    }

    let response = await saveVideo(authToken.token, file.name, blob);

    if (response) {
      let url = response.url;

      console.info("File url:", url);

      // let mut rng = rand::thread_rng();
      // let random_number_800 = rng.gen_range(0..=800);
      // let random_number_450 = rng.gen_range(0..=450);

      let random_number_800 = getRandomNumber(0, 800);
      let random_number_450 = getRandomNumber(0, 450);

      let new_id = uuidv4();

      let position = {
        x: random_number_800 + CANVAS_HORIZ_OFFSET,
        y: random_number_450 + CANVAS_VERT_OFFSET,
      };

      let video_config = {
        id: new_id,
        name: "New Video Item",
        dimensions: [100, 100] as [number, number],
        position,
        // path: new_path.clone(),
        path: url,
        mousePath: "",
        layer: -1,
      };

      editor.add_video_item(video_config, blob, new_id, sequence_id, [], null);

      console.info("Adding video: {:?}", new_id);

      editor_state.add_saved_video_item(sequence_id, {
        id: video_config.id,
        name: video_config.name,
        // path: new_path.clone(),
        path: url,
        dimensions: [video_config.dimensions[0], video_config.dimensions[1]],
        position: {
          x: position.x,
          y: position.y,
        },
        layer: video_config.layer,
        mousePath: video_config.mousePath,
      });

      console.info("Saved video!");

      let saved_state = editor_state.savedState;
      let updated_sequence = saved_state.sequences.find(
        (s) => s.id == sequence_id
      );

      let sequence_cloned = updated_sequence;

      if (!sequence_cloned) {
        return;
      }

      set_sequences(saved_state.sequences);

      editor.currentSequenceData = sequence_cloned;
      editor.updateMotionPaths(sequence_cloned);

      console.info("video added!");
    }
  };

  let on_open_capture = () => {};

  let on_items_updated = () => {};

  let on_item_duplicated = () => {};

  let on_item_deleted = () => {};

  const handleSequenceDragEnd = (
    sequence: TimelineSequence,
    newStartTimeMs: number
  ) => {
    setTSequences((prev) =>
      prev.map((seq) =>
        seq.id === sequence.id ? { ...seq, startTimeMs: newStartTimeMs } : seq
      )
    );
  };

  let [background_red, set_background_red] = useState(0);
  let [background_green, set_background_green] = useState(0);
  let [background_blue, set_background_blue] = useState(0);

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

  let colors = [
    ["#FFE4E1", "#FF6B6B", "#FF0000", "#B22222", "#8B0000"], // red
    ["#FFECD9", "#FFB347", "#FF8C00", "#D95E00", "#993D00"], // orange
    ["#FFFACD", "#FFE66D", "#FFD700", "#DAA520", "#B8860B"], // yellow
    ["#E8F5E9", "#7CB342", "#2E7D32", "#1B5E20", "#0A3D0A"], // green
    ["#E3F2FD", "#64B5F6", "#1E88E5", "#1565C0", "#0D47A1"], // blue
    ["#F3E5F5", "#AB47BC", "#8E24AA", "#6A1B9A", "#4A148C"], // purple
    ["#FCE4EC", "#F06292", "#E91E63", "#C2185B", "#880E4F"], // pink
    ["#E0F2F1", "#4DB6AC", "#00897B", "#00695C", "#004D40"], // teal
    ["#EFEBE9", "#A1887F", "#795548", "#5D4037", "#3E2723"], // brown
    ["#F5F5F5", "#BDBDBD", "#757575", "#424242", "#212121"], // gray
  ];

  // 50 color / text combinations (style portion of format)
  // background_color_index, text_length, font_family_index, font_size, font_color_index
  let themes = [
    [0.0, 120.0, 12.0, 24.0, 0.4],
    [1.2, 80.0, 25.0, 32.0, 1.0],
    [2.1, 150.0, 37.0, 18.0, 2.3],
    [3.3, 200.0, 45.0, 20.0, 3.1],
    [4.4, 100.0, 50.0, 28.0, 4.0],
    [5.2, 90.0, 55.0, 22.0, 5.1],
    [6.0, 130.0, 10.0, 26.0, 6.3],
    [7.2, 110.0, 30.0, 16.0, 7.4],
    [8.1, 140.0, 40.0, 20.0, 8.3],
    [9.3, 180.0, 5.0, 18.0, 9.1],
    [0.1, 95.0, 18.0, 30.0, 0.3],
    [1.3, 110.0, 22.0, 20.0, 1.2],
    [2.2, 130.0, 35.0, 22.0, 2.4],
    [3.0, 160.0, 48.0, 18.0, 3.2],
    [4.1, 75.0, 7.0, 28.0, 4.3],
    [5.4, 140.0, 53.0, 24.0, 5.0],
    [6.2, 100.0, 14.0, 26.0, 6.1],
    [7.1, 120.0, 29.0, 20.0, 7.3],
    [8.2, 150.0, 42.0, 18.0, 8.4],
    [9.0, 200.0, 3.0, 16.0, 9.2],
    [0.3, 85.0, 20.0, 32.0, 0.2],
    [1.4, 105.0, 26.0, 24.0, 1.1],
    [2.0, 115.0, 38.0, 20.0, 2.3],
    [3.2, 170.0, 47.0, 18.0, 3.4],
    [4.2, 90.0, 9.0, 30.0, 4.1],
    [5.1, 125.0, 54.0, 22.0, 5.3],
    [6.3, 135.0, 16.0, 24.0, 6.2],
    [7.0, 145.0, 31.0, 18.0, 7.4],
    [8.3, 155.0, 43.0, 20.0, 8.1],
    [9.4, 180.0, 6.0, 16.0, 9.0],
    [0.4, 100.0, 23.0, 28.0, 0.1],
    [1.0, 115.0, 27.0, 22.0, 1.3],
    [2.3, 140.0, 39.0, 20.0, 2.2],
    [3.1, 160.0, 46.0, 18.0, 3.0],
    [4.3, 80.0, 8.0, 32.0, 4.2],
    [5.0, 130.0, 55.0, 24.0, 5.4],
    [6.1, 95.0, 15.0, 26.0, 6.4],
    [7.3, 110.0, 32.0, 20.0, 7.2],
    [8.4, 165.0, 44.0, 18.0, 8.0],
    [9.2, 190.0, 4.0, 16.0, 9.3],
  ];

  return (
    <div className="flex flex-row p-4">
      <div className="flex flex-col gap-4 mr-4">
        <p style={{ fontFamily: "Maitree" }}>Maitree</p>
        <NavButton
          label="Motion"
          icon="brush"
          destination={`/project/${projectId}`}
        />
        <NavButton label="Settings" icon="gear" destination="/settings" />
      </div>
      <div className="flex flex-row w-full">
        {section === "SequenceList" ? (
          <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col w-full">
              <ExportVideoButton
                editorRef={editorRef}
                editorStateRef={editorStateRef}
              />
              <div className="flex flex-row justify-between align-center w-full">
                <h5>Sequences</h5>
                <button
                  className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
                  disabled={loading}
                  onClick={on_create_sequence}
                >
                  New Sequence
                </button>
              </div>
              <div className="flex flex-col w-full mt-2">
                {sequences.map((sequence: Sequence) => (
                  <div className="flex flex-row" key={sequence.id}>
                    <button
                      className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                      disabled={loading}
                      onClick={() => on_open_sequence(sequence.id)}
                    >
                      Open {sequence.name}
                    </button>
                    {/* <button
                        className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                        disabled={loading}
                        onClick={() => {}}
                      >
                        Duplicate
                      </button> */}
                    <button
                      className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                      disabled={loading}
                      onClick={async () => {
                        let editor_state = editorStateRef.current;

                        if (!editor_state) {
                          return;
                        }

                        let existing_timeline =
                          editor_state.savedState.timeline_state
                            .timeline_sequences;

                        // Find the sequence that ends at the latest point in time
                        let startTime = 0;
                        if (existing_timeline.length > 0) {
                          let test = existing_timeline.map((seq) => {
                            let duration_ms = sequenceDurations[seq.sequenceId];
                            return seq.startTimeMs + duration_ms;
                          });

                          startTime = Math.max(...test);
                        }

                        existing_timeline.push({
                          id: uuidv4(),
                          sequenceId: sequence.id,
                          trackType: TrackType.Video,
                          startTimeMs: startTime,
                          // duration_ms: 20000,
                        });

                        await saveTimelineData(
                          editor_state.savedState.timeline_state
                        );

                        setTSequences(
                          editor_state.savedState.timeline_state
                            .timeline_sequences
                        );

                        console.info("Sequence added!");
                      }}
                    >
                      Add to Timeline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {section === "SequenceView" && current_sequence_id ? (
          <div className="flex flex-col gap-4 w-full max-w-[315px]">
            {selected_polygon_id && (
              <PolygonProperties
                editorRef={editorRef}
                editorStateRef={editorStateRef}
                currentSequenceId={current_sequence_id}
                currentPolygonId={selected_polygon_id}
              />
            )}

            {selected_image_id && (
              <>
                <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                  <ImageProperties
                    editorRef={editorRef}
                    editorStateRef={editorStateRef}
                    currentSequenceId={current_sequence_id}
                    currentImageId={selected_image_id}
                  />
                </div>
              </>
            )}

            {selected_text_id && (
              <>
                <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                  <TextProperties
                    editorRef={editorRef}
                    editorStateRef={editorStateRef}
                    currentSequenceId={current_sequence_id}
                    currentTextId={selected_text_id}
                  />
                </div>
              </>
            )}

            {selected_video_id && (
              <>
                <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                  <VideoProperties
                    editorRef={editorRef}
                    editorStateRef={editorStateRef}
                    currentSequenceId={current_sequence_id}
                    currentVideoId={selected_video_id}
                  />
                </div>
              </>
            )}

            {!selected_polygon_id &&
              !selected_image_id &&
              !selected_text_id &&
              !selected_video_id && (
                <>
                  <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-col w-full gap-4 mb-4">
                      <div className="flex flex-row items-center">
                        <button
                          className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
                          disabled={loading}
                          onClick={() => set_section("SequenceList")}
                        >
                          <CreateIcon icon="arrow-left" size="24px" />
                        </button>
                        <h5>Update Sequence</h5>
                      </div>
                      <div className="flex flex-row gap-2">
                        <label htmlFor="keyframe_count" className="text-xs">
                          Choose keyframe count
                        </label>
                        <select
                          id="keyframe_count"
                          name="keyframe_count"
                          className="text-xs"
                          value={keyframe_count}
                          onChange={(ev) =>
                            set_keyframe_count(parseInt(ev.target.value))
                          }
                        >
                          <option value="4">4</option>
                          <option value="6">6</option>
                        </select>
                        <input
                          type="checkbox"
                          id="is_curved"
                          name="is_curved"
                          checked={is_curved}
                          onChange={(ev) => set_is_curved(ev.target.checked)}
                        />
                        <label htmlFor="is_curved" className="text-xs">
                          Is Curved
                        </label>
                      </div>
                      <div className="flex flex-row gap-2">
                        <input
                          type="checkbox"
                          id="auto_choreograph"
                          name="auto_choreograph"
                          checked={auto_choreograph}
                          onChange={(ev) =>
                            set_auto_choreograph(ev.target.checked)
                          }
                        />
                        <label htmlFor="auto_choreograph" className="text-xs">
                          Auto-Choreograph
                        </label>
                        <input
                          type="checkbox"
                          id="auto_fade"
                          name="auto_fade"
                          checked={auto_fade}
                          onChange={(ev) => set_auto_fade(ev.target.checked)}
                        />
                        <label htmlFor="auto_fade" className="text-xs">
                          Auto-Fade
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white stunts-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                        onClick={() => {
                          on_generate_animation();
                        }}
                      >
                        {loading ? "Generating..." : "Generate Animation"}
                      </button>
                      <div className="flex flex-row flex-wrap gap-2">
                        <OptionButton
                          style=""
                          label="Add Square"
                          icon="square"
                          callback={() => {
                            if (!current_sequence_id) {
                              return;
                            }

                            on_add_square(current_sequence_id);
                          }}
                        />
                        <OptionButton
                          style=""
                          label="Add Text"
                          icon="text"
                          callback={() => {
                            if (!current_sequence_id) {
                              return;
                            }

                            on_add_text(current_sequence_id);
                          }}
                        />

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            // Handle the selected file here
                            if (!e.target.files || !current_sequence_id) {
                              return;
                            }

                            const file = e.target.files[0];
                            if (file) {
                              // Do something with the file
                              console.log("Selected file:", file);
                              on_add_image(current_sequence_id, file);
                            }
                          }}
                        />
                        <OptionButton
                          style=""
                          label="Add Image"
                          icon="image"
                          callback={() => fileInputRef.current?.click()}
                        />

                        <input
                          type="file"
                          ref={videoInputRef}
                          accept="video/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            // Handle the selected file here
                            if (!e.target.files || !current_sequence_id) {
                              return;
                            }

                            const file = e.target.files[0];
                            if (file) {
                              // Do something with the file
                              console.log("Selected file:", file);
                              on_add_video(current_sequence_id, file);
                            }
                          }}
                        />
                        <OptionButton
                          style=""
                          label="Add Video"
                          icon="video"
                          callback={() => videoInputRef.current?.click()}
                        />
                        <OptionButton
                          style=""
                          label="Screen Capture"
                          icon="video"
                          callback={() => {}}
                        />
                      </div>

                      <div className="flex flex-row flex-wrap gap-2">
                        {themes.map((theme: number[], i) => {
                          const backgroundColorRow = Math.floor(theme[0]);
                          const backgroundColorColumn = Math.floor(
                            (theme[0] % 1) * 10
                          );
                          const backgroundColor =
                            colors[backgroundColorRow][backgroundColorColumn];
                          const textColorRow = Math.floor(theme[4]);
                          const textColorColumn = Math.floor(
                            (theme[4] % 1) * 10
                          );
                          const textColor =
                            colors[textColorRow][textColorColumn];

                          const backgroundRgb = hexParse(backgroundColor);
                          const textRgb = hexParse(textColor);

                          const fontIndex = theme[2];

                          return (
                            <OptionButton
                              key={`${backgroundColor}-${textColor}-${i}`}
                              style={`color: ${textColor}; background-color: ${backgroundColor};`}
                              label="Apply Theme"
                              icon="brush"
                              callback={async () => {
                                let editor = editorRef.current;
                                let editorState = editorStateRef.current;

                                if (!editor || !editorState) {
                                  return;
                                }

                                console.log("Apply Theme...");

                                // apply theme to background canvas and text objects

                                let text_color_wgpu = rgbToWgpu(
                                  textRgb.r,
                                  textRgb.g,
                                  textRgb.b,
                                  255.0
                                );

                                let text_color = [
                                  textRgb.r,
                                  textRgb.g,
                                  textRgb.b,
                                  255,
                                ] as [number, number, number, number];

                                let background_color_wgpu = rgbToWgpu(
                                  backgroundRgb.r,
                                  backgroundRgb.g,
                                  backgroundRgb.b,
                                  255.0
                                );

                                // using for text and canvas, so text_color can provide contrast
                                let background_color = [
                                  backgroundRgb.r,
                                  backgroundRgb.g,
                                  backgroundRgb.b,
                                  255,
                                ] as [number, number, number, number];

                                let ids_to_update = editor.textItems
                                  .filter((text) => {
                                    return (
                                      text.currentSequenceId ===
                                      current_sequence_id
                                    );
                                  })
                                  .map((text) => text.id);

                                console.info("texts to update", ids_to_update);

                                let fontId =
                                  editor.fontManager.fontData[fontIndex].name;
                                for (let id of ids_to_update) {
                                  editor.update_text_color(
                                    id,
                                    background_color
                                  );
                                  await editor.update_text_fontFamily(
                                    fontId,
                                    id
                                  );
                                }

                                editorState.savedState.sequences.forEach(
                                  (s) => {
                                    if (s.id == current_sequence_id) {
                                      s.activeTextItems.forEach((t) => {
                                        // if t.id == selected_text_id.get().to_string() {
                                        t.color = background_color;
                                        t.fontFamily = fontId;
                                        // }
                                      });
                                    }
                                  }
                                );

                                for (let id of ids_to_update) {
                                  editor.update_text(
                                    id,
                                    "red_fill",
                                    InputValue.Number,
                                    text_color_wgpu[0]
                                  );
                                  editor.update_text(
                                    id,
                                    "green_fill",
                                    InputValue.Number,
                                    text_color_wgpu[1]
                                  );
                                  editor.update_text(
                                    id,
                                    "blue_fill",
                                    InputValue.Number,
                                    text_color_wgpu[2]
                                  );
                                }

                                editorState.savedState.sequences.forEach(
                                  (s) => {
                                    s.activeTextItems.forEach((p) => {
                                      p.backgroundFill = text_color;
                                    });
                                  }
                                );

                                console.info("Updating canvas background...");

                                let background_uuid = current_sequence_id;

                                editor.update_background(
                                  background_uuid,
                                  "red",
                                  InputValue.Number,
                                  background_color[0]
                                );
                                editor.update_background(
                                  background_uuid,
                                  "green",
                                  InputValue.Number,
                                  background_color[1]
                                );
                                editor.update_background(
                                  background_uuid,
                                  "blue",
                                  InputValue.Number,
                                  background_color[2]
                                );

                                editorState.savedState.sequences.forEach(
                                  (s) => {
                                    if (s.id == current_sequence_id) {
                                      if (!s.backgroundFill) {
                                        s.backgroundFill = {
                                          type: "Color",
                                          value: [
                                            wgpuToHuman(0.8),
                                            wgpuToHuman(0.8),
                                            wgpuToHuman(0.8),
                                            255,
                                          ],
                                        } as BackgroundFill;
                                      }

                                      switch (s.backgroundFill.type) {
                                        case "Color": {
                                          s.backgroundFill = {
                                            type: "Color",
                                            value: background_color,
                                          };

                                          break;
                                        }
                                        case "Gradient": {
                                          console.info(
                                            "Gradient support coming"
                                          );
                                          break;
                                        }
                                      }
                                    }
                                  }
                                );

                                saveSequencesData(
                                  editorState.savedState.sequences
                                );
                              }}
                            />
                          );
                        })}
                      </div>
                      <label className="text-sm">Background Color</label>
                      <div className="flex flex-row gap-2 mb-4">
                        <DebouncedInput
                          id="background_red"
                          label="Red"
                          placeholder="Red"
                          initialValue={background_red.toString()}
                          onDebounce={(value) => {
                            set_background_red(parseInt(value));
                          }}
                        />
                        <DebouncedInput
                          id="background_green"
                          label="Green"
                          placeholder="Green"
                          initialValue={background_green.toString()}
                          onDebounce={(value) => {
                            set_background_green(parseInt(value));
                          }}
                        />
                        <DebouncedInput
                          id="background_blue"
                          label="Blue"
                          placeholder="Blue"
                          initialValue={background_blue.toString()}
                          onDebounce={(value) => {
                            set_background_blue(parseInt(value));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                    <LayerPanel
                      layers={layers}
                      setLayers={set_layers}
                      onItemDeleted={on_item_deleted}
                      onItemDuplicated={on_item_duplicated}
                      onItemsUpdated={on_items_updated}
                    />
                  </div>
                </>
              )}
          </div>
        ) : (
          <></>
        )}
        <div className="flex flex-col justify-center items-center w-[calc(100vw-420px)] gap-2">
          <canvas
            id="scene-canvas"
            className="w-[900px] h-[550px] border border-black"
            width="900"
            height="550"
          />
          {current_sequence_id && (
            <PlaySequenceButton
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              selected_sequence_id={current_sequence_id}
            />
          )}
          {!current_sequence_id && (
            <PlayVideoButton
              editorRef={editorRef}
              editorStateRef={editorStateRef}
            />
          )}
          {!current_sequence_id &&
            !selected_polygon_id &&
            !selected_text_id &&
            !selected_image_id &&
            !selected_video_id && (
              <TimelineTrack
                type={TrackType.Video}
                pixelsPerSecond={25}
                tSequences={tSequences}
                sequenceDurations={sequenceDurations}
                sequenceQuickAccess={sequenceQuickAccess}
                onSequenceDragEnd={handleSequenceDragEnd}
              />
            )}
          {selected_polygon_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_polygon_id}
              objectType={ObjectType.Polygon}
              sequenceId={current_sequence_id}
              width={900}
              height={400}
              headerHeight={40}
              propertyWidth={40}
              rowHeight={50}
            />
          )}
          {selected_text_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_text_id}
              objectType={ObjectType.TextItem}
              sequenceId={current_sequence_id}
              width={900}
              height={400}
              headerHeight={40}
              propertyWidth={40}
              rowHeight={50}
            />
          )}
          {selected_image_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_image_id}
              objectType={ObjectType.ImageItem}
              sequenceId={current_sequence_id}
              width={900}
              height={400}
              headerHeight={40}
              propertyWidth={40}
              rowHeight={50}
            />
          )}
          {selected_video_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_video_id}
              objectType={ObjectType.VideoItem}
              sequenceId={current_sequence_id}
              width={900}
              height={400}
              headerHeight={40}
              propertyWidth={40}
              rowHeight={50}
            />
          )}
        </div>
      </div>
    </div>
  );
};
