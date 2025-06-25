import { WindowSize } from "./camera";

// WebGPU resources class
export class WebGpuResources {
  surface: GPUCanvasContext | null;
  adapter: GPUAdapter;
  device: GPUDevice;
  queue: GPUQueue;

  private constructor(
    surface: GPUCanvasContext | null,
    adapter: GPUAdapter,
    device: GPUDevice,
    queue: GPUQueue
  ) {
    this.surface = surface;
    this.adapter = adapter;
    this.device = device;
    this.queue = queue;
  }

  static async request(
    canvas: HTMLCanvasElement | OffscreenCanvas | null,
    windowSize: WindowSize
  ): Promise<WebGpuResources> {
    if (!canvas) {
      throw Error("No canvas provided");
    }

    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser");
    }

    // Get WebGPU adapter
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });

    if (!adapter) {
      throw new GpuResourceError("AdapterNotFoundError");
    }

    // Request device from adapter
    const device = await adapter.requestDevice({
      label: "Main device",
      requiredFeatures: [],
      requiredLimits: {},
    });

    // Get canvas context
    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Couldn't get WebGPU context from canvas");
    }

    // Configure the canvas for the device
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });

    // Return the resources
    return new WebGpuResources(context, adapter, device, device.queue);
  }
}

// GPU Resource Error class
export class GpuResourceError extends Error {
  constructor(errorType: string, originalError?: Error) {
    const message = getErrorMessage(errorType, originalError);
    super(message);
    this.name = "GpuResourceError";

    // This is needed for proper TypeScript error handling
    Object.setPrototypeOf(this, GpuResourceError.prototype);
  }
}

function getErrorMessage(errorType: string, originalError?: Error): string {
  switch (errorType) {
    case "SurfaceCreationError":
      return `Surface creation error: ${
        originalError?.message || "unknown error"
      }`;
    case "AdapterNotFoundError":
      return "Failed to find a suitable GPU adapter";
    case "DeviceRequestError":
      return `Device request error: ${
        originalError?.message || "unknown error"
      }`;
    default:
      return `Unknown GPU resource error: ${
        originalError?.message || "unknown error"
      }`;
  }
}

// WebGL Polyfill Classes

export class PolyfillTexture {
  gl: WebGLRenderingContext;
  texture: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;

  constructor(
    gl: WebGLRenderingContext,
    width: number,
    height: number,
    format: number = gl.RGBA,
    type: number = gl.UNSIGNED_BYTE
  ) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.format = format;
    this.type = type;

    const texture = gl.createTexture();
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
    if (!texture) {
      throw new Error("Failed to create WebGL texture");
    }
    this.texture = texture;

    // Initialize texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format,
      width,
      height,
      0,
      format,
      type,
      null
    );
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
  }

  destroy() {
    this.gl.deleteTexture(this.texture);
  }

  updateFromFramebuffer(width?: number, height?: number) {
    const w = width || this.width;
    const h = height || this.height;
    const pixels = new Uint8Array(w * h * 4);

    // Debug: Check what framebuffer is currently bound
    // const currentFramebuffer = this.gl.getParameter(
    //   this.gl.FRAMEBUFFER_BINDING
    // );
    // console.log("Reading from framebuffer:", currentFramebuffer); // null = default framebuffer
    // console.log("Depth test enabled:", this.gl.isEnabled(this.gl.DEPTH_TEST));

    this.gl.readPixels(0, 0, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    this.flipPixelsVertically(pixels, w, h);

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      0,
      0,
      w,
      h,
      this.format,
      this.type,
      pixels
    );
  }

  // Helper function to flip pixels if video appears upside down
  flipPixelsVertically(pixels: Uint8Array, width: number, height: number) {
    const bytesPerRow = width * 4;
    const temp = new Uint8Array(bytesPerRow);

    for (let row = 0; row < height / 2; row++) {
      const topRowStart = row * bytesPerRow;
      const bottomRowStart = (height - 1 - row) * bytesPerRow;

      // Swap rows
      temp.set(pixels.subarray(topRowStart, topRowStart + bytesPerRow));
      pixels.set(
        pixels.subarray(bottomRowStart, bottomRowStart + bytesPerRow),
        topRowStart
      );
      pixels.set(temp, bottomRowStart);
    }
  }
}

