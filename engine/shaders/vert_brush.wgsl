struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
  @location(2) texCoord: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) worldPos: vec2<f32>,
}

struct CameraUniforms {
  viewProjection: mat4x4<f32>,
}

struct ModelUniforms {
  model: mat4x4<f32>,
}

struct GroupUniforms {
  groupPosition: vec2<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(1) @binding(0) var<uniform> modelData: ModelUniforms;
@group(2) @binding(0) var<uniform> groupData: GroupUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Apply model transformation
  let worldPosition = modelData.model * vec4<f32>(input.position, 1.0);

  // Apply group offset
  let offsetPosition = vec4<f32>(
    worldPosition.x + groupData.groupPosition.x,
    worldPosition.y + groupData.groupPosition.y,
    worldPosition.z,
    worldPosition.w
  );

  // Apply camera transformation
  output.position = camera.viewProjection * offsetPosition;
  output.color = input.color;

  // Pass texture coordinates (0-1 range for procedural generation)
  output.texCoord = vec2<f32>(input.texCoord, 0.0);

  // Pass world position for procedural texture generation
  output.worldPos = vec2<f32>(worldPosition.x, worldPosition.y);

  return output;
}
