import * as THREE from 'three';

// Level 2 configuration with purgatory environment tones
export const level2Config = {
    levelNumber: 2,
    groundTexture: './assets/river/diffuseRiver.png', // Ensure this texture is desaturated or use a greyish texture
    groundNormal: './assets/river/normalRiver.png',
    groundHeight: './assets/river/heightRiver.png',
    groundSpecular: './assets/river/specularRiver.png',
    cubeColor: 0xC0C0C0, // Use grey for any objects like the cube
    flashLightColor: 0xD3D3D3, // Light grey for the environment
    flashLightBounceColor: 0x808080,
    flashLightPower: 9000, // Stronger power to simulate a bright but desaturated environment
};

// Scene setup
const scene = new THREE.Scene();

// Create ground geometry
const groundGeometry = new THREE.PlaneGeometry(100, 100, 256, 256);

// Load textures
const diffuseTexture = new THREE.TextureLoader().load(level2Config.groundTexture);
const normalTexture = new THREE.TextureLoader().load(level2Config.groundNormal);
const heightTexture = new THREE.TextureLoader().load(level2Config.groundHeight);
const specularTexture = new THREE.TextureLoader().load(level2Config.groundSpecular);

// Create material with maps and greyish settings
const groundMaterial = new THREE.MeshStandardMaterial({
    map: diffuseTexture,
    normalMap: normalTexture,
    displacementMap: heightTexture,
    displacementScale: 0.01, // Smoother surface
    specularMap: specularTexture,
    roughness: 0.6, // Increase roughness to dull the surface, making it feel lifeless
    metalness: 0.5, // Reduce reflectivity for a more neutral, desaturated look
});

// Adjust texture tiling
diffuseTexture.repeat.set(4, 4);
normalTexture.repeat.set(4, 4);
heightTexture.repeat.set(4, 4);
specularTexture.repeat.set(4, 4);

// Desaturate the diffuse texture to remove blue tones (done through material color if texture is unchanged)
groundMaterial.color.setHex(0xD3D3D3); // Override color to make it greyish

// Set texture wrapping
diffuseTexture.wrapS = diffuseTexture.wrapT = THREE.RepeatWrapping;
normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
heightTexture.wrapS = heightTexture.wrapT = THREE.RepeatWrapping;
specularTexture.wrapS = specularTexture.wrapT = THREE.RepeatWrapping;

// Create mesh for the ground
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Lighting setup
const flashLight = new THREE.PointLight(level2Config.flashLightColor, 1, 500);
flashLight.power = level2Config.flashLightPower;
flashLight.position.set(10, 30, 10);
scene.add(flashLight);