export class PolyfillBindGroupLayout {
  entries: Array<{
    binding: number;
    visibility: number;
    type: "buffer" | "texture" | "sampler";
    bufferType?: "uniform" | "storage";
  }>;

  constructor(entries: PolyfillBindGroupLayout["entries"]) {
    this.entries = entries;
  }
}

export class PolyfillBindGroup {
  layout: PolyfillBindGroupLayout;
  // resources: Map<number, PolyfillBuffer | PolyfillTexture>;
  resources: Array<{
    binding: number;
    groupIndex: number; // Added groupIndex for binding
    resource: PolyfillBuffer | PolyfillTexture;
  }>;

  constructor(
    gl: WebGL2RenderingContext,
    layout: PolyfillBindGroupLayout,
    resources: Array<{
      binding: number;
      groupIndex: number; // Added groupIndex for binding
      resource: PolyfillBuffer | PolyfillTexture;
    }>
  ) {
    this.layout = layout;
    this.resources = resources;
    // this.resources = new Map();

    // resources.forEach(({ binding, resource }) => {
    //   this.resources.set(binding, resource);
    // });

    this.bindWebGLBindGroup(
      gl
      // 0 // Assuming groupIndex is 0 for simplicity
    );
  }

  getResource(binding: number): PolyfillBuffer | PolyfillTexture | undefined {
    // return this.resources.get(binding);
    const resource = this.resources.find((r) => r.binding === binding);
    return resource ? resource.resource : undefined;
  }

  // Updated bind group method
  bindWebGLBindGroup(gl: WebGL2RenderingContext): void {
    const program = gl.getParameter(gl.CURRENT_PROGRAM);

    if (!program) {
      console.warn(
        "No active WebGL program to bind resources to"
        // this.resources
      );
      return;
    }

    // console.info("program", program);

    this.resources.forEach((resource) => {
      const uniformName = `bindGroup${resource.groupIndex}_${resource.binding}`;

      if (resource.resource instanceof PolyfillBuffer) {
        switch (resource.resource.type) {
          case "uniformMatrix4fv":
            // Get uniform location and set matrix data
            const matrixLocation = gl.getUniformLocation(program, uniformName);
            if (matrixLocation) {
              if (!resource.resource.data) {
                console.warn(`No data found for matrix uniform ${uniformName}`);
                return;
              }

              // Assuming the buffer contains Float32Array matrix data
              const matrixData = new Float32Array(resource.resource.data!);
              gl.uniformMatrix4fv(matrixLocation, false, matrixData);
            } else {
              console.warn(
                `Matrix uniform ${uniformName} not found in program`
              );
            }
            break;

          case "uniform2f":
            // Get uniform location and set vec2 data
            const vec2Location = gl.getUniformLocation(program, uniformName);
            if (vec2Location) {
              if (!resource.resource.data) {
                console.warn(`No data found for matrix uniform ${uniformName}`);
                return;
              }

              // Assuming the buffer contains 2 floats (e.g., window size)
              const vec2Data = new Float32Array(resource.resource.data!);
              gl.uniform2fv(vec2Location, vec2Data);
            } else {
              console.warn(`Vec2 uniform ${uniformName} not found in program`);
            }
            break;

          case "UBO":
            // Bind uniform buffer
            const uniformBlockIndex = gl.getUniformBlockIndex(
              program,
              uniformName
            );
            // console.info("uniformBlockIndex", uniformBlockIndex);
            if (uniformBlockIndex === gl.INVALID_INDEX) {
              console.warn(
                `Uniform block ${uniformName} not found in program ${program}`
              );
              return;
            }
            if (uniformBlockIndex !== gl.INVALID_INDEX) {
              // Bind the uniform block to a binding point
              // const bindingPoint = resource.groupIndex * 10 + resource.binding; // Unique binding point
              const bindingPoint = 0;
              gl.uniformBlockBinding(program, uniformBlockIndex, bindingPoint);
              gl.bindBufferBase(
                gl.UNIFORM_BUFFER,
                bindingPoint,
                resource.resource.buffer
              );
            }
            break;

          default:
            break;
        }
      } else if (resource.resource instanceof PolyfillTexture) {
        // Bind texture
        // const textureUnit = resource.groupIndex * 10 + resource.binding; // Unique texture unit
        const textureUnit = 0;
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, resource.resource.texture);

        // Set the uniform sampler
        const samplerLocation = gl.getUniformLocation(program, uniformName);
        if (samplerLocation) {
          gl.uniform1i(samplerLocation, textureUnit);
        }
      }
    });
  }
}

