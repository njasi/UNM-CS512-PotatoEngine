#version 300 es
precision mediump float;
#define MAX_LIGHTS 64

in vec3 vColor;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vTangent;
in vec2 vTexCoord;

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

Material mat;
// uniform Material mat;

uniform sampler2D uAlbedoMap;
uniform bool uUseAlbedoMap;

uniform sampler2D uBumpMap;
uniform bool uUseBumpMap;
uniform float uBumpScale;

uniform sampler2D uNormalMap;
uniform bool uUseNormalMap;
uniform float uNormalScale;

// TODO displacement map would be great for the toon water
uniform sampler2D uDisplacementMap;
uniform bool uUseDisplacementMap;
uniform float uDisplacementU;
uniform float uDisplacementV;

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
uniform uint uLightMask[4];

// test if a light is enabled in the bitmap
bool isLightEnabled(int i) {
    uint word = uLightMask[i / 32];
    uint bit = 1u << uint(i % 32);

    return (word & bit) != 0u;
}

// convert RGB to luminance (Rec._601 standard, https://en.wikipedia.org/wiki/Rec._601)
// or you can use a height map texture
float height(vec2 uv) {
    vec3 c = texture(uBumpMap, uv).rgb;
    return 1.f - dot(c, vec3(0.299f, 0.587f, 0.114f));
}

// steal the normal shading from the provided hw6 source
vec3 getShadingNormal() {
    vec3 N = normalize(vNormal);

    // if there is no normal/bump make sure we use the surface normal directly
    // important that this does not get multiplied against TBN like the others
    // was why things looked wonkyy
    if(!uUseNormalMap && !uUseBumpMap) {
        return N;
    }

    vec3 T = normalize(vTangent - dot(vTangent, N) * N);
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    vec3 n = vec3(0.0f, 0.0f, 1.0f);

    if(uUseNormalMap) {
        // Normal mapping: the texture stores the tangent-space normal in [0, 1]
        n = texture(uNormalMap, vTexCoord).rgb * 2.0f - 1.0f;
        n.xy *= uNormalScale;
    }

    if(uUseBumpMap) {
        // Bump mapping: tilt the normal against the gradient of the height field
        vec2 du = vec2(1.0f / float(textureSize(uBumpMap, 0).x), 0.0f);
        vec2 dv = vec2(0.0f, 1.0f / float(textureSize(uBumpMap, 0).y));

        float dhdu = (height(vTexCoord + du) -
            height(vTexCoord - du)) * 0.5f;
        float dhdv = (height(vTexCoord + dv) -
            height(vTexCoord - dv)) * 0.5f;

        n = vec3(-uBumpScale * dhdu, -uBumpScale * dhdv, 1.0f);
    }

    return normalize(TBN * normalize(n));
}

// given the Light source, calculate the contribution
// ambient light has 
vec3 ambient(vec3 baseColor) {
    return mat.ka * baseColor;
}

// calculate the overall phong lighting value for one light
vec3 phongShading(
    vec3 N,
    vec3 baseColor,
    vec3 position,
    vec3 color,
    vec3 direction,
    vec3 attenuation,
    float intensity,
    float cutoff,
    float spotExponent,
    int type
) {
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

    return fatt * intensity * color * vec3(mat.kd * baseColor * diff + mat.ks * spec);
}

void main() {
    mat.ka = vec3(0.2f, 0.2f, 0.2f);
    mat.kd = vec3(0.8f, 0.8f, 0.8f);
    mat.ks = vec3(0.f, 0.f, 0.f);
    mat.specularExp = 1.0f;
    mat.alpha = 1.0f;

    vec4 texel = uUseAlbedoMap ? texture(uAlbedoMap, vTexCoord) : vec4(1.0f);

    vec3 baseColor = vColor * texel.rgb;
    vec3 N = getShadingNormal();

    // ambient only calcuated once
    vec3 totalColor = ambient(baseColor);

    // NOTE: per object light culling, not needed if low number of lights
    //       probably add a bool to disable it somewhere by default...
    for(int i = 0; i < uLightCount && i < MAX_LIGHTS; ++i) {
        if(!isLightEnabled(i)) {
            continue;
        }

        vec3 position = positionType[i].xyz;
        int type = int(positionType[i].w);

        vec3 color = colorIntensity[i].rgb;
        float intensity = colorIntensity[i].w;

        vec3 attenuation = attenuationCutoff[i].xyz;
        float cutoff = attenuationCutoff[i].w;

        vec3 direction = directionExponent[i].xyz;
        float spotExponent = directionExponent[i].w;

        totalColor += phongShading(N, baseColor, position, color, direction, attenuation, intensity, cutoff, spotExponent, type);
    }

    fragColor = vec4(totalColor, mat.alpha);
}
