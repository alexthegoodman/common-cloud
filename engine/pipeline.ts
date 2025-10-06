import { mat4, vec3 } from "gl-matrix";
import { createVertexBufferLayout } from "./vertex";
import { Camera, CameraBinding } from "./camera";
import { ControlMode, Editor } from "./editor";

// import FragShader from "./shaders/frag_primary.wgsl?raw";
// import VertShader from "./shaders/vert_primary.wgsl?raw";
import FragShader from "./shaders/frag_webgl.glsl?raw";
import VertShader from "./shaders/vert_webgl.glsl?raw";
import { ObjectType } from "./animations";
import { TextRenderer } from "./text";
import { RepeatableObject } from "./repeater";

import { makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";
import { SaveTarget } from "./editor_state";
import { Camera3D } from "./3dcamera";
import {
  GPUPolyfill,
  PolyfillBindGroup,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
  PolyfillTexture,
  WebGpuResources,
} from "./polyfill";

interface WindowSize {
  width: number;
  height: number;
}

interface WindowSizeShader {
  width: number;
  height: number;
}

export class CanvasPipeline {
  // gpuResources: WebGpuResources | null = null;
  gpuResources: GPUPolyfill | null = null;
  depthView: GPUTextureView | null = null;
  multisampledView: GPUTextureView | null = null;
  private animationFrameId: number | null = null;
  public stepFrames: boolean = true;
  public canvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  constructor() {}

  async new(
    editor: Editor,
    onScreenCanvas: boolean,
    canvasId: string,
    windowSize: WindowSize,
    stepFrames: boolean
  ) {
    this.stepFrames = stepFrames;
    console.log("Initializing Canvas Renderer...");

    this.canvas = null;
    if (onScreenCanvas) {
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

      if (!this.canvas) throw new Error("Canvas not found");
    } else {
      // let render_canvas: HTMLCanvasElement | OffscreenCanvas | null = canvas;
      // if (!render_canvas) {
      this.canvas = new OffscreenCanvas(windowSize.width, windowSize.height);
      // }
    }

    // Set canvas dimensions
    // const width = 900;
    // const height = 550;

    console.info("Canvas dimensions", windowSize);

    // const windowSize: WindowSize = { width, height };

    // Initialize WebGPU
    // const gpuResources = await WebGpuResources.request(this.canvas, windowSize);

    // Intiialize Polyfill
    const gpuResources = new GPUPolyfill("webgl", this.canvas, windowSize);
    await gpuResources.initializeResources();

    console.info("Initializing pipeline...");

    // Create camera and camera binding
    // const camera = new Camera(windowSize);
    const camera = new Camera3D(windowSize);

    // Make it look at the origin
    // camera.lookAt(vec3.fromValues(0, 0, 0)); // lets set the default right in the camera

    const cameraBinding = new CameraBinding(
      gpuResources.device!,
      gpuResources.queue!,
      camera
    );

    editor.camera = camera;
    editor.cameraBinding = cameraBinding;

    // Create depth stencil state
    const depthStencilState: GPUDepthStencilState = {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less",
    };

    // Create bind group layouts
    const modelBindGroupLayout = gpuResources.device!.createBindGroupLayout({
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
            // viewDimension: "2d",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {
            type: "filtering",
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
      ],
      // label: "model_bind_group_layout",
    });

    // const gradientBindGroupLayout = gpuResources.device.createBindGroupLayout({
    //   entries: [
    //     {
    //       binding: 0,
    //       visibility: GPUShaderStage.FRAGMENT,
    //       buffer: {
    //         type: "uniform",
    //       },
    //     },
    //   ],
    //   label: "gradient_bind_group_layout",
    // });

    const groupBindGroupLayout = gpuResources.device!.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ],
      // label: "group_bind_group_layout",
    });

    // Create window size buffer and bind group
    const windowSizeBuffer = gpuResources.device!.createBuffer(
      {
        label: "Window Size Buffer",
        size: 8, // 2 floats, 4 bytes each
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      "uniform2f"
    );

    windowSizeBuffer.unmap(); // Unmap after creation

    // Update window size buffer
    const windowSizeData = new Float32Array([
      windowSize.width,
      windowSize.height,
    ]);
    gpuResources.queue!.writeBuffer(windowSizeBuffer, 0, windowSizeData);

    const windowSizeBindGroupLayout =
      gpuResources.device!.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: "uniform",
            },
          },
        ],
      });

    const windowSizeBindGroup = gpuResources.device!.createBindGroup({
      layout: windowSizeBindGroupLayout,
      entries: [
        {
          binding: 1,
          groupIndex: 0,
          resource: {
            pbuffer: windowSizeBuffer,
          },
        },
      ],
    });

    // gpuResources.queue!.writeBuffer(windowSizeBuffer, 0, windowSizeData);

    // Create pipeline layout
    const pipelineLayout = gpuResources.device!.createPipelineLayout({
      label: "Pipeline Layout",
      bindGroupLayouts: [
        // cameraBinding.bindGroupLayout,
        modelBindGroupLayout,
        windowSizeBindGroupLayout,
        groupBindGroupLayout,
        // gradientBindGroupLayout,
      ],
    });

    // Load shaders
    const vertexShaderModule = gpuResources.device!.createShaderModule({
      label: "Vertex Shader",
      code: VertShader,
    });

    const fragmentShaderModule = gpuResources.device!.createShaderModule({
      label: "Fragment Shader",
      code: FragShader,
    });

    let format: GPUTextureFormat = "rgba8unorm";

    // Create render pipeline
    const renderPipeline = gpuResources.device!.createRenderPipeline({
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

    // necessary for webgl
    // renderPipeline.use();

    console.info("Initialized...");

    // editor.cursorDot = cursorRingDot;
    editor.gpuResources = gpuResources;
    editor.modelBindGroupLayout = modelBindGroupLayout;
    editor.groupBindGroupLayout = groupBindGroupLayout;
    // editor.gradientBindGroupLayout = gradientBindGroupLayout;
    editor.windowSizeBindGroup = windowSizeBindGroup;
    editor.windowSizeBindGroupLayout = windowSizeBindGroupLayout;
    editor.windowSizeBuffer = windowSizeBuffer;
    editor.renderPipeline = renderPipeline;

    editor.updateCameraBinding();

    this.gpuResources = gpuResources;

    return this;
  }

  async beginRendering(editor: Editor): Promise<void> {
    // Make sure we clean up any existing animation loop
    //  this.stopRendering();

    // Create or update depth texture and multisampled texture if needed
    //  this.updateRenderTargets();

    // if (!this.depthView || !this.multisampledView) {
    //   console.error("Cannot begin rendering: render targets not initialized");
    //   return;
    // }

    if (this.stepFrames) {
      // Start the animation loop
      const renderLoop = async () => {
        // editor.renderPipeline!.use();

        await this.renderWebglFrame(editor);

        // Schedule the next frame
        this.animationFrameId = window.requestAnimationFrame(renderLoop);
      };

      // editor.renderPipeline!.use();
      // Start the first frame
      this.animationFrameId = window.requestAnimationFrame(renderLoop);
    } else {
      // editor.renderPipeline!.use();
      await this.renderWebglFrame(editor);
    }
  }

  recreateDepthView(window_width: number, window_height: number) {
    // const textureFormat: GPUTextureFormat = "rgba8unorm";
    // if (!this.gpuResources || !this.gpuResources.surface) {
    //   throw new Error("Surface not initialized");
    // }
    // const context = this.gpuResources.surface;
    // const config: GPUCanvasConfiguration = {
    //   device: this.gpuResources.device,
    //   format: textureFormat,
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    //   //   size: {
    //   //     width: window_width,
    //   //     height: window_height,
    //   //   },
    // };
    // context.configure(config);
    // const multisampledTexture = this.gpuResources.device.createTexture({
    //   size: {
    //     width: window_width,
    //     height: window_height,
    //     depthOrArrayLayers: 1,
    //   },
    //   mipLevelCount: 1,
    //   sampleCount: 4,
    //   dimension: "2d",
    //   format: textureFormat,
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT,
    //   label: "Multisampled render texture",
    // });
    // const multisampledView = multisampledTexture.createView();
    // const depthTexture = this.gpuResources.device.createTexture({
    //   size: {
    //     width: window_width,
    //     height: window_height,
    //     depthOrArrayLayers: 1,
    //   },
    //   mipLevelCount: 1,
    //   sampleCount: 4,
    //   dimension: "2d",
    //   format: "depth24plus-stencil8", // Use depth24plus-stencil8 for depth and stencil
    //   usage:
    //     GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    //   label: "Depth Texture",
    // });
    // const depthView = depthTexture.createView();
    // this.depthView = depthView;
    // this.multisampledView = multisampledView;
  }

  // async renderWgpuFrame(
  //   editor: Editor,
  //   frameEncoder?: (
  //     // commandEncoder: GPUCommandEncoder,
  //     renderTexture: GPUTexture
  //   ) => void,
  //   currentTimeS?: number
  // ): Promise<void> {
  //   if (!editor.camera || !editor.gpuResources) {
  //     console.error("Editor or camera not initialized");
  //     return;
  //   }

  //   const device = editor.gpuResources.webgpuResources!.device;
  //   const surface = editor.gpuResources.webgpuResources!.surface;
  //   const queue = editor.gpuResources.webgpuResources!.queue;
  //   const renderPipeline = editor.renderPipeline;

  //   if (!surface || !renderPipeline) {
  //     console.error("Surface or render pipeline not initialized");
  //     return;
  //   }

  //   // if (frameEncoder) {
  //   //   console.info("Rendering frame with custom encoder...");
  //   // }

  //   // Animation steps
  //   editor.stepVideoAnimations(editor.camera, currentTimeS);
  //   await editor.stepMotionPathAnimations(editor.camera, currentTimeS);

  //   // if (frameEncoder) {
  //   //   console.info("Rendering frame 2...");
  //   // }

  //   // Get the current texture and create a view
  //   const currentTexture = surface.getCurrentTexture();
  //   const view = currentTexture.createView();

  //   // Create command encoder
  //   const encoder = device.createCommandEncoder({
  //     label: "Render Encoder",
  //   });

  //   if (!this.depthView || !this.multisampledView) {
  //     console.error("Missing depth or multisampled view");
  //     return;
  //   }

  //   // Begin render pass
  //   const renderPass = encoder.beginRenderPass({
  //     label: "Main Render Pass",
  //     colorAttachments: [
  //       {
  //         view: this.multisampledView,
  //         resolveTarget: view,
  //         clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, // WHITE
  //         loadOp: "clear",
  //         storeOp: "discard",
  //       },
  //     ],
  //     depthStencilAttachment: {
  //       view: this.depthView,
  //       depthClearValue: 1.0,
  //       depthLoadOp: "clear",
  //       depthStoreOp: "store",
  //       stencilLoadOp: "clear", // Clear the stencil buffer at the start of the render pass
  //       stencilStoreOp: "store", // Store the stencil buffer after the render pass
  //       stencilClearValue: 0, // Clear value for stencil (typically 0)
  //     },
  //   });

  //   // Set pipeline
  //   renderPass.setPipeline(renderPipeline);

  //   // Set camera bind group
  //   if (!editor.cameraBinding) {
  //     console.error("Couldn't get camera binding");
  //     return;
  //   }
  //   renderPass.setBindGroup(0, editor.cameraBinding.bindGroup);

  //   // Set window size bind group
  //   if (!editor.windowSizeBindGroup) {
  //     console.error("Couldn't get window size group");
  //     return;
  //   }
  //   renderPass.setBindGroup(2, editor.windowSizeBindGroup);

  //   // if (frameEncoder) {
  //   //   console.info("Rendering frame 3...");
  //   // }

  //   // Draw static polygons
  //   for (const polygon of editor.staticPolygons || []) {
  //     // Update uniform buffer if this polygon is being dragged
  //     if (editor.draggingPathHandle === polygon.id) {
  //       polygon.transform.updateUniformBuffer(queue, editor.camera.windowSize);
  //     }

  //     if (
  //       polygon.name === "canvas_background" &&
  //       editor.target === SaveTarget.Videos &&
  //       editor.isPlaying
  //     ) {
  //       polygon.updateGradientAnimation(device, 0.001);
  //     }

  //     renderPass.setBindGroup(1, polygon.bindGroup);
  //     renderPass.setBindGroup(3, polygon.groupBindGroup);
  //     renderPass.setVertexBuffer(0, polygon.vertexBuffer);
  //     renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
  //     renderPass.drawIndexed(polygon.indices.length);
  //   }

  //   // Draw motion paths
  //   for (const path of editor.motionPaths || []) {
  //     // Update path transform if being dragged
  //     if (editor.draggingPath === path.id) {
  //       path.transform.updateUniformBuffer(queue, editor.camera.windowSize);
  //     }

  //     renderPass.setBindGroup(3, path.bindGroup);

  //     // Draw static polygons in this path
  //     for (const polygon of path.staticPolygons || []) {
  //       if (editor.draggingPathHandle === polygon.id) {
  //         polygon.transform.updateUniformBuffer(
  //           queue,
  //           editor.camera.windowSize
  //         );
  //       }

  //       renderPass.setBindGroup(1, polygon.bindGroup);
  //       renderPass.setVertexBuffer(0, polygon.vertexBuffer);
  //       renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
  //       renderPass.drawIndexed(polygon.indices.length);
  //     }
  //   }

  //   // Draw regular polygons
  //   for (const polygon of editor.polygons || []) {
  //     if (!polygon.hidden) {
  //       // Update if dragging or during playback
  //       if (editor.draggingPolygon === polygon.id || editor.isPlaying) {
  //         polygon.transform.updateUniformBuffer(
  //           queue,
  //           editor.camera.windowSize
  //         );
  //       }

  //       renderPass.setBindGroup(1, polygon.bindGroup);
  //       renderPass.setBindGroup(3, polygon.groupBindGroup);
  //       renderPass.setVertexBuffer(0, polygon.vertexBuffer);
  //       renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
  //       renderPass.drawIndexed(polygon.indices.length);
  //     }
  //   }

  //   // Draw text items
  //   for (const textItem of editor.textItems || []) {
  //     if (!textItem.hidden && textItem.indices) {
  //       // Draw background polygon if not hidden
  //       if (!textItem.backgroundPolygon.hidden) {
  //         if (
  //           editor.draggingText === textItem.backgroundPolygon.id ||
  //           editor.isPlaying
  //         ) {
  //           textItem.backgroundPolygon.transform.updateUniformBuffer(
  //             queue,
  //             editor.camera.windowSize
  //           );
  //         }

  //         renderPass.setBindGroup(1, textItem.backgroundPolygon.bindGroup);
  //         renderPass.setBindGroup(3, textItem.backgroundPolygon.groupBindGroup);
  //         renderPass.setVertexBuffer(
  //           0,
  //           textItem.backgroundPolygon.vertexBuffer
  //         );
  //         renderPass.setIndexBuffer(
  //           textItem.backgroundPolygon.indexBuffer,
  //           "uint32"
  //         );
  //         renderPass.drawIndexed(textItem.backgroundPolygon.indices.length);
  //       }

  //       // Draw the text itself
  //       if (editor.draggingText === textItem.id || editor.isPlaying) {
  //         // console.info(
  //         //   "text log",
  //         //   textItem.vertices ? textItem.vertices[0] : null
  //         // );
  //         textItem.transform.updateUniformBuffer(
  //           queue,
  //           editor.camera.windowSize
  //         );
  //       }

  //       renderPass.setBindGroup(1, textItem.bindGroup);
  //       renderPass.setBindGroup(3, textItem.groupBindGroup);
  //       renderPass.setVertexBuffer(0, textItem.vertexBuffer);
  //       renderPass.setIndexBuffer(textItem.indexBuffer, "uint32");
  //       renderPass.drawIndexed(textItem.indices.length);
  //     }
  //   }

  //   // Draw image items
  //   for (const image of editor.imageItems || []) {
  //     if (!image.hidden) {
  //       if (editor.draggingImage === image.id || editor.isPlaying) {
  //         image.transform.updateUniformBuffer(queue, editor.camera.windowSize);
  //       }

  //       renderPass.setBindGroup(1, image.bindGroup);
  //       renderPass.setBindGroup(3, image.groupBindGroup);
  //       renderPass.setVertexBuffer(0, image.vertexBuffer);
  //       renderPass.setIndexBuffer(image.indexBuffer, "uint32");
  //       renderPass.drawIndexed(image.indices.length);
  //     }
  //   }

  //   // Draw video items
  //   for (const video of editor.videoItems || []) {
  //     if (!video.hidden) {
  //       renderPass.setBindGroup(3, video.groupBindGroup);

  //       if (video.mousePath) {
  //         // Update path transform if being dragged
  //         if (editor.draggingPath === video.mousePath.id) {
  //           video.mousePath.transform.updateUniformBuffer(
  //             queue,
  //             editor.camera.windowSize
  //           );
  //         }

  //         // Draw static polygons in this path
  //         for (const polygon of video.mousePath.staticPolygons || []) {
  //           if (editor.draggingPathHandle === polygon.id) {
  //             polygon.transform.updateUniformBuffer(
  //               queue,
  //               editor.camera.windowSize
  //             );
  //           }

  //           renderPass.setBindGroup(1, polygon.bindGroup);
  //           renderPass.setVertexBuffer(0, polygon.vertexBuffer);
  //           renderPass.setIndexBuffer(polygon.indexBuffer, "uint32");
  //           renderPass.drawIndexed(polygon.indices.length);
  //         }
  //       }

  //       if (editor.draggingVideo === video.id || editor.isPlaying) {
  //         // console.info("temp log", video.vertices[0]);
  //         // video.transform.updateUniformBuffer(queue, editor.camera.windowSize);
  //         video.groupTransform.updateUniformBuffer(
  //           queue,
  //           editor.camera.windowSize
  //         );
  //       }

  //       renderPass.setBindGroup(1, video.bindGroup);
  //       renderPass.setVertexBuffer(0, video.vertexBuffer);
  //       renderPass.setIndexBuffer(video.indexBuffer, "uint32");
  //       renderPass.drawIndexed(video.indices.length);
  //     }
  //   }

  //   let repeatObjects = editor.repeatManager.getAllRepeatObjects();
  //   if (repeatObjects.length > 0) {
  //     // Draw repeat objects
  //     for (const repeatObject of repeatObjects || []) {
  //       if (
  //         !repeatObject.hidden &&
  //         repeatObject.indices &&
  //         repeatObject.indexBuffer
  //       ) {
  //         let sourceObject = repeatObject.sourceObject;
  //         let instances = repeatObject.instances;

  //         for (let instance of instances) {
  //           if (isTextRenderer(sourceObject)) {
  //             if (
  //               sourceObject.objectType === ObjectType.TextItem &&
  //               sourceObject?.backgroundPolygon // TODO: backgroundPolygon is not available on other object types, getting type error
  //             ) {
  //               // Draw background polygon if not hidden
  //               if (
  //                 sourceObject?.backgroundPolygon &&
  //                 !sourceObject.backgroundPolygon.hidden
  //               ) {
  //                 if (
  //                   // editor.draggingText === sourceObject.backgroundPolygon.id ||
  //                   editor.isPlaying
  //                 ) {
  //                   sourceObject.backgroundPolygon.transform.updateUniformBuffer(
  //                     queue,
  //                     editor.camera.windowSize
  //                   );
  //                 }

  //                 renderPass.setBindGroup(
  //                   1,
  //                   sourceObject.backgroundPolygon.bindGroup
  //                 );
  //                 renderPass.setBindGroup(
  //                   3,
  //                   sourceObject.backgroundPolygon.groupBindGroup
  //                 );
  //                 renderPass.setVertexBuffer(
  //                   0,
  //                   sourceObject.backgroundPolygon.vertexBuffer
  //                 );
  //                 renderPass.setIndexBuffer(
  //                   sourceObject.backgroundPolygon.indexBuffer,
  //                   "uint32"
  //                 );
  //                 renderPass.drawIndexed(
  //                   sourceObject.backgroundPolygon.indices.length
  //                 );
  //               }
  //             }
  //           }

  //           // Allow for animations
  //           if (instance.transform && editor.isPlaying) {
  //             instance.transform.updateUniformBuffer(
  //               queue,
  //               editor.camera.windowSize
  //             );
  //           }

  //           renderPass.setBindGroup(1, instance.bindGroup);
  //           renderPass.setBindGroup(3, sourceObject.groupBindGroup);
  //           renderPass.setVertexBuffer(0, repeatObject.vertexBuffer);
  //           renderPass.setIndexBuffer(repeatObject.indexBuffer, "uint32");
  //           renderPass.drawIndexed(repeatObject.indices.length);
  //         }
  //       }
  //     }
  //   }

  //   // Draw text areas
  //   // for (const image of editor.textArea || []) {
  //   if (editor.textArea) {
  //     if (!editor.textArea.hidden && editor.textArea.indices) {
  //       // if (editor.draggingImage === image.id || editor.isPlaying) {
  //       //   image.transform.updateUniformBuffer(queue, editor.camera.windowSize);
  //       // }

  //       renderPass.setBindGroup(1, editor.textArea.bindGroup);
  //       renderPass.setBindGroup(3, editor.textArea.groupBindGroup);
  //       renderPass.setVertexBuffer(0, editor.textArea.vertexBuffer);
  //       renderPass.setIndexBuffer(editor.textArea.indexBuffer, "uint32");
  //       renderPass.drawIndexed(editor.textArea.indices.length);
  //     }
  //   }
  //   // }

  //   // console.info("Drawing objects...");

  //   // Update camera binding if panning
  //   if (editor.controlMode === ControlMode.Pan && editor.isPanning) {
  //     editor.updateCameraBinding();
  //   }

  //   // End the render pass
  //   renderPass.end();

  //   // Submit command buffer and present
  //   queue.submit([encoder.finish()]);

  //   if (frameEncoder) {
  //     // console.info("Running frame encoder...");
  //     await frameEncoder(currentTexture);
  //   }
  // }

  async renderWebglFrame(
    editor: Editor,
    frameEncoder?: (renderTexture: PolyfillTexture) => Promise<void>,
    currentTimeS?: number
  ): Promise<void> {
    if (!editor.camera || !editor.gpuResources) {
      console.error("Editor or camera not initialized");
      return;
    }

    // Get WebGL resources through polyfill
    const device = editor.gpuResources.getDevice() as PolyfillDevice;
    const queue = editor.gpuResources.getQueue() as PolyfillQueue;
    const gl = editor.gpuResources.getContext() as WebGL2RenderingContext;
    const renderPipeline = editor.renderPipeline;

    if (!gl || !renderPipeline) {
      console.error("WebGL context or render pipeline not initialized");
      return;
    }

    // Animation steps (same as WebGPU)
    editor.stepVideoAnimations(editor.camera, currentTimeS);
    await editor.stepMotionPathAnimations(editor.camera, currentTimeS);

    // Bind render pipeline (in WebGL this means using the shader program)
    if (renderPipeline.program) {
      gl.useProgram(renderPipeline.program);
    }

    // Set up WebGL render state
    gl.viewport(
      0,
      0,
      editor.camera.windowSize.width,
      editor.camera.windowSize.height
    );

    // Clear the framebuffer
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
    gl.clearDepth(1.0);
    // gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Enable depth testing and culling (similar to WebGPU setup)
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE); // disabling this fixed a annoying bug with culling
    // gl.cullFace(gl.BACK);
    // gl.frontFace(gl.CCW);

    // Set up blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Bind camera uniform buffer (bind group 0)
    if (editor.cameraBinding) {
      editor.cameraBinding.bindGroup.bindWebGLBindGroup(gl);
    } else {
      console.error("Couldn't get camera binding");
      return;
    }

    // Bind window size uniform buffer
    if (editor.windowSizeBindGroup) {
      editor.windowSizeBindGroup.bindWebGLBindGroup(gl);
    } else {
      console.error("Couldn't get window size group");
      return;
    }

    // Helper function to draw indexed geometry
    const drawIndexedGeometry = (
      vertexBuffer: PolyfillBuffer,
      indexBuffer: PolyfillBuffer,
      indexCount: number
    ) => {
      const stride = 12 * Float32Array.BYTES_PER_ELEMENT; // 48 bytes

      // Bind vertex buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.buffer);

      // position: vec3 -> float32 * 3
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

      // tex_coords: vec2 -> float32 * 2
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 12);

      // color: vec4 -> float32 * 4
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 20);

      // gradient_coords: vec2 -> float32 * 2
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 36);

      // object_type: float32
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 44);

      // Bind index buffer
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);

      // console.info("indexBuffer.buffer", indexBuffer);
      // console.info("indexCount", indexCount);

      // Draw
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      // try drawArrays instead
      // const vertexCount = vertexBuffer.data
      //   ? vertexBuffer.data.byteLength / stride
      //   : 0;
      // gl.drawArrays(gl.TRIANGLES, 0, vertexCount); // Use indexCount directly for drawArrays
    };

    // Draw static polygons
    for (const polygon of editor.staticPolygons || []) {
      // Update uniform buffer if this polygon is being dragged
      if (editor.draggingPathHandle === polygon.id) {
        polygon.transform.updateUniformBuffer(queue, editor.camera.windowSize);
      }

      if (
        polygon.name === "canvas_background" &&
        editor.target === SaveTarget.Videos &&
        editor.isPlaying
      ) {
        polygon.updateGradientAnimation(device, 0.001);
      }

      polygon.bindGroup.bindWebGLBindGroup(gl);
      // polygon.gradientBindGroup?.bindWebGLBindGroup(gl);
      polygon.groupBindGroup?.bindWebGLBindGroup(gl);

      // log data
      // console.info(
      //   "polygon data",
      //   polygon.bindGroup.resources.filter((x) =>
      //     x.resource instanceof PolyfillBuffer ? x.resource.data : null
      //   ),
      //   // polygon.gradientBindGroup?.resources.filter((x) =>
      //   //   x.resource instanceof PolyfillBuffer ? x.resource.data : null
      //   // ),
      //   polygon.groupBindGroup.resources.filter((x) =>
      //     x.resource instanceof PolyfillBuffer ? x.resource.data : null
      //   )
      // );

      drawIndexedGeometry(
        polygon.vertexBuffer as PolyfillBuffer,
        polygon.indexBuffer as PolyfillBuffer,
        polygon.indices.length
      );
    }

    // Draw motion paths
    for (const path of editor.motionPaths || []) {
      // Update path transform if being dragged
      if (
        editor.draggingPath === path.id ||
        editor.draggingPolygon === path.associatedPolygonId ||
        editor.draggingImage === path.associatedPolygonId ||
        editor.draggingText === path.associatedPolygonId ||
        editor.draggingVideo === path.associatedPolygonId
      ) {
        path.transform.updateUniformBuffer(queue, editor.camera.windowSize);
      }

      // this.bindWebGLBindGroup(gl, path.bindGroup, 3);
      path.bindGroup.bindWebGLBindGroup(gl);

      // Draw static polygons in this path
      for (const polygon of path.staticPolygons || []) {
        if (editor.draggingPathHandle === polygon.id) {
          polygon.transform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        // this.bindWebGLBindGroup(gl, polygon.bindGroup, 1);

        polygon.bindGroup.bindWebGLBindGroup(gl);
        // polygon.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          polygon.vertexBuffer as PolyfillBuffer,
          polygon.indexBuffer as PolyfillBuffer,
          polygon.indices.length
        );
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

          // console.info("polygon", polygon.id, polygon.transform.layer);
        }

        // this.bindWebGLBindGroup(gl, polygon.bindGroup, 1);
        // this.bindWebGLBindGroup(gl, polygon.groupBindGroup, 3);

        polygon.bindGroup.bindWebGLBindGroup(gl);
        polygon.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          polygon.vertexBuffer as PolyfillBuffer,
          polygon.indexBuffer as PolyfillBuffer,
          polygon.indices.length
        );
      }
    }

    // Draw text items
    for (const textItem of editor.textItems || []) {
      if (!textItem.hidden && textItem.indices) {
        // Draw background polygon if not hidden
        if (!textItem.backgroundPolygon.hidden && !textItem.hiddenBackground) {
          if (
            editor.draggingText === textItem.backgroundPolygon.id ||
            editor.isPlaying
          ) {
            textItem.backgroundPolygon.transform.updateUniformBuffer(
              queue,
              editor.camera.windowSize
            );
          }

          // this.bindWebGLBindGroup(gl, textItem.backgroundPolygon.bindGroup, 1);
          // this.bindWebGLBindGroup(
          //   gl,
          //   textItem.backgroundPolygon.groupBindGroup,
          //   3
          // );

          textItem.bindGroup.bindWebGLBindGroup(gl);
          textItem.groupBindGroup?.bindWebGLBindGroup(gl);

          drawIndexedGeometry(
            textItem.backgroundPolygon.vertexBuffer as PolyfillBuffer,
            textItem.backgroundPolygon.indexBuffer as PolyfillBuffer,
            textItem.backgroundPolygon.indices.length
          );
        }

        // Draw the text itself
        if (editor.draggingText === textItem.id || editor.isPlaying) {
          textItem.transform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        // this.bindWebGLBindGroup(gl, textItem.bindGroup, 1);
        // this.bindWebGLBindGroup(gl, textItem.groupBindGroup, 3);

        if (textItem.hiddenBackground) {
          textItem.bindGroup.bindWebGLBindGroup(gl);
          textItem.groupBindGroup?.bindWebGLBindGroup(gl);
        }

        drawIndexedGeometry(
          textItem.vertexBuffer as PolyfillBuffer,
          textItem.indexBuffer as PolyfillBuffer,
          textItem.indices.length
        );
      }
    }

    // Draw video items
    for (const video of editor.videoItems || []) {
      if (!video.hidden) {
        // this.bindWebGLBindGroup(gl, video.groupBindGroup, 3);

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

            // this.bindWebGLBindGroup(gl, polygon.bindGroup, 1);

            polygon.bindGroup.bindWebGLBindGroup(gl);
            polygon.groupBindGroup?.bindWebGLBindGroup(gl);

            drawIndexedGeometry(
              polygon.vertexBuffer as PolyfillBuffer,
              polygon.indexBuffer as PolyfillBuffer,
              polygon.indices.length
            );
          }
        }

        if (editor.draggingVideo === video.id || editor.isPlaying) {
          video.groupTransform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        // this.bindWebGLBindGroup(gl, video.bindGroup, 1);

        video.bindGroup.bindWebGLBindGroup(gl);
        video.groupBindGroup?.bindWebGLBindGroup(gl);

        // console.info("video layer", video.layer, video.transform.layer);

        drawIndexedGeometry(
          video.vertexBuffer as PolyfillBuffer,
          video.indexBuffer as PolyfillBuffer,
          video.indices.length
        );
      }
    }

    // Draw image items
    for (const image of editor.imageItems || []) {
      if (!image.hidden) {
        // Disable depth writes for transparent images
        // gl.depthMask(false);

        if (editor.draggingImage === image.id || editor.isPlaying) {
          image.transform.updateUniformBuffer(queue, editor.camera.windowSize);
        }

        // this.bindWebGLBindGroup(gl, image.bindGroup, 1);
        // this.bindWebGLBindGroup(gl, image.groupBindGroup, 3);

        image.bindGroup.bindWebGLBindGroup(gl);
        image.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          image.vertexBuffer as PolyfillBuffer,
          image.indexBuffer as PolyfillBuffer,
          image.indices.length
        );

        // Re-enable depth writes for subsequent objects
        // gl.depthMask(true);
      }
    }

    // Draw brushes
    for (const brush of editor.brushes || []) {
      if (!brush.hidden && brush.vertices.length > 0) {
        // Brushes don't typically need dragging updates, but could be added if needed
        if (editor.isPlaying) {
          brush.transform.updateUniformBuffer(queue, editor.camera.windowSize);
        }

        brush.bindGroup.bindWebGLBindGroup(gl);
        brush.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          brush.vertexBuffer as PolyfillBuffer,
          brush.indexBuffer as PolyfillBuffer,
          brush.indices.length
        );
      }
    }

    // Draw 3D Mockups
    for (const mockup of editor.mockups3D || []) {
      if (!mockup.hidden) {
        if (editor.draggingMockup3D === mockup.id || editor.isPlaying) {
          mockup.groupTransform.updateUniformBuffer(
            queue,
            editor.camera.windowSize
          );
        }

        mockup.bindGroup.bindWebGLBindGroup(gl);
        mockup.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          mockup.vertexBuffer as PolyfillBuffer,
          mockup.indexBuffer as PolyfillBuffer,
          mockup.indices.length
        );

        if (mockup.videoChild) {
          if (
            editor.draggingVideo === mockup.videoChild.id ||
            editor.isPlaying
          ) {
            mockup.videoChild.transform.updateUniformBuffer(
              queue,
              editor.camera.windowSize
            );
          }

          mockup.videoChild.bindGroup.bindWebGLBindGroup(gl);

          // console.info("video layer", video.layer, video.transform.layer);

          drawIndexedGeometry(
            mockup.videoChild.vertexBuffer as PolyfillBuffer,
            mockup.videoChild.indexBuffer as PolyfillBuffer,
            mockup.videoChild.indices.length
          );
        }
      }
    }

    // Draw 3D cubes
    for (const cube of editor.cubes3D || []) {
      if (!cube.hidden) {
        if (editor.draggingCube3D === cube.id || editor.isPlaying) {
          cube.transform.updateUniformBuffer(queue, editor.camera.windowSize);
        }

        cube.bindGroup.bindWebGLBindGroup(gl);
        cube.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          cube.vertexBuffer as PolyfillBuffer,
          cube.indexBuffer as PolyfillBuffer,
          cube.indices.length
        );
      }
    }

    // Draw 3D spheres
    for (const sphere of editor.spheres3D || []) {
      if (!sphere.hidden) {
        if (editor.draggingSphere3D === sphere.id || editor.isPlaying) {
          sphere.transform.updateUniformBuffer(queue, editor.camera.windowSize);
        }

        sphere.bindGroup.bindWebGLBindGroup(gl);
        sphere.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          sphere.vertexBuffer as PolyfillBuffer,
          sphere.indexBuffer as PolyfillBuffer,
          sphere.indices.length
        );
      }
    }

    // Draw repeat objects
    let repeatObjects = editor.repeatManager.getAllRepeatObjects();
    if (repeatObjects.length > 0) {
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
                sourceObject?.backgroundPolygon
              ) {
                // Draw background polygon if not hidden
                if (
                  sourceObject?.backgroundPolygon &&
                  !sourceObject.backgroundPolygon.hidden &&
                  !sourceObject.hiddenBackground
                ) {
                  if (editor.isPlaying) {
                    sourceObject.backgroundPolygon.transform.updateUniformBuffer(
                      queue,
                      editor.camera.windowSize
                    );
                  }

                  // this.bindWebGLBindGroup(
                  //   gl,
                  //   sourceObject.backgroundPolygon.bindGroup,
                  //   1
                  // );
                  // this.bindWebGLBindGroup(
                  //   gl,
                  //   sourceObject.backgroundPolygon.groupBindGroup,
                  //   3
                  // );

                  sourceObject.bindGroup.bindWebGLBindGroup(gl);
                  sourceObject.groupBindGroup?.bindWebGLBindGroup(gl);

                  drawIndexedGeometry(
                    sourceObject.backgroundPolygon
                      .vertexBuffer as PolyfillBuffer,
                    sourceObject.backgroundPolygon
                      .indexBuffer as PolyfillBuffer,
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

            // this.bindWebGLBindGroup(gl, instance.bindGroup!, 1);
            // this.bindWebGLBindGroup(gl, sourceObject.groupBindGroup, 3);

            //             repeatObject.bindGroup.bindWebGLBindGroup(gl);
            // repeatObject.groupBindGroup?.bindWebGLBindGroup(gl);

            drawIndexedGeometry(
              repeatObject.vertexBuffer as PolyfillBuffer,
              repeatObject.indexBuffer as PolyfillBuffer,
              repeatObject.indices.length
            );
          }
        }
      }
    }

    // Draw text areas
    if (editor.textArea) {
      if (!editor.textArea.hidden && editor.textArea.indices) {
        // this.bindWebGLBindGroup(gl, editor.textArea.bindGroup, 1);
        // this.bindWebGLBindGroup(gl, editor.textArea.groupBindGroup, 3);

        //         textArea.bindGroup.bindWebGLBindGroup(gl);
        // textArea.groupBindGroup?.bindWebGLBindGroup(gl);

        drawIndexedGeometry(
          editor.textArea.vertexBuffer as PolyfillBuffer,
          editor.textArea.indexBuffer as PolyfillBuffer,
          editor.textArea.indices.length
        );
      }
    }

    // Update camera binding if panning
    if (editor.controlMode === ControlMode.Pan && editor.isPanning) {
      editor.updateCameraBinding();
    }

    // Flush WebGL commands (equivalent to queue.submit())
    gl.flush();

    // Call frame encoder if provided
    if (frameEncoder) {
      // Create a dummy texture for the frame encoder
      const frameTexture = device.createTexture({
        size: {
          width: editor.camera.windowSize.width,
          height: editor.camera.windowSize.height,
        },
        format: "rgba8unorm",
        usage: 0x10, // RENDER_ATTACHMENT
      });

      // Need to write the WebGL frame to this texture so data is ultimately encoded to the video file
      frameTexture.updateFromFramebuffer(
        editor.camera.windowSize.width,
        editor.camera.windowSize.height
      );

      await frameEncoder(frameTexture);
    }
  }

  //   // Helper method to bind WebGL bind groups
  //   private bindWebGLBindGroup(
  //     gl: WebGL2RenderingContext,
  //     bindGroup: PolyfillBindGroup,
  //     groupIndex: number
  //   ): void {
  //     // Iterate through the bind group resources and bind them appropriately
  //     bindGroup.resources.forEach((resource, binding) => {
  //       if (resource instanceof PolyfillBuffer) {
  //         // Bind uniform buffer
  //         const uniformBlockIndex = gl.getUniformBlockIndex(
  //           gl.getParameter(gl.CURRENT_PROGRAM),
  //           `bindGroup${groupIndex}_${binding}`
  //         );
  //         if (uniformBlockIndex !== gl.INVALID_INDEX) {
  //           gl.uniformBlockBinding(
  //             gl.getParameter(gl.CURRENT_PROGRAM),
  //             uniformBlockIndex,
  //             binding
  //           );
  //           gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, resource.buffer);
  //         }
  //       } else if (resource instanceof PolyfillTexture) {
  //         // Bind texture
  //         gl.activeTexture(gl.TEXTURE0 + binding);
  //         gl.bindTexture(gl.TEXTURE_2D, resource.texture);

  //         // Set the uniform sampler
  //         const samplerLocation = gl.getUniformLocation(
  //           gl.getParameter(gl.CURRENT_PROGRAM),
  //           `bindGroup${groupIndex}_${binding}`
  //         );
  //         if (samplerLocation) {
  //           gl.uniform1i(samplerLocation, binding);
  //         }
  //       }
  //     });
  //   }

  // // Updated bind group method
  // private bindWebGLBindGroup(
  //   gl: WebGL2RenderingContext,
  //   bindGroup: PolyfillBindGroup,
  //   groupIndex: number
  // ): void {
  //   const program = gl.getParameter(gl.CURRENT_PROGRAM);

  //   bindGroup.resources.forEach((resource, binding) => {
  //     const uniformName = `bindGroup${groupIndex}_${binding}`;

  //     if (resource instanceof PolyfillBuffer) {
  //       // Bind uniform buffer
  //       const uniformBlockIndex = gl.getUniformBlockIndex(program, uniformName);
  //       if (uniformBlockIndex !== gl.INVALID_INDEX) {
  //         // Bind the uniform block to a binding point
  //         const bindingPoint = groupIndex * 10 + binding; // Unique binding point
  //         gl.uniformBlockBinding(program, uniformBlockIndex, bindingPoint);
  //         gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, resource.buffer);
  //       }
  //     } else if (resource instanceof PolyfillTexture) {
  //       // Bind texture
  //       const textureUnit = groupIndex * 10 + binding; // Unique texture unit
  //       gl.activeTexture(gl.TEXTURE0 + textureUnit);
  //       gl.bindTexture(gl.TEXTURE_2D, resource.texture);

  //       // Set the uniform sampler
  //       const samplerLocation = gl.getUniformLocation(program, uniformName);
  //       if (samplerLocation) {
  //         gl.uniform1i(samplerLocation, textureUnit);
  //       }
  //     }
  //   });
  // }

  // // Helper to create camera/global uniform buffer (bind group 0)
  // createCameraUniformBuffer(
  //   gl: WebGL2RenderingContext,
  //   camera: Camera3D,
  //   windowSize: [number, number]
  // ): PolyfillBuffer {
  //   // std140 layout: mat4 (64 bytes) + vec2 (8 bytes) + padding (8 bytes) = 80 bytes
  //   const buffer = new PolyfillBuffer(gl, 80, "uniform");
  //   const mappedRange = buffer.getMappedRange();
  //   const data = new Float32Array(mappedRange);

  //   // u_camera_view_proj (mat4 - 16 floats)
  //   data.set(camera.getViewProjectionMatrix(), 0);

  //   // u_window_size (vec2 - 2 floats)
  //   data[16] = windowSize[0];
  //   data[17] = windowSize[1];

  //   // padding (2 floats)
  //   data[18] = 0.0;
  //   data[19] = 0.0;

  //   buffer.unmap();
  //   return buffer;
  // }

  // // Helper to create model matrix uniform buffer (bind group 1)
  // createModelUniformBuffer(
  //   gl: WebGL2RenderingContext,
  //   modelMatrix: Float32Array
  // ): PolyfillBuffer {
  //   // std140 layout: mat4 (64 bytes)
  //   const buffer = new PolyfillBuffer(gl, 64, "uniform");
  //   const mappedRange = buffer.getMappedRange();
  //   const data = new Float32Array(mappedRange);
  //   data.set(modelMatrix, 0);

  //   buffer.unmap();
  //   return buffer;
  // }

  // // Helper to create gradient uniform buffer (bind group 2)
  // createGradientUniformBuffer(
  //   gl: WebGL2RenderingContext,
  //   gradientData: any
  // ): PolyfillBuffer {
  //   // Calculate size based on std140 layout
  //   // vec4[2] + vec4[8] + 13 floats + padding = approximately 256 bytes
  //   const buffer = new PolyfillBuffer(gl, 256, "uniform");
  //   const mappedRange = buffer.getMappedRange();
  //   const data = new Float32Array(mappedRange);

  //   let offset = 0;

  //   // u_stop_offsets[2] (2 vec4s = 8 floats)
  //   data.set(gradientData.stopOffsets || new Float32Array(8), offset);
  //   offset += 8;

  //   // u_stop_colors[8] (8 vec4s = 32 floats)
  //   data.set(gradientData.stopColors || new Float32Array(32), offset);
  //   offset += 32;

  //   // Individual float uniforms
  //   data[offset++] = gradientData.numStops || 0;
  //   data[offset++] = gradientData.gradientType || 0;
  //   data[offset++] = gradientData.startPoint?.[0] || 0;
  //   data[offset++] = gradientData.startPoint?.[1] || 0;
  //   data[offset++] = gradientData.endPoint?.[0] || 0;
  //   data[offset++] = gradientData.endPoint?.[1] || 0;
  //   data[offset++] = gradientData.center?.[0] || 0;
  //   data[offset++] = gradientData.center?.[1] || 0;
  //   data[offset++] = gradientData.radius || 0;
  //   data[offset++] = gradientData.time || 0;
  //   data[offset++] = gradientData.animationSpeed || 0;
  //   data[offset++] = gradientData.enabled || 0;
  //   data[offset++] = 0.0; // padding

  //   buffer.unmap();
  //   return buffer;
  // }

  // // Helper to create group transform uniform buffer (bind group 3)
  // createGroupUniformBuffer(
  //   gl: WebGL2RenderingContext,
  //   groupMatrix: Float32Array
  // ): PolyfillBuffer {
  //   // std140 layout: mat4 (64 bytes)
  //   const buffer = new PolyfillBuffer(gl, 64, "uniform");
  //   const mappedRange = buffer.getMappedRange();
  //   const data = new Float32Array(mappedRange);
  //   data.set(groupMatrix, 0);

  //   buffer.unmap();
  //   return buffer;
  // }
}

function isTextRenderer(obj: RepeatableObject): obj is TextRenderer {
  return (obj as TextRenderer).backgroundPolygon !== undefined;
}
