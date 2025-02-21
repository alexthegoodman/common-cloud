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
    //   const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
    //   setupCanvasMouseTracking(canvas);

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
      layer: -2,
      color: [20, 20, 20, 255] as [number, number, number, number],
      fontSize: 16,
      backgroundFill: { type: "Color", value: rgbToWgpu(200, 200, 200, 255) },
    };

    editorRef.current.initializeTextArea(text_config).then(() => {
      if (!editorRef.current || !editorRef.current.multiPageEditor) {
        return;
      }

      editorRef.current.multiPageEditor.insert(
        0,
        0,
        testMarkdown,
        defaultStyle,
        editorRef.current,
        true
      );

      // let gpuResources = editorRef.current.gpuResources;

      if (!editorRef.current.textArea) {
        console.warn("Text area not created");
        return;
      }

      // editorRef.current.textArea.renderAreaText(gpuResources.device, gpuResources.queue, );

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
          id="doc-canvas"
          className="w-[900px] h-[1200px] border border-black"
          width="900"
          height="1200"
        />
      </div>
    </>
  );
};
