import { mat4, vec2 } from "gl-matrix";
import { StImage } from "./image";
import { Polygon } from "./polygon";
import { TextRenderer } from "./text";
import { Transform } from "./transform";
import { Vertex } from "./vertex";
import { v4 as uuidv4 } from "uuid";
import { WindowSize } from "./camera";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";

// Types for repeat patterns
export type RepeatPattern = {
  count: number;
  spacing: number;
  direction: "horizontal" | "vertical" | "circular" | "grid";
  rotation?: number;
  scale?: number;
  fadeOut?: boolean;
};

export type RepeatableObject = Polygon | TextRenderer | StImage;

export class RepeatInstance {
  transform: Transform | null = null;
  bindGroup: PolyfillBindGroup | null = null;
}

export class RepeatObject {
  id: string;
  sourceObject: RepeatableObject;
  pattern: RepeatPattern;
  instances: RepeatInstance[];
  vertexBuffer: PolyfillBuffer | null = null;
  indexBuffer: PolyfillBuffer | null = null;
  hidden: boolean;
  layer: number;
  vertices: Vertex[] = [];
  indices: number[] = [];

  constructor(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    sourceObject: RepeatableObject,
    pattern: RepeatPattern
  ) {
    this.id = uuidv4();
    this.sourceObject = sourceObject;
    this.pattern = pattern;
    this.instances = [];
    this.hidden = false;
    this.layer = sourceObject.layer;

    if (!sourceObject.vertices || !sourceObject.indices) {
      return;
    }

    this.vertexBuffer = device.createBuffer(
      {
        size: 65536,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );

    this.indexBuffer = device.createBuffer(
      {
        size: 65536,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );

    queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array(
        sourceObject.vertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
          ...v.gradient_coords,
          v.object_type,
        ])
      )
    );
    queue.writeBuffer(
      this.indexBuffer,
      0,
      new Uint32Array(sourceObject.indices)
    );

    this.vertices = sourceObject.vertices;
    this.indices = sourceObject.indices;

    // Create transforms for each instance
    this.generateInstances(device, queue, windowSize, bindGroupLayout);

    // Copy the bind group from the source object
    // this.bindGroup = sourceObject.bindGroup; // not workable, need our own uniform per instance
  }

  private generateInstances(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout
  ) {
    this.instances = [];
    const baseTransform = this.sourceObject.transform;

    switch (this.pattern.direction) {
      case "horizontal":
        this.generateHorizontalInstances(
          device,
          queue,
          windowSize,
          bindGroupLayout,
          baseTransform
        );
        break;
      case "vertical":
        this.generateVerticalInstances(
          device,
          queue,
          windowSize,
          bindGroupLayout,
          baseTransform
        );
        break;
      case "circular":
        this.generateCircularInstances(
          device,
          queue,
          windowSize,
          bindGroupLayout,
          baseTransform
        );
        break;
      case "grid":
        this.generateGridInstances(
          device,
          queue,
          windowSize,
          bindGroupLayout,
          baseTransform
        );
        break;
    }
  }

  private createBindGroup(
    device: PolyfillDevice,
    bindGroupLayout: PolyfillBindGroupLayout,
    instance: RepeatInstance
  ): PolyfillBuffer {
    const identityMatrix = mat4.create();
    let uniformBuffer = device.createBuffer(
      {
        size: 64,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      },
      "uniformMatrix4fv"
    );

    if (process.env.NODE_ENV !== "test") {
      new Float32Array(uniformBuffer.getMappedRange()).set(identityMatrix);
      // uniformBuffer.unmap();
    }

    // let sampler = device.createSampler({
    //   addressModeU: "clamp-to-edge",
    //   addressModeV: "clamp-to-edge",
    //   magFilter: "linear",
    //   minFilter: "linear",
    //   mipmapFilter: "linear",
    // });

    instance.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, groupIndex: 3, resource: { pbuffer: uniformBuffer } },
        // { binding: 1, resource: this.sourceObject.textureView },
        // { binding: 2, resource: sampler },
      ],
    });

    uniformBuffer.unmap();

    return uniformBuffer;
  }

  private generateHorizontalInstances(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    baseTransform: Transform
  ) {
    for (let i = 0; i < this.pattern.count; i++) {
      let instance = new RepeatInstance();

      let uniformBuffer = this.createBindGroup(
        device,
        bindGroupLayout,
        instance
      );

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

      instance.transform = transform;

      instance.transform.updateUniformBuffer(queue, windowSize);

      this.instances.push(instance);
    }
  }

  private generateVerticalInstances(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    baseTransform: Transform
  ) {
    for (let i = 0; i < this.pattern.count; i++) {
      let instance = new RepeatInstance();

      let uniformBuffer = this.createBindGroup(
        device,
        bindGroupLayout,
        instance
      );

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

      instance.transform = transform;

      instance.transform.updateUniformBuffer(queue, windowSize);

      this.instances.push(instance);
    }
  }

  private generateCircularInstances(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    baseTransform: Transform
  ) {
    const radius = this.pattern.spacing;
    const angleStep = (2 * Math.PI) / this.pattern.count;

    for (let i = 0; i < this.pattern.count; i++) {
      let instance = new RepeatInstance();

      let uniformBuffer = this.createBindGroup(
        device,
        bindGroupLayout,
        instance
      );

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

      instance.transform = transform;

      instance.transform.updateUniformBuffer(queue, windowSize);

      this.instances.push(instance);
    }
  }

  private generateGridInstances(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    baseTransform: Transform
  ) {
    const gridSize = Math.ceil(Math.sqrt(this.pattern.count));
    let instanceCount = 0;

    for (let y = 0; y < gridSize && instanceCount < this.pattern.count; y++) {
      for (let x = 0; x < gridSize && instanceCount < this.pattern.count; x++) {
        let instance = new RepeatInstance();

        let uniformBuffer = this.createBindGroup(
          device,
          bindGroupLayout,
          instance
        );

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

        instance.transform = transform;

        instance.transform.updateUniformBuffer(queue, windowSize);

        this.instances.push(instance);

        instanceCount++;
      }
    }
  }

  updatePattern(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    newPattern: Partial<RepeatPattern>
  ) {
    this.pattern = { ...this.pattern, ...newPattern };
    this.generateInstances(device, queue, windowSize, bindGroupLayout);
  }
}

export class RepeatManager {
  private repeatedObjects: Map<string, RepeatObject>;

  constructor() {
    this.repeatedObjects = new Map();
  }

  createRepeatObject(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    sourceObject: RepeatableObject,
    pattern: RepeatPattern
  ): RepeatObject {
    const repeatObject = new RepeatObject(
      device,
      queue,
      windowSize,
      bindGroupLayout,
      sourceObject,
      pattern
    );
    this.repeatedObjects.set(sourceObject.id, repeatObject);
    return repeatObject;
  }

  updateRepeatObject(
    device: PolyfillDevice,
    queue: PolyfillQueue,
    windowSize: WindowSize,
    bindGroupLayout: PolyfillBindGroupLayout,
    id: string,
    newPattern: Partial<RepeatPattern>
  ): RepeatObject | null {
    const repeatObject = this.repeatedObjects.get(id);

    if (repeatObject) {
      repeatObject.updatePattern(
        device,
        queue,
        windowSize,
        bindGroupLayout,
        newPattern
      );

      return repeatObject;
    } else {
      console.warn("Repeat object does not exist");
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
