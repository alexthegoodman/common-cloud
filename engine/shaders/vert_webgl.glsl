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
    // Apply model and group transforms
    // TODO: if object type is 8 (for 3d mockup) then convert u_group to NDC before calculating world_pos
    // vec4 world_pos = bindGroup1_0 * bindGroup3_0 * vec4(a_position, 1.0);

    mat4 group_transform = bindGroup3_0;

    // if object type is 8 (for 3d mockup) then convert u_group to NDC before calculating world_pos
    if (a_object_type == 8.0) { // For 3D Mockup
        // Convert the translation components (the last column before W) of u_group to NDC.
        // Assumes u_group is an affine transform where the translation is in the 4th column.
        
        // 1. Get the current pixel-based translation from the matrix
        vec4 pixel_translation = group_transform[3]; 

        // 2. Convert the X and Y components of the translation to NDC
        // X: [0, u_window_size.x] -> [-1, 1]
        pixel_translation.x = (pixel_translation.x / bindGroup0_1.x) * 2.0 - 1.0;
        // Y: [0, u_window_size.y] -> [-1, 1], with Y flipped (typical for screen coordinates)
        pixel_translation.y = -((pixel_translation.y / bindGroup0_1.y) * 2.0 - 1.0);
        
        // 3. Store the NDC translation back into the group matrix
        group_transform[3] = pixel_translation;
    }
    
    // Apply model and group transforms
    vec4 world_pos = bindGroup1_0 * group_transform * vec4(a_position, 1.0);

    if (a_object_type != 5.0 && a_object_type != 6.0 && a_object_type != 8.0) { // not 3D cube, sphere, or mockup
        // // Convert XY from pixel coordinates to NDC for positioning
        // // Preserve Z and W for proper 3D projection
        world_pos.x = (world_pos.x / bindGroup0_1.x) * 2.0 - 1.0;
        world_pos.y = -((world_pos.y / bindGroup0_1.y) * 2.0 - 1.0);
        // // world_pos.z and world_pos.w preserved!
    }

    // Apply camera view-projection matrix
    // This handles perspective divide for 3D depth using the W component
    gl_Position = bindGroup0_0 * world_pos;

    v_tex_coords = a_tex_coords;
    v_color = a_color;
    v_gradient_coords = a_gradient_coords;
    v_object_type = a_object_type;
}