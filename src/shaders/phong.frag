#version 300 es
precision mediump float;
#define MAX_LIGHTS 16

in vec3 vColor;
in vec3 vPosition;
in vec3 vNormal;

out vec4 fragColor;

const int LIGHT_POINT = 0;
const int LIGHT_SPOT = 1;
const int LIGHT_DIRECTIONAL = 2;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    int type;
    // for spotlights & directional lights
    vec3 direction;
    // for spotlight
    float spotCutoff;
    float spotExponent;
    // light attenuation
    float attA;
    float attB;
    float attC;
};

struct Material {
    vec3 ka;
    vec3 kd;
    vec3 ks;
    float specularExp;
    float alpha;
};

uniform Light uLights[MAX_LIGHTS];
uniform Material mat;
uniform int uLightCount;

// given the Light source, calculate the contribution
// ambient light has 
vec3 ambient() {
    return mat.ka * vColor;
}

// calculate the overall phong lighting value for one light
vec3 phongShading(Light l) {
    vec3 N = normalize(vNormal);
    vec3 L;
    float fatt = 1.f;

    if(l.type == LIGHT_POINT) {
        L = l.position - vPosition;
        float d = length(L);
        L = normalize(L);
        fatt = 1.0f / (l.attA + l.attB * d + l.attC * d * d);
    } else {
        if(l.type == LIGHT_DIRECTIONAL) {
            L = normalize(-l.direction);
        } else {

        }
    }

    vec3 V = normalize(-vPosition);
    vec3 R = reflect(-L, N);

    float diff = max(dot(N, L), 0.0f);
    float spec = pow(max(dot(V, R), 0.0f), mat.specularExp);

    return fatt * l.intensity * l.color * vec3(mat.kd * diff + mat.ks * spec);
}

void main() {
    // ambient only calcuated once
    vec3 totalColor = ambient();

    // seesm like length of the array is alwasy the max i defined
    // so probably need to pass through a count uniform?
    for(int i = 0; i < uLightCount; i++) {
        totalColor += phongShading(uLights[i]);
    }

    fragColor = vec4(totalColor, mat.alpha);
}