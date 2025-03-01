"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DebouncedInput } from "./items";
import { colorToWgpu, Editor, rgbToWgpu, wgpuToHuman } from "@/engine/editor";
import EditorState from "@/engine/editor_state";
import { BackgroundFill, GradientStop, ObjectType } from "@/engine/animations";
import { CreateIcon } from "./icon";
import { RepeatPattern } from "@/engine/repeater";
import { saveSequencesData } from "@/fetchers/projects";
import { ColorPicker } from "./ColorPicker";
import { ColorService, IColor, useColor } from "react-color-palette";

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
  }, [currentObjectId]);

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

export const ColorProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentObjectId,
  objectType,
  defaultColor,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentObjectId: string;
  objectType: ObjectType;
  defaultColor: BackgroundFill;
}) => {
  const [color, setColor] = useColor("rgba(255, 255, 255, 1)");
  const [colorSecondary, setColorSecondary] = useColor(
    "rgba(255, 255, 255, 1)"
  );
  const [is_white, set_is_white] = useState(false);
  const [is_transparent, set_is_transparent] = useState(false);
  const [is_gradient, set_is_gradient] = useState(false);

  useEffect(() => {
    if (!color) {
      return;
    }

    if (is_gradient) {
    } else {
      if (color.rgb.a === 0.0) {
        set_is_transparent(true);
      }

      if (color.rgb.r === 255 && color.rgb.g === 255 && color.rgb.b === 255) {
        set_is_white(true);
      }
    }
  }, [currentObjectId, color]);

  useEffect(() => {
    if (!defaultColor) {
      return;
    }

    if (defaultColor.type === "Color") {
      setColor(
        ColorService.convert("rgb", {
          r: wgpuToHuman(defaultColor.value[0]),
          g: wgpuToHuman(defaultColor.value[1]),
          b: wgpuToHuman(defaultColor.value[2]),
          a: wgpuToHuman(defaultColor.value[3]),
        })
      );
    } else if (defaultColor.type === "Gradient") {
      set_is_gradient(true);

      setColor(
        ColorService.convert("rgb", {
          r: wgpuToHuman(defaultColor.value.stops[0].color[0]),
          g: wgpuToHuman(defaultColor.value.stops[0].color[1]),
          b: wgpuToHuman(defaultColor.value.stops[0].color[2]),
          a: wgpuToHuman(defaultColor.value.stops[0].color[3]),
        })
      );
      setColorSecondary(
        ColorService.convert("rgb", {
          r: wgpuToHuman(defaultColor.value.stops[1].color[0]),
          g: wgpuToHuman(defaultColor.value.stops[1].color[1]),
          b: wgpuToHuman(defaultColor.value.stops[1].color[2]),
          a: wgpuToHuman(defaultColor.value.stops[1].color[3]),
        })
      );
    }
  }, [defaultColor]);

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    if (defaultColor.type === "Color") {
      // console.info("check ", wgpuToHuman(defaultColor.value[3]), color.rgb.a);
      if (
        wgpuToHuman(defaultColor.value[0]) !== color.rgb.r ||
        wgpuToHuman(defaultColor.value[1]) !== color.rgb.g ||
        wgpuToHuman(defaultColor.value[2]) !== color.rgb.b ||
        defaultColor.value[3] !== color.rgb.a
      ) {
        if (is_gradient) {
          let stops: GradientStop[] = [
            {
              offset: 0,
              // color: rgbToWgpu(
              //   color.rgb.r,
              //   color.rgb.g,
              //   color.rgb.b,
              //   color.rgb.a
              // ),
              color: [
                colorToWgpu(color.rgb.r),
                colorToWgpu(color.rgb.g),
                colorToWgpu(color.rgb.b),
                color.rgb.a,
              ],
            },
            {
              offset: 1,
              // color: rgbToWgpu(
              //   colorSecondary.rgb.r,
              //   colorSecondary.rgb.g,
              //   colorSecondary.rgb.b,
              //   colorSecondary.rgb.a
              // ),
              color: [
                colorToWgpu(colorSecondary.rgb.r),
                colorToWgpu(colorSecondary.rgb.g),
                colorToWgpu(colorSecondary.rgb.b),
                colorSecondary.rgb.a,
              ],
            },
          ];

          let value: BackgroundFill = {
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

          if (objectType === ObjectType.Polygon) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.TextItem,
              value
            );
          }
        } else {
          let value: BackgroundFill = {
            type: "Color",
            // value: rgbToWgpu(color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a),
            value: [
              colorToWgpu(color.rgb.r),
              colorToWgpu(color.rgb.g),
              colorToWgpu(color.rgb.b),
              color.rgb.a,
            ],
          };

          if (objectType === ObjectType.Polygon) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          }
        }
      }
    } else if (defaultColor.type === "Gradient") {
      // console.info(
      //   "check also ",
      //   wgpuToHuman(defaultColor.value.stops[0].color[3]),
      //   color.rgb.a,
      //   wgpuToHuman(defaultColor.value.stops[1].color[3]),
      //   colorSecondary.rgb.a
      // );
      if (
        wgpuToHuman(defaultColor.value.stops[0].color[0]) !== color.rgb.r ||
        wgpuToHuman(defaultColor.value.stops[0].color[1]) !== color.rgb.g ||
        wgpuToHuman(defaultColor.value.stops[0].color[2]) !== color.rgb.b ||
        defaultColor.value.stops[0].color[3] !== color.rgb.a ||
        wgpuToHuman(defaultColor.value.stops[1].color[0]) !==
          colorSecondary.rgb.r ||
        wgpuToHuman(defaultColor.value.stops[1].color[1]) !==
          colorSecondary.rgb.g ||
        wgpuToHuman(defaultColor.value.stops[1].color[2]) !==
          colorSecondary.rgb.b ||
        defaultColor.value.stops[1].color[3] !== colorSecondary.rgb.a
      ) {
        if (is_gradient) {
          let stops: GradientStop[] = [
            {
              offset: 0,
              // color: rgbToWgpu(
              //   color.rgb.r,
              //   color.rgb.g,
              //   color.rgb.b,
              //   color.rgb.a
              // ),
              color: [
                colorToWgpu(color.rgb.r),
                colorToWgpu(color.rgb.g),
                colorToWgpu(color.rgb.b),
                color.rgb.a,
              ],
            },
            {
              offset: 1,
              // color: rgbToWgpu(
              //   colorSecondary.rgb.r,
              //   colorSecondary.rgb.g,
              //   colorSecondary.rgb.b,
              //   colorSecondary.rgb.a
              // ),
              color: [
                colorToWgpu(colorSecondary.rgb.r),
                colorToWgpu(colorSecondary.rgb.g),
                colorToWgpu(colorSecondary.rgb.b),
                colorSecondary.rgb.a,
              ],
            },
          ];

          let value: BackgroundFill = {
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

          if (objectType === ObjectType.Polygon) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.TextItem,
              value
            );
          }
        } else {
          let value: BackgroundFill = {
            type: "Color",
            // value: rgbToWgpu(color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a),
            value: [
              colorToWgpu(color.rgb.r),
              colorToWgpu(color.rgb.g),
              colorToWgpu(color.rgb.b),
              color.rgb.a,
            ],
          };

          if (objectType === ObjectType.Polygon) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            editorState.updateBackground(
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          }
        }
      }
    }
  }, [color, colorSecondary]);

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <input
          type="checkbox"
          id="is_gradient"
          name="is_gradient"
          checked={is_gradient}
          onChange={(ev) => {
            set_is_gradient(true);
          }}
        />
        <label htmlFor="is_gradient" className="text-xs">
          Is Gradient
        </label>
      </div>

      <ColorPicker label="Select Color" color={color} setColor={setColor} />

      {is_gradient && (
        <ColorPicker
          label="Select Secondary Color"
          color={colorSecondary}
          setColor={setColorSecondary}
        />
      )}

      <div className="flex flex-row gap-2">
        <input
          type="checkbox"
          id="is_white"
          name="is_white"
          checked={is_white}
          onChange={(ev) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;
            if (!editorState || !editor) {
              return;
            }

            if (ev.target.checked) {
              let value: BackgroundFill = {
                type: "Color",
                value: rgbToWgpu(255, 255, 255, 255),
              };

              editorState.updateBackground(
                editor,
                currentObjectId,
                objectType,
                value
              );
            } else {
              let value: BackgroundFill = {
                type: "Color",
                value: rgbToWgpu(200, 200, 200, 255),
              };

              editorState.updateBackground(
                editor,
                currentObjectId,
                objectType,
                value
              );
            }

            set_is_white(ev.target.checked);
          }}
        />
        <label htmlFor="is_white" className="text-xs">
          Is White
        </label>
        <input
          type="checkbox"
          id="is_transparent"
          name="is_transparent"
          checked={is_transparent}
          onChange={(ev) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;
            if (!editorState || !editor) {
              return;
            }

            if (ev.target.checked) {
              let value: BackgroundFill = {
                type: "Color",
                value: rgbToWgpu(255, 255, 255, 0),
              };

              editorState.updateBackground(
                editor,
                currentObjectId,
                objectType,
                value
              );
            } else {
              let value: BackgroundFill = {
                type: "Color",
                value: rgbToWgpu(200, 200, 200, 255),
              };

              editorState.updateBackground(
                editor,
                currentObjectId,
                objectType,
                value
              );
            }

            set_is_white(ev.target.checked);
          }}
        />
        <label htmlFor="is_transparent" className="text-xs">
          Is Transparent
        </label>
      </div>
    </div>
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
  const [defaultHeight, setDefaultHeight] = useState(0);
  const [defaultBorderRadius, setDefaultBorderRadius] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [is_circle, set_is_circle] = useState(false);
  const [defaultFill, setDefaultFill] = useState<BackgroundFill | null>(null);

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
    let height = currentObject?.dimensions[1];
    let borderRadius = currentObject?.borderRadius;
    let isCircle = currentObject?.isCircle;
    let positionX = currentObject?.position.x;
    let positionY = currentObject?.position.y;
    let backgroundFill = currentObject?.backgroundFill;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (borderRadius) {
      setDefaultBorderRadius(borderRadius);
    }
    if (typeof isCircle !== "undefined" && isCircle !== null) {
      set_is_circle(isCircle);
    }
    if (positionX) {
      setPositionX(positionX);
    }
    if (positionY) {
      setPositionY(positionY);
    }
    if (backgroundFill) {
      setDefaultFill(backgroundFill);
    }

    setDefaultsSet(true);
  }, [currentPolygonId]);

  if (!defaultsSet) {
    return <></>;
  }

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

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
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="polygon_x"
            label="X"
            placeholder="X"
            initialValue={positionX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              editorState.updatePositionX(
                editor,
                currentPolygonId,
                ObjectType.Polygon,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="polygon_y"
            label="Y"
            placeholder="Y"
            initialValue={positionY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              editorState.updatePositionY(
                editor,
                currentPolygonId,
                ObjectType.Polygon,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="polygon_width"
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
                currentPolygonId,
                ObjectType.Polygon,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="polygon_height"
            label="Height"
            placeholder="Height"
            initialValue={defaultHeight.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              editorState.updateHeight(
                editor,
                currentPolygonId,
                ObjectType.Polygon,
                parseInt(value)
              );
            }}
          />
        </div>
        <DebouncedInput
          id="polygon_border_radius"
          label="Border Radius"
          placeholder="Border Radius"
          initialValue={defaultBorderRadius.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateBorderRadius(
              editor,
              currentPolygonId,
              ObjectType.Polygon,
              parseInt(value)
            );
          }}
        />
        <input
          type="checkbox"
          id="is_circle"
          name="is_circle"
          checked={is_circle}
          onChange={(ev) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateIsCircle(
              editor,
              currentPolygonId,
              ObjectType.Polygon,
              ev.target.checked
            );

            set_is_circle(ev.target.checked);
          }}
        />
        <label htmlFor="is_circle" className="text-xs">
          Is Circle
        </label>
        <ColorProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentPolygonId}
          objectType={ObjectType.Polygon}
          defaultColor={defaultFill as BackgroundFill}
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
  const [is_circle, set_is_circle] = useState(false);
  const [defaultFill, setDefaultFill] = useState<BackgroundFill | null>(null);

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
    let isCircle = currentObject?.isCircle;
    let backgroundFill = currentObject?.backgroundFill;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (content) {
      setDefaultContent(content);
    }
    if (typeof isCircle !== "undefined" && isCircle !== null) {
      set_is_circle(isCircle);
    }
    if (backgroundFill) {
      setDefaultFill(backgroundFill);
    }

    setDefaultsSet(true);
  }, [currentTextId]);

  if (!defaultsSet) {
    return <></>;
  }

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

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
        <div className="flex flex-row gap-2">
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

              console.info("double call?");

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

              console.info("height debounce");

              editorState.updateHeight(
                editor,
                currentTextId,
                ObjectType.TextItem,
                parseInt(value)
              );
            }}
          />
        </div>
        {/* <DebouncedInput
          id="text_border_radius"
          label="Border Radius"
          placeholder="Border Radius"
          initialValue={defaultHeight.toString()}
          onDebounce={(value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            // editorState.updateHeight(
            //   editor,
            //   currentTextId,
            //   ObjectType.TextItem,
            //   parseInt(value)
            // );
          }}
        /> */}
        <input
          type="checkbox"
          id="is_circle"
          name="is_circle"
          checked={is_circle}
          onChange={(ev) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateIsCircle(
              editor,
              currentTextId,
              ObjectType.TextItem,
              ev.target.checked
            );

            set_is_circle(ev.target.checked);
          }}
        />
        <label htmlFor="is_circle" className="text-xs">
          Is Circle
        </label>
        <ColorProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentTextId}
          objectType={ObjectType.Polygon}
          defaultColor={defaultFill as BackgroundFill}
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
  const [defaultHeight, setDefaultHeight] = useState(0);
  const [is_circle, set_is_circle] = useState(false);

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
    let height = currentObject?.dimensions[1];
    let isCircle = currentObject?.isCircle;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (typeof isCircle !== "undefined" && isCircle !== null) {
      set_is_circle(isCircle);
    }

    setDefaultsSet(true);
  }, [currentImageId]);

  if (!defaultsSet) {
    return <></>;
  }

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

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
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="image_width"
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
                currentImageId,
                ObjectType.ImageItem,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="image_height"
            label="Height"
            placeholder="Height"
            initialValue={defaultHeight.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              editorState.updateHeight(
                editor,
                currentImageId,
                ObjectType.ImageItem,
                parseInt(value)
              );
            }}
          />
        </div>
        <input
          type="checkbox"
          id="is_circle"
          name="is_circle"
          checked={is_circle}
          onChange={(ev) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            editorState.updateIsCircle(
              editor,
              currentImageId,
              ObjectType.ImageItem,
              ev.target.checked
            );

            set_is_circle(ev.target.checked);
          }}
        />
        <label htmlFor="is_circle" className="text-xs">
          Is Circle
        </label>
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

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

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
        <div className="flex flex-row gap-2">
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
        <p>Apply Animations</p>
        <button
          className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
          onClick={async () => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editorState || !editor) {
              return;
            }

            let currentSequence = editorState.savedState.sequences.find(
              (s) => s.id === currentSequenceId
            );

            if (!currentSequence || !currentSequence?.polygonMotionPaths) {
              return;
            }

            let current_animation_data =
              currentSequence?.polygonMotionPaths.find(
                (p) => p.polygonId === currentVideoId
              );

            if (!current_animation_data) {
              return;
            }

            let newAnimationData = editorState.save_pulse_keyframes(
              currentVideoId,
              ObjectType.VideoItem,
              current_animation_data
            );

            editorState.savedState.sequences.forEach((s) => {
              if (s.id == currentSequenceId) {
                if (s.polygonMotionPaths) {
                  let currentIndex = s.polygonMotionPaths.findIndex(
                    (p) => p.id === current_animation_data.id
                  );
                  s.polygonMotionPaths[currentIndex] = newAnimationData;
                }
              }
            });

            let sequences = editorState.savedState.sequences;

            await saveSequencesData(sequences, editorState.saveTarget);
          }}
        >
          Apply Pulse
        </button>
      </div>
    </>
  );
};

