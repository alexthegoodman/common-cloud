import { mat4, vec2, vec3 } from "gl-matrix";
import { Camera, WindowSize } from "./camera";
import {
  BoundingBox,
  CANVAS_HORIZ_OFFSET,
  CANVAS_VERT_OFFSET,
  Point,
} from "./editor";
import {
  createEmptyGroupTransform,
  degreesToRadians,
  matrix4ToRawArray,
  Transform,
} from "./transform";
import { createVertex, getZLayer, Vertex, vertexByteSize } from "./vertex";
import { BackgroundFill, ObjectType } from "./animations";
import {
  PolyfillBindGroup,
  PolyfillBindGroupLayout,
  PolyfillBuffer,
  PolyfillDevice,
  PolyfillQueue,
} from "./polyfill";
import { setupGradientBuffers } from "./polygon";
import { StVideo, StVideoConfig } from "./video";

export interface Mockup3DConfig {
  id: string;
  name: string;
  dimensions: [number, number, number]; // [width, height, depth] of the laptop base
  position: Point;
  rotation: [number, number, number]; // Euler angles [x, y, z]
  backgroundFill: BackgroundFill;
  layer: number;
  videoChild: StVideoConfig; // Required video child
}

export interface SavedMockup3DConfig {
  id: string;
  name: string;
  dimensions: [number, number, number];
  position: Point;
  rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
  videoChild: StVideoConfig;
}

export class Mockup3D {
  id: string;
  name: string;
  dimensions: [number, number, number];
  // position: Point;
  // rotation: [number, number, number];
  backgroundFill: BackgroundFill;
  layer: number;
  hidden: boolean;
  objectType: ObjectType;

  vertices: Vertex[];
  indices: number[];
  vertexBuffer: PolyfillBuffer;
  indexBuffer: PolyfillBuffer;
  bindGroup: PolyfillBindGroup;
  groupBindGroup: PolyfillBindGroup;
  transform: Transform;
  groupTransform: Transform;
  currentSequenceId: string;

  // Required video child
  videoChild: StVideo | null = null;
  videoChildConfig: StVideoConfig;

  tiltAngle: number = 45;

