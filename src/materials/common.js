import PhongMaterial from "./PhongMaterial";
import { rgb } from "../objects";


/**
 * Given a material cfg return a new material
 * @param {rgb()} baseColor 
 * @returns 
 */
export function generateMaterial(cfg){
    return new PhongMaterial(cfg.ka, cfg.kd, cfg.ks, cfg.specularExp)
}

/**
 * Given a base color generate a metallic like material
 * @param {rgb()} baseColor 
 * @returns 
 */
export function metallic(baseColor){
    // TODO
    return generateMaterial()
}

/**
 * Given a base color generate a plastic like material
 * @param {rgb()} baseColor 
 * @returns 
 */
export function plastic(baseColor){
    // TODO
    return generateMaterial()
}

/**
 * Given a base color generate a glass like material
 * @param {rgb()} baseColor 
 * @returns 
 */
export function glass(baseColor){
    // TODO
    return generateMaterial()
}

/**
 * Given a base color generate a wood like material
 * @param {rgb()} baseColor 
 * @returns 
 */
export function wood(baseColor){
    // TODO
    return generateMaterial()
}


