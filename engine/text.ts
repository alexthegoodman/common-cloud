import { mat4, vec2 } from "gl-matrix";
import * as fontkit from "fontkit";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Camera, WindowSize } from "./camera";
import { getZLayer, Vertex } from "./vertex";
import {
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Point,
  rgbToWgpu,
  wgpuToHuman,
} from "./editor";
import { INTERNAL_LAYER_SPACE, Polygon, setupGradientBuffers } from "./polygon";
import { BackgroundFill, ObjectType } from "./animations";
import { FormattedPage, RenderItem } from "./rte";

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
  // backgroundFill: [number, number, number, number];
  backgroundFill: BackgroundFill;
  isCircle: boolean;
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
  // backgroundFill?: [number, number, number, number];
  backgroundFill: BackgroundFill;
  isCircle: boolean;
}

export interface GlyphRasterConfig {
  // Define the properties needed for rasterizing a glyph
  // For example, the character to rasterize, font size, etc.
  character: string;
  fontSize: number;
}

export interface CharRasterConfig {
  charItem: RenderItem;
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
  isCircle: boolean;
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
    camera: Camera,
    isTextArea: boolean
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
    this.isCircle = textConfig.isCircle;

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
      size: isTextArea ? 4000000 : 131072, // 4MB to 128kb
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.device.createBuffer({
      size: isTextArea ? 1000000 : 131072, // 1mb to 128kb
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
      0.0,
      textConfig.layer - 0.5,
      textConfig.name,
      this.id,
      currentSequenceId,
      textConfig.isCircle
    );

    this.backgroundPolygon.hidden = false;

    // -10.0 to provide 10 spots for internal items on top of objects
    let layer_index = -1.0 - getZLayer(textConfig.layer - INTERNAL_LAYER_SPACE);
    this.transform.layer = layer_index;
    this.transform.updateUniformBuffer(queue, windowSize);

    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      windowSize
    );

