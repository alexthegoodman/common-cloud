import { mat4, vec2, vec3, quat } from "gl-matrix";
import { Point } from "./editor";
import { Camera } from "./camera"; // Import your existing Camera class
import { WindowSize } from "./camera";

export class Camera3D extends Camera {
  // 3D position instead of 2D
  position3D: vec3;

  // Rotation represented as quaternion
  rotation: quat;

  // Field of view in radians
  fov: number;

  // Near and far clipping planes
  near: number;
  far: number;

  // Camera up vector
  up: vec3;

  // Camera target/look-at point
  target: vec3;

  constructor(windowSize: WindowSize) {
    super(windowSize);

    // Initialize 3D position (x, y from base class, adding z)
    this.position3D = vec3.fromValues(
      this.position[0],
      this.position[1],
      0.0
      // 10.0
    );

    // Initialize rotation as identity quaternion (no rotation)
    this.rotation = quat.create();

    // Default field of view
    // this.fov = Math.PI / 2; // not even close to enough
    // this.fov = Math.PI / 4; // not enough still
    this.fov = Math.PI / 8;
    // this.fov = Math.PI; // very wide

    // Set reasonable near and far clipping planes
    // this.near = 0.0001;
    // this.near = 1.0;
    this.near = 0.1;
    this.far = 1000.0;

    // Default up vector
    this.up = vec3.fromValues(0, 1, 0);

    // Default target at origin
    this.target = vec3.fromValues(0, 0, 0);
  }

  // Override the projection matrix to use perspective instead of orthographic
  getProjection(): mat4 {
    // const aspectRatio = this.windowSize.width / this.windowSize.height;
    const aspectRatio = 500 / 500;
    const result = mat4.create();

    // Create perspective matrix
    mat4.perspective(
      result,
      this.fov * this.zoom, // Apply zoom to field of view
      aspectRatio,
      this.near,
      this.far
    );

    return result;
  }

  // Override the view matrix to handle 3D camera positioning and rotation
  getView(): mat4 {
    const view = mat4.create();

    // Create lookAt matrix
    mat4.lookAt(view, this.position3D, this.target, this.up);

    // Apply rotation if needed
    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, this.rotation);
    mat4.multiply(view, view, rotationMatrix);

    return view;
  }

  // Method to set camera position in 3D space
  setPosition(x: number, y: number, z: number): void {
    this.position[0] = x; // Update 2D position for compatibility
    this.position[1] = y; // Update 2D position for compatibility
    this.position3D = vec3.fromValues(x, y, z);
  }

  // Method to set where the camera is looking at
  lookAt(target: vec3): void {
    this.target = vec3.clone(target);

    // Calculate and store the direction vector
    const direction = vec3.create();
    vec3.subtract(direction, this.target, this.position3D);
    vec3.normalize(direction, direction);

    // Update rotation quaternion based on direction
    const forward = vec3.fromValues(0, 0, -1); // Default forward direction
    this.rotation = quat.rotationTo(quat.create(), forward, direction);
  }

  // Override pan method to handle 3D movement
  pan(delta: vec2): void {
    super.pan(delta); // Call the parent method to update 2D position

    // Update 3D position to match 2D position (maintaining z)
    this.position3D[0] = this.position[0];
    this.position3D[1] = this.position[1];
  }

  // Move camera along its view direction
  moveForward(distance: number): void {
    const direction = vec3.create();
    vec3.subtract(direction, this.target, this.position3D);
    vec3.normalize(direction, direction);
    vec3.scale(direction, direction, distance);
    vec3.add(this.position3D, this.position3D, direction);
  }

  // Move camera along its right vector
  moveRight(distance: number): void {
    const direction = vec3.create();
    vec3.subtract(direction, this.target, this.position3D);
    const right = vec3.create();
    vec3.cross(right, direction, this.up);
    vec3.normalize(right, right);
    vec3.scale(right, right, distance);
    vec3.add(this.position3D, this.position3D, right);
  }

  // Override zoom to affect field of view instead
  update_zoom(delta: number, center: Point): void {
    super.update_zoom(delta, center);

    // You might want additional logic specific to 3D perspective
    // For example, adjusting FOV based on zoom level
    this.fov = Math.PI / 4 / this.zoom;

    // Clamp FOV to reasonable values
    this.fov = Math.max(Math.PI / 32, Math.min(this.fov, Math.PI / 2));
  }

  // Method to orbit camera around target point
  orbit(deltaX: number, deltaY: number, radius?: number): void {
    // If radius is provided, maintain that distance from target
    if (radius !== undefined) {
      const direction = vec3.create();
      vec3.subtract(direction, this.position3D, this.target);
      vec3.normalize(direction, direction);
      vec3.scale(direction, direction, radius);
      vec3.add(this.position3D, this.target, direction);
    }

    // Create rotation quaternions for x and y rotations
    const rotationX = quat.create();
    const rotationY = quat.create();

    // Rotate around vertical axis (y-axis)
    quat.setAxisAngle(rotationY, this.up, deltaX);

    // Find the right vector for horizontal rotation
    const forward = vec3.create();
    vec3.subtract(forward, this.target, this.position3D);
    const right = vec3.create();
    vec3.cross(right, forward, this.up);
    vec3.normalize(right, right);

    // Rotate around horizontal axis (right vector)
    quat.setAxisAngle(rotationX, right, deltaY);

    // Combine rotations
    const rotation = quat.create();
    quat.multiply(rotation, rotationX, rotationY);

    // Apply rotation to position (orbiting around target)
    const offset = vec3.create();
    vec3.subtract(offset, this.position3D, this.target);
    vec3.transformQuat(offset, offset, rotation);
    vec3.add(this.position3D, this.target, offset);

    // Update rotation quaternion
    quat.multiply(this.rotation, rotation, this.rotation);

    // Update 2D position for compatibility
    this.position[0] = this.position3D[0];
    this.position[1] = this.position3D[1];
  }
}
