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
var d = 50; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Position the camera for an isometric view (45 degrees)
camera.position.set(40, 40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)

// Level Configurations
let currentLevel = 0; // Start at level 0
const levels = [level1Config, level2Config, level3Config];

let atChest = false;

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
scene.add(plane);

let model;

if (currentLevel == 0) {
    const gltfLoader = new GLTFLoader();
    var manager = new THREE.LoadingManager();
    gltfLoader.load('./assets/inferno/cgv-inferno-map.glb', (gltf) => {
        // Add the loaded model to the scene
        model = gltf.scene;
        
        // Position the model to the right of the plane
        model.rotation.y = -Math.PI / 2;
        model.scale.set(30,30,30);
        model.position.set(0, -10, 0); // Adjust the position as needed
        scene.add(model);
    }, undefined, (error) => {
        console.error('An error happened while loading the model:', error);
    });
}

// Cube setup
var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
scene.add(cube);

// Flashlight setup
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

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

window.addEventListener('mousemove', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    let intersects;
    if (currentLevel > 0){
        intersects = raycaster.intersectObject(plane);
    }
    else {
        intersects = raycaster.intersectObject(model);
    }
    
    
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

// 261,0,-100
// 78,0,-440
// 200,0,136
// -225,0,200
// -400,0,-77


function checkAtChest() {
    if (currentLevel == 0) {
        var x = cube.position.x;
        var y = cube.position.y;
        var z = cube.position.z;
        if (x >= 240 && x <= 270 && z >= -110 && z <= -90){
            atChest = true;
            console.log(atChest);
        }
        else if (x >= 180 && x <= 210 && z >= 125 && z <= 145){
            atChest = true;
            console.log(atChest);
        }
        else if (x >= 70 && x <= 90 && z >= -440 && z <= -410){
            atChest = true;
            console.log(atChest);
        }
        else if (x >= -235 && x <= -210 && z >= 180 && z <= 215){
            atChest = true;
            console.log(atChest);
        }
        else if (x >= -415 && x <= -390 && z >= -80 && z <= -60){
            atChest = true;
            console.log(atChest);
        }
        else {
            atChest = false;
        }
    }
}

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

function updatePlayerPosition() {
    if (moveForward) {
        cube.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
        checkAtChest();
    } 
    if (moveBackward) {
        cube.position.z += moveSpeed;
        camera.position.z += moveSpeed;
        checkAtChest();
    } 
    if (moveLeft) {
        cube.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
        checkAtChest();
    } 
    if (moveRight) {
        cube.position.x += moveSpeed;
        camera.position.x += moveSpeed;
        checkAtChest();
    }
}

function render() {
    updatePlayerPosition();

    // Check if player moves forward past z = -50 (Next level)
    // if (cube.position.z < -50) {
    //     if (currentLevel < levels.length - 1) {
    //         goToLevel(currentLevel + 1); // Move to the next level
    //     }
    //     cube.position.z = 0; // Reset the cube position
    // }

    // Check if player moves backward past z = 50 (Previous level)
    // if (cube.position.z > 50) {
    //     if (currentLevel > 0) {
    //         goToLevel(currentLevel - 1); // Move to the previous level
    //     }
    //     cube.position.z = 0; // Reset the cube position
    // }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);
render();
