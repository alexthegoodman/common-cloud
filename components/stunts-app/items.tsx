"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { CreateIcon } from "./icon";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { Editor } from "@/engine/editor";
import EditorState from "@/engine/editor_state";
import { FullExporter } from "@/engine/export";

import toast from "react-hot-toast";
import {
  AuthToken,
  createProject,
  getProjects,
  getSingleProject,
} from "@/fetchers/projects";
import { mutate } from "swr";

export const ProjectItem = ({
  project_id,
  project_label,
  icon,
}: {
  project_id: string;
  project_label: string;
  icon: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);
  const storedProject = JSON.parse(
    localStorage.getItem("stored-project") || "{}"
  );

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);

    localStorage.setItem("stored-project", JSON.stringify({ project_id }));

    router.push(`/project/${project_id}`);
    setLoading(false);
  };

  const handleDuplicate = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    if (!authToken) {
      return;
    }

    setLoading(true);

    const { project } = await getSingleProject(authToken.token, project_id);

    if (!project?.fileData || !project.docData || !project.presData) {
      return;
    }

    await createProject(
      authToken.token,
      project?.name + " Duplicate",
      project?.fileData,
      project?.docData,
      project?.presData
    );

    mutate("projects", () => getProjects(authToken));

    setLoading(false);
  };

  return (
    <div className="flex flex-row gap-2">
      <button
        className="w-64 rounded-xl flex items-center justify-start p-2 bg-white
            border-b border-gray-200 hover:bg-gray-200 hover:cursor-pointer 
            active:bg-[#edda4] transition-colors"
        disabled={loading}
        onClick={handleSubmit}
      >
        <div className="w-6 h-6 text-black mr-2">
          <CreateIcon icon={icon} size="24px" />
        </div>
        <span>{project_label}</span>
      </button>
      <button
        className="w-32 rounded-xl flex items-center justify-start p-2 bg-white
            border-b border-gray-200 hover:bg-gray-200 hover:cursor-pointer 
            active:bg-[#edda4] transition-colors"
        disabled={loading}
        onClick={handleDuplicate}
      >
        Duplicate
      </button>
    </div>
  );
};

interface NavButtonProps {
  label: string;
  icon: string;
  destination: string;
}

export const NavButton: React.FC<NavButtonProps> = ({
  label,
  icon,
  destination,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setLoading(true);
      router.push(destination);
      setLoading(false);
    },
    [router, destination]
  );

  return (
    <button
      className="w-[70px] h-[70px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-gray-200 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500"
      disabled={loading}
      onClick={handleClick}
    >
      <div className="text-black mb-1">
        <CreateIcon icon={icon} size="32px" />
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
};

interface OptionButtonProps {
  style: any;
  label: string;
  icon: string;
  callback: () => void;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  style,
  label,
  icon,
  callback,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    callback();
  };

  return (
    <button
      className="w-[60px] h-[60px] flex flex-col justify-center items-center border border-gray-400 rounded-[15px]
        transition-colors duration-200 ease-in-out hover:bg-gray-200 hover:cursor-pointer 
        focus-visible:border-2 focus-visible:border-blue-500"
      style={style} // Apply the style string
      onClick={handleClick}
    >
      <div className="text-black mb-1">
        <CreateIcon icon={icon} size="24px" />
      </div>
      <span className="text-[11px]">{label}</span>
    </button>
  );
};

// Helper function to parse inline styles
const parseStyle = (styleString: string) => {
  const style: any = {};
  styleString.split(";").forEach((declaration) => {
    const [property, value] = declaration.split(":").map((s) => s.trim());
    if (property && value) {
      style[property as any] = value;
    }
  });
  return style;
};

interface DebouncedInputProps {
  id: string;
  label: string;
  placeholder: string;
  initialValue: string;
  onDebounce: (value: string) => void;
  style?: any;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  id,
  label,
  placeholder,
  initialValue,
  onDebounce,
  style,
}) => {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 300);
  const [debounced, setDebounced] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
  };

  useEffect(() => {
    if (debouncedValue && debounced) {
      console.info("on debounce!");
      onDebounce(debouncedValue);
    } else if (debouncedValue) {
      setDebounced(true);
    }
  }, [debouncedValue]);

  return (
    <div className="space-y-2" style={style}>
      <label htmlFor={id} className="text-xs">
        {label}
      </label>
      <input
        id={id}
        name={id}
        key={id}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={handleChange}
        className="border rounded px-2 py-1 w-full min-w-2 text-xs"
      />
      {/* <div>
        <p>Current value: {value}</p>
        <p>Debounced value: {debouncedValue}</p>
      </div> */}
    </div>
  );
};

export const PlaySequenceButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  selected_sequence_id: string;
}> = ({ editorRef, editorStateRef, selected_sequence_id }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <button
      className="text-xs rounded-md text-black px-2 py-1"
      onClick={() => {
        let editor = editorRef.current;
        let editorState = editorStateRef.current;

        if (!editor || !editorState) {
          return;
        }

        if (editor.isPlaying) {
          console.info("Pause Sequence...");

          editor.isPlaying = false;
          editor.startPlayingTime = null;

          // should return objects to the startup positions and state
          editor.reset_sequence_objects();

          setIsPlaying(false);
        } else {
          console.info("Play Sequence...");

          let selected_sequence_data = editorState.savedState.sequences.find(
            (s) => s.id === selected_sequence_id
          );

          if (!selected_sequence_data) {
            return;
          }

          let now = Date.now();
          editor.startPlayingTime = now;

          editor.currentSequenceData = selected_sequence_data;
          editor.isPlaying = true;

          setIsPlaying(true);
        }
      }}
    >
      {isPlaying ? "Pause Sequence" : "Play Sequence"}
    </button>
  );
};

