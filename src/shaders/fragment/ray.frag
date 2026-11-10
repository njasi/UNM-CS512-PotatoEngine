#version 300 es
precision highp float;

#define MAX_MATERIALS 64;
#define MAX_OBJECTS 585; // max possible with this layout, not bad tbh
#define MAX_LIGHTS 585;

uniform float u_time;
uniform vec2 u_resolution;
uniform int u_maxBounces;
uniform float u_ambientStrength; // Ambient fill light for better visual
uniform vec2 u_cameraOrbit;
uniform vec3 u_target; // essentially camera position

out vec4 fragColor;

const float LIGHT_POWER = 3.0f;
const float FLOOR_Y = -2.0f;
const float CHECKER_SIZE = 3.0f;
const float GLASS_IOR = 1.5f;  // refractive index of the glass sphere

/////////////////////
// MATERIAL CONFIG //
/////////////////////

// struct to pack material data into so objects
// dont have to store all of this
struct Material {
  vec4 ka; // w unused
  vec4 kd; // w unused
  vec4 ks; // w unused
  vec4 optics; // specular, refractiveIndex, reflectivity
  // textures? => maybe shove texuture ids into the unused ws?
  // albedo (with transparency), 
  // => this could be an emission map if the object is in the light block
  // normals or bump map?, 
  // specular map?
};

layout(std140) uniform materialBlock {
  Material materials[MAX_MATERIALS]
}

//////////////////
// OBJECT SETUP //
//////////////////


// maybe for convince i should
// be able to unpack an object into structs like these
// so they can be read... if the byte layout is correct
// can probably shove the bytes directly in...

// like a sphere with the layout of an object would look like
// struct Sphere {
//   int type;
//   int material;
//   int _;
//   int _;
//   vec3 center;
//   float radius;
//   vec4 _;
//   mat4 transform
// };

// struct Sphere {
//   vec3 center;
//   float radius;
//   vec3 color;
// };

// struct Cube {
//   vec3 center;
//   float halfSize;
//   vec3 color;
//   float reflectivity;
// };

const int OBJECT_TYPE_SPHERE = 0;
const int OBJECT_TYPE_CUBE = 1;
const int OBJECT_TYPE_CONE = 2;
const int OBJECT_TYPE_TORUS = 3;
const int OBJECT_TYPE_CYLINDER = 4;
const int OBJECT_TYPE_PLANE = 5;

// honestly i could or more information into a 
// single int since object type probably < 10, 
// but we arent that desperate

struct Object {
  ivec4 meta;         // x    => type;    y => material?; z=> ____ ; w => ____ ; 
  vec4 centerRadius;  // xyz  => center;  w => cone, sphere, cyl: r, cube: half-size, torus: R, plane: width
  vec4 options;       // x    => cyl, cone: height, torus:r, plane:depth;     y=> cyl: bulge 
  mat4 transform;     // overall transformation to apply 
};

layout(std140) uniform objectBlock {
  Object objects[MAX_OBJECTS];
};

uniform u_object_count;

///////////////////
// LIGHT CONFIG  //
///////////////////

layout(std140) uniform lightBlock {
  Object lights[MAX_LIGHTS];
};

uniform u_object_count;


// i guess lights are objects in this basic representation?
// maybe use a lightblock of objects, could use the same 
// object array but then you lose information space

// const int LIGHT_POINT = 0;
// const int LIGHT_SPOT = 1;
// const int LIGHT_DIRECTIONAL = 2;

// layout(std140) uniform LightBlock {
//   // x, y, z, type
//   vec4 positionType[MAX_LIGHTS];
//   // r, g, b, intensity
//   vec4 colorIntensity[MAX_LIGHTS];
//   // attA, attB, attC, cutoff
//   vec4 attenuationCutoff[MAX_LIGHTS];
//   // dirX, dirY, dirZ, spotExponent
//   vec4 directionExponent[MAX_LIGHTS];
// };



// uniform int uLightCount;


///////////////////////////
// RAY TRACING STRUCTURE //
///////////////////////////

