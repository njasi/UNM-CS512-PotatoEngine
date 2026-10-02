#version 300 es

in vec3 aPosition;
in vec3 aColor;

uniform float uTime; // time in sec
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelTransformationMatrix;

// transformation applied to the world ie parent component
uniform mat4 uWorldTransformationMatrix;

// object translation coords, not an actual
// translation matrix
uniform vec3 uPosition; 
uniform vec3 uRotation;
uniform vec3 uScale;

// if rotation should be applied in bvh order
uniform int uBVH;

out vec3 vColor;

// create a 2d scaling matrix
mat3 scaling2D(float xs, float ys){
  return mat3(
    xs , 0.0, 0.0,
    0.0,  ys, 0.0,
    0.0, 0.0, 1.0
  );
}

// create a 3d scaling matrix
mat4 scaling3D(float xs, float ys, float zs){
  return mat4(
    xs , 0.0, 0.0, 0.0,
    0.0,  ys, 0.0, 0.0,
    0.0, 0.0,  zs, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

// create a 2d rotation matrix
mat3 rotate2D(float angle){
  return mat3(
    cos(angle)        , sin(angle), 0.0,
    -1.0 * sin(angle) , cos(angle), 0.0,
    0.0               , 0.0       , 1.0
  );
}

// rotate around the X acs
mat4 rotate3DX(float angle){
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, cos(angle), sin(angle), 0.0,
        0.0, -sin(angle), cos(angle), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// rotate arounf the y axis
mat4 rotate3DY(float angle){
    return mat4(
        cos(angle), 0.0, -sin(angle), 0.0,
        0.0, 1.0, 0.0, 0.0,
        sin(angle), 0.0, cos(angle), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// rotate around the z axis
mat4 rotate3DZ(float angle){
    return mat4(
        cos(angle), sin(angle), 0.0, 0.0,
        -sin(angle), cos(angle), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// include all orders to handle bvh probably a smarter way to do this...
mat4 rotateXYZ(float ax, float ay, float az) {
  return rotate3DZ(az) * rotate3DY(ay) * rotate3DX(ax);
}

mat4 rotateXZY(float ax, float ay, float az) {
  return rotate3DY(ay) * rotate3DZ(az) * rotate3DX(ax);
}

mat4 rotateYXZ(float ax, float ay, float az) {
  return rotate3DZ(az) * rotate3DX(ax) * rotate3DY(ay);
}

mat4 rotateYZX(float ax, float ay, float az) {
  return rotate3DX(ax) * rotate3DZ(az) * rotate3DY(ay);
}

mat4 rotateZXY(float ax, float ay, float az) {
  return rotate3DY(ay) * rotate3DX(ax) * rotate3DZ(az);
}

mat4 rotateZYX(float ax, float ay, float az) {
  return rotate3DX(ax) * rotate3DY(ay) * rotate3DZ(az);
}

// rotate around all axis in default order
mat4 rotate3D(float ax, float ay, float az){
    // TODO could probaby make more efficient by writing out the whole matrix
    //      but tbh thats what the X,Y,Z specific rotations are for anyway
    return rotateXYZ(ax, ay, az);
}

// get rotation matrix based on the rotation order
// order values:
// XYZ: 0
// XZY: 1
// YXZ: 2
// YZX: 3
// ZXY: 4
// ZYX: 5
mat4 getBVHRotation(
  float x,
  float y,
  float z,
  int order
) {
  if(order == 0) {
    return rotateXYZ(x, y, z);
  }
  if(order == 1) {
    return rotateXZY(x, y, z);
  }
  if(order == 2) {
    return rotateYXZ(x, y, z);
  }
  if(order == 3) {
    return rotateYZX(x, y, z);
  }
  if(order == 4) {
    return rotateZXY(x, y, z);
  }

  return rotateZYX(x, y, z);
}


// create a 2d shear matrix
// to shear in only x/y leave the other param = 0
mat3 shear2D(float xs, float ys){
  return mat3(
    1.0, ys , 0.0,
    xs , 1.0, 0.0,
    0.0, 0.0, 1.0
  );
}

// create 3d shear matrix... this one looks kinida annoying to use
// wonder if theres a simpler way...
mat4 shear3d(float xy, float xz, float yx, float yz, float zx, float zy){
    return mat4(
        1.0, yx , zx , 0.0,
        xy , 1.0, zy , 0.0,
        xz , yz , 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// create a 2d mirror matrix
// to mirror across X angle = 1/2 pi rad, 3/2 pi rad etc
// to mirror across Y angle = 0 rad, pi rad etc
mat3 mirror2D(float angle){
  return mat3(
    cos(2.0 * angle), sin(2.0 * angle)        , 0.0,
    sin(2.0 * angle), -1.0 * cos(2.0 * angle) , 0.0,
    0.0             , 0.0                     , 1.0
  );
}

// Mirror along a vector that passes through the origin
// 
// couldnt find mirroring in the slides; shear was simple enough
// to derive but mirroring is more complicated.
// https://en.wikipedia.org/wiki/Transformation_matrix#Reflection
mat4 mirror3D(float lx, float ly, float lz){
  float lx2 = lx*lx;
  float ly2 = ly*ly;
  float lz2 = lz*lz;

  return mat4(
    ly2 + lz2 - lx2, 2.0 * lx * ly  ,  2.0 * lx * lz ,  0,
    2.0 * ly * lx  , lx2 + lz2 - ly2,  2.0 * ly * lz ,  0,
    2.0 * lz * lx  , 2.0 * lz * ly  , lx2 + ly2 - lz2,  0,
    0              , 0              , 0              ,  1

  );
}

// create a 2d translation matrix
mat3 translate2D(float tx, float ty){
  return mat3(
    1.0, 0.0, 0.0 ,
    0.0, 1.0, 0.0 ,
    tx , ty , 1.0
  );
}

// create a 3d transformation matrix
mat4 translate3D(float tx, float ty, float tz){
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0, 
        0.0, 0.0, 1.0, 0.0,
        tx , ty , tz , 1.0
    );
}


void main() {
  mat4 T = translate3D(uPosition.x, uPosition.y, uPosition.z);
  mat4 S = scaling3D(uScale.x, uScale.y, uScale.z);
  mat4 R;
  if(uBVH == 0) {
    R = rotate3D(uRotation.x, uRotation.y, uRotation.z);
  } else {
    R = getBVHRotation(uRotation.x, uRotation.y, uRotation.z, uBVH);
  }

  gl_Position = uProjectionMatrix * uModelViewMatrix * uModelTransformationMatrix * uWorldTransformationMatrix * T * R * S * vec4(aPosition, 1.0f);
  vColor = aColor;
}