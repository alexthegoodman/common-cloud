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
import { fileToBlob, StImageConfig } from "@/engine/image";
import { AuthToken, saveImage, saveVideo } from "@/fetchers/projects";
import { Sequence } from "@/engine/animations";
import { PolygonConfig } from "@/engine/polygon";
import { useLocalStorage } from "@uidotdev/usehooks";
import { TextRendererConfig } from "@/engine/text";
import { PageSequence } from "@/engine/data";
import { Layer, LayerFromConfig } from "./layers";
import { StVideoConfig } from "@/engine/video";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";

export const ToolGrid = ({
  editorRef,
  editorStateRef,
  webCaptureRef,
  currentSequenceId,
  set_sequences,
  options,
  on_create_sequence,
  layers,
  setLayers,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  webCaptureRef: React.RefObject<WebCapture | null>;
  currentSequenceId: string | null;
  set_sequences?: React.Dispatch<React.SetStateAction<Sequence[]>>;
  options: string[];
  on_create_sequence?: () => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}) => {
  const { t } = useTranslation("common");

  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [generateImageModalOpen, setGenerateImageModalOpen] = useState(false);

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

    if (!editor.settings) {
      console.error("Editor settings are not defined.");
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(
      100,
      editor.settings?.dimensions.width
    );
    let random_number_450 = getRandomNumber(
      100,
      editor.settings?.dimensions.height
    );

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
      layer: -layers.length,
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

    editor.polygons.forEach((polygon) => {
      if (!polygon.hidden && polygon.id === polygon_config.id) {
        let polygon_config: PolygonConfig = polygon.toConfig();
        let new_layer: Layer =
          LayerFromConfig.fromPolygonConfig(polygon_config);
        layers.push(new_layer);
      }
    });

    setLayers(layers);

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

    try {
      let response = await saveImage(authToken.token, file.name, blob);

      if (response) {
        let url = response.url;

        console.info("File url:", url);

        // let mut rng = rand::thread_rng();
        // let random_number_800 = rng.gen_range(0..=800);
        // let random_number_450 = rng.gen_range(0..=450);

        if (!editor.settings) {
          console.error("Editor settings are not defined.");
          return;
        }

        let random_number_800 = getRandomNumber(
          100,
          editor.settings?.dimensions.width
        );
        let random_number_450 = getRandomNumber(
          100,
          editor.settings?.dimensions.height
        );

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
          layer: -layers.length,
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

        editor.imageItems.forEach((image) => {
          if (!image.hidden && image.id === image_config.id) {
            let image_config: StImageConfig = image.toConfig();
            let new_layer: Layer =
              LayerFromConfig.fromImageConfig(image_config);
            layers.push(new_layer);
          }
        });

        setLayers(layers);

        console.info("Image added!");
      }
    } catch (error: any) {
      console.error("add image error", error);
      toast.error(error.message || "An error occurred");
    }
  };

  let on_add_text = async (sequence_id: string) => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!editor.settings) {
      console.error("Editor settings are not defined.");
      return;
    }

    // let mut rng = rand::thread_rng();
    // let random_number_800 = rng.gen_range(0..=800);
    // let random_number_450 = rng.gen_range(0..=450);
    let random_number_800 = getRandomNumber(
      100,
      editor.settings?.dimensions.width
    );
    let random_number_450 = getRandomNumber(
      100,
      editor.settings?.dimensions.height
    );

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
      layer: -layers.length,
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

    editor.textItems.forEach((text) => {
      if (!text.hidden && text.id === text_config.id) {
        let text_config: TextRendererConfig = text.toConfig();
        let new_layer: Layer = LayerFromConfig.fromTextConfig(text_config);
        layers.push(new_layer);
      }
    });

    setLayers(layers);

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

    try {
      // let response = await saveVideo(authToken.token, name, blob);
      const newBlob = await upload(name, blob, {
        access: "public",
        handleUploadUrl: "/api/video/upload",
        clientPayload: JSON.stringify({
          token: authToken.token,
        }),
        multipart: true,
      });

      if (newBlob) {
        let url = newBlob.url;

        console.info("File url:", url);

        if (!editor.settings) {
          console.error("Editor settings are not defined.");
          return;
        }

        // let mut rng = rand::thread_rng();
        // let random_number_800 = rng.gen_range(0..=800);
        // let random_number_450 = rng.gen_range(0..=450);

        let random_number_800 = getRandomNumber(
          100,
          editor.settings?.dimensions.width
        );
        let random_number_450 = getRandomNumber(
          100,
          editor.settings?.dimensions.height
        );

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
          layer: -layers.length,
        };

        await editor.add_video_item(
          video_config,
          blob,
          new_id,
          sequence_id,
          [],
          null
        );

        console.info("Adding video: {:?}", new_id);

        let new_video_item = editor.videoItems.find((v) => v.id === new_id);

        if (!new_video_item || !new_video_item.sourceDurationMs) {
          return;
        }

        editor_state.add_saved_video_item(
          sequence_id,
          {
            id: video_config.id,
            name: video_config.name,
            // path: new_path.clone(),
            path: url,
            dimensions: [
              video_config.dimensions[0],
              video_config.dimensions[1],
            ],
            position: {
              x: position.x,
              y: position.y,
            },
            layer: video_config.layer,
            // mousePath: video_config.mousePath,
          },
          new_video_item.sourceDurationMs
        );

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

        editor.videoItems.forEach((video) => {
          if (!video.hidden && video.id === video_config.id) {
            let video_config: StVideoConfig = video.toConfig();
            let new_layer: Layer =
              LayerFromConfig.fromVideoConfig(video_config);
            layers.push(new_layer);
          }
        });

        setLayers(layers);

        console.info("video added!");
      }
    } catch (error: any) {
      console.error("add video error", error);
      toast.error(error.message || "An error occurred");
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
          label={t("Add Page")}
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
          label={t("Add Square")}
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
          label={t("Add Text")}
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
            label={t("Add Image")}
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
            label={t("Add Video")}
            icon="video"
            callback={() => videoInputRef.current?.click()}
          />
        </>
      )}

      {options.includes("capture") && (
        <OptionButton
          style={{}}
          label={t("Screen Capture")}
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

      {options.includes("imageGeneration") && (
        <>
          <OptionButton
            style={{}}
            label={t("Generate Image")}
            icon="image"
            callback={() => {
              setGenerateImageModalOpen(true);
            }}
          />
          <Dialog
            open={generateImageModalOpen}
            onClose={() => setGenerateImageModalOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
              <DialogPanel className="max-w-lg space-y-4 border bg-white p-12">
                <DialogTitle className="font-bold">
                  Generate New Image
                </DialogTitle>
                <Description>
                  This will enable you to create images which you can use freely
                  in your projects.
                </Description>
                <div>
                  <textarea
                    placeholder="A dog eating food with delight..."
                    rows={2}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setGenerateImageModalOpen(false)}>
                    Cancel
                  </button>
                  <button onClick={() => setGenerateImageModalOpen(false)}>
                    Generate
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </>
      )}
    </div>
  );
};
