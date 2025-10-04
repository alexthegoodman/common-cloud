import {
  AuthToken,
  getSingleProject,
  saveSequencesData,
  updateSequences,
} from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LayerPanel, { Layer, LayerFromConfig } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import { Editor, Point, rgbToWgpu, Viewport } from "@/engine/editor";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { OptionButton } from "./items";
import { ToolGrid } from "./ToolGrid";
import { WebCapture } from "@/engine/capture";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import { PageSequence } from "@/engine/data";
import {
  BackgroundFill,
  findObjectType,
  ObjectType,
  Sequence,
} from "@/engine/animations";
import { v4 as uuidv4 } from "uuid";
import { StVideoConfig } from "@/engine/video";
import { StImageConfig } from "@/engine/image";
import { TextRendererConfig } from "@/engine/text";
import { PolygonConfig } from "@/engine/polygon";
import { WindowSize } from "@/engine/camera";
import { PreviewManager } from "@/engine/preview";
import { ThemePicker } from "./ThemePicker";
import {
  ImageProperties,
  PolygonProperties,
  TextProperties,
} from "./Properties";
import { callLayoutInference } from "@/fetchers/inference";

let docCanvasSize: WindowSize = {
  width: 900,
  height: 1100,
};

let paperAspectRatio = 11 / 8.5; // standard US paper size
let width = 800;
let height = width * paperAspectRatio;
let paperSize: WindowSize = {
  width,
  height,
};

