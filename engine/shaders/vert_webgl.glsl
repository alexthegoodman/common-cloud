#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_tex_coords;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_gradient_coords;
layout(location = 4) in float a_object_type;

out vec2 v_tex_coords;
out vec4 v_color;
out vec2 v_gradient_coords;
flat out float v_object_type;

uniform mat4 bindGroup0_0; // u_camera_view_proj
uniform vec2 bindGroup0_1; // u_window_size (changed from mat4 to vec2)
uniform mat4 bindGroup1_0; // u_model
uniform mat4 bindGroup3_0; // u_group

void main() {
    vec4 model_pos = bindGroup1_0 * bindGroup3_0 * vec4(a_position, 1.0);
    
    vec3 ndc_pos = model_pos.xyz;
    // Now use bindGroup0_1 as vec2 for window size
    ndc_pos.x = (ndc_pos.x / bindGroup0_1.x) * 2.0 - 1.0;
    ndc_pos.y = -((ndc_pos.y / bindGroup0_1.y) * 2.0 - 1.0);

    gl_Position = bindGroup0_0 * vec4(ndc_pos, 1.0);

    v_tex_coords = a_tex_coords;
    v_color = a_color;
    v_gradient_coords = a_gradient_coords;
    v_object_type = a_object_type;
}