import MP4Box, { DataStream, MP4ArrayBuffer } from "mp4box";
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
  private fileOffset = 0; // Track file offset
  trackId: any;

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
    // this.initializeEncoder();
  }

  async initializeEncoder() {
    // return new Promise(async (resolve, reject) => {
    // Configure video encoder
    this.videoEncoder = new VideoEncoder({
      output: (
        chunk: EncodedVideoChunk,
        metadata: EncodedVideoChunkMetadata | undefined
      ) => {
        if (!this.trackId) {
          // Add video track
          this.trackId = this.mp4File.addTrack({
            // type: "video",
            timescale: 1000,
            width: this.width,
            height: this.height,
            // codec: "avc1.42001f",
            brands: ["isom", "iso2", "avc1", "MP42", "MP41"],
            avcDecoderConfigRecord: metadata?.decoderConfig?.description,
          });

          console.info(
            "addTrack...",
            this.trackId,
            metadata?.decoderConfig?.description
          );
        }

        // Add encoded data to MP4 file
        const dts = chunk.timestamp;

        console.info(
          "chunk length",
          this.frameRate,
          chunk.type,
          chunk.byteLength,
          chunk.duration,
          dts
        );
        const buffer = new ArrayBuffer(chunk.byteLength) as MP4ArrayBuffer;

        // buffer.fileStart = this.fileOffset; // Use current offset
        chunk.copyTo(buffer);

        this.mp4File.addSample(this.trackId, buffer, {
          // duration: 1000 / this.frameRate,
          // duration: chunk.duration,
          // duration: 1000000 / this.frameRate,
          duration: 1 / this.frameRate,
          is_sync: chunk.type === "key",
          // dts,
          // cts: dts,
        });

        // Update offset for next buffer
        this.fileOffset += buffer.byteLength;

        // TODO: now continue with next captureFrame()
      },
      error: (error: Error) => {
        console.error("Video encoder error:", error);
      },
    });

    // Initialize encoder with configuration
    let config: VideoEncoderConfig = {
      codec: "avc1.42001f", // H.264 baseline profile
      // codec: "avc1.4D0032",
      width: this.width,
      height: this.height,
      bitrate: 5_000_000, // 5 Mbps
      framerate: this.frameRate,
      avc: { format: "avc" } as AvcEncoderConfig,
    };
    this.videoEncoder.configure(config);

    const support = await VideoEncoder.isConfigSupported(config);
    console.log(
      `VideoEncoder's config ${JSON.stringify(support.config)} support: ${
        support.supported
      }`
    );

    this.mp4File.onReady = (info: MP4Box.MP4Info) => {
      console.info("ready info", info);
      // resolve(info);
    };

    this.mp4File.onError = (e: any) => {
      console.error("onError", e);
      // reject(e);
    };

    this.mp4File.onMoovStart = function () {
      console.info("Starting to receive File Information");
    };

    // Initialize MP4 file
    this.mp4File.init({
      timescale: 1000,
      fragmented: true,
    });
  }

  async captureFrame(texture: GPUTexture): Promise<void> {
    if (!this.videoEncoder) {
      return;
    }

    // Create buffer to copy texture data
    // const bytesPerRow = this.width * 4; // RGBA8Unorm format
    // const bufferSize = bytesPerRow * this.height;

    const minimumBytesPerRow = this.width * 4; // RGBA8Unorm format
    const bytesPerRow = Math.ceil(minimumBytesPerRow / 256) * 256;
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
      const mappedData = outputBuffer.getMappedRange();
      const paddedData = new Uint8Array(mappedData);

      // Calculate the actual and padded bytes per row
      const minimumBytesPerRow = this.width * 4;
      const alignedBytesPerRow = Math.ceil(minimumBytesPerRow / 256) * 256;

      // Create an array with the correct size for the image without padding
      const unpackedData = new Uint8Array(this.width * this.height * 4);

      // Copy the data row by row, removing the padding
      for (let row = 0; row < this.height; row++) {
        const sourceStart = row * alignedBytesPerRow;
        const sourceEnd = sourceStart + minimumBytesPerRow;
        const targetStart = row * minimumBytesPerRow;

        unpackedData.set(paddedData.slice(sourceStart, sourceEnd), targetStart);
      }

      outputBuffer.unmap();

      // Now create ImageData with the unpacked data
      const imageData = new ImageData(
        new Uint8ClampedArray(unpackedData.buffer),
        this.width,
        this.height
      );

      // Create a canvas to properly format the image data
      const canvas = new OffscreenCanvas(this.width, this.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Put the image data on the canvas
      ctx.fillStyle = "green";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.putImageData(imageData, 0, 0);

      let timestamp = (this.frameCounter * 1000000) / this.frameRate;
      let test_duration = timestamp + 1000000 / this.frameRate;

      console.info("pre timestamp", timestamp, test_duration);

      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestamp,
        // duration: 1000000 / this.frameRate,
        duration: 1 / this.frameRate,
        // duration: 1,
        // duration: test_duration,
        // displayHeight: this.height,
        // displayWidth: this.width,
      });

      this.frameCounter++;

      await this.videoEncoder.encode(videoFrame);

      videoFrame.close();
      // imageBitmap.close();

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

      console.info("flushing...");

      // Flush the encoder
      this.videoEncoder
        .flush()
        .then(() => {
          this.mp4File.flush();
          this.mp4File.stop();

          const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
          for (let len = this.mp4File.boxes.length, i = 0; i < len; i++) {
            this.mp4File.boxes[i].write(stream);
          }

          let blob = new Blob([stream.buffer], { type: "video/mp4" });

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

  async initialize() {
    await this.encoder.initializeEncoder();
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

    await this.webExport.initialize();

    this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

    console.info("Export restore...");

    let cloned_sequences = savedState.sequences;

    for (let sequence of cloned_sequences) {
      await this.editor.restore_sequence_objects(sequence, true);
    }

    const frameEncoder = async (renderTexture: GPUTexture) => {
      if (!this.webExport) {
        return;
      }

      await this.webExport.encodeFrame(renderTexture);
    };

    // Calculate total duration from sequences (in milliseconds)
    let totalDurationMs = 0;
    cloned_sequences.forEach((s) => {
      totalDurationMs += s.durationMs;
    });

    let totalDurationS = totalDurationMs / 1000; // Convert to seconds

    if (!totalDurationMs) {
      console.warn("No duration");
      return;
    }

    let now = Date.now();

    this.editor.videoStartPlayingTime = now;
    this.editor.videoCurrentSequenceTimeline = savedState.timeline_state;
    this.editor.videoCurrentSequencesData = savedState.sequences;
    this.editor.videoIsPlaying = true;

    this.editor.startPlayingTime = now;
    this.editor.isPlaying = true;

    console.info("Begin encoding frames...", totalDurationS);

    // Frame loop
    const frameTimeS = 1 / targetFrameRate; // Time per frame in seconds
    const frameTimeMs = frameTimeS * 1000; // Convert to milliseconds
    let currentTimeMs = 0;
    let lastProgressUpdateMs = 0;

    // while (currentTimeMs <= totalDurationMs) {
    while (currentTimeMs <= 200) {
      // Render the current frame
      await this.pipeline.renderFrame(this.editor, frameEncoder, currentTimeMs);

      // Advance time to next frame
      currentTimeMs += frameTimeMs;

      // Update progress every ~1% or at least every second
      const progress = currentTimeMs / totalDurationMs;
      const timeSinceLastUpdateMs = currentTimeMs - lastProgressUpdateMs;
      if (
        timeSinceLastUpdateMs >= 1000 || // Check if 1 second has passed (1000ms)
        progress - lastProgressUpdateMs / totalDurationMs >= 0.01
      ) {
        onProgress?.(progress, currentTimeMs / 1000, totalDurationS); // Convert currentTime to seconds for progress callback
        lastProgressUpdateMs = currentTimeMs;
      }

      await sleep(1000); // delay
    }

    // Final progress update
    onProgress?.(1.0, totalDurationS, totalDurationS);
    // onProgress?.(progress, currentTimeMs / 1000, totalDurationS);

    // Finalize the export
    if (this.webExport) {
      setTimeout(async () => {
        if (!this.webExport) {
          return;
        }

        console.info("Finalizing export...");
        await this.webExport.finalize();
      }, 1000);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// const exporter = new FullExporter();
// await exporter.initialize(savedState, (progress, currentTime, totalDuration) => {
//   console.log(`Export progress: ${(progress * 100).toFixed(1)}%`);
//   console.log(`Time: ${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`);
// });