export class PolyfillBuffer {
  gl: WebGL2RenderingContext;
  buffer: WebGLBuffer;
  size: number;
  usage: "uniform" | "vertex" | "index" | "storage";
  data: ArrayBuffer | null = null;
  type: string | null = null; // uniformMatrix4fv, uniform1f, UBO, etc

  constructor(
    gl: WebGL2RenderingContext,
    size: number,
    usage: PolyfillBuffer["usage"] = "uniform",
    type: string | null // uniformMatrix4fv, uniform1f, UBO, etc
  ) {
    this.gl = gl;
    this.size = size;
    this.usage = usage;
    this.type = type;

    const buffer = gl.createBuffer();
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
    if (!buffer) {
      throw new Error("Failed to create WebGL buffer");
    }
    this.buffer = buffer;

    // Bind and allocate buffer
    const target = this.getGLTarget();
    gl.bindBuffer(target, this.buffer);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
    gl.bufferData(target, size, gl.DYNAMIC_DRAW);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
  }

  private getGLTarget(): number {
    switch (this.usage) {
      case "vertex":
        return this.gl.ARRAY_BUFFER;
      case "index":
        return this.gl.ELEMENT_ARRAY_BUFFER;
      case "uniform":
      case "storage":
        return this.gl.UNIFORM_BUFFER || this.gl.ARRAY_BUFFER;
      // case "storage":
      //   return this.gl.ARRAY_BUFFER;
      default:
        return this.gl.ARRAY_BUFFER;
    }
  }

  mapAsync(): Promise<ArrayBuffer> {
    // WebGL doesn't support async mapping, so we return the cached data
    return Promise.resolve(this.data || new ArrayBuffer(this.size));
  }

  getMappedRange(): ArrayBuffer {
    if (!this.data) {
      this.data = new ArrayBuffer(this.size);
    }
    return this.data;
  }

  unmap() {
    if (this.data) {
      // Write the data to the GPU buffer
      const target = this.getGLTarget();
      this.gl.bindBuffer(target, this.buffer);
      this.gl.bufferSubData(target, 0, this.data);
    }
  }

  destroy() {
    this.gl.deleteBuffer(this.buffer);
  }
}

export class PolyfillDevice {
  webgpuDevice: GPUDevice | null = null;
  webglContext: WebGL2RenderingContext | null = null;
  queue: PolyfillQueue | null = null;
  private textureCache = new Map<string, PolyfillTexture>();
  private bufferCache = new Map<string, PolyfillBuffer>();

  constructor(webglContext: WebGL2RenderingContext, queue: PolyfillQueue) {
    this.webglContext = webglContext;
    this.queue = queue;
  }

  createBindGroupLayout(descriptor: {
    entries: Array<{
      binding: number;
      visibility: number;
      buffer?: { type: "uniform" | "storage" };
      texture?: { sampleType: string };
      sampler?: {};
    }>;
  }): PolyfillBindGroupLayout {
    const entries = descriptor.entries.map((entry) => ({
      binding: entry.binding,
      visibility: entry.visibility,
      type: entry.buffer
        ? ("buffer" as const)
        : entry.texture
        ? ("texture" as const)
        : ("sampler" as const),
      bufferType: entry.buffer?.type,
    }));

    return new PolyfillBindGroupLayout(entries);
  }

