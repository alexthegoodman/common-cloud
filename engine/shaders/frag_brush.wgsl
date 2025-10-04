struct FragmentInput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) worldPos: vec2<f32>,
}

struct BrushParams {
  brushType: u32,      // 0=Noise, 1=Dots, 2=Lines, 3=Voronoi, etc.
  noiseScale: f32,
  octaves: u32,
  persistence: f32,
  randomSeed: f32,
  dotDensity: f32,
  lineAngle: f32,
  lineSpacing: f32,
  cellSize: f32,
  _padding: vec3<f32>,  // Padding for alignment
}

@group(3) @binding(0) var<uniform> brushParams: BrushParams;

// Pseudo-random function
fn random(st: vec2<f32>) -> f32 {
  return fract(sin(dot(st.xy, vec2<f32>(12.9898, 78.233)) + brushParams.randomSeed) * 43758.5453123);
}

// 2D Noise function (simple value noise)
fn noise(st: vec2<f32>) -> f32 {
  let i = floor(st);
  let f = fract(st);

  // Four corners
  let a = random(i);
  let b = random(i + vec2<f32>(1.0, 0.0));
  let c = random(i + vec2<f32>(0.0, 1.0));
  let d = random(i + vec2<f32>(1.0, 1.0));

  // Smooth interpolation
  let u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion (multiple octaves of noise)
fn fbm(st: vec2<f32>, octaves: u32, persistence: f32) -> f32 {
  var value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  var maxValue = 0.0;

  for (var i = 0u; i < octaves; i = i + 1u) {
    value += amplitude * noise(st * frequency);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2.0;
  }

  return value / maxValue;
}

// Voronoi cell pattern
fn voronoi(st: vec2<f32>, cellSize: f32) -> f32 {
  let scaledSt = st / cellSize;
  let i_st = floor(scaledSt);
  let f_st = fract(scaledSt);

  var minDist = 1.0;

  for (var y = -1; y <= 1; y = y + 1) {
    for (var x = -1; x <= 1; x = x + 1) {
      let neighbor = vec2<f32>(f32(x), f32(y));
      let point = vec2<f32>(random(i_st + neighbor), random(i_st + neighbor + vec2<f32>(0.1, 0.1)));
      let diff = neighbor + point - f_st;
      let dist = length(diff);
      minDist = min(minDist, dist);
    }
  }

  return minDist;
}

// Dot pattern (halftone style)
fn dotPattern(st: vec2<f32>, density: f32) -> f32 {
  let scaledSt = st * density;
  let gridPos = fract(scaledSt);
  let center = vec2<f32>(0.5, 0.5);
  let dist = distance(gridPos, center);

  // Create dots with smooth edges
  return smoothstep(0.4, 0.3, dist);
}

// Line pattern (hatching style)
fn linePattern(st: vec2<f32>, angle: f32, spacing: f32) -> f32 {
  // Rotate coordinates
  let cosAngle = cos(angle);
  let sinAngle = sin(angle);
  let rotated = vec2<f32>(
    st.x * cosAngle - st.y * sinAngle,
    st.x * sinAngle + st.y * cosAngle
  );

  // Create lines
  let scaledY = rotated.y * spacing;
  let linePos = fract(scaledY);

  return smoothstep(0.45, 0.55, linePos);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  var proceduralColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);

  // Use world position for consistent procedural patterns
  let uv = input.worldPos * brushParams.noiseScale;

  // Select brush type
  switch brushParams.brushType {
    case 0u: { // Noise
      let noiseValue = fbm(uv, brushParams.octaves, brushParams.persistence);
      proceduralColor = vec4<f32>(vec3<f32>(noiseValue), 1.0);
    }
    case 1u: { // Dots
      let dotValue = dotPattern(uv, brushParams.dotDensity);
      proceduralColor = vec4<f32>(vec3<f32>(dotValue), 1.0);
    }
    case 2u: { // Lines
      let lineValue = linePattern(uv, brushParams.lineAngle, brushParams.lineSpacing);
      proceduralColor = vec4<f32>(vec3<f32>(lineValue), 1.0);
    }
    case 3u: { // Voronoi
      let voronoiValue = voronoi(uv, brushParams.cellSize);
      proceduralColor = vec4<f32>(vec3<f32>(voronoiValue), 1.0);
    }
    default: { // Fallback to solid color
      proceduralColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    }
  }

  // Combine procedural pattern with brush color
  let finalColor = input.color * proceduralColor;

  return finalColor;
}
