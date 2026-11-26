#version 300 es
precision highp float;

in vec2 vUV;
uniform sampler2D u_sceneTexture;

out vec4 outColor;

void main() {
    outColor = texture(u_sceneTexture, vUV);
}