import { mat4, vec3 } from "gl-matrix";
import { createVertexBufferLayout } from "./vertex";
import { Camera, CameraBinding } from "./camera";
import { ControlMode, Editor, WebGpuResources } from "./editor";

import FragShader from "./shaders/frag_primary.wgsl?raw";
import VertShader from "./shaders/vert_primary.wgsl?raw";
import { ObjectType } from "./animations";
import { TextRenderer } from "./text";
import { RepeatableObject } from "./repeater";

interface WindowSize {
  width: number;
  height: number;
}

interface WindowSizeShader {
  width: number;
  height: number;
}

export class CanvasPipeline {
  //   editor: Editor | null = null;
  //   renderPipeline: GPURenderPipeline | null = null;
  gpuResources: WebGpuResources | null = null;
  depthView: GPUTextureView | null = null;
  multisampledView: GPUTextureView | null = null;
  private animationFrameId: number | null = null;

  constructor() {}

  async new(editor: Editor, onScreenCanvas: boolean) {
    console.log("Initializing Canvas Renderer...");

    let canvas = null;
    if (onScreenCanvas) {
      canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;

      if (!canvas) throw new Error("Canvas not found");
    }

    // Set canvas dimensions
    const width = 900;
    const height = 550;

    console.info("Canvas dimensions", width, height);

    const windowSize: WindowSize = { width, height };

    // Initialize WebGPU
    const gpuResources = await WebGpuResources.request(canvas, windowSize);

    console.info("Initializing pipeline...");

    // Create camera and camera binding
    const camera = new Camera(windowSize);
    const cameraBinding = new CameraBinding(gpuResources.device);

    editor.camera = camera;
    editor.cameraBinding = cameraBinding;

    // Create depth stencil state
    const depthStencilState: GPUDepthStencilState = {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less",
    };

    // Create bind group layouts
    const modelBindGroupLayout = gpuResources.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "float",
            viewDimension: "2d",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {
            type: "filtering",
          },
        },
      ],
      label: "model_bind_group_layout",
    });

    const groupBindGroupLayout = gpuResources.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ],
      label: "group_bind_group_layout",
    });

    // Create window size buffer and bind group
    const windowSizeBuffer = gpuResources.device.createBuffer({
      label: "Window Size Buffer",
      size: 8, // 2 floats, 4 bytes each
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Update window size buffer
    const windowSizeData = new Float32Array([
      windowSize.width,
      windowSize.height,
    ]);
    gpuResources.queue.writeBuffer(windowSizeBuffer, 0, windowSizeData);

    const windowSizeBindGroupLayout = gpuResources.device.createBindGroupLayout(
      {
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: "uniform",
            },
          },
        ],
      }
    );

    const windowSizeBindGroup = gpuResources.device.createBindGroup({
      layout: windowSizeBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: windowSizeBuffer,
          },
        },
      ],
    });

    // Create pipeline layout
    const pipelineLayout = gpuResources.device.createPipelineLayout({
      label: "Pipeline Layout",
      bindGroupLayouts: [
        cameraBinding.bindGroupLayout,
        modelBindGroupLayout,
        windowSizeBindGroupLayout,
        groupBindGroupLayout,
      ],
    });

    // Load shaders
    const vertexShaderModule = gpuResources.device.createShaderModule({
      label: "Vertex Shader",
      code: VertShader,
    });

    const fragmentShaderModule = gpuResources.device.createShaderModule({
      label: "Fragment Shader",
      code: FragShader,
    });

    let format: GPUTextureFormat = "bgra8unorm";

    // Create render pipeline
    const renderPipeline = gpuResources.device.createRenderPipeline({
      label: "Common Vector Primary Render Pipeline",
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: "vs_main",
        buffers: [createVertexBufferLayout()],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        frontFace: "ccw",
        cullMode: undefined,
      },
      depthStencil: depthStencilState,
      multisample: {
        count: 4,
        mask: 0xffffffff,
        alphaToCoverageEnabled: false,
      },
    });

    console.info("Initialized...");

    // editor.cursorDot = cursorRingDot;
    editor.gpuResources = gpuResources;
    editor.modelBindGroupLayout = modelBindGroupLayout;
    editor.groupBindGroupLayout = groupBindGroupLayout;
    editor.windowSizeBindGroup = windowSizeBindGroup;
    editor.windowSizeBindGroupLayout = windowSizeBindGroupLayout;
    editor.windowSizeBuffer = windowSizeBuffer;
    editor.renderPipeline = renderPipeline;

    editor.updateCameraBinding();

    this.gpuResources = gpuResources;

    return this;
  }

  beginRendering(editor: Editor): void {
    // Make sure we clean up any existing animation loop
    //  this.stopRendering();

    // Create or update depth texture and multisampled texture if needed
    //  this.updateRenderTargets();

    if (!this.depthView || !this.multisampledView) {
      console.error("Cannot begin rendering: render targets not initialized");
      return;
    }

    // Start the animation loop
    const renderLoop = async () => {
      await this.renderFrame(editor);

      // Schedule the next frame
      this.animationFrameId = window.requestAnimationFrame(renderLoop);
    };

    // Start the first frame
    this.animationFrameId = window.requestAnimationFrame(renderLoop);
  }

  recreateDepthView(window_width: number, window_height: number) {
    const textureFormat: GPUTextureFormat = "bgra8unorm";

    if (!this.gpuResources || !this.gpuResources.surface) {
      throw new Error("Surface not initialized");
    }

    const context = this.gpuResources.surface;

    const config: GPUCanvasConfiguration = {
      device: this.gpuResources.device,
      format: textureFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      //   size: {
      //     width: window_width,
      //     height: window_height,
      //   },
    };

    context.configure(config);

    const multisampledTexture = this.gpuResources.device.createTexture({
      size: {
        width: window_width,
        height: window_height,
        depthOrArrayLayers: 1,
      },
      mipLevelCount: 1,
      sampleCount: 4,
      dimension: "2d",
      format: textureFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      label: "Multisampled render texture",
    });

    const multisampledView = multisampledTexture.createView();

    const depthTexture = this.gpuResources.device.createTexture({
      size: {
        width: window_width,
        height: window_height,
        depthOrArrayLayers: 1,
      },
      mipLevelCount: 1,
      sampleCount: 4,
      dimension: "2d",
      format: "depth24plus-stencil8", // Use depth24plus-stencil8 for depth and stencil
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      label: "Depth Texture",
    });

    const depthView = depthTexture.createView();

    this.depthView = depthView;
    this.multisampledView = multisampledView;
  }

  async renderFrame(
    editor: Editor,
    frameEncoder?: (
      // commandEncoder: GPUCommandEncoder,
      renderTexture: GPUTexture
    ) => void,
    currentTimeS?: number
  ): Promise<void> {
    if (!editor.camera || !editor.gpuResources) {
      return;
    }

    const device = editor.gpuResources.device;
    const surface = editor.gpuResources.surface;
    const queue = editor.gpuResources.queue;
    const renderPipeline = editor.renderPipeline;

    if (!surface || !renderPipeline) {
      return;
    }

    // Get the current texture and create a view
    const currentTexture = surface.getCurrentTexture();
    const view = currentTexture.createView();

    // Create command encoder
    const encoder = device.createCommandEncoder({
      label: "Render Encoder",
    });

    if (!this.depthView || !this.multisampledView) {
      console.error("Missing depth or multisampled view");
      return;
    }

    // Begin render pass
    const renderPass = encoder.beginRenderPass({
      label: "Main Render Pass",
      colorAttachments: [
        {
          view: this.multisampledView,
          resolveTarget: view,
          clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, // WHITE
          loadOp: "clear",
          storeOp: "discard",
        },
      ],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        stencilLoadOp: "clear", // Clear the stencil buffer at the start of the render pass
        stencilStoreOp: "store", // Store the stencil buffer after the render pass
        stencilClearValue: 0, // Clear value for stencil (typically 0)
      },
    });

    // Set pipeline
    renderPass.setPipeline(renderPipeline);

    // Animation steps
    editor.stepVideoAnimations(editor.camera, currentTimeS);
    editor.stepMotionPathAnimations(editor.camera, currentTimeS);

    // Set camera bind group
    if (!editor.cameraBinding) {
      console.error("Couldn't get camera binding");
      return;
    }
    renderPass.setBindGroup(0, editor.cameraBinding.bindGroup);

    // Set window size bind group
    if (!editor.windowSizeBindGroup) {
      console.error("Couldn't get window size group");
      return;
    }
    renderPass.setBindGroup(2, editor.windowSizeBindGroup);

    // Draw static polygons
    for (const polygon of editor.staticPolygons || []) {
      // Update uniform buffer if this polygon is being dragged
      if (editor.draggingPathHandle === polygon.id) {
        polygon.transform.updateUniformBuffer(queue, editor.camera.windowSize);
      }

      renderPass.setBindGroup(1, polygon.bindGroup);
      renderPass.setBindGroup(3, polygon.groupBindGroup);
      renderPass.setVertexBuffer(0, polygon.vertexBuffer);
      renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
      renderPass.drawIndexed(polygon.indices.length);
    }

    // Draw motion paths
    for (const path of editor.motionPaths || []) {
      // Update path transform if being dragged
      if (editor.draggingPath === path.id) {
        path.transform.updateUniformBuffer(queue, editor.camera.windowSize);
      }

      renderPass.setBindGroup(3, path.bindGroup);

      // Draw static polygons in this path
      for (const polygon of path.staticPolygons || []) {
        if (editor.draggingPathHandle === polygon.id) {
          polygon.transform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        renderPass.setBindGroup(1, polygon.bindGroup);
        renderPass.setVertexBuffer(0, polygon.vertexBuffer);
        renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
        renderPass.drawIndexed(polygon.indices.length);
      }
    }

    // Draw regular polygons
    for (const polygon of editor.polygons || []) {
      if (!polygon.hidden) {
        // Update if dragging or during playback
        if (editor.draggingPolygon === polygon.id || editor.isPlaying) {
          polygon.transform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        renderPass.setBindGroup(1, polygon.bindGroup);
        renderPass.setBindGroup(3, polygon.groupBindGroup);
        renderPass.setVertexBuffer(0, polygon.vertexBuffer);
        renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
        renderPass.drawIndexed(polygon.indices.length);
      }
    }

    // Draw text items
    for (const textItem of editor.textItems || []) {
      if (!textItem.hidden && textItem.indices) {
        // Draw background polygon if not hidden
        if (!textItem.backgroundPolygon.hidden) {
          if (
            editor.draggingText === textItem.backgroundPolygon.id ||
            editor.isPlaying
          ) {
            textItem.backgroundPolygon.transform.updateUniformBuffer(
              queue,
              editor.camera.windowSize
            );
          }

          renderPass.setBindGroup(1, textItem.backgroundPolygon.bindGroup);
          renderPass.setBindGroup(3, textItem.backgroundPolygon.groupBindGroup);
          renderPass.setVertexBuffer(
            0,
            textItem.backgroundPolygon.vertexBuffer
          );
          renderPass.setIndexBuffer(
            textItem.backgroundPolygon.indexBuffer,
            "uint32"
          );
          renderPass.drawIndexed(textItem.backgroundPolygon.indices.length);
        }

        // Draw the text itself
        if (editor.draggingText === textItem.id || editor.isPlaying) {
          // console.info(
          //   "text log",
          //   textItem.vertices ? textItem.vertices[0] : null
          // );
          textItem.transform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        renderPass.setBindGroup(1, textItem.bindGroup);
        renderPass.setBindGroup(3, textItem.groupBindGroup);
        renderPass.setVertexBuffer(0, textItem.vertexBuffer);
        renderPass.setIndexBuffer(textItem.indexBuffer, "uint32");
        renderPass.drawIndexed(textItem.indices.length);
      }
    }

    // Draw image items
    for (const image of editor.imageItems || []) {
      if (!image.hidden) {
        if (editor.draggingImage === image.id || editor.isPlaying) {
          image.transform.updateUniformBuffer(queue, editor.camera.windowSize);
        }

        renderPass.setBindGroup(1, image.bindGroup);
        renderPass.setBindGroup(3, image.groupBindGroup);
        renderPass.setVertexBuffer(0, image.vertexBuffer);
        renderPass.setIndexBuffer(image.indexBuffer, "uint32");
        renderPass.drawIndexed(image.indices.length);
      }
    }

    // Draw video items
    for (const video of editor.videoItems || []) {
      if (!video.hidden) {
        renderPass.setBindGroup(3, video.groupBindGroup);

        if (video.mousePath) {
          // Update path transform if being dragged
          if (editor.draggingPath === video.mousePath.id) {
            video.mousePath.transform.updateUniformBuffer(
              queue,
              editor.camera.windowSize
            );
          }

          // Draw static polygons in this path
          for (const polygon of video.mousePath.staticPolygons || []) {
            if (editor.draggingPathHandle === polygon.id) {
              polygon.transform.updateUniformBuffer(
                queue,
                editor.camera.windowSize
              );
            }

            renderPass.setBindGroup(1, polygon.bindGroup);
            renderPass.setVertexBuffer(0, polygon.vertexBuffer);
            renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
            renderPass.drawIndexed(polygon.indices.length);
          }
        }

        if (editor.draggingVideo === video.id || editor.isPlaying) {
          // console.info("temp log", video.vertices[0]);
          // video.transform.updateUniformBuffer(queue, editor.camera.windowSize);
          video.groupTransform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        renderPass.setBindGroup(1, video.bindGroup);
        renderPass.setVertexBuffer(0, video.vertexBuffer);
        renderPass.setIndexBuffer(video.indexBuffer, "uint32");
        renderPass.drawIndexed(video.indices.length);
      }
    }

    let repeatObjects = editor.repeatManager.getAllRepeatObjects();
    if (repeatObjects.length > 0) {
      // Draw repeat objects
      for (const repeatObject of repeatObjects || []) {
        if (
          !repeatObject.hidden &&
          repeatObject.indices &&
          repeatObject.indexBuffer
        ) {
          let sourceObject = repeatObject.sourceObject;
          let instances = repeatObject.instances;

          for (let instance of instances) {
            if (isTextRenderer(sourceObject)) {
              if (
                sourceObject.objectType === ObjectType.TextItem &&
                sourceObject?.backgroundPolygon // TODO: backgroundPolygon is not available on other object types, getting type error
              ) {
                // Draw background polygon if not hidden
                if (
                  sourceObject?.backgroundPolygon &&
                  !sourceObject.backgroundPolygon.hidden
                ) {
                  if (
                    // editor.draggingText === sourceObject.backgroundPolygon.id ||
                    editor.isPlaying
                  ) {
                    sourceObject.backgroundPolygon.transform.updateUniformBuffer(
                      queue,
                      editor.camera.windowSize
                    );
                  }

                  renderPass.setBindGroup(
                    1,
                    sourceObject.backgroundPolygon.bindGroup
                  );
                  renderPass.setBindGroup(
                    3,
                    sourceObject.backgroundPolygon.groupBindGroup
                  );
                  renderPass.setVertexBuffer(
                    0,
                    sourceObject.backgroundPolygon.vertexBuffer
                  );
                  renderPass.setIndexBuffer(
                    sourceObject.backgroundPolygon.indexBuffer,
                    "uint32"
                  );
                  renderPass.drawIndexed(
                    sourceObject.backgroundPolygon.indices.length
                  );
                }
              }
            }

            // Allow for animations
            if (instance.transform && editor.isPlaying) {
              instance.transform.updateUniformBuffer(
                queue,
                editor.camera.windowSize
              );
            }

            renderPass.setBindGroup(1, instance.bindGroup);
            renderPass.setBindGroup(3, sourceObject.groupBindGroup);
            renderPass.setVertexBuffer(0, repeatObject.vertexBuffer);
            renderPass.setIndexBuffer(repeatObject.indexBuffer, "uint32");
            renderPass.drawIndexed(repeatObject.indices.length);
          }
        }
      }
    }

    // Update camera binding if panning
    if (editor.controlMode === ControlMode.Pan && editor.isPanning) {
      editor.updateCameraBinding();
    }

    // End the render pass
    renderPass.end();

    // Submit command buffer and present
    queue.submit([encoder.finish()]);

    if (frameEncoder) {
      await frameEncoder(currentTexture);
    }
  }
}

function isTextRenderer(obj: RepeatableObject): obj is TextRenderer {
  return (obj as TextRenderer).backgroundPolygon !== undefined;
}
