# CS 512 Potato Engine
A scene "engine" created during homework 3 in CS512, and planned to be used for the later homeworks as an overall pipeline.

## Features
TODO

## Documentation
This repository comes with [docs generated via jsdoc](./docs/index.html)

## Usage 
This repository can be used in another project as a npm module.

```sh
# navigate to your git project
cd project

# add this repository as a submodule
git submodule add https://github.com/njasi/UNM-CS512-PotatoEngine.git PotatoEngine

# setup your npm project if needed
npm init

# add the submodule as a local dependency
npm install ./PotatoEngine

# to update the potato engine submodule copy
git submodule update --remote
```

## Development

Setup

```sh
npm i
```

Dev Server (opens localhost:8080 by default)

```sh
npm run start
```

Production build

```sh
npm run build
```

Update Documentation

```sh
npm run docs
```


## TODO
- [ ] shader "ping ponging" for support of multiple shaders per object, consider: s_1 material -> s_2 lighting
    - [ ] should also allow passes for more complicated lighting later if interested
    - [ ] bind basic values to shader uniforms for all shaders like lighting, position, transformation etc
- [x] object reaping, consider cannon balls far out of range... these should be killed
- [o] standardize object classes & clean up interfaces
- [ ] add handling for mirroring and skewing in gl pipeline.