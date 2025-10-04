import MP4Box, { DataStream, MP4ArrayBuffer, MP4File } from "mp4box";
import { Editor, Viewport } from "./editor";
import EditorState from "./editor_state";
import { CanvasPipeline } from "./pipeline";
import { SavedState } from "./animations";
import { WindowSize } from "./camera";
import { vec2 } from "gl-matrix";
import { PolyfillDevice, PolyfillTexture } from "./polyfill";

class WebGPUVideoEncoder {
  private device: PolyfillDevice;
  private videoEncoder: VideoEncoder | null = null;
  private mp4File: any; // MP4Box.js type
  private frameCounter: number = 0;
  private readonly width: number;
  private readonly height: number;
  private readonly frameRate: number;
  private fileOffset = 0; // Track file offset
  trackId: any;
  // timescale: number = 1000;
  timescale: number = 90000; // Standard timescale for H.264
  microPerS: number = 1000000; // micro
  totalDurationMs: number = 2000; // ms

  constructor(
    device: PolyfillDevice,
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
          let trackDuration = Math.floor(
            this.totalDurationMs * (this.timescale / 1_000)
            // this.totalDurationMs * (this.timescale / 1_000_000)
            // this.totalDurationMs * 1_000 // convert to micro?
          );

          console.info("trackDuration", trackDuration);

          // Add video track
          this.trackId = this.mp4File.addTrack({
            timescale: this.timescale,
            width: this.width,
            height: this.height,
            brands: ["isom", "iso2", "avc1", "MP42", "MP41"],
            avcDecoderConfigRecord: metadata?.decoderConfig?.description,
            // duration: this.totalDurationMs,
            duration: trackDuration,
          });

          console.info(
            "addTrack...",
            this.trackId,
            metadata?.decoderConfig?.description
          );
        }

        // Add encoded data to MP4 file
        const dts = chunk.timestamp;

        // console.info(
        //   "chunk length",
        //   this.frameRate,
        //   chunk.type,
        //   chunk.byteLength,
        //   chunk.duration,
        //   dts
        // );
        const buffer = new ArrayBuffer(chunk.byteLength) as MP4ArrayBuffer;

        chunk.copyTo(buffer);

        const frameDuration = Math.floor(this.timescale / this.frameRate);

        this.mp4File.addSample(this.trackId, buffer, {
          // duration: this.microPerS / this.frameRate,
          // duration: chunk.duration,
          duration: frameDuration,
          is_sync: chunk.type === "key",
          dts,
          cts: dts,
        });

