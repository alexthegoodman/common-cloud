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
  AnimationProperty,
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
  KeyframeValue,
  EasingType,
  PathType,
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
import {
  ArrowRight,
  Check,
  Hamburger,
  MagicWand,
  Palette,
  Stack,
  Toolbox,
  WaveSawtooth,
  ArrowDown,
  X,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { FlowArrow } from "@phosphor-icons/react/dist/ssr";
import useSWR from "swr";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { TextAnimationManager, VIRAL_PRESETS } from "@/engine/textAnimations";
import TextAnimationPanel from "./TextAnimationPanel";
import { Disclosure } from "@headlessui/react";

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

  const { data: user } = useSWR("currentUser", () =>
    getCurrentUser(authToken?.token ? authToken?.token : "")
  );

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

  // AI Animation Generation states
  let [aiAnimationPrompt, setAiAnimationPrompt] = useState("");
  let [aiAnimationDuration, setAiAnimationDuration] = useState(3000);
  let [aiAnimationStyle, setAiAnimationStyle] = useState("smooth");
  let [aiLoading, setAiLoading] = useState(false);
  let [layers, set_layers] = useState<Layer[]>([]);
  let [dragger_id, set_dragger_id] = useState(null);
  let [current_sequence_id, set_current_sequence_id] = useState<string | null>(
    null
  );

  let [toolbarTab, setToolbarTab] = useState("none");

  // Choreographed template state
  let [confettiCenterX, setConfettiCenterX] = useState(400);
  let [confettiCenterY, setConfettiCenterY] = useState(300);
  let [confettiForce, setConfettiForce] = useState(200);
  let [confettiGravity, setConfettiGravity] = useState(300);

  let [flockStartX, setFlockStartX] = useState(200);
  let [flockStartY, setFlockStartY] = useState(200);
  let [flockTargetX, setFlockTargetX] = useState(600);
  let [flockTargetY, setFlockTargetY] = useState(400);
  let [flockSpacing, setFlockSpacing] = useState(80);

  let [rippleAmplitude, setRippleAmplitude] = useState(100);
  let [rippleSpeed, setRippleSpeed] = useState(2);

  let [orbitCenterX, setOrbitCenterX] = useState(400);
  let [orbitCenterY, setOrbitCenterY] = useState(300);
  let [orbitRadius, setOrbitRadius] = useState(100);

  let [dominoDelay, setDominoDelay] = useState(100);

  let [swarmScatterX, setSwarmScatterX] = useState(200);
  let [swarmScatterY, setSwarmScatterY] = useState(200);
  let [swarmTargetX, setSwarmTargetX] = useState(600);
  let [swarmTargetY, setSwarmTargetY] = useState(400);
  let [swarmScatterRadius, setSwarmScatterRadius] = useState(200);
  let [swarmFormRadius, setSwarmFormRadius] = useState(50);

  // Collage-style template state
  let [mosaicCenterX, setMosaicCenterX] = useState(450);
  let [mosaicCenterY, setMosaicCenterY] = useState(275);
  let [mosaicSpacing, setMosaicSpacing] = useState(120);
  let [mosaicStagger, setMosaicStagger] = useState(100);

  let [scatterDropHeight, setScatterDropHeight] = useState(-200);
  let [scatterBounce, setScatterBounce] = useState(0.3);
  let [scatterRotation, setScatterRotation] = useState(15);

  // Text Animation state
  let [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  let [animationManager] = useState(() => new TextAnimationManager());

  let [galleryX, setGalleryX] = useState(100);
  let [galleryY, setGalleryY] = useState(100);
  let [galleryWidth, setGalleryWidth] = useState(700);
  let [galleryHeight, setGalleryHeight] = useState(350);
  let [galleryDelay, setGalleryDelay] = useState(200);
  let [galleryScale, setGalleryScale] = useState(true);

  let [carouselY, setCarouselY] = useState(300);
  let [carouselSpacing, setCarouselSpacing] = useState(150);
  let [carouselCurve, setCarouselCurve] = useState(50);

  let [polaroidRotation, setPolaroidRotation] = useState(45);
  let [polaroidSettle, setPolaroidSettle] = useState(0.7);

  // New Screen-Filling Animation parameters
  let [slideshowDuration, setSlideshowDuration] = useState(2000);
  let [slideshowTransition, setSlideshowTransition] = useState(500);

  let [gridCols, setGridCols] = useState(3);
  let [gridRows, setGridRows] = useState(2);
  let [gridMargin, setGridMargin] = useState(20);
  let [gridStagger, setGridStagger] = useState(150);

  let [carouselEnterDelay, setCarouselEnterDelay] = useState(200);
  let [carouselSlideSpeed, setCarouselSlideSpeed] = useState(800);

  let [showcaseScale, setShowcaseScale] = useState(0.9);
  let [showcaseStagger, setShowcaseStagger] = useState(300);

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
    // Also set for text animations
    setSelectedTextId(text_id);
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
    let editor = editorRef.current;

    if (!editor) {
      console.warn("Editor not initialized");
      return null;
    }

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
        // let hasAssociatedPath = s.polygonMotionPaths?.some(
        //   (motionPath) => motionPath.polygonId === object_id
        // );

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

        // Update motion path positions when objects are moved
        if (s.polygonMotionPaths) {
          s.polygonMotionPaths.forEach((motionPath) => {
            if (motionPath.polygonId === object_id) {
              let livePath = editor.motionPaths.find(
                (mp) => mp.associatedPolygonId === object_id
              );

              let pathPosition = livePath?.transform.position;

              if (pathPosition) {
                // Update the motion path position
                motionPath.position = [
                  pathPosition[0] || 0,
                  pathPosition[1] || 0,
                ];
              }
            }
          });
        }
      }
    });

    // last_saved_state.sequences = updatedSequences;

    saveSequencesData(last_saved_state.sequences, SaveTarget.Videos);

    console.info("Position updated!");

    editor?.updateMotionPaths(last_saved_state.sequences[0]);

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
        await editorRef.current.restore_sequence_objects(
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

      let firstSequenceId = cloned_sequences[0].id;

      on_open_sequence(firstSequenceId);

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

    let current_positions = editor.getCurrentPositions();

    let animation = editor.createMotionPathsFromPredictions(
      predictions,
      current_positions,
      editor
    );

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

  // Helper methods for raw AnimationData manipulation (similar to MCP server)
  let findOrCreateAnimationData = (
    savedState: SavedState,
    sequenceId: string,
    objectId: string
  ): AnimationData => {
    let sequence = savedState.sequences.find((s) => s.id === sequenceId);
    if (!sequence) {
      throw new Error(`Sequence with ID ${sequenceId} not found`);
    }

    if (!sequence.polygonMotionPaths) {
      sequence.polygonMotionPaths = [];
    }

    let animationData = sequence.polygonMotionPaths.find(
      (path) => path.polygonId === objectId
    );

    if (!animationData) {
      let objectType = findObjectType(savedState, objectId);
      if (!objectType) {
        throw new Error(`Object with ID ${objectId} not found in sequence`);
      }

      animationData = {
        id: uuidv4(),
        objectType: objectType,
        polygonId: objectId,
        duration: 5000,
        startTimeMs: 0,
        properties: [],
        position: [0, 0],
      };
      sequence.polygonMotionPaths.push(animationData);
    }

    return animationData;
  };

  let findOrCreateAnimationProperty = (
    animationData: AnimationData,
    propertyName: string
  ): AnimationProperty => {
    let property = animationData.properties.find(
      (p) => p.name === propertyName
    );

    if (!property) {
      property = {
        name: propertyName,
        propertyPath: propertyName,
        children: [],
        keyframes: [],
        depth: 0,
      };
      animationData.properties.push(property);
    }

    return property;
  };

  let createKeyframeValue = (
    propertyName: string,
    value: any
  ): KeyframeValue => {
    let lowerProperty = propertyName.toLowerCase();

    if (lowerProperty === "position") {
      if (Array.isArray(value) && value.length === 2) {
        return { type: "Position", value: [value[0], value[1]] };
      }
      throw new Error("Position property requires [x, y] array");
    }

    if (lowerProperty === "rotation") {
      if (typeof value === "number") {
        return { type: "Rotation", value: value };
      }
      throw new Error("Rotation property requires a number value");
    }

    if (lowerProperty === "scalex") {
      if (typeof value === "number") {
        return { type: "ScaleX", value: value };
      }
      throw new Error("ScaleX property requires a number value");
    }

    if (lowerProperty === "scaley") {
      if (typeof value === "number") {
        return { type: "ScaleY", value: value };
      }
      throw new Error("ScaleY property requires a number value");
    }

    if (lowerProperty === "opacity") {
      if (typeof value === "number") {
        return { type: "Opacity", value: value };
      }
      throw new Error("Opacity property requires a number value");
    }

    throw new Error(`Unsupported property: ${propertyName}`);
  };

  let onGenerateAIAnimation = async () => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!aiAnimationPrompt.trim()) {
      toast.error("Please describe the animation you want to create");
      return;
    }

    if (!current_sequence_id) {
      return;
    }

    setAiLoading(true);

    try {
      // Get all visible objects in the current sequence
      let objectIds: string[] = [];

      // Add text objects
      if (editor.textItems) {
        objectIds.push(
          ...editor.textItems
            .filter((item) => !item.hidden)
            .map((item) => item.id)
        );
      }

      // Add polygon objects
      if (editor.polygons) {
        objectIds.push(
          ...editor.polygons
            .filter((item) => !item.hidden)
            .map((item) => item.id)
        );
      }

      // Add image objects
      if (editor.imageItems) {
        objectIds.push(
          ...editor.imageItems
            .filter((item) => !item.hidden)
            .map((item) => item.id)
        );
      }

      if (objectIds.length === 0) {
        toast.error(
          "No objects available for animation. Please add some text, shapes, or images first."
        );
        setAiLoading(false);
        return;
      }

      // Get canvas size
      let canvasSize = editor.camera
        ? {
            width: editor.camera.windowSize.width,
            height: editor.camera.windowSize.height,
          }
        : { width: 550, height: 900 };

      // Call the AI API
      let response = await fetch("/api/projects/generate-animation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken?.token}`,
        },
        body: JSON.stringify({
          prompt: aiAnimationPrompt,
          duration: aiAnimationDuration,
          style: aiAnimationStyle,
          objectIds: objectIds,
          canvasSize: canvasSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate animation: ${response.statusText}`);
      }

      let result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response from AI animation generator");
      }

      // Apply the generated animation to the editor
      let animationData = result.data;

      // Apply keyframes for each animated object using raw AnimationData structure
      for (let animation of animationData.animations) {
        // Find or create AnimationData for this object
        let animationDataItem = findOrCreateAnimationData(
          editor_state.savedState,
          current_sequence_id,
          animation.objectId
        );

        for (let property of animation.properties) {
          // Find or create AnimationProperty for this property
          let animationProperty = findOrCreateAnimationProperty(
            animationDataItem,
            property.propertyName
          );

          // reset this property's keyframes before adding new ones
          animationProperty.keyframes = [];

          // Sort keyframes by time to ensure proper order
          let sortedKeyframes = property.keyframes.sort(
            (a: any, b: any) => a.time - b.time
          );

          // Add keyframes to the property
          for (let kf of sortedKeyframes) {
            let keyframeValue = createKeyframeValue(
              property.propertyName,
              kf.value
            );

            let keyframe: UIKeyframe = {
              id: uuidv4(),
              time: kf.time,
              value: keyframeValue,
              easing: (kf.easing || "Linear") as EasingType,
              pathType: "Linear" as PathType,
              curveData: null,
              keyType: { type: "Frame" },
            };

            animationProperty.keyframes.push(keyframe);
          }

          // Sort keyframes by time
          animationProperty.keyframes.sort((a, b) => a.time - b.time);
        }
      }

      // Update the sequence duration if needed
      if (animationData.duration > 0) {
        editor_state.savedState.sequences.forEach((s) => {
          if (s.id === current_sequence_id) {
            s.durationMs = Math.max(
              s.durationMs || 5000,
              animationData.duration
            );
          }
        });
      }

      // Save the updated sequences
      saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

      // update motion paths
      editor.updateMotionPaths(editor_state.savedState.sequences[0]);

      // Refresh the timeline to show the new keyframes
      setRefreshTimeline(Date.now());

      toast.success("AI animation generated successfully!");

      // Clear the prompt for next use
      setAiAnimationPrompt("");
    } catch (error: any) {
      console.error("AI animation generation error:", error);
      toast.error(error.message || "Failed to generate AI animation");
    } finally {
      setAiLoading(false);
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

  // Text Animation handlers
  const handleTextAnimationSelect = (templateId: string) => {
    if (!selectedTextId) {
      toast.error("Please select a text element first");
      return;
    }

    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) return;

    // Find the text renderer
    const textRenderer = editor.textItems.find((t) => t.id === selectedTextId);
    if (!textRenderer) {
      toast.error("Text element not found");
      return;
    }

    // Apply the animation template
    const success = textRenderer.setTextAnimationFromTemplate(templateId);

    if (success) {
      // Save animation data to editor state using the new method
      editorState.updateTextAnimation(
        selectedTextId,
        textRenderer.getTextAnimationConfig()
      );
      toast.success("Text animation applied!");
    } else {
      toast.error("Failed to apply text animation");
    }
  };

  // Template application functions
  const applyTemplate = (
    templateName: string,
    templateFunction: any,
    ...args: any[]
  ) => {
    let editor_state = editorStateRef.current;
    if (!editor_state || !current_sequence_id) return;

    let sequence = editor_state.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );
    if (!sequence) return;

    // Get all objects in the current sequence
    let allObjects = [
      ...(sequence.activePolygons || []),
      ...(sequence.activeTextItems || []),
      ...(sequence.activeImageItems || []),
      ...(sequence.activeVideoItems || []),
    ];

    if (allObjects.length === 0) {
      alert("No objects found in current sequence to animate");
      return;
    }

    let objectIds = allObjects.map((obj) => obj.id);
    let objectTypes: ObjectType[] = allObjects.map((obj) => {
      if (sequence.activePolygons?.find((p) => p.id === obj.id))
        return ObjectType.Polygon;
      if (sequence.activeTextItems?.find((t) => t.id === obj.id))
        return ObjectType.TextItem;
      if (sequence.activeImageItems?.find((i) => i.id === obj.id))
        return ObjectType.ImageItem;
      if (sequence.activeVideoItems?.find((v) => v.id === obj.id))
        return ObjectType.VideoItem;
      return ObjectType.Polygon;
    });

    // Get current animation data or create default
    let currentAnimationData = allObjects.map((obj) => {
      let existingAnimation = sequence.polygonMotionPaths?.find(
        (mp) => mp.polygonId === obj.id
      );
      return (
        existingAnimation || {
          id: obj.id,
          polygonId: obj.id,
          duration: 3000,
          properties: [],
        }
      );
    });

    let objectPositions = allObjects.map((obj) => [
      obj.position?.x || 0,
      obj.position?.y || 0,
    ]);

    try {
      // Call the template function with appropriate parameters
      let newAnimationData;
      if (templateName === "confetti") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          [confettiCenterX, confettiCenterY],
          confettiForce,
          confettiGravity
        );
      } else if (templateName === "flock") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          [flockStartX, flockStartY],
          [flockTargetX, flockTargetY],
          flockSpacing
        );
      } else if (templateName === "ripple") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          objectPositions,
          rippleAmplitude,
          rippleSpeed
        );
      } else if (templateName === "orbit") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          [orbitCenterX, orbitCenterY],
          orbitRadius
        );
      } else if (templateName === "domino") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          objectPositions,
          dominoDelay
        );
      } else if (templateName === "swarm") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          [swarmScatterX, swarmScatterY],
          [swarmTargetX, swarmTargetY],
          swarmScatterRadius,
          swarmFormRadius
        );
      } else if (templateName === "mosaic") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // [mosaicCenterX, mosaicCenterY]
          args[1], // mosaicSpacing
          args[2] // mosaicStagger
        );
      } else if (templateName === "scatter") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // scatterDropHeight
          args[1], // scatterBounce
          args[2] // scatterRotation
        );
      } else if (templateName === "gallery") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // [galleryX, galleryY, galleryWidth, galleryHeight]
          args[1], // galleryDelay
          args[2] // galleryScale
        );
      } else if (templateName === "carousel") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // carouselY
          args[1], // carouselSpacing
          args[2] // carouselCurve
        );
      } else if (templateName === "polaroid") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // null (tumble_positions)
          args[1], // polaroidRotation
          args[2] // polaroidSettle
        );
      } else if (templateName === "slideshow") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // slideshowDuration
          args[1] // slideshowTransition
        );
      } else if (templateName === "grid") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // cols
          args[1], // rows
          args[2], // marger
          args[3] // stagger
        );
      } else if (templateName === "carousel-screen") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // enterDelay
          args[1] // slideSpeed
        );
      } else if (templateName === "showcase") {
        newAnimationData = templateFunction(
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // showcaseScale
          args[1] //stagger
        );
      }

      if (newAnimationData) {
        // Update the sequence with new animation data
        sequence.polygonMotionPaths = newAnimationData;

        // Save the updated sequences
        saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

        // Update the editor if available
        let editor = editorRef.current;
        if (editor) {
          editor.updateMotionPaths(sequence);
        }
      }
    } catch (error) {
      console.error("Error applying template:", error);
      // alert("Error applying animation template");
      toast.error(`Error applying animation template`);
    }
  };

  // Reset animations function
  const resetAnimations = () => {
    let editor_state = editorStateRef.current;
    if (!editor_state || !current_sequence_id) return;

    let sequence = editor_state.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );
    if (!sequence) return;

    // Get all objects in the current sequence
    let allObjects = [
      ...(sequence.activePolygons || []),
      ...(sequence.activeTextItems || []),
      ...(sequence.activeImageItems || []),
      ...(sequence.activeVideoItems || []),
    ];

    if (allObjects.length === 0) {
      alert("No objects found in current sequence to reset");
      return;
    }

    try {
      // Create default animations for all objects
      let resetAnimationData = allObjects.map((obj) => {
        let objectType = ObjectType.Polygon;
        if (sequence.activeTextItems?.find((t) => t.id === obj.id))
          objectType = ObjectType.TextItem;
        else if (sequence.activeImageItems?.find((i) => i.id === obj.id))
          objectType = ObjectType.ImageItem;
        else if (sequence.activeVideoItems?.find((v) => v.id === obj.id))
          objectType = ObjectType.VideoItem;

        return editor_state.save_default_keyframes(
          obj.id,
          objectType,
          obj.position || { x: 400, y: 300 },
          20000 // 3 second duration
        );
      });

      // Update the sequence with reset animation data
      sequence.polygonMotionPaths = resetAnimationData;

      // Save the updated sequences
      saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

      // Update the editor if available
      let editor = editorRef.current;
      if (editor) {
        editor.updateMotionPaths(sequence);
      }

      toast.success("Animations reset to default");
    } catch (error) {
      console.error("Error resetting animations:", error);
      toast.error("Error resetting animations");
    }
  };

  return (
    <>
      {/* Alert explaining hub */}
      {/* {onboarding1Visible && (
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
      )} */}

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

      <div className="mb-2">
        {editorStateSet && (
          <ExportVideoButton
            editorRef={editorRef}
            editorStateRef={editorStateRef}
          />
        )}
      </div>

      <div className="flex flex-row w-full">
        <div className="flex flex-col justify-start items-center w-[calc(100vw-90px)] md:ml-0 md:w-[calc(100vw-420px)] gap-2">
          <div
            id="scene-canvas-wrapper"
            style={
              settings?.dimensions.width === 900
                ? { aspectRatio: 900 / 550, maxWidth: "900px" }
                : { aspectRatio: 550 / 900, maxWidth: "550px" }
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
            className={`w-full md:w-[${
              (settings?.dimensions.width || 0) + 100
            }px] md:mx-auto overflow-x-scroll`}
          >
            <div className="flex flex-row gap-2 mb-2">
              {/* <button
          className="md:hidden text-xs rounded-md text-white stunts-gradient px-2 py-1 h-50 w-50 flex items-center justify-center top-4 left-18"
          onClick={toggleSidebar}
        >
          <Stack size={"20px"} /> {t("Actions")}
        </button> */}
              <button
                className="min-w-[45px] h-[45px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
                onClick={() => {
                  if (toolbarTab === "tools") {
                    setToolbarTab("none");
                  } else {
                    setToolbarTab("tools");
                  }
                }}
              >
                <Toolbox />
                <span className="text-xs">Tools</span>
              </button>
              <button
                className="min-w-[45px] h-[45px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
                onClick={() => {
                  if (toolbarTab === "animations") {
                    setToolbarTab("none");
                  } else {
                    setToolbarTab("animations");
                  }
                }}
              >
                <WaveSawtooth />
                <span className="text-xs">Animations</span>
              </button>
              <button
                className="min-w-[45px] h-[45px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
                onClick={() => {
                  if (toolbarTab === "themes") {
                    setToolbarTab("none");
                  } else {
                    setToolbarTab("themes");
                  }
                }}
              >
                <Palette />
                <span className="text-xs">Themes</span>
              </button>
              <button
                className="min-w-[45px] h-[45px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
                onClick={() => {
                  if (toolbarTab === "layers") {
                    setToolbarTab("none");
                  } else {
                    setToolbarTab("layers");
                  }
                }}
              >
                <Stack />
                <span className="text-xs">Layers</span>
              </button>
              <button
                className="min-w-[45px] h-[45px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
                onClick={() => {
                  if (toolbarTab === "sequences") {
                    setToolbarTab("none");
                  } else {
                    setToolbarTab("sequences");
                  }
                }}
              >
                <FlowArrow />
                <span className="text-xs">Sequences</span>
              </button>
            </div>
          </div>
          {toolbarTab === "tools" && (
            <div>
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
                  "stickers",
                ]}
                layers={layers}
                setLayers={set_layers}
              />
            </div>
          )}

          {toolbarTab === "animations" && (
            <div className="max-h-[35vh] overflow-scroll">
              {/* Reset Animations Button */}
              <div className="mb-4">
                <button
                  type="button"
                  className="w-full py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  onClick={resetAnimations}
                >
                  Reset All Animations
                </button>
              </div>

              {/* Animation Settings Accordion */}
              <Disclosure as="div">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span>🪄 Generate Animation</span>
                      <ArrowDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                      <div className="space-y-3">
                        {/* <div className="flex flex-row gap-2">
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
                        </button> */}

                        {/* AI-Powered Animation Generation */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <MagicWand size={16} className="text-purple-600" />
                            <h4 className="text-sm font-medium text-purple-900">
                              AI Animation Generator
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Describe your animation:
                              </label>
                              <textarea
                                className="w-full text-xs border rounded px-2 py-1 h-16 resize-none"
                                placeholder="e.g., Make the text bounce excitedly, then fade out slowly..."
                                value={aiAnimationPrompt}
                                onChange={(e) =>
                                  setAiAnimationPrompt(e.target.value)
                                }
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">
                                  Duration
                                </label>
                                <select
                                  className="text-xs border rounded px-2 py-1 w-full"
                                  value={aiAnimationDuration}
                                  onChange={(e) =>
                                    setAiAnimationDuration(
                                      Number(e.target.value)
                                    )
                                  }
                                >
                                  <option value={1000}>1 second</option>
                                  <option value={2000}>2 seconds</option>
                                  <option value={3000}>3 seconds</option>
                                  <option value={5000}>5 seconds</option>
                                  <option value={8000}>8 seconds</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 block mb-1">
                                  Style
                                </label>
                                <select
                                  className="text-xs border rounded px-2 py-1 w-full"
                                  value={aiAnimationStyle}
                                  onChange={(e) =>
                                    setAiAnimationStyle(e.target.value)
                                  }
                                >
                                  <option value="smooth">Smooth</option>
                                  <option value="bouncy">Bouncy</option>
                                  <option value="quick">Quick</option>
                                  <option value="dramatic">Dramatic</option>
                                  <option value="subtle">Subtle</option>
                                </select>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={aiLoading || !aiAnimationPrompt.trim()}
                              onClick={onGenerateAIAnimation}
                            >
                              {aiLoading ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Generating...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <MagicWand size={16} />
                                  Generate AI Animation
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Text Animations Accordion */}
              <Disclosure as="div" className="mt-4">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span className="flex items-center gap-2">
                        🔥 Text Animations
                      </span>
                      <ArrowDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      {/* Text Selection */}
                      <div className="mb-4 space-y-2">
                        <label className="text-xs text-gray-600">
                          Select Text Element:
                        </label>
                        <select
                          className="text-xs border rounded px-2 py-1 w-full"
                          value={selectedTextId || ""}
                          onChange={(e) =>
                            setSelectedTextId(e.target.value || null)
                          }
                        >
                          <option value="">Choose text element...</option>
                          {editorRef.current?.textItems
                            .filter((t) => !t.hidden)
                            .map((text) => (
                              <option key={text.id} value={text.id}>
                                {text.name} - "{text.text.slice(0, 20)}..."
                              </option>
                            ))}
                        </select>
                      </div>

                      {selectedTextId && (
                        <div className="space-y-3">
                          {/* Quick Viral Presets */}
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block">
                              🔥 Viral Presets:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.TIKTOK_HOOK
                                  )
                                }
                                className="text-xs py-2 px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                🎯 TikTok Hook
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.INSTAGRAM_POP
                                  )
                                }
                                className="text-xs py-2 px-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                              >
                                💥 Instagram Pop
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.YOUTUBE_WAVE
                                  )
                                }
                                className="text-xs py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                🌊 YouTube Wave
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.ATTENTION_GRABBER
                                  )
                                }
                                className="text-xs py-2 px-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                              >
                                ⚡ Bounce
                              </button>
                            </div>
                          </div>

                          {/* Stylish Effects */}
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block">
                              ✨ Stylish Effects:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.NEON_STYLE
                                  )
                                }
                                className="text-xs py-2 px-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                              >
                                ✨ Neon Glow
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.MATRIX_EFFECT
                                  )
                                }
                                className="text-xs py-2 px-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                              >
                                🎯 Matrix Glitch
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.RAINBOW_FLOW
                                  )
                                }
                                className="text-xs py-2 px-3 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                              >
                                🌈 Rainbow Flow
                              </button>
                              <button
                                onClick={() =>
                                  handleTextAnimationSelect(
                                    VIRAL_PRESETS.ELASTIC_BOUNCE
                                  )
                                }
                                className="text-xs py-2 px-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                              >
                                🎪 Elastic
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 text-center">
                            Perfect for TikTok, Instagram Reels & YouTube
                            Shorts!
                          </div>
                        </div>
                      )}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Choreographed Animation Templates Accordion */}
              <Disclosure as="div" className="mt-4">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span>🎭 Choreographed Templates</span>
                      <ArrowDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      <div className="space-y-3">
                        {/* Confetti Explosion */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">
                            Confetti Explosion
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Center X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={confettiCenterX}
                                onChange={(e) =>
                                  setConfettiCenterX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Center Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={confettiCenterY}
                                onChange={(e) =>
                                  setConfettiCenterY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Force:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={confettiForce}
                                onChange={(e) =>
                                  setConfettiForce(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Gravity:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={confettiGravity}
                                onChange={(e) =>
                                  setConfettiGravity(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() =>
                              applyTemplate(
                                "confetti",
                                editorStateRef.current?.save_confetti_explosion_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Confetti
                          </button>
                        </div>

                        {/* Flock Formation */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">
                            Flock Formation
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Start X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={flockStartX}
                                onChange={(e) =>
                                  setFlockStartX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Start Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={flockStartY}
                                onChange={(e) =>
                                  setFlockStartY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Target X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={flockTargetX}
                                onChange={(e) =>
                                  setFlockTargetX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Target Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={flockTargetY}
                                onChange={(e) =>
                                  setFlockTargetY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">
                                Spacing:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={flockSpacing}
                                onChange={(e) =>
                                  setFlockSpacing(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() =>
                              applyTemplate(
                                "flock",
                                editorStateRef.current?.save_flock_formation_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Flock
                          </button>
                        </div>

                        {/* Ripple Wave */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">Ripple Wave</h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Amplitude:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={rippleAmplitude}
                                onChange={(e) =>
                                  setRippleAmplitude(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Speed:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={rippleSpeed}
                                onChange={(e) =>
                                  setRippleSpeed(Number(e.target.value))
                                }
                                step="0.1"
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                            onClick={() =>
                              applyTemplate(
                                "ripple",
                                editorStateRef.current?.save_ripple_wave_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Ripple
                          </button>
                        </div>

                        {/* Orbit Dance */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">Orbit Dance</h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Center X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={orbitCenterX}
                                onChange={(e) =>
                                  setOrbitCenterX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Center Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={orbitCenterY}
                                onChange={(e) =>
                                  setOrbitCenterY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">
                                Radius:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={orbitRadius}
                                onChange={(e) =>
                                  setOrbitRadius(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                            onClick={() =>
                              applyTemplate(
                                "orbit",
                                editorStateRef.current?.save_orbit_dance_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Orbit
                          </button>
                        </div>

                        {/* Domino Cascade */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">
                            Domino Cascade
                          </h5>
                          <div>
                            <label className="text-xs text-gray-600">
                              Delay (ms):
                            </label>
                            <input
                              type="number"
                              className="text-xs border rounded px-2 py-1 w-full"
                              value={dominoDelay}
                              onChange={(e) =>
                                setDominoDelay(Number(e.target.value))
                              }
                            />
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() =>
                              applyTemplate(
                                "domino",
                                editorStateRef.current?.save_domino_cascade_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Domino
                          </button>
                        </div>

                        {/* Swarm Convergence */}
                        <div className="border rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium">
                            Swarm Convergence
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Scatter X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmScatterX}
                                onChange={(e) =>
                                  setSwarmScatterX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Scatter Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmScatterY}
                                onChange={(e) =>
                                  setSwarmScatterY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Target X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmTargetX}
                                onChange={(e) =>
                                  setSwarmTargetX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Target Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmTargetY}
                                onChange={(e) =>
                                  setSwarmTargetY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Scatter R:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmScatterRadius}
                                onChange={(e) =>
                                  setSwarmScatterRadius(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Form R:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={swarmFormRadius}
                                onChange={(e) =>
                                  setSwarmFormRadius(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-teal-500 text-white rounded hover:bg-teal-600"
                            onClick={() =>
                              applyTemplate(
                                "swarm",
                                editorStateRef.current?.save_swarm_convergence_keyframes.bind(
                                  editorStateRef.current
                                )
                              )
                            }
                          >
                            Apply Swarm
                          </button>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Collage-Style Animation Templates Accordion */}
              <Disclosure as="div" className="mt-4 mb-4">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span>📸 Collage Templates</span>
                      <ArrowDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      <div className="space-y-3">
                        {/* Photo Mosaic Assembly */}
                        <div className="border border-blue-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-blue-800">
                            Photo Mosaic Assembly
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Center X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={mosaicCenterX}
                                onChange={(e) =>
                                  setMosaicCenterX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Center Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={mosaicCenterY}
                                onChange={(e) =>
                                  setMosaicCenterY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Spacing:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={mosaicSpacing}
                                onChange={(e) =>
                                  setMosaicSpacing(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Stagger (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={mosaicStagger}
                                onChange={(e) =>
                                  setMosaicStagger(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() =>
                              applyTemplate(
                                "mosaic",
                                editorStateRef.current?.save_photo_mosaic_keyframes.bind(
                                  editorStateRef.current
                                ),
                                [mosaicCenterX, mosaicCenterY],
                                mosaicSpacing,
                                mosaicStagger
                              )
                            }
                          >
                            Apply Photo Mosaic
                          </button>
                        </div>

                        {/* Scrapbook Scatter */}
                        <div className="border border-blue-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-blue-800">
                            Scrapbook Scatter
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Drop Height:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={scatterDropHeight}
                                onChange={(e) =>
                                  setScatterDropHeight(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Bounce:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={scatterBounce}
                                onChange={(e) =>
                                  setScatterBounce(Number(e.target.value))
                                }
                                step="0.1"
                                min="0"
                                max="1"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">
                                Rotation Range:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={scatterRotation}
                                onChange={(e) =>
                                  setScatterRotation(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-pink-500 text-white rounded hover:bg-pink-600"
                            onClick={() =>
                              applyTemplate(
                                "scatter",
                                editorStateRef.current?.save_scrapbook_scatter_keyframes.bind(
                                  editorStateRef.current
                                ),
                                scatterDropHeight,
                                scatterBounce,
                                scatterRotation
                              )
                            }
                          >
                            Apply Scrapbook Scatter
                          </button>
                        </div>

                        {/* Gallery Wall Build */}
                        <div className="border border-blue-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-blue-800">
                            Gallery Wall Build
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Wall X:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={galleryX}
                                onChange={(e) =>
                                  setGalleryX(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Wall Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={galleryY}
                                onChange={(e) =>
                                  setGalleryY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Width:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={galleryWidth}
                                onChange={(e) =>
                                  setGalleryWidth(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Height:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={galleryHeight}
                                onChange={(e) =>
                                  setGalleryHeight(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Delay (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={galleryDelay}
                                onChange={(e) =>
                                  setGalleryDelay(Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="gallery_scale"
                                checked={galleryScale}
                                onChange={(e) =>
                                  setGalleryScale(e.target.checked)
                                }
                                className="mr-2"
                              />
                              <label
                                htmlFor="gallery_scale"
                                className="text-xs text-gray-600"
                              >
                                Scale Effect
                              </label>
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            onClick={() =>
                              applyTemplate(
                                "gallery",
                                editorStateRef.current?.save_gallery_wall_keyframes.bind(
                                  editorStateRef.current
                                ),
                                [
                                  galleryX,
                                  galleryY,
                                  galleryWidth,
                                  galleryHeight,
                                ],
                                galleryDelay,
                                galleryScale
                              )
                            }
                          >
                            Apply Gallery Wall
                          </button>
                        </div>

                        {/* Memory Carousel */}
                        <div className="border border-blue-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-blue-800">
                            Memory Carousel
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Carousel Y:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={carouselY}
                                onChange={(e) =>
                                  setCarouselY(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Spacing:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={carouselSpacing}
                                onChange={(e) =>
                                  setCarouselSpacing(Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">
                                Curve Intensity:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={carouselCurve}
                                onChange={(e) =>
                                  setCarouselCurve(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600"
                            onClick={() =>
                              applyTemplate(
                                "carousel",
                                editorStateRef.current?.save_memory_carousel_keyframes.bind(
                                  editorStateRef.current
                                ),
                                carouselY,
                                carouselSpacing,
                                carouselCurve
                              )
                            }
                          >
                            Apply Memory Carousel
                          </button>
                        </div>

                        {/* Polaroid Tumble */}
                        <div className="border border-blue-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-blue-800">
                            Polaroid Tumble
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Rotation Range:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={polaroidRotation}
                                onChange={(e) =>
                                  setPolaroidRotation(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Settle Time:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={polaroidSettle}
                                onChange={(e) =>
                                  setPolaroidSettle(Number(e.target.value))
                                }
                                step="0.1"
                                min="0.1"
                                max="1"
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                            onClick={() =>
                              applyTemplate(
                                "polaroid",
                                editorStateRef.current?.save_polaroid_tumble_keyframes.bind(
                                  editorStateRef.current
                                ),
                                null,
                                polaroidRotation,
                                polaroidSettle
                              )
                            }
                          >
                            Apply Polaroid Tumble
                          </button>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Screen-Filling Animation Templates Accordion */}
              <Disclosure as="div" className="mt-4 mb-4">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-green-100 rounded-lg hover:bg-green-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                      <span>🖼️ Screen-Filling Templates</span>
                      <ArrowDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2">
                      <div className="space-y-3">
                        {/* Full-Screen Slideshow */}
                        <div className="border border-green-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-green-800">
                            Full-Screen Slideshow
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Duration (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={slideshowDuration}
                                onChange={(e) =>
                                  setSlideshowDuration(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Transition (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={slideshowTransition}
                                onChange={(e) =>
                                  setSlideshowTransition(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() =>
                              applyTemplate(
                                "slideshow",
                                editorStateRef.current?.save_fullscreen_slideshow_keyframes.bind(
                                  editorStateRef.current
                                ),
                                null,
                                slideshowDuration,
                                slideshowTransition
                              )
                            }
                          >
                            Apply Full-Screen Slideshow
                          </button>
                        </div>

                        {/* Adaptive Grid Layout */}
                        <div className="border border-green-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-green-800">
                            Adaptive Grid Layout
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Columns:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={gridCols}
                                onChange={(e) =>
                                  setGridCols(Number(e.target.value))
                                }
                                min="1"
                                max="5"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Rows:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={gridRows}
                                onChange={(e) =>
                                  setGridRows(Number(e.target.value))
                                }
                                min="1"
                                max="4"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Margin:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={gridMargin}
                                onChange={(e) =>
                                  setGridMargin(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Stagger (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={gridStagger}
                                onChange={(e) =>
                                  setGridStagger(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() =>
                              applyTemplate(
                                "grid",
                                editorStateRef.current?.save_adaptive_grid_keyframes.bind(
                                  editorStateRef.current
                                ),
                                null,
                                gridCols,
                                gridRows,
                                gridMargin,
                                gridStagger
                              )
                            }
                          >
                            Apply Adaptive Grid
                          </button>
                        </div>

                        {/* Screen-Filling Carousel */}
                        <div className="border border-green-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-green-800">
                            Screen-Filling Carousel
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Enter Delay (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={carouselEnterDelay}
                                onChange={(e) =>
                                  setCarouselEnterDelay(Number(e.target.value))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Slide Speed (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={carouselSlideSpeed}
                                onChange={(e) =>
                                  setCarouselSlideSpeed(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() =>
                              applyTemplate(
                                "carousel-screen",
                                editorStateRef.current?.save_screen_carousel_keyframes.bind(
                                  editorStateRef.current
                                ),
                                null,
                                carouselEnterDelay,
                                carouselSlideSpeed
                              )
                            }
                          >
                            Apply Screen-Filling Carousel
                          </button>
                        </div>

                        {/* Maximize & Showcase */}
                        <div className="border border-green-200 rounded p-3 space-y-2">
                          <h5 className="text-xs font-medium text-green-800">
                            Maximize & Showcase
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Scale Factor:
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={showcaseScale}
                                onChange={(e) =>
                                  setShowcaseScale(Number(e.target.value))
                                }
                                step="0.1"
                                min="0.1"
                                max="2"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Stagger (ms):
                              </label>
                              <input
                                type="number"
                                className="text-xs border rounded px-2 py-1 w-full"
                                value={showcaseStagger}
                                onChange={(e) =>
                                  setShowcaseStagger(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <button
                            className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() =>
                              applyTemplate(
                                "showcase",
                                editorStateRef.current?.save_maximize_showcase_keyframes.bind(
                                  editorStateRef.current
                                ),
                                null,
                                showcaseScale,
                                showcaseStagger
                              )
                            }
                          >
                            Apply Maximize & Showcase
                          </button>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            </div>
          )}

          {toolbarTab === "themes" && current_sequence_id && (
            <div className="max-h-[35vh] overflow-scroll">
              <ThemePicker
                editorRef={editorRef}
                editorStateRef={editorStateRef}
                currentSequenceId={current_sequence_id}
                saveTarget={SaveTarget.Videos}
                userLanguage={user?.userLanguage || "en"}
              />

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
          )}

          {toolbarTab === "layers" && current_sequence_id && (
            <div>
              <LayerPanel
                editorRef={editorRef}
                editorStateRef={editorStateRef}
                currentSequenceId={current_sequence_id}
                layers={layers}
                setLayers={set_layers}
              />
            </div>
          )}

          {toolbarTab === "sequences" && (
            <div>
              <div className="flex flex-col w-full">
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
                        {/* {showAddButton && (
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
                          )} */}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {current_sequence_id ? (
            <div className="flex flex-col gap-4 w-full max-h-[300px] overflow-scroll md:max-w-[315px]">
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

                  {/* {!selected_polygon_id &&
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
                              

                              

                              
                              
                            </div>
                          </div>
                          <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                            
                          </div>
                        </>
                      )} */}
                </>
              )}
            </div>
          ) : (
            <></>
          )}

          <div
            className={`w-full md:w-[${
              (settings?.dimensions.width || 0) + 100
            }px] md:mx-auto overflow-x-scroll`}
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
          {/* {!current_sequence_id &&
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
            )} */}
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
              onKeyframeAdded={(
                propertyPath,
                time,
                prevKeyframe,
                nextKeyframe
              ) => {
                if (!editorStateRef.current) {
                  return;
                }

                editorStateRef.current.addKeyframe(
                  selected_polygon_id,
                  current_sequence_id,
                  propertyPath,
                  time,
                  prevKeyframe,
                  nextKeyframe
                );
              }}
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
              onKeyframeAdded={(
                propertyPath,
                time,
                prevKeyframe,
                nextKeyframe
              ) => {
                if (!editorStateRef.current) {
                  return;
                }

                editorStateRef.current.addKeyframe(
                  selected_text_id,
                  current_sequence_id,
                  propertyPath,
                  time,
                  prevKeyframe,
                  nextKeyframe
                );
              }}
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
              onKeyframeAdded={(
                propertyPath,
                time,
                prevKeyframe,
                nextKeyframe
              ) => {
                if (!editorStateRef.current) {
                  return;
                }

                editorStateRef.current.addKeyframe(
                  selected_image_id,
                  current_sequence_id,
                  propertyPath,
                  time,
                  prevKeyframe,
                  nextKeyframe
                );
              }}
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
              onKeyframeAdded={(
                propertyPath,
                time,
                prevKeyframe,
                nextKeyframe
              ) => {
                if (!editorStateRef.current) {
                  return;
                }

                editorStateRef.current.addKeyframe(
                  selected_video_id,
                  current_sequence_id,
                  propertyPath,
                  time,
                  prevKeyframe,
                  nextKeyframe
                );
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};