export const KeyframeProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  selectedKeyframe,
  setRefreshTimeline,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  selectedKeyframe: string;
  setRefreshTimeline: Dispatch<SetStateAction<number>>;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let editor = editorRef.current;
    let editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    let sequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );

    if (!sequence || !sequence.polygonMotionPaths) {
      return;
    }

    let keyframeData = sequence.polygonMotionPaths
      .flatMap((p) => p.properties)
      .flatMap((p) => p.keyframes)
      .find((k) => k.id === selectedKeyframe);

    if (!keyframeData) {
      return;
    }

    setTime(keyframeData.time);

    setDefaultsSet(true);
  }, [selectedKeyframe]);

  if (!defaultsSet) {
    return <></>;
  }

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            // disabled={loading}
            // onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Keyframe</h5>
        </div>
        <DebouncedInput
          id="keyframe_time"
          label="Time"
          placeholder="Time"
          key={"keyframe_time" + time.toString()}
          initialValue={time.toString()}
          onDebounce={async (value) => {
            let editor = editorRef.current;
            let editorState = editorStateRef.current;

            if (!editor || !editorState) {
              return;
            }

            let sequence = editorState.savedState.sequences.find(
              (s) => s.id === currentSequenceId
            );

            if (!sequence || !sequence.polygonMotionPaths) {
              return;
            }

            let keyframeData = sequence.polygonMotionPaths
              .flatMap((p) => p.properties)
              .flatMap((p) => p.keyframes)
              .find((k) => k.id === selectedKeyframe);

            if (!keyframeData) {
              return;
            }

            keyframeData.time = parseInt(value);

            await saveSequencesData(
              editorState.savedState.sequences,
              editorState.saveTarget
            );

            setRefreshTimeline(Date.now());
          }}
        />
      </div>
    </>
  );
};
