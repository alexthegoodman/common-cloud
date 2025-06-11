#version 300 es
precision highp float;
precision highp int;

in vec2 v_tex_coords;
in vec4 v_color;
in vec2 v_gradient_coords;
flat in uint v_object_type;

out vec4 fragColor;

uniform sampler2D u_texture;

uniform vec4 u_stop_offsets[2];    // vec4 * 2 = 8 floats
uniform vec4 u_stop_colors[8];     // 8 color stops
uniform float u_num_stops;
uniform float u_gradient_type;     // 0 = linear, 1 = radial
uniform vec2 u_start_point;
uniform vec2 u_end_point;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_time;
uniform float u_animation_speed;
uniform float u_enabled;

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
    return texture(u_texture, tex_coords);
}

void main() {
    vec4 tex_color = getTextureColor(v_tex_coords);
    vec4 final_color;

    if (v_object_type == 0u) {
        if (u_enabled > 0.5 && u_num_stops > 0.5) {
            final_color = calculateGradientColor(v_gradient_coords);
        } else {
            final_color = v_color;
        }
    } else {
        final_color = tex_color * v_color;
    }

    fragColor = final_color;
}
