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

export const DocEditor: React.FC<any> = ({ projectId }) => {
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

  return (
    <>
      <div className="flex flex-col justify-center items-center w-[calc(100vw-420px)] gap-2">
        <canvas
          id="doc-canvas"
          className="w-[900px] h-[1200px] border border-black"
          width="900"
          height="1200"
        />
      </div>
    </>
  );
};