    this.groupBindGroup = tmp_group_bind_group;
  }

  addAreaGlyphToAtlas(
    device: GPUDevice,
    queue: GPUQueue,
    charGlyph: CharRasterConfig
  ): AtlasGlyph {
    const metrics = {
      width: charGlyph.charItem.width,
      // height: charGlyph.charItem.capHeight,
      height: charGlyph.charItem.height,
      xmin: charGlyph.charItem.x,
      ymin: charGlyph.charItem.y,
    };

    // Create an offscreen canvas to render the glyph
    let canvas_width = charGlyph.charItem.width + 1;
    // let canvas_height = charGlyph.charItem.capHeight;
    let canvas_height = charGlyph.charItem.height + 1;

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

    // Render the glyph onto the canvas using native Canvas API
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white"; // Use white for the glyph color, or black for testing

    // Set up the font and text rendering
    ctx.font = `${charGlyph.fontSize}px ${this.font.familyName}`;

    console.info("this.font.familyName", this.font.familyName);

    ctx.textBaseline = "alphabetic"; // Align text to the baseline
    ctx.textAlign = "left"; // Align text to the left

    const baselineY = Math.ceil(charGlyph.charItem.height);
    ctx.fillText(charGlyph.charItem.char, 0, baselineY);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert the image data to RGBA format
    const rgbaData = new Uint8Array(imageData.data.buffer);

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

    return {
      uv_rect,
      // metrics: [metrics.width, metrics.height, metrics.xmin, metrics.ymin],
      metrics,
    };
  }

  renderAreaText(
    device: GPUDevice,
    queue: GPUQueue,
    // docByPage: { [key: number]: RenderItem[] }
    renderPages: FormattedPage[]
  ) {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    // Calculate the total width and height of the text
    const startX = 0;
    const startY = 0;
    let globalNlIndex = 0;
    let globalIndex = 0;
    // let currentX = startX;
    for (let [pageIndex, page] of Object.entries(renderPages)) {
      // temp
      // console.info("pageindex", pageIndex);
      if (parseInt(pageIndex) > 0) {
        continue;
      }

      let layoutNodes = page.layout.query(0, page.content.length);

      if (!layoutNodes[0].layoutInfo) {
        return;
      }

      for (let charItem of layoutNodes[0].layoutInfo) {
        // let charItem = node.layoutInfo[0];

        globalNlIndex++;

        if (charItem?.char === "\n") {
          continue;
        }

        globalIndex++;

        const glyph = charItem.char;

        // Create a unique key for the glyph (e.g., glyph ID + font size)
        const key = `${glyph}-${this.fontSize}`;

        // Ensure the glyph is in the atlas
        if (!this.glyphCache.has(key)) {
          const atlasGlyph = this.addAreaGlyphToAtlas(device, queue, {
            charItem, // Convert code point to character
            fontSize: this.fontSize,
          });
          this.glyphCache.set(key, atlasGlyph);
        }

        const atlasGlyph = this.glyphCache.get(key)!;

        const baseVertex = vertices.length;

        const baselineY = charItem.capHeight - charItem.height;

        let x0 = charItem.x;
        let x1 = charItem.x + charItem.width;
        let y0 = charItem.y + baselineY;
        let y1 = charItem.y + charItem.height + baselineY;

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

        let vertexId = `${charItem.char}-${charItem.page}-${globalIndex}-${
          globalNlIndex - 1
        }`;

        // Add vertices for the glyph quad
        vertices.push(
          {
            position: [x0, y0, z],
            tex_coords: [u0, v0],
            color: activeColor,
            gradient_coords: [normalizedX0, normalizedY0],
            object_type: 1, // OBJECT_TYPE_TEXT
            id: vertexId,
          },
          {
            position: [x1, y0, z],
            tex_coords: [u1, v0],
            color: activeColor,
            gradient_coords: [normalizedX1, normalizedY0],
            object_type: 1, // OBJECT_TYPE_TEXT
            id: vertexId,
          },
          {
            position: [x1, y1, z],
            tex_coords: [u1, v1],
            color: activeColor,
            gradient_coords: [normalizedX1, normalizedY1],
            object_type: 1, // OBJECT_TYPE_TEXT
            id: vertexId,
          },
          {
            position: [x0, y1, z],
            tex_coords: [u0, v1],
            color: activeColor,
            gradient_coords: [normalizedX0, normalizedY1],
            object_type: 1, // OBJECT_TYPE_TEXT
            id: vertexId,
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

        // TODO: double check functioning with multiple pages
        if (page.preCalculatedIndex !== null) {
          if (page.preCalculatedIndex === globalIndex) {
            if (this.vertices && this.indices) {
              console.info("preCalculatedIndex", page.preCalculatedIndex);
              // push rest of this.vertices to vertices as cache
              // also same with indices
              let vertLength = vertices.length;
              let indLength = indices.length;

              vertices.push(...this.vertices?.slice(vertLength));
              indices.push(...this.indices?.slice(indLength));

              break;
            }
          }
        }
      }
    }

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

    console.info("character", rasterConfig.character, boundingBox);

    const metrics = {
      width: position.xAdvance * scale,
      height: (boundingBox.maxY - boundingBox.minY) * scale,
      xmin: boundingBox.minX * scale,
      ymin: boundingBox.minY * scale,
    };

    // Create an offscreen canvas with 3x resolution
    const DPI_SCALE = 3; // Increase this for even higher quality
    let canvas_width = Math.ceil(metrics.width * DPI_SCALE) + 1;
    let canvas_height = Math.ceil(metrics.height * DPI_SCALE) + 2;

    if (canvas_width <= 0 || canvas_height <= 0) {
      canvas_width = 1;
      canvas_height = 1;
    }

    const canvas = new OffscreenCanvas(canvas_width, canvas_height);
    const ctx = canvas.getContext("2d", {
      alpha: true,
      antialias: true,
    });

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    // Enable subpixel rendering and set better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = "copy"; // Disable premultiplied alpha

    // Set canvas size to match the high DPI glyph
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    // Clear with transparent black
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";

    // ctx.fillStyle = "blue";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up the font and text rendering with scaled size
    ctx.textRendering = "optimizeLegibility"; // Better than optimizeLegibility for high DPI
    const scaledFontSize = rasterConfig.fontSize * DPI_SCALE;
    ctx.font = `${scaledFontSize}px ${this.font.familyName}`;

    console.info("this.font.familyName", this.font.familyName);

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const baselineY = Math.ceil(boundingBox.maxY * scale * DPI_SCALE);
    ctx.fillText(rasterConfig.character, 0, baselineY);

    // Get the high DPI image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // let final_canvas_width = Math.ceil(metrics.width) + 1;
    // let final_canvas_height = Math.ceil(metrics.height) + 2;

    // if (final_canvas_width <= 0 || final_canvas_height <= 0) {
    //   final_canvas_width = 1;
    //   final_canvas_height = 1;
    // }

    // // Create a temporary downscaling canvas
    // const finalCanvas = new OffscreenCanvas(
    //   final_canvas_width,
    //   final_canvas_height
    // );
    // const finalCtx = finalCanvas.getContext("2d", {
    //   alpha: true,
    //   antialias: true,
    // });

    // if (!finalCtx) {
    //   throw new Error("Could not create final canvas context");
    // }

    // // Draw the high DPI canvas onto the final size canvas
    // finalCtx.drawImage(
    //   canvas,
    //   0,
    //   0,
    //   canvas.width,
    //   canvas.height,
    //   0,
    //   0,
    //   finalCanvas.width,
    //   finalCanvas.height
    // );

    // // Get the downscaled image data
    // const finalImageData = finalCtx.getImageData(
    //   0,
    //   0,
    //   finalCanvas.width,
    //   finalCanvas.height
    // );

    // // Convert the image data to RGBA format
    // const rgbaData = new Uint8Array(finalImageData.data.buffer);

    const rgbaData = new Uint8Array(imageData.data.buffer);

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
        bytesPerRow: canvas.width * 4,
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

    return {
      uv_rect,
      metrics,
    };
  }

  renderText(device: GPUDevice, queue: GPUQueue) {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const text = this.text;
    const maxLineWidth = this.dimensions[0]; // Define your maximum line width here

    // Use fontkit's layout function to get glyph positions and metrics
    const glyphRun = this.font.layout(text);

    const capHeight =
      ((this.font.capHeight + this.font.ascent + this.font.descent) /
        this.font.unitsPerEm) *
      this.fontSize;

    // Calculate the scale factor based on the font's unitsPerEm
    const scale = this.fontSize / this.font.unitsPerEm;

    // Track lines and their widths
    const lines: {
      glyphs: typeof glyphRun.glyphs;
      positions: typeof glyphRun.positions;
      width: number;
    }[] = [];
    let currentLine: {
      glyphs: typeof glyphRun.glyphs;
      positions: typeof glyphRun.positions;
      width: number;
    } = {
      glyphs: [],
      positions: [],
      width: 0,
    };

    // Split text into words and handle word-wrap
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordGlyphRun = this.font.layout(word);
      const wordWidth = wordGlyphRun.positions.reduce(
        (sum, pos) => sum + pos.xAdvance * scale,
        0
      );

      // If adding this word would exceed the max line width, start a new line
      if (
        currentLine.width + wordWidth > maxLineWidth &&
        currentLine.glyphs.length > 0
      ) {
        lines.push(currentLine);
        currentLine = { glyphs: [], positions: [], width: 0 };
      }

      // Add the word to the current line
      currentLine.glyphs.push(...wordGlyphRun.glyphs);
      currentLine.positions.push(...wordGlyphRun.positions);
      currentLine.width += wordWidth;

      // Add space width (if not the last word)
      if (i < words.length - 1) {
        const spaceGlyphRun = this.font.layout(" ");
        const spaceWidth = spaceGlyphRun.positions[0].xAdvance * scale;
        currentLine.glyphs.push(...spaceGlyphRun.glyphs);
        currentLine.positions.push(...spaceGlyphRun.positions);
        currentLine.width += spaceWidth;
      }
    }

    // Add the last line
    if (currentLine.glyphs.length > 0) {
      lines.push(currentLine);
    }

    // Calculate total width and height of the wrapped text
    const totalWidth = Math.max(...lines.map((line) => line.width));
    const totalHeight = lines.length * capHeight;

    // Calculate the starting x and y positions to center the text
    const startX = -totalWidth / 2.0;
    const startY = -totalHeight / 2.0;

    let currentY = startY;

    // Render each line
    for (const line of lines) {
      let currentX = startX;

      for (let i = 0; i < line.glyphs.length; i++) {
        const glyph = line.glyphs[i];
        const position = line.positions[i];

        // Create a unique key for the glyph (e.g., glyph ID + font size)
        const key = `${glyph.id}-${this.fontSize}`;

        // Ensure the glyph is in the atlas
        // Glyph cache is reset when new font family chosen
        if (!this.glyphCache.has(key)) {
          // console.info("dosen't have glyph", key);
          const atlasGlyph = this.addGlyphToAtlas(device, queue, {
            character: String.fromCodePoint(glyph.codePoints[0]), // Convert code point to character
            fontSize: this.fontSize,
          });
          this.glyphCache.set(key, atlasGlyph);
        }

        const atlasGlyph = this.glyphCache.get(key)!;

        // Calculate vertex positions using the scaled glyph's position and metrics
        const x0 = currentX;
        const x1 = x0 + atlasGlyph.metrics.width;
        currentX += position.xAdvance * scale; // Update for next character

        // const y0 = currentY - capHeight / 2;
        // const y1 = y0 + atlasGlyph.metrics.height;

        const baselineY =
          capHeight - atlasGlyph.metrics.height - atlasGlyph.metrics.ymin;

        let y0 = currentY - capHeight / 2 + baselineY;
        let y1 =
          currentY - capHeight / 2 + atlasGlyph.metrics.height + baselineY; // metrics[1] is already scaled in addGlyphToAtlas

        // UV coordinates from atlas
        const u0 = atlasGlyph.uv_rect[0];
        const u1 = u0 + atlasGlyph.uv_rect[2];
        const v0 = atlasGlyph.uv_rect[1];
        const v1 = v0 + atlasGlyph.uv_rect[3];

        // const z = getZLayer(1.0);

        const activeColor = rgbToWgpu(
          this.color[0],
          this.color[1],
          this.color[2],
          255.0
        );

        // Add vertices for the glyph quad
        const baseVertex = vertices.length;
        vertices.push(
          {
            position: [x0, y0, 0.0],
            tex_coords: [u0, v0],
            color: activeColor,
            gradient_coords: [x0 / this.dimensions[0], y0 / this.dimensions[1]],
            object_type: 1, // OBJECT_TYPE_TEXT
          },
          {
            position: [x1, y0, 0.0],
            tex_coords: [u1, v0],
            color: activeColor,
            gradient_coords: [x1 / this.dimensions[0], y0 / this.dimensions[1]],
            object_type: 1, // OBJECT_TYPE_TEXT
          },
          {
            position: [x1, y1, 0.0],
            tex_coords: [u1, v1],
            color: activeColor,
            gradient_coords: [x1 / this.dimensions[0], y1 / this.dimensions[1]],
            object_type: 1, // OBJECT_TYPE_TEXT
          },
          {
            position: [x0, y1, 0.0],
            tex_coords: [u0, v1],
            color: activeColor,
            gradient_coords: [x0 / this.dimensions[0], y1 / this.dimensions[1]],
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

      // Move to the next line
      currentY += capHeight;
    }

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
    // const adjustedLayerIndex = layerIndex - INTERNAL_LAYER_SPACE;
    let layer_index = -1.0 - getZLayer(layerIndex - INTERNAL_LAYER_SPACE);
    this.layer = layer_index;
    this.transform.layer = layer_index;
    this.backgroundPolygon.layer = layer_index - 0.5;
    this.backgroundPolygon.transform.layer = layer_index - 0.5;
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

    console.info(
      "update text dimensions",
      dimensions,
      this.backgroundPolygon.dimensions,
      this.backgroundPolygon.backgroundFill
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

  // textAreaCharContainsPoint(point: { x: number; y: number }) {
  //   const untranslated = {
  //     x: point.x - this.transform.position[0],
  //     y: point.y - this.transform.position[1],
  //   };

  //   this.vertices?.forEach((v) => {
  //     // if (untranslated.x > v.position[0] && untranslated.x < v.position[0] + v.) {

  //     // }
  //   })
  // }

  textAreaCharContainsPoint(point: Point): string | null | undefined {
    if (!this.vertices) {
      return null;
    }

    // Untranslate the point relative to the text area's position
    const untranslated = {
      x: point.x - this.transform.position[0],
      y: point.y - this.transform.position[1],
    };

    // Step through vertices 4 at a time for each character
    for (let i = 0; i < this.vertices.length; i += 4) {
      // Get the 4 vertices for the current character
      const topLeft = this.vertices[i].position; // [x0, y0, z]
      const topRight = this.vertices[i + 1].position; // [x1, y0, z]
      const bottomRight = this.vertices[i + 2].position; // [x1, y1, z]
      const bottomLeft = this.vertices[i + 3].position; // [x0, y1, z]

      // Find min/max bounds of the character
      // TODO: unneccesary calculation?
      const minX = Math.min(
        topLeft[0],
        topRight[0],
        bottomRight[0],
        bottomLeft[0]
      );
      const maxX = Math.max(
        topLeft[0],
        topRight[0],
        bottomRight[0],
        bottomLeft[0]
      );
      const minY = Math.min(
        topLeft[1],
        topRight[1],
        bottomRight[1],
        bottomLeft[1]
      );
      const maxY = Math.max(
        topLeft[1],
        topRight[1],
        bottomRight[1],
        bottomLeft[1]
      );

      // Check if point is within bounds
      if (
        untranslated.x >= minX &&
        untranslated.x <= maxX &&
        untranslated.y >= minY &&
        untranslated.y <= maxY
      ) {
        return this.vertices[i].id;
      }
    }

    return null;
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
      backgroundFill: this.backgroundPolygon.backgroundFill,
      isCircle: this.backgroundPolygon.isCircle,
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
    fontData: Buffer,
    isTextArea: boolean
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
      camera,
      isTextArea
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
