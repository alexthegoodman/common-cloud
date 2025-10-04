"use client";

import { v4 as uuidv4 } from "uuid";
import {
  AnimationData,
  AnimationProperty,
  capitalizeFirstLetter,
  EasingType,
  findObjectType,
  KeyframeValue,
  ObjectType,
  PathType,
  SavedState,
  UIKeyframe,
} from "@/engine/animations";
import { Editor } from "@/engine/editor";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import { TextAnimationManager } from "@/engine/textAnimationManager";
import { AuthToken, saveSequencesData } from "@/fetchers/projects";
import { Disclosure } from "@headlessui/react";
import { ArrowDown, MagicWand } from "@phosphor-icons/react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  save_adaptive_grid_keyframes,
  save_confetti_explosion_keyframes,
  save_default_keyframes,
  save_domino_cascade_keyframes,
  save_flock_formation_keyframes,
  save_fullscreen_slideshow_keyframes,
  save_gallery_wall_keyframes,
  save_maximize_showcase_keyframes,
  save_memory_carousel_keyframes,
  save_orbit_dance_keyframes,
  save_photo_mosaic_keyframes,
  save_polaroid_tumble_keyframes,
  save_ripple_wave_keyframes,
  save_scrapbook_scatter_keyframes,
  save_screen_carousel_keyframes,
  save_swarm_convergence_keyframes,
} from "@/engine/state/keyframes";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function AnimationTab({
  editorRef,
  editorStateRef,
  current_sequence_id,
  saveTarget,
  userLanguage = "en",
  selectedTextId = "",
  setRefreshTimeline,
  setSelectedTextId,
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  current_sequence_id: string;
  saveTarget: SaveTarget;
  userLanguage?: string;
  selectedTextId: string;
  setRefreshTimeline: any;
  setSelectedTextId: any;
}) {
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [loading, set_loading] = useState(false);

  // AI Animation Generation states
  let [aiAnimationPrompt, setAiAnimationPrompt] = useState("");
  let [aiAnimationDuration, setAiAnimationDuration] = useState(3000);
  let [aiAnimationStyle, setAiAnimationStyle] = useState("smooth");
  let [aiLoading, setAiLoading] = useState(false);

  // Choreographed template state
  let [confettiCenterX, setConfettiCenterX] = useState(400);
  let [confettiCenterY, setConfettiCenterY] = useState(300);
  let [confettiForce, setConfettiForce] = useState(200);
  let [confettiGravity, setConfettiGravity] = useState(300);

  let [flockStartX, setFlockStartX] = useState(200);
  let [flockStartY, setFlockStartY] = useState(200);
  let [flockTargetX, setFlockTargetX] = useState(600);
  let [flockTargetY, setFlockTargetY] = useState(400);
  let [flockSpacing, setFlockSpacing] = useState(80);

  let [rippleAmplitude, setRippleAmplitude] = useState(100);
  let [rippleSpeed, setRippleSpeed] = useState(2);

  let [orbitCenterX, setOrbitCenterX] = useState(400);
  let [orbitCenterY, setOrbitCenterY] = useState(300);
  let [orbitRadius, setOrbitRadius] = useState(100);

  let [dominoDelay, setDominoDelay] = useState(100);

  let [swarmScatterX, setSwarmScatterX] = useState(200);
  let [swarmScatterY, setSwarmScatterY] = useState(200);
  let [swarmTargetX, setSwarmTargetX] = useState(600);
  let [swarmTargetY, setSwarmTargetY] = useState(400);
  let [swarmScatterRadius, setSwarmScatterRadius] = useState(200);
  let [swarmFormRadius, setSwarmFormRadius] = useState(50);

  // Collage-style template state
  let [mosaicCenterX, setMosaicCenterX] = useState(450);
  let [mosaicCenterY, setMosaicCenterY] = useState(275);
  let [mosaicSpacing, setMosaicSpacing] = useState(120);
  let [mosaicStagger, setMosaicStagger] = useState(100);

  let [scatterDropHeight, setScatterDropHeight] = useState(-200);
  let [scatterBounce, setScatterBounce] = useState(0.3);
  let [scatterRotation, setScatterRotation] = useState(15);
  let [animationManager] = useState(() => new TextAnimationManager());

  let [galleryX, setGalleryX] = useState(100);
  let [galleryY, setGalleryY] = useState(100);
  let [galleryWidth, setGalleryWidth] = useState(700);
  let [galleryHeight, setGalleryHeight] = useState(350);
  let [galleryDelay, setGalleryDelay] = useState(200);
  let [galleryScale, setGalleryScale] = useState(true);

  let [carouselY, setCarouselY] = useState(300);
  let [carouselSpacing, setCarouselSpacing] = useState(150);
  let [carouselCurve, setCarouselCurve] = useState(50);

  let [polaroidRotation, setPolaroidRotation] = useState(45);
  let [polaroidSettle, setPolaroidSettle] = useState(0.7);

  // New Screen-Filling Animation parameters
  let [slideshowDuration, setSlideshowDuration] = useState(2000);
  let [slideshowTransition, setSlideshowTransition] = useState(500);

  let [gridCols, setGridCols] = useState(3);
  let [gridRows, setGridRows] = useState(2);
  let [gridMargin, setGridMargin] = useState(20);
  let [gridStagger, setGridStagger] = useState(150);

  let [carouselEnterDelay, setCarouselEnterDelay] = useState(200);
  let [carouselSlideSpeed, setCarouselSlideSpeed] = useState(800);

  let [showcaseScale, setShowcaseScale] = useState(0.9);
  let [showcaseStagger, setShowcaseStagger] = useState(300);

  // Helper methods for raw AnimationData manipulation (similar to MCP server)
  let findOrCreateAnimationData = (
    savedState: SavedState,
    sequenceId: string,
    objectId: string
  ): AnimationData => {
    let sequence = savedState.sequences.find((s) => s.id === sequenceId);
    if (!sequence) {
      throw new Error(`Sequence with ID ${sequenceId} not found`);
    }

    if (!sequence.polygonMotionPaths) {
      sequence.polygonMotionPaths = [];
    }

    let animationData = sequence.polygonMotionPaths.find(
      (path) => path.polygonId === objectId
    );

    if (!animationData) {
      let objectType = findObjectType(savedState, objectId);
      if (!objectType) {
        throw new Error(`Object with ID ${objectId} not found in sequence`);
      }

      animationData = {
        id: uuidv4(),
        objectType: objectType,
        polygonId: objectId,
        duration: 5000,
        startTimeMs: 0,
        properties: [],
        position: [0, 0],
      };
      sequence.polygonMotionPaths.push(animationData);
    }

    return animationData;
  };

  let findOrCreateAnimationProperty = (
    animationData: AnimationData,
    propertyName: string
  ): AnimationProperty => {
    let visibleName =
      propertyName === "ScaleX"
        ? "Scale X"
        : propertyName === "ScaleY"
        ? "Scale Y"
        : propertyName;
    let property = animationData.properties.find((p) => p.name === visibleName);

    if (!property) {
      property = {
        name: visibleName,
        propertyPath: propertyName.toLowerCase(),
        children: [],
        keyframes: [],
        depth: 0,
      };
      animationData.properties.push(property);
    }

    return property;
  };

  let createKeyframeValue = (
    propertyName: string,
    value: any
  ): KeyframeValue => {
    let lowerProperty = propertyName.toLowerCase();

    if (lowerProperty === "position") {
      if (Array.isArray(value) && value.length === 2) {
        return { type: "Position", value: [value[0], value[1]] };
      }
      throw new Error("Position property requires [x, y] array");
    }

    if (lowerProperty === "rotation") {
      if (typeof value === "number") {
        return { type: "Rotation", value: value };
      }
      throw new Error("Rotation property requires a number value");
    }

    if (lowerProperty === "scalex") {
      if (typeof value === "number") {
        return { type: "ScaleX", value: value };
      }
      throw new Error("ScaleX property requires a number value");
    }

    if (lowerProperty === "scaley") {
      if (typeof value === "number") {
        return { type: "ScaleY", value: value };
      }
      throw new Error("ScaleY property requires a number value");
    }

    if (lowerProperty === "opacity") {
      if (typeof value === "number") {
        return { type: "Opacity", value: value };
      }
      throw new Error("Opacity property requires a number value");
    }

    throw new Error(`Unsupported property: ${propertyName}`);
  };

  let onGenerateAIAnimation = async () => {
    let editor = editorRef.current;
    let editor_state = editorStateRef.current;

    if (!editor || !editor_state) {
      return;
    }

    if (!aiAnimationPrompt.trim()) {
      toast.error("Please describe the animation you want to create");
      return;
    }

    if (!current_sequence_id) {
      return;
    }

    setAiLoading(true);

    try {
      // Get all visible objects in the current sequence with their metadata
      let objectsData: Array<{
        id: string;
        objectType: string;
        dimensions: { width: number; height: number };
        position: { x: number; y: number };
      }> = [];

      // Add text objects
      if (editor.textItems) {
        objectsData.push(
          ...editor.textItems
            .filter((item) => !item.hidden)
            .map((item) => ({
              id: item.id,
              objectType: "text",
              dimensions: {
                width: item.dimensions[0] || 100,
                height: item.dimensions[1] || 50,
              },
              position: {
                x: item.transform.position[0] || 0,
                y: item.transform.position[1] || 0,
              },
            }))
        );
      }

      // Add polygon objects
      if (editor.polygons) {
        objectsData.push(
          ...editor.polygons
            .filter((item) => !item.hidden)
            .map((item) => ({
              id: item.id,
              objectType: "polygon",
              dimensions: {
                width: item.dimensions[0] || 100,
                height: item.dimensions[1] || 50,
              },
              position: {
                x: item.transform.position[0] || 0,
                y: item.transform.position[1] || 0,
              },
            }))
        );
      }

      // Add image objects
      if (editor.imageItems) {
        objectsData.push(
          ...editor.imageItems
            .filter((item) => !item.hidden)
            .map((item) => ({
              id: item.id,
              objectType: "image",
              dimensions: {
                width: item.dimensions[0] || 100,
                height: item.dimensions[1] || 50,
              },
              position: {
                x: item.transform.position[0] || 0,
                y: item.transform.position[1] || 0,
              },
            }))
        );
      }

      // Add video objects
      if (editor.videoItems) {
        objectsData.push(
          ...editor.videoItems
            .filter((item) => !item.hidden)
            .map((item) => ({
              id: item.id,
              objectType: "video",
              dimensions: {
                width: item.dimensions[0] || 100,
                height: item.dimensions[1] || 50,
              },
              position: {
                x: item.transform.position[0] || 0,
                y: item.transform.position[1] || 0,
              },
            }))
        );
      }

      if (objectsData.length === 0) {
        toast.error(
          "No objects available for animation. Please add some text, shapes, or images first."
        );
        setAiLoading(false);
        return;
      }

      // Get canvas size
      let canvasSize = editor.camera
        ? {
            width: editor.camera.windowSize.width,
            height: editor.camera.windowSize.height,
          }
        : { width: 550, height: 900 };

      // Call the AI API
      let response = await fetch("/api/projects/generate-animation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken?.token}`,
        },
        body: JSON.stringify({
          prompt: aiAnimationPrompt,
          duration: aiAnimationDuration,
          style: aiAnimationStyle,
          objectsData: objectsData,
          canvasSize: canvasSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate animation: ${response.statusText}`);
      }

      let result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response from AI animation generator");
      }

      // Apply the generated animation to the editor
      let animationData = result.data;

      // Apply keyframes for each animated object using raw AnimationData structure
      for (let animation of animationData.animations) {
        // Find or create AnimationData for this object
        let animationDataItem = findOrCreateAnimationData(
          editor_state.savedState,
          current_sequence_id,
          animation.objectId
        );

        for (let property of animation.properties) {
          // Find or create AnimationProperty for this property
          let animationProperty = findOrCreateAnimationProperty(
            animationDataItem,
            capitalizeFirstLetter(property.propertyName as string)
          );

          // reset this property's keyframes before adding new ones
          animationProperty.keyframes = [];

          // Sort keyframes by time to ensure proper order
          let sortedKeyframes = property.keyframes.sort(
            (a: any, b: any) => a.time - b.time
          );

          // Add keyframes to the property
          for (let kf of sortedKeyframes) {
            let keyframeValue = createKeyframeValue(
              property.propertyName,
              kf.value
            );

            let keyframe: UIKeyframe = {
              id: uuidv4(),
              time: kf.time,
              value: keyframeValue,
              easing: (kf.easing || "Linear") as EasingType,
              pathType: "Linear" as PathType,
              curveData: null,
              keyType: { type: "Frame" },
            };

            animationProperty.keyframes.push(keyframe);
          }

          // Sort keyframes by time
          animationProperty.keyframes.sort((a, b) => a.time - b.time);
        }
      }

      // Update the sequence duration if needed
      if (animationData.duration > 0) {
        editor_state.savedState.sequences.forEach((s) => {
          if (s.id === current_sequence_id) {
            s.durationMs = Math.max(
              s.durationMs || 5000,
              animationData.duration
            );
          }
        });
      }

      // Save the updated sequences
      saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

      // update motion paths
      editor.updateMotionPaths(editor_state.savedState.sequences[0]);

      // Refresh the timeline to show the new keyframes
      setRefreshTimeline(Date.now());

      toast.success("AI animation generated successfully!");

      // Clear the prompt for next use
      setAiAnimationPrompt("");
    } catch (error: any) {
      console.error("AI animation generation error:", error);
      toast.error(error.message || "Failed to generate AI animation");
    } finally {
      setAiLoading(false);
    }
  };

  // Text Animation handlers
  const handleTextAnimationSelect = (templateId: string) => {
    if (!selectedTextId) {
      toast.error("Please select a text element first");
      return;
    }

    const editor = editorRef.current;
    const editorState = editorStateRef.current;

    if (!editor || !editorState) return;

    // Find the text renderer
    const textRenderer = editor.textItems.find((t) => t.id === selectedTextId);
    if (!textRenderer) {
      toast.error("Text element not found");
      return;
    }

    // Apply the animation template
    const success = textRenderer.setTextAnimationFromTemplate(templateId);

    if (success) {
      // Save animation data to editor state using the new method
      editorState.updateTextAnimation(
        selectedTextId,
        textRenderer.getTextAnimationConfig()
      );
      toast.success("Text animation applied!");
    } else {
      toast.error("Failed to apply text animation");
    }
  };

  // Template application functions
  const applyTemplate = (
    templateName: string,
    templateFunction: any,
    ...args: any[]
  ) => {
    let editor_state = editorStateRef.current;
    if (!editor_state || !current_sequence_id) return;

    let sequence = editor_state.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );
    if (!sequence) return;

    // Get all objects in the current sequence
    let allObjects = [
      ...(sequence.activePolygons || []),
      ...(sequence.activeTextItems || []),
      ...(sequence.activeImageItems || []),
      ...(sequence.activeVideoItems || []),
    ];

    if (allObjects.length === 0) {
      alert("No objects found in current sequence to animate");
      return;
    }

    let objectIds = allObjects.map((obj) => obj.id);
    let objectTypes: ObjectType[] = allObjects.map((obj) => {
      if (sequence.activePolygons?.find((p) => p.id === obj.id))
        return ObjectType.Polygon;
      if (sequence.activeTextItems?.find((t) => t.id === obj.id))
        return ObjectType.TextItem;
      if (sequence.activeImageItems?.find((i) => i.id === obj.id))
        return ObjectType.ImageItem;
      if (sequence.activeVideoItems?.find((v) => v.id === obj.id))
        return ObjectType.VideoItem;
      return ObjectType.Polygon;
    });

    // Get current animation data or create default
    let currentAnimationData = allObjects.map((obj) => {
      let existingAnimation = sequence.polygonMotionPaths?.find(
        (mp) => mp.polygonId === obj.id
      );
      return (
        existingAnimation || {
          id: obj.id,
          polygonId: obj.id,
          duration: 3000,
          properties: [],
        }
      );
    });

    let objectPositions = allObjects.map((obj) => [
      obj.position?.x || 0,
      obj.position?.y || 0,
    ]);

    try {
      // Call the template function with appropriate parameters
      let newAnimationData;
      if (templateName === "confetti") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          [confettiCenterX, confettiCenterY],
          confettiForce,
          confettiGravity
        );
      } else if (templateName === "flock") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          [flockStartX, flockStartY],
          [flockTargetX, flockTargetY],
          flockSpacing
        );
      } else if (templateName === "ripple") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          objectPositions,
          rippleAmplitude,
          rippleSpeed
        );
      } else if (templateName === "orbit") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          [orbitCenterX, orbitCenterY],
          orbitRadius
        );
      } else if (templateName === "domino") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          objectPositions,
          dominoDelay
        );
      } else if (templateName === "swarm") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          [swarmScatterX, swarmScatterY],
          [swarmTargetX, swarmTargetY],
          swarmScatterRadius,
          swarmFormRadius
        );
      } else if (templateName === "mosaic") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // [mosaicCenterX, mosaicCenterY]
          args[1], // mosaicSpacing
          args[2] // mosaicStagger
        );
      } else if (templateName === "scatter") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // scatterDropHeight
          args[1], // scatterBounce
          args[2] // scatterRotation
        );
      } else if (templateName === "gallery") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // [galleryX, galleryY, galleryWidth, galleryHeight]
          args[1], // galleryDelay
          args[2] // galleryScale
        );
      } else if (templateName === "carousel") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // carouselY
          args[1], // carouselSpacing
          args[2] // carouselCurve
        );
      } else if (templateName === "polaroid") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // null (tumble_positions)
          args[1], // polaroidRotation
          args[2] // polaroidSettle
        );
      } else if (templateName === "slideshow") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // slideshowDuration
          args[1] // slideshowTransition
        );
      } else if (templateName === "grid") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // cols
          args[1], // rows
          args[2], // marger
          args[3] // stagger
        );
      } else if (templateName === "carousel-screen") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // enterDelay
          args[1] // slideSpeed
        );
      } else if (templateName === "showcase") {
        newAnimationData = templateFunction(
          editor_state,
          objectIds,
          objectTypes,
          currentAnimationData,
          args[0], // showcaseScale
          args[1] //stagger
        );
      }

      if (newAnimationData) {
        // Update the sequence with new animation data
        sequence.polygonMotionPaths = newAnimationData;

        // Save the updated sequences
        saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

        // Update the editor if available
        let editor = editorRef.current;
        if (editor) {
          editor.updateMotionPaths(sequence);
        }
      }
    } catch (error) {
      console.error("Error applying template:", error);
      // alert("Error applying animation template");
      toast.error(`Error applying animation template`);
    }
  };

  // Reset animations function
  const resetAnimations = () => {
    let editor_state = editorStateRef.current;
    if (!editor_state || !current_sequence_id) return;

    let sequence = editor_state.savedState.sequences.find(
      (s) => s.id === current_sequence_id
    );
    if (!sequence) return;

    // Get all objects in the current sequence
    let allObjects = [
      ...(sequence.activePolygons || []),
      ...(sequence.activeTextItems || []),
      ...(sequence.activeImageItems || []),
      ...(sequence.activeVideoItems || []),
    ];

    if (allObjects.length === 0) {
      alert("No objects found in current sequence to reset");
      return;
    }

    try {
      // Create default animations for all objects
      let resetAnimationData = allObjects.map((obj) => {
        let objectType = ObjectType.Polygon;
        if (sequence.activeTextItems?.find((t) => t.id === obj.id))
          objectType = ObjectType.TextItem;
        else if (sequence.activeImageItems?.find((i) => i.id === obj.id))
          objectType = ObjectType.ImageItem;
        else if (sequence.activeVideoItems?.find((v) => v.id === obj.id))
          objectType = ObjectType.VideoItem;

        return save_default_keyframes(
          editor_state,
          obj.id,
          objectType,
          obj.position || { x: 400, y: 300 },
          20000 // 3 second duration
        );
      });

      // Update the sequence with reset animation data
      sequence.polygonMotionPaths = resetAnimationData;

      // Save the updated sequences
      saveSequencesData(editor_state.savedState.sequences, SaveTarget.Videos);

      // Update the editor if available
      let editor = editorRef.current;
      if (editor) {
        editor.updateMotionPaths(sequence);
      }

      toast.success("Animations reset to default");
    } catch (error) {
      console.error("Error resetting animations:", error);
      toast.error("Error resetting animations");
    }
  };

  return (
    <>
      {/* Reset Animations Button */}
      <div className="mb-4">
        <button
          type="button"
          className="w-full py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={resetAnimations}
        >
          Reset All Animations
        </button>
      </div>

      {/* Animation Settings Accordion */}
      <Disclosure as="div">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
              <span>Generate Animation</span>
              <ArrowDown
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-gray-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="p-2 text-sm text-gray-500">
              <div className="space-y-3">
                {/* <div className="flex flex-row gap-2">
                          <label htmlFor="keyframe_count" className="text-xs">
                            Choose keyframe count
                          </label>
                          <select
                            id="keyframe_count"
                            name="keyframe_count"
                            className="text-xs"
                            value={keyframe_count}
                            onChange={(ev) =>
                              set_keyframe_count(parseInt(ev.target.value))
                            }
                          >
                            <option value="4">4</option>
                            <option value="6">6</option>
                          </select>
                          <input
                            type="checkbox"
                            id="is_curved"
                            name="is_curved"
                            checked={is_curved}
                            onChange={(ev) => set_is_curved(ev.target.checked)}
                          />
                          <label htmlFor="is_curved" className="text-xs">
                            Is Curved
                          </label>
                        </div>
                        <div className="flex flex-row gap-2">
                          <input
                            type="checkbox"
                            id="auto_choreograph"
                            name="auto_choreograph"
                            checked={auto_choreograph}
                            onChange={(ev) =>
                              set_auto_choreograph(ev.target.checked)
                            }
                          />
                          <label htmlFor="auto_choreograph" className="text-xs">
                            Auto-Choreograph
                          </label>
                          <input
                            type="checkbox"
                            id="auto_fade"
                            name="auto_fade"
                            checked={auto_fade}
                            onChange={(ev) => set_auto_fade(ev.target.checked)}
                          />
                          <label htmlFor="auto_fade" className="text-xs">
                            Auto-Fade
                          </label>
                        </div>
                        <button
                          type="submit"
                          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white stunts-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                          onClick={() => {
                            on_generate_animation();
                          }}
                        >
                          {loading ? "Generating..." : "Generate Animation"}
                        </button> */}

                {/* AI-Powered Animation Generation */}
                <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MagicWand size={16} className="text-purple-600" />
                    <h4 className="text-sm font-medium text-purple-900">
                      AI Animation Generator
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Describe your animation:
                      </label>
                      <textarea
                        className="w-full text-xs border rounded px-2 py-1 h-16 resize-none"
                        placeholder="e.g., Make the text bounce excitedly, then fade out slowly..."
                        value={aiAnimationPrompt}
                        onChange={(e) => setAiAnimationPrompt(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Duration
                        </label>
                        <select
                          className="text-xs border rounded px-2 py-1 w-full"
                          value={aiAnimationDuration}
                          onChange={(e) =>
                            setAiAnimationDuration(Number(e.target.value))
                          }
                        >
                          <option value={1000}>1 second</option>
                          <option value={2000}>2 seconds</option>
                          <option value={3000}>3 seconds</option>
                          <option value={5000}>5 seconds</option>
                          <option value={8000}>8 seconds</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Style
                        </label>
                        <select
                          className="text-xs border rounded px-2 py-1 w-full"
                          value={aiAnimationStyle}
                          onChange={(e) => setAiAnimationStyle(e.target.value)}
                        >
                          <option value="smooth">Smooth</option>
                          <option value="bouncy">Bouncy</option>
                          <option value="quick">Quick</option>
                          <option value="dramatic">Dramatic</option>
                          <option value="subtle">Subtle</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={aiLoading || !aiAnimationPrompt.trim()}
                      onClick={onGenerateAIAnimation}
                    >
                      {aiLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MagicWand size={16} />
                          Generate AI Animation
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Choreographed Animation Templates Accordion */}
      <Disclosure as="div" className="mt-4">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
              <span>Choreographed Templates</span>
              <ArrowDown
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-gray-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2">
              <div className="space-y-3">
                {/* Confetti Explosion */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Confetti Explosion</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Center X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={confettiCenterX}
                        onChange={(e) =>
                          setConfettiCenterX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Center Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={confettiCenterY}
                        onChange={(e) =>
                          setConfettiCenterY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Force:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={confettiForce}
                        onChange={(e) =>
                          setConfettiForce(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Gravity:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={confettiGravity}
                        onChange={(e) =>
                          setConfettiGravity(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() =>
                      applyTemplate(
                        "confetti",
                        save_confetti_explosion_keyframes.bind(
                          editorStateRef.current
                        )
                      )
                    }
                  >
                    Apply Confetti
                  </button>
                </div>

                {/* Flock Formation */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Flock Formation</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Start X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={flockStartX}
                        onChange={(e) => setFlockStartX(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Start Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={flockStartY}
                        onChange={(e) => setFlockStartY(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Target X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={flockTargetX}
                        onChange={(e) =>
                          setFlockTargetX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Target Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={flockTargetY}
                        onChange={(e) =>
                          setFlockTargetY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">Spacing:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={flockSpacing}
                        onChange={(e) =>
                          setFlockSpacing(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() =>
                      applyTemplate(
                        "flock",
                        save_flock_formation_keyframes.bind(
                          editorStateRef.current
                        )
                      )
                    }
                  >
                    Apply Flock
                  </button>
                </div>

                {/* Ripple Wave */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Ripple Wave</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Amplitude:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={rippleAmplitude}
                        onChange={(e) =>
                          setRippleAmplitude(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Speed:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={rippleSpeed}
                        onChange={(e) => setRippleSpeed(Number(e.target.value))}
                        step="0.1"
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    onClick={() =>
                      applyTemplate(
                        "ripple",
                        save_ripple_wave_keyframes.bind(editorStateRef.current)
                      )
                    }
                  >
                    Apply Ripple
                  </button>
                </div>

                {/* Orbit Dance */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Orbit Dance</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Center X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={orbitCenterX}
                        onChange={(e) =>
                          setOrbitCenterX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Center Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={orbitCenterY}
                        onChange={(e) =>
                          setOrbitCenterY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">Radius:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={orbitRadius}
                        onChange={(e) => setOrbitRadius(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                    onClick={() =>
                      applyTemplate(
                        "orbit",
                        save_orbit_dance_keyframes.bind(editorStateRef.current)
                      )
                    }
                  >
                    Apply Orbit
                  </button>
                </div>

                {/* Domino Cascade */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Domino Cascade</h5>
                  <div>
                    <label className="text-xs text-gray-600">Delay (ms):</label>
                    <input
                      type="number"
                      className="text-xs border rounded px-2 py-1 w-full"
                      value={dominoDelay}
                      onChange={(e) => setDominoDelay(Number(e.target.value))}
                    />
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() =>
                      applyTemplate(
                        "domino",
                        save_domino_cascade_keyframes.bind(
                          editorStateRef.current
                        )
                      )
                    }
                  >
                    Apply Domino
                  </button>
                </div>

                {/* Swarm Convergence */}
                <div className="border rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium">Swarm Convergence</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Scatter X:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmScatterX}
                        onChange={(e) =>
                          setSwarmScatterX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Scatter Y:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmScatterY}
                        onChange={(e) =>
                          setSwarmScatterY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Target X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmTargetX}
                        onChange={(e) =>
                          setSwarmTargetX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Target Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmTargetY}
                        onChange={(e) =>
                          setSwarmTargetY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Scatter R:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmScatterRadius}
                        onChange={(e) =>
                          setSwarmScatterRadius(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Form R:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={swarmFormRadius}
                        onChange={(e) =>
                          setSwarmFormRadius(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-teal-500 text-white rounded hover:bg-teal-600"
                    onClick={() =>
                      applyTemplate(
                        "swarm",
                        save_swarm_convergence_keyframes.bind(
                          editorStateRef.current
                        )
                      )
                    }
                  >
                    Apply Swarm
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Collage-Style Animation Templates Accordion */}
      <Disclosure as="div" className="mt-4 mb-4">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
              <span>Collage Templates</span>
              <ArrowDown
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-gray-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2">
              <div className="space-y-3">
                {/* Photo Mosaic Assembly */}
                <div className="border border-blue-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-blue-800">
                    Photo Mosaic Assembly
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Center X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={mosaicCenterX}
                        onChange={(e) =>
                          setMosaicCenterX(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Center Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={mosaicCenterY}
                        onChange={(e) =>
                          setMosaicCenterY(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Spacing:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={mosaicSpacing}
                        onChange={(e) =>
                          setMosaicSpacing(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Stagger (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={mosaicStagger}
                        onChange={(e) =>
                          setMosaicStagger(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() =>
                      applyTemplate(
                        "mosaic",
                        save_photo_mosaic_keyframes.bind(
                          editorStateRef.current
                        ),
                        [mosaicCenterX, mosaicCenterY],
                        mosaicSpacing,
                        mosaicStagger
                      )
                    }
                  >
                    Apply Photo Mosaic
                  </button>
                </div>

                {/* Scrapbook Scatter */}
                <div className="border border-blue-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-blue-800">
                    Scrapbook Scatter
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Drop Height:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={scatterDropHeight}
                        onChange={(e) =>
                          setScatterDropHeight(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Bounce:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={scatterBounce}
                        onChange={(e) =>
                          setScatterBounce(Number(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        max="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">
                        Rotation Range:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={scatterRotation}
                        onChange={(e) =>
                          setScatterRotation(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-pink-500 text-white rounded hover:bg-pink-600"
                    onClick={() =>
                      applyTemplate(
                        "scatter",
                        save_scrapbook_scatter_keyframes.bind(
                          editorStateRef.current
                        ),
                        scatterDropHeight,
                        scatterBounce,
                        scatterRotation
                      )
                    }
                  >
                    Apply Scrapbook Scatter
                  </button>
                </div>

                {/* Gallery Wall Build */}
                <div className="border border-blue-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-blue-800">
                    Gallery Wall Build
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Wall X:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={galleryX}
                        onChange={(e) => setGalleryX(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Wall Y:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={galleryY}
                        onChange={(e) => setGalleryY(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Width:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={galleryWidth}
                        onChange={(e) =>
                          setGalleryWidth(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Height:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={galleryHeight}
                        onChange={(e) =>
                          setGalleryHeight(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Delay (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={galleryDelay}
                        onChange={(e) =>
                          setGalleryDelay(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="gallery_scale"
                        checked={galleryScale}
                        onChange={(e) => setGalleryScale(e.target.checked)}
                        className="mr-2"
                      />
                      <label
                        htmlFor="gallery_scale"
                        className="text-xs text-gray-600"
                      >
                        Scale Effect
                      </label>
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600"
                    onClick={() =>
                      applyTemplate(
                        "gallery",
                        save_gallery_wall_keyframes.bind(
                          editorStateRef.current
                        ),
                        [galleryX, galleryY, galleryWidth, galleryHeight],
                        galleryDelay,
                        galleryScale
                      )
                    }
                  >
                    Apply Gallery Wall
                  </button>
                </div>

                {/* Memory Carousel */}
                <div className="border border-blue-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-blue-800">
                    Memory Carousel
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Carousel Y:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={carouselY}
                        onChange={(e) => setCarouselY(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Spacing:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={carouselSpacing}
                        onChange={(e) =>
                          setCarouselSpacing(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">
                        Curve Intensity:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={carouselCurve}
                        onChange={(e) =>
                          setCarouselCurve(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600"
                    onClick={() =>
                      applyTemplate(
                        "carousel",
                        save_memory_carousel_keyframes.bind(
                          editorStateRef.current
                        ),
                        carouselY,
                        carouselSpacing,
                        carouselCurve
                      )
                    }
                  >
                    Apply Memory Carousel
                  </button>
                </div>

                {/* Polaroid Tumble */}
                <div className="border border-blue-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-blue-800">
                    Polaroid Tumble
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Rotation Range:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={polaroidRotation}
                        onChange={(e) =>
                          setPolaroidRotation(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Settle Time:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={polaroidSettle}
                        onChange={(e) =>
                          setPolaroidSettle(Number(e.target.value))
                        }
                        step="0.1"
                        min="0.1"
                        max="1"
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                    onClick={() =>
                      applyTemplate(
                        "polaroid",
                        save_polaroid_tumble_keyframes.bind(
                          editorStateRef.current
                        ),
                        null,
                        polaroidRotation,
                        polaroidSettle
                      )
                    }
                  >
                    Apply Polaroid Tumble
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Screen-Filling Animation Templates Accordion */}
      <Disclosure as="div" className="mt-4 mb-4">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
              <span>Screen-Filling Templates</span>
              <ArrowDown
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-gray-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2">
              <div className="space-y-3">
                {/* Full-Screen Slideshow */}
                <div className="border border-green-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-green-800">
                    Full-Screen Slideshow
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Duration (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={slideshowDuration}
                        onChange={(e) =>
                          setSlideshowDuration(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Transition (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={slideshowTransition}
                        onChange={(e) =>
                          setSlideshowTransition(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() =>
                      applyTemplate(
                        "slideshow",
                        save_fullscreen_slideshow_keyframes.bind(
                          editorStateRef.current
                        ),
                        null,
                        slideshowDuration,
                        slideshowTransition
                      )
                    }
                  >
                    Apply Full-Screen Slideshow
                  </button>
                </div>

                {/* Adaptive Grid Layout */}
                <div className="border border-green-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-green-800">
                    Adaptive Grid Layout
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Columns:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={gridCols}
                        onChange={(e) => setGridCols(Number(e.target.value))}
                        min="1"
                        max="5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Rows:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        min="1"
                        max="4"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Margin:</label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={gridMargin}
                        onChange={(e) => setGridMargin(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Stagger (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={gridStagger}
                        onChange={(e) => setGridStagger(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() =>
                      applyTemplate(
                        "grid",
                        save_adaptive_grid_keyframes.bind(
                          editorStateRef.current
                        ),
                        null,
                        gridCols,
                        gridRows,
                        gridMargin,
                        gridStagger
                      )
                    }
                  >
                    Apply Adaptive Grid
                  </button>
                </div>

                {/* Screen-Filling Carousel */}
                <div className="border border-green-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-green-800">
                    Screen-Filling Carousel
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Enter Delay (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={carouselEnterDelay}
                        onChange={(e) =>
                          setCarouselEnterDelay(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Slide Speed (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={carouselSlideSpeed}
                        onChange={(e) =>
                          setCarouselSlideSpeed(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() =>
                      applyTemplate(
                        "carousel-screen",
                        save_screen_carousel_keyframes.bind(
                          editorStateRef.current
                        ),
                        null,
                        carouselEnterDelay,
                        carouselSlideSpeed
                      )
                    }
                  >
                    Apply Screen-Filling Carousel
                  </button>
                </div>

                {/* Maximize & Showcase */}
                <div className="border border-green-200 rounded p-3 space-y-2">
                  <h5 className="text-xs font-medium text-green-800">
                    Maximize & Showcase
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">
                        Scale Factor:
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={showcaseScale}
                        onChange={(e) =>
                          setShowcaseScale(Number(e.target.value))
                        }
                        step="0.1"
                        min="0.1"
                        max="2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Stagger (ms):
                      </label>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-full"
                        value={showcaseStagger}
                        onChange={(e) =>
                          setShowcaseStagger(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-full py-1 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() =>
                      applyTemplate(
                        "showcase",
                        save_maximize_showcase_keyframes.bind(
                          editorStateRef.current
                        ),
                        null,
                        showcaseScale,
                        showcaseStagger
                      )
                    }
                  >
                    Apply Maximize & Showcase
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
}
