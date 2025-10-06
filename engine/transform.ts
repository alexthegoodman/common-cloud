import { mat4, vec2, vec3, quat, vec4 } from "gl-matrix";
import { WindowSize } from "./camera";
import { Point } from "./editor";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";

export class Transform {
  position: vec2;
  startPosition: vec2;
  rotation: number; // Rotation angle in radians
  rotationX: number;
  rotationY: number;
  scale: vec2;
  uniformBuffer: PolyfillBuffer;
  layer: number;

  constructor(
    position: vec2,
    rotation: number, // Accepts angle in radians
    scale: vec2,
    uniformBuffer: PolyfillBuffer
    // windowSize: WindowSize
  ) {
    this.position = position;
    this.startPosition = position;
    this.rotation = rotation;
    this.rotationX = 0;
    this.rotationY = 0;
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
      quat.fromEuler(
        quat.create(),
        (this.rotationX * 180) / Math.PI,
        (this.rotationY * 180) / Math.PI,
        (this.rotation * 180) / Math.PI
      )
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

  updateUniformBuffer(queue: PolyfillQueue, windowSize: WindowSize) {
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

  updateRotationX(angle: number) {
    this.rotationX = angle;
  }

  updateRotationY(angle: number) {
    this.rotationY = angle;
  }

  updateRotationDegrees(degrees: number) {
    this.rotation = degrees * (Math.PI / 180.0);
  }

  // best as 100 * 0.001
  updateRotationXDegrees(degrees: number) {
    this.rotationX = degrees * (Math.PI / 180.0);
  }

  // best as 100 * 0.001
  updateRotationYDegrees(degrees: number) {
    this.rotationY = degrees * (Math.PI / 180.0);
  }

  updateScale(scale: [number, number]) {
    this.scale = vec2.fromValues(scale[0], scale[1]);
  }

  updateScaleX(scaleX: number) {
    this.scale[0] = scaleX;
  }

  updateScaleY(scaleY: number) {
    this.scale[1] = scaleY;
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

  /**
   * Calculates and returns the current World Matrix (same as updateTransform)
   * but without updating the uniform buffer.
   * @returns {mat4} The combined Translation * Rotation * Scale matrix.
   */
  getWorldMatrix(windowSize: WindowSize): mat4 {
    // Re-use the existing transformation logic
    return this.updateTransform(windowSize);
  }

  /**
   * Calculates the Inverse World Matrix. This is used to transform a World Point
   * into the object's Local Space for hit-testing.
   * @returns {mat4} The inverse of the World Matrix.
   */
  getInverseWorldMatrix(windowSize: WindowSize): mat4 {
    const worldMatrix = this.getWorldMatrix(windowSize);
    const inverseMatrix = mat4.create();

    // Compute the inverse matrix
    mat4.invert(inverseMatrix, worldMatrix);

    return inverseMatrix;
  }

  /**
   * Transforms an input Point (e.g., in World Space) by a given matrix.
   * @param {Point} point - The point to transform.
   * @param {mat4} matrix - The matrix to use for the transformation.
   * @returns {Point} The transformed point.
   */
  transformPoint(point: Point, matrix: mat4): Point {
    // This function now relies on the corrected external utility
    return transformPointByMatrix(point, matrix);
  }
}

/**
 * Utility function to transform a 2D Point by a 4x4 matrix.
 * It treats the 2D point (x, y) as a 4D vector (x, y, 0, 1) for matrix multiplication.
 * @param {Point} point - The 2D point {x, y} to transform.
 * @param {mat4} matrix - The 4x4 transformation matrix.
 * @returns {Point} The transformed 2D point.
 */
export function transformPointByMatrix(point: Point, matrix: mat4): Point {
  // Use a temporary vec4 to represent the point (x, y, z=0, w=1)
  const tempVec = vec4.fromValues(point.x, point.y, 0.0, 1.0);
  const resultVec = vec4.create();

  // 1. **CORRECTION:** Use vec4.transformMat4(out, vec, mat)
  // This function applies the matrix transformation: resultVec = matrix * tempVec
  vec4.transformMat4(resultVec, tempVec, matrix);

  // The resulting point is the transformed (x, y) coordinates.
  // We divide by w (resultVec[3]) for homogeneous coordinates,
  // although w should be 1.0 for standard affine (non-perspective) transforms.
  const w = resultVec[3];

  return {
    x: resultVec[0] / w,
    y: resultVec[1] / w,
  } as Point; // Assuming 'Point' is { x: number, y: number }
}

export function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180.0);
}

export function matrix4ToRawArray(matrix: mat4): Float32Array<ArrayBuffer> {
  return new Float32Array(matrix.values()); // gl-matrix stores matrices in column-major order, matching WebGPU
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
  device: PolyfillDevice,
  groupBindGroupLayout: PolyfillBindGroupLayout,
  windowSize: WindowSize
): [PolyfillBindGroup, Transform] {
  const emptyBuffer = mat4.create();
  const rawMatrix = matrix4ToRawArray(emptyBuffer);

  const uniformBuffer = device.createBuffer(
    {
      label: "Group Uniform Buffer",
      size: rawMatrix.byteLength,
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    },
    "uniformMatrix4fv"
  );

  if (process.env.NODE_ENV !== "test") {
    new Float32Array(uniformBuffer.getMappedRange()).set(rawMatrix);
    uniformBuffer.unmap();
  }

  // Now create your bind group with these defaults
  const bindGroup = device.createBindGroup({
    layout: groupBindGroupLayout,
    entries: [
      {
        binding: 0,
        groupIndex: 3,
        resource: {
          pbuffer: uniformBuffer,
        },
      },
    ],
    // label: "Transform Bind Group",
  });

  // uniformBuffer.unmap();

  const groupTransform = new Transform(
    vec2.fromValues(0.0, 0.0),
    0.0,
    vec2.fromValues(1.0, 1.0),
    uniformBuffer
    // windowSize
  );

  return [bindGroup, groupTransform];
}
