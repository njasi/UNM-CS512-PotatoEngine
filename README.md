# CS 512 Potato Engine
A scene "engine" created during homework 3 in CS512, and planned to be used for the later homeworks as an overall pipeline.

## Features
TODO

## Usage 
This repository can be used in another project as a npm module.

```sh
# navigate to your git project
cd project

# add this repository as a submodule
git submodule add 

# setup npm project if needed
npm init

# add the submodule as a dependency
npm install ./PotatoEngine

# to update the submodule copy
git submodule update --remote
```

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