import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config } from './level3.js';

// LEVEL CONFIG
let currentLevel = 0; // Start at level 0
const levelConfig = {
    levelNumber: 1,
    groundTexture: './assets/cobblestone/diffusered.png',
    groundNormal: './assets/cobblestone/normal.png',
    groundHeight: './assets/cobblestone/height.png',
    groundSpecular: './assets/cobblestone/specular.png',
    cubeColor: 0x0095DD,
    flashLightColor: 0xff8a8a,
    flashLightBounceColor: 0xff8a8a,
    flashLightPower: 5000,
};


// CANVAS
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var aspect = WIDTH / HEIGHT;

// RENDERER
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();

// CAMERA SETUP
var d = 40; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Position the camera for an isometric view (45 degrees)
camera.position.set(40, 40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)


// INITIAL POSITIONS
let initialCubePosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);


// DEATH SCREEN DECLARATIONS
const vignette = document.getElementById('vignette');
const gameOverMessage = document.getElementById('game-over-message');

// UPDATE VIGNETTE INTENSITY BASED ON DARKNESS TIMEOUT
function updateVignetteIntensity(intensity) {
    vignette.style.opacity = intensity; // Set opacity between 0 and 1
}

// DISPLAY DEATH MESSAGE
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


// 127,15,733
// 336,15,230
// 435,15,-172
// -672,15,-134
// -375,15,336

// CUBE/CHARACTER SETUP
var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.material.color.setHex(levelConfig.cubeColor);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
// ADD CUBE TO SCENE
scene.add(cube);


// SET BACKGROUND COLOUR
scene.background = new THREE.Color( 0x000000 );

// DECLARE MAP, OBJECTS, AND BOUNDING BOXES
let infernoMap;
let infernoChests;
let infernoWalls;
let infernoWallsBoundingBox;
var floorBoundingBox = new THREE.Box3();
var cubeBoundingBox = new THREE.Box3().setFromObject(cube);
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];

// IMPORT MAP
const gltfLoader = new GLTFLoader();

gltfLoader.load('./assets/inferno/cgv-inferno-map-baked-mesh.glb', (gltf) => {
    // PLACE THE MAP INTO THE SCENE
    infernoMap = gltf.scene;
    infernoMap.rotation.y = -Math.PI / 2;
    infernoMap.scale.set(50,50,50);
    infernoMap.position.set(0, -10, 0); // Adjust the position as needed
    scene.add(infernoMap);
    floorBoundingBox.setFromObject(infernoMap);
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
});

gltfLoader.load('./assets/inferno/cgv-inferno-map-chests-mesh.glb', (gltf) => {
    // PLACE THE CHESTS INTO THE SCENE
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
    // IMPORT DATA ABOUT INVISIBLE WALLS
    infernoWalls = gltf.scene;
    infernoWalls.rotation.y = -Math.PI / 2;
    infernoWalls.scale.set(50,50,50);
    infernoWalls.position.set(6, -10, 6); // Adjust the position as needed
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
});

// DECLARE LIGHTS ABOVE CHESTS
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
// ADD CHEST LIGHTS TO SCENE
scene.add(chestLight1);
scene.add(chestLight2);
scene.add(chestLight3);
scene.add(chestLight4);
scene.add(chestLight5);


// SETUP FLASHLIGHTS
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);
// FLASHLIGHT/DARKNESS TIMEOUTS
var flashTimeout = 5000;
var bounceTimeout = 100;
var darknessTimeout = 100;
var flickerTimeout = 0;
// DECLARE LIGHTS
// Flashlight
var flashLight = new THREE.SpotLight(0xffe394, 5000, 0, Math.PI / 4, 1, 2);
flashLight.position.set(0, 0, 0); // Position it at the cube's location
flashLight.color.setHex(levelConfig.flashLightColor);
flashLight.intensity = levelConfig.flashLightPower;
// Flashlight Bounce
var flashLightBounce = new THREE.PointLight(0xffe394, 100);
flashLightBounce.position.set(0, 0, 0);
flashLightBounce.color.setHex(levelConfig.flashLightBounceColor);
// ADD LIGHTS TO SCENE
flashLight.add(flashLightBounce);
flashHolder.add(flashLight);
// SETUP FLASHLIGHT POINT
var flashLightTarget = new THREE.Object3D();
scene.add(flashLightTarget);
flashLight.target = flashLightTarget;
// ADD FLASHLIGHT TO CUBE
cube.add(flashHolder); // Attach it to the cube


