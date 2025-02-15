import { mat4, vec2 } from "gl-matrix";
import * as fontkit from "fontkit";
import { createEmptyGroupTransform, Transform } from "./transform";
import { Camera, WindowSize } from "./camera";
import { getZLayer, Vertex } from "./vertex";

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
  metrics: [number, number, number, number];
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
  glyphCache: Map<string, any>;
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

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    bindGroupLayout: GPUBindGroupLayout,
    groupBindGroupLayout: GPUBindGroupLayout,
    textConfig: TextRendererConfig,
    fontData: Buffer,
    window_size: WindowSize
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

    this.glyphCache = new Map();
    this.atlasSize = [4096, 4096];
    this.nextAtlasPosition = [0, 0];
    this.currentRowHeight = 0;

    this.hidden = false;

    this.font = fontkit.create(fontData) as fontkit.Font;

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

    const textureView = this.atlasTexture.createView();
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: textureView },
        { binding: 2, resource: this.sampler },
      ],
    });

    this.transform = new Transform(
      vec2.fromValues(textConfig.position.x, textConfig.position.y),
      0.0,
      vec2.fromValues(1.0, 1.0),
      this.uniformBuffer
    );

    this.backgroundPolygon = new Polygon(
      textConfig.dimensions,
      textConfig.position,
      textConfig.backgroundFill
    );

    this.backgroundPolygon.hidden = false;

    // -10.0 to provide 10 spots for internal items on top of objects
    this.transform.layer = textConfig.layer - INTERNAL_LAYER_SPACE;
    this.transform.updateUniformBuffer(queue, window_size);

    let [tmp_group_bind_group, tmp_group_transform] = createEmptyGroupTransform(
      device,
      groupBindGroupLayout,
      window_size
    );

    this.groupBindGroup = tmp_group_bind_group;
  }

  addGlyphToAtlas(
    device: GPUDevice,
    queue: GPUQueue,
    rasterConfig: GlyphRasterConfig
  ): AtlasGlyph {
    // Get the glyph layout for the given character
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
    // TODO: address this glaring performance concern of creating many canvases
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    // Set canvas size to match the glyph's bounding box
    canvas.width = Math.ceil(boundingBox.width * scale);
    canvas.height = Math.ceil((boundingBox.maxY - boundingBox.minY) * scale);

    // Render the glyph onto the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white"; // Use white for the glyph color
    ctx.translate(-boundingBox.minX * scale, -boundingBox.minY * scale);
    glyph.render(ctx, rasterConfig.fontSize);

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
      metrics: [metrics.width, metrics.height, metrics.xmin, metrics.ymin],
    };
  }

  renderText(device: GPUDevice, queue: GPUQueue) {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const text = this.text;

    // Use fontkit's layout function to get glyph positions and metrics
    const glyphRun = this.font.layout(
      text
      //     {
      //   features: [], // Optional: OpenType features
      //   script: "latn", // Script (e.g., Latin)
      //   direction: "ltr", // Direction (left-to-right)
      // }
    );

    // Calculate the total width and height of the text
    let totalWidth = 0;
    let totalHeight = 0;
    for (const position of glyphRun.positions) {
      totalWidth += position.xAdvance;
      totalHeight = Math.max(
        totalHeight,
        position.yOffset + glyphRun.bbox.maxY - glyphRun.bbox.minY
      );
    }

    // Calculate the starting x and y positions to center the text
    const startX = -totalWidth / 2.0;
    const startY = -totalHeight / 2.0;

    for (let i = 0; i < glyphRun.glyphs.length; i++) {
      const glyph = glyphRun.glyphs[i];
      const position = glyphRun.positions[i];

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

      const baseVertex = vertices.length;

      // Calculate vertex positions using the glyph's position and metrics
      const x0 = startX + position.xOffset;
      const x1 = x0 + atlasGlyph.metrics[0];
      const y0 = startY + position.yOffset;
      const y1 = y0 + atlasGlyph.metrics[1];

      // UV coordinates from atlas
      const u0 = atlasGlyph.uv_rect[0];
      const u1 = u0 + atlasGlyph.uv_rect[2];
      const v0 = atlasGlyph.uv_rect[1];
      const v1 = v0 + atlasGlyph.uv_rect[3];

      const z = getZLayer(1.0); // Assuming this method exists

      const activeColor = rgbToWgpu(
        this.color[0],
        this.color[1],
        this.color[2],
        255.0
      );

      // Add vertices for the glyph quad
      vertices.push(
        { position: [x0, y0, z], tex_coords: [u0, v0], color: activeColor },
        { position: [x1, y0, z], tex_coords: [u1, v0], color: activeColor },
        { position: [x1, y1, z], tex_coords: [u1, v1], color: activeColor },
        { position: [x0, y1, z], tex_coords: [u0, v1], color: activeColor }
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

    // Update buffers
    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        vertices.flatMap((v) => [...v.position, ...v.tex_coords, ...v.color])
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
    camera: Camera,
    selectedSequenceId: string,
    fontData: Buffer
  ): TextRenderer {
    return new TextRenderer(
      device,
      queue,
      modelBindGroupLayout,
      groupBindGroupLayout,
      config,
      fontData,
      windowSize
    );
  }
}
