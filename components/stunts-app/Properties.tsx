"use client";

import React, { useEffect, useState } from "react";
import { DebouncedInput } from "./items";
import { Editor } from "@/engine/editor";
import EditorState from "@/engine/editor_state";
import { ObjectType } from "@/engine/animations";
import { CreateIcon } from "./icon";
import { RepeatPattern } from "@/engine/repeater";

const RepeatProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentObjectId,
  objectType,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentObjectId: string;
  objectType: ObjectType;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultCount, setDefaultCount] = useState(0);
  const [defaultDirection, setDefaultDirection] = useState("horizontal");
  const [defaultSpacing, setDefaultSpacing] = useState(0);
  const [defaultScale, setDefaultScale] = useState(1);
  const [defaultRotation, setDefaultRotation] = useState(0);
  const [is_repeat, set_is_repeat] = useState(false);

  useEffect(() => {
    let editor = editorRef.current;

    if (!editor) {
      return;
    }

    let currentObject = editor.repeatManager.getRepeatObject(currentObjectId);

    if (!currentObject) {
      set_is_repeat(false);
      setDefaultsSet(true);
      return;
    }

    let currentPattern = currentObject?.pattern;

    setDefaultCount(currentPattern.count);
    setDefaultDirection(currentPattern.direction);
    setDefaultSpacing(currentPattern.spacing);

    if (currentPattern.scale) {
      setDefaultScale(currentPattern.scale);
    }

    if (currentPattern.rotation) {
      setDefaultRotation(currentPattern.rotation);
    }

    set_is_repeat(true);
    setDefaultsSet(true);
  }, []);

  let set_prop = (partialPattern: Partial<RepeatPattern>) => {
    let editor = editorRef.current;

    if (!editor) {
      return;
    }

    let gpuResources = editor.gpuResources;
    let camera = editor.camera;

    if (!gpuResources || !editor.modelBindGroupLayout || !camera) {
      return;
    }

    editor.repeatManager.updateRepeatObject(
      gpuResources.device,
      gpuResources.queue,
      camera.windowSize,
      editor.modelBindGroupLayout,
      currentObjectId,
      partialPattern
    );
  };

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <input
        type="checkbox"
        id="is_repeat"
        name="is_repeat"
        checked={is_repeat}
        onChange={(ev) => {
          let editor = editorRef.current;

          if (!editor) {
            return;
          }

          let gpuResources = editor.gpuResources;
          let camera = editor.camera;

          let sourceObject = null;
          switch (objectType) {
            case ObjectType.Polygon:
              sourceObject = editor.polygons.find(
                (p) => p.id === currentObjectId
              );
              break;
            case ObjectType.TextItem:
              sourceObject = editor.textItems.find(
                (p) => p.id === currentObjectId
              );
              break;
            case ObjectType.ImageItem:
              sourceObject = editor.imageItems.find(
                (p) => p.id === currentObjectId
              );
              break;
            default:
              break;
          }

          if (
            !sourceObject ||
            !gpuResources ||
            !editor.modelBindGroupLayout ||
            !camera
          ) {
            return;
          }

          set_is_repeat(ev.target.checked);

          let defaultRepeatPattern: RepeatPattern = {
            count: 5,
            spacing: 50,
            direction: "horizontal",
            rotation: 0,
            scale: 1,
            fadeOut: false,
          };

          editor.repeatManager.createRepeatObject(
            gpuResources?.device,
            gpuResources?.queue,
            camera.windowSize,
            editor.modelBindGroupLayout,
            sourceObject,
            defaultRepeatPattern
          );
        }}
      />
      <label htmlFor="is_repeat" className="text-xs">
        Is Repeated
      </label>
      {is_repeat && (
        <>
          <DebouncedInput
            id="repeat_count"
            label="Count"
            placeholder="Count"
            initialValue={defaultCount.toString()}
            onDebounce={(value) => {
              let partialPattern: Partial<RepeatPattern> = {
                count: parseInt(value),
              };

              set_prop(partialPattern);
            }}
          />
          <label htmlFor="repeat_direction" className="text-xs">
            Choose direction
          </label>
          <select
            id="repeat_direction"
            name="repeat_direction"
            className="text-xs"
            value={defaultDirection}
            onChange={(ev) => {
              let partialPattern: Partial<RepeatPattern> = {
                direction: ev.target.value as
                  | "horizontal"
                  | "vertical"
                  | "circular"
                  | "grid",
              };

              set_prop(partialPattern);
            }}
          >
            {/* "horizontal" | "vertical" | "circular" | "grid" */}
            <option value="horizontal">horizontal</option>
            <option value="vertical">vertical</option>
            <option value="circular">circular</option>
            <option value="grid">grid</option>
          </select>
          <DebouncedInput
            id="repeat_spacing"
            label="Spacing"
            placeholder="Spacing"
            initialValue={defaultSpacing.toString()}
            onDebounce={(value) => {
              let partialPattern: Partial<RepeatPattern> = {
                spacing: parseInt(value),
              };

              set_prop(partialPattern);
            }}
          />
          <DebouncedInput
            id="repeat_scale"
            label="Scale (out of 100%)"
            placeholder="Scale"
            initialValue={defaultScale.toString()}
            onDebounce={(value) => {
              let partialPattern: Partial<RepeatPattern> = {
                scale: parseInt(value) / 100,
              };

              set_prop(partialPattern);
            }}
          />
          <DebouncedInput
            id="repeat_rotation"
            label="Rotation (degrees)"
            placeholder="Rotation"
            initialValue={defaultRotation.toString()}
            onDebounce={(value) => {
              let partialPattern: Partial<RepeatPattern> = {
                rotation: parseInt(value),
              };

              set_prop(partialPattern);
            }}
          />
        </>
      )}
    </>
  );
};

