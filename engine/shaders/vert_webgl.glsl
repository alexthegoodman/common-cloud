#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_tex_coords;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_gradient_coords;
layout(location = 4) in uint a_object_type;

out vec2 v_tex_coords;
out vec4 v_color;
out vec2 v_gradient_coords;
flat out uint v_object_type;

uniform mat4 u_camera_view_proj;
uniform mat4 u_model;
uniform mat4 u_group;
uniform vec2 u_window_size;

void main() {
    vec4 model_pos = u_group * u_model * vec4(a_position, 1.0);

    vec3 ndc_pos = model_pos.xyz;
    ndc_pos.x = (ndc_pos.x / u_window_size.x) * 2.0 - 1.0;
    ndc_pos.y = -((ndc_pos.y / u_window_size.y) * 2.0 - 1.0);

    gl_Position = u_camera_view_proj * vec4(ndc_pos, 1.0);

    v_tex_coords = a_tex_coords;
    v_color = a_color;
    v_gradient_coords = a_gradient_coords;
    v_object_type = a_object_type;
}
