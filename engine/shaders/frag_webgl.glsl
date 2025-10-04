#version 300 es
precision highp float;
precision highp int;

in vec2 v_tex_coords;
in vec4 v_color;
in vec2 v_gradient_coords;
flat in float v_object_type;

out vec4 fragColor;

// Bind group 1: Texture sampler
uniform sampler2D bindGroup1_1;

// Bind group 2: Gradient uniforms
layout(std140) uniform bindGroup2_0 {
    vec4 u_stop_offsets[2];      // vec4 * 2 = 8 floats
    vec4 u_stop_colors[8];       // 8 color stops
    float u_num_stops;
    float u_gradient_type;       // 0 = linear, 1 = radial
    vec2 u_start_point;
    vec2 u_end_point;
    vec2 u_center;
    float u_radius;
    float u_time;
    float u_animation_speed;
    float u_enabled;
    float u_border_radius;
};

// Brush parameters (will use same uniform block, reusing unused fields for brushes)
// When v_object_type == 4u (brush), interpret fields as:
// u_num_stops = brushType (0=Noise, 1=Dots, 2=Lines, 3=Voronoi)
// u_gradient_type = noiseScale
// u_start_point.x = octaves
// u_start_point.y = persistence
// u_end_point.x = randomSeed
// u_end_point.y = dotDensity / lineAngle / cellSize
// u_center = lineSpacing (for lines brush)

float getOffset(int index) {
    int vec4_index = index / 4;
    int component_index = index % 4;
    if (component_index == 0) return u_stop_offsets[vec4_index].x;
    else if (component_index == 1) return u_stop_offsets[vec4_index].y;
    else if (component_index == 2) return u_stop_offsets[vec4_index].z;
    else return u_stop_offsets[vec4_index].w;
}

vec4 calculateGradientColor(vec2 coords) {
    float t;
    if (u_gradient_type < 0.5) {
        vec2 gradientVector = u_end_point - u_start_point;
        float currentTime = u_time * u_animation_speed;

        vec2 rotatedVector = vec2(
            gradientVector.x * cos(currentTime) - gradientVector.y * sin(currentTime),
            gradientVector.x * sin(currentTime) + gradientVector.y * cos(currentTime)
        );

        float projectedPoint = dot(coords - u_start_point, normalize(rotatedVector));
        t = clamp(projectedPoint / length(gradientVector), 0.0, 1.0);
    } else {
        float distance = length(coords - u_center);
        t = clamp(distance / u_radius, 0.0, 1.0);
    }

    vec4 color1 = u_stop_colors[0];
    vec4 color2 = u_stop_colors[0];
    float offset1 = getOffset(0);
    float offset2 = getOffset(0);

    for (int i = 0; i < int(u_num_stops) - 1; i++) {
        float curr_offset = getOffset(i);
        float next_offset = getOffset(i + 1);
        if (t >= curr_offset && t <= next_offset) {
            color1 = u_stop_colors[i];
            color2 = u_stop_colors[i + 1];
            offset1 = curr_offset;
            offset2 = next_offset;
            break;
        }
    }

    float mixVal = (t - offset1) / max((offset2 - offset1), 0.0001);
    return mix(color1, color2, mixVal);
}

vec4 getTextureColor(vec2 tex_coords) {
    return texture(bindGroup1_1, tex_coords);
}

// ============ BRUSH PROCEDURAL FUNCTIONS ============

// Pseudo-random function
float random(vec2 st, float seed) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + seed) * 43758.5453123);
}

// 2D Noise function (value noise)
float noise(vec2 st, float seed) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i, seed);
    float b = random(i + vec2(1.0, 0.0), seed);
    float c = random(i + vec2(0.0, 1.0), seed);
    float d = random(i + vec2(1.0, 1.0), seed);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion
float fbm(vec2 st, int octaves, float persistence, float seed) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(st * frequency, seed);
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2.0;
    }

    return value / maxValue;
}

