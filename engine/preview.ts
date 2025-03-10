import { BackgroundFill, Sequence } from "./animations";
import { WindowSize } from "./camera";
import { Editor, Viewport } from "./editor";
import { SaveTarget } from "./editor_state";
import { CanvasPipeline } from "./pipeline";

export class PreviewManager {
  public previewCache: Map<string, { blobUrl: string; timestamp: number }>;
  public pipeline: CanvasPipeline | null = null;
  public editor: Editor | null = null;
  public paperSize: WindowSize | null = null;

  constructor() {
    this.previewCache = new Map(); // Map<sequenceId, {blobUrl, timestamp}>
  }

  async initialize(
    docCanvasSize: WindowSize,
    paperSize: WindowSize,
    sequences: Sequence[],
    saveTarget: SaveTarget
  ) {
    this.paperSize = paperSize;

    let viewport = new Viewport(docCanvasSize.width, docCanvasSize.height);

    this.editor = new Editor(viewport);

    this.editor.target = saveTarget;

    // !this.isPlaying || !this.currentSequenceData
    this.editor.isPlaying = true; // false is passed on pipeline stepFrame to assure no continiuous rendering on preview

    console.info("Initializing pipeline...");

    let pipelineC = new CanvasPipeline();

    this.pipeline = await pipelineC.new(
      this.editor,
      false,
      "",
      {
        width: docCanvasSize.width,
        height: docCanvasSize.height,
      },
      false
    );

    let windowSize = this.editor.camera?.windowSize;

    if (!windowSize?.width || !windowSize?.height) {
      return;
    }

    this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

    console.info("Beginning rendering...");

    await this.pipeline.beginRendering(this.editor);

    // console.info("Restoring objects...");

    for (let [sequenceIndex, sequence] of sequences.entries()) {
      await this.editor.restore_sequence_objects(
        sequence,
        // sequenceIndex === 0 ? false : true
        true
        // authToken.token,
      );
    }
  }

  preparePreview(sequenceId: string, savedSequence: Sequence) {
    if (!this.editor || !this.pipeline?.canvas) {
      throw Error("No editor or canvas for preview");
    }

    this.editor.currentSequenceData = savedSequence;

    for (const polygon of this.editor.polygons) {
      polygon.hidden = polygon.currentSequenceId !== sequenceId;
    }
    for (const text of this.editor.textItems) {
      text.hidden = text.currentSequenceId !== sequenceId;
    }
    for (const image of this.editor.imageItems) {
      image.hidden = image.currentSequenceId !== sequenceId;
    }
    for (const video of this.editor.videoItems) {
      video.hidden = video.currentSequenceId !== sequenceId;
    }

    if (!this.paperSize) {
      return;
    }

    let background_fill = {
      type: "Color",
      value: [0.8, 0.8, 0.8, 1],
    } as BackgroundFill;

    if (savedSequence?.backgroundFill) {
      background_fill = savedSequence.backgroundFill;
    }

    this.editor.replace_background(sequenceId, background_fill, this.paperSize);
  }

  async generatePreview(sequenceId: string): Promise<string> {
    // Get the rendered content as a blob
    const blob = await (this.pipeline?.canvas as OffscreenCanvas).convertToBlob(
      {
        type: "image/webp",
        quality: 0.8,
      }
    );

    // Revoke old blob URL if it exists
    if (this.previewCache && this.previewCache.has(sequenceId)) {
      let cacheItem = this.previewCache.get(sequenceId);

      if (cacheItem?.blobUrl) {
        URL.revokeObjectURL(cacheItem?.blobUrl);
      }
    }

    // Create and store new blob URL
    const blobUrl = URL.createObjectURL(blob);
    this.previewCache.set(sequenceId, {
      blobUrl,
      timestamp: Date.now(),
    });

    return blobUrl;
  }

  //   getPreview(sequenceId: string): string {
  //     return this.previewCache.get(sequenceId)?.blobUrl;
  //   }

  isPreviewStale(sequenceId: string, documentTimestamp: number) {
    const preview = this.previewCache.get(sequenceId);
    return !preview || preview.timestamp < documentTimestamp;
  }

  cleanup() {
    // Revoke all blob URLs when done
    for (const { blobUrl } of this.previewCache.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    this.previewCache.clear();
  }
}
