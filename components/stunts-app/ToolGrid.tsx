"use client";

import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Editor,
  getRandomNumber,
  rgbToWgpu,
} from "@/engine/editor";
import { OptionButton } from "./items";
import EditorState from "@/engine/editor_state";
import React, { useRef, useState } from "react";
import { WebCapture } from "@/engine/capture";
import { v4 as uuidv4 } from "uuid";
import { fileToBlob } from "@/engine/image";
import { AuthToken, saveImage, saveVideo } from "@/fetchers/projects";
import { Sequence } from "@/engine/animations";
import { PolygonConfig } from "@/engine/polygon";
import { useLocalStorage } from "@uidotdev/usehooks";
import { TextRendererConfig } from "@/engine/text";
import { PageSequence } from "@/engine/data";

export const ToolGrid = ({
  editorRef,
  editorStateRef,
  webCaptureRef,
  currentSequenceId,
  set_sequences,
  options,
  on_create_sequence,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  webCaptureRef: React.RefObject<WebCapture | null>;
  currentSequenceId: string | null;
  set_sequences?: React.Dispatch<
    React.SetStateAction<Sequence[] | PageSequence[]>
  >;
  options: string[];
  on_create_sequence?: () => void;
}) => {
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartCapture = async () => {
    let webCapture = webCaptureRef.current;

    if (!webCapture || !currentSequenceId) {
      return;
    }

    setIsCapturing(true);

    await webCapture.startScreenCapture();

    const blob = await webCapture.startRecording();

    await import_video(currentSequenceId, uuidv4() + ".mp4", blob);
  };

  const handleStopCapture = () => {
    let webCapture = webCaptureRef.current;

    if (!webCapture) {
      return;
    }

    webCapture.stopRecording();

    setIsCapturing(false);
  };

  let on_add_square = (sequence_id: string) => {
    console.info("Adding Square...");

    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(0, 800);
    let random_number_450 = getRandomNumber(0, 450);

    let new_id = uuidv4();

    let polygon_config: PolygonConfig = {
      id: new_id,
      name: "Square",
      points: [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 },
      ],
      dimensions: [100.0, 100.0],
      position: {
        x: random_number_800,
        y: random_number_450,
      },
      rotation: 0,
      borderRadius: 0.0,
      // fill: [1.0, 1.0, 1.0, 1.0],
      backgroundFill: {
        type: "Color",
        value: [1.0, 1.0, 1.0, 1.0],
      },
      stroke: {
        fill: [1.0, 1.0, 1.0, 1.0],
        thickness: 2.0,
      },
      layer: -2,
      isCircle: false,
    };

    editor.add_polygon(polygon_config, "Polygon", new_id, sequence_id);

    editor_state.add_saved_polygon(sequence_id, {
      id: polygon_config.id,
      name: polygon_config.name,
      dimensions: [polygon_config.dimensions[0], polygon_config.dimensions[1]],
      backgroundFill: polygon_config.backgroundFill,
      borderRadius: polygon_config.borderRadius,
      position: {
        x: polygon_config.position.x,
        y: polygon_config.position.y,
      },
      stroke: {
        thickness: polygon_config.stroke.thickness,
        fill: [
          polygon_config.stroke.fill[0],
          polygon_config.stroke.fill[1],
          polygon_config.stroke.fill[2],
          polygon_config.stroke.fill[3],
        ],
      },
      layer: polygon_config.layer,
      isCircle: polygon_config.isCircle,
    });

    let saved_state = editor_state.savedState;

    let updated_sequence = saved_state.sequences.find(
      (s) => s.id == sequence_id
    );

    let sequence_cloned = updated_sequence;

    if (!sequence_cloned) {
      throw Error("Sequence does not exist");
    }

    if (set_sequences) {
      set_sequences(saved_state.sequences);
    }

    editor.currentSequenceData = sequence_cloned;

    editor.updateMotionPaths(sequence_cloned);

    console.info("Square added!");
  };

  let on_add_image = async (sequence_id: string, file: File) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!authToken) {
      return;
    }

    let blob = await fileToBlob(file);

    if (!blob) {
      return;
    }

    let response = await saveImage(authToken.token, file.name, blob);

    if (response) {
      let url = response.url;

      console.info("File url:", url);

      // let mut rng = rand::thread_rng();
      // let random_number_800 = rng.gen_range(0..=800);
      // let random_number_450 = rng.gen_range(0..=450);

      let random_number_800 = getRandomNumber(0, 800);
      let random_number_450 = getRandomNumber(0, 450);

      let new_id = uuidv4();

      let position = {
        x: random_number_800 + CANVAS_HORIZ_OFFSET,
        y: random_number_450 + CANVAS_VERT_OFFSET,
      };

      let image_config = {
        id: new_id,
        name: "New Image Item",
        dimensions: [100, 100] as [number, number],
        position,
        // path: new_path.clone(),
        url: url,
        layer: -1,
        isCircle: false,
      };

      editor.add_image_item(image_config, url, blob, new_id, sequence_id);

      console.info("Adding image: {:?}", new_id);

      editor_state.add_saved_image_item(sequence_id, {
        id: image_config.id,
        name: image_config.name,
        // path: new_path.clone(),
        url: url,
        dimensions: [image_config.dimensions[0], image_config.dimensions[1]],
        position: {
          x: position.x,
          y: position.y,
        },
        layer: image_config.layer,
        isCircle: image_config.isCircle,
      });

      console.info("Saved image!");

      let saved_state = editor_state.savedState;
      let updated_sequence = saved_state.sequences.find(
        (s) => s.id == sequence_id
      );

      let sequence_cloned = updated_sequence;

      if (!sequence_cloned) {
        return;
      }

      if (set_sequences) {
        set_sequences(saved_state.sequences);
      }

      editor.currentSequenceData = sequence_cloned;
      editor.updateMotionPaths(sequence_cloned);

      console.info("Image added!");
    }
  };

  let on_add_text = async (sequence_id: string) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(0, 800);
    let random_number_450 = getRandomNumber(0, 450);

    let new_id = uuidv4();
    let new_text = "New text";
    let font_family = "Aleo";

    let position = {
      x: random_number_800 + CANVAS_HORIZ_OFFSET,
      y: random_number_450 + CANVAS_VERT_OFFSET,
    };

    let text_config: TextRendererConfig = {
      id: new_id,
      name: "New Text Item",
      text: new_text,
      fontFamily: font_family,
      dimensions: [100.0, 100.0] as [number, number],
      position,
      layer: -2,
      // color: rgbToWgpu(20, 20, 200, 255) as [number, number, number, number],
      color: [20, 20, 200, 255] as [number, number, number, number],
      fontSize: 28,
      // backgroundFill: rgbToWgpu(200, 200, 200, 255) as [
      //   number,
      //   number,
      //   number,
      //   number
      // ],
      backgroundFill: { type: "Color", value: rgbToWgpu(200, 200, 200, 255) },
      isCircle: false,
    };

    await editor.add_text_item(text_config, new_text, new_id, sequence_id);

    editor_state.add_saved_text_item(sequence_id, {
      id: text_config.id,
      name: text_config.name,
      text: new_text,
      fontFamily: text_config.fontFamily,
      dimensions: [text_config.dimensions[0], text_config.dimensions[1]],
      position: {
        x: position.x,
        y: position.y,
      },
      layer: text_config.layer,
      color: text_config.color,
      fontSize: text_config.fontSize,
      backgroundFill: text_config.backgroundFill,
      isCircle: text_config.isCircle,
    });

    let saved_state = editor_state.savedState;
    let updated_sequence = saved_state.sequences.find(
      (s) => s.id == sequence_id
    );

    let sequence_cloned = updated_sequence;

    if (!sequence_cloned) {
      return;
    }

    if (set_sequences) {
      set_sequences(saved_state.sequences);
    }

    // let mut editor = editor_m.lock().unwrap();

    editor.currentSequenceData = sequence_cloned;
    editor.updateMotionPaths(sequence_cloned);

    // drop(editor);
  };

  let import_video = async (sequence_id: string, name: string, blob: Blob) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!authToken) {
      return;
    }

    let response = await saveVideo(authToken.token, name, blob);

    if (response) {
      let url = response.url;

      console.info("File url:", url);

      // let mut rng = rand::thread_rng();
      // let random_number_800 = rng.gen_range(0..=800);
      // let random_number_450 = rng.gen_range(0..=450);

      let random_number_800 = getRandomNumber(0, 800);
      let random_number_450 = getRandomNumber(0, 450);

      let new_id = uuidv4();

      let position = {
        x: random_number_800 + CANVAS_HORIZ_OFFSET,
        y: random_number_450 + CANVAS_VERT_OFFSET,
      };

      let video_config = {
        id: new_id,
        name: "New Video Item",
        dimensions: [100, 100] as [number, number],
        position,
        // path: new_path.clone(),
        path: url,
        mousePath: "",
        layer: -1,
      };

      editor.add_video_item(video_config, blob, new_id, sequence_id, [], null);

      console.info("Adding video: {:?}", new_id);

      editor_state.add_saved_video_item(sequence_id, {
        id: video_config.id,
        name: video_config.name,
        // path: new_path.clone(),
        path: url,
        dimensions: [video_config.dimensions[0], video_config.dimensions[1]],
        position: {
          x: position.x,
          y: position.y,
        },
        layer: video_config.layer,
        // mousePath: video_config.mousePath,
      });

      console.info("Saved video!");

      let saved_state = editor_state.savedState;
      let updated_sequence = saved_state.sequences.find(
        (s) => s.id == sequence_id
      );

      let sequence_cloned = updated_sequence;

      if (!sequence_cloned) {
        return;
      }

      if (set_sequences) {
        set_sequences(saved_state.sequences);
      }

      editor.currentSequenceData = sequence_cloned;
      editor.updateMotionPaths(sequence_cloned);

      console.info("video added!");
    }
  };

  let on_add_video = async (sequence_id: string, file: File) => {
    let blob = await fileToBlob(file);

    if (!blob) {
      return;
    }

    await import_video(sequence_id, file.name, blob);
  };

  return (
    <div className="flex flex-row flex-wrap gap-2">
      {options.includes("page") && (
        <OptionButton
          style={{}}
          label="Add Page"
          icon="file-plus"
          callback={() => {
            if (!currentSequenceId || !on_create_sequence) {
              return;
            }

            on_create_sequence();
          }}
        />
      )}

      {options.includes("square") && (
        <OptionButton
          style={{}}
          label="Add Square"
          icon="square"
          callback={() => {
            if (!currentSequenceId) {
              return;
            }

            on_add_square(currentSequenceId);
          }}
        />
      )}

      {options.includes("text") && (
        <OptionButton
          style={{}}
          label="Add Text"
          icon="text"
          callback={() => {
            if (!currentSequenceId) {
              return;
            }

            on_add_text(currentSequenceId);
          }}
        />
      )}

      {options.includes("image") && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              // Handle the selected file here
              if (!e.target.files || !currentSequenceId) {
                return;
              }

              const file = e.target.files[0];
              if (file) {
                // Do something with the file
                console.log("Selected file:", file);
                on_add_image(currentSequenceId, file);
              }
            }}
          />
          <OptionButton
            style={{}}
            label="Add Image"
            icon="image"
            callback={() => fileInputRef.current?.click()}
          />
        </>
      )}

      {options.includes("video") && (
        <>
          <input
            type="file"
            ref={videoInputRef}
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => {
              // Handle the selected file here
              if (!e.target.files || !currentSequenceId) {
                return;
              }

              const file = e.target.files[0];
              if (file) {
                // Do something with the file
                console.log("Selected file:", file);
                on_add_video(currentSequenceId, file);
              }
            }}
          />
          <OptionButton
            style={{}}
            label="Add Video"
            icon="video"
            callback={() => videoInputRef.current?.click()}
          />
        </>
      )}

      {options.includes("capture") && (
        <OptionButton
          style={{}}
          label="Screen Capture"
          icon="video"
          callback={() => {
            if (isCapturing) {
              handleStopCapture();
            } else {
              handleStartCapture();
            }
          }}
        />
      )}
    </div>
  );
};
