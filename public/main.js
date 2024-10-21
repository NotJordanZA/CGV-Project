import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config } from './level3.js';

// Set up the canvas and renderer
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();

var aspect = WIDTH / HEIGHT;
var d = 40; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Position the camera for an isometric view (45 degrees)
camera.position.set(40, 40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)

// Level Configurations
let currentLevel = 0; // Start at level 0
const levels = [level1Config, level2Config, level3Config];
let initialCubePosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
let atChest = false;

const vignette = document.getElementById('vignette');
const gameOverMessage = document.getElementById('game-over-message');


// Update the vignette intensity based on darknessTimeout
function updateVignetteIntensity(intensity) {
    vignette.style.opacity = intensity; // Set opacity between 0 and 1
}

function showGameOverScreen() {
    gameOverMessage.style.opacity = 1; // Fade in the "You Died" message
}

function resetLevel() {
    // Reset cube position
    cube.position.copy(initialCubePosition);
    
    // Reset camera position
    camera.position.copy(initialCameraPosition);
    camera.lookAt(0, 0, 0);  // Make sure camera is looking at the correct point
    flashTimeout = 5000;
    bounceTimeout = 100;
    darknessTimeout = 100;
    gameOverMessage.style.opacity = 0;

    // Reset vignette opacity to 0 (no vignette)
    vignette.style.opacity = 0;

    // Optional: Reset any other elements such as lights, textures, etc.
    setupLevel(currentLevel); // Reapply the level configurations
    console.log("Level reset to its original configuration.");
}

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];
    // Load the ground texture for this level
    const textureLoader = new THREE.TextureLoader();
    const diffuseTexture = textureLoader.load(levelConfig.groundTexture, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
    });

    const heightTexture = textureLoader.load(levelConfig.groundHeight, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });
    const normalTexture = textureLoader.load(levelConfig.groundNormal, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });
    const specularTexture = textureLoader.load(levelConfig.groundSpecular, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });

    // Update the plane material for this level
    planeMaterial.map = diffuseTexture;
    planeMaterial.normalMap = normalTexture;
    planeMaterial.displacementMap = heightTexture;
    planeMaterial.specularMap = specularTexture;
    planeMaterial.displacementScale = 4;
    planeMaterial.needsUpdate = true;

    // Update the cube color for this level
    cube.material.color.setHex(levelConfig.cubeColor);

    // Update flashlight color and power for this level
    flashLight.color.setHex(levelConfig.flashLightColor);
    flashLightBounce.color.setHex(levelConfig.flashLightBounceColor);
    flashLight.intensity = levelConfig.flashLightPower;
}

// Function to move to the specified level
function goToLevel(level) {
    if (level >= 0 && level < levels.length) {
        currentLevel = level;
        setupLevel(currentLevel);
        cube.position.set(0, 0, 0); // Reset the cube position for the new level
        camera.position.set(40, 40, 40); // Reset the camera position
    }
}

// Ground (Plane) setup
var planeGeometry = new THREE.PlaneGeometry(100, 100, 150, 150);
var planeMaterial = new THREE.MeshPhongMaterial();
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true; // This will receive the shadows
if (currentLevel !== 0){
    scene.add(plane);
}

let infernoMap;
let infernoChests;
let infernoWalls;
let infernoWallsBoundingBox;

