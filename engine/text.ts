import { mat4, vec2 } from "gl-matrix";
import * as fontkit from "fontkit";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Camera, WindowSize } from "./camera";
import { getZLayer, Vertex } from "./vertex";
import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  rgbToWgpu,
  wgpuToHuman,
} from "./editor";
import { INTERNAL_LAYER_SPACE, Polygon, setupGradientBuffers } from "./polygon";
import { ObjectType } from "./animations";

export interface TextRendererConfig {
  id: string;
  name: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  dimensions: [number, number];
  position: { x: number; y: number };
  layer: number;
  color: [number, number, number, number];
  backgroundFill: [number, number, number, number];
}

export interface SavedTextRendererConfig {
  id: string;
  name: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  dimensions: [number, number];
  position: { x: number; y: number };
  layer: number;
  color: [number, number, number, number];
  backgroundFill?: [number, number, number, number];
}

export interface GlyphRasterConfig {
  // Define the properties needed for rasterizing a glyph
  // For example, the character to rasterize, font size, etc.
  character: string;
  fontSize: number;
}

export interface AtlasGlyph {
  uv_rect: [number, number, number, number];
  metrics: {
    width: number;
    height: number;
    ymin: number;
    xmin: number;
  };
}

export class TextRenderer {
  id: string;
  name: string;
  text: string;
  font: fontkit.Font;
  transform: Transform;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  atlasTexture: GPUTexture;
  atlasSize: [number, number];
  nextAtlasPosition: [number, number];
  currentRowHeight: number;
  glyphCache: Map<string, AtlasGlyph>;
  hidden: boolean;
  layer: number;
  color: [number, number, number, number];
  fontSize: number;
  device: GPUDevice;
  sampler: GPUSampler;
  backgroundPolygon: Polygon;
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  groupBindGroup: GPUBindGroup;
  vertices?: Vertex[];
  indices?: number[];
  dimensions: [number, number];
  initialized: boolean;
  fontFamily: string;
  currentSequenceId: string;
  objectType: ObjectType;
  textureView: GPUTextureView;
  // gradientBindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    // gradientBindGroupLayout: GPUBindGroupLayout,
    textConfig: TextRendererConfig,
    fontData: Buffer,
    windowSize: WindowSize,
    currentSequenceId: string,
    camera: Camera
  ) {
    this.id = textConfig.id;
    this.name = textConfig.name;
    this.text = textConfig.text;
    this.layer = textConfig.layer;
    this.color = textConfig.color;
    this.fontSize = textConfig.fontSize;
    this.device = device;
    this.dimensions = textConfig.dimensions;
    this.fontFamily = textConfig.fontFamily;
    this.initialized = false;
    this.currentSequenceId = currentSequenceId;
    this.objectType = ObjectType.TextItem;

    this.glyphCache = new Map();
    this.atlasSize = [4096, 4096];
    this.nextAtlasPosition = [0, 0];
    this.currentRowHeight = 0;

    this.hidden = false;

    this.font = fontkit.create(fontData) as fontkit.Font;

    let [gradient, gradientBuffer] = setupGradientBuffers(
      device,
      queue
      // gradientBindGroupLayout
    );

    // this.gradientBindGroup = gradientBindGroup;

    this.vertexBuffer = this.device.createBuffer({
      size: 65536,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.device.createBuffer({
      size: 65536,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.atlasTexture = this.device.createTexture({
      size: {
        width: this.atlasSize[0],
        height: this.atlasSize[1],
        depthOrArrayLayers: 1,
      },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.sampler = this.device.createSampler({
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear",
    });

    const identityMatrix = mat4.create();
    this.uniformBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.uniformBuffer.getMappedRange()).set(identityMatrix);
    this.uniformBuffer.unmap();

    this.textureView = this.atlasTexture.createView();

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.textureView },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: gradientBuffer } },
      ],
    });

    // console.info("text config", textConfig);

    this.transform = new Transform(
      vec2.fromValues(textConfig.position.x, textConfig.position.y),
      0.0,
      vec2.fromValues(1.0, 1.0),
      this.uniformBuffer
    );

    // this.backgroundPolygon = new Polygon(
    //   textConfig.dimensions,
    //   textConfig.position,
    //   textConfig.backgroundFill
    // );

    this.backgroundPolygon = new Polygon(
      windowSize,
      device,
      queue,
      bindGroupLayout,
      groupBindGroupLayout,
      // gradientBindGroupLayout,
      camera,
      [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 },
      ],
      textConfig.dimensions, // width = length of segment, height = thickness
      textConfig.position,
      0.0,
      0.0,
      // [0.5, 0.8, 1.0, 1.0], // light blue with some transparency
      textConfig.backgroundFill,
      // [0.2, 0.3, 0.4, 0.1],
      {
        thickness: 0.0,
        fill: rgbToWgpu(0, 0, 0, 255.0),
      },
      // -1.0,
      // 1, // positive to use INTERNAL_LAYER_SPACE
      1.0,
      textConfig.layer - 1.0 - INTERNAL_LAYER_SPACE,
      textConfig.name,
      this.id,
      currentSequenceId
    );

    this.backgroundPolygon.hidden = false;

    // -10.0 to provide 10 spots for internal items on top of objects
    this.transform.layer = textConfig.layer - INTERNAL_LAYER_SPACE;
    this.transform.updateUniformBuffer(queue, windowSize);

    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      windowSize
    );

    this.groupBindGroup = tmp_group_bind_group;
  }

  addGlyphToAtlas(
    device: GPUDevice,
    queue: GPUQueue,
    rasterConfig: GlyphRasterConfig
  ): AtlasGlyph {
    // Get the glyph layout for the given character (using fontkit for metrics)
    const glyphRun = this.font.layout(rasterConfig.character);
    const glyph = glyphRun.glyphs[0];
    const position = glyphRun.positions[0];

    // Calculate metrics
    const scale = rasterConfig.fontSize / this.font.unitsPerEm;
    const boundingBox = glyph.bbox;

    const metrics = {
      width: position.xAdvance * scale,
      height: (boundingBox.maxY - boundingBox.minY) * scale,
      xmin: boundingBox.minX * scale,
      ymin: boundingBox.minY * scale,
    };

    // Create an offscreen canvas to render the glyph
    let canvas_width = Math.ceil(boundingBox.width * scale);
    let canvas_height = Math.ceil(
      (boundingBox.maxY - boundingBox.minY) * scale
    );

    if (canvas_width <= 0 || canvas_height <= 0) {
      canvas_width = 1;
      canvas_height = 1;
    }

    const canvas = new OffscreenCanvas(canvas_width, canvas_height);
    // let canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = "copy"; // Disable premultiplied alpha

    // Set canvas size to match the glyph's bounding box
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    // console.info(
    //   "text canvas dimensions",
    //   rasterConfig,
    //   this.font.familyName,
    //   canvas.width,
    //   canvas.height
    // );

    // Render the glyph onto the canvas using native Canvas API
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white"; // Use white for the glyph color, or black for testing

    // Set up the font and text rendering
    ctx.font = `${rasterConfig.fontSize}px ${this.font.familyName}`;

    console.info("this.font.familyName", this.font.familyName);

    ctx.textBaseline = "alphabetic"; // Align text to the baseline
    ctx.textAlign = "left"; // Align text to the left

    // Translate to account for the glyph's bounding box
    // ctx.translate(-boundingBox.minX * scale, -boundingBox.minY * scale);

    // Draw the character using the native Canvas API
    // ctx.fillText(rasterConfig.character, 0, 0);

    const baselineY = Math.ceil(boundingBox.maxY * scale);
    ctx.fillText(rasterConfig.character, 0, baselineY);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert the image data to RGBA format
    const rgbaData = new Uint8Array(imageData.data.buffer);

    // visualizeRGBA(rgbaData, canvas.width, canvas.height, "glyphCanvas"); // Pass the canvas width/height

    // Check if we need to move to the next row in the atlas
    if (this.nextAtlasPosition[0] + canvas.width > this.atlasSize[0]) {
      this.nextAtlasPosition[0] = 0;
      this.nextAtlasPosition[1] += this.currentRowHeight;
      this.currentRowHeight = 0;
    }

    // Update current row height if this glyph is taller
    this.currentRowHeight = Math.max(this.currentRowHeight, canvas.height);

    // Calculate UV coordinates
    const uv_rect: [number, number, number, number] = [
      this.nextAtlasPosition[0] / this.atlasSize[0],
      this.nextAtlasPosition[1] / this.atlasSize[1],
      canvas.width / this.atlasSize[0],
      canvas.height / this.atlasSize[1],
    ];

    // console.info("rgbData", rgbaData.length);

    // Write glyph bitmap to atlas
    queue.writeTexture(
      {
        texture: this.atlasTexture,
        mipLevel: 0,
        origin: {
          x: this.nextAtlasPosition[0],
          y: this.nextAtlasPosition[1],
          z: 0,
        },
      },
      rgbaData,
      {
        offset: 0,
        bytesPerRow: canvas.width * 4, // *4 for RGBA
        rowsPerImage: canvas.height,
      },
      {
        width: canvas.width,
        height: canvas.height,
        depthOrArrayLayers: 1,
      }
    );

    // Update atlas position for next glyph
    this.nextAtlasPosition[0] += canvas.width;

    // console.info("atlas position", this.nextAtlasPosition);

    return {
      uv_rect,
      // metrics: [metrics.width, metrics.height, metrics.xmin, metrics.ymin],
      metrics,
    };
  }

  renderText(device: GPUDevice, queue: GPUQueue) {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const text = this.text;

    // Use fontkit's layout function to get glyph positions and metrics
    const glyphRun = this.font.layout(text);

    // Calculate the scale factor based on the font's unitsPerEm
    const scale = this.fontSize / this.font.unitsPerEm;

    // // console.info("glyph scale", scale);

    // Calculate the total width and height of the text
    let totalWidth = 0;
    let totalHeight = 0;
    for (const position of glyphRun.positions) {
      // Scale xAdvance and add to total width
      totalWidth += position.xAdvance * scale;
      // // console.info("added width", position.xAdvance * scale);
      totalHeight = Math.max(
        totalHeight,
        (position.yOffset + glyphRun.bbox.maxY - glyphRun.bbox.minY) * scale
      );
    }

    // console.info("totals", totalWidth, totalHeight);

    // Calculate the starting x and y positions to center the text
    const startX = -totalWidth / 2.0;
    const startY = -totalHeight / 2.0;

    let currentX = startX;

    for (let i = 0; i < glyphRun.glyphs.length; i++) {
      const glyph = glyphRun.glyphs[i];
      const position = glyphRun.positions[i];

      // console.info("glyph pos", position);

      // Create a unique key for the glyph (e.g., glyph ID + font size)
      const key = `${glyph.id}-${this.fontSize}`;

      // Ensure the glyph is in the atlas
      if (!this.glyphCache.has(key)) {
        const atlasGlyph = this.addGlyphToAtlas(device, queue, {
          character: String.fromCodePoint(glyph.codePoints[0]), // Convert code point to character
          fontSize: this.fontSize,
        });
        this.glyphCache.set(key, atlasGlyph);
      }

      const atlasGlyph = this.glyphCache.get(key)!;

      // // console.info("rendering glyph", atlasGlyph, glyph, position);

      const baseVertex = vertices.length;

      // Scale the glyph's position and metrics
      let x0 = currentX;
      let x1 = x0 + atlasGlyph.metrics.width;
      currentX += position.xAdvance * scale; // Update for next character

      let yOffset = position.yAdvance * scale;

      // Calculate vertex positions using the scaled glyph's position and metrics
      let y0 = startY + yOffset;
      let y1 = y0 + atlasGlyph.metrics.height; // metrics[1] is already scaled in addGlyphToAtlas

      // UV coordinates from atlas
      let u0 = atlasGlyph.uv_rect[0];
      let u1 = u0 + atlasGlyph.uv_rect[2];
      let v0 = atlasGlyph.uv_rect[1];
      let v1 = v0 + atlasGlyph.uv_rect[3];

      const z = getZLayer(1.0);

      const activeColor = rgbToWgpu(
        this.color[0],
        this.color[1],
        this.color[2],
        255.0
      );

      y0 = y0 === -Infinity || y0 === Infinity ? 0 : y0;
      y1 = y1 === -Infinity || y1 === Infinity ? 0 : y1;

      // console.info("vertice pos", x0, x1, y0, y1);

      const normalizedX0 =
        (x0 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY0 =
        (y0 - this.transform.position[1]) / this.dimensions[1];
      const normalizedX1 =
        (x1 - this.transform.position[0]) / this.dimensions[0];
      const normalizedY1 =
        (y1 - this.transform.position[1]) / this.dimensions[1];

      // Add vertices for the glyph quad
      vertices.push(
        {
          position: [x0, y0, z],
          tex_coords: [u0, v0],
          color: activeColor,
          gradient_coords: [normalizedX0, normalizedY0],
          object_type: 1, // OBJECT_TYPE_TEXT
        },
        {
          position: [x1, y0, z],
          tex_coords: [u1, v0],
          color: activeColor,
          gradient_coords: [normalizedX1, normalizedY0],
          object_type: 1, // OBJECT_TYPE_TEXT
        },
        {
          position: [x1, y1, z],
          tex_coords: [u1, v1],
          color: activeColor,
          gradient_coords: [normalizedX1, normalizedY1],
          object_type: 1, // OBJECT_TYPE_TEXT
        },
        {
          position: [x0, y1, z],
          tex_coords: [u0, v1],
          color: activeColor,
          gradient_coords: [normalizedX0, normalizedY1],
          object_type: 1, // OBJECT_TYPE_TEXT
        }
      );

      // Add indices for the glyph quad (two triangles)
      indices.push(
        baseVertex,
        baseVertex + 1,
        baseVertex + 2,
        baseVertex,
        baseVertex + 2,
        baseVertex + 3
      );
    }

    // console.info("vertices", vertices);

    // Update buffers
    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        vertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
          ...v.gradient_coords,
          v.object_type,
        ])
      )
    );
    queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(indices));

    // Store vertices and indices for later use
    this.vertices = vertices;
    this.indices = indices;
  }

  update(
    device: GPUDevice,
    queue: GPUQueue,
    text: string,
    dimensions: [number, number]
  ) {
    this.dimensions = dimensions;
    this.updateText(device, queue, text);
    this.initialized = true;
  }

  updateLayer(layerIndex: number) {
    // -10.0 to provide 10 spots for internal items on top of objects
    const adjustedLayerIndex = layerIndex - INTERNAL_LAYER_SPACE;
    this.layer = adjustedLayerIndex;
    this.transform.layer = adjustedLayerIndex;
    this.backgroundPolygon.layer = adjustedLayerIndex - 1;
    this.backgroundPolygon.transform.layer = adjustedLayerIndex - 1;
  }

  updateText(device: GPUDevice, queue: GPUQueue, text: string) {
    this.text = text;
    this.renderText(device, queue);
  }

  updateFontFamily(fontData: Buffer) {
    const font = fontkit.create(fontData) as fontkit.Font;
    this.font = font;
    this.glyphCache = new Map(); // Clear the glyph cache
  }

  updateOpacity(queue: GPUQueue, opacity: number) {
    this.backgroundPolygon.updateOpacity(queue, opacity);

    const newColor = rgbToWgpu(
      this.color[0],
      this.color[1],
      this.color[2],
      opacity * 255.0
    );

    // Update vertex colors
    this.vertices?.forEach((vertex) => {
      vertex.color = newColor;
    });

    if (!this.vertices) {
      return;
    }

    // Write updated vertices to the vertex buffer
    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        this.vertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
          ...v.gradient_coords,
          v.object_type,
        ])
      )
    );
  }

  updateDataFromDimensions(
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    dimensions: [number, number],
    camera: Camera
  ) {
    this.backgroundPolygon.updateDataFromDimensions(
      windowSize,
      device,
      queue,
      bindGroupLayout,
      dimensions,
      camera
    );

    this.dimensions = dimensions;

    // Re-render text to ensure proper wrapping
    this.renderText(device, queue);
  }

  containsPoint(point: { x: number; y: number }, camera: Camera): boolean {
    const untranslated = {
      x: point.x - this.transform.position[0],
      y: point.y - this.transform.position[1],
    };

    // Check if the point is within the bounds of the rectangle
    return (
      untranslated.x >= -0.5 * this.dimensions[0] &&
      untranslated.x <= 0.5 * this.dimensions[0] &&
      untranslated.y >= -0.5 * this.dimensions[1] &&
      untranslated.y <= 0.5 * this.dimensions[1]
    );
  }

  toLocalSpace(
    worldPoint: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number } {
    const untranslated = {
      x: worldPoint.x - this.transform.position[0],
      y: worldPoint.y - this.transform.position[1],
    };

    return {
      x: untranslated.x / this.dimensions[0],
      y: untranslated.y / this.dimensions[1],
    };
  }

  toConfig(): TextRendererConfig {
    return {
      id: this.id,
      name: this.name,
      text: this.text,
      fontFamily: this.fontFamily,
      dimensions: this.dimensions,
      position: {
        x: this.transform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.transform.position[1] - CANVAS_VERT_OFFSET,
      },
      layer: this.layer,
      color: this.color,
      fontSize: this.fontSize,
      backgroundFill: [
        wgpuToHuman(this.backgroundPolygon.fill[0]),
        wgpuToHuman(this.backgroundPolygon.fill[1]),
        wgpuToHuman(this.backgroundPolygon.fill[2]),
        wgpuToHuman(this.backgroundPolygon.fill[3]),
      ],
    };
  }

  static fromConfig(
    config: TextRendererConfig,
    windowSize: WindowSize,
    device: GPUDevice,
    queue: GPUQueue,
    modelBindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    // gradientBindGroupLayout: GPUBindGroupLayout,
    camera: Camera,
    selectedSequenceId: string,
    fontData: Buffer
  ): TextRenderer {
    return new TextRenderer(
      device,
      queue,
      modelBindGroupLayout,
      groupBindGroupLayout,
      // gradientBindGroupLayout,
      config,
      fontData,
      windowSize,
      selectedSequenceId,
      camera
    );
  }
}

