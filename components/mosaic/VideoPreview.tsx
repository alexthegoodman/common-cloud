"use client";

import { WindowSize } from "@/engine/camera";
import { PreviewManager } from "@/engine/preview";
import { PublicProjectInfo } from "@/fetchers/mosaic";
import { useDevEffectOnce } from "@/hooks/useDevOnce";
import { useRef, useState } from "react";

let paperAspectRatio = 9 / 16; // standard US paper size
let width = 800;
let height = width * paperAspectRatio;
let paperSize: WindowSize = {
  width,
  height,
};

export default function VideoPreview({
  project = null,
}: {
  project: PublicProjectInfo | null;
}) {
  const previewManagerRef = useRef<PreviewManager | null>(null);
  let [previewCache, setPreviewCache] = useState<
    Map<string, { blobUrl: string; timestamp: number }>
  >(new Map());

  useDevEffectOnce(async () => {
    if (!project) {
      return;
    }

    let cloned_sequences = project?.video_data.sequences;

    console.info("cloned_sequences", cloned_sequences);

    if (!cloned_sequences) {
      return;
    }

    previewManagerRef.current = new PreviewManager();

    let docCanvasSize: WindowSize = {
      width: 900,
      height: 500,
    };

    await previewManagerRef.current.initialize(
      docCanvasSize,
      paperSize,
      cloned_sequences
    );

    if (!previewManagerRef.current.editor) {
      return;
    }

    let firstSequence = cloned_sequences[0];

    if (!firstSequence) {
      return;
    }

    let sequenceId = firstSequence.id;

    previewManagerRef.current.preparePreview(sequenceId, firstSequence);
    previewManagerRef.current.pipeline?.renderFrame(
      previewManagerRef.current.editor
    );
    const previewUrl = await previewManagerRef.current.generatePreview(
      sequenceId
    );

    setPreviewCache(previewManagerRef.current.previewCache);
  });

  return (
    <div className="w-full aspect-video bg-gray-400 mb-4">
      {Array.from(previewCache).map((cacheItem, i) => (
        <img
          key={"previewImage" + i}
          src={cacheItem[1].blobUrl}
          className="block rounded"
        />
      ))}
    </div>
  );
}
