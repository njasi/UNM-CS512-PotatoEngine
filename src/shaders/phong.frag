#version 300 es
precision mediump float;
#define MAX_LIGHTS 64

in vec3 vColor;
in vec3 vPosition;
in vec3 vNormal;

out vec4 fragColor;

const int LIGHT_POINT = 0;
const int LIGHT_SPOT = 1;
const int LIGHT_DIRECTIONAL = 2;

struct Material {
    vec3 ka;
    vec3 kd;
    vec3 ks;
    float specularExp;
    float alpha;
};

uniform Material mat;

layout(std140) uniform LightBlock {
    // x, y, z, type
    vec4 positionType[MAX_LIGHTS];
    // r, g, b, intensity
    vec4 colorIntensity[MAX_LIGHTS];
    // attA, attB, attC, cutoff
    vec4 attenuationCutoff[MAX_LIGHTS];
    // dirX, dirY, dirZ, spotExponent
    vec4 directionExponent[MAX_LIGHTS];
};
uniform int uLightCount;

// given the Light source, calculate the contribution
// ambient light has 
vec3 ambient() {
    return mat.ka * vColor;
}

// calculate the overall phong lighting value for one light
vec3 phongShading(
    vec3 position,
    vec3 color,
    vec3 direction,
    vec3 attenuation,
    float intensity,
    float cutoff,
    float spotExponent,
    int type
) {
    vec3 N = normalize(vNormal);
    vec3 L;
    float fatt = 1.f;

    if(type == LIGHT_DIRECTIONAL) {
        L = normalize(-direction);
    } else {
        vec3 _L = position - vPosition;
        float d = length(_L);
        L = normalize(_L);
        fatt = 1.0f / (attenuation.x + attenuation.y * d + attenuation.z * d * d);

        if(type == LIGHT_SPOT) {
            float spotCos = dot(normalize(direction), normalize(-_L));
            float cutoffCos = cos(cutoff);

            if(spotCos < cutoffCos) {
                fatt = 0.0f;
            } else {
                fatt *= pow(max(spotCos, 0.0f), spotExponent);
            }
        }
    }

    vec3 V = normalize(-vPosition);
    vec3 R = reflect(-L, N);

    float diff = max(dot(N, L), 0.0f);
    float spec = pow(max(dot(V, R), 0.0f), mat.specularExp);

    return fatt * intensity * color * vec3(mat.kd * diff + mat.ks * spec);
}

void main() {
    // ambient only calcuated once
    vec3 totalColor = ambient();

    // TODO light culling? per object might be good considering
    // the hw5 scene causing issues with all the individual 
    // plank objects in the rails... 
    // Although chunking the scenes might be more reasonable but annoying to make idk...
    for(int i = 0; i < uLightCount; i++) {
        vec3 position = positionType[i].xyz;
        int type = int(positionType[i].w);

        vec3 color = colorIntensity[i].rgb;
        float intensity = colorIntensity[i].w;

        vec3 attenuation = attenuationCutoff[i].xyz;
        float cutoff = attenuationCutoff[i].w;

        vec3 direction = directionExponent[i].xyz;
        float spotExponent = directionExponent[i].w;

        totalColor += phongShading(position, color, direction, attenuation, intensity, cutoff, spotExponent, type);
    }

    fragColor = vec4(totalColor, mat.alpha);
}