function visualizeRGBA(
  rgbaData: Uint8Array,
  width: number,
  height: number,
  canvasId: string
) {
  // let canvas = document.getElementById(canvasId) as HTMLCanvasElement; // Try to get an existing canvas
  // if (!canvas) {
  let canvas = document.createElement("canvas");
  canvas.id = canvasId; // Set an ID so we can reuse it
  document.body.appendChild(canvas);
  // }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("bad ctx");
    return;
  }

  // Set a background color (e.g., light gray) to see if anything is there
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, width, height);

  // Check if rgbaData is empty or has unexpected length
  if (!rgbaData || rgbaData.length === 0) {
    console.error("rgbaData is empty!");
    return; // Don't try to draw anything
  }

  // if (rgbaData.length !== width * height * 4) {
  //   console.warn(
  //     "rgbaData length is unexpected:",
  //     rgbaData.length,
  //     "expected:",
  //     width * height * 4
  //   );
  //   // If the length is wrong, try to correct it (fill with 0s)
  //   const correctedRgba = new Uint8Array(width * height * 4);
  //   correctedRgba.set(
  //     rgbaData.slice(0, Math.min(rgbaData.length, correctedRgba.length))
  //   ); // Copy available data
  //   rgbaData = correctedRgba; // Use the corrected array
  // }

  try {
    const imageData = new ImageData(
      new Uint8ClampedArray(rgbaData),
      width,
      height
    );
    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error("Error creating ImageData:", error);
    console.log("rgbaData:", rgbaData); // Inspect the data
    console.log("width:", width, "height:", height);
  }
}