export const DocEditor: React.FC<any> = ({ projectId }) => {
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [loading, set_loading] = useState(false);
  let [generateLoading, setGenerateLoading] = useState(false);

  let [layers, set_layers] = useState<Layer[]>([]);

  let [selected_polygon_id, set_selected_polygon_id] = useState<string | null>(
    null
  );
  let [selected_image_id, set_selected_image_id] = useState<string | null>(
    null
  );
  let [selected_text_id, set_selected_text_id] = useState<string | null>(null);

  let [sequences, set_sequences] = useState<Sequence[]>([]);

  let [current_sequence_id, set_current_sequence_id] = useState<string | null>(
    null
  );

  let [mouseUpTime, setMosueUpTime] = useState<number | null>(null);

  let [previewCache, setPreviewCache] = useState<
    Map<string, { blobUrl: string; timestamp: number }>
  >(new Map());

  const editorRef = useRef<Editor | null>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const webCaptureRef = useRef<WebCapture | null>(null);
  const canvasPipelineRef = useRef<CanvasPipeline | null>(null);
  const previewManagerRef = useRef<PreviewManager | null>(null);
  const [editorIsSet, setEditorIsSet] = useState(false);

  let select_polygon = (polygon_id: string) => {
    set_selected_polygon_id(polygon_id);
    set_selected_text_id(null);
    set_selected_image_id(null);
    // set_selected_video_id(null);
  };

  let select_text = (text_id: string) => {
    set_selected_polygon_id(null);
    set_selected_text_id(text_id);
    set_selected_image_id(null);
    // set_selected_video_id(null);
  };

  let select_image = (image_id: string) => {
    set_selected_polygon_id(null);
    set_selected_text_id(null);
    set_selected_image_id(image_id);
    // set_selected_video_id(null);
  };

  // let select_video = (video_id: string) => {
  //   set_selected_polygon_id(null);
  //   set_selected_text_id(null);
  //   set_selected_image_id(null);
  //   set_selected_video_id(video_id);
  // };

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

  // let handle_video_click = (
  //   video_id: string
  //   // polygon_config: PolygonConfig
  // ) => {
  //   select_video(video_id);
  // };

  // async function updateDocumentPreview(
  //   previewManager: PreviewManager,
  //   sequenceId: string,
  //   documentTimestamp: number
  // ) {
  //   let editorState = editorStateRef.current;

  //   if (!previewManager.editor || !editorState) {
  //     return;
  //   }

  //   if (previewManager.isPreviewStale(sequenceId, documentTimestamp)) {
  //     let savedSequence = editorState.savedState.sequences.find(
  //       (s) => s.id === sequenceId
  //     );

  //     if (!savedSequence) {
  //       return;
  //     }

  //     previewManager.preparePreview(sequenceId, savedSequence);
  //     previewManager.pipeline?.renderFrame(previewManager.editor);
  //     const previewUrl = await previewManager.generatePreview(sequenceId);
  //   }
  // }

  // async function updateDocumentPreviews(
  //   previewManager: PreviewManager,
  //   sequenceIds: string[],
  //   documentTimestamp: number
  // ) {
  //   for (let id of sequenceIds) {
  //     await updateDocumentPreview(previewManager, id, documentTimestamp);
  //   }

  //   setPreviewCache(previewManager.previewCache);
  // }

  let handle_mouse_up = (
    object_id: string,
    point: Point
  ): [Sequence, string[]] | null => {
    let previewManager = previewManagerRef.current;
    let previewGpuResources = previewManager?.editor?.gpuResources;
    let last_saved_state = editorStateRef.current?.savedState;

    if (!last_saved_state || !previewManager || !previewGpuResources) {
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

                previewManager.editor?.polygons.find((p) => {
                  if (p.id === object_id) {
                    p.transform.updatePosition(
                      [point.x, point.y],
                      docCanvasSize
                    );
                    p.transform.updateUniformBuffer(
                      previewGpuResources.queue!,
                      docCanvasSize
                    );
                  }
                });
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

                previewManager.editor?.textItems.find((p) => {
                  if (p.id === object_id) {
                    p.transform.updatePosition(
                      [point.x, point.y],
                      docCanvasSize
                    );
                    p.transform.updateUniformBuffer(
                      previewGpuResources.queue!,
                      docCanvasSize
                    );
                  }
                });
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

                previewManager.editor?.imageItems.find((p) => {
                  if (p.id === object_id) {
                    p.transform.updatePosition(
                      [point.x, point.y],
                      docCanvasSize
                    );
                    p.transform.updateUniformBuffer(
                      previewGpuResources.queue!,
                      docCanvasSize
                    );
                  }
                });
              }
            });
            break;
          }
          // case ObjectType.VideoItem: {
          //   console.info("saving point", point);
          //   s.activeVideoItems.forEach((si) => {
          //     if (si.id == object_id) {
          //       si.position = {
          //         x: point.x,
          //         y: point.y,
          //       };
          //     }
          //   });
          //   break;
          // }
        }
      }
    });

    // last_saved_state.sequences = updatedSequences;

    saveSequencesData(last_saved_state.sequences, SaveTarget.Docs);

    console.info("Position updated!");

    let current_sequence_data = last_saved_state.sequences.find(
      (s) => s.id === current_sequence_id
    );

    if (!current_sequence_id || !current_sequence_data) {
      return null;
    }

    // updateDocumentPreview(previewManager, current_sequence_id, Date.now());

    // setPreviewCache(previewManager.previewCache);

    setMosueUpTime(Date.now());

    return [current_sequence_data, []];
  };

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

    let new_sequences = sequences as Sequence[];

    new_sequences.push({
      id: uuidv4().toString(),
      name: "New Page",
      backgroundFill: { type: "Color", value: [0.8, 0.8, 0.8, 1] },
      activePolygons: [],
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
      SaveTarget.Docs
    );

    if (!previewManagerRef.current) {
      return;
    }

    let sequence_ids = editorStateRef.current?.savedState.sequences.map(
      (s) => s.id
    );

    if (!sequence_ids) {
      return;
    }

    console.info("sequence ids", sequence_ids);

    // await updateDocumentPreviews(
    //   previewManagerRef.current,
    //   sequence_ids,
    //   Date.now()
    // );

    set_loading(false);
  };

  let on_open_sequence = (sequence_id: string) => {
    // set_section("SequenceView");

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
      value: [0.8, 0.8, 0.8, 1],
    } as BackgroundFill;

    if (saved_sequence?.backgroundFill) {
      background_fill = saved_sequence.backgroundFill;
    }

    // for the background polygon and its signal
    editor_state.selected_polygon_id = saved_sequence.id;

    console.info("Opening Sequence...");

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
    });

    editor.replace_background(saved_sequence.id, background_fill, paperSize);

    console.info("Objects restored!", saved_sequence.id);

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

    // sort layers by layer_index property, lower values should come first in the list
    // but reverse the order because the UI outputs the first one first, thus it displays last
    new_layers.sort((a, b) => b.initial_layer_index - a.initial_layer_index);

    set_layers(new_layers);

    console.info("set current", sequence_id, new_layers);

    set_current_sequence_id(sequence_id);

    if (!previewManagerRef.current) {
      return;
    }

    let sequence_ids = editorStateRef.current?.savedState.sequences.map(
      (s) => s.id
    );

    if (!sequence_ids) {
      return;
    }

    console.info("sequence ids", sequence_ids);

    // updateDocumentPreviews(previewManagerRef.current, sequence_ids, Date.now());
  };

  useDevEffectOnce(async () => {
    if (editorIsSet) {
      return;
    }

    console.info("Starting Editor...");

    let viewport = new Viewport(docCanvasSize.width, docCanvasSize.height);

    editorRef.current = new Editor(viewport);
    editorRef.current.target = SaveTarget.Docs;

    setEditorIsSet(true);
  });

  useEffect(() => {
    console.info("remount");
  }, []);

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

      editor.handle_mouse_move(positionX, positionY);
    });

    canvas.addEventListener("mousedown", (event) => {
      // Get the canvas's bounding rectangle
      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to the canvas
      const positionX = event.clientX - rect.left;
      const positionY = event.clientY - rect.top;

      editor.handle_mouse_down(positionX, positionY);
    });

    canvas.addEventListener("mouseup", () => {
      editor.handle_mouse_up();
    });

    canvas.addEventListener("mouseleave", () => {
      // Handle mouse leaving canvas if needed
    });

    window.addEventListener("keydown", (e: KeyboardEvent) => {});

    // TODO: cleanup event listeners
  };

  let fetch_data = async () => {
    if (!authToken || !editorRef.current) {
      return;
    }

    set_loading(true);

    let response = await getSingleProject(authToken.token, projectId);

    let docData = response.project?.docData;

    console.info("savedState", docData);

    if (!docData) {
      docData = {
        sequences: [], // represents pages for docs
        timeline_state: null,
      };
    }

    editorStateRef.current = new EditorState(docData);
    editorStateRef.current.supportsMotionPaths = false;
    editorStateRef.current.saveTarget = SaveTarget.Docs;

    if (docData.sequences.length === 0) {
      await on_create_sequence();
    }

    // let cloned_sequences = docData?.sequences;
    let cloned_sequences = editorStateRef.current.savedState.sequences;

    if (!cloned_sequences) {
      return;
    }

    previewManagerRef.current = new PreviewManager();

    let docCanvasSize: WindowSize = {
      width: 900,
      height: 1100,
    };

    await previewManagerRef.current.initialize(
      docCanvasSize,
      paperSize,
      cloned_sequences,
      SaveTarget.Docs
    );

    set_sequences(cloned_sequences);

    console.info("Initializing pipeline...");

    let pipeline = new CanvasPipeline();

    canvasPipelineRef.current = await pipeline.new(
      editorRef.current,
      true,
      "book-canvas",
      {
        width: docCanvasSize.width,
        height: docCanvasSize.height,
      },
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

    for (let [sequenceIndex, sequence] of cloned_sequences.entries()) {
      await editorRef.current.restore_sequence_objects(
        sequence,
        sequenceIndex === 0 ? false : true
        // authToken.token,
      );
    }

    if (cloned_sequences.length > 0) {
      let first_page = cloned_sequences[0];
      on_open_sequence(first_page.id);
    }

    // set handlers
    const canvas = document.getElementById("book-canvas") as HTMLCanvasElement;
    setupCanvasMouseTracking(canvas);

    set_loading(false);
  };

  // let on_generate_layout = async () => {
  //   let editor = editorRef.current;
  //   let editor_state = editorStateRef.current;

  //   if (!editor || !editor_state || !current_sequence_id) {
  //     return;
  //   }

  //   set_loading(true);

  //   console.info("create prompt");

  //   let prompt = editor.createLayoutInferencePrompt();
  //   let predictions = await callLayoutInference(prompt);

  //   console.info("predictions", predictions);

  //   let sequences = editor.updateLayoutFromPredictions(
  //     predictions,
  //     current_sequence_id,
  //     editor_state.savedState.sequences
  //   );

  //   saveSequencesData(sequences, SaveTarget.Docs);

  //   set_loading(false);
  // };

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
      // editorRef.current.handleVideoClick = handle_video_click;
      editorRef.current.onMouseUp = handle_mouse_up;
      // editorRef.current.onHandleMouseUp = on_handle_mouse_up;
    }
  }, [editorIsSet, current_sequence_id]);

  return (
    <div className="flex flex-row w-full">
      {current_sequence_id && (
        <div className="flex flex-col gap-4 w-[315px]">
          {selected_polygon_id && (
            <PolygonProperties
              key={"props" + selected_polygon_id + mouseUpTime}
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
          {!selected_polygon_id && !selected_image_id && !selected_text_id && (
            <>
              <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                <div className="flex flex-col w-full gap-4 mb-4">
                  <div className="flex flex-row items-center">
                    <h5>Update Document</h5>
                  </div>
                  {/* <div className="flex flex-row gap-2">
                <input
                  type="checkbox"
                  id="auto_choreograph"
                  name="auto_choreograph"
                  // checked={auto_choreograph}
                  // onChange={(ev) => set_auto_choreograph(ev.target.checked)}
                />
                <label htmlFor="auto_choreograph" className="text-xs">
                  Auto-Arrange
                </label>
              </div> */}
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white stunts-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={generateLoading}
                    onClick={() => {
                      // on_generate_layout();
                    }}
                  >
                    {generateLoading ? "Generating..." : "Generate Layout"}
                  </button>

                  <ToolGrid
                    editorRef={editorRef}
                    editorStateRef={editorStateRef}
                    webCaptureRef={webCaptureRef}
                    currentSequenceId={current_sequence_id}
                    set_sequences={set_sequences}
                    options={[
                      "page",
                      "square",
                      "text",
                      "image",
                      "imageGeneration",
                    ]}
                    on_create_sequence={on_create_sequence}
                    layers={layers}
                    setLayers={set_layers}
                    update={() => {}}
                  />

                  <ThemePicker
                    editorRef={editorRef}
                    editorStateRef={editorStateRef}
                    currentSequenceId={current_sequence_id}
                    saveTarget={SaveTarget.Docs}
                  />

                  {/* <label className="text-sm">Background Color</label>
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
                    /> */}
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
        </div>
      )}
      <div className="flex flex-col justify-center items-center w-[calc(100vw-420px)] gap-2">
        <canvas
          id="book-canvas"
          className={`w-[${docCanvasSize.width}px] h-[${docCanvasSize.height}px] border border-black`}
          width={docCanvasSize.width}
          height={docCanvasSize.height}
        />
        {/* {Array.from(previewCache).length > 0 && (
          <div className="fixed bottom-0 bg-white rounded p-4">
            {Array.from(previewCache).map((cacheItem, i) => {
              // const cacheItem = previewCache.get(sequenceId);

              return (
                <div key={cacheItem[0] + "preview"}>
                  <img src={cacheItem[1].blobUrl} width={200} />
                  <p>Page {i + 1}</p>
                </div>
              );
            })}
          </div>
        )} */}
        <div className="fixed bottom-[0px] h-[75px] w-[900px] overflow-x-scroll overflow-y-hidden bg-white rounded-t-lg shadow-xl p-2">
          {/* <div className="flex items-center justify-between mb-2">
              <h3 className="font-xs text-gray-700">Your Pages</h3>
            </div> */}

          {/* <div className="w-max">
            {Array.from(previewCache).map((cacheItem, i) => (
              <div
                key={cacheItem[0] + "preview"}
                className="inline-block w-[200px] group relative transition-all duration-300 transform translate-y-0 hover:translate-y-[-70px]"
                onClick={() => {
                  on_open_sequence(cacheItem[0]);
                }}
              >
                <div className="bg-white rounded-lg p-2 shadow-md transition-all duration-300 group-hover:shadow-lg">
                  <img
                    src={cacheItem[1].blobUrl}
                    alt={`Preview page ${i + 1}`}
                    className="block absolute rounded"
                    width={200}
                  />
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    Page {i + 1}
                  </p>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
};
