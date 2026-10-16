# CS 512 Potato Engine
A scene "engine" created during homework 3 in CS512, and planned to be used for the later homeworks as an overall pipeline.

## Features
TODO

## Development

Setup

```sh
npm i
```

Dev Server

```sh
npm run start
```

Production build

```sh
npm run build
```


## TODO
- [ ] shader "ping ponging" for support of multiple shaders per object, consider: s_1 material -> s_2 lighting
    - [ ] should also allow passes for more complicated lighting later if interested
    - [ ] bind basic values to shader uniforms for all shaders like lighting, position, transformation etc
- [ ] object reaping, consider cannon balls far out of range... these should be killed
- [o] standardize object classes & clean up interfaces
- [ ] add handling for mirroring and skewing in gl pipeline.
- [x] implement BVH loader for assignment 4, basic arm, in examples dir is just too boring...
    - https://research.cs.wisc.edu/graphics/Courses/cs-838-1999/Jeff/BVH.html
    - [x] parse bvh file
    - [x] construct skeleton based on the bvh file
    - [x] play bvh animation
        - [x] loop animation