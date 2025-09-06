"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DataInterface, dataSchema, questionSchema } from "@/def/ai";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  AuthToken,
  saveSequencesData,
  saveSettingsData,
  saveTimelineData,
} from "@/fetchers/projects";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  generateContent,
  getFlow,
  IFlowQuestions,
  updateFlowQuestions,
} from "@/fetchers/flows";
import {
  getTemplates,
  selectRandomTemplate,
  Template,
} from "@/fetchers/templates";
import { Editor, rgbToWgpu, Viewport } from "@/engine/editor";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import {
  AnimationData,
  BackgroundFill,
  GradientStop,
  ObjectType,
  SavedState,
  Sequence,
  TrackType,
} from "@/engine/animations";
import { v4 as uuidv4 } from "uuid";
import { THEME_COLORS, THEMES } from "./ThemePicker";
import { Color, hexParse } from "@kurkle/color";
import { TextRendererConfig } from "@/engine/text";
import { callLayoutInference, callMotionInference } from "@/fetchers/inference";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { SavedStVideoConfig } from "@/engine/video";
import { SavedStImageConfig } from "@/engine/image";
import { mergeTemplateWithUserContent } from "@/engine/merge";

export default function FlowQuestions({
  flowId = null,
  projectId = null,
}: {
  flowId: string | null;
  projectId: string | null;
}) {
  const { t } = useTranslation("flow");

  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const [loading, setLoading] = useState(false);
  const [isVertical, setIsVertical] = useState(true);

  const { data: user } = useSWR("currentUser", () =>
    getCurrentUser(authToken?.token ? authToken?.token : "")
  );

  let {
    data: flow,
    isLoading,
    error,
  } = useSWR("flow" + flowId, () => getFlow(authToken, flowId as string));

  const [gotQuestions, setGotQuestions] = useState(false);
  const [answersProvided, setAnswersProvided] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const { object, submit } = useObject({
    api: "/api/flows/generate-questions",
    headers: {
      Authorization: `Bearer ${authToken?.token}`,
      "X-User-Language": `${user?.userLanguage}`,
    },
    schema: questionSchema,
  });

  useEffect(() => {
    if (authToken && !gotQuestions && !isLoading && !error) {
      setGotQuestions(true);

      submit(flow?.flow.prompt);
    }
  }, [authToken, isLoading, error]);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      const templateList = await getTemplates();
      setTemplates(templateList);
    };

    fetchTemplates();
  }, []);

  // Handle answer selection
  const handleAnswerSelection = (
    questionIndex: number,
    selectedAnswer: string
  ) => {
    setAnswersProvided((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = selectedAnswer;
      return newAnswers;
    });
  };

  // const mergeTemplateWithContent = (
  //   templateData: SavedState,
  //   existingState: SavedState
  // ): SavedState => {
  //   const mergedState = { ...existingState };

  //   if (templateData?.sequences) {
  //     // Use the first sequence from template as base
  //     const templateSequence = templateData.sequences[0];
  //     if (templateSequence && mergedState.sequences[0]) {
  //       // Replace polygons with existing content
  //       mergedState.sequences[0].activePolygons =
  //         existingState.sequences[0].activePolygons || [];

  //       // Keep template's background if it exists
  //       if (templateSequence.backgroundFill) {
  //         mergedState.sequences[0].backgroundFill =
  //           templateSequence.backgroundFill;
  //       }

  //       // OPTION 1: Keep original item IDs, update motion paths to match them
  //       // Create a mapping from template polygon indices to existing object IDs and types
  //       const createObjectMapping = () => {
  //         const mapping: Array<{ id: string; objectType: ObjectType } | null> =
  //           [];
  //         let currentIndex = 0;

  //         // Map image items
  //         if (existingState.sequences[0].activeImageItems) {
  //           existingState.sequences[0].activeImageItems.forEach((imageItem) => {
  //             mapping[currentIndex] = {
  //               id: imageItem.id, // Keep original ID
  //               objectType: ObjectType.ImageItem,
  //             };
  //             currentIndex++;
  //           });
  //         }

  //         // Map video items (only if 200px or wider)
  //         if (existingState.sequences[0].activeVideoItems) {
  //           existingState.sequences[0].activeVideoItems.forEach((videoItem) => {
  //             const videoWidth = videoItem.dimensions?.[0] || 0;
  //             if (videoWidth >= 200) {
  //               mapping[currentIndex] = {
  //                 id: videoItem.id, // Keep original ID
  //                 objectType: ObjectType.VideoItem,
  //               };
  //             } else {
  //               mapping[currentIndex] = null; // Skip narrow videos
  //             }
  //             currentIndex++;
  //           });
  //         }

  //         // Map text items
  //         if (existingState.sequences[0].activeTextItems) {
  //           existingState.sequences[0].activeTextItems.forEach((textItem) => {
  //             mapping[currentIndex] = {
  //               id: textItem.id, // Keep original ID
  //               objectType: ObjectType.TextItem,
  //             };
  //             currentIndex++;
  //           });
  //         }

  //         return mapping;
  //       };

  //       // Merge positioning of image items from template (DON'T change IDs)
  //       if (
  //         templateSequence.activePolygons &&
  //         existingState.sequences[0].activeImageItems
  //       ) {
  //         mergedState.sequences[0].activeImageItems =
  //           existingState.sequences[0].activeImageItems.map(
  //             (imageItem: SavedStImageConfig, index: number) => {
  //               const templateImageItem =
  //                 templateSequence.activePolygons[index];
  //               if (templateImageItem) {
  //                 return {
  //                   ...imageItem,
  //                   // Keep original ID, only update positioning
  //                   position: templateImageItem.position,
  //                   dimensions: templateImageItem.dimensions,
  //                   layer: templateImageItem.layer,
  //                 };
  //               }
  //               return imageItem;
  //             }
  //           );
  //       }

  //       // Merge positioning of video items from template (DON'T change IDs)
  //       if (
  //         templateSequence.activePolygons &&
  //         existingState.sequences[0].activeVideoItems
  //       ) {
  //         mergedState.sequences[0].activeVideoItems =
  //           existingState.sequences[0].activeVideoItems.map(
  //             (videoItem: SavedStVideoConfig, index: number) => {
  //               const templateVideoItem =
  //                 templateSequence.activePolygons[index];
  //               if (templateVideoItem) {
  //                 // Check if the video item is 200 pixels or wider
  //                 const videoWidth = templateVideoItem.dimensions?.[0] || 0;
  //                 if (videoWidth >= 200) {
  //                   return {
  //                     ...videoItem,
  //                     // Keep original ID, only update positioning
  //                     position: templateVideoItem.position,
  //                     dimensions: templateVideoItem.dimensions,
  //                     layer: templateVideoItem.layer,
  //                   };
  //                 }
  //               }
  //               return videoItem;
  //             }
  //           );
  //       }

  //       // Update motion paths to use existing object IDs
  //       if (templateSequence.polygonMotionPaths) {
  //         const objectMapping = createObjectMapping();

  //         mergedState.sequences[0].polygonMotionPaths =
  //           templateSequence.polygonMotionPaths
  //             .map((motionPath: AnimationData, index: number) => {
  //               const mappedObject = objectMapping[index];

  //               // Skip motion paths for objects that don't exist or narrow videos
  //               if (!mappedObject) {
  //                 return null;
  //               }

  //               return {
  //                 ...motionPath,
  //                 polygonId: mappedObject.id, // Use existing object ID
  //                 objectType: mappedObject.objectType,
  //               };
  //             })
  //             .filter((path): path is AnimationData => path !== null); // Remove null entries
  //       }
  //     }
  //   }

  //   return mergedState;
  // };

  const mergeTemplateWithContent = (
    templateData: SavedState,
    existingState: SavedState,
    currentSequenceId: string
  ): SavedState => {
    const mergedProject = mergeTemplateWithUserContent(
      currentSequenceId,
      templateData,
      existingState,
      {
        videoWidthThreshold: 200,
        preserveTemplateImages: true,
        preserveTemplateVideos: true,
      }
    );

    return mergedProject;
  };

  const generateHandler = async () => {
    setLoading(true);

    if (!authToken) {
      return;
    }

    if (!object?.questions) {
      return;
    }

    if (!flow) {
      return;
    }

    const savableQuestions: IFlowQuestions = {
      questions: object.questions.map((question, i) => {
        return {
          possibleAnswers: question?.possibleAnswers?.map((possibleAnswer) => {
            return {
              answerText: possibleAnswer?.answerText!,
            };
          })!,
          question: question?.question!,
          chosenAnswer: answersProvided[i],
        };
      }),
    };

    await updateFlowQuestions(authToken?.token, flowId!, savableQuestions);

    //  add the images and text content, generate the layout, then generate the animation, set the theme, finally save
    const videoContent = await generateContent(
      authToken.token,
      user?.userLanguage || "en",
      flow?.flow.prompt,
      flow?.flow.content.links,
      //   {
      //     questions: flow?.flow.questions.questions.map((question) => {
      //       return {
      //         question: question.question,
      //         chosenAnswer: question.chosenAnswer,
      //       };
      //     }),
      //   }
      flow?.flow.questions
    );

    let currentSequenceId = uuidv4().toString();

    const defaultVideoSequence: Sequence = {
      id: currentSequenceId,
      name: "Sequence #1",
      backgroundFill: { type: "Color", value: [200, 200, 200, 255] },
      durationMs: 20000,
      activePolygons: [],
      polygonMotionPaths: [],
      activeTextItems: [],
      activeImageItems: [],
      activeVideoItems: [],
    };

    let dimensions = isVertical
      ? {
          width: 500,
          height: 900,
        }
      : {
          width: 900,
          height: 500,
        };

    const emptyVideoState: SavedState = {
      sequences: [defaultVideoSequence],
      timeline_state: {
        timeline_sequences: [
          {
            id: uuidv4(),
            sequenceId: currentSequenceId,
            trackType: TrackType.Video,
            startTimeMs: 0,
            // duration_ms: 20000,
          },
        ],
      },
      settings: {
        dimensions,
      },
    };

    const viewport = new Viewport(900, 500);
    const editor = new Editor(viewport);

    // Select and apply random template
    const selectedTemplate = selectRandomTemplate(templates);
    // const initState = selectedTemplate
    //   ? mergeTemplateWithContent(selectedTemplate.fileData, emptyVideoState)
    //   : emptyVideoState;

    const editorState = new EditorState(emptyVideoState);

    const isHindi = user?.userLanguage === "hi";

    // add text content
    if (videoContent) {
      let new_id = uuidv4();
      let new_text = "";
      videoContent.data.contentItems.forEach((item) => {
        new_text += "- " + item.summaryText + "\n";
      });

      let font_family = isHindi ? "Noto Sans Devanagari" : "Aleo";

      let position = {
        x: 0,
        y: 0,
      };

      let text_config: TextRendererConfig = {
        id: new_id,
        name: "New Text Item",
        text: new_text,
        fontFamily: font_family,
        dimensions: [200.0, 300.0] as [number, number],
        position,
        layer: 1,
        // color: rgbToWgpu(20, 20, 200, 255) as [number, number, number, number],
        color: [20, 20, 200, 255] as [number, number, number, number],
        fontSize: 18,
        // backgroundFill: rgbToWgpu(200, 200, 200, 255) as [
        //   number,
        //   number,
        //   number,
        //   number
        // ],
        backgroundFill: { type: "Color", value: rgbToWgpu(200, 200, 200, 255) },
        isCircle: false,
      };

      await editor.add_text_item(
        text_config,
        new_text,
        new_id,
        currentSequenceId
      );

      await editorState.add_saved_text_item(currentSequenceId, {
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
    }

    if (flow.flow.content.files) {
      for (const file of flow.flow.content.files) {
        let new_id = uuidv4();
        let position = { x: 0, y: 0 };

        if (file.mimeType && file.mimeType.includes("video/")) {
          // Handle video files
          let video_config = {
            id: new_id,
            name: "New Video Item",
            dimensions: [file.dimensions.width, file.dimensions.height] as [
              number,
              number
            ], // Default video dimensions
            position,
            path: file.url,
            mousePath: "",
            layer: 2,
          };

          // Create blob from video URL for video processing
          // const response = await fetch(file.url);
          // const blob = await response.blob();
          const blob = new Blob(); // Placeholder, as we don't want to fetch the actual video

          await editor.add_video_item(
            video_config,
            blob,
            new_id,
            currentSequenceId,
            [],
            null
          );

          console.info("Adding video: {:?}", new_id);

          // Get video item to access duration
          let new_video_item = editor.videoItems.find((v) => v.id === new_id);
          let sourceDurationMs = new_video_item?.sourceDurationMs || 5000; // Default 5 seconds

          await editorState.add_saved_video_item(
            currentSequenceId,
            {
              id: video_config.id,
              name: video_config.name,
              path: file.url,
              dimensions: [
                video_config.dimensions[0],
                video_config.dimensions[1],
              ],
              position: {
                x: position.x,
                y: position.y,
              },
              layer: video_config.layer,
            },
            sourceDurationMs
          );

          console.info("Saved video!");
        } else {
          // Handle image files (existing logic)
          let aspectRatio = file.dimensions.height / file.dimensions.width;
          let setWidth =
            file.dimensions.width > 400 ? 400 : file.dimensions.width;
          let setHeight = setWidth * aspectRatio;

          let image_config = {
            id: new_id,
            name: "New Image Item",
            dimensions: [setWidth, setHeight] as [number, number],
            position,
            // path: new_path.clone(),
            url: file.url,
            layer: 2,
            isCircle: false,
          };

          await editor.add_image_item(
            image_config,
            file.url,
            new Blob(),
            new_id,
            currentSequenceId
          );

          console.info("Adding image: {:?}", new_id);

          await editorState.add_saved_image_item(currentSequenceId, {
            id: image_config.id,
            name: image_config.name,
            // path: new_path.clone(),
            url: file.url,
            dimensions: [
              image_config.dimensions[0],
              image_config.dimensions[1],
            ],
            position: {
              x: position.x,
              y: position.y,
            },
            layer: image_config.layer,
            isCircle: image_config.isCircle,
          });

          console.info("Saved image!");
        }
      }
    }

    const finalState = selectedTemplate
      ? mergeTemplateWithContent(
          selectedTemplate.fileData,
          editorState.savedState,
          currentSequenceId // main sequence id for now
        )
      : emptyVideoState;

    editorState.savedState = finalState;

    // // generate layout
    // let prompt = editorState.genCreateLayoutInferencePrompt();

    // // console.info("layout prompt", editor, editorState, prompt);

    // let predictions = await callLayoutInference(prompt);

    // console.info("predictions", predictions);

    // // let sequences = editor.updateLayoutFromPredictions(
    // //   predictions,
    // //   currentSequenceId,
    // //   editorState.savedState.sequences
    // // );

    // // Parse predictions into structured objects
    // // TODO: getItemId, getObjectType
    // const objects = editor.parsePredictionsToObjects(
    //   predictions,
    //   editorState,
    //   dimensions
    // );

    // let sequences = editor.updateSequencesFromObjects(
    //   objects,
    //   currentSequenceId,
    //   editorState.savedState.sequences
    // );

    // console.info("debug info", objects, sequences, currentSequenceId);

    // editorState.savedState.sequences = sequences;

    // let prompt2 = editorState.genCreateInferencePrompt();
    // let predictions2 = await callMotionInference(prompt2);

    // console.info("predictions2", predictions2);

    // let current_positions = editorState.getCurrentPositions();

    // let animation = editor.createMotionPathsFromPredictions(
    //   predictions2,
    //   current_positions,
    //   editorState,
    //   dimensions
    // );

    // editorState.savedState.sequences.forEach((s) => {
    //   if (s.id === currentSequenceId) {
    //     s.polygonMotionPaths = animation;
    //   }
    // });

    // let updatedSequence = editorState.savedState.sequences.find(
    //   (s) => s.id === currentSequenceId
    // );

    // if (!updatedSequence) {
    //   return;
    // }

    // const themeCount = 50;
    // const randomThemeIndex = Math.floor(Math.random() * themeCount);

    // const theme = THEMES[randomThemeIndex];

    // if (theme) {
    //   const backgroundColorRow = Math.floor(theme[0]);
    //   const backgroundColorColumn = Math.floor((theme[0] % 1) * 10);
    //   const backgroundColor =
    //     THEME_COLORS[backgroundColorRow][backgroundColorColumn];
    //   const textColorRow = Math.floor(theme[4]);
    //   const textColorColumn = Math.floor((theme[4] % 1) * 10);
    //   const textColor = THEME_COLORS[textColorRow][textColorColumn];

    //   const backgroundRgb = hexParse(backgroundColor);
    //   const textRgb = hexParse(textColor);

    //   const textKurkle = new Color(textRgb);
    //   const darkTextColor = textKurkle.darken(0.15);

    //   const fontIndex = isHindi ? Math.floor(theme[2] / 10) : theme[2];

    //   // apply theme to background canvas and text objects

    //   let text_color_wgpu = rgbToWgpu(textRgb.r, textRgb.g, textRgb.b, 255.0);

    //   let text_color_dark_wgpu = rgbToWgpu(
    //     darkTextColor._rgb.r,
    //     darkTextColor._rgb.g,
    //     darkTextColor._rgb.b,
    //     255.0
    //   );
    //   let background_color_wgpu = rgbToWgpu(
    //     backgroundRgb.r,
    //     backgroundRgb.g,
    //     backgroundRgb.b,
    //     255.0
    //   );
    //   let background_color = [
    //     backgroundRgb.r,
    //     backgroundRgb.g,
    //     backgroundRgb.b,
    //     255,
    //   ] as [number, number, number, number];

    //   let ids_to_update = editorState.savedState.sequences
    //     .find((s) => s.id === currentSequenceId)
    //     ?.activeTextItems.map((text) => text.id);

    //   if (!ids_to_update) {
    //     ids_to_update = [];
    //   }

    //   // let fontId = editor.fontManager.fontData[fontIndex].name;
    //   let fontData = isHindi
    //     ? editor.fontManager.fontData.filter((data) =>
    //         data.support.includes("devanagari")
    //       )
    //     : editor.fontManager.fontData.filter((data) =>
    //         data.support.includes("latin")
    //       );

    //   let fontId = fontData[fontIndex].name;

    //   editorState.savedState.sequences.forEach((s) => {
    //     if (s.id == currentSequenceId) {
    //       s.activeTextItems.forEach((t) => {
    //         if (ids_to_update.includes(t.id)) {
    //           // if t.id == selected_text_id.get().to_string() {
    //           t.color = background_color;
    //           t.fontFamily = fontId;
    //           // }
    //         }
    //       });
    //     }
    //   });

    //   editorState.savedState.sequences.forEach((s) => {
    //     s.activeTextItems.forEach((p) => {
    //       if (ids_to_update.includes(p.id)) {
    //         p.backgroundFill = {
    //           type: "Color",
    //           value: text_color_dark_wgpu,
    //         };
    //       }
    //     });
    //   });

    //   let background_uuid = currentSequenceId;

    //   let stops: GradientStop[] = [
    //     {
    //       offset: 0,
    //       color: text_color_wgpu,
    //     },
    //     {
    //       offset: 1,
    //       color: background_color_wgpu,
    //     },
    //   ];

    //   let gradientBackground: BackgroundFill = {
    //     type: "Gradient",
    //     value: {
    //       stops: stops,
    //       numStops: stops.length, // numStops
    //       type: "linear", // gradientType (0 is linear, 1 is radial)
    //       startPoint: [0, 0], // startPoint
    //       endPoint: [1, 0], // endPoint
    //       center: [0.5, 0.5], // center
    //       radius: 1.0, // radius
    //       timeOffset: 0, // timeOffset
    //       animationSpeed: 1, // animationSpeed
    //       enabled: 1, // enabled
    //     },
    //   };

    //   editorState.savedState.sequences.forEach((s) => {
    //     if (s.id == currentSequenceId) {
    //       if (!s.backgroundFill) {
    //         s.backgroundFill = {
    //           type: "Color",
    //           value: [0.8, 0.8, 0.8, 1],
    //         } as BackgroundFill;
    //       }
    //       // gradient only on theme picker
    //       s.backgroundFill = gradientBackground;
    //     }
    //   });
    // }

    await saveSequencesData(
      editorState.savedState.sequences,
      SaveTarget.Videos
    );

    await saveSettingsData(
      {
        dimensions,
      },
      SaveTarget.Videos
    );

    await saveTimelineData(editorState.savedState.timeline_state!);

    router.push(`/project/${projectId}/videos`);

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {object && object.questions && (
        <div className="space-y-8">
          {object.questions.map((question, questionIndex) => {
            return (
              <div
                key={questionIndex}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {question?.question}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {question?.possibleAnswers?.map(
                      (possibleAnswer, answerIndex) => {
                        const isSelected =
                          answersProvided[questionIndex] ===
                          possibleAnswer?.answerText;

                        return (
                          <button
                            key={answerIndex}
                            onClick={() => {
                              handleAnswerSelection(
                                questionIndex,
                                possibleAnswer?.answerText || ""
                              );
                            }}
                            className={`
                            p-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-800 shadow-md"
                                : "border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                            }
                          `}
                          >
                            <span className="block text-sm font-medium">
                              {possibleAnswer?.answerText}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center pt-6">
        <div className="flex justify-center mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsVertical(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isVertical
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span>{t("Vertical")}</span>
              </div>
            </button>
            <button
              onClick={() => setIsVertical(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !isVertical
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 4h6M9 8h6m-6 4h6m-6 4h6"
                  />
                </svg>
                <span>{t("Horizontal")}</span>
              </div>
            </button>
          </div>
        </div>
        <button
          className="stunts-gradient text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 hover:shadow-lg"
          onClick={generateHandler}
          disabled={loading || !answersProvided.some((answer) => answer)}
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{t("Saving and generating")}...</span>
            </span>
          ) : (
            t("Generate Your Content!")
          )}
        </button>
      </div>
    </div>
  );
}
