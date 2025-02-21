import { AuthToken, getSingleProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Layer } from "./layers";
import { CanvasPipeline } from "@/engine/pipeline";
import { Editor, Viewport } from "@/engine/editor";
import { useDevEffectOnce } from "@/hooks/useDevOnce";

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

  useDevEffectOnce(() => {
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

    let fileData = response.project?.fileData;

    console.info("savedState", fileData);

    if (!fileData) {
      return;
    }

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

  return <></>;
};
