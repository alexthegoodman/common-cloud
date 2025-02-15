// Type alias to define the vertex data layout for buffer creation
export type VertexData = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

// Helper function to calculate byte size
export const vertexByteSize = (3 + 2 + 4) * Float32Array.BYTES_PER_ELEMENT; // 3 pos, 2 tex, 4 color

export interface Vertex {
  position: [number, number, number]; // x, y, z coordinates
  tex_coords: [number, number]; // u, v coordinates
  color: [number, number, number, number];
}

export function getZLayer(layer: number): number {
  const z = -(layer / 1000.0);
  return z;
}

export function createVertex(
  x: number,
  y: number,
  z: number,
  color: [number, number, number, number]
): Vertex {
  return {
    position: [x, y, z],
    tex_coords: [0.0, 0.0], // Default UV coordinates
    color,
  };
}

export function createVertexBufferLayout(): GPUVertexBufferLayout {
  const vertexSize = Float32Array.BYTES_PER_ELEMENT * (3 + 2 + 4); // Size of each vertex in bytes
  return {
    arrayStride: vertexSize,
    stepMode: "vertex",
    attributes: [
      {
        offset: 0,
        shaderLocation: 0, // Corresponds to layout(location = 0) in shader
        format: "float32x3", // x3 for position
      },
      {
        offset: Float32Array.BYTES_PER_ELEMENT * 3, // Offset after position
        shaderLocation: 1, // Corresponds to layout(location = 1) in shader
        format: "float32x2", // x2 for uv
      },
      {
        offset: Float32Array.BYTES_PER_ELEMENT * 5, // Offset after position and uv
        shaderLocation: 2, // Corresponds to layout(location = 2) in shader
        format: "float32x4", // x4 for color
      },
    ],
  };
}
