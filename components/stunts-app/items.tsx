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
  deleteProject,
  getProjects,
  getSingleProject,
} from "@/fetchers/projects";
import { mutate } from "swr";
import { useTranslation } from "react-i18next";

export const ProjectItem = ({
  project_id,
  project_label,
  icon,
  user,
}: {
  project_id: string;
  project_label: string;
  icon: string;
  user?: { role: string } | null;
}) => {
  const { t } = useTranslation("common");

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

    router.push(`/project/${project_id}/videos`);
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

    try {
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
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Project limit reached")
      ) {
        toast.error("Project limit reached. Upgrade to create more projects.");
      } else {
        toast.error("Failed to duplicate project. Please try again.");
      }
    }

    setLoading(false);
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!authToken || !user || user.role !== "ADMIN") {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${project_label}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      await deleteProject(authToken.token, project_id);
      mutate("projects", () => getProjects(authToken));
      toast.success("Project deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-row gap-2">
      <button
        className="w-64 rounded-xl flex items-center justify-start p-2
             hover:bg-gray-200 hover:cursor-pointer 
            active:bg-[#edda4] transition-colors"
        disabled={loading}
        onClick={handleSubmit}
      >
        <div className="w-6 h-6 text-white mr-2">
          <CreateIcon icon={icon} size="24px" />
        </div>
        <span>{project_label}</span>
      </button>
      <button
        className="w-32 rounded-xl flex items-center justify-start p-2
             hover:bg-gray-200 hover:cursor-pointer 
            active:bg-[#edda4] transition-colors"
        disabled={loading}
        onClick={handleDuplicate}
      >
        {t("Duplicate")}
      </button>
      {user?.role === "ADMIN" && (
        <button
          className="w-24 rounded-xl flex items-center justify-center p-2 bg-red-500
               hover:bg-red-600 hover:cursor-pointer 
              active:bg-red-700 transition-colors text-white"
          disabled={loading}
          onClick={handleDelete}
        >
          {t("Delete")}
        </button>
      )}
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
      className="w-[45px] h-[45px] md:w-[70px] md:h-[70px] flex flex-col justify-center items-center border-0 rounded-[15px]
        shadow-[0_0_15px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 ease-in-out 
        hover:bg-primary-600 hover:cursor-pointer focus-visible:border-2 focus-visible:border-blue-500 z-10"
      disabled={loading}
      onClick={handleClick}
    >
      <div className=" mb-1 hidden md:block">
        <CreateIcon icon={icon} size="32px" />
      </div>
      <div className=" block md:hidden">
        <CreateIcon icon={icon} size="22px" />
      </div>
      <span className="text-[10px] md:text-xs">{label}</span>
    </button>
  );
};

interface OptionButtonProps {
  style: any;
  label: string;
  icon: string;
  callback: () => void;
  "aria-label"?: string;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  style,
  label,
  icon,
  callback,
  "aria-label": ariaLabel,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    callback();
  };

  return (
    <button
      className="w-[60px] h-[60px] flex flex-col justify-center items-center border border-gray-400 rounded-[15px]
        transition-colors duration-200 ease-in-out hover:cursor-pointer 
        focus-visible:border-2 focus-visible:border-blue-500"
      style={style} // Apply the style string
      onClick={handleClick}
      aria-label={ariaLabel || label}
    >
      <div className=" mb-1">
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
    </div>
  );
};

export const DebouncedTextarea: React.FC<DebouncedInputProps> = ({
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

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <textarea
        id={id}
        name={id}
        key={id}
        placeholder={placeholder}
        value={value}
        rows={6}
        onChange={handleChange}
        className="border rounded px-2 py-1 w-full min-w-2 text-xs"
      ></textarea>
    </div>
  );
};

export const PlaySequenceButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
  selected_sequence_id: string;
}> = ({ editorRef, editorStateRef, selected_sequence_id }) => {
  const { t } = useTranslation("common");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <button
      className="text-xs rounded-md theme-button px-2 py-1"
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

          // Stop all text animations
          for (const textItem of editor.textItems) {
            if (textItem.hasTextAnimation()) {
              textItem.stopTextAnimation();
            }
          }

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

          // Start all text animations with relative time (0 = start of sequence)
          for (const textItem of editor.textItems) {
            if (!textItem.hidden && textItem.hasTextAnimation()) {
              textItem.startTextAnimation(0);
            }
          }

          setIsPlaying(true);
        }
      }}
    >
      {/* {isPlaying ? t("Pause Sequence") : t("Play Sequence")} */}
      {isPlaying ? (
        <CreateIcon icon="pause" size="24px" />
      ) : (
        <CreateIcon icon="play" size="24px" />
      )}
    </button>
  );
};

export const PlayVideoButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
}> = ({ editorRef, editorStateRef }) => {
  const { t } = useTranslation("common");

  const [isPlaying, setIsPlaying] = useState(false);
  let [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    if (editorStateRef.current) {
      let canPlay = false;
      editorStateRef.current.savedState.sequences.forEach((seq) => {
        if (
          seq.activePolygons.length > 0 ||
          seq.activeImageItems.length > 0 ||
          seq.activeTextItems.length > 0 ||
          seq.activeVideoItems.length > 0
        ) {
          canPlay = true;
        }
      });

      setCanPlay(canPlay);
    }
  }, [editorStateRef]);

  if (!canPlay) {
    return (
      <>
        <span className="text-sm">Add content to play a video</span>
      </>
    );
  }

  return (
    <button
      className="text-xs rounded-md px-2 py-1 theme-button"
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
      {/* {isPlaying ? t("Pause Video") : t("Play Video")} */}
      {isPlaying ? (
        <CreateIcon icon="pause" size="24px" />
      ) : (
        <CreateIcon icon="play" size="24px" />
      )}
    </button>
  );
};

export const ExportVideoButton: React.FC<{
  editorRef: React.RefObject<Editor | null>;
  editorStateRef: React.RefObject<EditorState | null>;
}> = ({ editorRef, editorStateRef }) => {
  const { t } = useTranslation("common");

  let [isExporting, setIsExporting] = useState(false);
  let [progress, setProgress] = useState("0");
  let [canExport, setCanExport] = useState(false);

  useEffect(() => {
    if (editorStateRef.current) {
      let canExport = false;
      editorStateRef.current.savedState.sequences.forEach((seq) => {
        if (
          seq.activePolygons.length > 0 ||
          seq.activeImageItems.length > 0 ||
          seq.activeTextItems.length > 0 ||
          seq.activeVideoItems.length > 0
        ) {
          canExport = true;
        }
      });

      setCanExport(canExport);
    }
  }, [editorStateRef]);

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

    try {
      let isVertical =
        editorState.savedState.settings?.dimensions.height === 900
          ? true
          : false;

      const exporter = new FullExporter(isVertical);

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
    } catch (error: any) {
      console.error("export error", error);
      toast.error(error.message || "An error occurred");
    }
  };

  if (!canExport) {
    return (
      <>
        <span className="text-sm">Add content to export a video</span>
      </>
    );
  }

  return (
    <div className="flex flex-row gap-2 align-center">
      <button
        className="text-xs rounded-md text-white stunts-gradient px-2 py-1"
        disabled={isExporting}
        onClick={() => {
          exportHandler();
        }}
      >
        {isExporting ? t("Exporting") + "..." : t("Export Video")}
      </button>
      {isExporting && <p>{progress}%</p>}
    </div>
  );
};
