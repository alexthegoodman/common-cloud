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
    @location(3) @interpolate(flat) object_type: u32,  // Using flat interpolation for the type flag
};

struct GradientStop {
    offset: f32,
    color: vec4<f32>
};

struct GradientUniforms {
    stops: array<GradientStop, 8>,
    numStops: i32,
    gradientType: i32,
    startPoint: vec2<f32>,
    endPoint: vec2<f32>,
    center: vec2<f32>,
    radius: f32,
    time: f32,
    animationSpeed: f32
};

// @group(1) @binding(0) var<uniform> gradient: GradientUniforms;
@group(1) @binding(1) var texture: texture_2d<f32>;
@group(1) @binding(2) var texture_sampler: sampler;
@group(4) @binding(0) var<uniform> gradient: GradientUniforms;

const OBJECT_TYPE_POLYGON: u32 = 0u;
const OBJECT_TYPE_TEXT: u32 = 1u;
const OBJECT_TYPE_IMAGE: u32 = 2u;
const OBJECT_TYPE_VIDEO: u32 = 3u;

fn calculateGradientColor(coords: vec2<f32>) -> vec4<f32> {
    var t: f32;
    
    if (gradient.gradientType == 0) {
        // Linear gradient
        let gradientVector = gradient.endPoint - gradient.startPoint;
        let rotatedVector = vec2<f32>(
            gradientVector.x * cos(gradient.time * gradient.animationSpeed) - 
            gradientVector.y * sin(gradient.time * gradient.animationSpeed),
            gradientVector.x * sin(gradient.time * gradient.animationSpeed) + 
            gradientVector.y * cos(gradient.time * gradient.animationSpeed)
        );
        let projectedPoint = dot(coords - gradient.startPoint, normalize(rotatedVector));
        t = clamp(projectedPoint / length(gradientVector), 0.0, 1.0);
    } else {
        // Radial gradient
        let distance = length(coords - gradient.center);
        t = clamp(distance / gradient.radius, 0.0, 1.0);
    }

    // Find the appropriate color stops
    var color1: vec4<f32>;
    var color2: vec4<f32>;
    var offset1: f32;
    var offset2: f32;

    for (var i = 0; i < gradient.numStops - 1; i++) {
        if (t >= gradient.stops[i].offset && t <= gradient.stops[i + 1].offset) {
            color1 = gradient.stops[i].color;
            color2 = gradient.stops[i + 1].color;
            offset1 = gradient.stops[i].offset;
            offset2 = gradient.stops[i + 1].offset;
            break;
        }
    }

    // Interpolate between the two colors
    let mix = (t - offset1) / (offset2 - offset1);
    return mix * color2 + (1.0 - mix) * color1;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    var final_color: vec4<f32>;
    
    switch in.object_type {
        case OBJECT_TYPE_POLYGON: {
            if (gradient.numStops > 0) {
                // Use gradient if defined
                final_color = calculateGradientColor(in.gradient_coords);
            } else {
                // Fall back to solid color
                final_color = in.color;
            }
        }
        case OBJECT_TYPE_TEXT, case OBJECT_TYPE_IMAGE, case OBJECT_TYPE_VIDEO: {
            let tex_color = textureSample(texture, texture_sampler, in.tex_coords);
            final_color = tex_color * in.color;
        }
        default: {
            final_color = in.color;
        }
    }
    
    return final_color;
}