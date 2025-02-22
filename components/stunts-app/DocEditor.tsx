import { AuthToken, getSingleProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LayerPanel, { Layer } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import { Editor, rgbToWgpu, Viewport } from "@/engine/editor";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { OptionButton } from "./items";
import { ToolGrid } from "./ToolGrid";
import { WebCapture } from "@/engine/capture";
import EditorState from "@/engine/editor_state";
import { PageSequence } from "@/engine/data";

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

  useDevEffectOnce(async () => {
    if (editorIsSet) {
      return;
    }

    console.info("Starting Editor...");

    let viewport = new Viewport(900, 1200);

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

    // if (!docData) {
    //   return;
    // }

    //   editorStateRef.current = new EditorState(fileData);

    //   let cloned_sequences = fileData?.sequences;

    //   if (!cloned_sequences) {
    //     return;
    //   }

    console.info("Initializing pipeline...");

    let pipeline = new CanvasPipeline();

    canvasPipelineRef.current = await pipeline.new(
      editorRef.current,
      true,
      "doc-canvas",
      {
        width: 900,
        height: 1200,
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

    //   for (let sequence of cloned_sequences) {
    //     editorRef.current.restore_sequence_objects(
    //       sequence,
    //       true
    //       // authToken.token,
    //     );
    //   }

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
              options={["square", "text", "image"]}
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
          className="w-[900px] h-[1200px] border border-black"
          width="900"
          height="1200"
        />
      </div>
    </div>
  );
};