// 127,15,733
// 336,15,230
// 435,15,-172
// -672,15,-134
// -375,15,336
var floorBoundingBox = new THREE.Box3();
if (currentLevel == 0) {
    scene.background = new THREE.Color( 0x000000 );
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./assets/inferno/cgv-inferno-map-baked-mesh.glb', (gltf) => {
        // Add the loaded infernoMap to the scene
        infernoMap = gltf.scene;
        
        // Position the infernoMap to the right of the plane
        infernoMap.rotation.y = -Math.PI / 2;
        infernoMap.scale.set(50,50,50);
        infernoMap.position.set(0, -10, 0); // Adjust the position as needed
        scene.add(infernoMap);
        floorBoundingBox.setFromObject(infernoMap);
    }, undefined, (error) => {
        console.error('An error happened while loading the infernoMap:', error);
    });
    gltfLoader.load('./assets/inferno/cgv-inferno-map-chests-mesh.glb', (gltf) => {
        // Add the loaded infernoMap to the scene
        infernoChests = gltf.scene;
        // Position the infernoMap to the right of the plane
        infernoChests.rotation.y = -Math.PI / 2;
        infernoChests.scale.set(50,50,50);
        infernoChests.position.set(0, -10, 0); // Adjust the position as needed
        scene.add(infernoChests);
    }, undefined, (error) => {
        console.error('An error happened while loading the infernoMap:', error);
    });
    gltfLoader.load('./assets/inferno/cgv-inferno-map-walls.glb', (gltf) => {
        infernoWalls = gltf.scene;
        infernoWalls.rotation.y = -Math.PI / 2;
        infernoWalls.scale.set(50,50,50);
        infernoWalls.position.set(6, -10, 6); // Adjust the position as needed
        infernoWallsBoundingBox = new THREE.Box3().setFromObject(infernoWalls);
    }, undefined, (error) => {
        console.error('An error happened while loading the infernoMap:', error);
    });
    var chestLight1 = new THREE.PointLight(0xf76628, 1000);
    chestLight1.position.set(127,15,-733);
    var chestLight2 = new THREE.PointLight(0xf76628, 1000);
    chestLight2.position.set(336,15,230);
    var chestLight3 = new THREE.PointLight(0xf76628, 1000);
    chestLight3.position.set(435,15,-172);d
    var chestLight4 = new THREE.PointLight(0xf76628, 1000);
    chestLight4.position.set(-672,15,-134);
    var chestLight5 = new THREE.PointLight(0xf76628, 1000);
    chestLight5.position.set(-375,15,315);
    scene.add(chestLight1);
    scene.add(chestLight2);
    scene.add(chestLight3);
    scene.add(chestLight4);
    scene.add(chestLight5);
}

// Cube setup
var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
scene.add(cube);

// Flashlight setupas
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

var flashTimeout = 5000;
var bounceTimeout = 100;

var flashLight = new THREE.SpotLight(0xffe394, 5000, 0, Math.PI / 4, 1, 2);
flashLight.position.set(0, 0, 0); // Position it at the cube's location
var flashLightBounce = new THREE.PointLight(0xffe394, 100);
flashLightBounce.position.set(0, 0, 0);
flashLight.add(flashLightBounce);
flashHolder.add(flashLight);

var flashLightTarget = new THREE.Object3D();
scene.add(flashLightTarget);
flashLight.target = flashLightTarget;

cube.add(flashHolder); // Attach it to the cube

// Movement and control variables
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.75;
var flashLightDistance = 10;

let previousMouseX = window.innerWidth / 2; // Start in the middle
let angle = -45;
const rotationSpeed = 0.006; // Speed of arc rotation

window.addEventListener('mousemove', function(event) {
    // Calculate the horizontal mouse movement
    const mouseX = event.clientX;
    const wrappedMouseX = (mouseX + window.innerWidth) % window.innerWidth;
    const deltaX = wrappedMouseX - previousMouseX;
    previousMouseX = wrappedMouseX;

    // Adjust the angle based on mouse movement
    angle += deltaX * rotationSpeed;

    // Update the flashHolder position based on the new angle
    flashHolder.position.x = flashLightDistance * Math.cos(angle);
    flashHolder.position.z = flashLightDistance * Math.sin(angle);
    flashHolder.position.y = 2; // Keep the y-position constant or modify as needed

    flashLightTarget.position.x = cube.position.x + 10*flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = cube.position.z +10*flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;
});

var darknessTimeout = 100;
window.addEventListener('keydown', function(event) {
    switch(event.key) {
        case '1': goToLevel(0); break; // Move to Level 1
        case '2': goToLevel(1); break; // Move to Level 2
        case '3': goToLevel(2); break; // Move to Level 3
        case 'w': moveForward = true; break;
        case 's': moveBackward = true; break;
        case 'a': moveLeft = true; break;
        case 'd': moveRight = true; break;
        case 'p': console.log(cube.position); break;
        case 'l': flashTimeout = 5000; bounceTimeout = 100; break;
        case 'r': resetLevel(); break;
        case 'x': flashTimeout = 99; darknessTimeout=10; break;
    }
});

window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': moveForward = false; break;
        case 's': moveBackward = false; break;
        case 'a': moveLeft = false; break;
        case 'd': moveRight = false; break;
    }
});

var cubeBoundingBox = new THREE.Box3().setFromObject(cube);
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];

