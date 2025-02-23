import {
  AuthToken,
  getSingleProject,
  updateSequences,
} from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LayerPanel, { Layer, LayerFromConfig } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import { Editor, rgbToWgpu, Viewport } from "@/engine/editor";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { OptionButton } from "./items";
import { ToolGrid } from "./ToolGrid";
import { WebCapture } from "@/engine/capture";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import { PageSequence } from "@/engine/data";
import { BackgroundFill, Sequence } from "@/engine/animations";
import { v4 as uuidv4 } from "uuid";
import { StVideoConfig } from "@/engine/video";
import { StImageConfig } from "@/engine/image";
import { TextRendererConfig } from "@/engine/text";
import { PolygonConfig } from "@/engine/polygon";
import { WindowSize } from "@/engine/camera";

let docCanasSize: WindowSize = {
  width: 900,
  height: 1100,
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

  let [sequences, set_sequences] = useState<PageSequence[]>([]);

  let [current_sequence_id, set_current_sequence_id] = useState<string | null>(
    null
  );

  const editorRef = useRef<Editor | null>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const webCaptureRef = useRef<WebCapture | null>(null);
  const canvasPipelineRef = useRef<CanvasPipeline | null>(null);
  const [editorIsSet, setEditorIsSet] = useState(false);

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

    let paperAspectRatio = 11 / 8.5; // standard US paper size
    let width = 800;
    let height = width * paperAspectRatio;
    let paperSize: WindowSize = {
      width,
      height,
    };

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
    new_layers.sort((a, b) => a.initial_layer_index);

    set_layers(new_layers);

    console.info("set current", sequence_id);

    set_current_sequence_id(sequence_id);
  };

  useDevEffectOnce(async () => {
    if (editorIsSet) {
      return;
    }

    console.info("Starting Editor...");

    let viewport = new Viewport(docCanasSize.width, docCanasSize.height);

    editorRef.current = new Editor(viewport);

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

    canvas.addEventListener("mousedown", () => {
      editor.handle_mouse_down();
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

    set_sequences(cloned_sequences);

    console.info("Initializing pipeline...");

    let pipeline = new CanvasPipeline();

    canvasPipelineRef.current = await pipeline.new(
      editorRef.current,
      true,
      "doc-canvas",
      {
        width: docCanasSize.width,
        height: docCanasSize.height,
      }
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

    canvasPipelineRef.current.beginRendering(editorRef.current);

    // console.info("Restoring objects...");

    if (cloned_sequences.length > 0) {
      let first_page = cloned_sequences[0];
      on_open_sequence(first_page.id);
    }

    for (let [sequenceIndex, sequence] of cloned_sequences.entries()) {
      editorRef.current.restore_sequence_objects(
        sequence,
        sequenceIndex === 0 ? false : true
        // authToken.token,
      );
    }

    // set handlers
    const canvas = document.getElementById("doc-canvas") as HTMLCanvasElement;
    setupCanvasMouseTracking(canvas);

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
      // editorRef.current.handlePolygonClick = handle_polygon_click;
      // editorRef.current.handleTextClick = handle_text_click;
      // editorRef.current.handleImageClick = handle_image_click;
      // editorRef.current.handleVideoClick = handle_video_click;
      // editorRef.current.onMouseUp = handle_mouse_up;
      // editorRef.current.onHandleMouseUp = on_handle_mouse_up;
    }
  }, [editorIsSet]);

  const on_item_deleted = () => {};
  const on_item_duplicated = () => {};
  const on_items_updated = () => {};

  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-col gap-4 w-full max-w-[315px]">
        <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
          <div className="flex flex-col w-full gap-4 mb-4">
            <div className="flex flex-row items-center">
              <h5>Update Document</h5>
            </div>
            <div className="flex flex-row gap-2">
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
            </div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white stunts-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={generateLoading}
              onClick={() => {
                // on_generate_animation();
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
              options={["page", "square", "text", "image"]}
            />

            {/* <div className="flex flex-row flex-wrap gap-2">
              {themes.map((theme: number[], i) => {
                const backgroundColorRow = Math.floor(theme[0]);
                const backgroundColorColumn = Math.floor((theme[0] % 1) * 10);
                const backgroundColor =
                  colors[backgroundColorRow][backgroundColorColumn];
                const textColorRow = Math.floor(theme[4]);
                const textColorColumn = Math.floor((theme[4] % 1) * 10);
                const textColor = colors[textColorRow][textColorColumn];

                const backgroundRgb = hexParse(backgroundColor);
                const textRgb = hexParse(textColor);

                const fontIndex = theme[2];

                return (
                  <OptionButton
                    key={`${backgroundColor}-${textColor}-${i}`}
                    // style={`color: ${textColor}; background-color: ${backgroundColor};`}
                    style={{
                      color: textColor,
                      backgroundColor: backgroundColor,
                    }}
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
                          return text.currentSequenceId === current_sequence_id;
                        })
                        .map((text) => text.id);

                      console.info("texts to update", ids_to_update);

                      let fontId = editor.fontManager.fontData[fontIndex].name;
                      for (let id of ids_to_update) {
                        editor.update_text_color(id, background_color);
                        await editor.update_text_fontFamily(fontId, id);
                      }

                      editorState.savedState.sequences.forEach((s) => {
                        if (s.id == current_sequence_id) {
                          s.activeTextItems.forEach((t) => {
                            // if t.id == selected_text_id.get().to_string() {
                            t.color = background_color;
                            t.fontFamily = fontId;
                            // }
                          });
                        }
                      });

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

                      editorState.savedState.sequences.forEach((s) => {
                        s.activeTextItems.forEach((p) => {
                          p.backgroundFill = {
                            type: "Color",
                            value: text_color_wgpu,
                          };
                        });
                      });

                      console.info("Updating canvas background...");

                      let background_uuid = current_sequence_id;

                      let stops: GradientStop[] = [
                        {
                          offset: 0,
                          color: text_color_wgpu,
                        },
                        {
                          offset: 1,
                          color: background_color_wgpu,
                        },
                      ];

                      let gradientBackground: BackgroundFill = {
                        type: "Gradient",
                        value: {
                          stops: stops,
                          numStops: stops.length, // numStops
                          type: "linear", // gradientType (0 is linear, 1 is radial)
                          startPoint: [0, 0], // startPoint
                          endPoint: [1, 0], // endPoint
                          center: [0.5, 0.5], // center
                          radius: 1.0, // radius
                          timeOffset: 0, // timeOffset
                          animationSpeed: 1, // animationSpeed
                          enabled: 1, // enabled
                        },
                      };

                      // editor.update_background(
                      //   background_uuid,
                      //   "red",
                      //   InputValue.Number,
                      //   background_color[0]
                      // );
                      // editor.update_background(
                      //   background_uuid,
                      //   "green",
                      //   InputValue.Number,
                      //   background_color[1]
                      // );
                      // editor.update_background(
                      //   background_uuid,
                      //   "blue",
                      //   InputValue.Number,
                      //   background_color[2]
                      // );

                      editor.update_background(
                        background_uuid,
                        gradientBackground
                      );

                      editorState.savedState.sequences.forEach((s) => {
                        if (s.id == current_sequence_id) {
                          if (!s.backgroundFill) {
                            s.backgroundFill = {
                              type: "Color",
                              value: [0.8, 0.8, 0.8, 1],
                            } as BackgroundFill;
                          }

                          // switch (s.backgroundFill.type) {
                          //   case "Color": {
                          //     s.backgroundFill = {
                          //       type: "Color",
                          //       value: background_color_wgpu,
                          //     };

                          //     break;
                          //   }
                          //   case "Gradient": {
                          //     s.backgroundFill = gradientBackground;
                          //     break;
                          //   }
                          // }

                          // gradient only on theme picker
                          s.backgroundFill = gradientBackground;
                        }
                      });

                      saveSequencesData(editorState.savedState.sequences);
                    }}
                  />
                );
              })}
            </div> */}
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
            layers={layers}
            setLayers={set_layers}
            onItemDeleted={on_item_deleted}
            onItemDuplicated={on_item_duplicated}
            onItemsUpdated={on_items_updated}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center w-[calc(100vw-420px)] gap-2">
        <canvas
          id="doc-canvas"
          className={`w-[${docCanasSize.width}px] h-[${docCanasSize.height}px] border border-black`}
          width={docCanasSize.width}
          height={docCanasSize.height}
        />
      </div>
    </div>
  );
};
