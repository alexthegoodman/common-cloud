"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DebouncedInput,
  ExportVideoButton,
  NavButton,
  OptionButton,
  PlaySequenceButton,
  PlayVideoButton,
} from "../stunts-app/items";
import { CreateIcon } from "../stunts-app/icon";
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
import LayerPanel, { Layer, LayerFromConfig } from "../stunts-app/layers";
import { CanvasPipeline } from "@/engine/pipeline";
import {
  ImageProperties,
  KeyframeProperties,
  PolygonProperties,
  TextProperties,
  VideoProperties,
} from "../stunts-app/Properties";
import { callMotionInference } from "@/fetchers/inference";
import KeyframeTimeline from "../stunts-app/KeyframeTimeline";
import { TimelineTrack } from "../stunts-app/SequenceTimeline";
import { WebCapture } from "@/engine/capture";
import { ToolGrid } from "../stunts-app/ToolGrid";
import { PageSequence } from "@/engine/data";
import { WindowSize } from "@/engine/camera";
import { ThemePicker } from "../stunts-app/ThemePicker";
import { ObjectTrack } from "../stunts-app/ObjectTimeline";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Check,
  Hamburger,
  Palette,
  Stack,
  Toolbox,
  WaveSawtooth,
  X,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { FlowArrow } from "@phosphor-icons/react/dist/ssr";
import useSWR from "swr";
import { getCurrentUser } from "@/hooks/useCurrentUser";

export const VideoPlayer: React.FC<any> = ({ projectId }) => {
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
  let [layers, set_layers] = useState<Layer[]>([]);
  let [dragger_id, set_dragger_id] = useState(null);
  let [current_sequence_id, set_current_sequence_id] = useState<string | null>(
    null
  );

  let [toolbarTab, setToolbarTab] = useState("none");

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

  useEffect(() => {
    if (editorIsSet) {
      console.info("Fetch data...");

      fetch_data();
    }
  }, [editorIsSet]);

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

      {/* <div className="mb-2">
        {editorStateSet && (
          <ExportVideoButton
            editorRef={editorRef}
            editorStateRef={editorStateRef}
          />
        )}
      </div> */}

      <div className="flex flex-row w-full">
        <div className="flex flex-col justify-start items-center w-[calc(100vw-125px)] md:ml-0 md:w-[calc(100vw-420px)] gap-2">
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
        </div>
      </div>
    </>
  );
};
