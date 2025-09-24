import { AuthToken, getSingleProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Layer } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import { Editor, rgbToWgpu, Viewport } from "@/engine/editor";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { testMarkdown } from "@/engine/data";
import { defaultStyle } from "@/engine/rte";
import { v4 as uuidv4 } from "uuid";
import { TextRendererConfig } from "@/engine/text";

export const RTEEditor: React.FC<any> = ({ projectId }) => {
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [loading, set_loading] = useState(false);

  let [layers, set_layers] = useState<Layer[]>([]);

  let [selected_polygon_id, set_selected_polygon_id] = useState<string | null>(
    null
  );
  let [selected_image_id, set_selected_image_id] = useState<string | null>(
    null
  );

  const editorRef = useRef<Editor | null>(null);
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

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      let editor = editorRef.current;

      if (!editor) {
        return;
      }

      // e.preventDefault();

      // some key triggers do not require the editor to be active (?)
      if (editor.textAreaActive) {
        // const characterId = uuidv4();

        // some key triggers do not require a cursor
        //   if (!window.__canvasRTEInsertCharacterIndex) {
        //     console.info("trigger key with no cursor?");
        //     return;
        //   }

        // Check if Ctrl key (or Cmd key on Mac) is pressed
        const isCtrlPressed = e.ctrlKey || e.metaKey;

        // Handle copy (Ctrl+C / Cmd+C)
        if (isCtrlPressed && e.key === "c") {
          console.info("copy text");
          //     const selectedText = window.getSelection().toString();
          //   if (selectedText) {
          //     navigator.clipboard.writeText(selectedText)
          //       .then(() => console.log('Text copied to clipboard'))
          //       .catch(err => console.error('Failed to copy text: ', err));
          //   }
          e.preventDefault();
        }

        // Handle paste (Ctrl+V / Cmd+V)
        else if (isCtrlPressed && e.key === "v") {
          console.info("paste text");

          navigator.clipboard
            .readText()
            .then((text) => {
              console.log("Pasted text:", text);

              editor.multiPageEditor?.insert(
                window.__canvasRTEInsertCharacterIndex,
                text
              );

              window.__canvasRTEInsertCharacterIndex =
                window.__canvasRTEInsertCharacterIndex + text.length;
              window.__canvasRTEInsertCharacterIndexNl =
                window.__canvasRTEInsertCharacterIndexNl + text.length;

              // renderCursor();
            })
            .catch((err) => console.error("Failed to paste text: ", err));

          e.preventDefault();
        }

        // Handle cut (Ctrl+X / Cmd+X)
        else if (isCtrlPressed && e.key === "x") {
          console.info("cut text");
          // copy then delete
          e.preventDefault();
        }

        if (!isCtrlPressed) {
          switch (e.key) {
            case "Enter":
              {
                e.preventDefault();

                const character = "\n";

                editor.multiPageEditor?.insert(
                  window.__canvasRTEInsertCharacterIndex,
                  character
                );

                // window.__canvasRTEInsertCharacterIndex =
                //   window.__canvasRTEInsertCharacterIndex + 1;
                window.__canvasRTEInsertCharacterIndexNl =
                  window.__canvasRTEInsertCharacterIndexNl + 1;
              }
              break;
            case "Backspace":
              {
                // if (firstSelectedNode && lastSelectedNode) {
                //   const firstIndex = parseInt(firstSelectedNode.split("-")[2]);
                //   const lastIndex = parseInt(lastSelectedNode.split("-")[2]);
                //   const firstIndexNl = parseInt(firstSelectedNode.split("-")[3]);
                //   const lastIndexNl = parseInt(lastSelectedNode.split("-")[3]);
                //   const newlineCount = editorInstance?.getNewlinesBetween(
                //     0,
                //     firstIndex
                //   );
                //   console.info("backspace selection", newlineCount);
                //   editorInstance?.delete(
                //     firstIndex,
                //     lastIndex,
                //     firstIndexNl,
                //     lastIndexNl + 1,
                //     setMasterJson
                //   );
                //   setFirstSelectedNode(null);
                //   setLastSelectedNode(null);
                //   if (selectionDirection === "backward") {
                //     let selectionLength = Math.abs(lastIndex - firstIndex);
                //     let selectionLengthNl = Math.abs(lastIndexNl - firstIndexNl);
                //     console.info(
                //       "selection length",
                //       selectionLength,
                //       selectionLengthNl
                //     );
                //     window.__canvasRTEInsertCharacterIndex =
                //       window.__canvasRTEInsertCharacterIndex - selectionLength;
                //     window.__canvasRTEInsertCharacterIndexNl =
                //       window.__canvasRTEInsertCharacterIndexNl -
                //       selectionLengthNl;
                //   }
                // } else {
                //   if (!editorActive) {
                //     console.error("Editor not active");
                //   }
                //   const char = editorInstance?.getCharAtIndex(
                //     window.__canvasRTEInsertCharacterIndex
                //   );
                //   console.info("backspace", char);
                //   editorInstance?.delete(
                //     window.__canvasRTEInsertCharacterIndex - 1,
                //     window.__canvasRTEInsertCharacterIndex,
                //     window.__canvasRTEInsertCharacterIndexNl - 1,
                //     window.__canvasRTEInsertCharacterIndexNl,
                //     setMasterJson
                //   );
                //   if (char !== "\n") {
                //     window.__canvasRTEInsertCharacterIndex =
                //       window.__canvasRTEInsertCharacterIndex - 1;
                //   }
                //   window.__canvasRTEInsertCharacterIndexNl =
                //     window.__canvasRTEInsertCharacterIndexNl - 1;
                // }
                // renderCursor();
              }
              break;
            case "Delete":
              {
              }
              break;
            case "ArrowLeft":
              {
              }
              break;
            case "ArrowRight":
              {
              }
              break;
            case "ArrowUp":
              {
              }
              break;
            case "ArrowDown":
              {
              }
              break;
            case "Escape":
              {
                // setEditorActive(false);
              }
              break;
            case "Shift":
              {
              }
              break;
            case "Meta":
              {
              }
              break;
            case "Tab":
              {
                const type = "tab";
                const character = "    ";

                editor.multiPageEditor?.insert(
                  window.__canvasRTEInsertCharacterIndex,
                  character
                );

                window.__canvasRTEInsertCharacterIndex =
                  window.__canvasRTEInsertCharacterIndex + 1;
                window.__canvasRTEInsertCharacterIndexNl =
                  window.__canvasRTEInsertCharacterIndexNl + 1;
              }
              break;
            default:
              {
                e.preventDefault();

                // any other character
                const type = "character";
                const character = e.key;

                // console.info("insert char", character);

                editor.multiPageEditor?.insert(
                  window.__canvasRTEInsertCharacterIndex,
                  character
                );

                window.__canvasRTEInsertCharacterIndex =
                  window.__canvasRTEInsertCharacterIndex + 1;
                window.__canvasRTEInsertCharacterIndexNl =
                  window.__canvasRTEInsertCharacterIndexNl + 1;

                // renderCursor();
              }
              break;
          }
        }

        // const renderable = editorInstanceRef.current?.renderVisible();

        // if (renderable) {
        //   setMasterJson(renderable);
        // }
      }
    });

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

    //   set_sequences(cloned_sequences);
    // set_timeline_state(response.project?.fileData.timeline_state);

    // drop(editor_state);

    console.info("Initializing pipeline...");

    let pipeline = new CanvasPipeline();

    canvasPipelineRef.current = await pipeline.new(
      editorRef.current,
      true,
      "rte-canvas",
      {
        width: 900,
        height: 1200,
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
    const canvas = document.getElementById("rte-canvas") as HTMLCanvasElement;
    setupCanvasMouseTracking(canvas);

    await editorRef.current.initializeRTE();

    if (!editorRef.current.multiPageEditor) {
      return;
    }

    console.info("Inserting markdown...");

    let new_id = uuidv4();
    let new_text = "Add text here...";
    let font_family = "Aleo";

    let text_config: TextRendererConfig = {
      id: new_id,
      name: "New Text Area",
      text: new_text,
      fontFamily: font_family,
      dimensions: [900.0, 1200.0] as [number, number],
      position: {
        x: 0,
        y: 0,
      },
      layer: 2,
      color: [20, 20, 20, 255] as [number, number, number, number],
      fontSize: 16,
      backgroundFill: { type: "Color", value: rgbToWgpu(200, 200, 200, 255) },
      isCircle: false,
    };

    editorRef.current.initializeTextArea(text_config).then(() => {
      if (!editorRef.current || !editorRef.current.multiPageEditor) {
        return;
      }

      editorRef.current.multiPageEditor.insert(
        // 0,
        0,
        testMarkdown,
        defaultStyle
        // editorRef.current,
        // true
      );

      // let gpuResources = editorRef.current.gpuResources;

      if (!editorRef.current.textArea) {
        console.warn("Text area not created");
        return;
      }

      // editorRef.current.textArea.renderAreaText(gpuResources.device, gpuResources.queue, );

      // let page = editorRef.current.multiPageEditor.pages[0];
      // let test = page.layout.query(0, page.content.length);
      // console.info("multiPageEditor", test);

      editorRef.current.textArea.hidden = false;
    });

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

  return (
    <>
      <div className="flex flex-col justify-center items-center w-[calc(100vw-420px)] gap-2">
        <canvas
          id="rte-canvas"
          className="w-[900px] h-[1200px] border border-black"
          width="900"
          height="1200"
        />
      </div>
    </>
  );
};
