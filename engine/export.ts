import MP4Box from "mp4box";
import { Editor, Viewport } from "./editor";
import EditorState from "./editor_state";
import { CanvasPipeline } from "./pipeline";
import { SavedState } from "./animations";

class WebGPUVideoEncoder {
  private device: GPUDevice;
  private videoEncoder: VideoEncoder | null = null;
  private mp4File: any; // MP4Box.js type
  private frameCounter: number = 0;
  private readonly width: number;
  private readonly height: number;
  private readonly frameRate: number;

  constructor(
    device: GPUDevice,
    width: number,
    height: number,
    frameRate: number = 60
  ) {
    this.device = device;
    this.width = width;
    this.height = height;
    this.frameRate = frameRate;
    this.mp4File = MP4Box.createFile();
    this.initializeEncoder();
  }

  private async initializeEncoder() {
    // Configure video encoder
    this.videoEncoder = new VideoEncoder({
      output: (
        chunk: EncodedVideoChunk,
        metadata: EncodedVideoChunkMetadata | undefined
      ) => {
        // Add encoded data to MP4 file
        const buffer = new ArrayBuffer(chunk.byteLength);
        chunk.copyTo(buffer);
        this.mp4File.addSample(1, buffer, {
          duration: 1000 / this.frameRate,
          is_sync: chunk.type === "key",
        });
      },
      error: (error: Error) => {
        console.error("Video encoder error:", error);
      },
    });

    // Initialize encoder with configuration
    await this.videoEncoder.configure({
      codec: "avc1.42001f", // H.264 baseline profile
      width: this.width,
      height: this.height,
      bitrate: 5_000_000, // 5 Mbps
      framerate: this.frameRate,
    });

    // Initialize MP4 track
    this.mp4File.init({
      timescale: 1000,
      fragmented: true,
    });

    this.mp4File.addTrack({
      type: "video",
      timescale: 1000,
      width: this.width,
      height: this.height,
      codec: "avc1.42001f",
    });
  }

  async captureFrame(texture: GPUTexture): Promise<void> {
    if (!this.videoEncoder) {
      return;
    }

    // Create buffer to copy texture data
    const bytesPerRow = this.width * 4; // RGBA8Unorm format
    const bufferSize = bytesPerRow * this.height;

    const outputBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Create command encoder and copy texture to buffer
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer(
      {
        texture: texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        buffer: outputBuffer,
        bytesPerRow: bytesPerRow,
        rowsPerImage: this.height,
      },
      {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: 1,
      }
    );

    // Submit copy commands
    this.device.queue.submit([commandEncoder.finish()]);

    try {
      await outputBuffer.mapAsync(GPUMapMode.READ);
      const data = new Uint8Array(outputBuffer.getMappedRange());

      // Create a Blob from the image data (important for createImageBitmap)
      const blob = new Blob([data], { type: "image/png" }); // Or appropriate MIME type

      // Create ImageBitmap (asynchronous)
      // is creating a bitmap really the most performant way?
      const imageBitmap = await createImageBitmap(blob, {
        imageOrientation: "none", // or 'flipY' if needed
        premultiplyAlpha: "none", // or 'premultiply' if needed
      });

      // Create VideoFrame from the ImageBitmap
      const videoFrame = new VideoFrame(imageBitmap, {
        timestamp: (this.frameCounter * 1000000) / this.frameRate,
      });

      this.frameCounter++;

      await this.videoEncoder.encode(videoFrame);
      videoFrame.close();
      imageBitmap.close(); // Very important: Release ImageBitmap resources!

      outputBuffer.unmap();
      outputBuffer.destroy();
    } catch (error) {
      console.error("Error encoding frame:", error);
      // Handle the error appropriately (e.g., re-throw it)
      throw error;
    }
  }

  async finalize(): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      if (!this.videoEncoder) {
        resolve(null);
        return;
      }

      // Flush the encoder
      this.videoEncoder
        .flush()
        .then(() => {
          // Get MP4 data as Blob
          const blob = this.mp4File.getBlob();
          this.mp4File.flush();
          resolve(blob);
        })
        .catch(reject);
    });
  }
}

export class WebExport {
  encoder: WebGPUVideoEncoder;

  constructor(
    device: GPUDevice,
    width: number,
    height: number,
    frameRate: number
  ) {
    const encoder = new WebGPUVideoEncoder(device, width, height, frameRate);

    this.encoder = encoder;
  }

  async encodeFrame(renderTexture: GPUTexture) {
    await this.encoder.captureFrame(renderTexture);
  }

  async finalize() {
    const videoBlob = await this.encoder.finalize();

    if (!videoBlob) {
      return;
    }

    // Save or process the video
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.mp4";
    a.click();
  }
}

// export class FullExporter {
//   viewport: Viewport | null = null;
//   editor: Editor | null = null;
//   editorState: EditorState | null = null;
//   pipeline: CanvasPipeline | null = null;
//   webExport: WebExport | null = null;