struct Ray {
  vec3 origin;
  vec3 direction;
};

struct HitData {
  bool hit;
  float t;
  vec3 point;
  vec3 normal;
  vec3 color;
  float reflectivity;
  bool isLight;
  bool isGlass;
};

//////////////////////
// CALCULATION TIME //
//////////////////////

const Sphere lightSphere = Sphere(vec3(4.0f, 3.0f, -4.0f), 0.3f, vec3(1.0f, 1.0f, 0.9f));
Sphere sphere;
Sphere glassSphere;
Cube cube;

void initScene(float time) {
  float a = time * 2.f;
  sphere = Sphere(vec3(cos(a) * 2.5f, sin(a * 1.3f) * 0.8f, -6.0f + sin(a) * 0.5f), 1.0f, vec3(1.0f, 0.3f, 0.3f));

  float b = time * 2.f;
  cube = Cube(vec3(sin(b) * 2.0f, cos(b * 1.5f) + 0.5f, -9.0f + cos(b * 0.7f)), 0.8f, vec3(0.3f, 0.8f, 0.3f), 0.85f);
}

bool intersectSphere(Ray ray, Sphere s, out float t) {
  vec3 oc = ray.origin - s.center;
  float b = dot(oc, ray.direction);
  float d = b * b - dot(oc, oc) + s.radius * s.radius;
  if(d < 0.0f)
    return false;

  t = -b - sqrt(d);
  if(t < 0.001f)
    t = -b + sqrt(d);  // ray starts inside
  return t > 0.001f;
}

// Slab test
bool intersectCube(Ray ray, out float t, out vec3 normal) {
  vec3 t0s = (cube.center - cube.halfSize - ray.origin) / ray.direction;
  vec3 t1s = (cube.center + cube.halfSize - ray.origin) / ray.direction;
  vec3 tmin = min(t0s, t1s);
  vec3 tmax = max(t0s, t1s);
  float t0 = max(max(tmin.x, tmin.y), tmin.z);
  float t1 = min(min(tmax.x, tmax.y), tmax.z);
  if(t1 < 0.0f || t0 > t1)
    return false;

  t = t0 > 0.001f ? t0 : t1;
  if(t < 0.001f)
    return false;

  vec3 local = ray.origin + ray.direction * t - cube.center;
  vec3 a = abs(local);
  if(a.x > a.y && a.x > a.z)
    normal = vec3(sign(local.x), 0.0f, 0.0f);
  else if(a.y > a.z)
    normal = vec3(0.0f, sign(local.y), 0.0f);
  else
    normal = vec3(0.0f, 0.0f, sign(local.z));
  return true;
}

//eta = n1 / n2
//vec3 refraction(vec3 I, vec3 N, float eta) {
//    <!-- insert your code here -->
//}

// Schlick approximation
//float schlick(float cosine, float ref_idx) {
//    <!-- insert your code here -->
//}

bool intersectFloor(Ray ray, out float t) {
  if(abs(ray.direction.y) < 0.0001f)
    return false;
  t = (FLOOR_Y - ray.origin.y) / ray.direction.y;
  return t > 0.001f;
}

HitData traceScene(Ray ray, bool includeLight) {
  HitData hit;
  hit.hit = false;
  hit.t = 1e10f;
  float t;
  vec3 n;

  if(includeLight && intersectSphere(ray, lightSphere, t) && t < hit.t) {
    hit = HitData(true, t, ray.origin + ray.direction * t, vec3(0.0f), lightSphere.color, 0.0f, true, false);
  }

  if(intersectFloor(ray, t) && t < hit.t) {
    vec3 p = ray.origin + ray.direction * t;
    vec2 cell = floor(p.xz / CHECKER_SIZE);
    vec3 color = mod(cell.x + cell.y, 2.0f) < 1.0f ? vec3(1.0f) : vec3(0.05f);
    hit = HitData(true, t, p, vec3(0.0f, 1.0f, 0.0f), color, 0.0f, false, false);
  }

  if(intersectCube(ray, t, n) && t < hit.t) {
    hit = HitData(true, t, ray.origin + ray.direction * t, n, cube.color, cube.reflectivity, false, false);
  }

  if(intersectSphere(ray, sphere, t) && t < hit.t) {
    vec3 p = ray.origin + ray.direction * t;
    hit = HitData(true, t, p, (p - sphere.center) / sphere.radius, sphere.color, 0.0f, false, false);
  }

  return hit;
}

