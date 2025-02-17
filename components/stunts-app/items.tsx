"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { CreateIcon } from "./icon";
import { useDebounce } from "@uidotdev/usehooks";
import { Editor } from "@/engine/editor";
import EditorState from "@/engine/editor_state";

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

  return (
    <button
      className="w-64 rounded-xl flex items-center justify-start py-2 bg-white
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
  style: string;
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
      style={{ ...parseStyle(style) }} // Apply the style string
      onClick={handleClick}
    >
      <div className="text-black mb-1">
        <CreateIcon icon={icon} size="24px" />
      </div>
      <span className="text-xs">{label}</span>
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
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  id,
  label,
  placeholder,
  initialValue,
  onDebounce,
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
    <div className="space-y-4">
      <label htmlFor={id} className="text-xs">
        {label}
      </label>
      <input
        id={id}
        name={id}
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
