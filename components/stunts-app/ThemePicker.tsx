import { Editor, InputValue, rgbToWgpu } from "@/engine/editor";
import { OptionButton } from "./items";
import { Color, hexParse } from "@kurkle/color";
import EditorState, { SaveTarget } from "@/engine/editor_state";
import { BackgroundFill, GradientStop } from "@/engine/animations";
import { saveSequencesData } from "@/fetchers/projects";

export const THEME_COLORS = [
  ["#FFE4E1", "#FF6B6B", "#FF0000", "#B22222", "#8B0000"], // red
  ["#FFECD9", "#FFB347", "#FF8C00", "#D95E00", "#993D00"], // orange
  ["#FFFACD", "#FFE66D", "#FFD700", "#DAA520", "#B8860B"], // yellow
  ["#E8F5E9", "#7CB342", "#2E7D32", "#1B5E20", "#0A3D0A"], // green
  ["#E3F2FD", "#64B5F6", "#1E88E5", "#1565C0", "#0D47A1"], // blue
  ["#F3E5F5", "#AB47BC", "#8E24AA", "#6A1B9A", "#4A148C"], // purple
  ["#FCE4EC", "#F06292", "#E91E63", "#C2185B", "#880E4F"], // pink
  ["#E0F2F1", "#4DB6AC", "#00897B", "#00695C", "#004D40"], // teal
  ["#EFEBE9", "#A1887F", "#795548", "#5D4037", "#3E2723"], // brown
  ["#F5F5F5", "#BDBDBD", "#757575", "#424242", "#212121"], // gray
];

// 50 color / text combinations (style portion of format)
// background_color_index, text_length, font_family_index, font_size, font_color_index
export const THEMES = [
  [0.1, 120.0, 12.0, 24.0, 0.4],
  [1.2, 80.0, 25.0, 32.0, 1.1],
  [2.1, 150.0, 37.0, 18.0, 2.3],
  [3.3, 200.0, 45.0, 20.0, 3.1],
  [4.4, 100.0, 50.0, 28.0, 4.1],
  [5.2, 90.0, 55.0, 22.0, 5.1],
  [6.1, 130.0, 10.0, 26.0, 6.3],
  [7.2, 110.0, 30.0, 16.0, 7.4],
  [8.1, 140.0, 40.0, 20.0, 8.3],
  [9.3, 180.0, 5.0, 18.0, 9.1],
  [0.1, 95.0, 18.0, 30.0, 0.3],
  [1.3, 110.0, 22.0, 20.0, 1.2],
  [2.2, 130.0, 35.0, 22.0, 2.4],
  [3.0, 160.0, 48.0, 18.0, 3.2],
  [4.1, 75.0, 7.0, 28.0, 4.3],
  [5.4, 140.0, 53.0, 24.0, 5.1],
  [6.2, 100.0, 14.0, 26.0, 6.1],
  [7.1, 120.0, 29.0, 20.0, 7.3],
  [8.2, 150.0, 42.0, 18.0, 8.4],
  [9.1, 200.0, 3.0, 16.0, 9.2],
  [0.3, 85.0, 20.0, 32.0, 0.2],
  [1.4, 105.0, 26.0, 24.0, 1.1],
  [2.1, 115.0, 38.0, 20.0, 2.3],
  [3.2, 170.0, 47.0, 18.0, 3.4],
  [4.2, 90.0, 9.0, 30.0, 4.1],
  [5.1, 125.0, 54.0, 22.0, 5.3],
  [6.3, 135.0, 16.0, 24.0, 6.2],
  [7.1, 145.0, 31.0, 18.0, 7.4],
  [8.3, 155.0, 43.0, 20.0, 8.1],
  [9.4, 180.0, 6.0, 16.0, 9.1],
  [0.4, 100.0, 23.0, 28.0, 0.1],
  [1.1, 115.0, 27.0, 22.0, 1.3],
  [2.3, 140.0, 39.0, 20.0, 2.2],
  [3.1, 160.0, 46.0, 18.0, 3.1],
  [4.3, 80.0, 8.0, 32.0, 4.2],
  [5.1, 130.0, 55.0, 24.0, 5.4],
  [6.1, 95.0, 15.0, 26.0, 6.4],
  [7.3, 110.0, 32.0, 20.0, 7.2],
  [8.4, 165.0, 44.0, 18.0, 8.1],
  [9.2, 190.0, 4.0, 16.0, 9.3],
];