// NDECLARE MOVEMENT/CONTROL VARIABLES
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.75;
var flashLightDistance = 10;


// TIMEOUT AFTER DEATH
var resetLevelTimeout = 10;


// UPDATE BOUNDING BOXES DURING RENDERS
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

    if (infernoWalls) {
        infernoWalls.traverse((child) => {
            if (child.isMesh) {
                const wallBoundingBox = new THREE.Box3().setFromObject(child);
                wallsBoundingBoxes.push(wallBoundingBox);
            }
        });
    }
}


// CHECK FOR COLLISIONS WITH CHESTS
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


// CHECK FOR COLLISIONS WITH (INVISIBLE) WALLS
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


// HANDLE ANY COLLISIONS
function handleCollisions(direction) {
    // STORE CURRENT POSITION
    const oldCubePosition = cube.position.clone();
    const oldCameraPosition = camera.position.clone();

    // ATTEMPT PLAYER MOVEMENT IN DESIRED DIRECTION
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

    // UPDATE BOUNDING BOX AFTER ATTEMPTED MOVEMENT
    cubeBoundingBox.setFromObject(cube);

    // CHECK IF PLAYER COLLIDED WITH CHEST OR WALL
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        // IF COLLIDED, UNDO MOVEMENT (REVERT POSITION)
        console.log("I ams stuck");
        cube.position.copy(oldCubePosition);
        camera.position.copy(oldCameraPosition);
    }
}


// MOVE THE PLAYER
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


// EVENT LISTENER CHECKING FOR MOUSE MOVEMENT
window.addEventListener('mousemove', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    let intersects;

    // CHECK INTERSECTION OF MOUSE WITH MAP MODEL
    intersects = raycaster.intersectObject(infernoMap);
    
    // IF MOUSE ON MAP, MOVE FLASHLIGHT
    if (intersects.length > 0) {
        const point = intersects[0].point;
        flashLightTarget.position.copy(point);

        var dx = point.x - cube.position.x;
        var dz = point.z - cube.position.z;

        var angleRadians = Math.atan2(dz, dx);

        flashHolder.position.x = flashLightDistance * Math.cos(angleRadians);
        flashHolder.position.z = flashLightDistance * Math.sin(angleRadians);
        flashHolder.position.y = 2;
    }
});


// EVENT LISTENER FOR KEY PRESSES
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


// STOP MOVING WHEN KEY NO LONGER PRESSED
window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': moveForward = false; break;
        case 's': moveBackward = false; break;
        case 'a': moveLeft = false; break;
        case 'd': moveRight = false; break;
    }
});


// UPDATE RESOLUTION WHEN WINDOW RESIZES
window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// RENDER FUNCTION, EXPORTED
export default function render() {

    // UPDATE PLAYER'S CURRENT POSITION
    updatePlayerPosition();

    // UPDATE CURRENT BOUNDING BOXES
    updateBoundingBoxes();

    // TIMEOUT FOR FLASHLIGHT DYING
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

    // TIMER FOR FLASHLIGHT FLICKERING
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

    // TIMER FOR PLAYER BEING IN DARKNESS TOO LONG
    if (darknessTimeout <= 0) {
        showGameOverScreen();
        flashTimeout = 0;
        bounceTimeout = 0;
        resetLevelTimeout -= 0.03;
    }

    // RESET THE LEVEL AFTER THE RESET TIMEOUT
    if(resetLevelTimeout <= 0){
        resetLevelTimeout = 10;
        resetLevel();
    }

    // VIGNETTE FOR BEING IN DARKNESS TOO LONG
    const vignetteIntensity = THREE.MathUtils.clamp(1 - (darknessTimeout / 100), 0, 1);
    updateVignetteIntensity(vignetteIntensity);

    // UPDATE FRAME
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