export const PlayVideoButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
}> = ({ editorRef, editorStateRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <button
      className="text-xs rounded-md text-black px-2 py-1"
      onClick={() => {
        let editor = editorRef.current;
        let editorState = editorStateRef.current;

        if (!editor || !editorState) {
          return;
        }

        if (editor.isPlaying) {
          console.info("Pause Video...");

          editor.videoIsPlaying = false;
          editor.videoStartPlayingTime = null;
          editor.videoCurrentSequenceTimeline = null;
          editor.videoCurrentSequencesData = null;
          editor.isPlaying = false;
          editor.startPlayingTime = null;

          // TODO: reset_sequence_objects?
          editor.videoItems.forEach((v) => {
            v.resetPlayback();
          });

          setIsPlaying(false);
        } else {
          console.info("Play Video...");

          if (!editorState.savedState.timeline_state) {
            return;
          }

          let timelineSequences =
            editorState.savedState.timeline_state.timeline_sequences;

          if (timelineSequences.length === 0) {
            toast.error(
              "Please add a sequence to the timeline before playing."
            );
            return;
          }

          let firstTimelineSequence = timelineSequences.reduce(
            (earliest, current) => {
              return current.startTimeMs < earliest.startTimeMs
                ? current
                : earliest;
            }
          );

          let first_sequence_data = editorState.savedState.sequences.find(
            (s) => s.id === firstTimelineSequence.sequenceId
          );

          if (!first_sequence_data) {
            return;
          }

          editorState.savedState.sequences.forEach((sequence, index) => {
            if (index === 0) {
              sequence.activePolygons.forEach((ap) => {
                const polygon = editor.polygons.find(
                  (p) => p.id.toString() === ap.id
                );
                if (!polygon) throw new Error("Couldn't find polygon");
                polygon.hidden = false;
              });

              sequence.activeImageItems.forEach((si) => {
                const image = editor.imageItems.find(
                  (i) => i.id.toString() === si.id
                );
                if (!image) throw new Error("Couldn't find image");
                image.hidden = false;
              });

              sequence.activeTextItems.forEach((tr) => {
                const text = editor.textItems.find(
                  (t) => t.id.toString() === tr.id
                );
                if (!text) throw new Error("Couldn't find text item");
                text.hidden = false;
              });

              sequence.activeVideoItems.forEach((tr) => {
                const video = editor.videoItems.find(
                  (t) => t.id.toString() === tr.id
                );
                if (!video) throw new Error("Couldn't find video item");
                video.hidden = false;
              });
            } else {
              sequence.activePolygons.forEach((ap) => {
                const polygon = editor.polygons.find(
                  (p) => p.id.toString() === ap.id
                );
                if (!polygon) throw new Error("Couldn't find polygon");
                polygon.hidden = true;
              });

              sequence.activeImageItems.forEach((si) => {
                const image = editor.imageItems.find(
                  (i) => i.id.toString() === si.id
                );
                if (!image) throw new Error("Couldn't find image");
                image.hidden = true;
              });

              sequence.activeTextItems.forEach((tr) => {
                const text = editor.textItems.find(
                  (t) => t.id.toString() === tr.id
                );
                if (!text) throw new Error("Couldn't find text item");
                text.hidden = true;
              });

              sequence.activeVideoItems.forEach((tr) => {
                const video = editor.videoItems.find(
                  (t) => t.id.toString() === tr.id
                );
                if (!video) throw new Error("Couldn't find video item");
                video.hidden = true;
              });
            }
          });

          let now = Date.now();
          editor.startPlayingTime = now;

          editor.videoStartPlayingTime = now;

          editor.videoCurrentSequenceTimeline =
            editorState.savedState.timeline_state;
          editor.videoCurrentSequencesData = editorState.savedState.sequences;

          editor.videoIsPlaying = true;

          editor.currentSequenceData = first_sequence_data;
          editor.isPlaying = true;

          setIsPlaying(true);
        }
      }}
    >
      {isPlaying ? "Pause Video" : "Play Video"}
    </button>
  );
};

export const ExportVideoButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
}> = ({ editorRef, editorStateRef }) => {
  let [isExporting, setIsExporting] = useState(false);
  let [progress, setProgress] = useState("0");

  const exportHandler = async () => {
    let editorState = editorStateRef.current;

    if (!editorState) {
      return;
    }

    let timelineState = editorState.savedState.timeline_state;

    if (!timelineState || timelineState.timeline_sequences.length === 0) {
      toast.error("Please add a sequence to the timeline before exporting.");
      return;
    }

    const exporter = new FullExporter();

    console.info("Initializing FullExporter");

    setIsExporting(true);

    let progressInterval = setInterval(() => {
      let exportProgress = (window as any).exportProgress;
      if (exportProgress) {
        setProgress(exportProgress);
      }
    }, 1000);

    await exporter.initialize(
      editorState.savedState,
      (progress, currentTime, totalDuration) => {
        let perc = (progress * 100).toFixed(1);
        console.log(`Export progress: ${perc}%`);
        console.log(
          `Time: ${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`
        );
        (window as any).exportProgress = perc;
      }
    );

    setIsExporting(false);
    clearInterval(progressInterval);
  };

  return (
    <div className="flex flex-row gap-2 align-center">
      <button
        className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
        disabled={isExporting}
        onClick={() => {
          exportHandler();
        }}
      >
        {isExporting ? "Exporting..." : "Export Video"}
      </button>
      {isExporting && <p>{progress}%</p>}
    </div>
  );
};