export const PolygonProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentPolygonId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentPolygonId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let currentSequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );
    let currentObject = currentSequence?.activePolygons.find(
      (p) => p.id === currentPolygonId
    );

    let width = currentObject?.dimensions[0];

    if (width) {
      setDefaultWidth(width);
    }

    setDefaultsSet(true);
  }, [currentPolygonId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            // disabled={loading}
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Polygon</h5>
        </div>
        <DebouncedInput
          id="polygon_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {}}
        />
        <RepeatProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentPolygonId}
          objectType={ObjectType.Polygon}
        />
      </div>
    </>
  );
};

export const TextProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentTextId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentTextId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);
  const [defaultHeight, setDefaultHeight] = useState(0);
  const [defaultContent, setDefaultContent] = useState("");

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let currentSequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );
    let currentObject = currentSequence?.activeTextItems.find(
      (p) => p.id === currentTextId
    );

    let width = currentObject?.dimensions[0];
    let height = currentObject?.dimensions[1];
    let content = currentObject?.text;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (content) {
      setDefaultContent(content);
    }

    setDefaultsSet(true);
  }, [currentTextId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            // disabled={loading}
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Text</h5>
        </div>
        <DebouncedInput
          id="text_content"
          label="Content"
          placeholder="Content"
          initialValue={defaultContent.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateTextContent(editor, currentTextId, value);
          }}
        />
        <DebouncedInput
          id="text_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateWidth(
              editor,
              currentTextId,
              ObjectType.TextItem,
              parseInt(value)
            );
          }}
        />
        <DebouncedInput
          id="text_height"
          label="Height"
          placeholder="height"
          initialValue={defaultHeight.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateHeight(
              editor,
              currentTextId,
              ObjectType.TextItem,
              parseInt(value)
            );
          }}
        />
        <RepeatProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentTextId}
          objectType={ObjectType.TextItem}
        />
      </div>
    </>
  );
};

export const ImageProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentImageId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentImageId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let currentSequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );
    let currentObject = currentSequence?.activeImageItems.find(
      (p) => p.id === currentImageId
    );

    let width = currentObject?.dimensions[0];

    if (width) {
      setDefaultWidth(width);
    }

    setDefaultsSet(true);
  }, [currentImageId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            // disabled={loading}
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Image</h5>
        </div>
        <DebouncedInput
          id="image_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {}}
        />
        <RepeatProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentImageId}
          objectType={ObjectType.ImageItem}
        />
      </div>
    </>
  );
};

export const VideoProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentVideoId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentVideoId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);
  const [defaultHeight, setDefaultHeight] = useState(0);

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let currentSequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );
    let currentObject = currentSequence?.activeVideoItems.find(
      (p) => p.id === currentVideoId
    );

    let width = currentObject?.dimensions[0];
    let height = currentObject?.dimensions[1];

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }

    setDefaultsSet(true);
  }, [currentVideoId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            // disabled={loading}
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Video</h5>
        </div>
        <DebouncedInput
          id="video_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateWidth(
              editor,
              currentVideoId,
              ObjectType.VideoItem,
              parseInt(value)
            );
          }}
        />
        <DebouncedInput
          id="video_height"
          label="Height"
          placeholder="height"
          initialValue={defaultHeight.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateHeight(
              editor,
              currentVideoId,
              ObjectType.VideoItem,
              parseInt(value)
            );
          }}
        />
      </div>
    </>
  );
};
