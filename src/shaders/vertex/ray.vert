#version 300 es
in vec2 position;

// ray tracing vert code taken from HW7 skeleton
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