//   constructor() {}

//   async initialize(savedState: SavedState) {
//     this.viewport = new Viewport(900, 550);

//     this.editor = new Editor(this.viewport);
//     this.editorState = new EditorState(savedState);

//     let pipeline = new CanvasPipeline();

//     this.pipeline = await pipeline.new(this.editor, false);

//     let windowSize = this.editor.camera?.windowSize;

//     if (!windowSize?.width || !windowSize?.height) {
//       return;
//     }

//     if (!this.editor.gpuResources) {
//       console.warn("No gpu resources");
//       return;
//     }

//     let targetFrameRate = 60;

//     this.webExport = new WebExport(
//       this.editor.gpuResources?.device,
//       windowSize?.width,
//       windowSize?.height,
//       targetFrameRate
//     );

//     this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

//     console.info("Export resore...");

//     let cloned_sequences = savedState.sequences;

//     for (let sequence of cloned_sequences) {
//       this.editor.restore_sequence_objects(sequence, true);
//     }

//     console.info("Begin encoding frames...");

//     const frameEncoder = (renderTexture: GPUTexture) => {
//       if (!this.webExport) {
//         return;
//       }

//       this.webExport.encodeFrame(renderTexture);
//     };

//     // TODO: frame loop
//     let currentTime = 0; // current time of video in seconds
//     this.pipeline.renderFrame(this.editor, frameEncoder, currentTime);

//     // finish with this.webExport.finalize();
//   }
// }

export class FullExporter {
  viewport: Viewport | null = null;
  editor: Editor | null = null;
  editorState: EditorState | null = null;
  pipeline: CanvasPipeline | null = null;
  webExport: WebExport | null = null;

  constructor() {}

  async initialize(
    savedState: SavedState,
    onProgress?: (
      progress: number,
      currentTime: number,
      totalDuration: number
    ) => void
  ) {
    this.viewport = new Viewport(900, 550);

    this.editor = new Editor(this.viewport);
    this.editorState = new EditorState(savedState);

    let pipeline = new CanvasPipeline();

    this.pipeline = await pipeline.new(this.editor, false);

    let windowSize = this.editor.camera?.windowSize;

    if (!windowSize?.width || !windowSize?.height) {
      return;
    }

    if (!this.editor.gpuResources) {
      console.warn("No gpu resources");
      return;
    }

    let targetFrameRate = 60;

    this.webExport = new WebExport(
      this.editor.gpuResources?.device,
      windowSize?.width,
      windowSize?.height,
      targetFrameRate
    );

    this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

    console.info("Export restore...");

    let cloned_sequences = savedState.sequences;

    for (let sequence of cloned_sequences) {
      this.editor.restore_sequence_objects(sequence, true);
    }

    const frameEncoder = (renderTexture: GPUTexture) => {
      if (!this.webExport) {
        return;
      }

      this.webExport.encodeFrame(renderTexture);
    };

    // Calculate total duration from sequences (rough for now)
    let totalDuration = 0;
    cloned_sequences.forEach((s) => {
      totalDuration += s.durationMs;
    });

    if (!totalDuration) {
      console.warn("No duration");
      return;
    }

    let now = Date.now();

    this.editor.videoStartPlayingTime = now;

    this.editor.videoCurrentSequenceTimeline = savedState.timeline_state;
    this.editor.videoCurrentSequencesData = savedState.sequences;

    this.editor.videoIsPlaying = true;

    // also set motion path playing
    this.editor.startPlayingTime = now;
    this.editor.isPlaying = true;

    console.info("Begin encoding frames...");

    // Frame loop
    const frameTime = 1 / targetFrameRate; // Time per frame in seconds
    let currentTime = 0;
    let lastProgressUpdate = 0;

    while (currentTime <= totalDuration) {
      // Render the current frame
      await this.pipeline.renderFrame(this.editor, frameEncoder, currentTime);

      // Advance time to next frame
      currentTime += frameTime;

      // Update progress every ~1% or at least every second
      const progress = currentTime / totalDuration;
      const timeSinceLastUpdate = currentTime - lastProgressUpdate;
      if (
        timeSinceLastUpdate >= 1.0 ||
        progress - lastProgressUpdate / totalDuration >= 0.01
      ) {
        onProgress?.(progress, currentTime, totalDuration);
        lastProgressUpdate = currentTime;
      }

      // Advance time to next frame
      currentTime += frameTime;
    }

    // Final progress update
    onProgress?.(1.0, totalDuration, totalDuration);

    // Finalize the export
    if (this.webExport) {
      console.info("Finalizing export...");
      await this.webExport.finalize();
    }
  }
}

// const exporter = new FullExporter();
// await exporter.initialize(savedState, (progress, currentTime, totalDuration) => {
//   console.log(`Export progress: ${(progress * 100).toFixed(1)}%`);
//   console.log(`Time: ${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`);
// });
