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
import React, { useCallback, useRef, useState } from "react";
import { WebCapture } from "@/engine/capture";
import { v4 as uuidv4 } from "uuid";
import { fileToBlob, StImageConfig } from "@/engine/image";
import {
  AuthToken,
  getUploadedVideoData,
  resizeVideo,
  saveImage,
  saveVideo,
} from "@/fetchers/projects";
import { Sequence } from "@/engine/animations";
import { PolygonConfig } from "@/engine/polygon";
import { useLocalStorage } from "@uidotdev/usehooks";
import { TextRendererConfig } from "@/engine/text";
import { Cube3DConfig } from "@/engine/cube3d";
import { Sphere3DConfig } from "@/engine/sphere3d";
import { Mockup3DConfig } from "@/engine/mockup3d";
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
  update,
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
  update: () => void;
}) => {
  const { t } = useTranslation("common");

  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const mockupVideoInputRef = useRef<HTMLInputElement | null>(null);

  const [generateImageModalOpen, setGenerateImageModalOpen] = useState(false);
  const [generateImagePrompt, setGenerateImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  const [stickerModalOpen, setStickerModalOpen] = useState(false);

  const availableStickers = [
    "airplane1.png",
    "balloon1.png",
    "candles1.png",
    "cloud1.png",
    "compass1.png",
    "fireworks1.png",
    "fireworks2.png",
    "flower1.png",
    "flower2.png",
    "heart1.png",
    "leaf1.png",
    "leaf2.png",
    "lightbulb1.png",
    "lotus1.png",
    "lotus2.png",
    "rangoli1.png",
    "rangoli2.png",
    "smiley1.png",
    "star1.png",
  ];

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

  let on_add_square = (sequence_id: string, isCircle = false) => {
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
      name: isCircle ? "Circle" : "Square",
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
      layer: layers.length,
      isCircle,
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

  let on_add_image = async (
    sequence_id: string,
    file: File,
    isSticker: boolean = false
  ) => {
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
      // Use Vercel blob client-side upload for images
      // const newBlob = await upload(file.name, blob, {
      //   access: "public",
      //   handleUploadUrl: "/api/image/upload",
      //   clientPayload: JSON.stringify({
      //     token: authToken.token,
      //   }),
      // });

      // let response = {
      //   url: newBlob.url,
      //   fileName: file.name,
      //   size: file.size,
      //   mimeType: file.type,
      //   dimensions: { width: 100, height: 100 },
      // };

      let response = await saveImage(authToken?.token, file.name, blob);

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
          name: isSticker ? "New Sticker" : "New Image Item",
          dimensions: [100, 100] as [number, number],
          position,
          // path: new_path.clone(),
          url: url,
          layer: layers.length,
          isCircle: false,
          isSticker: isSticker,
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
          isSticker: image_config.isSticker,
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
      layer: layers.length,
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

    // Find the created text renderer and save with animation data
    const textRenderer = editor.textItems.find((t) => t.id === text_config.id);
    const savedConfig = textRenderer
      ? textRenderer.toSavedConfig()
      : {
          id: text_config.id,
          name: text_config.name,
          text: new_text,
          fontFamily: text_config.fontFamily,
          dimensions: [
            text_config.dimensions[0],
            text_config.dimensions[1],
          ] as [number, number],
          position: {
            x: position.x,
            y: position.y,
          },
          layer: text_config.layer,
          color: text_config.color,
          fontSize: text_config.fontSize,
          backgroundFill: text_config.backgroundFill,
          isCircle: text_config.isCircle,
          textAnimation: null,
        };

    editor_state.add_saved_text_item(sequence_id, savedConfig);

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

  let import_video = useCallback(
    async (sequence_id: string, name: string, blob: Blob) => {
      let editor = editorRef.current;
      let editor_state = editorStateRef.current;

      if (!editor || !editor_state) {
        return;
      }

      if (!authToken) {
        return;
      }

      try {
        setUserMessage(`Resizing video: ${name}...`);

        // send File to resizeVideo function
        // const resizedVideoBlob =
        //   process.env.NODE_ENV === "production"
        //     ? await resizeVideo(blob)
        //     : blob;

        const resizedVideoBlob = await resizeVideo(blob);

        if (!resizedVideoBlob) {
          throw new Error("Failed to resize video");
        }

        setUserMessage(`Uploading video: ${name}...`);

        // let response = await saveVideo(authToken.token, name, blob);
        // const response = await upload(name, resizedVideoBlob, {
        //   access: "public",
        //   handleUploadUrl: "/api/video/upload",
        //   clientPayload: JSON.stringify({
        //     token: authToken.token,
        //   }),
        //   // multipart: true,
        //   onUploadProgress: (progress) => {
        //     setUploadProgress(progress.percentage);
        //   },
        // });

        let response = await saveVideo(
          authToken?.token,
          name,
          resizedVideoBlob
        );

        setUserMessage("");

        if (response) {
          let url = response.url;

          console.info("File url:", url);

          // let actualBlob = await getUploadedVideoData(url);

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
            layer: layers.length,
          };

          await editor.add_video_item(
            video_config,
            resizedVideoBlob,
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

          // set sequence duration to video duration automatically, better ux
          let saved_state1 = editor_state.savedState;
          let updated_sequence1 = saved_state1.sequences.find(
            (s) => s.id == sequence_id
          );

          updated_sequence1!.durationMs = new_video_item.sourceDurationMs;

          await editor_state.add_saved_video_item(
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
    },
    [
      authToken,
      setUploadProgress,
      getRandomNumber,
      set_sequences,
      setLayers,
      layers,
    ]
  );

  let on_add_video = useCallback(
    async (sequence_id: string, file: File) => {
      let blob = await fileToBlob(file);

      if (!blob) {
        return;
      }

      await import_video(sequence_id, file.name, blob);
    },
    [import_video]
  );

  const handleStickerSelect = async (stickerFileName: string) => {
    if (!currentSequenceId) {
      return;
    }

    try {
      const stickerUrl = `/stickers/${stickerFileName}`;
      const response = await fetch(stickerUrl);
      const blob = await response.blob();

      const file = new File([blob], stickerFileName, {
        type: "image/png",
      });

      await on_add_image(currentSequenceId, file, true);
      setStickerModalOpen(false);
      toast.success("Sticker added successfully!");
    } catch (error: any) {
      console.error("Sticker selection error:", error);
      toast.error("Failed to add sticker");
    }
  };

  const handleGenerateImage = async () => {
    if (!generateImagePrompt.trim() || !currentSequenceId) {
      return;
    }

    setIsGeneratingImage(true);

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: generateImagePrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const imageBlob = await response.blob();

      const file = new File([imageBlob], `generated-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      await on_add_image(currentSequenceId, file);

      setGenerateImageModalOpen(false);
      setGenerateImagePrompt("");
      toast.success("Image generated and added successfully!");
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const on_add_mockup3d = useCallback(
    async (sequence_id: string, file: File) => {
      let editor = editorRef.current;
      let editor_state = editorStateRef.current;

      if (!editor || !editor_state) {
        return;
      }

      if (!authToken) {
        return;
      }

      if (!editor.settings) {
        console.error("Editor settings are not defined.");
        return;
      }

      let blob = await fileToBlob(file);

      if (!blob) {
        return;
      }

      try {
        setUserMessage(`Resizing video for mockup: ${file.name}...`);

        const resizedVideoBlob = await resizeVideo(blob);

        if (!resizedVideoBlob) {
          throw new Error("Failed to resize video");
        }

        setUserMessage(`Uploading mockup video: ${file.name}...`);

        let response = await saveVideo(
          authToken?.token,
          file.name,
          resizedVideoBlob
        );

        setUserMessage("");

        if (response) {
          let url = response.url;

          console.info("Mockup video url:", url);

          const random_number_800 = getRandomNumber(
            100,
            editor.settings.dimensions.width
          );
          const random_number_450 = getRandomNumber(
            100,
            editor.settings.dimensions.height
          );

          const new_mockup_id = uuidv4();
          const new_video_id = uuidv4();

          // const mockupPosition = {
          //   x: random_number_800 + CANVAS_HORIZ_OFFSET,
          //   y: random_number_450 + CANVAS_VERT_OFFSET,
          // };

          const mockupPosition = {
            x: 100,
            y: 100,
          };

          let mockupDimensions = [1.5, 1.5, 0.3] as [number, number, number];

          const dimensionsWorld = [500.0, 300.0];

          // Create video config for the child video
          const videoConfig: StVideoConfig = {
            id: new_video_id,
            name: "Mockup Screen Video",
            dimensions: [dimensionsWorld[0], dimensionsWorld[1]] as [
              number,
              number
            ], // Will be adjusted by mockup
            position: {
              x: 0,
              y: 0,
            },
            path: url,
            layer: layers.length + 1, // Video is above mockup
          };

          // Create mockup config with required video child
          const mockupConfig: Mockup3DConfig = {
            id: new_mockup_id,
            name: "Laptop Mockup",
            dimensions: mockupDimensions, // width, height, depth
            position: mockupPosition,
            rotation: [15, 0, 0], // Slight tilt
            backgroundFill: {
              type: "Color",
              value: [0.7, 0.7, 0.75, 1.0], // Silver gray
            },
            layer: layers.length,
            videoChild: videoConfig,
          };

          // First add the video item (the mockup will reference it)
          let new_video_item = await editor.create_video_item(
            videoConfig,
            resizedVideoBlob,
            new_video_id,
            sequence_id,
            [],
            null,
            7
          );

          if (!new_video_item || !new_video_item.sourceDurationMs) {
            return;
          }

          // Add the mockup
          editor.add_mockup3d(mockupConfig, new_mockup_id, sequence_id);

          // Link the video to the mockup
          const mockup = editor.mockups3D.find((m) => m.id === new_mockup_id);
          if (mockup) {
            mockup.videoChild = new_video_item;
            // Update video child transform to match mockup's screen
            if (editor.gpuResources?.queue && editor.camera?.windowSize) {
              mockup.videoChild.transform.layer =
                mockup.videoChild.transform.layer + 0.3;
              mockup.updateVideoChildTransform(
                editor.gpuResources.queue,
                editor.camera.windowSize
              );
            }
          }

          // Save mockup to state (video is stored as child, not separately)
          await editor_state.add_saved_mockup3d(sequence_id, mockupConfig);

          console.info("Saved mockup!");

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

          // Add layer only for the mockup (video is a child, not a separate layer)
          editor.mockups3D.forEach((mockup) => {
            if (!mockup.hidden && mockup.id === mockupConfig.id) {
              let mockup_config: Mockup3DConfig = mockup.toConfig();
              let new_layer: Layer =
                LayerFromConfig.fromMockup3DConfig(mockup_config);
              layers.push(new_layer);
            }
          });

          setLayers(layers);

          console.info("Mockup3D added!");
          toast.success("Laptop mockup added successfully!");
        }
      } catch (error: any) {
        console.error("add mockup error", error);
        toast.error(error.message || "An error occurred");
      }
    },
    [
      authToken,
      setUploadProgress,
      getRandomNumber,
      set_sequences,
      setLayers,
      layers,
    ]
  );

  return (
    <>
      {userMessage && (
        <div className="bg-blue-100 text-blue-800 p-2 rounded mb-4">
          {userMessage}
          {uploadProgress > 0 && uploadProgress < 99 ? (
            <span> {uploadProgress}%</span>
          ) : (
            <></>
          )}
        </div>
      )}
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
            aria-label="Add a square shape to the canvas"
            callback={() => {
              if (!currentSequenceId) {
                return;
              }

              on_add_square(currentSequenceId);
            }}
          />
        )}

        {options.includes("circle") && (
          <OptionButton
            style={{}}
            label={t("Add Circle")}
            icon="circle"
            aria-label="Add a circle shape to the canvas"
            callback={() => {
              if (!currentSequenceId) {
                return;
              }

              on_add_square(currentSequenceId, true); // true for isCircle
            }}
          />
        )}

        {options.includes("text") && (
          <OptionButton
            style={{}}
            label={t("Add Text")}
            icon="text"
            aria-label="Add a text element to the canvas"
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
              aria-label="Select image file to upload"
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
              aria-label="Browse and add an image file to the canvas"
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
              aria-label="Select video file to upload"
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
              aria-label="Browse and add a video file to the canvas"
              callback={() => videoInputRef.current?.click()}
            />
          </>
        )}

        {options.includes("capture") && (
          <OptionButton
            style={{}}
            label={t("Screen Capture")}
            icon="video"
            aria-label={
              isCapturing ? "Stop screen recording" : "Start screen recording"
            }
            callback={() => {
              if (isCapturing) {
                handleStopCapture();
              } else {
                handleStartCapture();
              }
            }}
          />
        )}

        {options.includes("stickers") && (
          <>
            <OptionButton
              style={{}}
              label={t("Add Sticker")}
              icon="sticker"
              callback={() => {
                setStickerModalOpen(true);
              }}
            />
            <Dialog
              open={stickerModalOpen}
              onClose={() => setStickerModalOpen(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/25" />
              <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel className="max-w-4xl space-y-4 border bg-white p-8 rounded-lg">
                  <DialogTitle className="font-bold text-xl">
                    Choose a Sticker
                  </DialogTitle>
                  <Description>
                    Select a sticker to add to your project.
                  </Description>
                  <div className="grid grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                    {availableStickers.map((sticker) => (
                      <button
                        key={sticker}
                        onClick={() => handleStickerSelect(sticker)}
                        className="aspect-square border-2 border-gray-200 rounded-lg p-2 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <img
                          src={`/stickers/${sticker}`}
                          alt={sticker.replace(".png", "")}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStickerModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          </>
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
              <div className="fixed inset-0 bg-black/25" />
              <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-lg">
                  <DialogTitle className="font-bold">
                    Generate New Image
                  </DialogTitle>
                  <Description>
                    This will enable you to create images which you can use
                    freely in your projects.
                  </Description>
                  <div>
                    <textarea
                      placeholder="A dog eating food with delight..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md resize-none"
                      value={generateImagePrompt}
                      onChange={(e) => setGenerateImagePrompt(e.target.value)}
                      disabled={isGeneratingImage}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setGenerateImageModalOpen(false)}
                      disabled={isGeneratingImage}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateImage}
                      disabled={
                        isGeneratingImage || !generateImagePrompt.trim()
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingImage ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          </>
        )}

        {options.includes("brush") && (
          <OptionButton
            style={{}}
            label={t("Procedural Brush")}
            icon="brush"
            aria-label="Enable procedural brush drawing mode"
            callback={() => {
              if (!editorRef.current || !currentSequenceId) {
                return;
              }

              // Toggle brush drawing mode
              editorRef.current.brushDrawingMode =
                !editorRef.current.brushDrawingMode;

              if (editorRef.current.brushDrawingMode) {
                // Create new brush with default config
                const { BrushType } = require("@/engine/brush");
                const new_id = uuidv4();

                const random_number_800 = getRandomNumber(
                  100,
                  editorRef.current.settings?.dimensions.width || 900
                );
                const random_number_450 = getRandomNumber(
                  100,
                  editorRef.current.settings?.dimensions.height || 550
                );

                const defaultBrushConfig = {
                  id: new_id,
                  name: "New Brush",
                  brushType: BrushType.Noise,
                  size: 20,
                  opacity: 0.7,
                  flow: 0.5,
                  spacing: 0.25,
                  primaryColor: [0, 0, 0, 255] as [
                    number,
                    number,
                    number,
                    number
                  ],
                  secondaryColor: [255, 255, 255, 255] as [
                    number,
                    number,
                    number,
                    number
                  ],
                  noiseScale: 0.01,
                  octaves: 4,
                  persistence: 0.5,
                  randomSeed: Math.random() * 1000,
                  position: {
                    x: random_number_800,
                    y: random_number_450,
                  },
                  dimensions: [500, 500] as [number, number],
                  layer: layers.length,
                  rotation: 0,
                };

                editorRef.current.add_brush(
                  defaultBrushConfig,
                  new_id,
                  currentSequenceId
                );

                update();

                console.info("Brush drawing mode enabled!");
              } else {
                console.info("Brush drawing mode disabled!");
              }
            }}
          />
        )}

        {options.includes("cube3d") && (
          <OptionButton
            style={{}}
            label={t("Add 3D Cube")}
            icon="cube"
            aria-label="Add a 3D cube to the canvas"
            callback={() => {
              if (!editorRef.current || !currentSequenceId) {
                return;
              }

              const editor = editorRef.current;
              const editor_state = editorStateRef.current;

              if (!editor || !editor_state || !editor.settings) {
                return;
              }

              const random_number_800 = getRandomNumber(
                100,
                editor.settings.dimensions.width
              );
              const random_number_450 = getRandomNumber(
                100,
                editor.settings.dimensions.height
              );

              const new_id = uuidv4();

              const cubeConfig: Cube3DConfig = {
                id: new_id,
                name: "3D Cube",
                dimensions: [0.5, 0.5, 0.2],
                position: {
                  x: 0,
                  y: 0,
                },
                rotation: [0, 0, 0],
                backgroundFill: {
                  type: "Color",
                  value: [0.5, 0.7, 1.0, 1.0],
                },
                layer: layers.length,
              };

              editor.add_cube3d(cubeConfig, new_id, currentSequenceId);

              editor_state.add_saved_cube3d(currentSequenceId, cubeConfig);

              let saved_state = editor_state.savedState;

              let updated_sequence = saved_state.sequences.find(
                (s) => s.id == currentSequenceId
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

              editor.cubes3D.forEach((cube) => {
                if (!cube.hidden && cube.id === cubeConfig.id) {
                  let cube_config: Cube3DConfig = cube.toConfig();
                  let new_layer: Layer =
                    LayerFromConfig.fromCube3DConfig(cube_config);
                  layers.push(new_layer);
                }
              });

              setLayers(layers);

              update();
            }}
          />
        )}

        {options.includes("sphere3d") && (
          <OptionButton
            style={{}}
            label={t("Add 3D Sphere")}
            icon="circle"
            aria-label="Add a 3D sphere to the canvas"
            callback={() => {
              if (!editorRef.current || !currentSequenceId) {
                return;
              }

              const editor = editorRef.current;
              const editor_state = editorStateRef.current;

              if (!editor || !editor_state || !editor.settings) {
                return;
              }

              const random_number_800 = getRandomNumber(
                100,
                editor.settings.dimensions.width
              );
              const random_number_450 = getRandomNumber(
                100,
                editor.settings.dimensions.height
              );

              const new_id = uuidv4();

              const sphereConfig: Sphere3DConfig = {
                id: new_id,
                name: "3D Sphere",
                radius: 0.5,
                position: {
                  x: 0,
                  y: 0,
                },
                rotation: [0, 0, 0],
                backgroundFill: {
                  type: "Color",
                  value: [1.0, 0.5, 0.7, 1.0],
                },
                layer: layers.length,
              };

              editor.add_sphere3d(sphereConfig, new_id, currentSequenceId);

              editor_state.add_saved_sphere3d(currentSequenceId, sphereConfig);

              let saved_state = editor_state.savedState;

              let updated_sequence = saved_state.sequences.find(
                (s) => s.id == currentSequenceId
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

              editor.spheres3D.forEach((sphere) => {
                if (!sphere.hidden && sphere.id === sphereConfig.id) {
                  let sphere_config: Sphere3DConfig = sphere.toConfig();
                  let new_layer: Layer =
                    LayerFromConfig.fromSphere3DConfig(sphere_config);
                  layers.push(new_layer);
                }
              });

              setLayers(layers);

              update();
            }}
          />
        )}

        {options.includes("mockup3d") && (
          <>
            <input
              type="file"
              ref={mockupVideoInputRef}
              accept="video/*"
              style={{ display: "none" }}
              aria-label="Select video file for laptop mockup"
              onChange={(e) => {
                if (!e.target.files || !currentSequenceId) {
                  return;
                }

                const file = e.target.files[0];
                if (file) {
                  console.log("Selected mockup video file:", file);
                  on_add_mockup3d(currentSequenceId, file);
                }
              }}
            />
            <OptionButton
              style={{}}
              label={t("Add Laptop Mockup")}
              icon="laptop"
              aria-label="Add a laptop mockup with video screen"
              callback={() => mockupVideoInputRef.current?.click()}
            />
          </>
        )}
      </div>
    </>
  );
};