// Update bounding boxes in the render loop
function updateBoundingBoxes() {
    // Update player's bounding box
    cubeBoundingBox.setFromObject(cube);

    if (infernoChests && chestsBoundingBoxes.length < 1000) {
        infernoChests.traverse((child) => {
            if (child.isMesh) {
                const chestBoundingBox = new THREE.Box3().setFromObject(child);
                chestsBoundingBoxes.push(chestBoundingBox);
            }
        });
    }

    if (infernoWalls && wallsBoundingBoxes.length < 5000) {
        infernoWalls.traverse((child) => {
            if (child.isMesh) {
                const wallBoundingBox = new THREE.Box3().setFromObject(child);
                wallsBoundingBoxes.push(wallBoundingBox);
            }
        });
    }
}
// Check for collision with the chests
function checkChestCollisions() {  
    for (let i = 0; i < chestsBoundingBoxes.length; i++) {
        if (cubeBoundingBox.intersectsBox(chestsBoundingBoxes[i])) {
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            if(x<=30 && x>=-30 && z<=30 && z>=-30){
                return false;
            }
            flashTimeout = 5000;
            bounceTimeout = 100;
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Check for collision with the invisible walls
function checkInvisibleWallsCollisions() {
    for(let i = 0; i< wallsBoundingBoxes.length; i++){
        if (cubeBoundingBox.intersectsBox(wallsBoundingBoxes[i])) {
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            if(x<=30 && x>=-30 && z<=30 && z>=-30){
                return false;
            }
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function handleCollisions(direction) {
    // Store the current position
    const oldCubePosition = cube.position.clone();
    const oldCameraPosition = camera.position.clone();

    // Try moving the player in the specified direction
    if (direction === 'forward') {
        cube.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } else if (direction === 'backward') {
        cube.position.z += moveSpeed;
        camera.position.z += moveSpeed;
    } else if (direction === 'left') {
        cube.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
    } else if (direction === 'right') {
        cube.position.x += moveSpeed;
        camera.position.x += moveSpeed;
    }

    // Update the bounding box after the attempted movement
    cubeBoundingBox.setFromObject(cube);

    // Check if the player has collided with the floor or a chest
    // if (!floorBoundingBox.intersectsBox(cubeBoundingBox) || checkChestCollisions()) {
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        // If collided, revert to the previous position
        console.log("I ams stuck");
        cube.position.copy(oldCubePosition);
        camera.position.copy(oldCameraPosition);
    }
}

function updatePlayerPosition() {
    if (moveForward) {
        handleCollisions('forward');
    }
    if (moveBackward) {
        handleCollisions('backward');
    }
    if (moveLeft) {
        handleCollisions('left');
    }
    if (moveRight) {
        handleCollisions('right');
    }
}

// Update resolution on window resize
window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
});

var flickerTimeout = 0;
var resetLevelTimeout = 10;

function render() {
    updatePlayerPosition();
    updateBoundingBoxes();
    if (flashTimeout > 100) {
        darknessTimeout = 100;
        if (flickerTimeout === 0 && Math.random() < 0.006){
            flickerTimeout = 30;
        }
        flashTimeout -= 0.9;
        bounceTimeout -= 0.00018;
    }else{
        darknessTimeout -= 0.1;
    }
    if (flickerTimeout > 0){
        flickerTimeout -= 1;
        switch (flickerTimeout){
            case 25:
                flashLight.intensity = 5000;
                flashLightBounce.intensity = 100;
            break;
            case 15:
                flashLight.intensity = 1;
                flashLightBounce.intensity = 1;
            break;
            case 5:
                flashLight.intensity = 5000;
                flashLightBounce.intensity = 100;
            break;
            case 1:
                flashLight.intensity = 1;
                flashLightBounce.intensity = 1;
            break;
        }
    }
    else {
        flashLight.intensity = flashTimeout;
        flashLightBounce.intensity = bounceTimeout;
    }


    if (darknessTimeout <= 0) {
        showGameOverScreen();
        flashTimeout = 0;
        bounceTimeout = 0;
        resetLevelTimeout -= 0.03;
    }

    if(resetLevelTimeout <= 0){
        resetLevelTimeout = 10;
        resetLevel();
    }
    const vignetteIntensity = THREE.MathUtils.clamp(1 - (darknessTimeout / 100), 0, 1);
    updateVignetteIntensity(vignetteIntensity);

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);
render();
