"use client";

import React, { useEffect, useRef, useState } from "react";
import { DebouncedInput, NavButton, OptionButton } from "./items";
import { CreateIcon } from "./icon";
import { Sequence } from "@/engine/animations";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@uidotdev/usehooks";
import { AuthToken, updateSequences } from "@/fetchers/projects";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { Editor, Viewport } from "@/engine/editor";

export const ProjectEditor: React.FC<any> = ({ projectId }) => {
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  let [sequences, set_sequences] = useState<Sequence[]>([]);
  let [loading, set_loading] = useState(false);
  let [section, set_section] = useState("SequenceList");
  let [keyframe_count, set_keyframe_count] = useState(0);
  let [is_curved, set_is_curved] = useState(false);
  let [auto_choreograph, set_auto_choreograph] = useState(true);
  let [auto_fade, set_auto_fade] = useState(true);
  let [layers, set_layers] = useState([]);
  let [dragger_id, set_dragger_id] = useState(null);

  const editorRef = useRef<Editor | null>(null);

  useDevEffectOnce(() => {
    console.info("Starting Editor...");

    let viewport = new Viewport(900, 550);

    editorRef.current = new Editor(viewport);
  });

  let on_create_sequence = async () => {
    if (!authToken) {
      return;
    }

    set_loading(true);

    let new_sequences = sequences;

    new_sequences.push({
      id: uuidv4().toString(),
      name: "New Sequence",
      backgroundFill: { type: "Color", value: [200, 200, 200, 255] },
      durationMs: 20000,
      activePolygons: [],
      polygonMotionPaths: [],
      activeTextItems: [],
      activeImageItems: [],
      activeVideoItems: [],
    });

    set_sequences(new_sequences);

    let response = await updateSequences(
      authToken.token,
      projectId,
      new_sequences
    );

    set_loading(false);
  };

  let on_open_sequence = (sequence_id: string) => {};

  let on_add_square = () => {};

  let on_add_image = () => {};

  let on_add_text = () => {};

  let on_add_video = () => {};

  let on_open_capture = () => {};

  let on_items_updated = () => {};

  let on_item_duplicated = () => {};

  let on_item_deleted = () => {};

  let [background_red, set_background_red] = useState(0);
  let [background_green, set_background_green] = useState(0);
  let [background_blue, set_background_blue] = useState(0);

  let aside_width = 260.0;
  let quarters = aside_width / 4.0 + 5.0 * 4.0;
  let thirds = aside_width / 3.0 + 5.0 * 3.0;
  let halfs = aside_width / 2.0 + 5.0 * 2.0;

  let colors = [
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
  let themes = [
    [0.0, 120.0, 12.0, 24.0, 0.4],
    [1.2, 80.0, 25.0, 32.0, 1.0],
    [2.1, 150.0, 37.0, 18.0, 2.3],
    [3.3, 200.0, 45.0, 20.0, 3.1],
    [4.4, 100.0, 50.0, 28.0, 4.0],
    [5.2, 90.0, 55.0, 22.0, 5.1],
    [6.0, 130.0, 10.0, 26.0, 6.3],
    [7.2, 110.0, 30.0, 16.0, 7.4],
    [8.1, 140.0, 40.0, 20.0, 8.3],
    [9.3, 180.0, 5.0, 18.0, 9.1],
    [0.1, 95.0, 18.0, 30.0, 0.3],
    [1.3, 110.0, 22.0, 20.0, 1.2],
    [2.2, 130.0, 35.0, 22.0, 2.4],
    [3.0, 160.0, 48.0, 18.0, 3.2],
    [4.1, 75.0, 7.0, 28.0, 4.3],
    [5.4, 140.0, 53.0, 24.0, 5.0],
    [6.2, 100.0, 14.0, 26.0, 6.1],
    [7.1, 120.0, 29.0, 20.0, 7.3],
    [8.2, 150.0, 42.0, 18.0, 8.4],
    [9.0, 200.0, 3.0, 16.0, 9.2],
    [0.3, 85.0, 20.0, 32.0, 0.2],
    [1.4, 105.0, 26.0, 24.0, 1.1],
    [2.0, 115.0, 38.0, 20.0, 2.3],
    [3.2, 170.0, 47.0, 18.0, 3.4],
    [4.2, 90.0, 9.0, 30.0, 4.1],
    [5.1, 125.0, 54.0, 22.0, 5.3],
    [6.3, 135.0, 16.0, 24.0, 6.2],
    [7.0, 145.0, 31.0, 18.0, 7.4],
    [8.3, 155.0, 43.0, 20.0, 8.1],
    [9.4, 180.0, 6.0, 16.0, 9.0],
    [0.4, 100.0, 23.0, 28.0, 0.1],
    [1.0, 115.0, 27.0, 22.0, 1.3],
    [2.3, 140.0, 39.0, 20.0, 2.2],
    [3.1, 160.0, 46.0, 18.0, 3.0],
    [4.3, 80.0, 8.0, 32.0, 4.2],
    [5.0, 130.0, 55.0, 24.0, 5.4],
    [6.1, 95.0, 15.0, 26.0, 6.4],
    [7.3, 110.0, 32.0, 20.0, 7.2],
    [8.4, 165.0, 44.0, 18.0, 8.0],
    [9.2, 190.0, 4.0, 16.0, 9.3],
  ];

  return (
    <div className="flex flex-row p-4">
      <div className="flex flex-col gap-4 mr-4">
        <NavButton
          label="Motion"
          icon="brush"
          destination={`/project/${projectId}`}
        />
        <NavButton label="Settings" icon="gear" destination="/settings" />
      </div>
      <div className="flex flex-row">
        {section === "SequenceList" ? (
          <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col w-full">
              <div className="flex flex-row justify-between align-center w-full">
                <h5>Sequences</h5>
                <button
                  className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
                  disabled={loading}
                  onClick={on_create_sequence}
                >
                  New Sequence
                </button>
              </div>
              <div className="flex flex-col w-full mt-2">
                {sequences.map(
                  (
                    sequence: any // Type the sequence data
                  ) => (
                    <div className="flex flex-row" key={sequence.id}>
                      <button
                        className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                        disabled={loading}
                        onClick={() => on_open_sequence(sequence.id)}
                      >
                        Open {sequence.name}
                      </button>
                      <button
                        className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                        disabled={loading}
                        onClick={() => {}} // Duplicate functionality - Add your logic here
                      >
                        Duplicate
                      </button>
                      <button
                        className="text-xs w-full text-left p-2 rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors"
                        disabled={loading}
                        onClick={() => {}} // Add to Timeline functionality - Add your logic here
                      >
                        Add to Timeline
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {section === "SequenceView" ? (
          <div className="flex flex-col gap-4">
            <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
              <div className="flex flex-col w-full gap-4 mb-4">
                <div className="flex flex-row items-center">
                  <button
                    className="flex flex-col justify-center items-center text-xs w-[35px] h-[35px] text-center rounded hover:bg-gray-200 hover:cursor-pointer active:bg-[#edda4] transition-colors mr-2"
                    disabled={loading}
                    onClick={() => set_section("SequenceList")}
                  >
                    <CreateIcon icon="arrow-left" size="24px" />
                  </button>
                  <h5>Update Sequence</h5>
                </div>
                <div className="flex flex-row gap-2">
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
                    onChange={(ev) => set_auto_choreograph(ev.target.checked)}
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
                >
                  {loading ? "Generating..." : "Generate Animation"}
                </button>
                <div className="flex flex-row flex-wrap gap-2">
                  <OptionButton
                    style=""
                    label="Add Square"
                    icon="square"
                    callback={() => {}}
                  />
                  <OptionButton
                    style=""
                    label="Add Text"
                    icon="text"
                    callback={() => {}}
                  />
                  <OptionButton
                    style=""
                    label="Add Image"
                    icon="image"
                    callback={() => {}}
                  />
                  <OptionButton
                    style=""
                    label="Add Video"
                    icon="video"
                    callback={() => {}}
                  />
                  <OptionButton
                    style=""
                    label="Screen Capture"
                    icon="video"
                    callback={() => {}}
                  />
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {themes.map((theme: number[]) => {
                    const backgroundColorRow = Math.floor(theme[0]);
                    const backgroundColorColumn = Math.floor(
                      (theme[0] % 1) * 10
                    );
                    const backgroundColor =
                      colors[backgroundColorRow][backgroundColorColumn];
                    const textColorRow = Math.floor(theme[4]);
                    const textColorColumn = Math.floor((theme[4] % 1) * 10);
                    const textColor = colors[textColorRow][textColorColumn];

                    return (
                      <OptionButton
                        key={`${backgroundColor}-${textColor}`} // Add a key!
                        style={`color: ${textColor}; background-color: ${backgroundColor};`}
                        label="Apply Theme"
                        icon="brush"
                        callback={() => {
                          console.log("Apply Theme...");
                        }}
                      />
                    );
                  })}
                </div>
                <label className="text-sm">Background Color</label>
                <div className="flex flex-row gap-2">
                  <DebouncedInput
                    id="background_red"
                    label="Red"
                    placeholder="Red"
                    initialValue={background_red.toString()}
                    onDebounce={(value) => {
                      set_background_red(parseInt(value));
                    }}
                  />
                  <DebouncedInput
                    id="background_green"
                    label="Green"
                    placeholder="Green"
                    initialValue={background_green.toString()}
                    onDebounce={(value) => {
                      set_background_green(parseInt(value));
                    }}
                  />
                  <DebouncedInput
                    id="background_blue"
                    label="Blue"
                    placeholder="Blue"
                    initialValue={background_blue.toString()}
                    onDebounce={(value) => {
                      set_background_blue(parseInt(value));
                    }}
                  />
                </div>
                <div className="flex max-w-[315px] w-full max-h-[50vh] overflow-y-scroll overflow-x-hidden p-4 border-0 rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                  {/* ... (LayerPanel code remains the same) */}
                </div>
              </div>
              <div>
                <canvas
                  id="scene-canvas"
                  className="w-[900px] h-[450px] border border-black"
                />
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
