"use client";

import React, { useEffect, useState } from "react";
import { DebouncedInput } from "./items";
import { Editor } from "@/engine/editor";
import EditorState from "@/engine/editor_state";
import { ObjectType } from "@/engine/animations";

export const PolygonProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentPolygonId,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentPolygonId: string;
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
        <DebouncedInput
          id="polygon_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {}}
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
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentTextId: string;
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
    let currentObject = currentSequence?.activeTextItems.find(
      (p) => p.id === currentTextId
    );

    let width = currentObject?.dimensions[0];

    if (width) {
      setDefaultWidth(width);
    }

    setDefaultsSet(true);
  }, [currentTextId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <DebouncedInput
          id="text_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {}}
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
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentImageId: string;
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
        <DebouncedInput
          id="image_width"
          label="Width"
          placeholder="Width"
          initialValue={defaultWidth.toString()}
          onDebounce={(value) => {}}
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
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentVideoId: string;
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
