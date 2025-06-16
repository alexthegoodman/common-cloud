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
  AnimationData,
  BackgroundFill,
  findObjectType,
  GradientStop,
  ObjectType,
  ProjectSettings,
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
import EditorState, { SaveTarget } from "@/engine/editor_state";
import LayerPanel, { Layer, LayerFromConfig } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import {
  ImageProperties,
  KeyframeProperties,
  PolygonProperties,
  TextProperties,
  VideoProperties,
} from "./Properties";
import { callMotionInference } from "@/fetchers/inference";
import KeyframeTimeline from "./KeyframeTimeline";
import { TimelineTrack } from "./SequenceTimeline";
import { WebCapture } from "@/engine/capture";
import { ToolGrid } from "./ToolGrid";
import { PageSequence } from "@/engine/data";
import { WindowSize } from "@/engine/camera";
import { ThemePicker } from "./ThemePicker";
import { ObjectTrack } from "./ObjectTimeline";
import toast from "react-hot-toast";
import { ArrowRight, Check, Hamburger, Stack, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export function update_keyframe(
  editor_state: EditorState,
  // mut current_animation_data: AnimationData,
  // mut current_keyframe: &mut UIKeyframe,
  current_keyframe: UIKeyframe,
  current_sequence: Sequence,
  selected_keyframes: string[] | null,
  set_selected_keyframes?: React.Dispatch<React.SetStateAction<string[] | null>>
  // animation_data: RwSignal<Option<AnimationData>>,
  // selected_sequence_data: RwSignal<Sequence>,
  // selected_sequence_id: string
  // sequence_selected: RwSignal<bool>,
) {
  if (!current_sequence.polygonMotionPaths) {
    return;
  }

  if (selected_keyframes && set_selected_keyframes) {
    let selected_keyframe = selected_keyframes[0];
    if (current_keyframe.id != selected_keyframe) {
      let new_keyframes = [];
      new_keyframes.push(current_keyframe.id);

      set_selected_keyframes(new_keyframes);
    }
  } else if (set_selected_keyframes) {
    let new_keyframes = [];
    new_keyframes.push(current_keyframe.id);

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

  saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);
}

export const VideoEditor: React.FC<any> = ({ projectId }) => {
  const { t } = useTranslation("common");

  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [settings, set_settings] = useState<ProjectSettings | undefined | null>(
    null
  );
  let [sequences, set_sequences] = useState<Sequence[]>([]);
  let [error, set_error] = useState<string | null>(null);
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

  let [refreshTimeline, setRefreshTimeline] = useState(Date.now());

  const editorRef = useRef<Editor | null>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const canvasPipelineRef = useRef<CanvasPipeline | null>(null);
  const webCaptureRef = useRef<WebCapture | null>(null);
  const [editorIsSet, setEditorIsSet] = useState(false);
  const [editorStateSet, setEditorStateSet] = useState(false);

  let setupCanvasMouseTracking = (canvas: HTMLCanvasElement) => {
    let editor = editorRef.current;

    if (!editor) {
      return;
    }

    function getCanvasCoordinates(
      canvas: HTMLCanvasElement,
      event: PointerEvent
    ) {
      const rect = canvas.getBoundingClientRect();

      // Get mouse position relative to the scaled canvas
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Convert to canvas internal coordinates
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: mouseX * scaleX,
        y: mouseY * scaleY,
      };
    }

    canvas.addEventListener("pointermove", (event: PointerEvent) => {
      const coords = getCanvasCoordinates(canvas, event);
      editor.handle_mouse_move(coords.x, coords.y);
    });

    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      const coords = getCanvasCoordinates(canvas, event);
      editor.handle_mouse_down(coords.x, coords.y);
    });

    canvas.addEventListener("pointerup", (event) => {
      console.info("handle mouse up");
      canvas.releasePointerCapture(event.pointerId);
      editor.handle_mouse_up();
    });

    canvas.addEventListener("pointercancel", (event) => {
      console.info("pointer cancelled - treating as mouse up");
      canvas.releasePointerCapture(event.pointerId);
      editor.handle_mouse_up();
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
            console.info("saving point", point);
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

    saveSequencesData(last_saved_state.sequences, SaveTarget.Videos);

    console.info("Position updated!");

    let current_sequence_data = last_saved_state.sequences.find(
      (s) => s.id === current_sequence_id
    );

    if (!current_sequence_data || !selected_keyframes) {
      return null;
    }

    return [current_sequence_data, selected_keyframes];
  };

  let on_handle_mouse_up = (
    keyframeId: string,
    objectId: string,
    point: Point
  ) => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return [null, null] as [Sequence | null, string[] | null];
    }

    let selected_sequence = editorState.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );

    // if (!selected_keyframes) {
    //   console.warn("Keyframe not found");
    //   return [null, null] as [Sequence | null, string[] | null];
    // }

    if (!selected_sequence || !current_sequence_id) {
      console.warn("Sequence not found");
      return [null, null] as [Sequence | null, string[] | null];
    }

    let is_polygon = selected_sequence?.activePolygons.find(
      (p) => p.id === objectId
    );
    let is_text = selected_sequence?.activeTextItems.find(
      (p) => p.id === objectId
    );
    let is_image = selected_sequence?.activeImageItems.find(
      (p) => p.id === objectId
    );
    let is_video = selected_sequence?.activeVideoItems.find(
      (p) => p.id === objectId
    );

    if (is_polygon) {
      select_polygon(objectId);
    }
    if (is_text) {
      select_text(objectId);
    }
    if (is_image) {
      select_image(objectId);
    }
    if (is_video) {
      select_video(objectId);
    }

    if (!selected_sequence?.polygonMotionPaths) {
      return;
    }

    const currentKf =
      selected_sequence?.polygonMotionPaths
        .find((p) => p.polygonId === objectId)
        ?.properties.flatMap((p) => p.keyframes)
        .find((k) => k.id === keyframeId) ?? null;

    if (!currentKf) {
      console.warn("Keyframe not found");
      return [null, null] as [Sequence | null, string[] | null];
    }

    if (currentKf.value.type === "Position") {
      currentKf.value.value[0] = point.x;
      currentKf.value.value[1] = point.y;
    } else if (currentKf.value.type === "Zoom") {
      currentKf.value.value.position[0] = point.x;
      currentKf.value.value.position[1] = point.y;
    }

    update_keyframe(
      editorState,
      currentKf,
      selected_sequence,
      selected_keyframes,
      set_selected_keyframes
      // current_sequence_id
    );

    return [selected_sequence, selected_keyframes] as [Sequence, string[]];
  };

  useDevEffectOnce(() => {
    if (editorIsSet) {
      return;
    }

    console.info("Starting Editor...");

    let viewport = new Viewport(900, 550);

    editorRef.current = new Editor(viewport);

    webCaptureRef.current = new WebCapture();

    setEditorIsSet(true);
  });

  useEffect(() => {
    console.info("remount");
  }, []);

  let fetch_data = async () => {
    try {
      if (!authToken || !editorRef.current) {
        toast.error(
          "You must have an auth token or matching device to access this project"
        );

        return;
      }

      set_loading(true);

      let response = await getSingleProject(authToken.token, projectId);

      localStorage.setItem(
        "stored-project",
        JSON.stringify({ project_id: projectId })
      );

      let fileData = response.project?.fileData;

      console.info("savedState", fileData);

      if (!fileData) {
        toast.error("No file data");

        return;
      }

      editorStateRef.current = new EditorState(fileData);

      let cloned_sequences = fileData?.sequences;
      let cloned_settings = fileData?.settings;

      if (!cloned_settings) {
        cloned_settings = {
          dimensions: {
            width: 900,
            height: 550,
          },
        };
      }

      if (!cloned_sequences) {
        return;
      }

      console.info("cloned_settings", cloned_settings);

      set_settings(cloned_settings);
      set_sequences(cloned_sequences);
      // set_timeline_state(response.project?.fileData.timeline_state);

      // drop(editor_state);

      editorRef.current.settings = cloned_settings;

      console.info("Initializing pipeline...");

      let pipeline = new CanvasPipeline();

      canvasPipelineRef.current = await pipeline.new(
        editorRef.current,
        true,
        "scene-canvas",
        // {
        //   width: 900,
        //   height: 550,
        // },
        cloned_settings.dimensions,
        true
      );

      let windowSize = editorRef.current.camera?.windowSize;

      if (!windowSize?.width || !windowSize?.height) {
        return;
      }

      canvasPipelineRef.current.recreateDepthView(
        windowSize?.width,
        windowSize?.height
      );

      console.info("Beginning rendering...");

      await canvasPipelineRef.current.beginRendering(editorRef.current);

      // console.info("Restoring objects...");

      for (let sequence of cloned_sequences) {
        editorRef.current.restore_sequence_objects(
          sequence,
          true
          // authToken.token,
        );
      }

      // set handlers
      const canvas = document.getElementById(
        "scene-canvas"
      ) as HTMLCanvasElement;
      setupCanvasMouseTracking(canvas);

      set_quick_access();

      set_loading(false);
      setEditorStateSet(true);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch project data");
      set_loading(false);
      set_error(error.message || "Unknown error");
      return;
    }
  };

  const [onboarding1Visible, setOnboard1Visible] = useLocalStorage<boolean>(
    "video-onboarding-1-visible",
    true
  );

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
      editorRef.current.onHandleMouseUp = on_handle_mouse_up;
    }
  }, [editorIsSet, current_sequence_id]);

  let on_create_sequence = async () => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      toast.error("Your editor or editor state failed to initialize");

      return;
    }

    if (!authToken) {
      toast.error("You must have an auth token");

      return;
    }

    set_loading(true);

    let new_sequences = sequences as Sequence[];

    let newId = uuidv4().toString();

    new_sequences.push({
      id: newId,
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
      new_sequences,
      SaveTarget.Videos
    );

    set_quick_access();

    on_open_sequence(newId);

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
      if (s.durationMs) {
        durations[s.id] = s.durationMs;
      }
    });

    setSequenceDurations(durations);

    let quickAccess = {} as Record<string, string>;
    editorState.savedState.sequences.forEach((s) => {
      if (s.name) {
        quickAccess[s.id] = s.name;
      }
    });

    setSequenceQuickAccess(quickAccess);

    if (editorState.savedState.timeline_state) {
      setTSequences(editorState.savedState.timeline_state.timeline_sequences);
    }
  };

  let on_open_sequence = (sequence_id: string) => {
    try {
      set_section("SequenceView");

      console.info("Open Sequence...");

      let editor = editorRef.current;
      let editor_state = editorStateRef.current;

      if (!editor || !editor_state) {
        toast.error("Your editor or editor state failed to initialize");
        return;
      }

      let saved_state = editor_state?.savedState;

      if (!saved_state) {
        toast.error("No saved state found");
        return;
      }

      let saved_sequence = saved_state.sequences.find(
        (s) => s.id == sequence_id
      );

      if (!saved_sequence) {
        toast.error("Sequence not found");
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

      if (!editor.camera) {
        toast.error("No camera found in editor");
        return;
      }

      let backgroundSize: WindowSize = {
        width: editor.camera?.windowSize.width - 50,
        height: editor.camera?.windowSize.height - 50,
      };

      // if (background_fill.type === "Color") {
      editor.replace_background(
        saved_sequence.id,
        // rgbToWgpu(
        //   background_fill.value[0],
        //   background_fill.value[1],
        //   background_fill.value[2],
        //   background_fill.value[3]
        // )
        background_fill,
        backgroundSize
      );
      // }

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
      new_layers.sort((a, b) => b.initial_layer_index - a.initial_layer_index);

      set_layers(new_layers);
      console.info("set current", sequence_id);
      set_current_sequence_id(sequence_id);

      toast.success(`Opened sequence ${saved_sequence.name}`);
    } catch (error: any) {
      console.error("Error opening sequence:", error);
      toast.error("Failed to open sequence");
      set_loading(false);
      set_error(error.message || "Unknown error");
      return;
    }

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

    saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

    set_loading(false);
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

  const handleObjectDragEnd = (
    animation: AnimationData,
    newStartTimeMs: number
  ) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    editor_state.savedState.sequences.forEach((s) => {
      if (s.id === current_sequence_id) {
        s.polygonMotionPaths?.forEach((pm) => {
          if (pm.id === animation.id) {
            pm.startTimeMs = newStartTimeMs;
          }
        });
      }
    });

    console.info("animation updated", animation, newStartTimeMs);

    saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);
  };

  let [background_red, set_background_red] = useState(0);
  let [background_green, set_background_green] = useState(0);
  let [background_blue, set_background_blue] = useState(0);

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

  // need hamburger menu for mobile to toggle sidebar
  let [showSidebar, setShowSidebar] = useState(false);
  let toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  return (
    <>
      {/* Alert explaining hub */}
      {onboarding1Visible && (
        <section className="max-w-[300px] bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6 w-full md:w-[600px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Welcome to Stunts!</h2>

            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setOnboard1Visible(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center">
            <Check className="mr-2" />
            <span className="text-sm">
              Are you ready to create beautiful videos? Simply open up the
              Actions sidebar, create a New Sequence, and then open it up to
              start adding content and generating animations.
            </span>
          </div>
        </section>
      )}

      <div className="mb-2">
        <button
          className="md:hidden text-xs rounded-md text-white stunts-gradient px-2 py-1 h-50 w-50 flex items-center justify-center top-4 left-18"
          onClick={toggleSidebar}
        >
          <Stack size={"20px"} /> {t("Actions")}
        </button>
      </div>

      <div className="flex flex-row w-full">
        <div
          className={`z-10 relative w-full md:w-[315px] ${
            showSidebar ? "block" : "hidden md:block"
          }`}
        >
          <div className="relative md:fixed top-4 left-[0px] md:left-[100px] w-full md:w-[315px]">
            {error ? (
              <div>
                <span>
                  {t("Error")}: {error}
                </span>
              </div>
            ) : (
              <></>
            )}
            {loading ? (
              <div>
                <span>{t("Loading")}...</span>
              </div>
            ) : (
              <></>
            )}
            {section === "SequenceList" ? (
              <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                <div className="flex flex-col w-full">
                  {editorStateSet && (
                    <ExportVideoButton
                      editorRef={editorRef}
                      editorStateRef={editorStateRef}
                    />
                  )}
                  <div className="flex flex-row justify-between align-center w-full mt-2">
                    <h5>{t("Sequences")}</h5>
                    {/* <button
                      className="text-xs rounded-md text-white stunts-gradient px-2 py-1 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={loading}
                      onClick={on_create_sequence}
                    >
                      New Sequence
                    </button> */}
                    <a
                      className="text-xs rounded-md text-white stunts-gradient px-2 py-1 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                      href="#"
                      // disabled={loading}
                      onClick={on_create_sequence}
                    >
                      {t("New Sequence")}
                    </a>
                  </div>
                  <div className="flex flex-col w-full mt-2">
                    {(sequences as Sequence[]).map((sequence: Sequence) => {
                      let showAddButton = false;
                      if (
                        sequence.activePolygons.length > 0 ||
                        sequence.activeImageItems.length > 0 ||
                        sequence.activeTextItems.length > 0 ||
                        sequence.activeVideoItems.length > 0
                      ) {
                        showAddButton = true;
                      }

                      return (
                        <div className="flex flex-row" key={sequence.id}>
                          <button
                            className="flex flex-row justify-start gap-1 text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                            disabled={loading}
                            onClick={() => on_open_sequence(sequence.id)}
                          >
                            <span>
                              {t("Open")} {sequence.name}
                            </span>
                            <ArrowRight />
                          </button>
                          {/* <button
                        className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                        disabled={loading}
                        onClick={() => {}}
                      >
                        Duplicate
                      </button> */}
                          {showAddButton && (
                            <button
                              className="text-xs w-[100px] text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                              disabled={loading}
                              onClick={async () => {
                                let editor_state = editorStateRef.current;

                                if (
                                  !editor_state ||
                                  !editor_state.savedState.timeline_state
                                ) {
                                  return;
                                }

                                let existing_timeline =
                                  editor_state.savedState.timeline_state
                                    .timeline_sequences;

                                // Find the sequence that ends at the latest point in time
                                let startTime = 0;
                                if (existing_timeline.length > 0) {
                                  let test = existing_timeline.map((seq) => {
                                    let duration_ms =
                                      sequenceDurations[seq.sequenceId];
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
                              {t("Add to Timeline")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
            {section === "SequenceView" && current_sequence_id ? (
              <div className="flex flex-col gap-4 w-full md:max-w-[315px]">
                {selected_keyframes && selected_keyframes?.length > 0 ? (
                  <>
                    <KeyframeProperties
                      key={"props" + selected_keyframes[0]}
                      editorRef={editorRef}
                      editorStateRef={editorStateRef}
                      currentSequenceId={current_sequence_id}
                      selectedKeyframe={selected_keyframes[0]}
                      setRefreshTimeline={setRefreshTimeline}
                      handleGoBack={() => {
                        set_selected_keyframes(null);
                      }}
                    />
                  </>
                ) : (
                  <>
                    {selected_polygon_id && (
                      <PolygonProperties
                        key={"props" + selected_polygon_id}
                        editorRef={editorRef}
                        editorStateRef={editorStateRef}
                        currentSequenceId={current_sequence_id}
                        currentPolygonId={selected_polygon_id}
                        handleGoBack={() => {
                          set_selected_polygon_id(null);
                        }}
                      />
                    )}

                    {selected_image_id && (
                      <>
                        <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                          <ImageProperties
                            key={"props" + selected_image_id}
                            editorRef={editorRef}
                            editorStateRef={editorStateRef}
                            currentSequenceId={current_sequence_id}
                            currentImageId={selected_image_id}
                            handleGoBack={() => {
                              set_selected_image_id(null);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {selected_text_id && (
                      <>
                        <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                          <TextProperties
                            key={"props" + selected_text_id}
                            editorRef={editorRef}
                            editorStateRef={editorStateRef}
                            currentSequenceId={current_sequence_id}
                            currentTextId={selected_text_id}
                            handleGoBack={() => {
                              set_selected_text_id(null);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {selected_video_id && (
                      <>
                        <div className="flex max-w-[315px] w-full max-h-[100vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                          <VideoProperties
                            key={"props" + selected_video_id}
                            editorRef={editorRef}
                            editorStateRef={editorStateRef}
                            currentSequenceId={current_sequence_id}
                            currentVideoId={selected_video_id}
                            handleGoBack={() => {
                              set_selected_video_id(null);
                            }}
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
                                  onClick={() => {
                                    let editor = editorRef.current;

                                    if (!editor) {
                                      return;
                                    }

                                    editor.clearCanvas();

                                    set_current_sequence_id(null);
                                    set_section("SequenceList");
                                  }}
                                >
                                  <CreateIcon icon="arrow-left" size="24px" />
                                </button>
                                <h5>Update Sequence</h5>
                              </div>
                              <div className="flex flex-row gap-2">
                                <label
                                  htmlFor="keyframe_count"
                                  className="text-xs"
                                >
                                  Choose keyframe count
                                </label>
                                <select
                                  id="keyframe_count"
                                  name="keyframe_count"
                                  className="text-xs"
                                  value={keyframe_count}
                                  onChange={(ev) =>
                                    set_keyframe_count(
                                      parseInt(ev.target.value)
                                    )
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
                                  onChange={(ev) =>
                                    set_is_curved(ev.target.checked)
                                  }
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
                                <label
                                  htmlFor="auto_choreograph"
                                  className="text-xs"
                                >
                                  Auto-Choreograph
                                </label>
                                <input
                                  type="checkbox"
                                  id="auto_fade"
                                  name="auto_fade"
                                  checked={auto_fade}
                                  onChange={(ev) =>
                                    set_auto_fade(ev.target.checked)
                                  }
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
                                {loading
                                  ? "Generating..."
                                  : "Generate Animation"}
                              </button>

                              <ToolGrid
                                editorRef={editorRef}
                                editorStateRef={editorStateRef}
                                webCaptureRef={webCaptureRef}
                                currentSequenceId={current_sequence_id}
                                set_sequences={set_sequences}
                                options={[
                                  "square",
                                  "text",
                                  "image",
                                  "video",
                                  "capture",
                                  "imageGeneration",
                                ]}
                                layers={layers}
                                setLayers={set_layers}
                              />

                              <ThemePicker
                                editorRef={editorRef}
                                editorStateRef={editorStateRef}
                                currentSequenceId={current_sequence_id}
                                saveTarget={SaveTarget.Videos}
                              />

                              <label className="text-sm">
                                Background Color
                              </label>
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
                              editorRef={editorRef}
                              editorStateRef={editorStateRef}
                              currentSequenceId={current_sequence_id}
                              layers={layers}
                              setLayers={set_layers}
                            />
                          </div>
                        </>
                      )}
                  </>
                )}
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-start items-center w-[calc(100vw-125px)] md:ml-0 md:w-[calc(100vw-420px)] gap-2">
          <div
            id="scene-canvas-wrapper"
            style={
              settings?.dimensions.width === 900
                ? { aspectRatio: 900 / 550 }
                : { aspectRatio: 550 / 900 }
            }
          >
            <canvas
              id="scene-canvas"
              className={`w-[${settings?.dimensions.width}px] h-[${settings?.dimensions.height}px] border border-black`}
              width={settings?.dimensions.width}
              height={settings?.dimensions.height}
            />
          </div>
          {current_sequence_id && (
            <PlaySequenceButton
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              selected_sequence_id={current_sequence_id}
            />
          )}
          {editorStateSet && !current_sequence_id && (
            <PlayVideoButton
              editorRef={editorRef}
              editorStateRef={editorStateRef}
            />
          )}
          <div
            className={`w-full md:w-[${settings?.dimensions.width}px] md:mx-auto overflow-x-scroll`}
          >
            {current_sequence_id &&
              !selected_polygon_id &&
              !selected_text_id &&
              !selected_image_id &&
              !selected_video_id && (
                <>
                  {sequences
                    .filter((s) => s.id === current_sequence_id)
                    .map((sequence) => {
                      if (sequence.polygonMotionPaths) {
                        return (
                          <div key={`trackSequence${sequence.id}`}>
                            {sequence.polygonMotionPaths.map((animation) => {
                              let objectName = null;
                              if (animation.objectType === ObjectType.Polygon) {
                                objectName = sequence.activePolygons.find(
                                  (pol) => pol.id === animation.polygonId
                                )?.name;
                              } else if (
                                animation.objectType === ObjectType.ImageItem
                              ) {
                                objectName = sequence.activeImageItems.find(
                                  (pol) => pol.id === animation.polygonId
                                )?.name;
                              } else if (
                                animation.objectType === ObjectType.TextItem
                              ) {
                                objectName = sequence.activeTextItems.find(
                                  (pol) => pol.id === animation.polygonId
                                )?.name;
                              } else if (
                                animation.objectType === ObjectType.VideoItem
                              ) {
                                objectName = sequence.activeVideoItems.find(
                                  (pol) => pol.id === animation.polygonId
                                )?.name;
                              }

                              return (
                                <ObjectTrack
                                  key={`objectTrack${animation.id}`}
                                  type={TrackType.Video}
                                  trackWidth={settings?.dimensions.width || 900}
                                  objectName={objectName}
                                  objectData={animation}
                                  pixelsPerSecond={15}
                                  onSequenceDragEnd={handleObjectDragEnd}
                                />
                              );
                            })}
                          </div>
                        );
                      }
                    })}
                </>
              )}
          </div>
          {!current_sequence_id &&
            !selected_polygon_id &&
            !selected_text_id &&
            !selected_image_id &&
            !selected_video_id && (
              <TimelineTrack
                type={TrackType.Video}
                trackWidth={settings?.dimensions.width || 900}
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
              width={settings?.dimensions.width || 900}
              height={400}
              headerHeight={40}
              propertyWidth={50}
              rowHeight={50}
              selectedKeyframes={selected_keyframes}
              setSelectedKeyframes={set_selected_keyframes}
              onKeyframeChanged={() => {}}
              refreshTimeline={refreshTimeline}
            />
          )}
          {selected_text_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_text_id}
              objectType={ObjectType.TextItem}
              sequenceId={current_sequence_id}
              width={settings?.dimensions.width || 900}
              height={400}
              headerHeight={40}
              propertyWidth={50}
              rowHeight={50}
              selectedKeyframes={selected_keyframes}
              setSelectedKeyframes={set_selected_keyframes}
              onKeyframeChanged={() => {}}
              refreshTimeline={refreshTimeline}
            />
          )}
          {selected_image_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_image_id}
              objectType={ObjectType.ImageItem}
              sequenceId={current_sequence_id}
              width={settings?.dimensions.width || 900}
              height={400}
              headerHeight={40}
              propertyWidth={50}
              rowHeight={50}
              selectedKeyframes={selected_keyframes}
              setSelectedKeyframes={set_selected_keyframes}
              onKeyframeChanged={() => {}}
              refreshTimeline={refreshTimeline}
            />
          )}
          {selected_video_id && current_sequence_id && (
            <KeyframeTimeline
              editorRef={editorRef}
              editorStateRef={editorStateRef}
              objectId={selected_video_id}
              objectType={ObjectType.VideoItem}
              sequenceId={current_sequence_id}
              width={settings?.dimensions.width || 900}
              height={400}
              headerHeight={40}
              propertyWidth={50}
              rowHeight={50}
              selectedKeyframes={selected_keyframes}
              setSelectedKeyframes={set_selected_keyframes}
              onKeyframeChanged={() => {}}
              refreshTimeline={refreshTimeline}
            />
          )}
        </div>
      </div>
    </>
  );
};
