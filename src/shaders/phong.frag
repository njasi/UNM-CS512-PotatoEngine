#version 300 es
precision mediump float;
#define MAX_LIGHTS 8

in vec3 vColor;
in vec3 vPosition;
in vec3 vNormal;

out vec4 fragColor;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    int type;
    // for spotlights & directional lights
    vec3 direction;
};

struct Material {
    vec3 ka;
    vec3 kd;
    vec3 ks;
    float specularExp;
};

uniform Light uLights[MAX_LIGHTS];
// uniform Material mat;

// placeholder material for until i setup material classes
// Material mat = Material(vec3(0.35f, 0.35f, 0.35f), vec3(0.3f, 0.3f, 0.3f), vec3(0.4f, 0.4f, 0.4f), 16.f);
// Material mat = Material(vec3(0.1, 0.1, 0.1), vec3(0.8, 0.8, 0.8), vec3(0.5, 0.5, 0.5), 32.f);
Material mat = Material(vec3(0.8, 0.8, 0.8), vec3(0.2, 0.2, 0.2), vec3(0.2, 0.2, 0.2), 32.f);

// given the Light source, calculate the contribution
// ambient light has 
vec3 ambient() {
    return mat.ka * vColor;
}

// calculate the overall phong lighting value for one light
vec3 phongShading(Light l) {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(l.position - vPosition);
    vec3 V = normalize(-vPosition);           // camera sits at the origin
    vec3 R = reflect(-L, N);

    float diff = max(dot(N, L), 0.0f);
    float spec = pow(max(dot(V, R), 0.0f), mat.specularExp);

    return vec3(mat.kd * diff + mat.ks * spec);
}

void main() {
    // ambient only calcuated once
    vec3 totalColor = ambient();

    for(int i = 0; i < 1; i++) {
        totalColor += phongShading(uLights[i]);
    }

    fragColor = vec4(totalColor, 1.0f);
}