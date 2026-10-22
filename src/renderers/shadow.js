// TODO pass for shadow? may have to combine 
// with other passes to get working
// think ill need some extra components in the render pass

// Steps:
// - think we have an initial pass using framebuffer to save depth map
// - then generate the shadows in a secondary pass on objects that can receive shadows?
// - this might require a form of texturing