// Voronoi cell pattern
float voronoi(vec2 st, float cellSize, float seed) {
    vec2 scaledSt = st / cellSize;
    vec2 i_st = floor(scaledSt);
    vec2 f_st = fract(scaledSt);

    float minDist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = vec2(
                random(i_st + neighbor, seed),
                random(i_st + neighbor + vec2(0.1, 0.1), seed)
            );
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }

    return minDist;
}

// Dot pattern (halftone style)
float dotPattern(vec2 st, float density) {
    vec2 scaledSt = st * density;
    vec2 gridPos = fract(scaledSt);
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(gridPos, center);

    return smoothstep(0.4, 0.3, dist);
}

// Line pattern (hatching style)
float linePattern(vec2 st, float angle, float spacing) {
    float cosAngle = cos(angle);
    float sinAngle = sin(angle);
    vec2 rotated = vec2(
        st.x * cosAngle - st.y * sinAngle,
        st.x * sinAngle + st.y * cosAngle
    );

    float scaledY = rotated.y * spacing;
    float linePos = fract(scaledY);

    return smoothstep(0.45, 0.55, linePos);
}

// Calculate procedural brush color
vec4 calculateBrushColor(vec2 worldPos) {
    // Decode brush parameters from gradient uniform block
    float brushType = u_num_stops;
    float noiseScale = u_gradient_type;
    int octaves = int(u_start_point.x);
    float persistence = u_start_point.y;
    float randomSeed = u_end_point.x;
    float param1 = u_end_point.y; // dotDensity / lineAngle / cellSize
    float param2 = u_center.x; // lineSpacing

    vec2 uv = worldPos * noiseScale;
    float proceduralValue = 1.0;

    if (brushType > 0.5 && brushType < 1.5) {
        // Noise brush
        proceduralValue = fbm(uv, octaves, persistence, randomSeed);
    } else if (brushType > 1.5 && brushType < 2.5) {
        // Dots brush
        proceduralValue = dotPattern(uv, param1);
    } else if (brushType > 2.5 && brushType < 3.5) {
        // Lines brush
        proceduralValue = linePattern(uv, param1, param2);
    } else if (brushType > 3.5 && brushType < 4.5) {
        // Voronoi brush
        proceduralValue = voronoi(uv, param1, randomSeed);
    }

    return vec4(vec3(1.0), proceduralValue);
}

void main() {
    vec4 tex_color = getTextureColor(v_tex_coords);
    vec4 final_color;

    if (v_object_type < 0.5) {
        // Polygon with optional gradient
        if (u_enabled > 0.5 && u_num_stops > 0.5) {
            final_color = calculateGradientColor(v_gradient_coords);
        } else {
            final_color = v_color;
        }
    } else if (v_object_type > 3.5 && v_object_type < 4.5) {
        // Brush with procedural texture
        vec4 proceduralColor = calculateBrushColor(v_gradient_coords);
        final_color = proceduralColor;
        // final_color = v_color * proceduralColor;
        // final_color = vec4(0.0,1.0,0.0,1.0);
    } else {
        // Image/Video/Text with texture
        final_color = tex_color * v_color;
    }

    // Apply border radius for images (2) and videos (3)
    if ((v_object_type > 1.5 && v_object_type < 2.5) || (v_object_type > 2.5 && v_object_type < 3.5)) {
    // if (v_object_type != 0u) {
        if (u_border_radius > 0.0) {
            // Convert tex_coords from [0,1] to [-0.5, 0.5] range
            vec2 pos = v_tex_coords - vec2(0.5);

            // Calculate distance from the edge of the rectangle
            vec2 d = abs(pos) - vec2(0.5 - u_border_radius);

            // Calculate rounded rectangle SDF
            float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - u_border_radius;

            // Create smooth alpha based on distance
            float alpha = 1.0 - smoothstep(-0.001, 0.001, dist);

            // Apply alpha to final color
            final_color.a *= alpha;
        }
    }

    // testing
    // final_color = v_color;

    fragColor = final_color;
}