  constructor(
    windowSize: WindowSize,
    device: PolyfillDevice,
    queue: PolyfillQueue,
    bindGroupLayout: PolyfillBindGroupLayout,
    groupBindGroupLayout: PolyfillBindGroupLayout,
    camera: Camera,
    config: Mockup3DConfig,
    currentSequenceId: string
  ) {
    this.id = config.id;
    this.name = config.name;
    this.dimensions = config.dimensions;
    let position = {
      x: CANVAS_HORIZ_OFFSET + config.position.x,
      y: CANVAS_VERT_OFFSET + config.position.y,
    };
    let rotation = config.rotation;
    this.backgroundFill = config.backgroundFill;
    this.layer = config.layer;
    this.hidden = false;
    this.objectType = ObjectType.Mockup3D;
    this.currentSequenceId = currentSequenceId;
    this.videoChildConfig = config.videoChild;

    // Generate laptop mockup geometry
    const [vertices, indices] = this.generateLaptopGeometry();
    this.vertices = vertices;
    this.indices = indices;

    // Create vertex buffer
    this.vertexBuffer = device.createBuffer(
      {
        label: "Mockup3D Vertex Buffer",
        size: vertices.length * vertexByteSize,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );

    const vertexData = new Float32Array(vertices.length * (3 + 2 + 4 + 2 + 1));
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 0] = v.position[0];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 1] = v.position[1];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 2] = v.position[2];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 3] = v.tex_coords[0];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 4] = v.tex_coords[1];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 5] = v.color[0];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 6] = v.color[1];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 7] = v.color[2];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 8] = v.color[3];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 9] = v.gradient_coords[0];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 10] = v.gradient_coords[1];
      vertexData[i * (3 + 2 + 4 + 2 + 1) + 11] = v.object_type;
    }

    queue.writeBuffer(this.vertexBuffer, 0, vertexData.buffer);

    // Create index buffer
    this.indexBuffer = device.createBuffer(
      {
        label: "Mockup3D Index Buffer",
        size: indices.length * Uint32Array.BYTES_PER_ELEMENT,
        usage:
          process.env.NODE_ENV === "test"
            ? 0
            : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      },
      ""
    );
    queue.writeBuffer(this.indexBuffer, 0, new Uint32Array(indices).buffer);

    // Create uniform buffer
    const emptyMatrix = mat4.create();
    const rawMatrix = matrix4ToRawArray(emptyMatrix);

    const uniformBuffer = device.createBuffer(
      {
        label: "Mockup3D Uniform Buffer",
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

    // Create texture
    const textureSize = { width: 1, height: 1, depthOrArrayLayers: 1 };
    const texture = device.createTexture({
      label: "Mockup3D Texture",
      size: textureSize,
      format: "rgba8unorm",
      usage:
        process.env.NODE_ENV === "test"
          ? 0
          : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    queue.writeTexture(
      {
        texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 },
      },
      whitePixel,
      { offset: 0, bytesPerRow: 4, rowsPerImage: undefined },
      textureSize
    );

    // Setup gradient
    let [gradient, gradientBuffer] = setupGradientBuffers(
      device,
      queue,
      config.backgroundFill.type === "Gradient"
        ? config.backgroundFill.value
        : null
    );

    // Create bind group
    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          groupIndex: 1,
          resource: {
            pbuffer: uniformBuffer,
          },
        },
        { binding: 1, groupIndex: 1, resource: texture },
        {
          binding: 0,
          groupIndex: 2,
          resource: {
            pbuffer: gradientBuffer,
          },
        },
      ],
    });

    // Create group transform (parent transform for the entire mockup)
    let [mockupGroupBindGroup, mockupGroupTransform] =
      createEmptyGroupTransform(device, groupBindGroupLayout, windowSize);
    this.groupBindGroup = mockupGroupBindGroup;
    this.groupTransform = mockupGroupTransform;

    // Setup group transform with position and rotation
    this.groupTransform.updatePosition([position.x, position.y], windowSize);
    this.groupTransform.updateRotationXDegrees(rotation[0] * 0.01);
    this.groupTransform.updateRotationYDegrees(rotation[1] * 0.01);
    this.groupTransform.updateRotationDegrees(rotation[2] * 0.01);
    // this.groupTransform.layer = (getZLayer(config.layer) as number) - 0.5;
    this.groupTransform.updateUniformBuffer(queue, camera.windowSize);

    // Create local transform (relative to group, stays at origin)
    this.transform = new Transform(
      vec2.fromValues(0, 0), // Local position at origin
      0,
      vec2.fromValues(1, 1),
      uniformBuffer
    );
    this.transform.layer = (getZLayer(config.layer) as number) - 3.5;
    this.transform.updateUniformBuffer(queue, camera.windowSize);
  }

  private generateLaptopGeometry(): [Vertex[], number[]] {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const [w, h, d] = this.dimensions;
    const hw = w / 2;
    const hh = h / 2;
    const hd = d / 2;

    // Laptop color scheme (clean, non-branded gray/silver)
    const baseColor: [number, number, number, number] = [0.7, 0.7, 0.75, 1]; // Silver gray for body
    const screenBezelColor: [number, number, number, number] = [
      0.2, 0.2, 0.2, 1,
    ]; // Dark bezel
    const keyboardColor: [number, number, number, number] = [0.3, 0.3, 0.35, 1]; // Dark keyboard area
    const trackpadColor: [number, number, number, number] = [0.5, 0.5, 0.55, 1]; // Lighter trackpad
    const hingeColor: [number, number, number, number] = [0.4, 0.4, 0.45, 1]; // Darker hinge

    // Laptop base (keyboard section)
    // The base is a thin rectangular box
    const baseThickness = d * 0.1; // 10% of depth for base thickness
    const baseVertices: [number, number, number][] = [
      // Top surface (keyboard area)
      [-hw, -hh, baseThickness], // 0
      [hw, -hh, baseThickness], // 1
      [hw, hh * 0.5, baseThickness], // 2 - shorter in Y
      [-hw, hh * 0.5, baseThickness], // 3
      // Bottom surface
      [-hw, -hh, 0], // 4
      [hw, -hh, 0], // 5
      [hw, hh * 0.5, 0], // 6
      [-hw, hh * 0.5, 0], // 7
    ];

    // Add base vertices
    const startIndex = vertices.length;
    const baseFaces = [
      { indices: [0, 1, 2, 0, 2, 3], color: keyboardColor }, // Top (keyboard)
      { indices: [5, 4, 7, 5, 7, 6], color: baseColor }, // Bottom
      { indices: [4, 5, 1, 4, 1, 0], color: baseColor }, // Front
      { indices: [3, 2, 6, 3, 6, 7], color: baseColor }, // Back (hinge area)
      { indices: [1, 5, 6, 1, 6, 2], color: baseColor }, // Right
      { indices: [4, 0, 3, 4, 3, 7], color: baseColor }, // Left
    ];

    for (const face of baseFaces) {
      const faceStart = vertices.length;
      for (const idx of face.indices) {
        const pos = baseVertices[idx];
        vertices.push({
          position: pos,
          tex_coords: [0, 0],
          color: face.color,
          gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
          object_type: 8, // Mockup3D object type
        });
      }
      // Add indices
      indices.push(
        faceStart,
        faceStart + 1,
        faceStart + 2,
        faceStart + 3,
        faceStart + 4,
        faceStart + 5
      );
    }

    // Add trackpad on keyboard surface
    const trackpadWidth = w * 0.25;
    const trackpadHeight = h * 0.5 * 0.3; // 30% of base height
    const trackpadX = 0; // Centered
    const trackpadY = -hh * 0.3; // Lower part of base
    const trackpadZ = baseThickness + 0.001; // Slightly raised

    const trackpadVertices: [number, number, number][] = [
      [
        trackpadX - trackpadWidth / 2,
        trackpadY - trackpadHeight / 2,
        trackpadZ,
      ],
      [
        trackpadX + trackpadWidth / 2,
        trackpadY - trackpadHeight / 2,
        trackpadZ,
      ],
      [
        trackpadX + trackpadWidth / 2,
        trackpadY + trackpadHeight / 2,
        trackpadZ,
      ],
      [
        trackpadX - trackpadWidth / 2,
        trackpadY + trackpadHeight / 2,
        trackpadZ,
      ],
    ];

    const trackpadStart = vertices.length;
    for (const pos of trackpadVertices) {
      vertices.push({
        position: pos,
        tex_coords: [0, 0],
        color: trackpadColor,
        gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
        object_type: 8,
      });
    }
    indices.push(
      trackpadStart,
      trackpadStart + 1,
      trackpadStart + 2,
      trackpadStart,
      trackpadStart + 2,
      trackpadStart + 3
    );

    // Add keyboard keys pattern
    const keyColor: [number, number, number, number] = [0.15, 0.15, 0.18, 1]; // Dark keys
    const keyWidth = w * 0.045;
    const keyHeight = h * 0.5 * 0.06;
    const keySpacingX = keyWidth * 1.15;
    const keySpacingY = keyHeight * 1.2;
    const keyboardStartX = -hw * 0.65;
    const keyboardStartY = hh * 0.05;
    const keyZ = baseThickness + 0.002;
    const numRows = 4;
    const numCols = 13;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const keyX = keyboardStartX + col * keySpacingX;
        const keyY = keyboardStartY + row * keySpacingY;

        const keyVerts: [number, number, number][] = [
          [keyX - keyWidth / 2, keyY - keyHeight / 2, keyZ],
          [keyX + keyWidth / 2, keyY - keyHeight / 2, keyZ],
          [keyX + keyWidth / 2, keyY + keyHeight / 2, keyZ],
          [keyX - keyWidth / 2, keyY + keyHeight / 2, keyZ],
        ];

        const keyStart = vertices.length;
        for (const pos of keyVerts) {
          vertices.push({
            position: pos,
            tex_coords: [0, 0],
            color: keyColor,
            gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
            object_type: 8,
          });
        }
        indices.push(
          keyStart,
          keyStart + 1,
          keyStart + 2,
          keyStart,
          keyStart + 2,
          keyStart + 3
        );
      }
    }

    // Add spacebar (wider key at bottom)
    const spacebarWidth = keyWidth * 5;
    const spacebarX = 0;
    const spacebarY = keyboardStartY + numRows * keySpacingY;
    const spacebarVerts: [number, number, number][] = [
      [spacebarX - spacebarWidth / 2, spacebarY - keyHeight / 2, keyZ],
      [spacebarX + spacebarWidth / 2, spacebarY - keyHeight / 2, keyZ],
      [spacebarX + spacebarWidth / 2, spacebarY + keyHeight / 2, keyZ],
      [spacebarX - spacebarWidth / 2, spacebarY + keyHeight / 2, keyZ],
    ];

    const spacebarStart = vertices.length;
    for (const pos of spacebarVerts) {
      vertices.push({
        position: pos,
        tex_coords: [0, 0],
        color: keyColor,
        gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
        object_type: 8,
      });
    }
    indices.push(
      spacebarStart,
      spacebarStart + 1,
      spacebarStart + 2,
      spacebarStart,
      spacebarStart + 2,
      spacebarStart + 3
    );

    // Add hinge detail between base and screen
    const hingeWidth = w * 0.95;
    const hingeHeight = h * 0.02;
    const hingeY = hh * 0.5; // Where base ends
    const hingeThickness = baseThickness * 0.5;

    const hingeVertices: [number, number, number][] = [
      // Top surface
      [-hingeWidth / 2, hingeY - hingeHeight / 2, baseThickness],
      [hingeWidth / 2, hingeY - hingeHeight / 2, baseThickness],
      [hingeWidth / 2, hingeY + hingeHeight / 2, baseThickness],
      [-hingeWidth / 2, hingeY + hingeHeight / 2, baseThickness],
      // Bottom surface
      [
        -hingeWidth / 2,
        hingeY - hingeHeight / 2,
        baseThickness + hingeThickness,
      ],
      [
        hingeWidth / 2,
        hingeY - hingeHeight / 2,
        baseThickness + hingeThickness,
      ],
      [
        hingeWidth / 2,
        hingeY + hingeHeight / 2,
        baseThickness + hingeThickness,
      ],
      [
        -hingeWidth / 2,
        hingeY + hingeHeight / 2,
        baseThickness + hingeThickness,
      ],
    ];

    const hingeFaces = [
      { indices: [0, 1, 2, 0, 2, 3], color: hingeColor }, // Top
      { indices: [5, 4, 7, 5, 7, 6], color: hingeColor }, // Bottom
      { indices: [4, 5, 1, 4, 1, 0], color: hingeColor }, // Front
      { indices: [3, 2, 6, 3, 6, 7], color: hingeColor }, // Back
      { indices: [1, 5, 6, 1, 6, 2], color: hingeColor }, // Right
      { indices: [4, 0, 3, 4, 3, 7], color: hingeColor }, // Left
    ];

    for (const face of hingeFaces) {
      const faceStart = vertices.length;
      for (const idx of face.indices) {
        const pos = hingeVertices[idx];
        vertices.push({
          position: pos,
          tex_coords: [0, 0],
          color: face.color,
          gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
          object_type: 8,
        });
      }
      indices.push(
        faceStart,
        faceStart + 1,
        faceStart + 2,
        faceStart + 3,
        faceStart + 4,
        faceStart + 5
      );
    }

    // Screen section (lid)
    // The screen is angled back from the base
    const screenHeight = h * 0.6; // 60% of total height for screen
    const screenThickness = d * 0.05; // Thin screen

    // Screen tilted back at ~105 degrees (common laptop angle)
    const tiltAngle = this.tiltAngle * (Math.PI / 180); // 15 degrees back from vertical
    const screenTop = hingeY + screenHeight * Math.cos(tiltAngle);
    const screenTopZ = baseThickness + screenHeight * Math.sin(tiltAngle);

    // Screen bezel (outer frame)
    const bezelThickness = screenThickness;
    const screenBezelVertices: [number, number, number][] = [
      // Front face (bezel)
      [-hw, hingeY, baseThickness], // 0 - bottom left
      [hw, hingeY, baseThickness], // 1 - bottom right
      [hw, screenTop, screenTopZ], // 2 - top right
      [-hw, screenTop, screenTopZ], // 3 - top left
      // Back face
      [-hw, hingeY, baseThickness + bezelThickness], // 4
      [hw, hingeY, baseThickness + bezelThickness], // 5
      [hw, screenTop, screenTopZ + bezelThickness], // 6
      [-hw, screenTop, screenTopZ + bezelThickness], // 7
    ];

    // Add screen bezel faces
    const bezelFaces = [
      { indices: [0, 1, 2, 0, 2, 3], color: screenBezelColor }, // Front bezel
      { indices: [5, 4, 7, 5, 7, 6], color: baseColor }, // Back
      { indices: [4, 5, 1, 4, 1, 0], color: baseColor }, // Bottom (hinge)
      { indices: [3, 2, 6, 3, 6, 7], color: baseColor }, // Top
      { indices: [1, 5, 6, 1, 6, 2], color: baseColor }, // Right
      { indices: [4, 0, 3, 4, 3, 7], color: baseColor }, // Left
    ];

    for (const face of bezelFaces) {
      const faceStart = vertices.length;
      for (const idx of face.indices) {
        const pos = screenBezelVertices[idx];
        vertices.push({
          position: pos,
          tex_coords: [0, 0],
          color: face.color,
          gradient_coords: [(pos[0] + hw) / w, (pos[1] + hh) / h],
          object_type: 8,
        });
      }
      indices.push(
        faceStart,
        faceStart + 1,
        faceStart + 2,
        faceStart + 3,
        faceStart + 4,
        faceStart + 5
      );
    }

    return [vertices, indices];
  }

  // Get the screen area bounds for positioning the video child (relative to mockup center)
  getScreenBounds(): {
    position: Point;
    dimensions: [number, number];
    rotation: [number, number, number];
  } {
    const [w, h, d] = this.dimensions;
    const screenHeight = h * 0.6;
    const screenWidth = w * 0.85; // Inset from bezel
    const hingeY = (h * 0.5) / 2;
    const tiltAngle = this.tiltAngle;

    // Calculate screen center position RELATIVE to mockup center
    const screenCenterY =
      hingeY + (screenHeight * Math.cos((tiltAngle * Math.PI) / 180)) / 2;

    return {
      position: {
        x: 0, // Centered horizontally relative to mockup
        y: screenCenterY - 200, // Offset vertically relative to mockup center
      },
      dimensions: [screenWidth, screenHeight * 0.9],
      rotation: [
        degreesToRadians(tiltAngle), // Just the tilt angle, parent rotation handled by group transform
        0, // No additional Y rotation
        0, // No additional Z rotation
      ],
    };
  }

  updateOpacity(queue: PolyfillQueue, opacity: number) {
    let new_color: [number, number, number, number] = [1, 1, 1, opacity];
    if (this.backgroundFill.type === "Gradient") {
      let firstStop = this.backgroundFill.value.stops[0];
      new_color = [
        firstStop.color[0],
        firstStop.color[1],
        firstStop.color[2],
        opacity,
      ];
    } else if (this.backgroundFill.type === "Color") {
      new_color = [
        this.backgroundFill.value[0],
        this.backgroundFill.value[1],
        this.backgroundFill.value[2],
        opacity,
      ];
    }

    this.vertices.forEach((v) => {
      // Preserve original color ratios, just update alpha
      const ratio =
        v.color[0] > 0 ? v.color[0] : v.color[1] > 0 ? v.color[1] : v.color[2];
      v.color = [v.color[0], v.color[1], v.color[2], opacity];
    });

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

  updateLayer(layer: number) {
    let layer_index = getZLayer(layer);
    this.layer = layer;
    this.groupTransform.layer = layer_index as number;
  }

  toConfig(): Mockup3DConfig {
    return {
      id: this.id,
      name: this.name,
      dimensions: this.dimensions,
      position: {
        x: this.groupTransform.position[0] - CANVAS_HORIZ_OFFSET,
        y: this.groupTransform.position[1] - CANVAS_VERT_OFFSET,
      },
      rotation: [
        this.groupTransform.rotationX,
        this.groupTransform.rotationY,
        this.groupTransform.rotation,
      ],
      backgroundFill: this.backgroundFill,
      layer: this.layer,
      videoChild: this.videoChildConfig,
    };
  }

  toSavedConfig(): SavedMockup3DConfig {
    return this.toConfig();
  }

  containsPoint(point: Point, windowSize: WindowSize): boolean {
    // Simple bounding box check for 3D mockup projected to 2D
    const [w, h] = this.videoChild!.dimensions; // small values like 0.5, 1, or 2 (made ofr NDC, but of course dimensions to go negative)
    let x = this.groupTransform.position[0]; // large world values like 100, 200
    let y = this.groupTransform.position[1];

    return (
      point.x >= x - w / 2 &&
      point.x <= x + w / 2 &&
      point.y >= y - h / 2 &&
      point.y <= y + h / 2
    );
  }

  // containsPoint(point: Point, windowSize: WindowSize): boolean {
  //   // 1. Get the Inverse World Transform Matrix
  //   const invMatrix = this.groupTransform.getInverseWorldMatrix(windowSize);

  //   // 2. Transform the World Point into the Object's Local Space
  //   // localPoint is now relative to the object's center (0, 0)
  //   const localPoint = this.groupTransform.transformPoint(point, invMatrix);

  //   // 3. Simple bounding box check in Local Space
  //   const [w, h] = this.dimensions; // Small local/NDC values like 0.5, 1, or 2

  //   return (
  //     localPoint.x >= -w / 2 &&
  //     localPoint.x <= w / 2 &&
  //     localPoint.y >= -h / 2 &&
  //     localPoint.y <= h / 2
  //   );
  // }

  // Update video child transform to position it relative to the laptop screen
  updateVideoChildTransform(queue: PolyfillQueue, windowSize: WindowSize) {
    if (!this.videoChild) return;

    const screenBounds = this.getScreenBounds();

    // Update video's groupTransform (not shared, it has its own) to include:
    // - Mockup's world position + screen offset
    // - Mockup's rotation + screen tilt
    this.videoChild.transform.updatePosition(
      [screenBounds.position.x, screenBounds.position.y],
      windowSize
    );

    // Apply the screen tilt angle combined with mockup rotation
    // this.videoChild.groupTransform.updateRotationX(
    //   this.groupTransform.rotationX + screenBounds.rotation[0]
    // );
    // this.videoChild.groupTransform.updateRotationY(
    //   this.groupTransform.rotationY
    // );
    // this.videoChild.groupTransform.updateRotation(this.groupTransform.rotation);

    this.videoChild.transform.updateRotationX(screenBounds.rotation[0] * -0.01);

    // Update the video's group transform buffer
    this.videoChild.transform.updateUniformBuffer(queue, windowSize);
  }
}