  createBindGroup(descriptor: {
    layout: PolyfillBindGroupLayout;
    entries: Array<{
      binding: number;
      groupIndex: number; // Optional group index for binding
      resource: PolyfillBuffer | PolyfillTexture | { pbuffer: PolyfillBuffer };
    }>;
  }): PolyfillBindGroup {
    const resources = descriptor.entries.map((entry) => ({
      binding: entry.binding,
      groupIndex: entry.groupIndex || 0, // Default to 0 if not provided
      resource:
        "pbuffer" in entry.resource ? entry.resource.pbuffer : entry.resource,
    }));

    return new PolyfillBindGroup(
      this.webglContext!,
      descriptor.layout,
      resources
    );
  }

  createBuffer(
    descriptor: {
      size: number;
      usage: number;
      mappedAtCreation?: boolean;
      label?: string;
    },
    type: string | null // uniformMatrix4fv, uniform1f, UBO, etc
  ): PolyfillBuffer {
    if (!this.webglContext) {
      throw new Error("WebGL context not available");
    }

    // // Map WebGPU usage flags to our buffer types
    // let usage: PolyfillBuffer["usage"] = "uniform";
    // if (descriptor.usage & 0x20) usage = "vertex"; // VERTEX
    // if (descriptor.usage & 0x40) usage = "index"; // INDEX
    // if (descriptor.usage & 0x80) usage = "storage"; // STORAGE

    let usage: PolyfillBuffer["usage"] = "uniform"; // Default

    if (descriptor.usage & GPUBufferUsage.INDEX) {
      usage = "index";
    } else if (descriptor.usage & GPUBufferUsage.VERTEX) {
      usage = "vertex";
    } else if (descriptor.usage & GPUBufferUsage.STORAGE) {
      usage = "storage";
    } else if (descriptor.usage & GPUBufferUsage.UNIFORM) {
      usage = "uniform";
    }

    const buffer = new PolyfillBuffer(
      this.webglContext,
      descriptor.size,
      usage,
      type
    );

    if (descriptor.mappedAtCreation) {
      buffer.getMappedRange(); // Initialize the mapped range
    }

    return buffer;
  }

  createTexture(descriptor: {
    size: { width: number; height: number; depthOrArrayLayers?: number };
    format: string;
    usage: number;
    label?: string;
  }): PolyfillTexture {
    if (!this.webglContext) {
      throw new Error("WebGL context not available");
    }

    // Map WebGPU format to WebGL format
    let format: number = this.webglContext.RGBA;
    let type = this.webglContext.UNSIGNED_BYTE;

    switch (descriptor.format) {
      case "rgba8unorm":
        format = this.webglContext.RGBA;
        type = this.webglContext.UNSIGNED_BYTE;
        break;
      case "bgra8unorm":
        format = this.webglContext.RGBA; // WebGL doesn't have BGRA in core
        type = this.webglContext.UNSIGNED_BYTE;
        break;
      case "rgb":
        format = this.webglContext.RGB;
        type = this.webglContext.UNSIGNED_BYTE;
        break;
      //   case "rgba32float":
      //     format = this.webglContext.RGBA;
      //     type = this.webglContext.FLOAT;
      //     break;
    }

    return new PolyfillTexture(
      this.webglContext,
      descriptor.size.width,
      descriptor.size.height,
      format,
      type
    );
  }

  //   createRenderPipeline(descriptor: any): any {
  //     // Simplified render pipeline - you'll need to expand this based on your needs
  //     return {
  //       bind: () => {
  //         // Bind shaders, set up state, etc.
  //       },
  //     };
  //   }

