// Import necessary libraries - you'll need to install gl-matrix or a similar library
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Point } from "./editor";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";
import { matrix4ToRawArray } from "./transform";

// Types
export interface WindowSize {
  width: number;
  height: number;
}

// export type Point = [number, number]; // Assuming this is the type from editor

// Helper functions (assumed to be imported from elsewhere in your project)
function pointToNdc(
  windowSize: WindowSize,
  x: number,
  y: number
): [number, number] {
  // Implementation depends on your original Rust function
  const ndcX = (x / windowSize.width) * 2 - 1;
  const ndcY = 1 - (y / windowSize.height) * 2;
  return [ndcX, ndcY];
}

function sizeToNormal(
  windowSize: WindowSize,
  x: number,
  y: number
): [number, number] {
  // Implementation depends on your original Rust function
  const normalX = (x / windowSize.width) * 2;
  const normalY = (y / windowSize.height) * 2;
  return [normalX, normalY];
}

export class Camera {
  position: vec2;
  zoom: number;
  windowSize: WindowSize;
  focusPoint: vec2;

  constructor(windowSize: WindowSize) {
    this.windowSize = windowSize;
    this.position = vec2.fromValues(0.0, 0.0);
    this.zoom = 1.0;
    this.focusPoint = vec2.fromValues(
      windowSize.width / 2.0,
      windowSize.height / 2.0
    );
  }

  getViewProjectionMatrix(): mat4 {
    const projection = this.getProjection();
    const view = this.getView();

    const vp = mat4.create();
    mat4.multiply(vp, projection, view);

    return vp;
  }

  getProjection(): mat4 {
    const zoomFactor = this.zoom;
    const aspectRatio = this.windowSize.width / this.windowSize.height;

    const left = -1.0;
    const right = 1.0;
    const top = 1.0;
    const bottom = -1.0;
    const dx = (right - left) / (2.0 * zoomFactor);
    const dy = (top - bottom) / (2.0 * zoomFactor);
    const cx = (right + left) / 2.0;
    const cy = (top + bottom) / 2.0;

    const newLeft = cx - dx;
    const newRight = cx + dx;
    const newTop = cy + dy;
    const newBottom = cy - dy;

    const result = mat4.create();
    mat4.ortho(
      result,
      newLeft, // left
      newRight, // right
      newBottom, // bottom
      newTop, // top
      -100.0, // near
      100.0 // far
    );

    return result;
  }

  getView(): mat4 {
    // Calculate normalized position
    const testNorm = sizeToNormal(
      this.windowSize,
      this.position[0],
      this.position[1]
    );

    // Create view matrix
    const view = mat4.fromValues(
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      -testNorm[0],
      -testNorm[1],
      0.0,
      1.0
    );

    return view;
  }

  pan(delta: vec2): void {
    vec2.add(this.position, this.position, delta);
  }

  update_zoom(delta: number, center: Point): void {
    this.zoom = this.zoom + delta;
    console.log(`new zoom: ${this.zoom} delta: ${delta}`);
  }
}

// WebGPU specific camera uniform
export class CameraUniform {
  viewProj: Float32Array;

  constructor() {
    this.viewProj = new Float32Array(16);
    mat4.identity(this.viewProj as mat4);
  }

  updateViewProj(camera: Camera): void {
    const viewProjMatrix = camera.getViewProjectionMatrix();
    this.viewProj.set(viewProjMatrix as Float32Array);
  }

  // Get the data as a buffer
  getBuffer(): Float32Array {
    return this.viewProj;
  }
}

export class CameraBinding {
  buffer: PolyfillBuffer;
  bindGroup: PolyfillBindGroup;
  bindGroupLayout: PolyfillBindGroupLayout;
  uniform: CameraUniform;

  constructor(device: PolyfillDevice, queue: PolyfillQueue, camera: Camera) {
    this.uniform = new CameraUniform();

    // Create the uniform buffer
    this.buffer = device.createBuffer(
      {
        label: "Camera Uniform Buffer",
        size: 16 * 4, // 4x4 matrix of floats
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true, // Map the buffer for initialization
      },
      "uniformMatrix4fv"
    );

    // const emptyMatrix = mat4.create();
    // mat4.identity(emptyMatrix);
    // const rawMatrix = matrix4ToRawArray(emptyMatrix);
    // this.buffer.data = rawMatrix.buffer;
    this.update(queue, camera);

    // unmap
    this.buffer.unmap();

    // Create bind group layout
    this.bindGroupLayout = device.createBindGroupLayout({
      // label: "Camera Bind Group Layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
            // hasDynamicOffset: false,
            // minBindingSize: 16 * 4,
          },
        },
      ],
    });

    // Create bind group
    this.bindGroup = device.createBindGroup({
      // label: "Camera Bind Group",
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          groupIndex: 0,
          resource: {
            pbuffer: this.buffer,
          },
        },
      ],
    });
  }

  update(queue: PolyfillQueue, camera: Camera): void {
    this.uniform.updateViewProj(camera);
    queue.writeBuffer(this.buffer, 0, this.uniform.getBuffer());
  }
}
