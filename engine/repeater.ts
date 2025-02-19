import { mat4, vec2 } from "gl-matrix";
import { StImage } from "./image";
import { Polygon } from "./polygon";
import { TextRenderer } from "./text";
import { Transform } from "./transform";
import { Vertex } from "./vertex";

// Types for repeat patterns
type RepeatPattern = {
  count: number;
  spacing: number;
  direction: "horizontal" | "vertical" | "circular" | "grid";
  rotation?: number;
  scale?: number;
  fadeOut?: boolean;
};

type RepeatableObject = Polygon | TextRenderer | StImage;

export class RepeatObject {
  id: string;
  sourceObject: RepeatableObject;
  pattern: RepeatPattern;
  instances: Transform[];
  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;
  bindGroup: GPUBindGroup | null = null;
  hidden: boolean;
  layer: number;

  constructor(
    device: GPUDevice,
    queue: GPUQueue,
    sourceObject: RepeatableObject,
    pattern: RepeatPattern
  ) {
    this.id = crypto.randomUUID();
    this.sourceObject = sourceObject;
    this.pattern = pattern;
    this.instances = [];
    this.hidden = false;
    this.layer = sourceObject.layer;

    if (!sourceObject.vertices || !sourceObject.indices) {
      return;
    }

    this.vertexBuffer = device.createBuffer({
      size: 65536,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = device.createBuffer({
      size: 65536,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        sourceObject.vertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
        ])
      )
    );
    queue.writeBuffer(
      this.indexBuffer,
      0,
      new Uint32Array(sourceObject.indices)
    );

    // Create transforms for each instance
    this.generateInstances(device);

    // Copy the bind group from the source object
    this.bindGroup = sourceObject.bindGroup;
  }

  private generateInstances(device: GPUDevice) {
    this.instances = [];
    const baseTransform = this.sourceObject.transform;

    switch (this.pattern.direction) {
      case "horizontal":
        this.generateHorizontalInstances(device, baseTransform);
        break;
      case "vertical":
        this.generateVerticalInstances(device, baseTransform);
        break;
      case "circular":
        this.generateCircularInstances(device, baseTransform);
        break;
      case "grid":
        this.generateGridInstances(device, baseTransform);
        break;
    }
  }

  private generateHorizontalInstances(
    device: GPUDevice,
    baseTransform: Transform
  ) {
    for (let i = 0; i < this.pattern.count; i++) {
      const identityMatrix = mat4.create();
      let uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
      uniformBuffer.unmap();

      let position = vec2.fromValues(
        baseTransform.position[0] + i * this.pattern.spacing,
        baseTransform.position[1]
      );
      let rotation = baseTransform.rotation + (this.pattern.rotation || 0) * i;
      let scale = vec2.scale(
        vec2.create(),
        baseTransform.scale,
        this.pattern.scale ? Math.pow(this.pattern.scale, i) : 1
      );

      const transform = new Transform(position, rotation, scale, uniformBuffer);

      transform.layer = this.layer;

      this.instances.push(transform);
    }
  }

  private generateVerticalInstances(
    device: GPUDevice,
    baseTransform: Transform
  ) {
    for (let i = 0; i < this.pattern.count; i++) {
      const identityMatrix = mat4.create();
      let uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
      uniformBuffer.unmap();

      let position = vec2.fromValues(
        baseTransform.position[0],
        baseTransform.position[1] + i * this.pattern.spacing
      );
      let rotation = baseTransform.rotation + (this.pattern.rotation || 0) * i;
      let scale = vec2.scale(
        vec2.create(),
        baseTransform.scale,
        this.pattern.scale ? Math.pow(this.pattern.scale, i) : 1
      );

      const transform = new Transform(position, rotation, scale, uniformBuffer);

      transform.layer = this.layer;

      this.instances.push(transform);
    }
  }

  private generateCircularInstances(
    device: GPUDevice,
    baseTransform: Transform
  ) {
    const radius = this.pattern.spacing;
    const angleStep = (2 * Math.PI) / this.pattern.count;

    for (let i = 0; i < this.pattern.count; i++) {
      const identityMatrix = mat4.create();
      let uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
      uniformBuffer.unmap();

      const angle = i * angleStep;

      let position = vec2.fromValues(
        baseTransform.position[0] + radius * Math.cos(angle),
        baseTransform.position[1] + radius * Math.sin(angle)
      );
      let rotation =
        baseTransform.rotation + angle + (this.pattern.rotation || 0);
      let scale = vec2.scale(
        vec2.create(),
        baseTransform.scale,
        this.pattern.scale ? Math.pow(this.pattern.scale, i) : 1
      );

      const transform = new Transform(position, rotation, scale, uniformBuffer);

      transform.layer = this.layer;

      this.instances.push(transform);
    }
  }

  private generateGridInstances(device: GPUDevice, baseTransform: Transform) {
    const gridSize = Math.ceil(Math.sqrt(this.pattern.count));
    let instanceCount = 0;

    for (let y = 0; y < gridSize && instanceCount < this.pattern.count; y++) {
      for (let x = 0; x < gridSize && instanceCount < this.pattern.count; x++) {
        const identityMatrix = mat4.create();
        let uniformBuffer = device.createBuffer({
          size: 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
        uniformBuffer.unmap();

        let position = vec2.fromValues(
          baseTransform.position[0] + x * this.pattern.spacing,
          baseTransform.position[1] + y * this.pattern.spacing
        );
        let rotation =
          baseTransform.rotation + (this.pattern.rotation || 0) * instanceCount;
        let scale = vec2.scale(
          vec2.create(),
          baseTransform.scale,
          this.pattern.scale ? Math.pow(this.pattern.scale, instanceCount) : 1
        );

        const transform = new Transform(
          position,
          rotation,
          scale,
          uniformBuffer
        );

        transform.layer = this.layer;

        this.instances.push(transform);

        instanceCount++;
      }
    }
  }

  updatePattern(device: GPUDevice, newPattern: Partial<RepeatPattern>) {
    this.pattern = { ...this.pattern, ...newPattern };
    this.generateInstances(device);
  }
}

export class RepeatManager {
  private repeatedObjects: Map<string, RepeatObject>;

  constructor() {
    this.repeatedObjects = new Map();
  }

  createRepeatObject(
    device: GPUDevice,
    queue: GPUQueue,
    sourceObject: RepeatableObject,
    pattern: RepeatPattern
  ): RepeatObject {
    const repeatObject = new RepeatObject(device, queue, sourceObject, pattern);
    this.repeatedObjects.set(repeatObject.id, repeatObject);
    return repeatObject;
  }

  updateRepeatObject(
    device: GPUDevice,
    id: string,
    newPattern: Partial<RepeatPattern>
  ): RepeatObject | null {
    const repeatObject = this.repeatedObjects.get(id);

    if (repeatObject) {
      repeatObject.updatePattern(device, newPattern);

      return repeatObject;
    }

    return null;
  }

  deleteRepeatObject(id: string): boolean {
    return this.repeatedObjects.delete(id);
  }

  getRepeatObject(id: string): RepeatObject | null {
    return this.repeatedObjects.get(id) || null;
  }

  getAllRepeatObjects(): RepeatObject[] {
    return Array.from(this.repeatedObjects.values());
  }
}
