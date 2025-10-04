// @group(1) @binding(1) var texture: texture_2d<f32>;
// @group(1) @binding(2) var texture_sampler: sampler;

// struct FragmentInput {
//     @location(0) tex_coords: vec2<f32>,
//     @location(1) color: vec4<f32>,
// };

// @fragment
// fn fs_main(in: FragmentInput) -> @location(0) vec4<f32> {
//     let tex_color = textureSample(texture, texture_sampler, in.tex_coords);
//     return tex_color * in.color;
// }

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) tex_coords: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) gradient_coords: vec2<f32>,
    @location(3) @interpolate(flat) object_type: u32,
};

// Pack offsets into vec4s for alignment
struct GradientUniforms {
    // Stop offsets packed into vec4s (2 vec4s for 8 values)
    stop_offsets: array<vec4<f32>, 2>,
    // Stop colors (8 vec4s)
    stop_colors: array<vec4<f32>, 8>,
    // Configuration
    num_stops: f32,
    gradient_type: f32,  // 0 for linear, 1 for radial
    start_point: vec2<f32>,
    end_point: vec2<f32>,
    center: vec2<f32>,
    radius: f32,
    time: f32,
    animation_speed: f32,
    enabled: f32,
    border_radius: f32,
}

@group(1) @binding(1) var texture: texture_2d<f32>;
@group(1) @binding(2) var texture_sampler: sampler;
@group(1) @binding(3) var<uniform> gradient: GradientUniforms;

// Helper function to get offset at index
fn getOffset(index: i32) -> f32 {
    let vec4_index = index / 4;
    let component_index = index % 4;
    switch component_index {
        case 0: { return gradient.stop_offsets[vec4_index].x; }
        case 1: { return gradient.stop_offsets[vec4_index].y; }
        case 2: { return gradient.stop_offsets[vec4_index].z; }
        default: { return gradient.stop_offsets[vec4_index].w; }
    }
}

fn calculateGradientColor(coords: vec2<f32>) -> vec4<f32> {
    var t: f32;
    
    if (gradient.gradient_type < 0.5) {  // Linear gradient
        let gradientVector = gradient.end_point - gradient.start_point;
        let currentTime = gradient.time * gradient.animation_speed;
        let rotatedVector = vec2<f32>(
            gradientVector.x * cos(currentTime) - gradientVector.y * sin(currentTime),
            gradientVector.x * sin(currentTime) + gradientVector.y * cos(currentTime)
        );
        let projectedPoint = dot(coords - gradient.start_point, normalize(rotatedVector));
        t = clamp(projectedPoint / length(gradientVector), 0.0, 1.0);
    } else {  // Radial gradient
        let distance = length(coords - gradient.center);
        t = clamp(distance / gradient.radius, 0.0, 1.0);
    }

    // Find the appropriate color stops
    var color1: vec4<f32> = gradient.stop_colors[0];
    var color2: vec4<f32> = gradient.stop_colors[0];
    var offset1: f32 = getOffset(0);
    var offset2: f32 = getOffset(0);

    for (var i = 0; i < i32(gradient.num_stops) - 1; i++) {
        let curr_offset = getOffset(i);
        let next_offset = getOffset(i + 1);
        if (t >= curr_offset && t <= next_offset) {
            color1 = gradient.stop_colors[i];
            color2 = gradient.stop_colors[i + 1];
            offset1 = curr_offset;
            offset2 = next_offset;
            break;
        }
    }

    let mix = (t - offset1) / (offset2 - offset1);
    return mix * color2 + (1.0 - mix) * color1;
}

fn getTextureColor(tex_coords: vec2<f32>) -> vec4<f32> {
    return textureSample(texture, texture_sampler, tex_coords);
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let tex_color = getTextureColor(in.tex_coords);

    var final_color: vec4<f32>;

    if (in.object_type == 0u) {  // Polygon
        if (gradient.enabled > 0.5 && gradient.num_stops > 0.5) {
            final_color = calculateGradientColor(in.gradient_coords);
        } else {
            final_color = in.color;
        }
    } else {
        final_color = tex_color * in.color;
    }

    // Apply border radius for images (2) and videos (3)
    if (in.object_type == 2u || in.object_type == 3u) {
        if (gradient.border_radius > 0.0) {
            // Convert tex_coords from [0,1] to [-0.5, 0.5] range
            let pos = in.tex_coords - vec2<f32>(0.5);

            // Calculate distance from the edge of the rectangle
            let d = abs(pos) - vec2<f32>(0.5 - gradient.border_radius);

            // Calculate rounded rectangle SDF
            let dist = length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0) - gradient.border_radius;

            // Create smooth alpha based on distance
            let alpha = 1.0 - smoothstep(-0.001, 0.001, dist);

            // Apply alpha to final color
            final_color = vec4<f32>(final_color.rgb, final_color.a * alpha);
        }
    }

    return final_color;
}