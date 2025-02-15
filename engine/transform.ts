import { mat4, vec2, vec3, quat } from "gl-matrix";
import { Point, WindowSize } from "./editor"; // Import your editor types

export class Transform {
  position: vec2;
  rotation: number; // Rotation angle in radians
  scale: vec2;
  uniformBuffer: GPUBuffer;
  layer: number;

  constructor(
    position: vec2,
    rotation: number, // Accepts angle in radians
    scale: vec2,
    uniformBuffer: GPUBuffer
    // windowSize: WindowSize
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.uniformBuffer = uniformBuffer;
    this.layer = 0.0;
  }

  updateTransform(windowSize: WindowSize): mat4 {
    const x = this.position[0];
    const y = this.position[1];

    // Create individual transformation matrices
    const translation = mat4.fromTranslation(
      mat4.create(),
      vec3.fromValues(x, y, this.layer)
    );
    const rotation = mat4.fromQuat(
      mat4.create(),
      quat.fromEuler(quat.create(), 0, 0, (this.rotation * 180) / Math.PI)
    ); // gl-matrix uses degrees for quat euler angles
    const scale = mat4.fromScaling(
      mat4.create(),
      vec3.fromValues(this.scale[0], this.scale[1], 1.0)
    ); // Use both x and y scale

    // Combine transformations: translation * rotation * scale
    let combined = mat4.create();
    mat4.mul(combined, translation, rotation);
    mat4.mul(combined, combined, scale);

    return combined;
  }

  updateUniformBuffer(queue: GPUQueue, windowSize: WindowSize) {
    const transformMatrix = this.updateTransform(windowSize);
    const rawMatrix = matrix4ToRawArray(transformMatrix);
    queue.writeBuffer(
      this.uniformBuffer,
      0,
      new Float32Array(rawMatrix).buffer
    );
  }

  updatePosition(position: [number, number], windowSize: WindowSize) {
    this.position = vec2.fromValues(position[0], position[1]);
  }

  updateRotation(angle: number) {
    this.rotation = angle;
  }

  updateRotationDegrees(degrees: number) {
    this.rotation = degrees * (Math.PI / 180.0);
  }

  updateScale(scale: [number, number]) {
    this.scale = vec2.fromValues(scale[0], scale[1]);
  }

  translate(translation: vec2) {
    vec2.add(this.position, this.position, translation);
  }

  rotate(angle: number) {
    this.rotation += angle;
  }

  rotateDegrees(degrees: number) {
    this.rotation += degrees * (Math.PI / 180.0);
  }

  //   scaleFunc(scale: vec2) {
  //     // Renamed to avoid name collision with the scale property
  //     vec2.scale(this.scale, this.scale, scale);
  //   }
}

export function matrix4ToRawArray(matrix: mat4): Float32Array {
  return new Float32Array(matrix); // gl-matrix stores matrices in column-major order, matching WebGPU
}

export function angleBetweenPoints(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Calculate the angle in radians using atan2
  const angleRad = Math.atan2(dy, dx);

  return angleRad;
}

export function degreesBetweenPoints(p1: Point, p2: Point): number {
  const angleRad = angleBetweenPoints(p1, p2);

  // Convert radians to degrees if needed
  const angleDeg = (angleRad * 180.0) / Math.PI;

  return angleDeg;
}

/// For creating temporary group bind groups
/// Later, when real groups are introduced, this will be replaced
export function createEmptyGroupTransform(
  device: GPUDevice,
  groupBindGroupLayout: GPUBindGroupLayout,
  windowSize: WindowSize
): [GPUBindGroup, Transform] {
  const emptyBuffer = mat4.create();
  const rawMatrix = matrix4ToRawArray(emptyBuffer);

  const uniformBuffer = device.createBuffer({
    label: "Group Uniform Buffer",
    size: rawMatrix.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  //   new Float32Array(uniformBuffer.getMappedRange()).set(rawMatrix);
  //   uniformBuffer.unmap();

  // Now create your bind group with these defaults
  const bindGroup = device.createBindGroup({
    layout: groupBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
    label: "Transform Bind Group",
  });

  const groupTransform = new Transform(
    vec2.fromValues(0.0, 0.0),
    0.0,
    vec2.fromValues(1.0, 1.0),
    uniformBuffer,
    windowSize
  );

  return [bindGroup, groupTransform];
}
