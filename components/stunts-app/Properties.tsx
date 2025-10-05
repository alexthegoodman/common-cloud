"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DebouncedInput, DebouncedTextarea } from "./items";
import {
  colorToWgpu,
  Editor,
  rgbToWgpu,
  TEXT_BACKGROUNDS_DEFAULT_HIDDEN,
  wgpuToHuman,
} from "@/engine/editor";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import {
  BackgroundFill,
  GradientStop,
  ObjectType,
  UIKeyframe,
  EasingType,
} from "@/engine/animations";
import { CreateIcon } from "./icon";
import { RepeatPattern } from "@/engine/repeater";
import { saveSequencesData } from "@/fetchers/projects";
import { ColorPicker } from "./ColorPicker";
import { ColorService, IColor, useColor } from "react-color-palette";
import { update_keyframe } from "./VideoEditor";
import {
  updateBackground,
  updateBorderRadius,
  updateFontFamily,
  updateFontSize,
  updateHeight,
  updateHiddenBackground,
  updateIsCircle,
  updatePositionX,
  updatePositionY,
  updateTextContent,
  updateWidth,
  updateTextAnimation,
  removeTextAnimation,
  updateCube3DWidth,
  updateCube3DHeight,
  updateCube3DDepth,
  updateCube3DRotationX,
  updateCube3DRotationY,
  updateCube3DRotationZ,
  updateSphere3DRadius,
  updateSphere3DRotationX,
  updateSphere3DRotationY,
  updateSphere3DRotationZ,
  updateMockup3DWidth,
  updateMockup3DHeight,
  updateMockup3DDepth,
  updateMockup3DRotationX,
  updateMockup3DRotationY,
  updateMockup3DRotationZ,
} from "@/engine/state/properties";
import {
  remove_position_keyframes,
  save_bouncing_ball_keyframes,
  save_circular_motion_keyframes,
  save_figure_eight_keyframes,
  save_floating_bubbles_keyframes,
  save_pendulum_swing_keyframes,
  save_perspective_x_keyframes,
  save_perspective_y_keyframes,
  save_configurable_perspective_keyframes,
  save_pulse_keyframes,
  save_scale_fade_pulse_keyframes,
  ScaleFadePulseConfig,
  save_ripple_effect_keyframes,
  save_spiral_motion_keyframes,
  save_spin_keyframes,
} from "@/engine/state/keyframes";
import { TextAnimationManager } from "@/engine/textAnimationManager";
import {
  TextAnimationType,
  TextAnimationTiming,
  createTextAnimationPreset,
} from "@/engine/textAnimator";

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
      gpuResources.device!,
      gpuResources.queue!,
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
            gpuResources?.device!,
            gpuResources?.queue!,
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
            updateBackground(
              editorState,
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            updateBackground(
              editorState,
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
            updateBackground(
              editorState,
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            updateBackground(
              editorState,
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
            updateBackground(
              editorState,
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            updateBackground(
              editorState,
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
            updateBackground(
              editorState,
              editor,
              currentObjectId,
              ObjectType.Polygon,
              value
            );
          } else if (objectType === ObjectType.TextItem) {
            updateBackground(
              editorState,
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

              updateBackground(
                editorState,
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

              updateBackground(
                editorState,
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

              updateBackground(
                editorState,
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

              updateBackground(
                editorState,
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

              updatePositionX(
                editorState,
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

              updatePositionY(
                editorState,
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

              updateWidth(
                editorState,
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

              updateHeight(
                editorState,
                editor,
                currentPolygonId,
                ObjectType.Polygon,
                parseInt(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentPolygonId}
          objectType={ObjectType.Polygon}
        />
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

            updateBorderRadius(
              editorState,
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

            updateIsCircle(
              editorState,
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

const TextAnimationProperties = ({
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  const animationManager = new TextAnimationManager();
  const categories = [
    "Viral",
    "Professional",
    "Stylish",
    "Dynamic",
    "Colorful",
  ];

  useEffect(() => {
    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) {
      return;
    }

    const currentSequence = editorState.savedState.sequences.find(
      (s) => s.id === currentSequenceId
    );
    const currentObject = currentSequence?.activeTextItems.find(
      (p) => p.id === currentTextId
    );

    const textAnimation = currentObject?.textAnimation;

    if (textAnimation?.id) {
      // Extract template ID from the animation config ID
      // Animation IDs are like "viral-typewriter-1234567890"
      const templateId = textAnimation.id.split("-").slice(0, -1).join("-");
      setSelectedTemplate(templateId);
    } else {
      setSelectedTemplate(null);
    }
  }, [currentTextId, currentSequenceId]);

  const getTemplatesByCategory = (category: string) => {
    switch (category) {
      case "Viral":
        return animationManager.getViralTemplates();
      case "Professional":
        return animationManager.getProfessionalTemplates();
      case "Stylish":
        return animationManager.getStylishTemplates();
      case "Dynamic":
        return animationManager.getDynamicTemplates();
      case "Colorful":
        return animationManager.getColorfulTemplates();
      default:
        return animationManager.getTemplates();
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) return;

    setSelectedTemplate(templateId);
    updateTextAnimation(editorState, editor, currentTextId, templateId);
  };

  const handleRemove = () => {
    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) return;

    setSelectedTemplate(null);
    removeTextAnimation(editorState, editor, currentTextId);
  };

  return (
    <div className="mt-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-sm font-medium">Text Animations</h6>
        <div className="flex gap-2">
          {selectedTemplate && (
            <button
              onClick={handleRemove}
              className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Remove
            </button>
          )}
          {/* <button
            onClick={() => setShowPanel(!showPanel)}
            className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
          >
            {showPanel ? "Hide" : "Show"}
          </button> */}
        </div>
      </div>

      {showPanel && (
        <div className="space-y-2">
          <div className="space-y-2">
            {categories.map((category) => (
              <details
                key={category}
                className="border border-gray-300 rounded"
              >
                <summary className="cursor-pointer px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200">
                  {category}
                </summary>
                <div className="p-2 space-y-1">
                  {getTemplatesByCategory(category).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                        selectedTemplate === template.id
                          ? "bg-red-500 text-white"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs opacity-75">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
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
  const [hidden_background, set_hidden_background] = useState(
    TEXT_BACKGROUNDS_DEFAULT_HIDDEN
  );
  const [defaultFill, setDefaultFill] = useState<BackgroundFill | null>(null);
  const [fontSize, setFontSize] = useState(28);
  const [fontFamily, setFontFamily] = useState("Aleo");
  const [showTextProps, setShowTextProps] = useState(false);

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
    let hiddenBackground = currentObject?.hiddenBackground;
    let backgroundFill = currentObject?.backgroundFill;
    let fontSize = currentObject?.fontSize;
    let fontFamily = currentObject?.fontFamily;

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
    if (typeof hiddenBackground !== "undefined" && hiddenBackground !== null) {
      set_hidden_background(hiddenBackground);
    }
    if (backgroundFill) {
      setDefaultFill(backgroundFill);
    }
    if (fontSize) {
      setFontSize(fontSize);
    }
    if (fontFamily) {
      setFontFamily(fontFamily);
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
      <div className="w-full">
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

        <button
          className="text-xs rounded-md text-white stunts-gradient px-2 py-1 w-full mb-3"
          onClick={() => setShowTextProps(!showTextProps)}
        >
          Show Text Properties
        </button>
        {showTextProps ? (
          <section>
            <DebouncedInput
              id="text_font_size"
              label="Font Size"
              placeholder="Font Size"
              initialValue={fontSize.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                console.info("double call?");

                updateFontSize(
                  editorState,
                  editor,
                  currentTextId,
                  ObjectType.TextItem,
                  parseInt(value)
                );
              }}
            />
            <div className="flex flex-col gap-1 mb-2">
              <label htmlFor="font_family" className="text-xs">
                Font Family
              </label>
              <select
                id="font_family"
                name="font_family"
                value={fontFamily}
                onChange={async (ev) => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  const newFontFamily = ev.target.value;
                  setFontFamily(newFontFamily);

                  await updateFontFamily(
                    editorState,
                    editor,
                    currentTextId,
                    newFontFamily
                  );
                }}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
                style={{ fontFamily: fontFamily }}
              >
                <option value="Actor" style={{ fontFamily: "Actor" }}>
                  Actor
                </option>
                <option value="Aladin" style={{ fontFamily: "Aladin" }}>
                  Aladin
                </option>
                <option value="Aleo" style={{ fontFamily: "Aleo" }}>
                  Aleo
                </option>
                <option value="Amiko" style={{ fontFamily: "Amiko" }}>
                  Amiko
                </option>
                <option value="Ballet" style={{ fontFamily: "Ballet" }}>
                  Ballet
                </option>
                <option value="Basic" style={{ fontFamily: "Basic" }}>
                  Basic
                </option>
                <option value="Bungee" style={{ fontFamily: "Bungee" }}>
                  Bungee
                </option>
                <option value="Caramel" style={{ fontFamily: "Caramel" }}>
                  Caramel
                </option>
                <option value="Cherish" style={{ fontFamily: "Cherish" }}>
                  Cherish
                </option>
                <option value="Coda" style={{ fontFamily: "Coda" }}>
                  Coda
                </option>
                <option
                  value="David Libre"
                  style={{ fontFamily: "David Libre" }}
                >
                  David Libre
                </option>
                <option value="Dorsa" style={{ fontFamily: "Dorsa" }}>
                  Dorsa
                </option>
                <option value="Duru Sans" style={{ fontFamily: "Duru Sans" }}>
                  Duru Sans
                </option>
                <option value="Dynalight" style={{ fontFamily: "Dynalight" }}>
                  Dynalight
                </option>
                <option value="Eater" style={{ fontFamily: "Eater" }}>
                  Eater
                </option>
                <option value="Epilogue" style={{ fontFamily: "Epilogue" }}>
                  Epilogue
                </option>
                <option value="Exo" style={{ fontFamily: "Exo" }}>
                  Exo
                </option>
                <option value="Explora" style={{ fontFamily: "Explora" }}>
                  Explora
                </option>
                <option value="Federo" style={{ fontFamily: "Federo" }}>
                  Federo
                </option>
                <option value="Figtree" style={{ fontFamily: "Figtree" }}>
                  Figtree
                </option>
                <option value="Flavors" style={{ fontFamily: "Flavors" }}>
                  Flavors
                </option>
                <option value="Galada" style={{ fontFamily: "Galada" }}>
                  Galada
                </option>
                <option value="Gantari" style={{ fontFamily: "Gantari" }}>
                  Gantari
                </option>
                <option value="Geo" style={{ fontFamily: "Geo" }}>
                  Geo
                </option>
                <option value="Glory" style={{ fontFamily: "Glory" }}>
                  Glory
                </option>
                <option
                  value="HappyMonkey"
                  style={{ fontFamily: "HappyMonkey" }}
                >
                  HappyMonkey
                </option>
                <option value="HennyPenny" style={{ fontFamily: "HennyPenny" }}>
                  HennyPenny
                </option>
                <option value="Iceberg" style={{ fontFamily: "Iceberg" }}>
                  Iceberg
                </option>
                <option value="Inika" style={{ fontFamily: "Inika" }}>
                  Inika
                </option>
                <option value="InriaSans" style={{ fontFamily: "InriaSans" }}>
                  InriaSans
                </option>
                <option value="Jaro" style={{ fontFamily: "Jaro" }}>
                  Jaro
                </option>
                <option value="Kavoon" style={{ fontFamily: "Kavoon" }}>
                  Kavoon
                </option>
                <option value="Khula" style={{ fontFamily: "Khula" }}>
                  Khula
                </option>
                <option value="Kokoro" style={{ fontFamily: "Kokoro" }}>
                  Kokoro
                </option>
                <option value="Lemon" style={{ fontFamily: "Lemon" }}>
                  Lemon
                </option>
                <option value="Lexend" style={{ fontFamily: "Lexend" }}>
                  Lexend
                </option>
                <option value="Macondo" style={{ fontFamily: "Macondo" }}>
                  Macondo
                </option>
                <option value="Maitree" style={{ fontFamily: "Maitree" }}>
                  Maitree
                </option>
                <option value="Martel" style={{ fontFamily: "Martel" }}>
                  Martel
                </option>
                <option value="Maven Pro" style={{ fontFamily: "Maven Pro" }}>
                  Maven Pro
                </option>
                <option value="Neuton" style={{ fontFamily: "Neuton" }}>
                  Neuton
                </option>
                <option value="News Cycle" style={{ fontFamily: "News Cycle" }}>
                  News Cycle
                </option>
                <option value="Nixie One" style={{ fontFamily: "Nixie One" }}>
                  Nixie One
                </option>
                <option value="Overlock" style={{ fontFamily: "Overlock" }}>
                  Overlock
                </option>
                <option value="Oxygen" style={{ fontFamily: "Oxygen" }}>
                  Oxygen
                </option>
                <option value="Play" style={{ fontFamily: "Play" }}>
                  Play
                </option>
                <option value="Quicksand" style={{ fontFamily: "Quicksand" }}>
                  Quicksand
                </option>
                <option value="Radley" style={{ fontFamily: "Radley" }}>
                  Radley
                </option>
                <option
                  value="Rethink Sans"
                  style={{ fontFamily: "Rethink Sans" }}
                >
                  Rethink Sans
                </option>
                <option value="Rosario" style={{ fontFamily: "Rosario" }}>
                  Rosario
                </option>
                <option value="Sacramento" style={{ fontFamily: "Sacramento" }}>
                  Sacramento
                </option>
                <option value="Salsa" style={{ fontFamily: "Salsa" }}>
                  Salsa
                </option>
                <option value="Scope One" style={{ fontFamily: "Scope One" }}>
                  Scope One
                </option>
                <option value="Teachers" style={{ fontFamily: "Teachers" }}>
                  Teachers
                </option>
                <option value="Underdog" style={{ fontFamily: "Underdog" }}>
                  Underdog
                </option>
                <option value="Vibes" style={{ fontFamily: "Vibes" }}>
                  Vibes
                </option>
                <option value="Vina Sans" style={{ fontFamily: "Vina Sans" }}>
                  Vina Sans
                </option>
                <option
                  value="Water Brush"
                  style={{ fontFamily: "Water Brush" }}
                >
                  Water Brush
                </option>
                <option value="Wind Song" style={{ fontFamily: "Wind Song" }}>
                  Wind Song
                </option>
                <option value="Zain" style={{ fontFamily: "Zain" }}>
                  Zain
                </option>
              </select>
            </div>
            <DebouncedTextarea
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

                updateTextContent(editorState, editor, currentTextId, value);
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

                  updateWidth(
                    editorState,
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

                  updateHeight(
                    editorState,
                    editor,
                    currentTextId,
                    ObjectType.TextItem,
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

                updateIsCircle(
                  editorState,
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
            <input
              type="checkbox"
              id="hidden_background"
              name="hidden_background"
              checked={hidden_background}
              onChange={(ev) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                updateHiddenBackground(
                  editorState,
                  editor,
                  currentTextId,
                  ev.target.checked
                );

                set_hidden_background(ev.target.checked);
              }}
            />
            <label htmlFor="hidden_background" className="text-xs">
              Hide Background
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
          </section>
        ) : (
          <></>
        )}
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentTextId}
          objectType={ObjectType.TextItem}
        />
        <TextAnimationProperties
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentTextId={currentTextId}
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
  const [defaultBorderRadius, setDefaultBorderRadius] = useState(0);

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
    let borderRadius = currentObject?.borderRadius;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (typeof isCircle !== "undefined" && isCircle !== null) {
      set_is_circle(isCircle);
    }
    if (typeof borderRadius !== "undefined" && borderRadius !== null) {
      setDefaultBorderRadius(borderRadius);
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

              updateWidth(
                editorState,
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

              updateHeight(
                editorState,
                editor,
                currentImageId,
                ObjectType.ImageItem,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="image_border_radius"
            label="Border Radius"
            placeholder="Border Radius"
            initialValue={defaultBorderRadius.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              updateBorderRadius(
                editorState,
                editor,
                currentImageId,
                ObjectType.ImageItem,
                parseFloat(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentImageId}
          objectType={ObjectType.ImageItem}
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

            updateIsCircle(
              editorState,
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
  const [defaultBorderRadius, setDefaultBorderRadius] = useState(0);

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
    let borderRadius = currentObject?.borderRadius;

    if (width) {
      setDefaultWidth(width);
    }
    if (height) {
      setDefaultHeight(height);
    }
    if (typeof borderRadius !== "undefined" && borderRadius !== null) {
      setDefaultBorderRadius(borderRadius);
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

              updateWidth(
                editorState,
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

              updateHeight(
                editorState,
                editor,
                currentVideoId,
                ObjectType.VideoItem,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="video_border_radius"
            label="Border Radius"
            placeholder="Border Radius"
            initialValue={defaultBorderRadius.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;

              if (!editorState || !editor) {
                return;
              }

              updateBorderRadius(
                editorState,
                editor,
                currentVideoId,
                ObjectType.VideoItem,
                parseFloat(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentVideoId}
          objectType={ObjectType.VideoItem}
        />
      </div>
    </>
  );
};

export const AnimationOptions = ({
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
  const [circularRadius, setCircularRadius] = useState<number>(100);
  const [circularRotation, setCircularRotation] = useState<number>(0);

  // Scale Fade Pulse animation state
  const [pulseStartScale, setPulseStartScale] = useState<number>(150);
  const [pulseTargetScale, setPulseTargetScale] = useState<number>(100);
  const [pulseRippleCount, setPulseRippleCount] = useState<number>(0);
  const [pulseRippleIntensity, setPulseRippleIntensity] = useState<number>(10);
  const [pulseDuration, setPulseDuration] = useState<number>(5000);
  const [pulseFadeIn, setPulseFadeIn] = useState<boolean>(true);
  const [pulseFadeOut, setPulseFadeOut] = useState<boolean>(false);

  // Pendulum swing animation state
  const [pendulumWidth, setPendulumWidth] = useState<number>(200);
  const [pendulumPeriods, setPendulumPeriods] = useState<number>(2);

  // Figure-8 infinity animation state
  const [figureEightWidth, setFigureEightWidth] = useState<number>(200);
  const [figureEightHeight, setFigureEightHeight] = useState<number>(100);
  const [figureEightLoops, setFigureEightLoops] = useState<number>(1);

  // Ripple effect animation state
  const [rippleMaxScale, setRippleMaxScale] = useState<number>(3);
  const [rippleCount, setRippleCount] = useState<number>(2);

  // Spiral motion animation state
  const [spiralMaxRadius, setSpiralMaxRadius] = useState<number>(150);
  const [spiralTurns, setSpiralTurns] = useState<number>(3);
  const [spiralExpanding, setSpiralExpanding] = useState<boolean>(true);

  // Bouncing ball animation state
  const [bounceHeight, setBounceHeight] = useState<number>(200);
  const [bounceCount, setBounceCount] = useState<number>(3);
  const [bounceDamping, setBounceDamping] = useState<number>(0.8);

  // Floating bubbles animation state
  const [bubbleRiseHeight, setBubbleRiseHeight] = useState<number>(300);
  const [bubbleDriftWidth, setBubbleDriftWidth] = useState<number>(50);
  const [bubbleFloatiness, setBubbleFloatiness] = useState<number>(2);

  // Perspective animation state
  const [perspectiveX, setPerspectiveX] = useState<boolean>(true);
  const [perspectiveY, setPerspectiveY] = useState<boolean>(false);
  const [perspectiveDegrees, setPerspectiveDegrees] = useState<number>(20);
  const [perspectiveFadeIn, setPerspectiveFadeIn] = useState<boolean>(true);
  const [perspectiveFadeOut, setPerspectiveFadeOut] = useState<boolean>(true);
  const [perspectiveAnimateTo, setPerspectiveAnimateTo] =
    useState<boolean>(false);

  // Spin animation state
  const [spinAxisX, setSpinAxisX] = useState<boolean>(false);
  const [spinAxisY, setSpinAxisY] = useState<boolean>(false);
  const [spinAxisZ, setSpinAxisZ] = useState<boolean>(true);
  const [spinRotations, setSpinRotations] = useState<number>(1);
  const [spinDuration, setSpinDuration] = useState<number>(5000);

  const [showProceduralAnimations, setShowProceduralAnimations] =
    useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2">
      <p>Apply Animations</p>

      <button
        className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
        onClick={() => setShowProceduralAnimations(!showProceduralAnimations)}
      >
        View Procedural Animations
      </button>
      {showProceduralAnimations ? (
        <section className="flex flex-col gap-2 p-2 border rounded">
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
                  (p) => p.polygonId === currentObjectId
                );

              if (!current_animation_data) {
                return;
              }

              let newAnimationData = remove_position_keyframes(
                editorState,
                currentObjectId,
                objectType,
                current_animation_data
              );

              let sequence_cloned = null;

              editorState.savedState.sequences.forEach((s) => {
                if (s.id == currentSequenceId) {
                  sequence_cloned = s;

                  if (s.polygonMotionPaths) {
                    let currentIndex = s.polygonMotionPaths.findIndex(
                      (p) => p.id === current_animation_data.id
                    );
                    s.polygonMotionPaths[currentIndex] = newAnimationData;
                  }
                }
              });

              if (!sequence_cloned) {
                return;
              }

              let sequences = editorState.savedState.sequences;

              await saveSequencesData(sequences, editorState.saveTarget);

              // update motion path preview
              editor.updateMotionPaths(sequence_cloned);
            }}
          >
            Remove Position Keyframes
          </button>

          {/** Perspective Animation Panel */}
          <div className="flex flex-col gap-2 p-2 border rounded">
            <p className="text-xs font-semibold">Perspective Animation</p>

            <div className="flex flex-row gap-3">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={perspectiveX}
                  onChange={(e) => setPerspectiveX(e.target.checked)}
                />
                X Axis (top/bottom)
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={perspectiveY}
                  onChange={(e) => setPerspectiveY(e.target.checked)}
                />
                Y Axis (left/right)
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Degrees:</label>
              <input
                type="number"
                value={perspectiveDegrees}
                onChange={(e) => setPerspectiveDegrees(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1"
                min="0"
                max="90"
              />
            </div>

            <div className="flex flex-row gap-3">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={perspectiveFadeIn}
                  onChange={(e) => setPerspectiveFadeIn(e.target.checked)}
                />
                Fade In
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={perspectiveFadeOut}
                  onChange={(e) => setPerspectiveFadeOut(e.target.checked)}
                />
                Fade Out
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-600">Animation Direction:</p>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="perspectiveDirection"
                  checked={!perspectiveAnimateTo}
                  onChange={() => setPerspectiveAnimateTo(false)}
                />
                Animate FROM perspective
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="perspectiveDirection"
                  checked={perspectiveAnimateTo}
                  onChange={() => setPerspectiveAnimateTo(true)}
                />
                Animate TO perspective
              </label>
            </div>

            <div className="flex flex-row gap-2">
              <button
                className="text-xs rounded-md text-white stunts-gradient px-2 py-1 flex-1"
                onClick={async () => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let currentSequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (
                    !currentSequence ||
                    !currentSequence?.polygonMotionPaths
                  ) {
                    return;
                  }

                  let current_animation_data =
                    currentSequence?.polygonMotionPaths.find(
                      (p) => p.polygonId === currentObjectId
                    );

                  if (!current_animation_data) {
                    return;
                  }

                  let newAnimationData =
                    save_configurable_perspective_keyframes(
                      editorState,
                      currentObjectId,
                      objectType,
                      current_animation_data,
                      {
                        applyX: perspectiveX,
                        applyY: perspectiveY,
                        degrees: perspectiveDegrees,
                        fadeIn: perspectiveFadeIn,
                        fadeOut: perspectiveFadeOut,
                        animateTo: perspectiveAnimateTo,
                      }
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
                Apply Perspective Animation
              </button>
              <button
                className="text-xs rounded-md bg-gray-500 hover:bg-gray-600 text-white px-2 py-1"
                onClick={async () => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let currentSequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (
                    !currentSequence ||
                    !currentSequence?.polygonMotionPaths
                  ) {
                    return;
                  }

                  let current_animation_data =
                    currentSequence?.polygonMotionPaths.find(
                      (p) => p.polygonId === currentObjectId
                    );

                  if (!current_animation_data) {
                    return;
                  }

                  // Remove perspectiveX and perspectiveY properties
                  let properties = current_animation_data.properties.filter(
                    (p) =>
                      p.propertyPath !== "perspectiveX" &&
                      p.propertyPath !== "perspectiveY"
                  );

                  let newAnimationData = {
                    ...current_animation_data,
                    properties: properties,
                  };

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
                Clear Perspective
              </button>
            </div>
          </div>

          {/** Spin Animation Panel */}
          <div className="flex flex-col gap-2 p-2 border rounded">
            <p className="text-xs font-semibold">Spin Animation</p>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-600">Spin Axes:</p>
              <div className="flex flex-row gap-3">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={spinAxisX}
                    onChange={(e) => setSpinAxisX(e.target.checked)}
                  />
                  X Axis (vertical)
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={spinAxisY}
                    onChange={(e) => setSpinAxisY(e.target.checked)}
                  />
                  Y Axis (horizontal)
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={spinAxisZ}
                    onChange={(e) => setSpinAxisZ(e.target.checked)}
                  />
                  Z Axis (roll)
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Rotations:</label>
              <input
                type="number"
                value={spinRotations}
                onChange={(e) => setSpinRotations(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1"
                min="0.25"
                max="10"
                step="0.25"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Duration (ms):</label>
              <input
                type="number"
                value={spinDuration}
                onChange={(e) => setSpinDuration(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1"
                min="500"
                max="20000"
                step="100"
              />
            </div>

            <div className="flex flex-row gap-2">
              <button
                className="text-xs rounded-md text-white stunts-gradient px-2 py-1 flex-1"
                onClick={async () => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let currentSequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (
                    !currentSequence ||
                    !currentSequence?.polygonMotionPaths
                  ) {
                    return;
                  }

                  let current_animation_data =
                    currentSequence?.polygonMotionPaths.find(
                      (p) => p.polygonId === currentObjectId
                    );

                  if (!current_animation_data) {
                    return;
                  }

                  let newAnimationData = save_spin_keyframes(
                    editorState,
                    currentObjectId,
                    objectType,
                    current_animation_data,
                    {
                      spinX: spinAxisX,
                      spinY: spinAxisY,
                      spinZ: spinAxisZ,
                      rotations: spinRotations,
                      duration: spinDuration,
                    }
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
                Create Spin
              </button>
              <button
                className="text-xs rounded-md bg-gray-500 hover:bg-gray-600 text-white px-2 py-1"
                onClick={async () => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let currentSequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (
                    !currentSequence ||
                    !currentSequence?.polygonMotionPaths
                  ) {
                    return;
                  }

                  let current_animation_data =
                    currentSequence?.polygonMotionPaths.find(
                      (p) => p.polygonId === currentObjectId
                    );

                  if (!current_animation_data) {
                    return;
                  }

                  // Remove spin-related properties
                  let properties = current_animation_data.properties.filter(
                    (p) =>
                      p.propertyPath !== "perspectiveX" &&
                      p.propertyPath !== "perspectiveY" &&
                      p.propertyPath !== "rotation"
                  );

                  let newAnimationData = {
                    ...current_animation_data,
                    properties: properties,
                  };

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
                Clear Spin
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t pt-2 mt-2">
            <h3 className="text-xs font-semibold text-gray-700">
              Scale & Fade Pulse
            </h3>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600 w-24">Start Scale:</label>
              <input
                type="number"
                value={pulseStartScale}
                onChange={(e) => setPulseStartScale(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="10"
                max="500"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600 w-24">
                Target Scale:
              </label>
              <input
                type="number"
                value={pulseTargetScale}
                onChange={(e) => setPulseTargetScale(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="10"
                max="500"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600 w-24">Ripples:</label>
              <input
                type="number"
                value={pulseRippleCount}
                onChange={(e) => setPulseRippleCount(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="0"
                max="5"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600 w-24">
                Ripple Intensity:
              </label>
              <input
                type="number"
                value={pulseRippleIntensity}
                onChange={(e) =>
                  setPulseRippleIntensity(Number(e.target.value))
                }
                className="text-xs border rounded px-2 py-1 w-16"
                min="0"
                max="50"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600 w-24">Duration:</label>
              <input
                type="number"
                value={pulseDuration}
                onChange={(e) => setPulseDuration(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-20"
                min="500"
                max="20000"
                step="500"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
            <div className="flex flex-row items-center gap-4">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={pulseFadeIn}
                  onChange={(e) => setPulseFadeIn(e.target.checked)}
                  className="rounded"
                />
                Fade In
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={pulseFadeOut}
                  onChange={(e) => setPulseFadeOut(e.target.checked)}
                  className="rounded"
                />
                Fade Out
              </label>
            </div>
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
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                const config: ScaleFadePulseConfig = {
                  startScale: pulseStartScale,
                  targetScale: pulseTargetScale,
                  rippleCount: pulseRippleCount,
                  rippleIntensity: pulseRippleIntensity,
                  durationMs: pulseDuration,
                  fadeIn: pulseFadeIn,
                  fadeOut: pulseFadeOut,
                };

                let newAnimationData = save_scale_fade_pulse_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  config
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
              Apply Scale & Fade Pulse
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Radius:</label>
              <input
                type="number"
                value={circularRadius}
                onChange={(e) => setCircularRadius(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="1000"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Rotation:</label>
              <input
                type="number"
                value={circularRotation}
                onChange={(e) => setCircularRotation(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="0"
                max="360"
              />
              <span className="text-xs text-gray-500">°</span>
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_circular_motion_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  circularRadius,
                  circularRotation
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Circle
            </button>
          </div>

          {/* Pendulum Swing Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Swing Width:</label>
              <input
                type="number"
                value={pendulumWidth}
                onChange={(e) => setPendulumWidth(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="10"
                max="500"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Periods:</label>
              <input
                type="number"
                value={pendulumPeriods}
                onChange={(e) => setPendulumPeriods(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="10"
                step="0.5"
              />
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_pendulum_swing_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  pendulumWidth,
                  pendulumPeriods
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Pendulum Swing
            </button>
          </div>

          {/* Figure-8 Infinity Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Width:</label>
              <input
                type="number"
                value={figureEightWidth}
                onChange={(e) => setFigureEightWidth(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="50"
                max="500"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Height:</label>
              <input
                type="number"
                value={figureEightHeight}
                onChange={(e) => setFigureEightHeight(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="25"
                max="300"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Loops:</label>
              <input
                type="number"
                value={figureEightLoops}
                onChange={(e) => setFigureEightLoops(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="5"
              />
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_figure_eight_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  figureEightWidth,
                  figureEightHeight,
                  figureEightLoops
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Figure-8 Infinity
            </button>
          </div>

          {/* Ripple Effect Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Max Scale:</label>
              <input
                type="number"
                value={rippleMaxScale}
                onChange={(e) => setRippleMaxScale(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1.5"
                max="10"
                step="0.5"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Ripples:</label>
              <input
                type="number"
                value={rippleCount}
                onChange={(e) => setRippleCount(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="5"
              />
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_ripple_effect_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  rippleMaxScale,
                  rippleCount
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Ripple Effect
            </button>
          </div>

          {/* Spiral Motion Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Max Radius:</label>
              <input
                type="number"
                value={spiralMaxRadius}
                onChange={(e) => setSpiralMaxRadius(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="50"
                max="400"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Turns:</label>
              <input
                type="number"
                value={spiralTurns}
                onChange={(e) => setSpiralTurns(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="10"
                step="0.5"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Type:</label>
              <select
                value={spiralExpanding ? "expanding" : "contracting"}
                onChange={(e) =>
                  setSpiralExpanding(e.target.value === "expanding")
                }
                className="text-xs border rounded px-2 py-1 w-24"
              >
                <option value="expanding">Expanding</option>
                <option value="contracting">Contracting</option>
              </select>
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_spiral_motion_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  spiralMaxRadius,
                  spiralTurns,
                  spiralExpanding ? "outward" : "inward"
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Spiral Motion
            </button>
          </div>

          {/* Bouncing Ball Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Bounce Height:</label>
              <input
                type="number"
                value={bounceHeight}
                onChange={(e) => setBounceHeight(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="50"
                max="500"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Bounces:</label>
              <input
                type="number"
                value={bounceCount}
                onChange={(e) => setBounceCount(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="10"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Damping:</label>
              <input
                type="number"
                value={bounceDamping}
                onChange={(e) => setBounceDamping(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="0.1"
                max="1.0"
                step="0.1"
              />
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_bouncing_ball_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  bounceHeight,
                  bounceCount,
                  bounceDamping
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Bouncing Ball
            </button>
          </div>

          {/* Floating Bubbles Animation */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Rise Height:</label>
              <input
                type="number"
                value={bubbleRiseHeight}
                onChange={(e) => setBubbleRiseHeight(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="100"
                max="600"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Drift Width:</label>
              <input
                type="number"
                value={bubbleDriftWidth}
                onChange={(e) => setBubbleDriftWidth(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="10"
                max="200"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs text-gray-600">Floatiness:</label>
              <input
                type="number"
                value={bubbleFloatiness}
                onChange={(e) => setBubbleFloatiness(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-16"
                min="1"
                max="5"
                step="0.5"
              />
            </div>
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

                let currentObject = null;
                switch (objectType) {
                  case ObjectType.Polygon:
                    currentObject = currentSequence.activePolygons.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.TextItem:
                    currentObject = currentSequence.activeTextItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.ImageItem:
                    currentObject = currentSequence.activeImageItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                  case ObjectType.VideoItem:
                    currentObject = currentSequence.activeVideoItems.find(
                      (p) => p.id === currentObjectId
                    );
                    break;
                }

                let current_animation_data =
                  currentSequence?.polygonMotionPaths.find(
                    (p) => p.polygonId === currentObjectId
                  );

                if (!current_animation_data) {
                  return;
                }

                let newAnimationData = save_floating_bubbles_keyframes(
                  editorState,
                  currentObjectId,
                  objectType,
                  current_animation_data,
                  [
                    currentObject?.position.x || 0,
                    currentObject?.position.y || 0,
                  ],
                  bubbleRiseHeight,
                  bubbleDriftWidth
                  // bubbleFloatiness
                );

                let sequence_cloned = null;

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    sequence_cloned = s;

                    if (s.polygonMotionPaths) {
                      let currentIndex = s.polygonMotionPaths.findIndex(
                        (p) => p.id === current_animation_data.id
                      );
                      s.polygonMotionPaths[currentIndex] = newAnimationData;
                    }
                  }
                });

                if (!sequence_cloned) {
                  return;
                }

                let sequences = editorState.savedState.sequences;

                await saveSequencesData(sequences, editorState.saveTarget);

                // update motion path preview
                editor.updateMotionPaths(sequence_cloned);
              }}
            >
              Transform Motion Path to Floating Bubbles
            </button>
          </div>
        </section>
      ) : (
        <></>
      )}
    </div>
  );
};

export const KeyframeProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  selectedKeyframe,
  setRefreshTimeline,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  selectedKeyframe: string;
  setRefreshTimeline: Dispatch<SetStateAction<number>>;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [data, setData] = useState<UIKeyframe | null>(null);

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

    setData(keyframeData);
    // setTime(keyframeData.time);
    // keyframeData.value.type

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
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Keyframe</h5>
        </div>
        <DebouncedInput
          id="keyframe_time"
          label="Time"
          placeholder="Time"
          key={"keyframe_time" + data?.time.toString()}
          initialValue={data ? data.time.toString() : ""}
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
        <div className="mt-2">
          <label htmlFor="keyframe_easing" className="text-xs font-medium">
            Easing
          </label>
          <select
            id="keyframe_easing"
            name="keyframe_easing"
            className="text-xs w-full p-1 border rounded"
            value={data?.easing || EasingType.Linear}
            onChange={async (ev) => {
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

              keyframeData.easing = ev.target.value as EasingType;

              await saveSequencesData(
                editorState.savedState.sequences,
                editorState.saveTarget
              );

              setRefreshTimeline(Date.now());
            }}
          >
            <option value={EasingType.Linear}>Linear</option>
            <option value={EasingType.EaseIn}>Ease In</option>
            <option value={EasingType.EaseOut}>Ease Out</option>
            <option value={EasingType.EaseInOut}>Ease In Out</option>
          </select>
        </div>
        {data?.value.type === "Position" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_x"
              label="X"
              placeholder="X"
              initialValue={data?.value.value[0].toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "Position") {
                  data.value.value[0] = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
            <DebouncedInput
              id="keyframe_y"
              label="Y"
              placeholder="Y"
              initialValue={data?.value.value[1].toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "Position") {
                  data.value.value[1] = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "Rotation" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_rotation"
              label="Rotation (degrees)"
              placeholder="Rotation"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "Rotation") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "ScaleX" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_scale_x"
              label="Scale X (out of 100%)"
              placeholder="Scale X"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "ScaleX") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "ScaleY" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_scale_y"
              label="Scale Y (out of 100%)"
              placeholder="Scale Y"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "ScaleY") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "Opacity" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_opacity"
              label="Opacity (out of 100%)"
              placeholder="Opacity"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "Opacity") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "Zoom" && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <DebouncedInput
                id="keyframe_zoom_x"
                label="Zoom X"
                placeholder="Zoom X"
                initialValue={data?.value.value.position[0].toString()}
                onDebounce={(value) => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let sequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (!sequence) {
                    return;
                  }

                  if (data.value.type === "Zoom") {
                    data.value.value.position[0] = parseInt(value);
                  }

                  update_keyframe(editorState, data, sequence, [
                    selectedKeyframe,
                  ]);
                }}
              />
              <DebouncedInput
                id="keyframe_zoom_y"
                label="Zoom Y"
                placeholder="Zoom Y"
                initialValue={data?.value.value.position[1].toString()}
                onDebounce={(value) => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let sequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (!sequence) {
                    return;
                  }

                  if (data.value.type === "Zoom") {
                    data.value.value.position[1] = parseInt(value);
                  }

                  update_keyframe(editorState, data, sequence, [
                    selectedKeyframe,
                  ]);
                }}
              />
            </div>
            <div className="flex flex-row gap-2">
              <DebouncedInput
                id="keyframe_zoom"
                label="Zoom Level (out of 100%)"
                placeholder="Zoom Level"
                initialValue={data?.value.value.toString()}
                onDebounce={(value) => {
                  let editor = editorRef.current;
                  let editorState = editorStateRef.current;

                  if (!editorState || !editor) {
                    return;
                  }

                  let sequence = editorState.savedState.sequences.find(
                    (s) => s.id === currentSequenceId
                  );

                  if (!sequence) {
                    return;
                  }

                  if (data.value.type === "Zoom") {
                    data.value.value.zoomLevel = parseInt(value);
                  }

                  update_keyframe(editorState, data, sequence, [
                    selectedKeyframe,
                  ]);
                }}
              />
            </div>
          </div>
        )}
        {data?.value.type === "PerspectiveX" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_perspective_x"
              label="Perspective X (out of 100%)"
              placeholder="Perspective X"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "PerspectiveX") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        {data?.value.type === "PerspectiveY" && (
          <div className="flex flex-row gap-2">
            <DebouncedInput
              id="keyframe_perspective_y"
              label="Perspective Y (out of 100%)"
              placeholder="Perspective Y"
              initialValue={data?.value.value.toString()}
              onDebounce={(value) => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editorState || !editor) {
                  return;
                }

                let sequence = editorState.savedState.sequences.find(
                  (s) => s.id === currentSequenceId
                );

                if (!sequence) {
                  return;
                }

                if (data.value.type === "PerspectiveY") {
                  data.value.value = parseInt(value);
                }

                update_keyframe(editorState, data, sequence, [
                  selectedKeyframe,
                ]);
              }}
            />
          </div>
        )}
        <button
          className="p-2 bg-red-500 text-white"
          onClick={async () => {
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

            sequence.polygonMotionPaths.forEach((pm) => {
              pm.properties.forEach((p) => {
                let updatedKeyframes: UIKeyframe[] = [];
                p.keyframes.forEach((kf) => {
                  if (kf.id !== selectedKeyframe) {
                    updatedKeyframes.push(kf);
                  }
                });

                p.keyframes = updatedKeyframes;
              });
            });

            setRefreshTimeline(Date.now());

            await saveSequencesData(
              editorState.savedState.sequences,
              editor.target
            );

            handleGoBack();
          }}
        >
          Delete Keyframe
        </button>
      </div>
    </>
  );
};

export const Cube3DProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentCubeId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentCubeId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);
  const [defaultHeight, setDefaultHeight] = useState(0);
  const [defaultDepth, setDefaultDepth] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
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
    let currentObject = currentSequence?.activeCubes3D?.find(
      (c) => c.id === currentCubeId
    );

    console.info("currentCubeId", currentObject, currentSequence);

    if (currentObject) {
      setDefaultWidth(currentObject.dimensions[0]);
      setDefaultHeight(currentObject.dimensions[1]);
      setDefaultDepth(currentObject.dimensions[2]);
      setPositionX(currentObject.position.x);
      setPositionY(currentObject.position.y);
      setRotationX(currentObject.rotation[0]);
      setRotationY(currentObject.rotation[1]);
      setRotationZ(currentObject.rotation[2]);
      setDefaultFill(currentObject.backgroundFill);
      console.info("alert ", currentObject);
    }

    setDefaultsSet(true);
  }, [currentCubeId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update 3D Cube</h5>
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="cube_x"
            label="X"
            placeholder="X"
            initialValue={positionX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionX(
                editorState,
                editor,
                currentCubeId,
                ObjectType.Cube3D,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="cube_y"
            label="Y"
            placeholder="Y"
            initialValue={positionY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionY(
                editorState,
                editor,
                currentCubeId,
                ObjectType.Cube3D,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="cube_width"
            label="Width"
            placeholder="Width"
            initialValue={defaultWidth.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DWidth(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="cube_height"
            label="Height"
            placeholder="Height"
            initialValue={defaultHeight.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DHeight(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="cube_depth"
            label="Depth"
            placeholder="Depth"
            initialValue={defaultDepth.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DDepth(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2 mt-2">
          <DebouncedInput
            id="cube_rotation_x"
            label="Rotation X"
            placeholder="Rotation X"
            initialValue={rotationX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DRotationX(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="cube_rotation_y"
            label="Rotation Y"
            placeholder="Rotation Y"
            initialValue={rotationY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DRotationY(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="cube_rotation_z"
            label="Rotation Z"
            placeholder="Rotation Z"
            initialValue={rotationZ.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateCube3DRotationZ(
                editorState,
                editor,
                currentCubeId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentCubeId}
          objectType={ObjectType.Cube3D}
        />
      </div>
    </>
  );
};

export const Sphere3DProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentSphereId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentSphereId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultRadius, setDefaultRadius] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
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
    let currentObject = currentSequence?.activeSpheres3D?.find(
      (s) => s.id === currentSphereId
    );

    if (currentObject) {
      setDefaultRadius(currentObject.radius);
      setPositionX(currentObject.position.x);
      setPositionY(currentObject.position.y);
      setRotationX(currentObject.rotation[0]);
      setRotationY(currentObject.rotation[1]);
      setRotationZ(currentObject.rotation[2]);
      setDefaultFill(currentObject.backgroundFill);
    }

    setDefaultsSet(true);
  }, [currentSphereId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update 3D Sphere</h5>
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="sphere_x"
            label="X"
            placeholder="X"
            initialValue={positionX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionX(
                editorState,
                editor,
                currentSphereId,
                ObjectType.Sphere3D,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="sphere_y"
            label="Y"
            placeholder="Y"
            initialValue={positionY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionY(
                editorState,
                editor,
                currentSphereId,
                ObjectType.Sphere3D,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="sphere_radius"
            label="Radius"
            placeholder="Radius"
            initialValue={defaultRadius.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateSphere3DRadius(
                editorState,
                editor,
                currentSphereId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2 mt-2">
          <DebouncedInput
            id="sphere_rotation_x"
            label="Rotation X"
            placeholder="Rotation X"
            initialValue={rotationX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateSphere3DRotationX(
                editorState,
                editor,
                currentSphereId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="sphere_rotation_y"
            label="Rotation Y"
            placeholder="Rotation Y"
            initialValue={rotationY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateSphere3DRotationY(
                editorState,
                editor,
                currentSphereId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="sphere_rotation_z"
            label="Rotation Z"
            placeholder="Rotation Z"
            initialValue={rotationZ.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateSphere3DRotationZ(
                editorState,
                editor,
                currentSphereId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentSphereId}
          objectType={ObjectType.Sphere3D}
        />
      </div>
    </>
  );
};

export const Mockup3DProperties = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  currentMockupId,
  handleGoBack,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  currentMockupId: string;
  handleGoBack: () => void;
}) => {
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState(0);
  const [defaultHeight, setDefaultHeight] = useState(0);
  const [defaultDepth, setDefaultDepth] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
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
    let currentObject = currentSequence?.activeMockups3D?.find(
      (m) => m.id === currentMockupId
    );

    console.info("currentMockupId", currentObject, currentSequence);

    if (currentObject) {
      setDefaultWidth(currentObject.dimensions[0]);
      setDefaultHeight(currentObject.dimensions[1]);
      setDefaultDepth(currentObject.dimensions[2]);
      setPositionX(currentObject.position.x);
      setPositionY(currentObject.position.y);
      setRotationX(currentObject.rotation[0]);
      setRotationY(currentObject.rotation[1]);
      setRotationZ(currentObject.rotation[2]);
      setDefaultFill(currentObject.backgroundFill);
      console.info("mockup loaded", currentObject);
    }

    setDefaultsSet(true);
  }, [currentMockupId]);

  if (!defaultsSet) {
    return <></>;
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center">
          <button
            className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
            onClick={() => handleGoBack()}
          >
            <CreateIcon icon="arrow-left" size="24px" />
          </button>
          <h5>Update Laptop Mockup</h5>
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="mockup_x"
            label="X"
            placeholder="X"
            initialValue={positionX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionX(
                editorState,
                editor,
                currentMockupId,
                ObjectType.Mockup3D,
                parseInt(value)
              );
            }}
          />
          <DebouncedInput
            id="mockup_y"
            label="Y"
            placeholder="Y"
            initialValue={positionY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updatePositionY(
                editorState,
                editor,
                currentMockupId,
                ObjectType.Mockup3D,
                parseInt(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <DebouncedInput
            id="mockup_width"
            label="Width"
            placeholder="Width"
            initialValue={defaultWidth.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DWidth(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="mockup_height"
            label="Height"
            placeholder="Height"
            initialValue={defaultHeight.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DHeight(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="mockup_depth"
            label="Depth"
            placeholder="Depth"
            initialValue={defaultDepth.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DDepth(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <div className="flex flex-row gap-2 mt-2">
          <DebouncedInput
            id="mockup_rotation_x"
            label="Rotation X"
            placeholder="Rotation X"
            initialValue={rotationX.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DRotationX(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="mockup_rotation_y"
            label="Rotation Y"
            placeholder="Rotation Y"
            initialValue={rotationY.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DRotationY(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
          <DebouncedInput
            id="mockup_rotation_z"
            label="Rotation Z"
            placeholder="Rotation Z"
            initialValue={rotationZ.toString()}
            onDebounce={(value) => {
              let editor = editorRef.current;
              let editorState = editorStateRef.current;
              if (!editorState || !editor) {
                return;
              }
              updateMockup3DRotationZ(
                editorState,
                editor,
                currentMockupId,
                parseFloat(value)
              );
            }}
          />
        </div>
        <AnimationOptions
          editorRef={editorRef}
          editorStateRef={editorStateRef}
          currentSequenceId={currentSequenceId}
          currentObjectId={currentMockupId}
          objectType={ObjectType.Mockup3D}
        />
      </div>
    </>
  );
};