export const ThemePicker = ({
  editorRef,
  editorStateRef,
  currentSequenceId,
  saveTarget,
  userLanguage = "en",
}: {
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  currentSequenceId: string;
  saveTarget: SaveTarget;
  userLanguage?: string;
}) => {
  return (
    <>
      <p className="text-xs">Theme Picker</p>

      <div className="flex flex-row flex-wrap gap-2">
        {THEMES.map((theme: number[], i) => {
          const backgroundColorRow = Math.floor(theme[0]);
          const backgroundColorColumn = Math.floor((theme[0] % 1) * 10);
          const backgroundColor =
            THEME_COLORS[backgroundColorRow][backgroundColorColumn];
          const textColorRow = Math.floor(theme[4]);
          const textColorColumn = Math.floor((theme[4] % 1) * 10);
          const textColor = THEME_COLORS[textColorRow][textColorColumn];

          const backgroundRgb = hexParse(backgroundColor);
          const textRgb = hexParse(textColor);

          const textKurkle = new Color(textRgb);
          const darkTextColor = textKurkle.darken(0.15);

          const fontIndex =
            userLanguage === "hi" ? Math.floor(theme[2] / 10) : theme[2];

          return (
            <OptionButton
              key={`${backgroundColor}-${textColor}-${i}`}
              // style={`color: ${textColor}; background-color: ${backgroundColor};`}
              style={{
                color: textColor,
                backgroundColor: backgroundColor,
              }}
              label="Apply Theme"
              icon="brush"
              callback={async () => {
                let editor = editorRef.current;
                let editorState = editorStateRef.current;

                if (!editor || !editorState) {
                  return;
                }

                console.log("Apply Theme...");

                // apply theme to background canvas and text objects

                let text_color_wgpu = rgbToWgpu(
                  textRgb.r,
                  textRgb.g,
                  textRgb.b,
                  255.0
                );

                let text_color_dark_wgpu = rgbToWgpu(
                  darkTextColor._rgb.r,
                  darkTextColor._rgb.g,
                  darkTextColor._rgb.b,
                  255.0
                );

                let text_color = [textRgb.r, textRgb.g, textRgb.b, 255] as [
                  number,
                  number,
                  number,
                  number
                ];

                let background_color_wgpu = rgbToWgpu(
                  backgroundRgb.r,
                  backgroundRgb.g,
                  backgroundRgb.b,
                  255.0
                );

                // using for text and canvas, so text_color can provide contrast
                let background_color = [
                  backgroundRgb.r,
                  backgroundRgb.g,
                  backgroundRgb.b,
                  255,
                ] as [number, number, number, number];

                let ids_to_update = editor.textItems
                  .filter((text) => {
                    return (
                      !text.hidden &&
                      text.currentSequenceId === currentSequenceId
                    );
                  })
                  .map((text) => text.id);

                console.info("texts to update", ids_to_update);

                let fontData =
                  userLanguage === "hi"
                    ? editor.fontManager.fontData.filter((data) =>
                        data.support.includes("devanagari")
                      )
                    : editor.fontManager.fontData.filter((data) =>
                        data.support.includes("latin")
                      );

                let fontId = fontData[fontIndex].name;
                for (let id of ids_to_update) {
                  editor.update_text_color(id, background_color);
                  await editor.update_text_fontFamily(fontId, id);
                }

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    s.activeTextItems.forEach((t) => {
                      if (ids_to_update.includes(t.id)) {
                        // if t.id == selected_text_id.get().to_string() {
                        t.color = background_color;
                        t.fontFamily = fontId;
                        // }
                      }
                    });
                  }
                });

                for (let id of ids_to_update) {
                  editor.update_text(
                    id,
                    "red_fill",
                    InputValue.Number,
                    text_color_dark_wgpu[0]
                  );
                  editor.update_text(
                    id,
                    "green_fill",
                    InputValue.Number,
                    text_color_dark_wgpu[1]
                  );
                  editor.update_text(
                    id,
                    "blue_fill",
                    InputValue.Number,
                    text_color_dark_wgpu[2]
                  );
                }

                editorState.savedState.sequences.forEach((s) => {
                  s.activeTextItems.forEach((p) => {
                    if (ids_to_update.includes(p.id)) {
                      p.backgroundFill = {
                        type: "Color",
                        value: text_color_dark_wgpu,
                      };
                    }
                  });
                });

                console.info("Updating canvas background...");

                let background_uuid = currentSequenceId;

                let stops: GradientStop[] = [
                  {
                    offset: 0,
                    color: text_color_wgpu,
                  },
                  {
                    offset: 1,
                    color: background_color_wgpu,
                  },
                ];

                let gradientBackground: BackgroundFill = {
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

                // editor.update_background(
                //   background_uuid,
                //   "red",
                //   InputValue.Number,
                //   background_color[0]
                // );
                // editor.update_background(
                //   background_uuid,
                //   "green",
                //   InputValue.Number,
                //   background_color[1]
                // );
                // editor.update_background(
                //   background_uuid,
                //   "blue",
                //   InputValue.Number,
                //   background_color[2]
                // );

                editor.update_background(background_uuid, gradientBackground);

                editorState.savedState.sequences.forEach((s) => {
                  if (s.id == currentSequenceId) {
                    if (!s.backgroundFill) {
                      s.backgroundFill = {
                        type: "Color",
                        value: [0.8, 0.8, 0.8, 1],
                      } as BackgroundFill;
                    }

                    // switch (s.backgroundFill.type) {
                    //   case "Color": {
                    //     s.backgroundFill = {
                    //       type: "Color",
                    //       value: background_color_wgpu,
                    //     };

                    //     break;
                    //   }
                    //   case "Gradient": {
                    //     s.backgroundFill = gradientBackground;
                    //     break;
                    //   }
                    // }

                    // gradient only on theme picker
                    s.backgroundFill = gradientBackground;
                  }
                });

                saveSequencesData(editorState.savedState.sequences, saveTarget);
              }}
            />
          );
        })}
      </div>
    </>
  );
};