vec3 trace(Ray ray) {
  vec3 color = vec3(0.0f);
  vec3 attenuation = vec3(1.0f);

  // use loop to simulate the recursive process as GLSL doesn't support recursions
  for(int bounce = 0; bounce < u_maxBounces; bounce++) {
    HitData hit = traceScene(ray, true);

    if(!hit.hit) {
      float t = 0.5f * (ray.direction.y + 1.0f);
      color += attenuation * mix(vec3(0.09f, 0.12f, 0.18f), vec3(0.18f, 0.21f, 0.27f), t);  // sky
      break;
    }

    if(hit.isLight) {
      color += attenuation * lightSphere.color * LIGHT_POWER;
      break;
    }

    // Refraction: (option 1)either reflects or refracts the ray, whichever Schlick says is stronger
    // (option 2): finalColor = hit.color * (F * reflectionColor + (1.0 - F) * refractionColor)
    // (option 3): Monte Carlo Sampling (multiple rays per pixel), reflect with probability F (random() < schlick_value), else refract, and average many samples per pixel
    //<!-- if (hit.isGlass) {
    //    <!-- insert your code here -->

    //    vec3 direction;
    //    if (total_internal_reflection || schlick_value > 0.5) {
            //direction = reflection ray
    //        <!-- insert your code here -->
    //    } else {
            //direction = refraction ray
    //        <!-- insert your code here -->
    //    }

    //    ray = Ray(hit.point + direction * 0.001, direction);
    ////Use Schlick approximation to determine contributions from reflection and refraction
    //    attenuation *= hit.color;
    //    continue;
    //}

    vec3 toLight = lightSphere.center - hit.point;
    float lightDist = length(toLight);
    vec3 lightDir = toLight / lightDist;

    HitData blocker = traceScene(Ray(hit.point + hit.normal * 0.001f, lightDir), false);
    float visible = blocker.hit && blocker.t < lightDist ? 0.0f : 1.0f;
    float diff = max(dot(hit.normal, lightDir), 0.0f);
    float falloff = 1.0f / (1.0f + 0.1f * lightDist * lightDist);

    //  (optional) Ambient fill light approximates indirect light we don't trace.
    vec3 shading = hit.color * (LIGHT_POWER * diff * falloff * visible + u_ambientStrength);
    color += attenuation * shading * (1.0f - hit.reflectivity);

    if(hit.reflectivity == 0.0f)
      break;
    attenuation *= hit.reflectivity;
    ray = Ray(hit.point + hit.normal * 0.001f, reflect(ray.direction, hit.normal));
  }

  return color;
}

void main() {
  initScene(u_time);

  // Orbit camera around the scene center
  float cp = cos(u_cameraOrbit.x), sp = sin(u_cameraOrbit.x);
  float cy = cos(u_cameraOrbit.y), sy = sin(u_cameraOrbit.y);
  mat3 rotX = mat3(1.0f, 0.0f, 0.0f, 0.0f, cp, -sp, 0.0f, sp, cp);
  mat3 rotY = mat3(cy, 0.0f, -sy, 0.0f, 1.0f, 0.0f, sy, 0.0f, cy);
  mat3 camera = rotY * rotX;

  vec2 uv = (gl_FragCoord.xy - 0.5f * u_resolution) / u_resolution.y;
  Ray ray = Ray(u_target + camera * vec3(0.0f, 0.0f, 7.0f), camera * normalize(vec3(uv, -1.5f)));

  fragColor = vec4(pow(trace(ray), vec3(1.0f / 2.2f)), 1.0f);  // gamma correction
}