  createShaderModule(descriptor: { code: string; label?: string }): any {
    if (!this.webglContext) {
      throw new Error("WebGL context not available");
    }

    // This is a simplified shader module - you'll need to implement
    // WGSL to GLSL transpilation or provide GLSL directly
    return {
      code: descriptor.code,
      label: descriptor.label,
    };
  }

  createPipelineLayout(descriptor: {
    label?: string;
    bindGroupLayouts: PolyfillBindGroupLayout[];
  }): PolyfillPipelineLayout {
    return new PolyfillPipelineLayout(descriptor.bindGroupLayouts);
  }

  createRenderPipeline(descriptor: any): PolyfillRenderPipeline {
    if (!this.webglContext) {
      throw new Error("WebGL context not available");
    }

    const gl = this.webglContext;

    // Assume the shader module contains raw GLSL or preprocessed code.
    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      descriptor.vertex.module.code
    );
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vertexShader));
    }

    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      descriptor.fragment.module.code
    );
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram();
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    // if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    //   console.error(gl.getProgramInfoLog(program));
    // }

    if (!program || !vertexShader || !fragmentShader) {
      throw new Error("Failed to create program or shaders");
    }

    gl.attachShader(program, vertexShader);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    gl.attachShader(program, fragmentShader);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    gl.linkProgram(program);
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program link error: ${log}`);
    }

    return new PolyfillRenderPipeline({
      gl,
      program,
      descriptor,
    });
  }

  // copyTextureToBuffer(
  //   {
  //     texture,
  //   }: {
  //     texture: PolyfillTexture;
  //     mipLevel: number;
  //     origin: { x: number; y: number; z: number };
  //   },
  //   { buffer, bytesPerRow, rowsPerImage }: any,
  //   { width, height }: any
  // ): Uint8Array {
  //   const gl = this.webglContext;

  //   if (!gl) {
  //     throw new Error("WebGL context not available");
  //   }

  //   const framebuffer = gl.createFramebuffer();
  //   gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  //   gl.framebufferTexture2D(
  //     gl.FRAMEBUFFER,
  //     gl.COLOR_ATTACHMENT0,
  //     gl.TEXTURE_2D,
  //     texture.texture, // WebGLTexture
  //     0
  //   );

  //   if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
  //     throw new Error("Framebuffer is not complete");
  //   }

  //   const rawData = new Uint8Array(width * height * 4);
  //   gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rawData);

  //   const padded = new Uint8Array(bytesPerRow * height);
  //   for (let row = 0; row < height; row++) {
  //     const src = row * width * 4;
  //     const dst = row * bytesPerRow;
  //     padded.set(rawData.subarray(src, src + width * 4), dst);
  //   }

  //   // Simulate the buffer mapping
  //   buffer.data = padded; // or use getMappedRange() later

  //   return padded;
  // }

  copyTextureToBuffer(
    {
      texture,
    }: {
      texture: PolyfillTexture;
      mipLevel: number;
      origin: { x: number; y: number; z: number };
    },
    { buffer, bytesPerRow, rowsPerImage }: any,
    { width, height }: any
  ): Uint8Array {
    const gl = this.webglContext;

    if (!gl) {
      throw new Error("WebGL context not available");
    }

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Attach the color texture
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture.texture,
      0
    );

    // Create and attach a depth buffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depthBuffer
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete");
    }

    // Make sure to clear the depth buffer before rendering
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const rawData = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rawData);

    // Clean up
    // gl.deleteRenderbuffer(depthBuffer);
    // gl.deleteFramebuffer(framebuffer);

    const padded = new Uint8Array(bytesPerRow * height);
    for (let row = 0; row < height; row++) {
      const src = row * width * 4;
      const dst = row * bytesPerRow;
      padded.set(rawData.subarray(src, src + width * 4), dst);
    }

    buffer.data = padded;
    return padded;
  }
}

export class PolyfillRenderPipeline {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  descriptor: any;

  constructor({
    gl,
    program,
    descriptor,
  }: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    descriptor: any;
  }) {
    this.gl = gl;
    this.program = program;
    this.descriptor = descriptor;
  }

  use() {
    this.gl.useProgram(this.program);

    // this is all done in renderWebglFrame()
    // Set viewport to match canvas size
    // this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // // Set clear color and clear
    // this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // error checking
    const error = this.gl.getError();
    if (error !== this.gl.NO_ERROR) {
      console.warn("WebGL Error:", error);
    }
  }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");

  // console.info(`Compiling shader of type ${type} with source:`, source);

  gl.shaderSource(shader, source);
  let error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.warn("WebGL Error:", error);
  }

  gl.compileShader(shader);
  error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.warn("WebGL Error:", error);
  }

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }

  return shader;
}

export class PolyfillPipelineLayout {
  constructor(public bindGroupLayouts: PolyfillBindGroupLayout[]) {}
}

export class PolyfillQueue {
  gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  // writeBuffer(
  //   buffer: PolyfillBuffer,
  //   bufferOffset: number,
  //   data: ArrayBuffer | ArrayBufferView,
  //   dataOffset?: number,
  //   size?: number
  // ) {
  //   // Set data property (ArrayBuffer) on PolyfillBuffer accounting for dataOffset and size
  //   const sourceBuffer = data instanceof ArrayBuffer ? data : data.buffer;
  //   const actualDataOffset = dataOffset || 0;
  //   const actualSize =
  //     size !== undefined
  //       ? size
  //       : data instanceof ArrayBuffer
  //       ? data.byteLength - actualDataOffset
  //       : data.byteLength;

  //   // Create a new ArrayBuffer with just the relevant data
  //   const relevantData = sourceBuffer.slice(
  //     actualDataOffset,
  //     actualDataOffset + actualSize
  //   );

  //   // Update the buffer's data property
  //   if (!buffer.data || buffer.data.byteLength < bufferOffset + actualSize) {
  //     // Expand the buffer if needed
  //     const newSize = Math.max(
  //       buffer.data?.byteLength || 0,
  //       bufferOffset + actualSize
  //     );
  //     const newBuffer = new ArrayBuffer(newSize);
  //     if (buffer.data) {
  //       new Uint8Array(newBuffer).set(new Uint8Array(buffer.data));
  //     }
  //     buffer.data = newBuffer;
  //   }

  //   // Copy the new data into the buffer at the specified offset
  //   new Uint8Array(buffer.data, bufferOffset, actualSize).set(
  //     new Uint8Array(relevantData)
  //   );

  //   buffer.unmap(); // Ensure the buffer is updated in WebGL

  //   // const target =
  //   //   buffer.usage === "vertex"
  //   //     ? this.gl.ARRAY_BUFFER
  //   //     : buffer.usage === "index"
  //   //     ? this.gl.ELEMENT_ARRAY_BUFFER
  //   //     : this.gl.ARRAY_BUFFER;

  //   let target: number;
  //   switch (buffer.usage) {
  //     case "vertex":
  //       target = this.gl.ARRAY_BUFFER;
  //       break;
  //     case "index":
  //       target = this.gl.ELEMENT_ARRAY_BUFFER;
  //       break;
  //     case "storage":
  //     case "uniform":
  //       target = this.gl.UNIFORM_BUFFER || this.gl.ARRAY_BUFFER;
  //       break;
  //     default:
  //       target = this.gl.ARRAY_BUFFER;
  //   }

  //   this.gl.bindBuffer(target, buffer.buffer);

  //   const dataToWrite =
  //     size !== undefined
  //       ? new Uint8Array(
  //           data instanceof ArrayBuffer ? data : data.buffer,
  //           dataOffset || 0,
  //           size
  //         )
  //       : data instanceof ArrayBuffer
  //       ? new Uint8Array(data, dataOffset || 0)
  //       : new Uint8Array(
  //           data.buffer,
  //           data.byteOffset + (dataOffset || 0),
  //           data.byteLength
  //         );

  //   this.gl.bufferSubData(target, bufferOffset, dataToWrite);
  // }

  writeBuffer(
    buffer: PolyfillBuffer,
    bufferOffset: number,
    data: ArrayBuffer | ArrayBufferView,
    dataOffset?: number,
    size?: number
  ) {
    // Convert input data to Float32Array for consistent float handling
    let floatData: Float32Array;

    if (data instanceof ArrayBuffer) {
      const actualDataOffset = dataOffset || 0;
      const actualSize =
        size !== undefined ? size : data.byteLength - actualDataOffset;
      floatData = new Float32Array(data, actualDataOffset, actualSize / 4); // Divide by 4 for float32 elements
    } else if (data instanceof Float32Array) {
      const actualDataOffset = dataOffset || 0;
      const actualSize =
        size !== undefined ? size / 4 : data.length - actualDataOffset;
      floatData = data.subarray(
        actualDataOffset,
        actualDataOffset + actualSize
      );
    } else {
      // Convert other typed arrays to Float32Array
      const actualDataOffset = dataOffset || 0;
      const actualSize = size !== undefined ? size : data.byteLength;
      const sourceView = new Uint8Array(
        data.buffer,
        data.byteOffset + actualDataOffset,
        actualSize
      );
      floatData = new Float32Array(
        sourceView.buffer,
        sourceView.byteOffset,
        actualSize / 4
      );
    }

    // Calculate byte size for buffer operations
    const byteSize = floatData.byteLength;
    const byteOffset = bufferOffset;

    // Expand buffer if needed
    if (!buffer.data || buffer.data.byteLength < byteOffset + byteSize) {
      const newSize = Math.max(
        buffer.data?.byteLength || 0,
        byteOffset + byteSize
      );
      const newBuffer = new ArrayBuffer(newSize);
      if (buffer.data) {
        new Uint8Array(newBuffer).set(new Uint8Array(buffer.data));
      }
      buffer.data = newBuffer;
    }

    // Copy float data into buffer
    new Float32Array(buffer.data, byteOffset, floatData.length).set(floatData);

    buffer.unmap();

    // Determine WebGL buffer target
    let target: number;
    switch (buffer.usage) {
      case "vertex":
        target = this.gl.ARRAY_BUFFER;
        break;
      case "index":
        target = this.gl.ELEMENT_ARRAY_BUFFER;
        break;
      case "storage":
      case "uniform":
        target = this.gl.UNIFORM_BUFFER || this.gl.ARRAY_BUFFER;
        break;
      default:
        target = this.gl.ARRAY_BUFFER;
    }

    this.gl.bindBuffer(target, buffer.buffer);

    // Upload the float data directly to WebGL
    this.gl.bufferSubData(target, byteOffset, floatData);
  }
  writeTexture(
    destination: {
      texture: PolyfillTexture;
      mipLevel?: number;
      origin?: { x: number; y: number; z: number };
    },
    // data: ArrayBuffer | ArrayBufferView,
    data:
      | Uint8Array<ArrayBufferLike>
      | Uint8ClampedArray<ArrayBufferLike>
      | VideoFrame,
    dataLayout: { offset?: number; bytesPerRow: number; rowsPerImage?: number },
    size: { width: number; height: number; depthOrArrayLayers?: number }
  ) {
    const texture = destination.texture;
    const origin = destination.origin || { x: 0, y: 0, z: 0 };

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);

    // log first few values
    // console.log("Writing texture data:", {
    //   width: size.width,
    //   height: size.height,
    //   mipLevel: destination.mipLevel || 0,
    //   origin,
    //   dataLength: data.byteLength,
    //   dataLayout,
    //   firstValues: data.slice(0, 10),
    // });

    // const dataArray =
    //   data instanceof ArrayBuffer
    //     ? new Uint8Array(data, dataLayout.offset || 0)
    //     : new Uint8Array(
    //         data.buffer,
    //         data.byteOffset + (dataLayout.offset || 0)
    //       );

    if (data instanceof VideoFrame) {
      // this.gl.texSubImage2D(
      //   this.gl.TEXTURE_2D,
      //   destination.mipLevel || 0,
      //   origin.x,
      //   origin.y,
      //   size.width,
      //   size.height,
      //   texture.format,
      //   texture.type,
      //   data
      // );
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        data
      );
    } else {
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        destination.mipLevel || 0,
        origin.x,
        origin.y,
        size.width,
        size.height,
        texture.format,
        texture.type,
        data
      );
    }
  }

  submit(commandBuffers: any[]) {
    // In WebGL, commands are executed immediately rather than being queued
    // This is where you'd execute any deferred commands if you implement command buffers
    this.gl.flush();
  }

  onSubmittedWorkDone(): Promise<void> {
    return new Promise((resolve) => {
      // WebGL doesn't have async work completion, so we resolve immediately
      // In a real implementation, you might want to use gl.finish() and setTimeout
      setTimeout(resolve, 0);
    });
  }
}

export class GPUPolyfill {
  chosenBackend: "webgl" | "webgpu" = "webgl";
  device: PolyfillDevice | null = null;
  queue: PolyfillQueue | null = null;
  webgpuResources: WebGpuResources | null = null;
  canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  windowSize: { width: number; height: number } = { width: 900, height: 550 };
  webglContext: WebGL2RenderingContext | null = null;

  constructor(
    chosenBackend: "webgl" | "webgpu" = "webgl",
    canvas: HTMLCanvasElement | OffscreenCanvas | null = null,
    windowSize: { width: number; height: number } = { width: 900, height: 550 }
  ) {
    this.chosenBackend = chosenBackend;
    this.canvas = canvas;
    this.windowSize = windowSize;
  }

  async initializeResources() {
    if (this.chosenBackend === "webgl") {
      if (!this.canvas) {
        throw new Error("Canvas is required for WebGL backend");
      }

      // Get WebGL context with depth buffer
      const gl = this.canvas.getContext("webgl2", {
        depth: true,
        stencil: true,
        antialias: true,
        premultipliedAlpha: false,
      }) as WebGL2RenderingContext;
      if (!gl) {
        throw new Error("Failed to get WebGL context");
      }

      this.webglContext = gl;

      // Set up viewport
      gl.viewport(0, 0, this.windowSize.width, this.windowSize.height);

      // Enable common WebGL features
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      // Create polyfill device and queue
      this.queue = new PolyfillQueue(gl);
      this.device = new PolyfillDevice(gl, this.queue);
    } else if (this.chosenBackend === "webgpu") {
      // Includes Surface, Adapter, Device, and Queue
      const gpuResources = await WebGpuResources.request(
        this.canvas,
        this.windowSize
      );

      this.webgpuResources = gpuResources;
    }
  }

  // Helper methods for unified API
  getDevice(): GPUDevice | PolyfillDevice {
    if (this.chosenBackend === "webgpu" && this.webgpuResources) {
      return this.webgpuResources.device;
    } else if (this.chosenBackend === "webgl" && this.device) {
      return this.device;
    }
    throw new Error("Device not initialized");
  }

  getQueue(): GPUQueue | PolyfillQueue {
    if (this.chosenBackend === "webgpu" && this.webgpuResources) {
      return this.webgpuResources.queue;
    } else if (this.chosenBackend === "webgl" && this.queue) {
      return this.queue;
    }
    throw new Error("Queue not initialized");
  }

  getContext(): GPUCanvasContext | WebGLRenderingContext {
    if (this.chosenBackend === "webgpu" && this.webgpuResources?.surface) {
      return this.webgpuResources.surface;
    } else if (this.chosenBackend === "webgl" && this.webglContext) {
      return this.webglContext;
    }
    throw new Error("Context not initialized");
  }

  // Cleanup method
  destroy() {
    if (this.chosenBackend === "webgl" && this.webglContext) {
      // Clean up WebGL resources
      const gl = this.webglContext;

      // You might want to track and clean up created resources here
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }

    this.device = null;
    this.queue = null;
    this.webgpuResources = null;
    this.webglContext = null;
  }
}
