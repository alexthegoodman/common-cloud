import { Sequence } from "./animations";
import { WindowSize } from "./camera";
import { Editor, Viewport } from "./editor";
import { CanvasPipeline } from "./pipeline";

class PreviewManager {
  public previewCache;
  public pipeline: CanvasPipeline | null = null;
  public editor: Editor | null = null;

  constructor() {
    this.previewCache = new Map(); // Map<sequenceId, {blobUrl, timestamp}>
  }

  async initialize(docCanasSize: WindowSize, sequences: Sequence[]) {
    let viewport = new Viewport(docCanasSize.width, docCanasSize.height);

    this.editor = new Editor(viewport);

    console.info("Initializing pipeline...");

    let pipelineC = new CanvasPipeline();

    this.pipeline = await pipelineC.new(this.editor, true, "doc-canvas", {
      width: docCanasSize.width,
      height: docCanasSize.height,
    });

    let windowSize = this.editor.camera?.windowSize;

    if (!windowSize?.width || !windowSize?.height) {
      return;
    }

    this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

    console.info("Beginning rendering...");

    await this.pipeline.beginRendering(this.editor);

    // console.info("Restoring objects...");

    for (let [sequenceIndex, sequence] of sequences.entries()) {
      this.editor.restore_sequence_objects(
        sequence,
        // sequenceIndex === 0 ? false : true
        true
        // authToken.token,
      );
    }
  }

  async generatePreview(sequenceId: string) {
    if (!this.editor || !this.pipeline?.canvas) {
      return;
    }

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

    // Get the rendered content as a blob
    const blob = await (this.pipeline?.canvas as OffscreenCanvas).convertToBlob(
      {
        type: "image/webp",
        quality: 0.8,
      }
    );

    // Revoke old blob URL if it exists
    if (this.previewCache.has(sequenceId)) {
      URL.revokeObjectURL(this.previewCache.get(sequenceId).blobUrl);
    }

    // Create and store new blob URL
    const blobUrl = URL.createObjectURL(blob);
    this.previewCache.set(sequenceId, {
      blobUrl,
      timestamp: Date.now(),
    });

    return blobUrl;
  }

  getPreview(sequenceId: string) {
    return this.previewCache.get(sequenceId)?.blobUrl;
  }

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

// Usage example
// const previewManager = new PreviewManager();

// async function updateDocumentPreview(
//   sequenceId: string,
//   documentTimestamp: number
// ) {
//   if (previewManager.isPreviewStale(sequenceId, documentTimestamp)) {
//     const previewUrl = await previewManager.generatePreview(sequenceId);
//     return previewUrl;
//   }
//   return previewManager.getPreview(sequenceId);
// }