        // TODO: now continue with next captureFrame()
      },
      error: (error: Error) => {
        console.error("Video encoder error:", error);
      },
    });

    // Initialize encoder with configuration
    let config: VideoEncoderConfig = {
      // codec: "avc1.42001f", // H.264 baseline profile
      codec: "avc1.4D0032", // Much heigher resolution support
      // codec: "avc1.420034", // SHould support vertical
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
      timescale: this.timescale,
      fragmented: true,
      duration: Math.floor(
        this.totalDurationMs * (this.timescale / 1_000)
        // this.totalDurationMs * (this.timescale / 1_000_000)
        // this.totalDurationMs * 1_000
      ),
    });
  }

  async captureFrame(texture: PolyfillTexture): Promise<void> {
    if (!this.videoEncoder) {
      return;
    }

    const minimumBytesPerRow = this.width * 4; // RGBA8Unorm format
    const bytesPerRow = Math.ceil(minimumBytesPerRow / 256) * 256;
    const bufferSize = bytesPerRow * this.height;

    const outputBuffer = this.device.createBuffer(
      {
        size: bufferSize,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      },
      "" // uniformMatrix4fv, uniform1f, UBO, etc
    );

    // Create command encoder and copy texture to buffer
    // const commandEncoder = this.device.createCommandEncoder();
    // commandEncoder.copyTextureToBuffer(
    const paddedData = this.device.copyTextureToBuffer(
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
    // this.device.queue.submit([commandEncoder.finish()]);

    try {
      // await outputBuffer.mapAsync(GPUMapMode.READ);
      // const mappedData = outputBuffer.getMappedRange();
      // const paddedData = new Uint8Array(mappedData);

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

      // let timestamp = (this.frameCounter * this.microPerS) / this.frameRate;
      // // let test_duration = timestamp + this.microPerS / this.frameRate;
      // let test_duration = this.microPerS / this.frameRate;

      // console.info("pre timestamp", timestamp, test_duration);

      // const videoFrame = new VideoFrame(canvas, {
      //   timestamp: timestamp,
      //   // duration: 1000000 / this.frameRate,
      //   duration: test_duration,
      //   // duration: 1,
      //   // duration: test_duration,
      //   // displayHeight: this.height,
      //   // displayWidth: this.width,
      // });

      // Calculate timestamp in microseconds (VideoFrame API expects microseconds)
      const timestamp = Math.floor(
        (this.frameCounter * 1_000_000) / this.frameRate / 10
      );
      const frameDuration = Math.floor(1_000_000 / this.frameRate / 10);

      // console.info("pre timestamp", timestamp, frameDuration);

      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestamp,
        duration: frameDuration,
      });

      // test to see if animating in image data
      // looks good!
      // let testData = ctx.getImageData(0, 0, this.width, this.height);
      // let testCanvas = document.createElement("canvas");
      // testCanvas.width = this.width;
      // testCanvas.height = this.height;
      // document.body.appendChild(testCanvas); // Append the canvas to the body
      // let testCtx = testCanvas.getContext("2d");
      // testCtx?.putImageData(testData, 0, 0); // Place the image data at the top-left corner

      this.frameCounter++;

      await this.videoEncoder.encode(videoFrame);

      videoFrame.close();

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
    device: PolyfillDevice,
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

  async encodeFrame(renderTexture: PolyfillTexture) {
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
  isVertical: boolean;

  constructor(isVertical: boolean) {
    this.isVertical = isVertical;
  }

  async initialize(
    savedState: SavedState,
    onProgress?: (
      progress: number,
      currentTime: number,
      totalDuration: number
    ) => void
  ) {
    let windowSize: WindowSize = {
      // legacy
      // // 1x
      // // width: 800,
      // // height: 450,
      // // 2x
      // width: 1600,
      // height: 900,
      // full hd proper (2x still though)
      width: 1920,
      height: 1080,
    };

    if (this.isVertical) {
      windowSize = {
        width: 450,
        height: 800,
        // width: 900,
        // height: 1600,
      };
    }

    this.viewport = new Viewport(windowSize.width, windowSize.height);

    this.editor = new Editor(this.viewport);

    this.editor.scaleMultiplier = this.isVertical ? 1.0 : 2.0; // 2x WindowSize

    this.editorState = new EditorState(savedState);

    let pipeline = new CanvasPipeline();

    this.pipeline = await pipeline.new(
      this.editor,
      false,
      "",
      windowSize,
      false
    );

    if (!this.editor.camera) {
      return;
    }

    if (!windowSize?.width || !windowSize?.height) {
      return;
    }

    if (!this.editor.gpuResources) {
      console.warn("No gpu resources");
      return;
    }

    // // // this.editor.camera.position = vec2.fromValues(100.0, 100.0);
    // this.editor.camera.setPosition(0.1, 0.1, 0);
    // // // this.editor.camera.zoom = 2.0;
    // this.editor.cameraBinding?.update(
    //   this.editor.gpuResources?.queue!,
    //   this.editor.camera
    // );

    let targetFrameRate = 60;

    this.webExport = new WebExport(
      this.editor.gpuResources?.device!,
      windowSize?.width,
      windowSize?.height,
      targetFrameRate
    );

    await this.webExport.initialize();

    this.pipeline.recreateDepthView(windowSize?.width, windowSize?.height);

    console.info("Export restore...");

    let cloned_sequences = savedState.sequences;

    for (let [i, sequence] of cloned_sequences.entries()) {
      await this.editor.restore_sequence_objects(
        sequence,
        i === 0 ? false : true
      );
    }

    const frameEncoder = async (renderTexture: PolyfillTexture) => {
      if (!this.webExport) {
        return;
      }

      // console.info("Encoding frame...");

      await this.webExport.encodeFrame(renderTexture);

      // console.info("Frame encoded.");
    };

    // Calculate total duration from sequences (in milliseconds)
    let totalDurationMs = 0;
    cloned_sequences.forEach((s) => {
      if (s.durationMs) {
        totalDurationMs += s.durationMs;
      }
    });

    let totalDurationS = totalDurationMs / 1000; // Convert to seconds

    this.webExport.encoder.totalDurationMs = totalDurationMs;

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

    while (currentTimeMs <= totalDurationMs) {
      // console.info("Current time", currentTimeMs, totalDurationMs);
      // while (currentTimeMs <= this.webExport.encoder.totalDurationMs) {
      // Render the current frame

      try {
        await this.pipeline.renderWebglFrame(
          this.editor,
          frameEncoder,
          currentTimeMs / 1000
        );
      } catch (error) {
        console.error("Error during frame rendering:", error);
        break; // Exit the loop on error
      }

      // console.info("Frame rendered at", currentTimeMs, "ms");

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

      // console.info("Sleep now");

      await sleep(frameTimeMs + 25); // delay
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
