// import * as THREE from 'three';

// // Level 3 configuration with ambient lighting and improved snowy look
// export const level3Config = {
//     levelNumber: 3,
//     groundTexture: './assets/level3/snowdiff.png',
//     groundNormal: './assets/level3/snownormal.png',
//     groundHeight: './assets/level3/snowheight.png',
//     groundSpecular: './assets/level3/snowspec.png',
//     cubeColor: 0xADD8E6, // Light blue cube
//     flashLightColor: 0xFFFFFF,  // White flashlight
//     flashLightBounceColor: 0xFFFFFF,  // White light bounce
//     flashLightPower: 10000,
//     ambientLightColor: 0xE0FFFF, // Soft cyan ambient light
//     ambientLightIntensity: 1.0,  // Moderate intensity
// };

// // Function to apply the lighting and setup for Level 3
// export function applyLevel3Lighting(scene) {
//     const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5); // Brighter light
//     scene.add(ambientLight);

//     const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0); // Increase intensity
//     directionalLight.position.set(10, 20, 10);
//     scene.add(directionalLight);
// }


// // Ground setup with snowy/cloud-like material
// export function setupLevel3Ground(scene) {
//     const textureLoader = new THREE.TextureLoader();

//     // Load textures
//     const diffuseTexture = textureLoader.load(level3Config.groundTexture);
//     const normalTexture = textureLoader.load(level3Config.groundNormal);
//     const heightTexture = textureLoader.load(level3Config.groundHeight);
//     const specularTexture = textureLoader.load(level3Config.groundSpecular);

//     // Configure the ground material
//     const groundMaterial = new THREE.MeshStandardMaterial({
//         map: diffuseTexture,
//         normalMap: normalTexture,
//         displacementMap: heightTexture,
//         displacementScale: 0.1, // Slight height variation for softness
//         specularMap: specularTexture,
//         color: 0xFFFFFF, // Tint to make the ground appear whiter
//         roughness: 0.4,  // Softer surface for cloud-like effect
//         metalness: 0.2,  // Low reflectivity
//     });

//     // Set texture wrapping and tiling
//     [diffuseTexture, normalTexture, heightTexture, specularTexture].forEach((texture) => {
//         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//         texture.repeat.set(9, 9); // More tiles for finer detail
//     });

//     // Create and position the ground mesh
//     const groundGeometry = new THREE.PlaneGeometry(100, 100, 256, 256);
//     const ground = new THREE.Mesh(groundGeometry, groundMaterial);
//     ground.rotation.x = -Math.PI / 2; // Lay flat on the ground
//     ground.position.y = -10; // Adjust height as needed
//     ground.receiveShadow = true;

//     scene.add(ground);
// }




import * as THREE from 'three';

// Level 3 configuration with ambient lighting and improved snowy look
export const level3Config = {
    levelNumber: 3,
    groundTexture: './assets/level3/snowdiff.png',
    groundNormal: './assets/level3/snownormal.png',
    groundHeight: './assets/level3/snowdiff.png',
    groundSpecular: './assets/level3/snowspec.png',
    cubeColor: 0xADD8E6, // Light blue cube
    flashLightColor: 0xFFFFFF,  // White flashlight
    flashLightBounceColor: 0xFFFFFF,  // White light bounce
    flashLightPower: 10000,
    ambientLightColor: 0xE0FFFF, // Soft cyan ambient light
    ambientLightIntensity: 0.5,  // Moderate intensity
};

// Function to apply the lighting and setup for Level 3
export function applyLevel3Lighting(scene) {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    directionalLight.position.set(50, 100, 100);
    scene.add(ambientLight, directionalLight);

}


// Ground setup with snowy/cloud-like material
export function setupLevel3Ground(scene) {
    const textureLoader = new THREE.TextureLoader();

    // Load textures
    const diffuseTexture = textureLoader.load(level3Config.groundTexture);
    const normalTexture = textureLoader.load(level3Config.groundNormal);
    const heightTexture = textureLoader.load(level3Config.groundHeight);
    const specularTexture = textureLoader.load(level3Config.groundSpecular);

    // Configure the ground material
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: diffuseTexture,
        normalMap: normalTexture,
        displacementMap: heightTexture,
        displacementScale: 0.1, // Slight height variation for softness
        specularMap: specularTexture,
        color: 0x333333, // Tint to make the ground appear whiter
        roughness: 0.1,  // Softer surface for cloud-like effect
        metalness: 0.8,  // Low reflectivity
    });

    // Set texture wrapping and tiling
    [diffuseTexture, normalTexture, heightTexture, specularTexture].forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(9, 9); // More tiles for finer detail
    });

    // Create and position the ground mesh
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 256, 256);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Lay flat on the ground
    ground.position.y = -10; // Adjust height as needed
    ground.receiveShadow = true;

    scene.add(ground);
}